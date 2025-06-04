import { useState, useRef, useCallback, useEffect } from 'react';
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
  const [showControls, setShowControls] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(block.name);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });

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
    
    onSelect(block);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialPosition({ x: block.position.x, y: block.position.y });
    
    // Add global listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    const newPosition = {
      x: Math.max(0, initialPosition.x + deltaX),
      y: Math.max(0, initialPosition.y + deltaY)
    };
    
    onUpdate(block.id, { position: newPosition });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleConnectionPointClick = (point: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (isConnecting) {
      // Don't allow connecting to the same block
      if (connectingFrom?.blockId === block.id) {
        return;
      }
      onConnectionComplete(block.id, point);
    } else {
      onConnectionStart(block.id, point);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    e.stopPropagation();
    onSelect(block);
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

  return (
    <div
      className={`absolute select-none ${
        isDragging ? 'z-50 dragging' : 'z-10 transition-all duration-200'
      } ${isSelected ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
      style={{
        left: block.position.x,
        top: block.position.y
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={handleClick}
    >
      <div className={`${getBlockColorClass(block.type)} ${getBlockShape(block.type)} px-6 py-3 shadow-lg cursor-move relative min-w-[120px] text-center`}>
        {/* Connection Points - only visible on hover and only for non-input/output blocks or on specific sides */}
        {(block.type !== 'input' && block.type !== 'output') && showControls && (
          <>
            <div 
              className={`connection-point absolute -left-3 top-1/2 w-4 h-4 bg-white rounded-full border-2 transform -translate-y-1/2 cursor-crosshair z-20 ${
                isConnecting && connectingFrom?.blockId !== block.id && connectingFrom?.point !== 'input' 
                  ? 'border-primary animate-pulse' 
                  : 'border-gray-300 hover:border-primary'
              }`}
              onClick={(e) => handleConnectionPointClick('input', e)}
            />
            <div 
              className={`connection-point absolute -right-3 top-1/2 w-4 h-4 bg-white rounded-full border-2 transform -translate-y-1/2 cursor-crosshair z-20 ${
                isConnecting && connectingFrom?.blockId !== block.id && connectingFrom?.point !== 'output' 
                  ? 'border-primary animate-pulse' 
                  : 'border-gray-300 hover:border-primary'
              }`}
              onClick={(e) => handleConnectionPointClick('output', e)}
            />
          </>
        )}
        
        {/* Input blocks only have output connection */}
        {block.type === 'input' && showControls && (
          <div 
            className={`connection-point absolute -right-3 top-1/2 w-4 h-4 bg-white rounded-full border-2 transform -translate-y-1/2 cursor-crosshair z-20 ${
              isConnecting && connectingFrom?.blockId !== block.id && connectingFrom?.point !== 'output' 
                ? 'border-primary animate-pulse' 
                : 'border-gray-300 hover:border-primary'
            }`}
            onClick={(e) => handleConnectionPointClick('output', e)}
          />
        )}
        
        {/* Output blocks only have input connection */}
        {block.type === 'output' && showControls && (
          <div 
            className={`connection-point absolute -left-3 top-1/2 w-4 h-4 bg-white rounded-full border-2 transform -translate-y-1/2 cursor-crosshair z-20 ${
              isConnecting && connectingFrom?.blockId !== block.id && connectingFrom?.point !== 'input' 
                ? 'border-primary animate-pulse' 
                : 'border-gray-300 hover:border-primary'
            }`}
            onClick={(e) => handleConnectionPointClick('input', e)}
          />
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
        
        <div className="flex items-center justify-center">
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