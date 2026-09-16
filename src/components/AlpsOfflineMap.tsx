import { useState, useEffect, useRef, useMemo } from 'react';
import { ALPS_WAYPOINTS, DENSE_TRAIL_POINTS, generateAlpsGPX, type AlpineWaypoint } from '../data/alpsTrailData';

// Haversine distance in km
function calcDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Map bounds for SVG projection
const BOUNDS = {
  minLat: 36.235,
  maxLat: 36.425,
  minLng: 137.625,
  maxLng: 137.760,
};

function projectCoords(lat: number, lng: number, width: number, height: number) {
  // Lng -> X (137.625 is left, 137.760 is right)
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * (width - 60) + 30;
  // Lat -> Y (36.425 is top, 36.235 is bottom)
  const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * (height - 60) + 30;
  return { x, y };
}

export default function AlpsOfflineMap() {
  const [selectedWp, setSelectedWp] = useState<AlpineWaypoint | null>(ALPS_WAYPOINTS[6]); // default Enzanso
  const [activeTab, setActiveTab] = useState<'map' | 'elevation' | 'waypoints' | 'guide'>('map');
  const [activeDayFilter, setActiveDayFilter] = useState<number | null>(null);

  // GPS State
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; altitude: number | null; accuracy: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Download GPX
  const handleDownloadGPX = () => {
    const gpxData = generateAlpsGPX();
    const blob = new Blob([gpxData], { type: 'application/gpx+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '2026_北阿爾卑斯_表銀座槍穗大縱走.gpx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Toggle GPS
  const toggleGPS = () => {
    if (isGpsActive) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsGpsActive(false);
      setGpsCoords(null);
      setIsSimulated(false);
      setGpsError(null);
    } else {
      if (!('geolocation' in navigator)) {
        setGpsError('您的裝置不支援 GPS 地理定位');
        return;
      }
      setIsGpsActive(true);
      setGpsError(null);
      setIsSimulated(false);

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setGpsCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            altitude: pos.coords.altitude,
            accuracy: pos.coords.accuracy,
          });
          setGpsError(null);
        },
        (err) => {
          console.warn('GPS Error:', err);
          setGpsError('尚未獲取衛星訊號（深山中需至無遮蔽處，請確保已允許瀏覽器位置權限）');
        },
        {
          enableHighAccuracy: true,
          maximumAge: 3000,
          timeout: 20000,
        }
      );
    }
  };

  // Simulate GPS for testing (at Yarigatake)
  const simulateGps = (targetWp: AlpineWaypoint) => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsGpsActive(true);
    setIsSimulated(true);
    setGpsError(null);
    setGpsCoords({
      lat: targetWp.lat,
      lng: targetWp.lng,
      altitude: targetWp.elevation,
      accuracy: 5,
    });
    setSelectedWp(targetWp);
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Distance to waypoints from current GPS
  const nearestWaypoint = useMemo(() => {
    if (!gpsCoords) return null;
    let closest = ALPS_WAYPOINTS[0];
    let minDist = Infinity;
    ALPS_WAYPOINTS.forEach((wp) => {
      const d = calcDistanceKm(gpsCoords.lat, gpsCoords.lng, wp.lat, wp.lng);
      if (d < minDist) {
        minDist = d;
        closest = wp;
      }
    });
    return { waypoint: closest, distanceKm: minDist };
  }, [gpsCoords]);

  // SVG dimensions
  const svgWidth = 720;
  const svgHeight = 620;

  // Filtered trail points
  const filteredWaypoints = activeDayFilter
    ? ALPS_WAYPOINTS.filter((w) => w.day === activeDayFilter)
    : ALPS_WAYPOINTS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. 頂部儀表板：標題與離線 GPS 控制器 */}
      <div className="journal-card" style={{ padding: '18px 20px', background: '#ffffff', borderRadius: 14, border: '1px solid var(--c-line)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 20 }}>🏔️</span>
              <span className="serif" style={{ fontSize: 18, fontWeight: 800, color: 'var(--c-pine)' }}>
                北阿爾卑斯【表銀座＋槍穗連峰】離線登山 GPS 地圖
              </span>
              <span style={{ fontSize: 11, background: 'rgba(59,109,79,0.12)', color: 'var(--c-pine)', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                100% 離線可用
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 4 }}>
              全長 38.3 km・中房溫泉 ➔ 燕岳 ➔ 大天井 ➔ 西岳 ➔ 槍之岳 ➔ 大切戶 ➔ 穗高岳 ➔ 上高地
            </div>
          </div>

          {/* 功能按鈕組 */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn-plain"
              onClick={toggleGPS}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                background: isGpsActive ? '#2e7d32' : 'var(--c-pine)',
                color: '#ffffff',
                boxShadow: isGpsActive ? '0 0 12px rgba(46,125,50,0.5)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{isGpsActive ? '🛰️' : '📍'}</span>
              <span>{isGpsActive ? (isSimulated ? '模擬定位中' : '即時 GPS 追蹤中') : '開啟即時 GPS 定位'}</span>
            </button>

            <button
              className="btn-plain"
              onClick={handleDownloadGPX}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                background: 'rgba(201,150,62,0.12)',
                color: 'var(--c-brass-dark)',
                border: '1px solid rgba(201,150,62,0.3)',
              }}
            >
              <span>📥</span>
              <span>下載 GPX 航跡</span>
            </button>
          </div>
        </div>

        {/* GPS 即時狀態顯示條 */}
        {isGpsActive && (
          <div style={{
            marginTop: 14,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(46,125,50,0.06)',
            border: '1px solid rgba(46,125,50,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            fontSize: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <span style={{ color: '#2e7d32', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="pulse-dot" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#2e7d32' }}></span>
                {isSimulated ? '🧪 模擬測試模式（桌機／室內預覽）' : '🛰️ 硬體衛星晶片連線中（離線無訊號亦可定位）'}
              </span>
              {gpsCoords && (
                <span style={{ color: 'var(--c-muted)', fontSize: 11 }}>
                  精度: ±{Math.round(gpsCoords.accuracy)}m ｜ 經緯度: {gpsCoords.lat.toFixed(4)}°N, {gpsCoords.lng.toFixed(4)}°E
                </span>
              )}
            </div>

            {gpsCoords && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, color: 'var(--c-ink)', fontWeight: 600, fontSize: 12.5 }}>
                <div>
                  當前海拔：<span style={{ color: 'var(--c-terracotta)', fontWeight: 800 }}>{gpsCoords.altitude !== null ? `${Math.round(gpsCoords.altitude)} m` : '計算中'}</span>
                </div>
                {nearestWaypoint && (
                  <div>
                    最近目標：<b>{nearestWaypoint.waypoint.name}</b>（直線約 <span style={{ color: 'var(--c-pine)', fontWeight: 800 }}>{nearestWaypoint.distanceKm < 1 ? `${Math.round(nearestWaypoint.distanceKm * 1000)}m` : `${nearestWaypoint.distanceKm.toFixed(1)}km`}</span>）
                  </div>
                )}
              </div>
            )}

            {gpsError && (
              <div style={{ color: '#c2543b', fontSize: 11.5 }}>
                ⚠️ {gpsError}
              </div>
            )}

            <div style={{ fontSize: 11, color: 'var(--c-muted)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span>測試模擬定位：</span>
              <button className="btn-plain" onClick={() => simulateGps(ALPS_WAYPOINTS[6])} style={{ textDecoration: 'underline', color: 'var(--c-pine)', cursor: 'pointer', fontSize: 11 }}>
                📍 燕山莊 (2712m)
              </button>
              <span>・</span>
              <button className="btn-plain" onClick={() => simulateGps(ALPS_WAYPOINTS[16])} style={{ textDecoration: 'underline', color: 'var(--c-pine)', cursor: 'pointer', fontSize: 11 }}>
                📍 槍岳山莊 (3080m)
              </button>
              <span>・</span>
              <button className="btn-plain" onClick={() => simulateGps(ALPS_WAYPOINTS[25])} style={{ textDecoration: 'underline', color: 'var(--c-pine)', cursor: 'pointer', fontSize: 11 }}>
                📍 穗高岳山莊 (2996m)
              </button>
            </div>
          </div>
        )}

        {/* 視圖切換標籤頁 */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, borderBottom: '1px solid var(--c-line)', paddingBottom: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'map', label: '🗺️ 稜線向量地圖', emoji: '🗺️' },
            { id: 'elevation', label: '📈 高度縱剖面圖', emoji: '📈' },
            { id: 'waypoints', label: '🏠 山屋與地標明細 (39處)', emoji: '🏠' },
            { id: 'guide', label: '🧗 Rockland 攻略 ＆ YAMAP 離線雙備份', emoji: '🧗' },
          ].map((tab) => (
            <button
              key={tab.id}
              className="btn-plain"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: activeTab === tab.id ? 800 : 500,
                background: activeTab === tab.id ? 'var(--c-pine)' : 'rgba(20,50,40,0.04)',
                color: activeTab === tab.id ? '#ffffff' : 'var(--c-ink-light)',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. 核心內容區 */}
      {activeTab === 'map' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 300px', gap: 16 }}>
          {/* 左側：SVG 向量地圖 */}
          <div className="journal-card" style={{ padding: 14, background: '#faf8f2', borderRadius: 12, border: '1px solid rgba(20,50,40,0.1)', position: 'relative', overflow: 'hidden' }}>
            {/* 天數過濾小標籤 */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              <button
                className="btn-plain"
                onClick={() => setActiveDayFilter(null)}
                style={{
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: 10.5,
                  fontWeight: 700,
                  background: activeDayFilter === null ? 'var(--c-pine)' : '#ffffff',
                  color: activeDayFilter === null ? '#fff' : 'var(--c-ink-light)',
                  border: '1px solid rgba(20,50,40,0.15)',
                  cursor: 'pointer',
                }}
              >
                全部 4 天全線
              </button>
              {[
                { day: 4, label: 'D1: 中房➔燕岳 (9/24宿燕山莊)', color: '#2e7d32' },
                { day: 5, label: 'D2: 燕山莊➔槍岳 (9/25宿槍岳)', color: '#c9963e' },
                { day: 6, label: 'D3: 大切戶➔北穗➔穗高岳 (9/26宿穗高岳)', color: '#c2543b' },
                { day: 7, label: 'D4: 奧穗➔岳澤➔上高地 (9/27宿朴之木)', color: '#1e88e5' },
              ].map((d) => (
                <button
                  key={d.day}
                  className="btn-plain"
                  onClick={() => setActiveDayFilter(activeDayFilter === d.day ? null : d.day)}
                  style={{
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 10.5,
                    fontWeight: 700,
                    background: activeDayFilter === d.day ? d.color : '#ffffff',
                    color: activeDayFilter === d.day ? '#fff' : 'var(--c-ink-light)',
                    border: `1px solid ${d.color}40`,
                    cursor: 'pointer',
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* 地圖繪製 SVG */}
            <div style={{ width: '100%', overflowX: 'auto', background: '#f5efe4', borderRadius: 8, border: '1px solid rgba(20,50,40,0.08)' }}>
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                style={{ width: '100%', minWidth: 500, height: 'auto', display: 'block' }}
              >
                {/* 裝飾等高線與背景地形紋理 */}
                <defs>
                  <linearGradient id="trailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2e7d32" />
                    <stop offset="35%" stopColor="#c9963e" />
                    <stop offset="70%" stopColor="#c2543b" />
                    <stop offset="100%" stopColor="#1e88e5" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* 網格與背景標示 */}
                <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="#f4ede1" />
                
                {/* 山脈山脊背景示意暈染 */}
                <path
                  d="M 500,50 Q 420,120 380,240 T 260,380 T 210,500"
                  fill="none"
                  stroke="rgba(139,115,85,0.12)"
                  strokeWidth="60"
                  strokeLinecap="round"
                />

                {/* 完整登山路徑曲線 */}
                <path
                  d={DENSE_TRAIL_POINTS.map((pt, idx) => {
                    const { x, y } = projectCoords(pt[0], pt[1], svgWidth, svgHeight);
                    return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
                  }).join(' ')}
                  fill="none"
                  stroke="rgba(0,0,0,0.15)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={DENSE_TRAIL_POINTS.map((pt, idx) => {
                    const { x, y } = projectCoords(pt[0], pt[1], svgWidth, svgHeight);
                    return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
                  }).join(' ')}
                  fill="none"
                  stroke="url(#trailGrad)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* 地標節點繪製 */}
                {filteredWaypoints.map((wp) => {
                  const { x, y } = projectCoords(wp.lat, wp.lng, svgWidth, svgHeight);
                  const isSelected = selectedWp?.id === wp.id;
                  const isPeak = wp.type === 'summit';
                  const isHut = wp.type === 'hut';
                  const isDanger = wp.type === 'danger';
                  const isStay = wp.isStay;

                  return (
                    <g
                      key={wp.id}
                      onClick={() => setSelectedWp(wp)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* 點擊光圈 */}
                      {isSelected && (
                        <circle cx={x} cy={y} r="14" fill="none" stroke="var(--c-terracotta)" strokeWidth="2.5" strokeDasharray="3,2" />
                      )}

                      {/* 節點圓點 */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isStay ? 8 : isPeak ? 6.5 : isHut ? 5.5 : isDanger ? 5 : 4}
                        fill={isStay ? '#c2543b' : isPeak ? '#c9963e' : isHut ? '#3b6d4f' : isDanger ? '#d32f2f' : '#2e7d32'}
                        stroke="#ffffff"
                        strokeWidth={isStay ? 2.5 : 1.5}
                      />

                      {/* 文字標籤 (重要山頭與住宿點) */}
                      {(isStay || isPeak || isDanger || wp.id === 'nakabusa' || wp.id === 'kassen-goya' || wp.id === 'kamikochi-kappabashi') && (
                        <text
                          x={x + (x > svgWidth - 140 ? -10 : 10)}
                          y={y + (y < 40 ? 12 : -4)}
                          textAnchor={x > svgWidth - 140 ? 'end' : 'start'}
                          fontSize={isStay ? 12 : 10.5}
                          fontWeight={isStay ? 800 : 700}
                          fill={isStay ? 'var(--c-terracotta)' : isDanger ? '#b71c1c' : '#1e332a'}
                          stroke="#ffffff"
                          strokeWidth="3"
                          paintOrder="stroke"
                        >
                          {wp.isStay ? `★ ${wp.name}` : wp.type === 'summit' ? `▲ ${wp.name}` : wp.id === 'kassen-goya' ? `🍉 ${wp.name}` : wp.name}
                          <tspan fontSize="9" fill="#666" dx="4">({wp.elevation}m)</tspan>
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* GPS 即時定位標記 */}
                {gpsCoords && (
                  (() => {
                    const { x, y } = projectCoords(gpsCoords.lat, gpsCoords.lng, svgWidth, svgHeight);
                    return (
                      <g>
                        {/* 脈衝動態波紋 */}
                        <circle cx={x} cy={y} r="18" fill="rgba(30, 136, 229, 0.25)">
                          <animate attributeName="r" values="10;28;10" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2s" repeatCount="indefinite" />
                        </circle>
                        <circle cx={x} cy={y} r="7" fill="#1e88e5" stroke="#ffffff" strokeWidth="2.5" filter="url(#glow)" />
                        <text x={x} y={y - 12} textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#0d47a1" stroke="#fff" strokeWidth="3" paintOrder="stroke">
                          📍 當前位置
                        </text>
                      </g>
                    );
                  })()
                )}
              </svg>
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--c-muted)', marginTop: 6, textAlign: 'right' }}>
              💡 點擊地圖上的山屋或山峰節點，右側即時展示詳細情報
            </div>
          </div>

          {/* 右側：選中地標情報卡 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {selectedWp ? (
              <div className="journal-card" style={{ padding: '16px 18px', background: '#ffffff', borderRadius: 12, border: '1px solid var(--c-line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      background: selectedWp.isStay ? 'var(--c-terracotta)' : 'var(--c-pine)',
                      color: '#ffffff',
                      padding: '1.5px 6px',
                      borderRadius: 4,
                    }}>
                      Day {selectedWp.day}
                    </span>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-ink)', marginTop: 4 }}>
                      {selectedWp.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>
                      {selectedWp.nameJp}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-terracotta)' }}>
                      {selectedWp.elevation}m
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--c-muted)' }}>
                      里程 {selectedWp.distKm.toFixed(1)} km
                    </div>
                  </div>
                </div>

                {selectedWp.isStay && (
                  <div style={{ background: 'rgba(194,84,59,0.1)', padding: '6px 10px', borderRadius: 6, fontSize: 11.5, color: 'var(--c-terracotta)', fontWeight: 700, marginBottom: 8 }}>
                    🏨 預約入住日：{selectedWp.stayDate}
                  </div>
                )}

                <div style={{ fontSize: 12, color: 'var(--c-ink-light)', lineHeight: 1.5, marginBottom: 10 }}>
                  {selectedWp.desc}
                </div>

                {selectedWp.tips && (
                  <div style={{ background: 'rgba(201,150,62,0.1)', padding: '8px 10px', borderRadius: 6, fontSize: 11.5, color: 'var(--c-brass-dark)', lineHeight: 1.4, marginBottom: 10 }}>
                    💡 <b>攻略重點：</b>{selectedWp.tips}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11, color: 'var(--c-muted)', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 8 }}>
                  <div>💧 水源狀態：{selectedWp.water ? '✅ 有生飲水' : '⚠️ 需至山屋補給'}</div>
                  <div>📡 訊號：{selectedWp.elevation > 2800 ? '📶 稜線部分有訊號' : '📵 谷底多無訊號'}</div>
                  <div>🌐 緯度：{selectedWp.lat.toFixed(4)}°N</div>
                  <div>🌐 經度：{selectedWp.lng.toFixed(4)}°E</div>
                </div>
              </div>
            ) : (
              <div className="journal-card" style={{ padding: 20, textAlign: 'center', color: 'var(--c-muted)', fontSize: 12 }}>
                請點擊地圖上的節點查看詳細情報
              </div>
            )}

            {/* 4 天縱走段落速查 */}
            <div className="journal-card" style={{ padding: '14px 16px', background: '#ffffff', borderRadius: 12, border: '1px solid var(--c-line)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="serif" style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--c-pine)' }}>
                縱走四日核心指標
              </div>
              {[
                { d: '9/24 D1', title: '中房 ➔ 燕岳 ➔ 燕山莊', stats: '5.5km・+1250m・宿 燕山莊' },
                { d: '9/25 D2', title: '燕山莊 ➔ 東鎌 ➔ 槍岳', stats: '14.4km・+870m/-500m・宿 槍岳山莊' },
                { d: '9/26 D3', title: '槍岳 ➔ 大切戶 ➔ 穗高岳', stats: '8.4km・極險刃脊・宿 穗高岳山莊' },
                { d: '9/27 D4', title: '奧穗 ➔ 岳澤 ➔ 上高地', stats: '10.0km・-1690m・宿 朴之木平' },
              ].map((item, idx) => (
                <div key={idx} style={{ fontSize: 11.5, padding: '5px 8px', borderRadius: 6, background: 'rgba(20,50,40,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span style={{ color: 'var(--c-pine)' }}>{item.d}</span>
                    <span style={{ color: 'var(--c-ink)' }}>{item.title}</span>
                  </div>
                  <div style={{ color: 'var(--c-muted)', fontSize: 10.5, marginTop: 1 }}>{item.stats}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 高度縱剖面圖 */}
      {activeTab === 'elevation' && (
        <div className="journal-card" style={{ padding: '20px 22px', background: '#ffffff', borderRadius: 12, border: '1px solid var(--c-line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div>
              <span className="serif" style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-pine)' }}>
                表銀座 38.3 km 高度縱剖面圖（海拔 1,462m ➔ 3,190m ➔ 1,500m）
              </span>
              <div style={{ fontSize: 11.5, color: 'var(--c-muted)', marginTop: 2 }}>
                顯示合戰尾根急登、東鎌尾根天梯、槍之岳絕頂、大切戶V字大斷崖與奧穗高岳
              </div>
            </div>
          </div>

          <div style={{ width: '100%', overflowX: 'auto' }}>
            <svg viewBox="0 0 760 300" style={{ width: '100%', minWidth: 600, height: 'auto', display: 'block' }}>
              <defs>
                <linearGradient id="eleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(194,84,59,0.35)" />
                  <stop offset="60%" stopColor="rgba(201,150,62,0.18)" />
                  <stop offset="100%" stopColor="rgba(46,125,50,0.05)" />
                </linearGradient>
              </defs>

              {/* Y 軸網格線 */}
              {[1500, 2000, 2500, 3000].map((ele) => {
                const y = 260 - ((ele - 1400) / 1850) * 220;
                return (
                  <g key={ele}>
                    <line x1="45" y1={y} x2="740" y2={y} stroke="rgba(0,0,0,0.06)" strokeDasharray="3,3" />
                    <text x="35" y={y + 4} textAnchor="end" fontSize="10" fill="#999">{ele}m</text>
                  </g>
                );
              })}

              {/* 高度填充區域 */}
              {(() => {
                const pointsStr = ALPS_WAYPOINTS.map((w) => {
                  const x = 50 + (w.distKm / 38.3) * 680;
                  const y = 260 - ((w.elevation - 1400) / 1850) * 220;
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                }).join(' ');

                const areaPath = `M 50,260 L ${pointsStr} L 730,260 Z`;
                const linePath = `M ${pointsStr.replace(/ /g, ' L ')}`;

                return (
                  <g>
                    <path d={areaPath} fill="url(#eleGrad)" />
                    <path d={linePath} fill="none" stroke="var(--c-terracotta)" strokeWidth="2.5" />
                  </g>
                );
              })()}

              {/* 重要頂峰與地標點標註 */}
              {ALPS_WAYPOINTS.filter((w) => w.isStay || w.type === 'summit' || w.id === 'kassen-goya' || w.id === 'daikiretto-bottom').map((w) => {
                const x = 50 + (w.distKm / 38.3) * 680;
                const y = 260 - ((w.elevation - 1400) / 1850) * 220;

                return (
                  <g key={w.id} onClick={() => setSelectedWp(w)} style={{ cursor: 'pointer' }}>
                    <circle cx={x} cy={y} r={w.isStay ? 5 : 3.5} fill={w.isStay ? '#c2543b' : '#c9963e'} stroke="#fff" strokeWidth="1.5" />
                    <line x1={x} y1={y} x2={x} y2={y - 14} stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
                    <text
                      x={x}
                      y={y - 18}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight={w.isStay ? 'bold' : 'normal'}
                      fill={w.isStay ? '#c2543b' : '#333'}
                    >
                      {w.name}
                    </text>
                  </g>
                );
              })}

              {/* X 軸里程刻度 */}
              {[0, 5, 10, 15, 20, 25, 30, 35, 38.3].map((km) => {
                const x = 50 + (km / 38.3) * 680;
                return (
                  <g key={km}>
                    <line x1={x} y1="260" x2={x} y2="265" stroke="#999" />
                    <text x={x} y="278" textAnchor="middle" fontSize="9.5" fill="#888">{km}k</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* 山屋與地標明細列表 */}
      {activeTab === 'waypoints' && (
        <div className="journal-card" style={{ padding: '18px 20px', background: '#ffffff', borderRadius: 12, border: '1px solid var(--c-line)' }}>
          <div className="serif" style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-pine)', marginBottom: 12 }}>
            沿線山屋・山頂與補給點一覽（共 39 個航點）
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {ALPS_WAYPOINTS.map((wp) => (
              <div
                key={wp.id}
                onClick={() => { setSelectedWp(wp); setActiveTab('map'); }}
                style={{
                  padding: '9px 12px',
                  borderRadius: 8,
                  background: wp.isStay ? 'rgba(194,84,59,0.08)' : 'rgba(20,50,40,0.03)',
                  border: wp.isStay ? '1px solid rgba(194,84,59,0.25)' : '1px solid rgba(20,50,40,0.06)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 9.5,
                      fontWeight: 800,
                      background: wp.isStay ? 'var(--c-terracotta)' : 'var(--c-pine)',
                      color: '#ffffff',
                      padding: '1px 5px',
                      borderRadius: 4,
                    }}>
                      D{wp.day}
                    </span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--c-ink)' }}>
                      {wp.name}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--c-terracotta)' }}>
                    {wp.elevation}m
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--c-muted)', lineHeight: 1.35 }}>
                  {wp.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rockland 實戰攻略 ＆ YAMAP 離線雙備份教學 */}
      {activeTab === 'guide' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 雙備份教學卡 */}
          <div className="journal-card" style={{ padding: '18px 20px', background: '#fdfbf7', borderRadius: 12, border: '1px solid rgba(201,150,62,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>🛡️</span>
              <span className="serif" style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-pine)' }}>
                日本深山無網路訊號・離線 GPS 雙重保險方案
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--c-ink)', lineHeight: 1.6 }}>
              在日本北阿爾卑斯 3,000 米稜線上，常有大霧與無手機訊號區域。為確保萬無一失，請遵循以下<b>「雙重離線備份」</b>：
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginTop: 12 }}>
              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--c-line)' }}>
                <div style={{ fontWeight: 800, color: 'var(--c-pine)', fontSize: 13, marginBottom: 4 }}>
                  1. 本站離線 GPS 定位儀（免安裝）
                </div>
                <div style={{ fontSize: 12, color: 'var(--c-muted)', lineHeight: 1.5 }}>
                  • 手機已將本手帳存於離線單檔（或加入主畫面）。<br/>
                  • 點擊上方<b>「開啟即時 GPS 定位」</b>，手機硬體衛星天線即使在<b>飛航模式</b>亦可直接定位！
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--c-line)' }}>
                <div style={{ fontWeight: 800, color: 'var(--c-brass-dark)', fontSize: 13, marginBottom: 4 }}>
                  2. 日本官方標準 YAMAP App（出發前先下載）
                </div>
                <div style={{ fontSize: 12, color: 'var(--c-muted)', lineHeight: 1.5 }}>
                  • 於台灣先在 App Store / Google Play 下載 <b>YAMAP</b>。<br/>
                  • 搜尋並下載<b>《槍ヶ岳・穂高岳・燕岳》</b>離線等高線地圖。<br/>
                  • 點擊上方<b>「下載 GPX 航跡」</b>匯入 YAMAP，雙重比對最安心！
                </div>
              </div>
            </div>
          </div>

          {/* Rockland 實戰經驗彙整卡 */}
          <div className="journal-card" style={{ padding: '18px 20px', background: '#ffffff', borderRadius: 12, border: '1px solid var(--c-line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>📖</span>
                <span className="serif" style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-pine)' }}>
                  ROCKLAND 戶外健行專欄精華（表銀座自主規劃實測）
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href="https://www.rockland.com.tw/blog/posts/blog-travel-yarigatake"
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 11, color: 'var(--c-terracotta)', textDecoration: 'underline' }}
                >
                  閱讀上篇 ↗
                </a>
                <a
                  href="https://www.rockland.com.tw/blog/posts/blog-travel-yarigatake-2"
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 11, color: 'var(--c-terracotta)', textDecoration: 'underline' }}
                >
                  閱讀下篇 ↗
                </a>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: 'var(--c-ink-light)', lineHeight: 1.55 }}>
              <div>
                <b>🚌 9/24 登山口交通雙案對照（配合已訂住宿）：</b><br/>
                • <b>方案 A（早鳥班次）</b>：05:58 松本 JR ➔ 06:29 穗高 ➔ 06:40 巴士 ➔ 07:35 抵中房溫泉。最早起登，時間最充裕！<br/>
                • <b>方案 B（Rockland 實測搭乘）</b>：07:15 (或07:48) 松本 JR ➔ 08:18 穗高 ➔ 08:25 巴士 ➔ 09:20 抵中房溫泉。09:40 起登，約 14:30 抵達燕山莊，避開摸黑！
              </div>

              <div>
                <b>🏠 山屋水電生活指南：</b><br/>
                • <b>充電</b>：多數山莊需投幣 100 日幣，<b>槍岳山莊為免費充電</b>。建議攜帶小型行動電源與充電線即可。<br/>
                • <b>飲水</b>：住客在該山屋裝水皆免費；非住宿山屋需投幣約 200円/1L。每天出發前在山莊裝滿 1200ml。<br/>
                • <b>早晚餐時間</b>：通常晚餐 17:00、早餐 05:00 或 05:30。下午 15:00 前抵達山屋多能排到第一梯次用餐！
              </div>

              <div>
                <b>🎒 裝備與安全防護重點：</b><br/>
                • <b>岩盔與手套</b>：從東鎌尾根、槍之岳鐵梯、大切戶（長谷川峰、飛驒泣）到奧穗高岳，全程手腳並用，必須佩戴攀岩安全帽與防滑耐磨手套。<br/>
                • <b>風雨衣耐候</b>：9 月稜線氣溫日間約 15-20°C，入夜驟降至 7-10°C 伴隨強風。一件高規格 GORE-TEX 外層是安全保暖關鍵。<br/>
                • <b>大行李寄送</b>：9/23 於松本青旅將多餘行李透過黑貓寄至 9/28 Hostel Wasabi，全程僅背 35-50L 輕裝縱走！
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
