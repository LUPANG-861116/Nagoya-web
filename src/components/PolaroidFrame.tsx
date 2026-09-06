import WashiTape from './WashiTape';

interface PolaroidFrameProps {
  src: string;
  caption: string;
  tapeColor?: 'green' | 'coral' | 'yellow' | 'kraft';
  angle?: number;
  width?: number | string;
  aspectRatio?: string;
  onClick?: () => void;
}

export default function PolaroidFrame({
  src,
  caption,
  tapeColor = 'green',
  angle = -2,
  width = 200,
  aspectRatio = '4/3',
  onClick,
}: PolaroidFrameProps) {
  return (
    <div
      className="polaroid-frame"
      onClick={onClick}
      style={{
        width,
        transform: `rotate(${angle}deg)`,
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
      }}
      title={onClick ? `點擊放大查看：${caption}` : undefined}
    >
      <WashiTape color={tapeColor} angle={-angle / 2} width={65} top={-9} />
      <div style={{ width: '100%', aspectRatio, overflow: 'hidden', borderRadius: 2, position: 'relative' }}>
        <img src={src} alt={caption} />
        {onClick && (
          <div style={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            background: 'rgba(0,0,0,0.5)',
            color: '#ffffff',
            borderRadius: '50%',
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            opacity: 0.85,
          }}>
            🔍
          </div>
        )}
      </div>
      <div className="caption">{caption}</div>
    </div>
  );
}
