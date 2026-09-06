import { entities } from '../data';
import { useTripState } from '../state/store';
import { useReveal } from '../lib/useReveal';

const ROWS = [
  { name: '中部機場・名驛', en: 'AIRPORT / NAGOYA STN', badge: '✈️ 起訖樞紐', pts: '星宇 JX838/839・名鐵特急 μ-SKY・JR 高島屋・ESCA 地下街・味仙・世界的山將', match: ['中部國際機場', '名古屋站', '名驛地下街'] },
  { name: '白川鄉・飛驒高山', en: 'SHIRAKAWA-GO / TAKAYAMA', badge: '🚌 9/22 漫遊', pts: '世界遺產荻町合掌村・城山天守閣展望台・和田家・飛驒牛・濃飛特急巴士', match: ['白川鄉', '高山'] },
  { name: '信州松本・國寶城', en: 'MATSUMOTO JOKAMACHI', badge: '🏨 9/22-23 宿', pts: '國寶松本城・草間彌生美術館・繩手通・中町通・石井運動・山賊燒・黑貓宅急便寄行李', match: ['松本', '松本城', '中町通', '繩手通', '松本市美術館'] },
  { name: '表銀座縱走・燕岳', en: 'OMOTE-GINZA / TSUBKURO', badge: '🏔️ 9/24 宿燕山莊', pts: '中房溫泉登山口・三大急登合戰尾根・合戰西瓜・燕山莊・燕岳 2763m 海豚岩', match: ['穗高站', '中房溫泉', '合戰尾根', '燕岳', '燕山莊', '安曇野/表銀座', '表銀座'] },
  { name: '槍岳・大切戶・穗高', en: 'YARI & HOTAKA RIDGE', badge: '🏔️ 9/25-26 極限', pts: '大天井・西岳・槍之岳 3180m・南岳・大切戶刃脊岩稜・北穗高岳・奧穗高岳 3190m・穗高岳山莊', match: ['表銀座稜線', '大天井岳', '西岳', '槍岳山莊', '槍之岳', '南岳小屋', '大切戶 (Daikiretto)', '長谷川峰', '北穗高岳', '涸澤岳', '穗高岳山莊', '奧穗高岳', '前穗高岳', '重太郎新道', '岳澤', '槍穗連峰'] },
  { name: '上高地・平湯溫泉・乘鞍', en: 'KAMIKOCHI / HIRAYU / NORIKURA', badge: '♨️ 9/27 宿平湯', pts: '河童橋・梓川碧水・平湯溫泉ひらゆの森・乘鞍畳平 2702m・單攻劍峰 3026m・平湯大瀑布・9/28返名驛', match: ['上高地', '平湯溫泉', '乘鞍高原', '乘鞍畳平', '剣ヶ峰', '平湯大瀑布', '奧飛驒溫泉鄉'] },
  { name: '黑部立山・吉卜力・榮', en: 'TATEYAMA / GHIBLI / SAKAE', badge: '🌟 9/29-10/2', pts: 'KKday 653075 黑部立山2天1夜・吉卜力公園・熱田神宮・蓬萊軒鰻魚・中日大樓・綠洲21', match: ['立山黑部阿爾卑斯路線', '富山/長野', '黑部水壩', '大觀峰', '扇澤', '吉卜力大倉庫', '魔女之谷', '幽靈之里', 'Dondoko森林', '熱田神宮', '白鳥庭園', '榮商圈', '綠洲21', '熱田', '愛知長久手'] },
];

export default function AreaRail({ highlightAreas, showCounts }: {
  highlightAreas: string[] | null; showCounts: boolean;
}) {
  const { favs } = useTripState();
  const revealRef = useReveal();
  const favIn = (area: string) =>
    entities.filter((e) => e.area === area && favs[`fav:${e.id}`]).length;

  return (
    <div ref={revealRef} className="area-rail" style={{ display: 'flex', flexDirection: 'column' }}>
      {ROWS.map((r, idx) => {
        const hl = !!highlightAreas && r.match.some((m) => highlightAreas.includes(m));
        const count = r.match.reduce((n, m) => n + favIn(m), 0);
        return (
          <div key={r.name} className="area-rail-row" style={{ display: 'flex', gap: 16, alignItems: 'stretch', '--rail-delay': `${Math.min(idx * 60, 300)}ms` } as React.CSSProperties}>
            <div style={{ flex: 'none', width: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="area-rail-line" style={{ width: 3, flex: 1, background: 'var(--red-lt)' }} />
              <div className="area-rail-dot" style={{
                flex: 'none', width: r.badge ? 16 : 12, height: r.badge ? 16 : 12, borderRadius: '50%',
                background: hl ? 'var(--red)' : 'var(--card)',
                border: `3px solid ${r.badge ? 'var(--red)' : 'var(--red-lt)'}`,
              }} />
              <div className="area-rail-line" style={{ width: 3, flex: 1, background: 'var(--red-lt)' }} />
            </div>
            <div style={{
              flex: 1, margin: '6px 0', padding: '12px 16px', borderRadius: 8,
              border: hl ? '1px solid var(--red)' : '1px solid rgba(41,35,26,.12)',
              background: hl ? 'rgba(178,58,30,.06)' : 'rgba(255,255,255,.4)',
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span className="serif" style={{ fontSize: 16, fontWeight: 800 }}>{r.name}</span>
                <span style={{ fontSize: 10.5, letterSpacing: '.18em', color: 'var(--brown)' }}>{r.en}</span>
                {r.badge && <span style={{ fontSize: 12 }}>{r.badge}</span>}
                {showCounts && count > 0 && (
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--red)', border: '1px solid rgba(178,58,30,.4)', borderRadius: 999, padding: '1px 8px' }}>♥ {count}</span>
                )}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--brown-dk)', marginTop: 2 }}>{r.pts}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}