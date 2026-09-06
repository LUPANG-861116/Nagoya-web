// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { TripStateProvider } from '../../state/store';
import Home from '../Home';

vi.mock('../../state/auth', () => ({
  useAuth: () => ({ canEdit: true, openLogin: vi.fn(), logout: vi.fn() }),
}));

vi.mock('../../data', () => ({
  byCategory: () => [],
  entities: [],
  guides: [],
  todos: [],
  meta: { builtAt: '2026-08-11T00:00:00Z', tripStart: '2026-09-30', tripEnd: '2026-10-04' },
  overview: {
    fields: {
      出發: '2026-09-30',
      出發顯示: '09.30 週三',
      回程: '2026-10-04',
      回程顯示: '10.04 週日',
      天數: '5天4夜',
      季節: '秋楓前緣',
      飯店: '大阪心齋橋格蘭多酒店',
      飯店副標: 'Shinsaibashi Grand Hotel Osaka',
      飯店狀態: '已確認',
      訂購: '易飛旅遊',
      產品: '大阪機加酒自由行',
      訂單編號: 'WPKG000004961',
      訂購提醒: '',
    },
    transportNotes: ['早｜7-11'],
  },
}));

describe('Home 頁面與微縮地景主視覺', () => {
  afterEach(() => cleanup());

  it('渲染去背的東京旅行風景當主視覺', () => {
    render(
      <TripStateProvider>
        <Home />
      </TripStateProvider>
    );

    const hero = screen.getByAltText(/東京旅行風景/) as HTMLImageElement;
    expect(hero).toBeTruthy();
    expect(hero.src).toContain('tokyo-diorama.jpg');
  });

  it('問候列與行程摘要顯示出發、回程與天數', () => {
    render(
      <TripStateProvider>
        <Home />
      </TripStateProvider>
    );

    expect(screen.getByText('嗨，旅伴 👋')).toBeTruthy();
    expect(screen.getByText('09.30 週三')).toBeTruthy();
    expect(screen.getByText('10.04 週日')).toBeTruthy();
    expect(screen.getAllByText('5天4夜').length).toBeGreaterThan(0);
  });
});
