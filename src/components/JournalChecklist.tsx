import WashiTape from './WashiTape';
import { useTripState } from '../state/store';
import { todos } from '../data';

export default function JournalChecklist() {
  const { todosState, toggleTodo } = useTripState();
  const doneCount = todos.filter((t) => todosState[t.key] ?? t.checkedInVault).length;

  return (
    <div className="journal-card" style={{ position: 'relative', background: 'var(--bg-note)', borderLeft: '4px solid var(--c-brass)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <WashiTape color="yellow" angle={1} width={80} top={-10} right={20} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span className="serif" style={{ fontSize: 17, fontWeight: 800, color: 'var(--c-pine)' }}>
            🎒 裝備與行前備忘清單
          </span>
          <span className="handwriting" style={{ fontSize: 18, color: 'var(--c-brass-dark)', fontWeight: 700 }}>
            Checklist
          </span>
        </div>
        <span style={{
          background: doneCount === todos.length ? 'var(--c-pine)' : 'rgba(201,150,62,0.18)',
          color: doneCount === todos.length ? '#ffffff' : 'var(--c-brass-dark)',
          fontSize: 11.5,
          fontWeight: 800,
          padding: '2px 9px',
          borderRadius: 12,
        }}>
          已確認 {doneCount} / {todos.length}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 440, overflowY: 'auto', paddingRight: 4 }}>
        {todos.map((t) => {
          const checked = todosState[t.key] ?? t.checkedInVault;
          return (
            <label
              key={t.key}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                fontSize: 12.5,
                lineHeight: 1.45,
                cursor: 'pointer',
                padding: '7px 9px',
                borderRadius: 8,
                background: checked ? 'rgba(20,50,40,0.02)' : 'rgba(255,255,255,0.6)',
                border: checked ? '1px dashed rgba(20,50,40,0.12)' : '1px solid rgba(20,50,40,0.08)',
                color: checked ? 'var(--c-muted)' : 'var(--c-ink)',
                textDecoration: checked ? 'line-through' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <input
                type="checkbox"
                className="journal-checkbox"
                checked={checked}
                onChange={() => toggleTodo(t.key)}
                style={{ marginTop: 2, flexShrink: 0 }}
              />
              <span style={{ flex: 1 }}>{t.text}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
