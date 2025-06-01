import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Canvas } from '@/components/Canvas';
import { DraggablePropertiesPanel } from '@/components/DraggablePropertiesPanel';
import { ActionButtons } from '@/components/ActionButtons';
import { useProtocolBuilder } from '@/hooks/use-protocol-builder';
import { BlockType } from '@/lib/protocol-types';

export default function ProtocolBuilder() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  
  const {
    blocks,
    connections,
    selectedBlock,
    selectedConnection,
    isConnecting,
    connectingFrom,
    addBlock,
    updateBlock,
    removeBlock,
    selectBlock,
    selectConnection,
    startConnection,
    completeConnection,
    cancelConnection,
    removeConnection,
    getProtocolData,
    clearCanvas
  } = useProtocolBuilder();

  const handleSelectBlock = (block: BlockType | null) => {
    selectBlock(block);
    setShowProperties(!!block);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar 
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <Canvas
        blocks={blocks}
        connections={connections}
        selectedBlock={selectedBlock}
        selectedConnection={selectedConnection}
        isConnecting={isConnecting}
        connectingFrom={connectingFrom}
        onAddBlock={addBlock}
        onSelectBlock={handleSelectBlock}
        onSelectConnection={selectConnection}
        onUpdateBlock={updateBlock}
        onRemoveBlock={removeBlock}
        onConnectionStart={startConnection}
        onConnectionComplete={completeConnection}
        onCancelConnection={cancelConnection}
        onRemoveConnection={removeConnection}
      />
      
      {showProperties && (
        <DraggablePropertiesPanel
          selectedBlock={selectedBlock}
          onUpdateBlock={updateBlock}
          onClose={() => {
            setShowProperties(false);
            selectBlock(null);
          }}
        />
      )}
      
      <ActionButtons
        protocolData={getProtocolData()}
        onClearCanvas={clearCanvas}
      />
    </div>
  );
}
