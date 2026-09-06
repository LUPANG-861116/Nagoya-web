import { byCategory, meta, overview } from '../data';
import { useTripState } from '../state/store';
import { apiBase, getToken, setupLink } from '../api/state';
import { useAuth } from '../state/auth';
import { countdownDays } from '../lib/countdown';
import { TABS, type TabKey } from '../lib/tabs';
import SyncSeal from './SyncSeal';

export default function Header({ tab, onNavigate }: { tab: TabKey; onNavigate: (k: TabKey) => void }) {
  const { offline } = useTripState();
  const { canEdit, openLogin, logout } = useAuth();
  const cd = countdownDays(meta.tripStart);
  const foodCount = byCategory('餐廳').length;
  const f = overview.fields;

  const go = (k: TabKey) => {
    onNavigate(k);
    window.scrollTo(0, 0);
  };

  return (
    <header className="journal-header">
      <div className="hdr-row hdr-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: '1 1 auto' }}>
          <div className="hdr-logo" style={{ flexShrink: 0 }}>🏕️</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
              <span className="serif hdr-title" style={{ fontSize: 'clamp(15px, 4vw, 19px)' }}>
                NAGOYA & ALPS
              </span>
              <span className="handwriting" style={{ fontSize: 'clamp(14px, 3.6vw, 19px)', color: '#b45309', fontWeight: 700 }}>
                Travel Planner & Journal
              </span>
            </div>
            <div className="hdr-sub" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 'min(82vw, 480px)' }}>
              {f['出發顯示']} → {f['回程顯示']}・{f['天數']}・宿 {f['住宿區域'] || '名古屋/松本/燕山莊/平湯'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 'auto' }}>
          <SyncSeal />
          <div className="hdr-cd" style={{ background: '#ffffff', borderRadius: 10, padding: '3px 10px', border: '1px solid rgba(139,115,85,0.25)', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
            <span className="hdr-cd-label" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.1em', color: '#7a6d55' }}>倒數</span>
            <span className="hdr-cd-num" style={{ fontSize: 20, fontWeight: 800, color: '#b45309', marginLeft: 4 }}>{cd}</span>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: '#7a6d55', marginLeft: 2 }}>日</span>
          </div>
          {apiBase() && (canEdit ? (
            <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="btn-plain" title="複製新裝置設定連結" style={{ fontSize: 18, cursor: 'pointer', color: '#29231a' }}
                onClick={() => { const cur = getToken(); if (cur) window.prompt('新裝置設定連結（點一次即完成同步）：', setupLink(cur)); }}>⚙</button>
              <button className="btn-plain" style={{
                fontSize: 12, color: '#29231a', border: '1px solid rgba(139,115,85,0.3)',
                borderRadius: 6, padding: '4px 10px', minHeight: 28, cursor: 'pointer', background: '#ffffff',
              }} onClick={logout}>登出</button>
            </div>
          ) : (
            <button className="btn-plain" style={{
              flex: 'none', fontSize: 12, color: '#92400e', border: '1px solid #f59e0b',
              background: '#fef3c7', borderRadius: 6, padding: '4px 10px', minHeight: 28, fontWeight: 700, cursor: 'pointer',
            }} onClick={openLogin}>登入編輯</button>
          ))}
        </div>
      </div>
      <div className="hdr-row hdr-nav" style={{ background: 'rgba(244, 238, 227, 0.98)', borderTop: '1px solid rgba(139,115,85,0.18)', padding: '6px 20px' }}>
        <nav className="hscroll" style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
          {TABS.map(([k, label]) => {
            const isCur = tab === k;
            return (
              <button
                key={k}
                className={`journal-tab-btn${isCur ? ' active' : ''}`}
                onClick={() => go(k)}
              >
                {k === 'plan' && '🗓️ '}
                {k === 'home' && '🧭 '}
                {k === 'food' && '🍱 '}
                {k === 'places' && '🏔️ '}
                {k === 'trans' && '🚌 '}
                {k === 'map' && '🗺️ '}
                {k === 'guides' && '📖 '}
                {k === 'food' ? `${label} (${foodCount})` : label}
              </button>
            );
          })}
        </nav>
        {offline && (
          <span style={{ flex: 'none', fontSize: 11, color: '#92400e', border: '1px dashed #f59e0b', background: '#fef3c7', borderRadius: 4, padding: '2px 8px' }}>
            離線模式
          </span>
        )}
      </div>
    </header>
  );
}
