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
  onAddBlock: (blockData: { type: string; name: string }, position: { x: number; y: number }) => void;
  onSelectBlock: (block: BlockType | null) => void;
  onSelectConnection: (connectionId: string | null) => void;
  onUpdateBlock: (blockId: string, updates: Partial<BlockType>) => void;
  onRemoveBlock: (blockId: string) => void;
  onConnectionStart: (blockId: string, point: string) => void;
  onConnectionComplete: (blockId: string, point: string) => void;
  onCancelConnection: () => void;
  onRemoveConnection: (connectionId: string) => void;
}

export function Canvas({
  blocks,
  connections,
  selectedBlock,
  selectedConnection,
  isConnecting,
  connectingFrom,
  onAddBlock,
  onSelectBlock,
  onSelectConnection,
  onUpdateBlock,
  onRemoveBlock,
  onConnectionStart,
  onConnectionComplete,
  onCancelConnection,
  onRemoveConnection
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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
    
    // Calculate actual connection point positions
    const sourceX = sourceBlock.position.x + 120; // Right edge of source block
    const sourceY = sourceBlock.position.y + 25; // Center height
    const targetX = targetBlock.position.x; // Left edge of target block  
    const targetY = targetBlock.position.y + 25; // Center height
    
    // Create a smooth curve
    const dx = targetX - sourceX;
    const controlX1 = sourceX + Math.min(dx * 0.5, 100);
    const controlY1 = sourceY;
    const controlX2 = targetX - Math.min(dx * 0.5, 100);
    const controlY2 = targetY;
    
    return `M ${sourceX} ${sourceY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${targetX} ${targetY}`;
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Toolbar */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" disabled>
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" disabled>
            <Redo className="h-4 w-4" />
          </Button>
          <div className="w-px h-4 bg-gray-300 mx-2" />
          <Button variant="ghost" size="sm" disabled>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" disabled>
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">100%</div>
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
              const sourceBlock = blocks.find(b => b.id === connection.sourceBlockId);
              const targetBlock = blocks.find(b => b.id === connection.targetBlockId);
              
              if (!sourceBlock || !targetBlock) return null;
              
              // Calculate midpoint for delete button
              const sourceX = sourceBlock.position.x + 120;
              const sourceY = sourceBlock.position.y + 25;
              const targetX = targetBlock.position.x;
              const targetY = targetBlock.position.y + 25;
              const midX = (sourceX + targetX) / 2;
              const midY = (sourceY + targetY) / 2;
              
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
                        cx={midX}
                        cy={midY}
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
                        x={midX}
                        y={midY + 1}
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
