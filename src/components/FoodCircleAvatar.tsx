interface FoodCircleAvatarProps {
  name: string;
  sub: string;
  emoji: string;
  tag: string;
  area: string;
}

export default function FoodCircleAvatar({
  name,
  sub,
  emoji,
  tag,
  area,
}: FoodCircleAvatarProps) {
  return (
    <div className="food-circle-badge">
      <div className="food-circle-avatar">
        {emoji}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-ink)', marginTop: 2 }}>
        {name}
      </div>
      <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>
        {sub}
      </div>
      <span style={{
        fontSize: 10,
        color: 'var(--c-terracotta)',
        background: 'rgba(196,93,60,0.09)',
        borderRadius: 10,
        padding: '1px 6px',
        fontWeight: 600
      }}>
        {area}・{tag}
      </span>
    </div>
  );
}
