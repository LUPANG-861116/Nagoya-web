import AreaRail from '../components/AreaRail';
import JourneyRouteMap from '../components/JourneyRouteMap';

export default function AreaMap() {
  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. 北阿爾卑斯與中部長征全景足跡路線圖 */}
      <JourneyRouteMap
        activeDay={1}
        onSelectDay={(d) => {
          sessionStorage.setItem('selected_day_idx', String(d - 1));
          window.location.hash = `plan/day-${d}`;
        }}
      />

      {/* 2. 縱走動線與區域特色推薦 */}
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
    </div>
  );
}