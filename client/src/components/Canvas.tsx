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

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const blockData = JSON.parse(e.dataTransfer.getData('application/json'));
      const rect = canvasRef.current?.getBoundingClientRect();
      
      if (rect && blockData) {
        const position = {
          x: e.clientX - rect.left - 75, // Center the block
          y: e.clientY - rect.top - 20
        };
        onAddBlock(blockData, position);
      }
    } catch (error) {
      console.error('Failed to parse dropped data:', error);
    }
  }, [onAddBlock]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

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
    if (isConnecting && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  }, [isConnecting]);

  const getConnectionPath = (connection: Connection) => {
    const sourceBlock = blocks.find(b => b.id === connection.sourceBlockId);
    const targetBlock = blocks.find(b => b.id === connection.targetBlockId);
    
    if (!sourceBlock || !targetBlock) return '';
    
    // Calculate exact connection dot centers
    // Dots are positioned with -left-3 and -right-3 (which is -12px and right: -12px)
    // Dot is 16px wide (w-4), so center is at 8px from its left edge
    let sourceX, sourceY, targetX, targetY;
    
    // Source point (where connection starts)
    if (connection.sourcePoint === 'output') {
      // Output dots are on the right side: block.x + 120px (block width) + 12px (right: -12px) + 8px (dot center)
      sourceX = sourceBlock.position.x + 120 + 4; // Right edge + 4px to dot center  
      sourceY = sourceBlock.position.y + 25; // Block center height
    } else {
      // Input dots are on the left side: block.x - 12px (left: -12px) + 8px (dot center)  
      sourceX = sourceBlock.position.x - 4; // Left edge - 4px to dot center
      sourceY = sourceBlock.position.y + 25; // Block center height
    }
    
    // Target point (where connection ends)
    if (connection.targetPoint === 'input') {
      // Input dots are on the left side
      targetX = targetBlock.position.x - 4; // Left edge - 4px to dot center
      targetY = targetBlock.position.y + 25; // Block center height
    } else {
      // Output dots are on the right side
      targetX = targetBlock.position.x + 120 + 4; // Right edge + 4px to dot center
      targetY = targetBlock.position.y + 25; // Block center height
    }
    
    // Create 90-degree path
    const dx = targetX - sourceX;
    const midX = sourceX + dx / 2;
    
    // Create path with right angles
    let path;
    if (Math.abs(dx) > 60) {
      // Standard horizontal then vertical path
      path = `M ${sourceX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${targetX} ${targetY}`;
    } else {
      // If blocks are close vertically, use vertical then horizontal
      const midY = sourceY + (targetY - sourceY) / 2;
      path = `M ${sourceX} ${sourceY} L ${sourceX + 30} ${sourceY} L ${sourceX + 30} ${midY} L ${targetX - 30} ${midY} L ${targetX - 30} ${targetY} L ${targetX} ${targetY}`;
    }
    
    return path;
  };

  const getConnectionMidpoint = (connection: Connection) => {
    const sourceBlock = blocks.find(b => b.id === connection.sourceBlockId);
    const targetBlock = blocks.find(b => b.id === connection.targetBlockId);
    
    if (!sourceBlock || !targetBlock) return { x: 0, y: 0 };
    
    // Use same logic as getConnectionPath for consistency
    let sourceX, sourceY, targetX, targetY;
    
    // Source point
    if (connection.sourcePoint === 'output') {
      sourceX = sourceBlock.position.x + 120 + 4;
      sourceY = sourceBlock.position.y + 25;
    } else {
      sourceX = sourceBlock.position.x - 4;
      sourceY = sourceBlock.position.y + 25;
    }
    
    // Target point
    if (connection.targetPoint === 'input') {
      targetX = targetBlock.position.x - 4;
      targetY = targetBlock.position.y + 25;
    } else {
      targetX = targetBlock.position.x + 120 + 4;
      targetY = targetBlock.position.y + 25;
    }
    
    // Calculate midpoint for delete button placement
    const dx = targetX - sourceX;
    const midX = sourceX + dx / 2;
    
    if (Math.abs(dx) > 60) {
      // For standard horizontal path, place button at the vertical segment
      return { x: midX, y: (sourceY + targetY) / 2 };
    } else {
      // For complex path, place at the horizontal segment
      const midY = sourceY + (targetY - sourceY) / 2;
      return { x: (sourceX + 30 + targetX - 30) / 2, y: midY };
    }
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
          className="canvas-container w-full h-full bg-gray-50 canvas-grid relative"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
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
          <svg className="absolute inset-0 pointer-events-none w-full h-full" style={{ zIndex: 5 }}>
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,6 L8,3 z" fill="#14B8A6" />
              </marker>
            </defs>
            
            {connections.map((connection) => {
              const midpoint = getConnectionMidpoint(connection);
              
              return (
                <g key={connection.id}>
                  <path
                    d={getConnectionPath(connection)}
                    className="connection-line cursor-pointer"
                    markerEnd="url(#arrowhead)"
                    strokeWidth="2"
                    stroke="#14B8A6"
                    fill="none"
                    style={{ pointerEvents: 'all' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectConnection(connection.id);
                    }}
                  />
                  {/* Delete button - only show when connection is selected */}
                  {selectedConnection === connection.id && (
                    <>
                      <circle
                        cx={midpoint.x}
                        cy={midpoint.y}
                        r="8"
                        fill="white"
                        stroke="#ef4444"
                        strokeWidth="1"
                        className="cursor-pointer hover:fill-red-50"
                        style={{ pointerEvents: 'all' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveConnection(connection.id);
                        }}
                      />
                      <text
                        x={midpoint.x}
                        y={midpoint.y + 1}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#ef4444"
                        className="cursor-pointer select-none"
                        style={{ pointerEvents: 'all' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveConnection(connection.id);
                        }}
                      >
                        ×
                      </text>
                    </>
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
          {blocks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-muted-foreground">
                <div className="text-lg font-medium mb-2">Drag blocks here to start building</div>
                <div className="text-sm">Select blocks from the sidebar and drop them on the canvas</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}