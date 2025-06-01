import { useState, useCallback } from 'react';
import { BlockType, Connection, ProtocolData } from '@/lib/protocol-types';

export function useProtocolBuilder() {
  const [blocks, setBlocks] = useState<BlockType[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<BlockType | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<{ blockId: string; point: string } | null>(null);

  const addBlock = useCallback((blockData: { type: string; name: string }, position: { x: number; y: number }) => {
    const newBlock: BlockType = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: blockData.type as BlockType['type'],
      name: blockData.name,
      category: blockData.type,
      position,
      properties: {}
    };
    setBlocks(prev => [...prev, newBlock]);
    return newBlock;
  }, []);

  const updateBlock = useCallback((blockId: string, updates: Partial<BlockType>) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    ));
    if (selectedBlock && selectedBlock.id === blockId) {
      setSelectedBlock(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [selectedBlock]);

  const removeBlock = useCallback((blockId: string) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId));
    setConnections(prev => prev.filter(conn => 
      conn.sourceBlockId !== blockId && conn.targetBlockId !== blockId
    ));
    if (selectedBlock && selectedBlock.id === blockId) {
      setSelectedBlock(null);
    }
  }, [selectedBlock]);

  const startConnection = useCallback((blockId: string, point: string) => {
    setIsConnecting(true);
    setConnectingFrom({ blockId, point });
  }, []);

  const completeConnection = useCallback((targetBlockId: string, targetPoint: string) => {
    if (!connectingFrom || connectingFrom.blockId === targetBlockId) {
      setIsConnecting(false);
      setConnectingFrom(null);
      return;
    }

    const newConnection: Connection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceBlockId: connectingFrom.blockId,
      targetBlockId,
      sourcePoint: connectingFrom.point,
      targetPoint
    };

    setConnections(prev => [...prev, newConnection]);
    setIsConnecting(false);
    setConnectingFrom(null);
  }, [connectingFrom]);

  const cancelConnection = useCallback(() => {
    setIsConnecting(false);
    setConnectingFrom(null);
  }, []);

  const removeConnection = useCallback((connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
  }, []);

  const getProtocolData = useCallback((): ProtocolData => ({
    name: 'Untitled Protocol',
    blocks,
    connections
  }), [blocks, connections]);

  const loadProtocolData = useCallback((data: ProtocolData) => {
    setBlocks(data.blocks);
    setConnections(data.connections);
    setSelectedBlock(null);
  }, []);

  const clearCanvas = useCallback(() => {
    setBlocks([]);
    setConnections([]);
    setSelectedBlock(null);
    setIsConnecting(false);
    setConnectingFrom(null);
  }, []);

  const selectBlock = useCallback((block: BlockType | null) => {
    setSelectedBlock(block);
    setSelectedConnection(null);
  }, []);

  const selectConnection = useCallback((connectionId: string | null) => {
    setSelectedConnection(connectionId);
    setSelectedBlock(null);
  }, []);

  return {
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
    loadProtocolData,
    clearCanvas
  };
}
