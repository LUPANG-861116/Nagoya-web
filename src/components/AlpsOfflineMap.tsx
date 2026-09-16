import { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

// Tile layers
type TileLayerId = 'gsi-std' | 'gsi-relief' | 'opentopo';

const TILE_LAYERS: { id: TileLayerId; name: string; url: string; maxZoom: number; attr: string }[] = [
  {
    id: 'gsi-std',
    name: '🇯🇵 國土地理院 1:25000 等高線地形圖 (官方標準)',
    url: 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png',
    maxZoom: 18,
    attr: '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">國土地理院 (GSI Japan)</a>',
  },
  {
    id: 'gsi-relief',
    name: '🏔️ 國土地理院 色別標高陰影地形圖',
    url: 'https://cyberjapandata.gsi.go.jp/xyz/relief/{z}/{x}/{y}.png',
    maxZoom: 15,
    attr: '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">國土地理院</a>',
  },
  {
    id: 'opentopo',
    name: '🌍 OpenTopoMap 國際登山等高線圖',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    maxZoom: 17,
    attr: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
];

export default function AlpsOfflineMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const gpsMarkerRef = useRef<L.CircleMarker | null>(null);
  const gpsCircleRef = useRef<L.Circle | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const [activeLayer, setActiveLayer] = useState<TileLayerId>('gsi-std');
  const [selectedWp, setSelectedWp] = useState<AlpineWaypoint | null>(ALPS_WAYPOINTS[6]); // Enzanso
  const [activeTab, setActiveTab] = useState<'topo' | 'elevation' | 'waypoints' | 'guide'>('topo');
  const [activeDayFilter, setActiveDayFilter] = useState<number | null>(null);

  // GPS State
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; altitude: number | null; accuracy: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);

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

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Center around Yarigatake / Enzanso (approx 36.34, 137.68)
    const map = L.map(mapContainerRef.current, {
      center: [36.35, 137.69],
      zoom: 12,
      zoomControl: true,
    });

    mapInstanceRef.current = map;

    // Add Initial Tile Layer (GSI standard topo)
    const currentLayerConfig = TILE_LAYERS[0];
    const tileLayer = L.tileLayer(currentLayerConfig.url, {
      maxZoom: currentLayerConfig.maxZoom,
      attribution: currentLayerConfig.attr,
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Layer group for markers
    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;

    // Draw Multi-stage Trail Polyline with Colors
    // D1 (中房 ~ 燕岳): green
    const d1Points: L.LatLngExpression[] = DENSE_TRAIL_POINTS.slice(0, 18).map(([lat, lng]) => [lat, lng]);
    L.polyline(d1Points, { color: '#2e7d32', weight: 5, opacity: 0.9 }).addTo(map);

    // D2 (燕山莊 ~ 槍岳): orange
    const d2Points: L.LatLngExpression[] = DENSE_TRAIL_POINTS.slice(17, 40).map(([lat, lng]) => [lat, lng]);
    L.polyline(d2Points, { color: '#e67e22', weight: 5, opacity: 0.9 }).addTo(map);

    // D3 (槍岳 ~ 大切戶 ~ 穗高岳山莊): crimson red (thick with hazard warning)
    const d3Points: L.LatLngExpression[] = DENSE_TRAIL_POINTS.slice(39, 53).map(([lat, lng]) => [lat, lng]);
    L.polyline(d3Points, { color: '#c0392b', weight: 6, opacity: 0.95 }).addTo(map);

    // D4 (穗高岳山莊 ~ 奧穗高 ~ 上高地): blue
    const d4Points: L.LatLngExpression[] = DENSE_TRAIL_POINTS.slice(52).map(([lat, lng]) => [lat, lng]);
    L.polyline(d4Points, { color: '#2980b9', weight: 5, opacity: 0.9 }).addTo(map);

    // Fit bounds to entire traverse
    const allCoords: L.LatLngExpression[] = DENSE_TRAIL_POINTS.map(([lat, lng]) => [lat, lng]);
    const bounds = L.latLngBounds(allCoords);
    map.fitBounds(bounds, { padding: [30, 30] });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when layer switch changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const cfg = TILE_LAYERS.find((l) => l.id === activeLayer) || TILE_LAYERS[0];
    const newLayer = L.tileLayer(cfg.url, {
      maxZoom: cfg.maxZoom,
      attribution: cfg.attr,
    }).addTo(map);
    tileLayerRef.current = newLayer;
  }, [activeLayer]);

  // Render Waypoint Markers on Leaflet
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;
    const group = markersGroupRef.current;
    group.clearLayers();

    const waypointsToShow = activeDayFilter
      ? ALPS_WAYPOINTS.filter((w) => w.day === activeDayFilter)
      : ALPS_WAYPOINTS;

    waypointsToShow.forEach((wp) => {
      const isStay = wp.isStay;
      const isPeak = wp.type === 'summit';
      const isDanger = wp.type === 'danger';
      const isWatermelon = wp.id === 'kassen-goya';

      // Custom HTML Marker Icon
      const iconHtml = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: ${isStay ? '30px' : isPeak ? '26px' : isDanger ? '24px' : '20px'};
          height: ${isStay ? '30px' : isPeak ? '26px' : isDanger ? '24px' : '20px'};
          border-radius: 50%;
          background: ${isStay ? '#c2543b' : isPeak ? '#c9963e' : isDanger ? '#d32f2f' : '#2e7d32'};
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          color: #ffffff;
          font-size: ${isStay ? '14px' : isPeak ? '12px' : '11px'};
          cursor: pointer;
        ">
          ${isStay ? '🏨' : isPeak ? '▲' : isWatermelon ? '🍉' : isDanger ? '⚠️' : '•'}
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-alpine-pin',
        iconSize: [isStay ? 30 : 22, isStay ? 30 : 22],
        iconAnchor: [isStay ? 15 : 11, isStay ? 15 : 11],
      });

      const marker = L.marker([wp.lat, wp.lng], { icon: customIcon });

      // Popup Content
      const popupContent = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; padding: 2px 4px;">
          <div style="font-weight: 800; font-size: 13.5px; color: ${isStay ? '#c2543b' : '#1e332a'}; margin-bottom: 2px;">
            ${isStay ? '★ ' : ''}${wp.name} <span style="font-size: 11px; color: #777;">(${wp.elevation}m)</span>
          </div>
          <div style="color: #666; font-size: 11px; margin-bottom: 4px;">${wp.nameJp} ｜ 里程 ${wp.distKm.toFixed(1)}km</div>
          ${isStay ? `<div style="background: rgba(194,84,59,0.12); color: #c2543b; font-weight: bold; padding: 2px 6px; border-radius: 4px; margin-bottom: 4px;">🏨 預約入住：${wp.stayDate}</div>` : ''}
          <div style="color: #333; margin-top: 4px;">${wp.desc}</div>
          ${wp.tips ? `<div style="color: #b78103; margin-top: 4px; font-weight: bold;">💡 ${wp.tips}</div>` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        setSelectedWp(wp);
      });

      group.addLayer(marker);
    });
  }, [activeDayFilter]);

  // Center map on selected waypoint
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedWp) return;
    mapInstanceRef.current.panTo([selectedWp.lat, selectedWp.lng], { animate: true });
  }, [selectedWp]);

  // GPS Tracking Logic
  const toggleGPS = () => {
    if (isGpsActive) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (gpsMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(gpsMarkerRef.current);
        gpsMarkerRef.current = null;
      }
      if (gpsCircleRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(gpsCircleRef.current);
        gpsCircleRef.current = null;
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
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const alt = pos.coords.altitude;
          const acc = pos.coords.accuracy;

          setGpsCoords({ lat, lng, altitude: alt, accuracy: acc });
          setGpsError(null);

          if (mapInstanceRef.current) {
            const map = mapInstanceRef.current;
            // Update or add GPS beacon
            if (!gpsMarkerRef.current) {
              gpsMarkerRef.current = L.circleMarker([lat, lng], {
                radius: 9,
                color: '#ffffff',
                weight: 3,
                fillColor: '#1e88e5',
                fillOpacity: 1,
              }).addTo(map);
            } else {
              gpsMarkerRef.current.setLatLng([lat, lng]);
            }

            // Accuracy circle
            if (!gpsCircleRef.current) {
              gpsCircleRef.current = L.circle([lat, lng], {
                radius: acc,
                color: '#1e88e5',
                weight: 1,
                fillColor: '#1e88e5',
                fillOpacity: 0.15,
              }).addTo(map);
            } else {
              gpsCircleRef.current.setLatLng([lat, lng]);
              gpsCircleRef.current.setRadius(acc);
            }

            map.panTo([lat, lng]);
          }
        },
        (err) => {
          console.warn('GPS Error:', err);
          setGpsError('尚未獲取衛星訊號（深山中請至空曠處，並確保允許瀏覽器位置權限）');
        },
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 }
      );
    }
  };

  // Simulate GPS
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
      accuracy: 8,
    });
    setSelectedWp(targetWp);

    if (mapInstanceRef.current) {
      const map = mapInstanceRef.current;
      if (!gpsMarkerRef.current) {
        gpsMarkerRef.current = L.circleMarker([targetWp.lat, targetWp.lng], {
          radius: 9,
          color: '#ffffff',
          weight: 3,
          fillColor: '#1e88e5',
          fillOpacity: 1,
        }).addTo(map);
      } else {
        gpsMarkerRef.current.setLatLng([targetWp.lat, targetWp.lng]);
      }
      map.setView([targetWp.lat, targetWp.lng], 14, { animate: true });
    }
  };

  // Reset View to full route
  const handleFitRoute = () => {
    if (!mapInstanceRef.current) return;
    const allCoords: L.LatLngExpression[] = DENSE_TRAIL_POINTS.map(([lat, lng]) => [lat, lng]);
    const bounds = L.latLngBounds(allCoords);
    mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30] });
  };

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 1. 頂部主控台 */}
      <div className="journal-card" style={{ padding: '16px 18px', background: '#ffffff', borderRadius: 14, border: '1px solid var(--c-line)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 20 }}>🏔️</span>
              <span className="serif" style={{ fontSize: 17.5, fontWeight: 800, color: 'var(--c-pine)' }}>
                北阿爾卑斯【表銀座＋槍穗連峰】等高線地形圖 ＆ 實時 GPS
              </span>
              <span style={{ fontSize: 10.5, background: 'rgba(59,109,79,0.12)', color: 'var(--c-pine)', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                國土地理院 1:25,000 等高線
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--c-muted)', marginTop: 3 }}>
              全長 38.3 km・中房溫泉 ➔ 燕岳 ➔ 大天井 ➔ 西岳 ➔ 槍之岳 ➔ 大切戶 ➔ 穗高岳 ➔ 上高地
            </div>
          </div>

          {/* 按鈕組 */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn-plain"
              onClick={toggleGPS}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '7px 13px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                background: isGpsActive ? '#2e7d32' : 'var(--c-pine)',
                color: '#ffffff',
                boxShadow: isGpsActive ? '0 0 10px rgba(46,125,50,0.5)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{isGpsActive ? '🛰️' : '📍'}</span>
              <span>{isGpsActive ? (isSimulated ? '模擬定位中' : '即時 GPS 追蹤中') : '開啟即時 GPS 定位'}</span>
            </button>

            <button
              className="btn-plain"
              onClick={handleFitRoute}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                background: 'rgba(20,50,40,0.06)',
                color: 'var(--c-pine)',
              }}
            >
              🔍 全線置中
            </button>

            <button
              className="btn-plain"
              onClick={handleDownloadGPX}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '7px 13px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                background: 'rgba(201,150,62,0.15)',
                color: 'var(--c-brass-dark)',
                border: '1px solid rgba(201,150,62,0.3)',
              }}
            >
              <span>📥</span>
              <span>下載 GPX 航跡</span>
            </button>
          </div>
        </div>

        {/* GPS 狀態 */}
        {isGpsActive && (
          <div style={{
            marginTop: 12,
            padding: '9px 12px',
            borderRadius: 8,
            background: 'rgba(46,125,50,0.06)',
            border: '1px solid rgba(46,125,50,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            fontSize: 11.8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <span style={{ color: '#2e7d32', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="pulse-dot" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#2e7d32' }}></span>
                {isSimulated ? '🧪 模擬測試模式（桌機／室內預覽）' : '🛰️ 硬體衛星晶片連線中（離線無訊號亦可定位）'}
              </span>
              {gpsCoords && (
                <span style={{ color: 'var(--c-muted)', fontSize: 10.5 }}>
                  精度: ±{Math.round(gpsCoords.accuracy)}m ｜ {gpsCoords.lat.toFixed(4)}°N, {gpsCoords.lng.toFixed(4)}°E
                </span>
              )}
            </div>

            {gpsCoords && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, color: 'var(--c-ink)', fontWeight: 600, fontSize: 12 }}>
                <div>
                  當前海拔：<span style={{ color: 'var(--c-terracotta)', fontWeight: 800 }}>{gpsCoords.altitude !== null ? `${Math.round(gpsCoords.altitude)} m` : '計算中'}</span>
                </div>
                {nearestWaypoint && (
                  <div>
                    最近目標：<b>{nearestWaypoint.waypoint.name}</b>（約 <span style={{ color: 'var(--c-pine)', fontWeight: 800 }}>{nearestWaypoint.distanceKm < 1 ? `${Math.round(nearestWaypoint.distanceKm * 1000)}m` : `${nearestWaypoint.distanceKm.toFixed(1)}km`}</span>）
                  </div>
                )}
              </div>
            )}

            {gpsError && (
              <div style={{ color: '#c2543b', fontSize: 11 }}>
                ⚠️ {gpsError}
              </div>
            )}

            <div style={{ fontSize: 10.5, color: 'var(--c-muted)', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span>測試模擬定位：</span>
              <button className="btn-plain" onClick={() => simulateGps(ALPS_WAYPOINTS[6])} style={{ textDecoration: 'underline', color: 'var(--c-pine)', cursor: 'pointer', fontSize: 10.5 }}>
                燕山莊 (2712m)
              </button>
              <span>・</span>
              <button className="btn-plain" onClick={() => simulateGps(ALPS_WAYPOINTS[16])} style={{ textDecoration: 'underline', color: 'var(--c-pine)', cursor: 'pointer', fontSize: 10.5 }}>
                槍岳山莊 (3080m)
              </button>
              <span>・</span>
              <button className="btn-plain" onClick={() => simulateGps(ALPS_WAYPOINTS[25])} style={{ textDecoration: 'underline', color: 'var(--c-pine)', cursor: 'pointer', fontSize: 10.5 }}>
                穗高岳山莊 (2996m)
              </button>
            </div>
          </div>
        )}

        {/* 標籤頁與圖層選擇列 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 12, borderTop: '1px solid var(--c-line)', paddingTop: 10 }}>
          {/* 主分頁 */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'topo', label: '🗺️ 實景等高線地圖 (Leaflet)' },
              { id: 'elevation', label: '📈 高度縱剖面圖' },
              { id: 'waypoints', label: '🏠 39處山屋與地標' },
              { id: 'guide', label: '🧗 Rockland 攻略 ＆ YAMAP 雙保險' },
            ].map((tab) => (
              <button
                key={tab.id}
                className="btn-plain"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 6,
                  fontSize: 11.5,
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

          {/* 地形圖層下拉/切換 (當前為 topo 視圖時) */}
          {activeTab === 'topo' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--c-muted)', fontWeight: 600 }}>圖層：</span>
              <select
                value={activeLayer}
                onChange={(e) => setActiveLayer(e.target.value as TileLayerId)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontFamily: 'inherit',
                  border: '1px solid var(--c-line)',
                  background: '#ffffff',
                  color: 'var(--c-ink)',
                  cursor: 'pointer',
                }}
              >
                {TILE_LAYERS.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 2. 核心內容區 */}
      {activeTab === 'topo' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 300px', gap: 14 }}>
          {/* 左側：Leaflet 地圖容器 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* 天數過濾小標籤 */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <button
                className="btn-plain"
                onClick={() => setActiveDayFilter(null)}
                style={{
                  padding: '2px 8px',
                  borderRadius: 10,
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
                { day: 4, label: 'D1: 中房➔燕岳 (宿燕山莊)', color: '#2e7d32' },
                { day: 5, label: 'D2: 燕山莊➔槍岳 (宿槍岳)', color: '#e67e22' },
                { day: 6, label: 'D3: 大切戶➔北穗➔穗高岳 (宿穗高岳)', color: '#c0392b' },
                { day: 7, label: 'D4: 奧穗➔岳澤➔上高地 (宿朴之木)', color: '#2980b9' },
              ].map((d) => (
                <button
                  key={d.day}
                  className="btn-plain"
                  onClick={() => setActiveDayFilter(activeDayFilter === d.day ? null : d.day)}
                  style={{
                    padding: '2px 8px',
                    borderRadius: 10,
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

            {/* Leaflet DOM 節點 */}
            <div
              ref={mapContainerRef}
              style={{
                width: '100%',
                height: 520,
                borderRadius: 12,
                border: '1px solid rgba(20,50,40,0.15)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                zIndex: 1,
              }}
            />

            <div style={{ fontSize: 10.5, color: 'var(--c-muted)', display: 'flex', justifyContent: 'space-between', padding: '0 4px' }}>
              <span>💡 滑動滾輪或手勢可無限縮放至 1:25000 詳細等高線與岩壁陰影</span>
              <span>圖資來源：日本國土地理院・OpenTopoMap</span>
            </div>
          </div>

          {/* 右側：選中航點情報卡 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {selectedWp ? (
              <div className="journal-card" style={{ padding: '14px 16px', background: '#ffffff', borderRadius: 12, border: '1px solid var(--c-line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <span style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      background: selectedWp.isStay ? 'var(--c-terracotta)' : 'var(--c-pine)',
                      color: '#ffffff',
                      padding: '1px 5px',
                      borderRadius: 4,
                    }}>
                      Day {selectedWp.day}
                    </span>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-ink)', marginTop: 3 }}>
                      {selectedWp.name}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--c-muted)' }}>
                      {selectedWp.nameJp}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-terracotta)' }}>
                      {selectedWp.elevation}m
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--c-muted)' }}>
                      里程 {selectedWp.distKm.toFixed(1)} km
                    </div>
                  </div>
                </div>

                {selectedWp.isStay && (
                  <div style={{ background: 'rgba(194,84,59,0.1)', padding: '5px 8px', borderRadius: 6, fontSize: 11, color: 'var(--c-terracotta)', fontWeight: 700, marginBottom: 6 }}>
                    🏨 預約入住日：{selectedWp.stayDate}
                  </div>
                )}

                <div style={{ fontSize: 11.5, color: 'var(--c-ink-light)', lineHeight: 1.45, marginBottom: 8 }}>
                  {selectedWp.desc}
                </div>

                {selectedWp.tips && (
                  <div style={{ background: 'rgba(201,150,62,0.1)', padding: '6px 8px', borderRadius: 6, fontSize: 11, color: 'var(--c-brass-dark)', lineHeight: 1.35, marginBottom: 8 }}>
                    💡 <b>攻略重點：</b>{selectedWp.tips}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 10.5, color: 'var(--c-muted)', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 6 }}>
                  <div>💧 水源：{selectedWp.water ? '✅ 有生飲水' : '⚠️ 需山屋補給'}</div>
                  <div>📡 訊號：{selectedWp.elevation > 2800 ? '📶 稜線部分有' : '📵 谷底無訊號'}</div>
                  <div>🌐 {selectedWp.lat.toFixed(4)}°N</div>
                  <div>🌐 {selectedWp.lng.toFixed(4)}°E</div>
                </div>
              </div>
            ) : (
              <div className="journal-card" style={{ padding: 16, textAlign: 'center', color: 'var(--c-muted)', fontSize: 11.5 }}>
                點擊地圖上的圓點可查看詳細情報
              </div>
            )}

            {/* 4 天縱走段落速查卡 */}
            <div className="journal-card" style={{ padding: '12px 14px', background: '#ffffff', borderRadius: 12, border: '1px solid var(--c-line)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="serif" style={{ fontSize: 13, fontWeight: 800, color: 'var(--c-pine)' }}>
                表銀座槍穗核心指標
              </div>
              {[
                { d: '9/24 D1', title: '中房 ➔ 燕岳 ➔ 燕山莊', stats: '5.5km・+1250m・宿 燕山莊' },
                { d: '9/25 D2', title: '燕山莊 ➔ 東鎌 ➔ 槍岳', stats: '14.4km・+870m/-500m・宿 槍岳山莊' },
                { d: '9/26 D3', title: '槍岳 ➔ 大切戶 ➔ 穗高岳', stats: '8.4km・日本最難岩稜・宿 穗高岳山莊' },
                { d: '9/27 D4', title: '奧穗 ➔ 岳澤 ➔ 上高地', stats: '10.0km・-1690m・宿 朴之木平' },
              ].map((item, idx) => (
                <div key={idx} style={{ fontSize: 11, padding: '4px 6px', borderRadius: 5, background: 'rgba(20,50,40,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span style={{ color: 'var(--c-pine)' }}>{item.d}</span>
                    <span style={{ color: 'var(--c-ink)' }}>{item.title}</span>
                  </div>
                  <div style={{ color: 'var(--c-muted)', fontSize: 10 }}>{item.stats}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 高度縱剖面圖 */}
      {activeTab === 'elevation' && (
        <div className="journal-card" style={{ padding: '18px 20px', background: '#ffffff', borderRadius: 12, border: '1px solid var(--c-line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div>
              <span className="serif" style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--c-pine)' }}>
                表銀座 38.3 km 高度縱剖面圖（海拔 1,462m ➔ 3,190m ➔ 1,500m）
              </span>
              <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 2 }}>
                合戰尾根急登、東鎌尾根天梯、天槍頂峰、大切戶 300 米 V 字斷崖與奧穗高岳
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
                  <g key={w.id} onClick={() => { setSelectedWp(w); setActiveTab('topo'); }} style={{ cursor: 'pointer' }}>
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

      {/* 39 處山屋與地標明細 */}
      {activeTab === 'waypoints' && (
        <div className="journal-card" style={{ padding: '16px 18px', background: '#ffffff', borderRadius: 12, border: '1px solid var(--c-line)' }}>
          <div className="serif" style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--c-pine)', marginBottom: 10 }}>
            表銀座 39 處山屋・頂峰與補給點一覽
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
            {ALPS_WAYPOINTS.map((wp) => (
              <div
                key={wp.id}
                onClick={() => { setSelectedWp(wp); setActiveTab('topo'); }}
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  background: wp.isStay ? 'rgba(194,84,59,0.08)' : 'rgba(20,50,40,0.03)',
                  border: wp.isStay ? '1px solid rgba(194,84,59,0.25)' : '1px solid rgba(20,50,40,0.06)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{
                      fontSize: 9,
                      fontWeight: 800,
                      background: wp.isStay ? 'var(--c-terracotta)' : 'var(--c-pine)',
                      color: '#ffffff',
                      padding: '1px 4px',
                      borderRadius: 3,
                    }}>
                      D{wp.day}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-ink)' }}>
                      {wp.name}
                    </span>
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--c-terracotta)' }}>
                    {wp.elevation}m
                  </span>
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--c-muted)', lineHeight: 1.3 }}>
                  {wp.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rockland 實戰攻略 ＆ YAMAP 雙保險教學 */}
      {activeTab === 'guide' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* 等高線地圖核心真相 */}
          <div className="journal-card" style={{ padding: '16px 18px', background: '#fdfbf7', borderRadius: 12, border: '1px solid rgba(201,150,62,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>🗺️</span>
              <span className="serif" style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--c-pine)' }}>
                為什麼真正的登山離線地圖「一定要有等高線」？
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--c-ink)', lineHeight: 1.6 }}>
              您說得完全沒錯！高山縱走中，單純的路線示意圖只能看方向，<b>真正的登山安全命脈在於「等高線（Contour Lines）」與「地形陰影（Relief）」</b>：<br/>
              • <b>濃霧中判別稜線 vs 懸崖</b>：在槍岳、大切戶（長谷川峰、飛驒泣）路段，兩側都是垂直斷崖，密集的等高線代表致命深淵，能即時提醒山友不可偏離刃脊。<br/>
              • <b>體能配速</b>：合戰尾根在短短 4 公里內等高線密集成黑帶（爬升 1,250m），代表每一步都需均勻呼吸節奏。
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10, marginTop: 10 }}>
              <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--c-line)' }}>
                <div style={{ fontWeight: 800, color: 'var(--c-pine)', fontSize: 12.5, marginBottom: 3 }}>
                  1. 本站內建國土地理院等高線圖層
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--c-muted)', lineHeight: 1.45 }}>
                  • 切換上方「圖層」下拉選單，即可直接調用<b>日本國土地理院 1:25,000 官方等高線圖</b>與<b>色別標高陰影圖</b>。<br/>
                  • 出發前將地圖瀏覽一遍，瀏覽器即會自動快取圖資。
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--c-line)' }}>
                <div style={{ fontWeight: 800, color: 'var(--c-brass-dark)', fontSize: 12.5, marginBottom: 3 }}>
                  2. 極端環境必備：YAMAP App 雙重離線備份
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--c-muted)', lineHeight: 1.45 }}>
                  • 手機瀏覽器在螢幕鎖定時會休眠，<b>無法在口袋中發出偏離步道警報</b>。<br/>
                  • 建議出發前在台灣安裝 <b>YAMAP</b>，免費下載《槍ヶ岳・穂高岳・燕岳》離線包，並匯入本站 GPX，形成最安全的雙保險！
                </div>
              </div>
            </div>
          </div>

          {/* Rockland 實戰經驗彙整 */}
          <div className="journal-card" style={{ padding: '16px 18px', background: '#ffffff', borderRadius: 12, border: '1px solid var(--c-line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 16 }}>📖</span>
                <span className="serif" style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-pine)' }}>
                  ROCKLAND 戶外健行專欄精華
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11.8, color: 'var(--c-ink-light)', lineHeight: 1.5 }}>
              <div>
                • <b>9/24 登山口交通雙案</b>：方案 A (05:58 松本 JR 接 06:40 巴士，07:35 抵中房溫泉)；方案 B (Rockland 實測 07:15/07:48 松本 JR 接 08:25 巴士，09:20 抵中房溫泉，約 14:30 抵燕山莊)。
              </div>
              <div>
                • <b>山屋水電與收費</b>：住客裝生飲水免費；充電多投幣 100 日幣，<b>槍岳山莊為免費充電區</b>。早晚餐梯次以抵達順序安排，建議 15:00 前抵達山莊。
              </div>
              <div>
                • <b>大切戶與東鎌尾根安全</b>：全段必須配戴岩盔與耐磨手套，收好登山杖，遵守三點不動原則。
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
