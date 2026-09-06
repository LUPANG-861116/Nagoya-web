# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

和風紙質風格的大阪旅遊儀表板（React 19 + TS + Vite）。內容資料來自另一個 repo
[Osaka-vault](https://github.com/hsjinde/Osaka-vault)（Obsidian markdown），收藏/待辦狀態
存 Cloudflare D1 做跨裝置同步，每日行程可在儀表板上編輯並由 Worker commit 回 vault。

- 主站：https://osaka.19980803.xyz（Cloudflare Pages，自訂網域）
- 備援：https://hsjinde.github.io/Osaka-web/（GitHub Pages，同步部署）
- 產品定位與使用者情境見 `PRODUCT.md`；設計 token（色票、字體、印章風格）見 `DESIGN.md`。
  **凡涉及視覺/樣式的改動，動手前先讀 `DESIGN.md`**，遵循其色票與和風手帳風格定義。

## Commands

Frontend（repo root）：
```
npm install
npm run dev          # 先 build:data 再啟動 vite（讀 NOTES_DIR 指向的本機 vault）
npm run build:data   # 只重跑 vault -> src/data/*.json 的轉譯（tsx scripts/build-data.ts）
npm run build        # tsc -b && vite build
npm run lint         # oxlint（不是 ESLint，規則見 .oxlintrc.json）
npm test             # vitest run（scripts/**/*.test.ts + src/**/*.test.{ts,tsx}）
npm run sync:images  # 攻略內文圖片同步到 R2（scripts/sync-guide-images.ts）
```
執行單一測試檔：`npx vitest run src/state/__tests__/store.test.tsx`（或任何路徑）。

Worker（`worker/` 子目錄，**獨立的 npm 專案**，不在 root 的 `npm test` 範圍內）：
```
cd worker
npm test        # vitest run
npm run dev     # wrangler dev
npm run deploy  # wrangler deploy
```

`.env`（repo root，勿提交）欄位見 `.env.example`：`NOTES_DIR`（本機 vault 路徑，預設
`D:\大阪-vault`）、`VITE_API_BASE`（Worker URL，留白則前端純 localStorage 離線模式）、
Cloudflare 部署憑證。

## Architecture

### 資料管線（vault → 網站）

三段：vault markdown → (`build:data` + Zod 驗證) → `src/data/*.json` → Vite build → 靜態網站。

- `scripts/build-data.ts` 是建置入口：讀 `NOTES_DIR` 下的 vault，呼叫 `scripts/lib/parse-*.ts`
  逐一解析，用 `src/data/schema.ts` 的 Zod schema 驗證後寫出 JSON 到 `src/data/`。
  任一必要來源解析失敗即 `process.exit(1)`（讓 CI 紅燈），但「別人推薦攻略」是 best-effort，
  單篇失敗只警告不擋建置。
  - 實體（餐廳/景點/購物/交通/住宿/區域）：`vault/wiki/entities/<分類>/*.md`
  - 每日行程：`vault/wiki/dashboard/每日行程.md`（格式：`## Day N｜日期｜主題` + `- 時段｜標題｜備註`）
  - 總覽卡（出發/回程日期等）：`vault/wiki/dashboard/總覽.md` 的 `## 基本資訊` / `## 交通備註`
  - 待辦：`vault/Osaka Trip/2026-09-30-osaka-confirmed-itinerary.md` 的 `## ✅ 待辦`
  - 攻略：`vault/原始資料/別人行程/*.md`，內文圖片經 `scripts/lib/guide-images.ts`
    改寫成 R2 公開網址（`R2_PUBLIC_URL_PREFIX`，預設 `img.19980803.xyz`）
- `src/data/index.ts` 把建置產出的 JSON 轉型匯出（`entities`/`days`/`todos`/`overview`/`meta`/`guides`），
  是應用程式讀資料的唯一入口，元件不直接 import JSON。
- **這些 JSON 是產物，不是原始碼**：改資料內容要去改 Osaka-vault 那個 repo（或用下面的行程編輯回寫），
  不是改這裡的 `.json`。

### 行程編輯回寫（網站 → vault，唯一的反向路徑）

每日行程可在儀表板上編輯（`DailyPlan` 頁），流程：

1. `src/state/itinerary.tsx` 的 `ItineraryProvider` 管編輯狀態，變更即存 localStorage override
   （`osaka-itinerary-override`，記錄 `baseBuiltAt`）。override 只在其 `baseBuiltAt` 不早於
   目前 `meta.builtAt` 時採用——CI 重建後產生新 `builtAt`，舊 override 自動失效丟棄。
2. `save()` 用 `src/lib/itinerary-md.ts` 的 `serializeDays` 把狀態序列化回 markdown，
   經 `src/api/itinerary.ts` 的 `putItinerary` 打 `PUT /api/itinerary`。
3. Worker 透過 GitHub Contents API 把 `每日行程.md` 的 `## Day` 區塊整段換掉
   （保留第一個 `## Day` 前的前言），commit 回 Osaka-vault。GitHub sha 衝突回 409，
   前端顯示「檔案已在他處變更」。
4. vault 的 push 觸發 `repository_dispatch: vault-updated` → 本 repo 重新 build → 新資料上線。

### 狀態同步（收藏/待辦）

`src/state/store.tsx` 的 `TripStateProvider`（`useTripState` hook）是收藏/待辦唯一狀態來源。
本地永遠先寫 `localStorage`，若 `configured()`（有 `VITE_API_BASE` 且有 token）才同步到 Worker：

- 啟動與「切回前景且距上次同步 ≥15 秒」都會 `syncRemote`：先 `flushQueue()` 補送離線佇列，
  再 `fetchState()` 拉遠端、與本地 merge（遠端優先）
- 沒有 token＝唯讀模式（能看不能改，仍可看到別人同步的資料）；有 token 但 Worker 打不通＝
  離線模式，變更寫入 `queuePut`，之後自動補送
- `src/api/state.ts` 封裝所有 HTTP 呼叫

### 登入/權限

共用密碼制：`POST /api/login` 用密碼（Worker secret `DASH_PASSWORD`）換寫入 token
（即 `DASH_TOKEN`），存 localStorage。`src/state/auth.tsx` 的 `AuthProvider` 提供
`canEdit`（有 API base 且有 token），登入/登出都以 `location.reload()` 收尾讓 store 重新同步。
UI 入口是 `LoginModal`。另外 `?setup=<token>` URL 參數可一鍵完成新裝置同步設定
（`consumeSetupToken`），設定連結由 `setupLink()` 產生。

### Worker（`worker/src/index.ts`，Hono + D1）

- 單一資料表 `state(key, value, updated_at)`（schema 見 `worker/schema.sql`）。
- 路由：`GET /api/state` 與 `POST /api/login` 免驗證，其餘（`PUT /api/state/:key`、
  `PUT /api/itinerary`）要求 `Authorization: Bearer <DASH_TOKEN>`。
- CORS 白名單寫死在程式碼裡（`osaka.19980803.xyz` / `hsjinde.github.io` / `localhost:5173`）。
- 綁定與設定（`worker/wrangler.toml`）：D1 綁定名 `DB`（database 名 `osaka-trip`）；
  `[vars]` 有 `GH_OWNER`/`GH_REPO`/`GH_BRANCH`/`GH_ITINERARY_PATH`（回寫目標）。
- **Worker secrets（存在 Cloudflare、本機取不到**，用 `wrangler secret put` 設定）：
  - `DASH_TOKEN`：寫入 API 的 Bearer token
  - `DASH_PASSWORD`：登入用共用密碼
  - `GITHUB_TOKEN`：回寫 Osaka-vault 用的 GitHub token（需 Osaka-vault contents 寫入權限）

### 部署（`.github/workflows/deploy.yml`）

push 到 main 或收到 Osaka-vault 發來的 `repository_dispatch: vault-updated` 都會觸發，
兩個平行的部署目標：

- `build` + `deploy`：checkout 本 repo + Osaka-vault 到 `vault/` → `build:data`（`NOTES_DIR=vault`）
  → `build` → GitHub Pages
- `deploy-cf-pages`：同上但多跑 `sync:images`（攻略圖片上 R2），build 時設 `VITE_CF_PAGES=1`，
  用 wrangler `pages deploy dist --project-name osaka` 部署到 Cloudflare Pages

`vite.config.ts` 的 `base` 依 `VITE_CF_PAGES` 切換 `/`（Cloudflare Pages）或
`/Osaka-web/`（GitHub Pages）。

**GitHub Actions 憑證**（repo `hsjinde/Osaka-web` → Settings → Secrets and variables → Actions），
**本機取不到**，只在 workflow 執行時注入：
- Secrets：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`（`deploy-cf-pages` 的
  `sync:images` 與 `pages deploy` 都用）
- Variables：`VITE_API_BASE`（build 時注入前端）
- 本機要跑 `sync:images` 需 `.env` 有自己的 `CLOUDFLARE_API_TOKEN`（該 token 要有 R2 寫入權限）；
  R2 bucket 名稱目前吃程式預設值（未設 `CLOUDFLARE_R2_BUCKET_NAME`）。

### 頁面/元件

`src/App.tsx` 用 `location.hash` 做無 router 的分頁切換，分頁定義在 `src/lib/tabs.ts`
（`TABS`/`TabKey`），`PAGES` map 對應 `src/pages/*.tsx`。共用小元件在 `src/components/`
（`Chip`、`Heart`、`MapLink`、`Stamp`、`WishList`、`MarkdownBody`、`EntityPicker`、
`LoginModal` 等）。`src/lib/maps.ts` 處理地圖連結產生邏輯。

## Notes

- 測試框架是 Vitest（不是 Jest），元件測試用 `@testing-library/react` + `jsdom`。
- 專案內有 `.claude/skills/cloudflare-use` 技能，操作 D1 / R2 前應該優先使用它；
  幫實體找圖、嵌圖用 `entity-images` 技能。

## 偏好

- 與使用者溝通一律使用**繁體中文**（程式碼、識別字、檔名維持原文）。
