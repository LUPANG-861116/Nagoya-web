import { useState, useEffect } from 'react';
import AreaRail from '../components/AreaRail';
import JourneyRouteMap from '../components/JourneyRouteMap';
import AlpsOfflineMap from '../components/AlpsOfflineMap';

type MapViewMode = 'alps' | 'chubu';

export default function AreaMap() {
  const [mode, setMode] = useState<MapViewMode>(() => {
    const hash = window.location.hash;
    if (hash.includes('chubu')) return 'chubu';
    return 'alps'; // Default to Alps offline mountain map
  });

  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash;
      if (hash.includes('chubu')) setMode('chubu');
      else if (hash.includes('alps')) setMode('alps');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const switchMode = (m: MapViewMode) => {
    setMode(m);
    window.location.hash = `map/${m}`;
  };

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 頂部地圖模式切換列 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        background: '#ffffff',
        padding: '10px 16px',
        borderRadius: 12,
        border: '1px solid var(--c-line)',
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn-plain"
            onClick={() => switchMode('alps')}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: mode === 'alps' ? 800 : 600,
              background: mode === 'alps' ? 'var(--c-pine)' : 'rgba(20,50,40,0.04)',
              color: mode === 'alps' ? '#ffffff' : 'var(--c-ink-light)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>🏔️</span>
            <span>表銀座＋槍穗連峰・離線 GPS 登山地圖</span>
          </button>

          <button
            className="btn-plain"
            onClick={() => switchMode('chubu')}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: mode === 'chubu' ? 800 : 600,
              background: mode === 'chubu' ? 'var(--c-pine)' : 'rgba(20,50,40,0.04)',
              color: mode === 'chubu' ? '#ffffff' : 'var(--c-ink-light)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>🗾</span>
            <span>中部 13 日足跡全覽圖</span>
          </button>
        </div>

        <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>
          {mode === 'alps' ? '💡 支援手機硬體 GPS 離線即時定位 ＆ GPX 下載' : '💡 點擊站點可跳轉至當日行程'}
        </div>
      </div>

      {mode === 'alps' ? (
        /* 北阿爾卑斯表銀座縱走離線 GPS 登山地圖 */
        <AlpsOfflineMap />
      ) : (
        /* 中部 13 日大長征全域足跡地圖 */
        <>
          <JourneyRouteMap
            activeDay={1}
            onSelectDay={(d) => {
              sessionStorage.setItem('selected_day_idx', String(d - 1));
              window.location.hash = `plan/day-${d}`;
            }}
          />

          {/* 縱走動線與區域特色推薦 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
            <div className="card" style={{ flex: 2, minWidth: 300, padding: '24px 26px', background: '#ffffff', borderRadius: 14, border: '1px solid var(--c-line)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
                <span className="serif" style={{ fontSize: 18, fontWeight: 800, color: 'var(--c-pine)' }}>
                  縱走動線・主要核心區域
                </span>
                <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>
                  名鐵・穿山巴士・JR大糸線・阿爾卑斯刃脊
                </span>
              </div>
              <AreaRail highlightAreas={null} showCounts={true} />
            </div>
            <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="card" style={{ padding: '18px 20px', background: '#ffffff', borderRadius: 14, border: '1px solid var(--c-line)' }}>
                <div className="serif" style={{ fontSize: 15, fontWeight: 800, marginBottom: 10, color: 'var(--c-pine)' }}>
                  重點特色推薦
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13 }}>
                  {[
                    ['北阿爾卑斯名峰', '表銀座三大急登＋海豚岩＋槍岳尖鋒＋大切戶刃脊'],
                    ['信州松本城下町', '黑色國寶天守＋草間彌生美術館＋十割手打蕎麥麵'],
                    ['白川鄉合掌造', '童話茅草聚落＋城山天守閣俯瞰明信片全景'],
                    ['乘鞍岳與平湯', '畳平 2702m 輕取百名山＋平湯大瀑布夕照＋露天秘湯'],
                    ['名古屋都會名勝', '熱田神宮草薙神劍＋蓬萊軒鰻魚飯三吃＋吉卜力公園'],
                  ].map(([b, rest]) => (
                    <div key={b} style={{ display: 'flex', gap: 8 }}>
                      <span style={{ color: 'var(--c-terracotta)', fontWeight: 700 }}>◆</span>
                      <span><b>{b}</b>：{rest}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: 'rgba(20,50,40,0.05)', border: '1px dashed var(--c-pine)', borderRadius: 10, padding: '16px 20px', fontSize: 12.5, color: 'var(--c-ink-light)', lineHeight: 1.7 }}>
                全行程貫穿愛知、岐阜、長野三縣，融合三千米極限名峰岩稜、世界遺產、國寶名城與名古屋經典名物料理！
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}