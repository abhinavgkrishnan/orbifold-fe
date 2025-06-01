import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, GripVertical } from 'lucide-react';
import { BlockType } from '@/lib/protocol-types';
import { BLOCK_PROPERTIES } from '@/lib/protocol-types';

interface DraggablePropertiesPanelProps {
  selectedBlock: BlockType | null;
  onUpdateBlock: (blockId: string, updates: Partial<BlockType>) => void;
  onClose: () => void;
}

export function DraggablePropertiesPanel({ selectedBlock, onUpdateBlock, onClose }: DraggablePropertiesPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const panelRef = useRef<HTMLDivElement>(null);

  if (!selectedBlock) {
    return null;
  }

  const blockProperties = BLOCK_PROPERTIES[selectedBlock.name as keyof typeof BLOCK_PROPERTIES];

  const handlePropertyUpdate = (property: string, value: string) => {
    onUpdateBlock(selectedBlock.id, {
      properties: {
        ...selectedBlock.properties,
        [property]: value
      }
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    setPosition({
      x: Math.max(0, Math.min(newX, window.innerWidth - 320)),
      y: Math.max(0, Math.min(newY, window.innerHeight - 400))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <Card 
      ref={panelRef}
      className="fixed w-80 shadow-lg z-50 border-2"
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <CardHeader 
        className="pb-3 cursor-grab active:cursor-grabbing select-none bg-muted/50"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Properties</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs font-medium text-muted-foreground">Name</Label>
          <Input
            value={selectedBlock.name}
            onChange={(e) => onUpdateBlock(selectedBlock.id, { name: e.target.value })}
            className="mt-1"
          />
        </div>

        {selectedBlock.type === 'zk' && blockProperties && 'curve' in blockProperties && (
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Curve</Label>
            <Select
              value={selectedBlock.properties.curve || blockProperties.curve}
              onValueChange={(value) => handlePropertyUpdate('curve', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BLS12-381">BLS12-381</SelectItem>
                <SelectItem value="BN-254">BN-254</SelectItem>
                <SelectItem value="BLS24-315">BLS24-315</SelectItem>
                <SelectItem value="Pasta">Pasta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {blockProperties && (
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(blockProperties).map(([key, value]) => {
              if (key === 'curve') return null; // Already handled above
              
              return (
                <div key={key}>
                  <Label className="text-xs font-medium text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </Label>
                  <div className="text-sm text-foreground mt-1">
                    {selectedBlock.properties[key] || value}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div>
          <Label className="text-xs font-medium text-muted-foreground">Type</Label>
          <div className="text-sm text-foreground mt-1 capitalize">{selectedBlock.type}</div>
        </div>

        <div>
          <Label className="text-xs font-medium text-muted-foreground">Position</Label>
          <div className="text-xs text-muted-foreground mt-1">
            x: {Math.round(selectedBlock.position.x)}, y: {Math.round(selectedBlock.position.y)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}