export interface BlockType {
  id: string;
  type: 'zk' | 'crypto' | 'curve' | 'verification' | 'mechanism' | 'input' | 'output';
  name: string;
  category: string;
  position: { x: number; y: number };
  properties: Record<string, any>;
}

export interface Connection {
  id: string;
  sourceBlockId: string;
  targetBlockId: string;
  sourcePoint: string;
  targetPoint: string;
}

export interface ProtocolData {
  id?: string;
  name: string;
  description?: string;
  blocks: BlockType[];
  connections: Connection[];
}

export const PRIMITIVE_BLOCKS = [
  // Zero-Knowledge
  { type: 'zk', name: 'Groth16', category: 'Zero-Knowledge' },
  { type: 'zk', name: 'Plonk', category: 'Zero-Knowledge' },
  { type: 'zk', name: 'Halo2', category: 'Zero-Knowledge' },
  
  // Cryptographic
  { type: 'crypto', name: 'FHE', category: 'Cryptographic' },
  { type: 'crypto', name: 'MPC', category: 'Cryptographic' },
  
  // Elliptic Curves
  { type: 'curve', name: 'BLS12-381', category: 'Elliptic Curves' },
  { type: 'curve', name: 'BN-254', category: 'Elliptic Curves' },
  { type: 'curve', name: 'BLS24-315', category: 'Elliptic Curves' },
] as const;

export const INPUT_OUTPUT_BLOCKS = [
  // Inputs
  { type: 'input', name: 'Input', category: 'Inputs' },
  
  // Outputs  
  { type: 'output', name: 'Output', category: 'Outputs' },
] as const;

export const VERIFICATION_BLOCKS = [
  { type: 'verification', name: 'Range Proof', category: 'Verification' },
  { type: 'verification', name: 'Merkle Proof', category: 'Verification' },
  { type: 'verification', name: 'Signature Verification', category: 'Verification' },
] as const;

export const MECHANISM_BLOCKS = [
  { type: 'mechanism', name: 'Auction Protocol', category: 'Mechanism Design' },
  { type: 'mechanism', name: 'Voting System', category: 'Mechanism Design' },
  { type: 'mechanism', name: 'Fair Exchange', category: 'Mechanism Design' },
] as const;

export const BLOCK_PROPERTIES = {
  'Groth16': {
    curve: 'BLS12-381',
    proofSize: '~200 bytes',
    proverTime: 'Fast',
    verifierTime: 'Very Fast',
    trustedSetup: 'Required'
  },
  'Plonk': {
    curve: 'BLS12-381',
    proofSize: '~300 bytes',
    proverTime: 'Medium',
    verifierTime: 'Fast',
    trustedSetup: 'Universal'
  },
  'Halo2': {
    curve: 'Pasta',
    proofSize: '~400 bytes',
    proverTime: 'Medium',
    verifierTime: 'Fast',
    trustedSetup: 'None'
  },
  'FHE': {
    security: 'Post-quantum',
    operations: 'Addition, Multiplication',
    keySize: '~2MB',
    performance: 'Slow'
  },
  'MPC': {
    parties: '2+',
    security: 'Information-theoretic',
    communication: 'High',
    rounds: 'Multiple'
  },
  'Input': {
    type: 'Parameter',
    editable: true,
    dataType: 'Any'
  },
  'Output': {
    type: 'Result',
    editable: true,
    dataType: 'Any'
  }
};