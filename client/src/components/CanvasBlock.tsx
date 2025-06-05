import { useState, useCallback, useRef, useEffect } from 'react';
import { Trash2, Edit2 } from 'lucide-react';
import { BlockType } from '@/lib/protocol-types';
import { Input } from '@/components/ui/input';

interface CanvasBlockProps {
  block: BlockType;
  isSelected: boolean;
  isConnecting: boolean;
  connectingFrom: { blockId: string; point: string } | null;
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
  connectingFrom,
  onSelect,
  onUpdate,
  onRemove,
  onConnectionStart,
  onConnectionComplete
}: CanvasBlockProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(block.name);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialPositionRef = useRef({ x: 0, y: 0 });
  const blockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;
        
        const newPosition = {
          x: Math.max(0, initialPositionRef.current.x + deltaX),
          y: Math.max(0, initialPositionRef.current.y + deltaY)
        };
        
        onUpdate(block.id, { position: newPosition });
      };

      const handleMouseUp = (e: MouseEvent) => {
        setIsDragging(false);
        
        // Only select if we haven't moved at all (less than 1px)
        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;
        if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
          onSelect(block);
        }
        
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, block, onSelect, onUpdate]);

  const getBlockColorClass = (blockType: string) => {
    switch (blockType) {
      case 'zk': return 'block-zk';
      case 'crypto': return 'block-crypto';
      case 'curve': return 'block-curve';
      case 'verification': return 'block-verification';
      case 'mechanism': return 'block-mechanism';
      case 'input': return 'block-input';
      case 'output': return 'block-output';
      default: return 'bg-gray-500';
    }
  };

  const getBlockShape = (blockType: string) => {
    if (blockType === 'input') return 'rounded-lg border-2 border-dashed';
    if (blockType === 'output') return 'rounded-lg border-2 border-solid';
    return 'rounded-full';
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Don't drag if clicking on connection points, buttons, or input fields
    if (target.classList.contains('connection-point') || 
        target.closest('.connection-point') || 
        target.closest('button') ||
        target.tagName === 'INPUT') {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    // Start dragging immediately
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialPositionRef.current = { x: block.position.x, y: block.position.y };
  };

  const handleConnectionPointClick = (point: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (isConnecting) {
      // Allow connections to the same block - remove this restriction
      onConnectionComplete(block.id, point);
    } else {
      onConnectionStart(block.id, point);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Click handling is now done in mouseUp to prevent conflicts with dragging
    e.stopPropagation();
  };

  const handleEditStart = (e: React.MouseEvent) => {
    if (block.type === 'input' || block.type === 'output') {
      e.stopPropagation();
      setIsEditing(true);
      setEditValue(block.name);
    }
  };

  const handleEditSave = () => {
    onUpdate(block.id, { name: editValue });
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditValue(block.name);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  // Connection point style helper
  const getConnectionPointClass = (point: string) => {
    const baseClass = 'connection-point absolute w-3 h-3 bg-white rounded-full border transform cursor-crosshair z-20';
    const isHighlighted = isConnecting && connectingFrom?.blockId !== block.id;
    const borderClass = isHighlighted ? 'border-primary animate-pulse border-2' : 'border-gray-300 hover:border-primary border';
    
    return `${baseClass} ${borderClass}`;
  };

  // Get exact connection point positioning to align with block edges
  const getConnectionPointStyle = (point: string) => {
    switch (point) {
      case 'left':
        return { left: '-6px', top: '50%', transform: 'translateY(-50%)' };
      case 'right':
        return { right: '-6px', top: '50%', transform: 'translateY(-50%)' };
      case 'top':
        return { left: '50%', top: '-6px', transform: 'translateX(-50%)' };
      case 'bottom':
        return { left: '50%', bottom: '-6px', transform: 'translateX(-50%)' };
      default:
        return {};
    }
  };

  return (
    <div
      ref={blockRef}
      className={`canvas-block absolute select-none ${
        isDragging ? 'z-50 dragging' : 'z-10'
      } ${isSelected ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
      style={{
        left: block.position.x,
        top: block.position.y,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none'
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={handleClick}
    >
      <div className={`${getBlockColorClass(block.type)} ${getBlockShape(block.type)} px-6 py-3 shadow-lg cursor-grab hover:cursor-grab active:cursor-grabbing relative min-w-[120px] text-center`}>
        {/* Connection Points - 4 dots: top, bottom, left, right */}
        {showControls && (
          <>
            {/* Left connection point */}
            <div 
              className={getConnectionPointClass('left')}
              style={getConnectionPointStyle('left')}
              onClick={(e) => handleConnectionPointClick('left', e)}
            />
            
            {/* Right connection point */}
            <div 
              className={getConnectionPointClass('right')}
              style={getConnectionPointStyle('right')}
              onClick={(e) => handleConnectionPointClick('right', e)}
            />
            
            {/* Top connection point */}
            <div 
              className={getConnectionPointClass('top')}
              style={getConnectionPointStyle('top')}
              onClick={(e) => handleConnectionPointClick('top', e)}
            />
            
            {/* Bottom connection point */}
            <div 
              className={getConnectionPointClass('bottom')}
              style={getConnectionPointStyle('bottom')}
              onClick={(e) => handleConnectionPointClick('bottom', e)}
            />
          </>
        )}
        
        {/* Delete Button */}
        {showControls && (
          <button
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors z-30"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(block.id);
            }}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
        
        {/* Edit Button for editable blocks */}
        {showControls && (block.type === 'input' || block.type === 'output') && (
          <button
            className="absolute -top-2 -right-8 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors z-30"
            onClick={handleEditStart}
          >
            <Edit2 className="w-3 h-3" />
          </button>
        )}
        
        <div className="flex items-center justify-center block-content">
          {isEditing ? (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEditSave}
              onKeyDown={handleKeyPress}
              className="h-6 text-sm bg-transparent border-none text-center p-0 focus:ring-1 focus:ring-white"
              autoFocus
            />
          ) : (
            <span 
              className="text-sm font-medium cursor-pointer"
              onDoubleClick={handleEditStart}
            >
              {block.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}