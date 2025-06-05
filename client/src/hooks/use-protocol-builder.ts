import { useState, useCallback, useRef } from 'react';
import { BlockType, Connection, ProtocolData } from '@/lib/protocol-types';

interface HistoryState {
  blocks: BlockType[];
  connections: Connection[];
}

export function useProtocolBuilder() {
  const [blocks, setBlocks] = useState<BlockType[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<BlockType | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<{ blockId: string; point: string } | null>(null);
  
  // History management
  const [history, setHistory] = useState<HistoryState[]>([{ blocks: [], connections: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const saveToHistory = useCallback((newBlocks: BlockType[], newConnections: Connection[]) => {
    const newState = { blocks: [...newBlocks], connections: [...newConnections] };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    
    // Limit history to 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(newHistory.length - 1);
    }
    
    setHistory(newHistory);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setBlocks(state.blocks);
      setConnections(state.connections);
      setHistoryIndex(newIndex);
      setSelectedBlock(null);
      setSelectedConnection(null);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setBlocks(state.blocks);
      setConnections(state.connections);
      setHistoryIndex(newIndex);
      setSelectedBlock(null);
      setSelectedConnection(null);
    }
  }, [history, historyIndex]);

  const addBlock = useCallback((blockData: { type: string; name: string }, position: { x: number; y: number }) => {
    const newBlock: BlockType = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: blockData.type as BlockType['type'],
      name: blockData.name,
      category: blockData.type,
      position,
      properties: {}
    };
    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    saveToHistory(newBlocks, connections);
    return newBlock;
  }, [blocks, connections, saveToHistory]);

  const updateBlock = useCallback((blockId: string, updates: Partial<BlockType>) => {
    const newBlocks = blocks.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    );
    setBlocks(newBlocks);
    if (selectedBlock && selectedBlock.id === blockId) {
      setSelectedBlock(prev => prev ? { ...prev, ...updates } : null);
    }
    // Save to history for name changes and position changes (when drag ends)
    if (updates.name || updates.position) {
      saveToHistory(newBlocks, connections);
    }
  }, [blocks, connections, selectedBlock, saveToHistory]);

  const removeBlock = useCallback((blockId: string) => {
    const newBlocks = blocks.filter(block => block.id !== blockId);
    const newConnections = connections.filter(conn => 
      conn.sourceBlockId !== blockId && conn.targetBlockId !== blockId
    );
    setBlocks(newBlocks);
    setConnections(newConnections);
    saveToHistory(newBlocks, newConnections);
    if (selectedBlock && selectedBlock.id === blockId) {
      setSelectedBlock(null);
    }
  }, [blocks, connections, selectedBlock, saveToHistory]);

  const startConnection = useCallback((blockId: string, point: string) => {
    setIsConnecting(true);
    setConnectingFrom({ blockId, point });
  }, []);

  const completeConnection = useCallback((targetBlockId: string, targetPoint: string) => {
    if (!connectingFrom) {
      setIsConnecting(false);
      setConnectingFrom(null);
      return;
    }

    // Allow connections to the same block and from same points
    // Remove all previous restrictions

    // Check if the exact same connection already exists
    const existingConnection = connections.find(conn => 
      conn.sourceBlockId === connectingFrom.blockId && 
      conn.targetBlockId === targetBlockId &&
      conn.sourcePoint === connectingFrom.point &&
      conn.targetPoint === targetPoint
    );

    if (existingConnection) {
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

    const newConnections = [...connections, newConnection];
    setConnections(newConnections);
    saveToHistory(blocks, newConnections);
    setIsConnecting(false);
    setConnectingFrom(null);
  }, [connectingFrom, connections, blocks, saveToHistory]);

  const cancelConnection = useCallback(() => {
    setIsConnecting(false);
    setConnectingFrom(null);
  }, []);

  const removeConnection = useCallback((connectionId: string) => {
    const newConnections = connections.filter(conn => conn.id !== connectionId);
    setConnections(newConnections);
    saveToHistory(blocks, newConnections);
    setSelectedConnection(null);
  }, [connections, blocks, saveToHistory]);

  const getProtocolData = useCallback((): ProtocolData => ({
    name: 'Untitled Protocol',
    blocks,
    connections
  }), [blocks, connections]);

  const loadProtocolData = useCallback((data: ProtocolData) => {
    setBlocks(data.blocks);
    setConnections(data.connections);
    setSelectedBlock(null);
    setSelectedConnection(null);
    saveToHistory(data.blocks, data.connections);
  }, [saveToHistory]);

  const clearCanvas = useCallback(() => {
    setBlocks([]);
    setConnections([]);
    setSelectedBlock(null);
    setSelectedConnection(null);
    setIsConnecting(false);
    setConnectingFrom(null);
    saveToHistory([], []);
  }, [saveToHistory]);

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
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
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
    clearCanvas,
    undo,
    redo
  };
}