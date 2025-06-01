import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BlockType } from '@/lib/protocol-types';
import { BLOCK_PROPERTIES } from '@/lib/protocol-types';

interface PropertiesPanelProps {
  selectedBlock: BlockType | null;
  onUpdateBlock: (blockId: string, updates: Partial<BlockType>) => void;
}

export function PropertiesPanel({ selectedBlock, onUpdateBlock }: PropertiesPanelProps) {
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

  return (
    <Card className="fixed bottom-4 left-4 w-80 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Properties</CardTitle>
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
