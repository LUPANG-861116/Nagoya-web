import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import WashiTape from './WashiTape';

interface ImageLightboxModalProps {
  src: string | null;
  caption?: string;
  onClose: () => void;
}

export default function ImageLightboxModal({ src, caption, onClose }: ImageLightboxModalProps) {
  useEffect(() => {
    if (!src) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [src, onClose]);

  if (!src) return null;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100dvh',
        zIndex: 999999,
        background: 'rgba(24, 24, 27, 0.82)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        boxSizing: 'border-box',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: '14px 14px 18px 14px',
          boxShadow: '0 24px 70px rgba(0,0,0,0.5)',
          width: 'min(92vw, 920px)',
          maxWidth: 'min(92vw, 920px)',
          maxHeight: '92dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        <WashiTape color="kraft" angle={-1} width={100} top={-12} />
        
        {/* 關閉按鈕 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: '#2b241d',
            color: '#ffffff',
            border: '2px solid #ffffff',
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
            zIndex: 30,
          }}
          title="關閉 (Esc)"
          aria-label="關閉"
        >
          ✕
        </button>

        {/* 放大圖片主體 */}
        <div style={{
          overflow: 'hidden',
          borderRadius: 6,
          maxHeight: '74dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8f8f8',
          width: '100%',
          flex: '1 1 auto',
          minHeight: 0,
        }}>
          <img
            src={src}
            alt={caption || 'Preview'}
            style={{
              maxWidth: '100%',
              maxHeight: '74dvh',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>

        {/* 說明文字與關閉提示 */}
        {caption && (
          <div style={{
            marginTop: 10,
            textAlign: 'center',
            width: '100%',
          }}>
            <div className="handwriting" style={{
              fontSize: 'clamp(17px, 4vw, 22px)',
              color: '#2b241d',
              fontWeight: 700,
              lineHeight: 1.2,
            }}>
              {caption}
            </div>
            <div style={{
              fontSize: 11.5,
              color: 'var(--c-muted)',
              marginTop: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}>
              <span>點擊背景或按 ✕ 即可關閉</span>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
