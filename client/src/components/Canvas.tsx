import { useRef, useCallback, useState } from 'react';
import { CanvasBlock } from './CanvasBlock';
import { ConnectionPreview } from './ConnectionPreview';
import { BlockType, Connection } from '@/lib/protocol-types';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Undo, Redo } from 'lucide-react';

interface CanvasProps {
  blocks: BlockType[];
  connections: Connection[];
  selectedBlock: BlockType | null;
  selectedConnection: string | null;
  isConnecting: boolean;
  connectingFrom: { blockId: string; point: string } | null;
  canUndo: boolean;
  canRedo: boolean;
  onAddBlock: (blockData: { type: string; name: string }, position: { x: number; y: number }) => void;
  onSelectBlock: (block: BlockType | null) => void;
  onSelectConnection: (connectionId: string | null) => void;
  onUpdateBlock: (blockId: string, updates: Partial<BlockType>) => void;
  onRemoveBlock: (blockId: string) => void;
  onConnectionStart: (blockId: string, point: string) => void;
  onConnectionComplete: (blockId: string, point: string) => void;
  onCancelConnection: () => void;
  onRemoveConnection: (connectionId: string) => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function Canvas({
  blocks,
  connections,
  selectedBlock,
  selectedConnection,
  isConnecting,
  connectingFrom,
  canUndo,
  canRedo,
  onAddBlock,
  onSelectBlock,
  onSelectConnection,
  onUpdateBlock,
  onRemoveBlock,
  onConnectionStart,
  onConnectionComplete,
  onCancelConnection,
  onRemoveConnection,
  onUndo,
  onRedo
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(100);
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  // Check if two blocks overlap
  const blocksOverlap = (pos1: { x: number; y: number }, pos2: { x: number; y: number }) => {
    const blockWidth = 120;
    const blockHeight = 50;
    const padding = 10;
    
    return !(pos1.x + blockWidth + padding <= pos2.x || 
             pos2.x + blockWidth + padding <= pos1.x || 
             pos1.y + blockHeight + padding <= pos2.y || 
             pos2.y + blockHeight + padding <= pos1.y);
  };

  // Find nearest non-overlapping position
  const findNearestEmptyPosition = (targetPos: { x: number; y: number }) => {
    const blockWidth = 120;
    const blockHeight = 50;
    const gridSize = 20;
    
    const hasOverlap = blocks.some(block => blocksOverlap(targetPos, block.position));
    if (!hasOverlap) return targetPos;

    for (let radius = gridSize; radius <= 300; radius += gridSize) {
      for (let angle = 0; angle < 360; angle += 45) {
        const radian = (angle * Math.PI) / 180;
        const testPos = {
          x: Math.max(0, targetPos.x + Math.cos(radian) * radius),
          y: Math.max(0, targetPos.y + Math.sin(radian) * radius)
        };
        
        const hasOverlap = blocks.some(block => blocksOverlap(testPos, block.position));
        if (!hasOverlap) {
          return testPos;
        }
      }
    }
    
    const maxX = blocks.reduce((max, block) => Math.max(max, block.position.x + blockWidth), 0);
    return { x: maxX + 30, y: targetPos.y };
  };

  // Handle drag and drop from sidebar only
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      let blockDataStr = e.dataTransfer.getData('application/json');
      if (!blockDataStr) {
        blockDataStr = e.dataTransfer.getData('text/plain');
      }
      if (!blockDataStr) {
        blockDataStr = e.dataTransfer.getData('application/x-orbifold-block');
      }
      
      const blockData = JSON.parse(blockDataStr);
      const rect = canvasRef.current?.getBoundingClientRect();
      
      if (rect && blockData) {
        const targetPosition = {
          x: (e.clientX - rect.left) / (zoom / 100) - 60,
          y: (e.clientY - rect.top) / (zoom / 100) - 25
        };
        
        const finalPosition = findNearestEmptyPosition(targetPosition);
        onAddBlock(blockData, finalPosition);
      }
    } catch (error) {
      console.error('Failed to parse dropped data:', error);
    }
  }, [onAddBlock, blocks, zoom]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!canvasRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  // Simple canvas click handler - no block creation
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (isConnecting) {
        onCancelConnection();
      } else {
        onSelectBlock(null);
        onSelectConnection(null);
      }
    }
  }, [isConnecting, onCancelConnection, onSelectBlock, onSelectConnection]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setMousePosition({
        x: (e.clientX - rect.left) / (zoom / 100),
        y: (e.clientY - rect.top) / (zoom / 100)
      });
    }
  }, [zoom]);

  // Precise connection point positioning - exactly at block edges
  const getConnectionPointPosition = (block: BlockType, point: string) => {
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

  // Enhanced connection path with consistent right-angle turns
  const getConnectionPath = (connection: Connection) => {
    const sourceBlock = blocks.find(b => b.id === connection.sourceBlockId);
    const targetBlock = blocks.find(b => b.id === connection.targetBlockId);
    if (!sourceBlock || !targetBlock) return '';
    const sourcePos = getConnectionPointPosition(sourceBlock, connection.sourcePoint);
    const targetPos = getConnectionPointPosition(targetBlock, connection.targetPoint);
    const offset = 40;
    let sourceExtend, targetExtend;
    // Calculate extension from source
    switch (connection.sourcePoint) {
      case 'right':
        sourceExtend = { x: sourcePos.x + offset, y: sourcePos.y };
        break;
      case 'left':
        sourceExtend = { x: sourcePos.x - offset, y: sourcePos.y };
        break;
      case 'bottom':
        sourceExtend = { x: sourcePos.x, y: sourcePos.y + offset };
        break;
      case 'top':
        sourceExtend = { x: sourcePos.x, y: sourcePos.y - offset };
        break;
      default:
        sourceExtend = sourcePos;
    }
    // Calculate approach to target
    switch (connection.targetPoint) {
      case 'right':
        targetExtend = { x: targetPos.x + offset, y: targetPos.y };
        break;
      case 'left':
        targetExtend = { x: targetPos.x - offset, y: targetPos.y };
        break;
      case 'bottom':
        targetExtend = { x: targetPos.x, y: targetPos.y + offset };
        break;
      case 'top':
        targetExtend = { x: targetPos.x, y: targetPos.y - offset };
        break;
      default:
        targetExtend = targetPos;
    }
    // Route: source -> sourceExtend -> targetExtend -> target
    let path = `M ${sourcePos.x} ${sourcePos.y} L ${sourceExtend.x} ${sourceExtend.y} `;
    if (connection.sourcePoint === 'left' || connection.sourcePoint === 'right') {
      path += `L ${targetExtend.x} ${sourceExtend.y} L ${targetExtend.x} ${targetExtend.y} L ${targetPos.x} ${targetPos.y}`;
    } else {
      path += `L ${sourceExtend.x} ${targetExtend.y} L ${targetExtend.x} ${targetExtend.y} L ${targetPos.x} ${targetPos.y}`;
    }
    return path;
  };

  // Calculate delete button position for better alignment
  const getDeleteButtonPosition = (connection: Connection) => {
    const sourceBlock = blocks.find(b => b.id === connection.sourceBlockId);
    const targetBlock = blocks.find(b => b.id === connection.targetBlockId);
    if (!sourceBlock || !targetBlock) return { x: 0, y: 0 };
    const sourcePos = getConnectionPointPosition(sourceBlock, connection.sourcePoint);
    const targetPos = getConnectionPointPosition(targetBlock, connection.targetPoint);
    const offset = 40;
    let sourceExtend, targetExtend;
    switch (connection.sourcePoint) {
      case 'right':
        sourceExtend = { x: sourcePos.x + offset, y: sourcePos.y };
        break;
      case 'left':
        sourceExtend = { x: sourcePos.x - offset, y: sourcePos.y };
        break;
      case 'bottom':
        sourceExtend = { x: sourcePos.x, y: sourcePos.y + offset };
        break;
      case 'top':
        sourceExtend = { x: sourcePos.x, y: sourcePos.y - offset };
        break;
      default:
        sourceExtend = sourcePos;
    }
    switch (connection.targetPoint) {
      case 'right':
        targetExtend = { x: targetPos.x + offset, y: targetPos.y };
        break;
      case 'left':
        targetExtend = { x: targetPos.x - offset, y: targetPos.y };
        break;
      case 'bottom':
        targetExtend = { x: targetPos.x, y: targetPos.y + offset };
        break;
      case 'top':
        targetExtend = { x: targetPos.x, y: targetPos.y - offset };
        break;
      default:
        targetExtend = targetPos;
    }
    // The last segment is from targetExtend to targetPos
    return {
      x: (targetExtend.x + targetPos.x) / 2 - 8,
      y: (targetExtend.y + targetPos.y) / 2 - 8
    };
  };

  // Stable hover handling with proper debouncing
  const handleConnectionMouseEnter = useCallback((connectionId: string) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredConnection(connectionId);
  }, []);

  const handleConnectionMouseLeave = useCallback(() => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    // Set a short delay before hiding to prevent flickering
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredConnection(null);
    }, 100);
  }, []);

  // Keep delete button visible when hovering over it
  const handleDeleteButtonMouseEnter = useCallback((connectionId: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredConnection(connectionId);
  }, []);

  // Helper to get the direction of the last segment of the path
  const getLastSegmentDirection = (connection: Connection): 'right' | 'left' | 'up' | 'down' => {
    const sourceBlock = blocks.find(b => b.id === connection.sourceBlockId);
    const targetBlock = blocks.find(b => b.id === connection.targetBlockId);
    if (!sourceBlock || !targetBlock) return 'right';
    const sourcePos = getConnectionPointPosition(sourceBlock, connection.sourcePoint);
    const targetPos = getConnectionPointPosition(targetBlock, connection.targetPoint);
    const isHorizontalFirst = ['left', 'right'].includes(connection.sourcePoint);
    let prev, end;
    if (isHorizontalFirst) {
      // Path: M source -> midX,sourceY -> midX,targetY -> target
      prev = { x: targetPos.x, y: sourcePos.y };
      end = targetPos;
    } else {
      // Path: M source -> sourceX,midY -> targetX,midY -> target
      prev = { x: sourcePos.x, y: targetPos.y };
      end = targetPos;
    }
    if (end.x > prev.x) return 'right';
    if (end.x < prev.x) return 'left';
    if (end.y > prev.y) return 'down';
    if (end.y < prev.y) return 'up';
    return 'right';
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Toolbar */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo}>
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onRedo} disabled={!canRedo}>
            <Redo className="h-4 w-4" />
          </Button>
          <div className="w-px h-4 bg-gray-300 mx-2" />
          <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={zoom >= 200}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={zoom <= 50}>
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">{zoom}%</div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={canvasRef}
          className={`canvas-container w-full h-full bg-gray-50 canvas-grid relative transition-all duration-200 ${
            isDragOver ? 'bg-teal-50 border-2 border-dashed border-teal-400' : ''
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left',
            width: `${100 / (zoom / 100)}%`,
            height: `${100 / (zoom / 100)}%`
          }}
        >
          {/* Connection Lines */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 5, pointerEvents: 'none' }}>
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="8"
                refX="8"
                refY="4"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,8 L8,4 Z" fill="#14B8A6" />
              </marker>
            </defs>
            
            {connections.map((connection) => {
              const deletePos = getDeleteButtonPosition(connection);
              const isHovered = hoveredConnection === connection.id;
              const isSelected = selectedConnection === connection.id;
              
              return (
                <g key={connection.id}>
                  {/* Extra wide invisible path for stable hover detection */}
                  <path
                    d={getConnectionPath(connection)}
                    stroke="transparent"
                    strokeWidth="20"
                    fill="none"
                    style={{ pointerEvents: 'all', cursor: 'pointer' }}
                    onMouseEnter={() => handleConnectionMouseEnter(connection.id)}
                    onMouseLeave={handleConnectionMouseLeave}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectConnection(connection.id);
                    }}
                  />
                  {/* Visible connection line */}
                  <path
                    d={getConnectionPath(connection)}
                    stroke="#14B8A6"
                    strokeWidth="2"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                    style={{ pointerEvents: 'none' }}
                  />
                  
                  {/* Delete button with stable positioning */}
                  {isHovered && (
                    <g>
                      {/* Larger invisible circle for stable hover */}
                      <circle
                        cx={deletePos.x + 8}
                        cy={deletePos.y + 8}
                        r="20"
                        fill="transparent"
                        style={{ pointerEvents: 'all' }}
                        onMouseEnter={() => handleDeleteButtonMouseEnter(connection.id)}
                        onMouseLeave={handleConnectionMouseLeave}
                      />
                      {/* Visible delete button */}
                      <circle
                        cx={deletePos.x + 8}
                        cy={deletePos.y + 8}
                        r="12"
                        fill="white"
                        stroke="#ef4444"
                        strokeWidth="2"
                        className="cursor-pointer hover:fill-red-50"
                        style={{ pointerEvents: 'all' }}
                        onMouseEnter={() => handleDeleteButtonMouseEnter(connection.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveConnection(connection.id);
                          setHoveredConnection(null);
                        }}
                      />
                      <text
                        x={deletePos.x + 8}
                        y={deletePos.y + 8}
                        textAnchor="middle"
                        fontSize="14"
                        fontWeight="bold"
                        fill="#ef4444"
                        className="cursor-pointer select-none"
                        style={{ pointerEvents: 'all' }}
                        onMouseEnter={() => handleDeleteButtonMouseEnter(connection.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveConnection(connection.id);
                          setHoveredConnection(null);
                        }}
                      >
                        ×
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Connection Preview */}
          <ConnectionPreview
            isConnecting={isConnecting}
            connectingFrom={connectingFrom}
            blocks={blocks}
            mousePosition={mousePosition}
          />

          {/* Blocks */}
          {blocks.map((block) => (
            <CanvasBlock
              key={block.id}
              block={block}
              isSelected={selectedBlock?.id === block.id}
              isConnecting={isConnecting}
              connectingFrom={connectingFrom}
              onSelect={onSelectBlock}
              onUpdate={onUpdateBlock}
              onRemove={onRemoveBlock}
              onConnectionStart={onConnectionStart}
              onConnectionComplete={onConnectionComplete}
            />
          ))}

          {/* Drop zone indicator */}
          {blocks.length === 0 && !isDragOver && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-muted-foreground">
                <div className="text-lg font-medium mb-2">Drag blocks from sidebar to start building</div>
                <div className="text-sm">Create connections by clicking connection points on blocks</div>
              </div>
            </div>
          )}
          
          {/* Active drag indicator */}
          {isDragOver && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-teal-600 bg-white/90 p-6 rounded-lg border-2 border-dashed border-teal-400 shadow-lg">
                <div className="text-xl font-medium mb-2">Drop block here</div>
                <div className="text-sm">Release to add the block to your protocol</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}