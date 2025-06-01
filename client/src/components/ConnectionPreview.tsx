import { useState, useEffect } from 'react';

interface ConnectionPreviewProps {
  isConnecting: boolean;
  connectingFrom: { blockId: string; point: string } | null;
  blocks: any[];
  mousePosition: { x: number; y: number };
}

export function ConnectionPreview({ isConnecting, connectingFrom, blocks, mousePosition }: ConnectionPreviewProps) {
  if (!isConnecting || !connectingFrom) return null;

  const sourceBlock = blocks.find(b => b.id === connectingFrom.blockId);
  if (!sourceBlock) return null;

  const sourceX = sourceBlock.position.x + 120;
  const sourceY = sourceBlock.position.y + 25;
  const targetX = mousePosition.x;
  const targetY = mousePosition.y;

  const controlX1 = sourceX + 50;
  const controlY1 = sourceY;
  const controlX2 = targetX - 50;
  const controlY2 = targetY;

  const path = `M ${sourceX} ${sourceY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${targetX} ${targetY}`;

  return (
    <svg className="absolute inset-0 pointer-events-none w-full h-full" style={{ zIndex: 15 }}>
      <path
        d={path}
        stroke="#14B8A6"
        strokeWidth="2"
        fill="none"
        strokeDasharray="5,5"
        opacity="0.7"
      />
    </svg>
  );
}