import { useState, useEffect, type CSSProperties } from 'react';
import { useItinerary } from '../state/itinerary';
import { configured } from '../api/state';
import type { DaySlot } from '../data/schema';
import AreaRail from '../components/AreaRail';
import Reveal from '../components/Reveal';
import EntityPicker from '../components/EntityPicker';
import JourneyRouteMap from '../components/JourneyRouteMap';

type View = 'timeline' | 'cards' | 'map';
const VIEWS: [View, string][] = [['timeline', '時間軸'], ['cards', '卡片'], ['map', '手繪路徑圖']];

function parseDayIdxFromLocation(daysLength = 13): number {
  const hash = window.location.hash;
  const match = hash.match(/plan\/(?:day-?)?(\d+)/i) || hash.match(/plan[?&]day=(\d+)/i);
  if (match) {
    const n = parseInt(match[1], 10);
    if (!isNaN(n)) {
      if (n >= 1 && n <= daysLength) return n - 1;
      if (n >= 0 && n < daysLength) return n;
    }
  }
  const stored = sessionStorage.getItem('selected_day_idx');
  if (stored !== null) {
    const n = parseInt(stored, 10);
    if (!isNaN(n) && n >= 0 && n < daysLength) return n;
  }
  return 0;
}

export default function DailyPlan() {
  const { days, saving, updateSlot, addSlot, removeSlot, moveSlot, save, reset } = useItinerary();
  const [dayIdx, setDayIdx] = useState(() => parseDayIdxFromLocation(days.length));
  const [view, setView] = useState<View>('timeline');
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const onHash = () => {
      const idx = parseDayIdxFromLocation(days.length);
      setDayIdx(idx);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [days.length]);

  const handleSelectDay = (i: number) => {
    setDayIdx(i);
    sessionStorage.setItem('selected_day_idx', String(i));
    window.history.replaceState(null, '', `#plan/day-${i + 1}`);
  };

  const day = days[dayIdx] ?? days[0];
  const canEdit = configured();

  const onSave = async () => {
    setMsg(null);
    try { await save(); setMsg('已提交，網站將於重建後更新'); setEditing(false); }
    catch (e) { setMsg(e instanceof Error ? e.message : '提交失敗'); }
  };
  const onCancel = () => { reset(); setEditing(false); setMsg(null); };

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="plan-head" style={{ background: '#ffffff', borderRadius: 14, border: '1px solid var(--c-line)', padding: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <div className="hscroll plan-days" style={{ gap: 8 }}>
          {days.map((d, i) => {
            const [date, dow] = d.date.split(/\s+/);
            const isCur = dayIdx === i;
            return (
              <button key={d.label} className="btn-plain plan-day" onClick={() => handleSelectDay(i)} style={{
                background: isCur ? 'var(--c-pine)' : 'rgba(20,50,40,0.04)',
                color: isCur ? '#ffffff' : 'var(--c-ink)',
                border: isCur ? '2px solid var(--c-brass)' : '1px solid var(--c-line)',
                borderRadius: 10, cursor: 'pointer', textAlign: 'center', padding: '6px 12px', minWidth: 64,
                boxShadow: isCur ? '0 4px 12px rgba(20,50,40,0.25)' : 'none',
                transition: 'all 0.15s ease',
              }}>
                <span style={{ display: 'block', fontSize: 10.5, letterSpacing: '.06em', opacity: isCur ? 0.9 : 0.75, color: isCur ? 'var(--c-brass-light)' : 'inherit' }}>
                  {date}{dow && <span className="plan-day-dow"> {dow}</span>}
                </span>
                <span className="serif" style={{ display: 'block', fontSize: 15, fontWeight: 800 }}>{d.label}</span>
              </button>
            );
          })}
        </div>
        <div className="plan-views" style={{ borderLeft: '1px solid var(--c-line)', paddingLeft: 10 }}>
          {VIEWS.map(([k, label]) => (
            <button key={k} className="btn-plain" onClick={() => setView(k)} style={{
              background: view === k ? 'var(--c-brass)' : 'transparent',
              color: view === k ? '#143228' : 'var(--c-ink)',
              padding: '7px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', borderRadius: 8,
              border: view === k ? '1px solid var(--c-brass-light)' : 'none',
              boxShadow: view === k ? '0 2px 8px rgba(201,150,62,0.3)' : 'none',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {view === 'timeline' && (
        <div className="card plan-card">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 8, paddingBottom: 10, borderBottom: '1px solid var(--line)' }}>
            <span className="serif" style={{ fontSize: 20, fontWeight: 800, color: 'var(--red)' }}>{day.label}</span>
            <span className="serif" style={{ fontSize: 16, fontWeight: 700 }}>{day.theme}</span>
            {/* 星期只在這裡出現一次——日期（09/30）已在上方選中的日期鈕上，手機為了讓 5 天排得下而隱去星期。 */}
            <span style={{ fontSize: 11.5, color: 'var(--brown)', letterSpacing: '.04em' }}>
              {[day.date.split(/\s+/)[1], ...(day.areas || [])].filter(Boolean).join('・')}
            </span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
              {canEdit ? (
                editing ? (
                  <>
                    <button className="btn-plain" onClick={onCancel} disabled={saving} style={editBtn(false)}>取消</button>
                    <button className="btn-plain" onClick={onSave} disabled={saving} style={editBtn(true)}>
                      {saving ? '提交中…' : '儲存並提交'}
                    </button>
                  </>
                ) : (
                  <button className="btn-plain" onClick={() => setEditing(true)} style={editBtn(false)}>編輯</button>
                )
              ) : (
                <span style={{ fontSize: 11.5, color: 'var(--brown-lt)' }}>登入後可編輯</span>
              )}
            </div>
          </div>

          {msg && (
            <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--brown-dk)' }}>{msg}</div>
          )}

          {editing ? (
            <EditableSlots dayIdx={dayIdx} slots={day.slots}
              onUpdate={updateSlot} onAdd={addSlot} onRemove={removeSlot} onMove={moveSlot} />
          ) : (
            <div style={{ marginTop: 2 }}>
              {day.slots.map((s, i) => (
                <div key={i} className={`plan-slot${s.pending ? ' plan-slot--pending' : ''}`}>
                  <div className="plan-slot-head">
                    <span className="plan-time">{s.time}</span>
                    {s.pending ? (
                      <span className="plan-title">待安排</span>
                    ) : (
                      <span
                        className="plan-title"
                        style={{
                          color: 'var(--ink)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontWeight: 700,
                        }}
                      >
                        {s.title}
                      </span>
                    )}
                  </div>
                  {(s.pending || s.note) && (
                    <div className="plan-note">
                      {s.pending ? (
                        '空白時段，到 Obsidian 填 — 或從美食庫挑一間'
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
                          {s.note.split('\n').filter(Boolean).map((line, lIdx) => {
                            const cleanLine = line.replace(/^[•\-\*\s]+/, '');
                            return (
                              <div key={lIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                <span style={{ color: 'var(--c-terracotta)', fontWeight: 800, fontSize: 13, lineHeight: '18px' }}>•</span>
                                <span style={{ fontSize: 12.5, lineHeight: '18px', color: 'var(--c-ink-light)' }}>
                                  {cleanLine}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(205px, 1fr))', gap: 12 }}>
          {days.map((d, i) => (
            <Reveal key={d.label} index={i}>
            <div
              className="card"
              onClick={() => handleSelectDay(i)}
              style={{
                padding: '16px 18px',
                borderColor: i === dayIdx ? 'var(--c-terracotta)' : undefined,
                borderWidth: i === dayIdx ? 2 : 1,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '2px solid var(--ink)', paddingBottom: 8 }}>
                <span className="serif" style={{ fontSize: 17, fontWeight: 800 }}>{d.label}</span>
                <span style={{ fontSize: 11, color: 'var(--brown)', letterSpacing: '.06em' }}>{d.date}</span>
              </div>
              <div className="serif" style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-terracotta)', marginTop: 10 }}>{d.theme}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                {d.slots.map((s, j) => (
                  <div key={j} style={{
                    fontSize: 12.5, lineHeight: 1.5,
                    color: s.pending ? 'var(--brown-lt)' : 'var(--ink)',
                    ...(s.pending ? { border: '1px dashed rgba(41,35,26,.25)', borderRadius: 6, padding: '5px 9px' } : { padding: '2px 0' }),
                  }}>
                    <span style={{ fontWeight: 700, color: 'var(--brown)', fontSize: 11, letterSpacing: '.05em' }}>{s.time}</span>{' '}
                    {s.pending ? (
                      '待安排'
                    ) : (
                      <span style={{ color: 'inherit', fontWeight: 600 }}>
                        {s.title}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            </Reveal>
          ))}
        </div>
      )}

      {view === 'map' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <JourneyRouteMap activeDay={dayIdx + 1} onSelectDay={(d) => handleSelectDay(d - 1)} />
          <div className="card plan-card" style={{ background: '#ffffff', borderRadius: 14, border: '1px solid var(--c-line)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
              <span className="serif" style={{ fontSize: 20, fontWeight: 800, color: 'var(--c-pine)' }}>{day.label}</span>
              <span style={{ fontSize: 13, color: 'var(--c-muted)', fontWeight: 600 }}>{day.theme}・當日活動區域</span>
            </div>
            <AreaRail highlightAreas={day.areas || []} showCounts={false} />
          </div>
        </div>
      )}
    </div>
  );
}

function editBtn(primary: boolean): CSSProperties {
  return {
    padding: '6px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', borderRadius: 8,
    background: primary ? 'var(--red)' : 'transparent',
    color: primary ? '#F7F2E6' : 'var(--ink)',
    border: `1px solid ${primary ? 'var(--red)' : 'rgba(41,35,26,.3)'}`,
  };
}

function EditableSlots({ dayIdx, slots, onUpdate, onAdd, onRemove, onMove }: {
  dayIdx: number; slots: DaySlot[];
  onUpdate: (di: number, si: number, patch: Partial<DaySlot>) => void;
  onAdd: (di: number) => void;
  onRemove: (di: number, si: number) => void;
  onMove: (di: number, si: number, dir: -1 | 1) => void;
}) {
  const field: CSSProperties = {
    fontFamily: 'inherit', fontSize: 13, padding: '6px 8px',
    border: '1px solid var(--line-dark)', borderRadius: 6, background: 'var(--card)', color: 'var(--ink)',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
      {slots.map((s, i) => (
        <div key={i} className="slot-edit-row">
          <input style={field} value={s.time} placeholder="時段"
            onChange={(e) => onUpdate(dayIdx, i, { time: e.target.value })} />
          <EntityPicker
            value={s.pending ? '' : s.title}
            placeholder={s.pending ? '待安排' : '標題（可打字或選單）'}
            disabled={s.pending}
            onChangeTitle={(title) => onUpdate(dayIdx, i, { title })}
            onPick={(entity) => onUpdate(dayIdx, i, { title: entity.name, ...(!s.note.trim() ? { note: entity.area } : {}) })}
          />
          <input style={{ ...field, opacity: s.pending ? .5 : 1 }} value={s.pending ? '' : s.note} placeholder="備註"
            disabled={s.pending}
            onChange={(e) => onUpdate(dayIdx, i, { note: e.target.value })} />
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <label style={{ fontSize: 11, color: 'var(--brown)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <input type="checkbox" checked={s.pending}
                onChange={(e) => onUpdate(dayIdx, i, { pending: e.target.checked })} />待安排
            </label>
            <button className="btn-plain" title="上移" onClick={() => onMove(dayIdx, i, -1)} style={iconBtn}>↑</button>
            <button className="btn-plain" title="下移" onClick={() => onMove(dayIdx, i, 1)} style={iconBtn}>↓</button>
            <button className="btn-plain" title="刪除" onClick={() => onRemove(dayIdx, i)} style={{ ...iconBtn, color: 'var(--red)' }}>✕</button>
          </div>
        </div>
      ))}
      <button className="btn-plain" onClick={() => onAdd(dayIdx)} style={{
        alignSelf: 'flex-start', padding: '6px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
        borderRadius: 8, border: '1px dashed rgba(41,35,26,.4)', background: 'transparent', color: 'var(--ink)',
      }}>＋ 新增時段</button>
    </div>
  );
}

const iconBtn: CSSProperties = {
  width: 26, height: 26, cursor: 'pointer', borderRadius: 6,
  border: '1px solid rgba(41,35,26,.25)', background: 'var(--card)', color: 'var(--ink)', fontSize: 13,
};
