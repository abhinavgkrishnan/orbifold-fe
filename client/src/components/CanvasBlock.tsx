import { useState, useRef, useCallback, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { BlockType } from '@/lib/protocol-types';

interface CanvasBlockProps {
  block: BlockType;
  isSelected: boolean;
  isConnecting: boolean;
  onSelect: (block: BlockType) => void;
  onUpdate: (blockId: string, updates: Partial<BlockType>) => void;
  onRemove: (blockId: string) => void;
  onConnectionStart: (blockId: string, point: string) => void;
  onConnectionComplete: (blockId: string, point: string) => void;
}

export function CanvasBlock({
  block,
  isSelected,
  isConnecting,
  onSelect,
  onUpdate,
  onRemove,
  onConnectionStart,
  onConnectionComplete
}: CanvasBlockProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(false);
  const blockRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef(false);

  const getBlockColorClass = (blockType: string) => {
    switch (blockType) {
      case 'zk': return 'block-zk';
      case 'crypto': return 'block-crypto';
      case 'curve': return 'block-curve';
      case 'verification': return 'block-verification';
      case 'mechanism': return 'block-mechanism';
      default: return 'bg-gray-500';
    }
  };

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStartRef.current) return;
    
    if (!isDragging) {
      setIsDragging(true);
    }
    
    const canvas = document.querySelector('.canvas-container');
    if (!canvas) return;
    
    const canvasRect = canvas.getBoundingClientRect();
    const newX = e.clientX - canvasRect.left - dragOffset.x;
    const newY = e.clientY - canvasRect.top - dragOffset.y;
    
    onUpdate(block.id, {
      position: {
        x: Math.max(0, Math.min(newX, canvasRect.width - 120)),
        y: Math.max(0, Math.min(newY, canvasRect.height - 50))
      }
    });
  }, [dragOffset.x, dragOffset.y, onUpdate, block.id]);

  const handleGlobalMouseUp = useCallback(() => {
    dragStartRef.current = false;
    setIsDragging(false);
    
    // Remove global listeners
    document.removeEventListener('mousemove', handleGlobalMouseMove);
    document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [handleGlobalMouseMove]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('connection-point') || target.closest('.connection-point') || target.closest('button')) {
      return;
    }
    
    e.preventDefault();
    dragStartRef.current = true;
    const rect = blockRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    onSelect(block);
    
    // Add global mouse listeners
    document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
    document.addEventListener('mouseup', handleGlobalMouseUp);
  };

  const handleConnectionPointClick = (point: string) => {
    if (isConnecting) {
      onConnectionComplete(block.id, point);
    } else {
      onConnectionStart(block.id, point);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(block);
  };

  return (
    <div
      ref={blockRef}
      className={`absolute select-none transition-all duration-200 ${isDragging ? 'z-50' : 'z-10'} ${
        isSelected ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
      }`}
      style={{
        left: block.position.x,
        top: block.position.y,
        transform: isDragging ? 'scale(1.02)' : 'none'
      }}
      onMouseDown={handleMouseDown}

      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={handleClick}
    >
      <div className={`${getBlockColorClass(block.type)} px-6 py-3 rounded-full shadow-lg cursor-move relative group min-w-[120px] text-center border-0`}>
        {/* Connection Points */}
        <div 
          className="connection-point absolute -left-3 top-1/2 w-4 h-4 bg-white rounded-full border-2 border-gray-300 transform -translate-y-1/2 hover:border-primary cursor-crosshair z-20"
          onClick={(e) => {
            e.stopPropagation();
            handleConnectionPointClick('input');
          }}
        />
        <div 
          className="connection-point absolute -right-3 top-1/2 w-4 h-4 bg-white rounded-full border-2 border-gray-300 transform -translate-y-1/2 hover:border-primary cursor-crosshair z-20"
          onClick={(e) => {
            e.stopPropagation();
            handleConnectionPointClick('output');
          }}
        />
        
        {/* Delete Button */}
        {showControls && (
          <button
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(block.id);
            }}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
        
        <div className="flex items-center justify-center">
          <span className="text-sm font-medium">{block.name}</span>
        </div>
      </div>
    </div>
  );
}
