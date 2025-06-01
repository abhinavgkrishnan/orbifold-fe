import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DraggableBlock } from './DraggableBlock';
import { PRIMITIVE_BLOCKS, VERIFICATION_BLOCKS, MECHANISM_BLOCKS } from '@/lib/protocol-types';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  if (isCollapsed) {
    return (
      <div className="w-12 bg-secondary border-r border-gray-200 flex flex-col">
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="w-full"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-secondary border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">ORBIFOLD</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabbed Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="primitives" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
            <TabsTrigger value="primitives" className="text-xs">Primitives</TabsTrigger>
            <TabsTrigger value="verification" className="text-xs">Verification</TabsTrigger>
            <TabsTrigger value="mechanism" className="text-xs">Mechanism</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-y-auto p-4">
            <TabsContent value="primitives" className="mt-0 space-y-6">
              {/* Zero-Knowledge Section */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                  Zero-Knowledge
                </h3>
                <div className="space-y-2">
                  {PRIMITIVE_BLOCKS.filter(block => block.type === 'zk').map((block) => (
                    <DraggableBlock
                      key={block.name}
                      type={block.type}
                      name={block.name}
                      category={block.category}
                    />
                  ))}
                </div>
              </div>

              {/* Cryptographic Section */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                  Cryptographic
                </h3>
                <div className="space-y-2">
                  {PRIMITIVE_BLOCKS.filter(block => block.type === 'crypto').map((block) => (
                    <DraggableBlock
                      key={block.name}
                      type={block.type}
                      name={block.name}
                      category={block.category}
                    />
                  ))}
                </div>
              </div>

              {/* Elliptic Curves Section */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                  Elliptic Curves
                </h3>
                <div className="space-y-2">
                  {PRIMITIVE_BLOCKS.filter(block => block.type === 'curve').map((block) => (
                    <DraggableBlock
                      key={block.name}
                      type={block.type}
                      name={block.name}
                      category={block.category}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="verification" className="mt-0">
              <div className="space-y-2">
                {VERIFICATION_BLOCKS.map((block) => (
                  <DraggableBlock
                    key={block.name}
                    type={block.type}
                    name={block.name}
                    category={block.category}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="mechanism" className="mt-0">
              <div className="space-y-2">
                {MECHANISM_BLOCKS.map((block) => (
                  <DraggableBlock
                    key={block.name}
                    type={block.type}
                    name={block.name}
                    category={block.category}
                  />
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
