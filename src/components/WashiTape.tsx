import React from 'react';

interface WashiTapeProps {
  color?: 'green' | 'coral' | 'yellow' | 'kraft';
  angle?: number;
  width?: number | string;
  top?: number | string;
  left?: number | string;
  right?: number | string;
}

export default function WashiTape({
  color = 'green',
  angle = -1.5,
  width = 90,
  top = -10,
  left,
  right,
}: WashiTapeProps) {
  const style: React.CSSProperties = {
    position: 'absolute',
    top,
    width,
    transform: `rotate(${angle}deg)`,
    clipPath: 'polygon(3% 0%, 97% 0%, 100% 50%, 97% 100%, 3% 100%, 0% 50%)',
  };
  if (left !== undefined) style.left = left;
  if (right !== undefined) style.right = right;
  if (left === undefined && right === undefined) style.left = '50%', style.marginLeft = typeof width === 'number' ? -width / 2 : '-45px';

  return <div className={`washi-tape washi-tape--${color}`} style={style} />;
}
