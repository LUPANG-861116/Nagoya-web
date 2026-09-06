import WashiTape from './WashiTape';
import { useTripState } from '../state/store';
import { todos } from '../data';

export default function JournalChecklist() {
  const { todosState, toggleTodo } = useTripState();

  return (
    <div className="journal-card" style={{ position: 'relative', background: 'var(--bg-note)', borderLeft: '4px solid var(--c-brass)' }}>
      <WashiTape color="yellow" angle={1} width={80} top={-10} right={20} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
        <span className="serif" style={{ fontSize: 17, fontWeight: 800, color: 'var(--c-pine)' }}>
          🎒 裝備與行前備忘清單
        </span>
        <span className="handwriting" style={{ fontSize: 18, color: 'var(--c-brass-dark)', fontWeight: 700 }}>
          Checklist
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {todos.slice(0, 8).map((t) => {
          const checked = todosState[t.key] ?? t.checkedInVault;
          return (
            <label
              key={t.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 13,
                cursor: 'pointer',
                color: checked ? 'var(--c-muted)' : 'var(--c-ink)',
                textDecoration: checked ? 'line-through' : 'none',
              }}
            >
              <input
                type="checkbox"
                className="journal-checkbox"
                checked={checked}
                onChange={() => toggleTodo(t.key)}
              />
              <span style={{ flex: 1 }}>{t.text}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
