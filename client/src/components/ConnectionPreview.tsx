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

  // Get connection point position based on the point name (matching Canvas logic)
  const getConnectionPointPosition = (block: any, point: string) => {
    const { x, y } = block.position;
    const blockWidth = 120;
    const blockHeight = 50;
    
    switch (point) {
      case 'left':
        return { x: x, y: y + blockHeight / 2 };
      case 'right':
        return { x: x + blockWidth, y: y + blockHeight / 2 };
      case 'top':
        return { x: x + blockWidth / 2, y: y };
      case 'bottom':
        return { x: x + blockWidth / 2, y: y + blockHeight };
      default:
        // Fallback for legacy connections
        return point === 'output' 
          ? { x: x + blockWidth, y: y + blockHeight / 2 }
          : { x: x, y: y + blockHeight / 2 };
    }
  };

  const sourcePos = getConnectionPointPosition(sourceBlock, connectingFrom.point);
  const targetX = mousePosition.x;
  const targetY = mousePosition.y;

  // Enhanced preview path with consistent right-angle turns
  const sourceOffset = 40;
  const targetOffset = 40;
  
  // Calculate source extension point
  let sourceExtend;
  switch (connectingFrom.point) {
    case 'right':
      sourceExtend = { x: sourcePos.x + sourceOffset, y: sourcePos.y };
      break;
    case 'left':
      sourceExtend = { x: sourcePos.x - sourceOffset, y: sourcePos.y };
      break;
    case 'bottom':
      sourceExtend = { x: sourcePos.x, y: sourcePos.y + sourceOffset };
      break;
    case 'top':
      sourceExtend = { x: sourcePos.x, y: sourcePos.y - sourceOffset };
      break;
    default:
      sourceExtend = sourcePos;
  }
  
  // Calculate target approach point (simulate target connection point logic)
  const targetExtend = { x: targetX - targetOffset, y: targetY }; // Default to left approach
  
  // Create preview path matching the Canvas logic
  const dx = targetX - sourcePos.x;
  const dy = targetY - sourcePos.y;
  const isHorizontalPrimary = Math.abs(dx) > Math.abs(dy);
  
  let path;
  if (isHorizontalPrimary) {
    // Horizontal-primary routing
    path = `M ${sourcePos.x} ${sourcePos.y} L ${sourceExtend.x} ${sourceExtend.y} L ${sourceExtend.x} ${targetY} L ${targetX} ${targetY}`;
  } else {
    // Vertical-primary routing
    path = `M ${sourcePos.x} ${sourcePos.y} L ${sourceExtend.x} ${sourceExtend.y} L ${targetX} ${sourceExtend.y} L ${targetX} ${targetY}`;
  }

  return (
    <svg className="absolute inset-0 pointer-events-none w-full h-full" style={{ zIndex: 15 }}>
      <defs>
        <marker
          id="preview-arrowhead"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L8,3 z" fill="#14B8A6" opacity="0.7" />
        </marker>
      </defs>
      <path
        d={path}
        stroke="#14B8A6"
        strokeWidth="2"
        fill="none"
        strokeDasharray="5,5"
        opacity="0.7"
        markerEnd="url(#preview-arrowhead)"
      />
    </svg>
  );
}