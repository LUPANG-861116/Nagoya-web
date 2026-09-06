export interface Waypoint {
  day: number;
  label: string;
  name: string;
  elev?: string;
  type: 'city' | 'transit' | 'peak' | 'ridge' | 'onsen' | 'spot';
  highlight?: boolean;
}

const WAYPOINTS: Waypoint[] = [
  { day: 1, label: '01', name: '名古屋站', elev: 'H15m', type: 'city' },
  { day: 2, label: '02', name: '白川鄉合掌村', elev: 'H500m', type: 'spot' },
  { day: 3, label: '03', name: '信州松本城', elev: 'H590m', type: 'city' },
  { day: 4, label: '04', name: '燕岳・燕山莊', elev: 'H2763m', type: 'peak', highlight: true },
  { day: 5, label: '05', name: '槍之岳天槍', elev: 'H3180m', type: 'peak', highlight: true },
  { day: 6, label: '06', name: '大切戶・穗高岳', elev: 'H3106m', type: 'ridge', highlight: true },
  { day: 7, label: '07', name: '奧穗高・上高地', elev: 'H3190m', type: 'peak', highlight: true },
  { day: 8, label: '08', name: '乘鞍岳劍峰', elev: 'H3026m', type: 'peak', highlight: true },
  { day: 9, label: '09', name: '平湯溫泉', elev: 'H1250m', type: 'onsen' },
  { day: 10, label: '10', name: '黑部立山水壩', elev: 'H1470m', type: 'spot' },
  { day: 11, label: '11', name: '吉卜力公園', elev: 'H110m', type: 'spot' },
  { day: 12, label: '12', name: '熱田神宮・榮', elev: 'H20m', type: 'city' },
  { day: 13, label: '13', name: '中部國際機場', elev: 'H5m', type: 'transit' },
];

export default function TrailMapInfographic({
  activeDay = 1,
  onSelectDay,
}: {
  activeDay?: number;
  onSelectDay?: (d: number) => void;
}) {
  return (
    <div className="journal-card" style={{ padding: '20px 22px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🏔️</span>
          <span className="serif" style={{ fontSize: 18, fontWeight: 800, color: 'var(--c-pine)' }}>
            北阿爾卑斯名峰縱走手繪軌跡圖
          </span>
          <span className="handwriting" style={{ fontSize: 18, color: 'var(--c-terracotta)', fontWeight: 700 }}>
            Alpine Traverse Trail Map
          </span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--c-muted)', fontWeight: 600 }}>
          標高最高點：奧穗高岳 3190m
        </span>
      </div>

      {/* 標高縱剖面山峰剪影背景與節點 */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(20,50,40,0.06) 0%, rgba(201,150,62,0.08) 100%)',
        borderRadius: 12,
        padding: '16px 12px',
        border: '1px solid rgba(20,50,40,0.1)',
        position: 'relative'
      }}>
        {/* SVG 手繪山脈連峰輪廓線 */}
        <svg viewBox="0 0 1000 120" style={{ width: '100%', height: 75, display: 'block', opacity: 0.35 }}>
          <path
            d="M0,110 Q80,105 150,85 T300,70 T400,25 T500,10 T600,20 T700,45 T850,90 T1000,110 L1000,120 L0,120 Z"
            fill="var(--c-pine)"
          />
          <path
            d="M0,110 L120,95 L250,75 L380,30 L450,8 L530,15 L620,35 L750,70 L880,95 L1000,115"
            stroke="var(--c-trail-gold)"
            strokeWidth="3"
            strokeDasharray="6,4"
            fill="none"
          />
        </svg>

        {/* 橫向路徑節點 (水平捲動 / 彈性排列) */}
        <div style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 6,
          marginTop: -28,
          alignItems: 'flex-start',
        }}>
          {WAYPOINTS.map((wp) => {
            const isCur = activeDay === wp.day;
            return (
              <div
                key={wp.day}
                onClick={() => onSelectDay?.(wp.day)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: 70,
                  cursor: 'pointer',
                  transform: isCur ? 'scale(1.06)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* 標高膠囊 */}
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: wp.highlight ? 'var(--c-terracotta)' : 'var(--c-muted)',
                  marginBottom: 4,
                  fontFamily: 'monospace',
                }}>
                  {wp.elev}
                </span>

                {/* 圓形編號圖釘 */}
                <div
                  className={`trail-pin${isCur ? ' active' : ''}`}
                  style={{
                    border: isCur ? '3px solid #ffffff' : wp.highlight ? '2px solid var(--c-terracotta)' : '2px solid #ffffff',
                  }}
                >
                  {wp.label}
                </div>

                {/* 名稱 */}
                <span style={{
                  fontSize: 11.5,
                  fontWeight: isCur ? 800 : 600,
                  color: isCur ? 'var(--c-terracotta)' : 'var(--c-ink)',
                  textAlign: 'center',
                  marginTop: 6,
                  whiteSpace: 'nowrap',
                }}>
                  {wp.name}
                </span>
                <span style={{ fontSize: 10, color: 'var(--c-muted)' }}>
                  Day {wp.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
