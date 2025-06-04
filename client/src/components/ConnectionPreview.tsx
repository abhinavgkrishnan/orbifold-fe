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

  // Use same exact logic as Canvas for connection points
  let sourceX, sourceY;
  
  if (connectingFrom.point === 'output') {
    // Output connections come from right side dot center
    sourceX = sourceBlock.position.x + 120 + 4; // Right edge + 4px to dot center
    sourceY = sourceBlock.position.y + 25; // Block center height
  } else {
    // Input connections come from left side dot center
    sourceX = sourceBlock.position.x - 4; // Left edge - 4px to dot center
    sourceY = sourceBlock.position.y + 25; // Block center height
  }
  
  const targetX = mousePosition.x;
  const targetY = mousePosition.y;

  // Create 90-degree preview path similar to actual connections
  const dx = targetX - sourceX;
  const midX = sourceX + dx / 2;
  
  let path;
  if (Math.abs(dx) > 60) {
    // Standard horizontal then vertical path
    path = `M ${sourceX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${targetX} ${targetY}`;
  } else {
    // If close, use vertical then horizontal
    const midY = sourceY + (targetY - sourceY) / 2;
    path = `M ${sourceX} ${sourceY} L ${sourceX + 30} ${sourceY} L ${sourceX + 30} ${midY} L ${targetX - 30} ${midY} L ${targetX - 30} ${targetY} L ${targetX} ${targetY}`;
  }

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