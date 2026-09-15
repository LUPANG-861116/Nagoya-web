import { useState } from 'react';
import { countdownDays } from '../lib/countdown';
import { days, entities, meta } from '../data';
import { useTripState } from '../state/store';
import WishList from '../components/WishList';
import JourneyRouteMap from '../components/JourneyRouteMap';
import PolaroidFrame from '../components/PolaroidFrame';
import FoodCircleAvatar from '../components/FoodCircleAvatar';
import JournalChecklist from '../components/JournalChecklist';
import WashiTape from '../components/WashiTape';
import ImageLightboxModal from '../components/ImageLightboxModal';

const DAY_QUICK_HIGHLIGHTS: { short: string; tags: string[]; isHighlight?: boolean }[] = [
  { short: '抵達名驛・手羽先宵夜', tags: ['JX838', 'μ-SKY 28分', '世界的山將'] },
  { short: '白川鄉合掌村 ➔ 直奔松本', tags: ['世界遺產', '直達巴士', '松本宿'] },
  { short: '國寶松本城・整備寄行李', tags: ['黑色烏城', '草間彌生', '黑貓寄大行李'] },
  { short: '【表銀座D1】合戰西瓜 ➔ 燕岳 2763m', tags: ['中房起登', '燕山莊宿', '6.5h'], isHighlight: true },
  { short: '【表銀座D2】大天井 ➔ 登頂天槍 3180m', tags: ['東鎌天梯', '槍岳山莊宿', '7.5h'], isHighlight: true },
  { short: '【表銀座D3】大切戶刃脊 ➔ 穗高山莊', tags: ['極限斷崖', '北穗高', '6.0h'], isHighlight: true },
  { short: '【表銀座D4】奧穗高 3190m ➔ 平湯溫泉', tags: ['日本第3峰', '上高地', '露天秘湯'], isHighlight: true },
  { short: '乘鞍岳劍峰 3026m ➔ 回名古屋', tags: ['畳平巴士', '平湯瀑布', '領回大行李'], isHighlight: true },
  { short: '【黑部立山D1】扇澤 ➔ 黑部水庫 ➔ 室堂宿', tags: ['KKday專車', '阿爾卑斯', '高原飯店'] },
  { short: '【黑部立山D2】大觀峰纜車 ➔ 回名古屋', tags: ['磅礴洩洪', '立山高原', '味噌煮烏龍'] },
  { short: '吉卜力公園・大倉庫與魔女之谷', tags: ['Linimo磁浮', '龍貓森林', '矢場豬排'] },
  { short: '熱田神宮・蓬萊軒鰻魚飯・榮商圈', tags: ['草薙神劍', '鰻魚飯三吃', '綠洲21夜景'] },
  { short: '名驛最後採買 ➔ 星宇 JX839 返台', tags: ['高島屋', '波音787館', '凱旋歸國'] },
];

const ACCOMMODATION_SCHEDULE: {
  dates: string;
  name: string;
  tag: string;
  note: string;
  isSpecial?: boolean;
}[] = [
  { dates: '9/21', name: '快活CLUB 名古屋站前', tag: '包8小時', note: '網咖個室・可平躺淋浴・近名鐵巴士中心' },
  { dates: '9/22-23', name: 'MATSUMOTO CASTLE hostel', tag: '已確認・2晚', note: '松本城堡青旅・9/23寄黑貓大行李', isSpecial: true },
  { dates: '9/24', name: '燕山莊 (H2712m)', tag: '已預約', note: '名物漢堡排・莊主法螺貝・夕陽雲海', isSpecial: true },
  { dates: '9/25', name: '槍岳山莊 (H3080m)', tag: '已預約', note: '天槍頂峰前哨・3000m無光害銀河', isSpecial: true },
  { dates: '9/26', name: '穗高岳山莊 (H2996m)', tag: '已預約', note: '大切戶刃脊突破・白出乘越鞍部', isSpecial: true },
  { dates: '9/27', name: 'Joyful 朴之木 (ジョイフルほおのき)', tag: '已確認', note: '宿儺之湯露天風呂・門口即乘鞍穿梭巴士' },
  { dates: '9/28', name: 'Hostel Wasabi 名古屋站前', tag: '已預約・1098元', note: '太閤通口5分・收黑貓行李・隔晨黑部立山旁', isSpecial: true },
  { dates: '9/29', name: '室堂高原飯店／山莊 (H2450m)', tag: 'KKday全包', note: '日本最高地熱溫泉・會席料理與星空' },
  { dates: '9/30-10/2', name: 'KOKO HOTEL 名古屋榮南', tag: '已預約・3晚8063元', note: '榮商圈・連住免搬・大須/松坂屋/吉卜力', isSpecial: true },
];

const HERO_IMG = `${import.meta.env.BASE_URL}journal-hero-zh.png`;
const DIORAMA_IMG = `${import.meta.env.BASE_URL}nagoya-diorama.jpg`;

export default function Home() {
  const { favCount, favs } = useTripState();
  const [wishOpen, setWishOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; caption: string } | null>(() => {
    const p = new URLSearchParams(window.location.search).get('lightbox');
    if (p === 'hero') return { src: HERO_IMG, caption: '手帳探索指南・手繪行程規劃全覽' };
    if (p === 'diorama') return { src: DIORAMA_IMG, caption: '北阿爾卑斯連峰・山岳微縮立體景' };
    return null;
  });
  const favEntities = entities.filter((e) => favs[`fav:${e.id}`]);
  const cd = countdownDays(meta.tripStart);

  const goToDay = (idx: number) => {
    sessionStorage.setItem('selected_day_idx', String(idx));
    window.location.hash = `plan/day-${idx + 1}`;
  };

  const mustEatFoods = [
    { name: '熱田蓬萊軒', sub: '元祖鰻魚三吃', emoji: '🍱', tag: '百年名店', area: '熱田' },
    { name: '矢場豬排', sub: '鐵板熱氣味噌', emoji: '🥩', tag: '招牌黑豚', area: '榮' },
    { name: '世界的山將', sub: '胡椒辛香手羽先', emoji: '🍗', tag: '宵夜必備', area: '名驛' },
    { name: '合戰小屋', sub: '高山湧水大西瓜', emoji: '🍉', tag: 'H2350m', area: '表銀座' },
    { name: '信州蕎麥麵', sub: '安曇野現磨山葵', emoji: '🍜', tag: '十割手打', area: '松本' },
    { name: '味仙台灣拉麵', sub: '香辣蒜味絞肉', emoji: '🌶️', tag: '元祖始祖', area: '名驛' },
  ];

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 1. 頂部手帳封面橫幅：舒適溫潤和風手帳紙感 */}
      <div className="journal-card" style={{
        background: 'linear-gradient(135deg, #f6f1e6 0%, #fcf9f2 50%, #f2ebe0 100%)',
        color: '#1e332a',
        padding: '32px 28px',
        overflow: 'hidden',
        border: '2px solid rgba(139,115,85,0.22)',
        boxShadow: '0 10px 30px rgba(90, 75, 55, 0.08)',
      }}>
        <WashiTape color="kraft" angle={-1.5} left={-10} top={-6} />
        <WashiTape color="coral" angle={1} right={-10} top={-6} />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
          <div style={{ flex: '1 1 340px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{ background: 'var(--c-brass)', color: '#143228', padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 800, letterSpacing: '.06em' }}>
                EXPEDITION JOURNAL 2026
              </span>
              <span style={{ fontSize: 12, color: 'var(--c-ink-light)', letterSpacing: '.05em', fontWeight: 600 }}>
                中部日本・阿爾卑斯名峰踏查
              </span>
            </div>
            
            <h1 className="serif" style={{ fontSize: 32, margin: '6px 0 8px', letterSpacing: '0.03em', lineHeight: 1.25, color: '#16352b', fontWeight: 900 }}>
              NAGOYA & NORTHERN ALPS
            </h1>
            
            <div className="handwriting" style={{ fontSize: 26, color: '#b45309', marginBottom: 16, fontWeight: 700 }}>
              Explore & Discover ・ 名古屋、合掌村與槍穗名峰縱走手帳
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12.5 }}>
              <div style={{ background: '#ffffff', color: '#2a4237', padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(20,50,40,0.12)', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                📅 <b>出發：</b>09.21 (週一) ~ 10.03 (週六)
              </div>
              <div style={{ background: '#ffffff', color: '#2a4237', padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(20,50,40,0.12)', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                🏔️ <b>最高峰：</b>奧穗高岳 3190m・槍之岳 3180m
              </div>
              <div style={{ background: '#fef3c7', padding: '6px 14px', borderRadius: 8, border: '1px solid #f59e0b', color: '#92400e', fontWeight: 700, boxShadow: '0 2px 6px rgba(245,158,11,0.15)' }}>
                ⏳ <b>倒數：</b>還有 {cd} 天啟程！
              </div>
            </div>
          </div>

          <div style={{ flex: '0 0 auto', display: 'flex', gap: 14, justifyContent: 'center', alignItems: 'center', margin: '0 auto' }}>
            <PolaroidFrame
              src={DIORAMA_IMG}
              caption="北阿爾卑斯連峰"
              tapeColor="kraft"
              angle={-3}
              width={160}
              aspectRatio="4/3"
              onClick={() => setLightboxImage({ src: DIORAMA_IMG, caption: '北阿爾卑斯連峰・山岳微縮立體景' })}
            />
            <PolaroidFrame
              src={HERO_IMG}
              caption="手帳探索指南"
              tapeColor="coral"
              angle={2.5}
              width={160}
              aspectRatio="4/3"
              onClick={() => setLightboxImage({ src: HERO_IMG, caption: '手帳探索指南・手繪行程規劃全覽' })}
            />
          </div>
        </div>
      </div>

      {/* 2. 壯麗遠征全景足跡路線圖 */}
      <JourneyRouteMap activeDay={1} onSelectDay={(d) => goToDay(d - 1)} />

      {/* 3. 三欄式手帳總覽：行程速覽 + 必吃美食徽章 + 裝備清單 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* 欄 1: 13天行程速覽 */}
        <div className="journal-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🗓️</span>
              <span className="serif" style={{ fontSize: 17, fontWeight: 800, color: 'var(--c-pine)' }}>
                13 日縱走行程總覽
              </span>
            </div>
            <button className="btn-plain" style={{ fontSize: 12, color: 'var(--c-terracotta)', fontWeight: 700 }} onClick={() => { location.hash = 'plan'; }}>
              完整時刻表 ➔
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 440, overflowY: 'auto', paddingRight: 4 }}>
            {days.map((d, i) => {
              const info = DAY_QUICK_HIGHLIGHTS[i];
              const isHighlight = info?.isHighlight || (i >= 3 && i <= 7);
              return (
                <div
                  key={d.label}
                  onClick={() => goToDay(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 10,
                    background: isHighlight ? 'rgba(201,150,62,0.08)' : 'rgba(20,50,40,0.03)',
                    border: isHighlight ? '1px solid rgba(201,150,62,0.35)' : '1px solid rgba(20,50,40,0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{
                    background: isHighlight ? 'var(--c-terracotta)' : 'var(--c-pine)',
                    color: '#ffffff',
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 12,
                    whiteSpace: 'nowrap',
                  }}>
                    {d.label}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--c-muted)', whiteSpace: 'nowrap', minWidth: 38 }}>
                    {d.date.split(' ')[0]}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--c-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {info?.short ?? d.theme}
                    </div>
                    {info?.tags && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 2, overflow: 'hidden' }}>
                        {info.tags.map((t, tIdx) => (
                          <span key={tIdx} style={{
                            fontSize: 10,
                            background: 'rgba(20,50,40,0.06)',
                            color: 'var(--c-ink-light)',
                            padding: '1px 5px',
                            borderRadius: 4,
                            whiteSpace: 'nowrap',
                          }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--c-terracotta)', fontWeight: 800, paddingLeft: 4 }}>
                    ➔
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 欄 2: 名古屋必吃圓形美食標籤 (Pin 4 風格) */}
        <div className="journal-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🍱</span>
              <span className="serif" style={{ fontSize: 17, fontWeight: 800, color: 'var(--c-pine)' }}>
                名物必嚐美食推薦
              </span>
              <span className="handwriting" style={{ fontSize: 16, color: 'var(--c-brass-dark)', fontWeight: 700 }}>Must-Try</span>
            </div>
            <button className="btn-plain" style={{ fontSize: 12, color: 'var(--c-terracotta)', fontWeight: 700 }} onClick={() => { location.hash = 'food'; }}>
              美食庫 (12+) ➔
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 4 }}>
            {mustEatFoods.map((f) => (
              <FoodCircleAvatar
                key={f.name}
                name={f.name}
                sub={f.sub}
                emoji={f.emoji}
                tag={f.tag}
                area={f.area}
              />
            ))}
          </div>

          <div style={{
            background: 'rgba(201,150,62,0.08)',
            border: '1px dashed var(--c-brass)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 12,
            color: 'var(--c-ink)',
            marginTop: 'auto',
          }}>
            💡 <b>美食重點：</b>熱田蓬萊軒建議 10:30 先抽整理券；9/24 登合戰尾根合戰小屋必吃冰鎮大西瓜！
          </div>
        </div>

        {/* 欄 3: 裝備與行前備忘清單 (Pin 4 剪貼便籤) */}
        <div>
          <JournalChecklist />
        </div>
      </div>

      {/* 4. 交通與航班・山屋住宿卡 (純淨手帳排版・精簡小字) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* 機票與長途跨縣巴士卡 */}
        <div className="journal-card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <WashiTape color="coral" angle={-1} width={80} top={-10} left={20} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="serif" style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--c-pine)' }}>
                ✈️ 星宇航空 ＆ 跨縣穿山巴士
              </span>
            </div>
            <span style={{ fontSize: 10.5, background: 'rgba(59,109,79,0.12)', color: 'var(--c-pine)', padding: '1.5px 7px', borderRadius: 10, fontWeight: 700 }}>
              對號座全妥
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 440, overflowY: 'auto', paddingRight: 4 }}>
            {/* 去程機票 */}
            <div style={{ background: '#fdfbf7', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(20,50,40,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, fontWeight: 700, color: 'var(--c-pine)' }}>
                <span>✈️ 去程 星宇 JX838</span>
                <span className="time-pill" style={{ fontSize: 10, padding: '1px 6px' }}>09/21 14:55</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 2 }}>
                桃園 T1 (14:55) ➔ 名古屋中部 NGO (18:45)
              </div>
            </div>

            {/* 回程機票 */}
            <div style={{ background: '#fdfbf7', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(20,50,40,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, fontWeight: 700, color: 'var(--c-pine)' }}>
                <span>✈️ 回程 星宇 JX839</span>
                <span className="time-pill" style={{ fontSize: 10, padding: '1px 6px' }}>10/03 19:55</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 2 }}>
                名古屋中部 NGO (19:55) ➔ 桃園 T1 (22:15)
              </div>
            </div>

            {/* 9/22 跨縣三大穿山巴士 */}
            <div style={{ background: 'rgba(201,150,62,0.07)', padding: '7px 10px', borderRadius: 6, border: '1px solid rgba(201,150,62,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--c-ink)' }}>
                  🚌 9/22 跨縣三大穿山長途巴士
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--c-pine)', color: '#fff', padding: '1px 5px', borderRadius: 4 }}>
                  已全訂妥
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 11, color: 'var(--c-ink-light)' }}>
                <div>• <b>07:50~10:32</b> 名古屋 ➔ 白川鄉（4,200円・首班車）</div>
                <div>• <b>14:45~15:35</b> 白川鄉 ➔ 高山（北陸鐵道 01D・2,800円）</div>
                <div>• <b>16:50~19:23</b> 高山 ➔ 松本（Alpico 26518號特急）</div>
              </div>
            </div>

            {/* 9/28 平湯直達名古屋巴士 */}
            <div style={{ background: 'rgba(20,50,40,0.03)', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(20,50,40,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--c-pine)' }}>
                  🚌 9/28 平湯直達名古屋高速巴士
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, background: 'rgba(59,109,79,0.12)', color: 'var(--c-pine)', padding: '1px 5px', borderRadius: 4 }}>
                  已購買
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--c-ink-light)' }}>
                • <b>16:55~21:15</b> 平湯溫泉總站 ➔ 名鐵巴士中心（6,800円・直達）
              </div>
            </div>

            {/* 9/29-30 黑部立山 2天1夜專車 */}
            <div style={{ background: 'rgba(20,50,40,0.03)', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(20,50,40,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--c-pine)' }}>
                  🏔️ 9/29~30 黑部立山 2天1夜套票
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, background: 'rgba(201,150,62,0.18)', color: 'var(--c-brass-dark)', padding: '1px 5px', borderRadius: 4 }}>
                  KKday全包
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--c-ink-light)' }}>
                • 訂單 653075：名古屋專車 ＋ 立山 6 種登山交通 ＋ 室堂飯店
              </div>
            </div>
          </div>
        </div>

        {/* 住宿動線安排 (完整 12 晚排程) */}
        <div className="journal-card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <WashiTape color="green" angle={1.5} width={80} top={-10} right={20} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="serif" style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--c-pine)' }}>
                🏨 住宿與山屋入住排程
              </span>
              <span className="handwriting" style={{ fontSize: 16, color: 'var(--c-brass-dark)', fontWeight: 700 }}>
                12 Nights
              </span>
            </div>
            <span style={{ fontSize: 10.5, background: 'rgba(59,109,79,0.12)', color: 'var(--c-pine)', padding: '1.5px 7px', borderRadius: 10, fontWeight: 700 }}>
              100% 訂妥
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 440, overflowY: 'auto', paddingRight: 4 }}>
            {ACCOMMODATION_SCHEDULE.map((acc, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  padding: '5px 9px',
                  borderRadius: 6,
                  background: acc.isSpecial ? 'rgba(201,150,62,0.07)' : 'rgba(20,50,40,0.03)',
                  border: acc.isSpecial ? '1px solid rgba(201,150,62,0.22)' : '1px solid rgba(20,50,40,0.06)',
                  fontSize: 11.8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      background: acc.isSpecial ? 'var(--c-terracotta)' : 'var(--c-pine)',
                      color: '#ffffff',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 4,
                      whiteSpace: 'nowrap',
                    }}>
                      {acc.dates}
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--c-ink)' }}>
                      {acc.name}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '1px 5px',
                    borderRadius: 4,
                    background: acc.isSpecial ? 'rgba(194,84,59,0.1)' : 'rgba(20,50,40,0.06)',
                    color: acc.isSpecial ? 'var(--c-terracotta)' : 'var(--c-pine)',
                    whiteSpace: 'nowrap',
                  }}>
                    {acc.tag}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--c-muted)', paddingLeft: 2 }}>
                  {acc.note}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. 已標記想去清單 (可展開) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          className="journal-card btn-plain"
          onClick={() => setWishOpen(!wishOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--c-pine)',
            color: '#ffffff',
            padding: '16px 22px',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>♥</span>
            <span className="serif" style={{ fontSize: 16, fontWeight: 800 }}>
              已標記想去地點清單
            </span>
            <span style={{
              background: 'var(--c-brass)',
              color: '#143228',
              fontSize: 12,
              fontWeight: 800,
              borderRadius: 12,
              padding: '2px 9px',
            }}>
              {favCount} 處
            </span>
          </div>
          <span className="serif" style={{ fontSize: 13, color: 'var(--c-brass-light)', fontWeight: 700 }}>
            {wishOpen ? '收合 ▲' : '點擊查看清單 ▼'}
          </span>
        </button>

        {wishOpen && (
          <div className="fade-up">
            <WishList items={favEntities} />
          </div>
        )}
      </div>

      {/* 拍立得照片點擊放大 Lightbox 彈窗 */}
      <ImageLightboxModal
        src={lightboxImage?.src ?? null}
        caption={lightboxImage?.caption}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
}
