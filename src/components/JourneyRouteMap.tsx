import { useState, useEffect } from 'react';

export interface RoutePin {
  id: string;
  day: number;
  label: string;
  sub?: string;
  emoji: string;
  top: string;
  left: string;
  bgColor: string;
  accentColor: string;
}

const PINS: RoutePin[] = [
  {
    id: 'kurobe',
    day: 9,
    label: '黑部立山水庫',
    sub: '世紀大壩洩洪 (H2450m)',
    emoji: '🌊',
    top: '15%',
    left: '50%',
    bgColor: 'rgba(0, 151, 167, 0.94)',
    accentColor: '#26c6da',
  },
  {
    id: 'tsubakuro',
    day: 4,
    label: '燕岳・燕山莊',
    sub: '海豚岩 (H2763m)',
    emoji: '🐬',
    top: '24%',
    left: '68%',
    bgColor: 'rgba(217, 72, 38, 0.94)',
    accentColor: '#ff7043',
  },
  {
    id: 'yari-hotaka',
    day: 5,
    label: '槍之岳・奧穗高',
    sub: '天槍與日本第3峰 (H3190m)',
    emoji: '🏔️',
    top: '33%',
    left: '38%',
    bgColor: 'rgba(183, 28, 28, 0.95)',
    accentColor: '#ef5350',
  },
  {
    id: 'norikura',
    day: 8,
    label: '乘鞍岳 3026m',
    sub: '百名山輕取 (H3026m)',
    emoji: '🌋',
    top: '44%',
    left: '16%',
    bgColor: 'rgba(216, 67, 21, 0.94)',
    accentColor: '#ff7043',
  },
  {
    id: 'matsumoto',
    day: 3,
    label: '國寶松本城',
    sub: '信州城下町 (H590m)',
    emoji: '🏯',
    top: '50%',
    left: '78%',
    bgColor: 'rgba(59, 130, 246, 0.94)',
    accentColor: '#60a5fa',
  },
  {
    id: 'kamikochi-hirayu',
    day: 7,
    label: '上高地・平湯溫泉',
    sub: '神之故鄉與秘湯 (H1250m)',
    emoji: '♨️',
    top: '58%',
    left: '40%',
    bgColor: 'rgba(46, 125, 50, 0.94)',
    accentColor: '#66bb6a',
  },
  {
    id: 'shirakawago',
    day: 2,
    label: '白川鄉合掌村',
    sub: '世界文化遺產 (H500m)',
    emoji: '🛖',
    top: '68%',
    left: '18%',
    bgColor: 'rgba(230, 152, 59, 0.94)',
    accentColor: '#ffa726',
  },
  {
    id: 'ghibli',
    day: 11,
    label: '吉卜力公園',
    sub: '魔女之谷 (H110m)',
    emoji: '🌿',
    top: '74%',
    left: '76%',
    bgColor: 'rgba(104, 159, 56, 0.94)',
    accentColor: '#9ccc65',
  },
  {
    id: 'nagoya-hub',
    day: 1,
    label: '名古屋大樞紐',
    sub: '總部大本營 (H15m)',
    emoji: '🏙️',
    top: '86%',
    left: '48%',
    bgColor: 'rgba(123, 31, 162, 0.94)',
    accentColor: '#ab47bc',
  },
];

export default function JourneyRouteMap({
  activeDay = 1,
  onSelectDay,
}: {
  activeDay?: number;
  onSelectDay?: (dayNumber: number) => void;
}) {
  const [activePinId, setActivePinId] = useState<string>('nagoya-hub');

  useEffect(() => {
    if (activeDay) {
      const match = PINS.find(p => p.day === activeDay);
      if (match) setActivePinId(match.id);
    }
  }, [activeDay]);

  const handleDayJump = (day: number, pinId?: string) => {
    if (pinId) setActivePinId(pinId);
    if (onSelectDay) {
      onSelectDay(day);
    } else {
      sessionStorage.setItem('selected_day_idx', String(day - 1));
      window.location.hash = `plan/day-${day}`;
    }
  };

  return (
    <div className="journal-card" style={{
      padding: '28px 24px',
      overflow: 'hidden',
      background: '#ffffff',
      border: '1.5px solid rgba(0,0,0,0.08)',
      boxShadow: '0 10px 36px rgba(0,0,0,0.06)',
    }}>
      {/* 頂部標題列與羅盤座標 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 22,
        borderBottom: '1.5px solid rgba(0,0,0,0.06)',
        paddingBottom: 18,
      }}>
        <div>
          <div style={{
            fontSize: 11.5,
            letterSpacing: '0.15em',
            fontWeight: 800,
            color: 'var(--c-pine)',
            textTransform: 'uppercase',
            marginBottom: 3,
          }}>
            EXPEDITION RELIEF MAP ・ 3D DIORAMA
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 22 }}>🗺️</span>
            <h2 className="serif" style={{
              fontSize: 'clamp(18px, 4.2vw, 24px)',
              fontWeight: 900,
              color: '#1a1a1a',
              margin: 0,
              letterSpacing: '0.02em',
              lineHeight: 1.25,
            }}>
              13 日遠征足跡路線圖・立體微縮地景
            </h2>
            <span style={{
              background: 'rgba(20,50,40,0.08)',
              color: 'var(--c-pine)',
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 12,
            }}>
              四大核心探險圈
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#666666', margin: '6px 0 0', lineHeight: 1.5 }}>
            EXPLORE. EXPERIENCE. REMEMBER. ・ 以<b>「名古屋」</b>為唯一樞紐總部，標高跨越 5m 至 3190m 巔峰全覽
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* 經緯度座標 */}
          <div style={{
            background: '#faf7f2',
            padding: '7px 14px',
            borderRadius: 10,
            fontSize: 12,
            fontFamily: 'monospace',
            color: '#444444',
            border: '1px solid #e8e2d5',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span>📍</span>
            <span>NAGOYA HUB: 35.18°N, 136.90°E</span>
          </div>

          {/* 復古羅盤 */}
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ffffff 0%, #f4eee1 100%)',
            border: '1.5px solid #d4af37',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            boxShadow: '0 3px 10px rgba(0,0,0,0.06)',
            cursor: 'default',
          }} title="北向羅盤標誌">
            🧭
          </div>
        </div>
      </div>

      {/* 3D 核心版面：左側區域清單 + 中央 3D Diorama 畫布 + 右側區域清單 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(250px, 1fr) minmax(340px, 1.85fr) minmax(250px, 1fr)',
        gap: 22,
        alignItems: 'center',
      }} className="diorama-grid-layout">
        
        {/* 左側清單卡片 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* 圈一：尾張名古屋樞紐 (總部) */}
          <div style={{
            background: '#fafafa',
            borderRadius: 14,
            padding: '16px 18px',
            border: '1px solid #e5e5e5',
            borderLeft: '4.5px solid #7b1fa2',
            boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#7b1fa2', letterSpacing: '0.08em' }}>REGION 01</span>
              <span style={{ fontSize: 11, background: 'rgba(123,31,162,0.1)', color: '#7b1fa2', padding: '1px 6px', borderRadius: 6, fontWeight: 700 }}>大本營</span>
            </div>
            <div className="serif" style={{ fontSize: 16, fontWeight: 800, color: '#111', margin: '3px 0 10px' }}>
              尾張名古屋大樞紐
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 12.5, color: '#444' }}>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => handleDayJump(1, 'nagoya-hub')}>
                <span>☑️</span>
                <span><b>D01</b> 星宇直達・名驛世界的山將宵夜</span>
              </div>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => handleDayJump(8, 'nagoya-hub')}>
                <span>☑️</span>
                <span><b>D08晚</b> 縱走凱旋・飯店領回大行李</span>
              </div>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => handleDayJump(12, 'nagoya-hub')}>
                <span>☑️</span>
                <span><b>D12</b> 熱田神宮草薙劍・蓬萊軒鰻魚三吃</span>
              </div>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => handleDayJump(13, 'nagoya-hub')}>
                <span>☑️</span>
                <span><b>D13</b> 中部機場波音787館・JX839返台</span>
              </div>
            </div>
          </div>

          {/* 圈二：飛驒與信州松本 */}
          <div style={{
            background: '#fafafa',
            borderRadius: 14,
            padding: '16px 18px',
            border: '1px solid #e5e5e5',
            borderLeft: '4.5px solid #e6983b',
            boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#e6983b', letterSpacing: '0.08em' }}>REGION 02</span>
              <span style={{ fontSize: 11, background: 'rgba(230,152,59,0.12)', color: '#b45309', padding: '1px 6px', borderRadius: 6, fontWeight: 700 }}>世界遺產</span>
            </div>
            <div className="serif" style={{ fontSize: 16, fontWeight: 800, color: '#111', margin: '3px 0 10px' }}>
              飛驒合掌村與信州松本
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 12.5, color: '#444' }}>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => handleDayJump(2, 'shirakawago')}>
                <span>☑️</span>
                <span><b>D02</b> 白川鄉荻町童話合掌造・城山展望台</span>
              </div>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => handleDayJump(3, 'matsumoto')}>
                <span>☑️</span>
                <span><b>D03</b> 國寶黑色松本城天守・草間彌生美術館</span>
              </div>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => handleDayJump(3, 'matsumoto')}>
                <span>☑️</span>
                <span><b>D03</b> 黑貓宅急便寄出大行李・石井運動瓦斯</span>
              </div>
            </div>
          </div>
        </div>

        {/* 中央立體 3D Diorama 畫布視窗 */}
        <div
          className="diorama-canvas-box"
          style={{
            position: 'relative',
            borderRadius: 18,
            overflow: 'hidden',
            boxShadow: '0 16px 48px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)',
            background: '#0d1c16',
          }}
        >
          {/* 微縮模型底圖 */}
          <img
            src={`${import.meta.env.BASE_URL}nagoya-diorama.jpg`}
            alt="3D 立體微縮阿爾卑斯山脈地景"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              filter: 'contrast(1.06) brightness(1.02) saturate(1.08)',
            }}
          />

          {/* 互動發光 Pins */}
          {PINS.map((pin) => {
            const isActive = pin.id === activePinId;
            return (
              <div
                key={pin.id}
                className="route-pin-pill"
                onClick={() => handleDayJump(pin.day, pin.id)}
                style={{
                  position: 'absolute',
                  left: pin.left,
                  top: pin.top,
                  transform: isActive ? 'translate(-50%, -50%) scale(1.12)' : 'translate(-50%, -50%) scale(1)',
                  background: pin.bgColor,
                  color: '#ffffff',
                  padding: '5px 11px',
                  borderRadius: 20,
                  fontSize: 11.5,
                  fontWeight: 800,
                  boxShadow: isActive
                    ? `0 0 0 3px #ffffff, 0 8px 24px ${pin.bgColor}`
                    : `0 4px 14px rgba(0,0,0,0.35)`,
                  cursor: 'pointer',
                  border: '1.5px solid rgba(255,255,255,0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  zIndex: isActive ? 10 : 5,
                  transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.18)';
                  e.currentTarget.style.zIndex = '20';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = isActive ? 'translate(-50%, -50%) scale(1.12)' : 'translate(-50%, -50%) scale(1)';
                  e.currentTarget.style.zIndex = isActive ? '10' : '5';
                }}
                title={`點擊查看 Day ${pin.day}：${pin.label}`}
              >
                <span style={{ fontSize: 13 }}>{pin.emoji}</span>
                <span>{pin.label}</span>
              </div>
            );
          })}

          {/* 右下角地景微縮標記 */}
          <div style={{
            position: 'absolute',
            bottom: 10,
            right: 12,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            color: '#ffffff',
            padding: '3px 8px',
            borderRadius: 6,
            fontSize: 10,
            letterSpacing: '0.05em',
            pointerEvents: 'none',
            zIndex: 6,
          }}>
            ⛰️ 3D ALPS RELIEF MODEL
          </div>
        </div>

        {/* 右側清單卡片 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* 圈三：北阿爾卑斯表銀座大縱走 */}
          <div style={{
            background: '#fafafa',
            borderRadius: 14,
            padding: '16px 18px',
            border: '1px solid #e5e5e5',
            borderLeft: '4.5px solid #d94826',
            boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#d94826', letterSpacing: '0.08em' }}>REGION 03</span>
              <span style={{ fontSize: 11, background: 'rgba(217,72,38,0.12)', color: '#b71c1c', padding: '1px 6px', borderRadius: 6, fontWeight: 700 }}>H3190m 極限</span>
            </div>
            <div className="serif" style={{ fontSize: 16, fontWeight: 800, color: '#111', margin: '3px 0 10px' }}>
              表銀座槍穗連峰大縱走
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 12.5, color: '#444' }}>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => handleDayJump(4, 'tsubakuro')}>
                <span>☑️</span>
                <span><b>D04</b> 中房起登・合戰西瓜・燕岳海豚岩</span>
              </div>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => handleDayJump(5, 'yari-hotaka')}>
                <span>☑️</span>
                <span><b>D05</b> 大天井・東鎌天梯・登頂天槍 3180m</span>
              </div>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => handleDayJump(6, 'yari-hotaka')}>
                <span>☑️</span>
                <span><b>D06</b> 大切戶斷崖刃脊・登頂奧穗高 3190m</span>
              </div>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => handleDayJump(7, 'kamikochi-hirayu')}>
                <span>☑️</span>
                <span><b>D07</b> 上高地河童橋梓川・平湯露天秘湯</span>
              </div>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => handleDayJump(8, 'norikura')}>
                <span>☑️</span>
                <span><b>D08</b> 畳平巴士・輕取乘鞍岳劍峰 3026m</span>
              </div>
            </div>
          </div>

          {/* 圈四：黑部立山與吉卜力森林 */}
          <div style={{
            background: '#fafafa',
            borderRadius: 14,
            padding: '16px 18px',
            border: '1px solid #e5e5e5',
            borderLeft: '4.5px solid #0097a7',
            boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#0097a7', letterSpacing: '0.08em' }}>REGION 04</span>
              <span style={{ fontSize: 11, background: 'rgba(0,151,167,0.12)', color: '#00838f', padding: '1px 6px', borderRadius: 6, fontWeight: 700 }}>高原水庫與童話</span>
            </div>
            <div className="serif" style={{ fontSize: 16, fontWeight: 800, color: '#111', margin: '3px 0 10px' }}>
              黑部立山與吉卜力之森
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 12.5, color: '#444' }}>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => handleDayJump(9, 'kurobe')}>
                <span>☑️</span>
                <span><b>D09</b> 黑部水庫翡翠大壩每秒10噸洩洪</span>
              </div>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => handleDayJump(10, 'kurobe')}>
                <span>☑️</span>
                <span><b>D10</b> 大觀峰空中纜車・室堂高原觀星夜宿</span>
              </div>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => handleDayJump(11, 'ghibli')}>
                <span>☑️</span>
                <span><b>D11</b> 吉卜力大倉庫・魔女之谷與龍貓森林</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 底部導覽備註條 */}
      <div style={{
        marginTop: 22,
        paddingTop: 16,
        borderTop: '1px solid rgba(0,0,0,0.06)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        fontSize: 12,
        color: '#666666',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>💡</span>
          <span><b>操作提示：</b>點擊立體地景上的地標 Pin 或兩側的區域清單，即可直達該日完整行程與時刻表。</span>
        </div>
        <div style={{
          background: 'rgba(20,50,40,0.06)',
          padding: '4px 10px',
          borderRadius: 6,
          color: 'var(--c-pine)',
          fontWeight: 700,
        }}>
          標高落差：H5m (名鐵特急) ➔ H3190m (奧穗高岳)
        </div>
      </div>

      {/* 自適應行動端樣式：手機端優先將 3D 立體地景置頂，下方再展示區域表格 */}
      <style>{`
        @media (max-width: 900px) {
          .diorama-grid-layout {
            display: flex !important;
            flex-direction: column !important;
            gap: 16px !important;
          }
          .diorama-canvas-box {
            order: -1 !important;
            margin-bottom: 8px !important;
            width: 100% !important;
          }
        }
        @media (max-width: 600px) {
          .route-pin-pill {
            padding: 3.5px 7.5px !important;
            font-size: 10.5px !important;
            gap: 3.5px !important;
            border-radius: 14px !important;
            letter-spacing: 0.01em !important;
          }
          .route-pin-pill span:first-child {
            font-size: 11.5px !important;
          }
        }
      `}</style>
    </div>
  );
}
