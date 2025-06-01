import { protocols, type Protocol, type InsertProtocol } from "@shared/schema";

export interface IStorage {
  // Protocol operations
  createProtocol(protocol: InsertProtocol): Promise<Protocol>;
  getProtocol(id: number): Promise<Protocol | undefined>;
  getUserProtocols(userId?: number): Promise<Protocol[]>;
  updateProtocol(id: number, updates: Partial<InsertProtocol>): Promise<Protocol>;
  deleteProtocol(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private protocols: Map<number, Protocol>;
  private currentProtocolId: number;

  constructor() {
    this.protocols = new Map();
    this.currentProtocolId = 1;
  }

  async createProtocol(insertProtocol: InsertProtocol): Promise<Protocol> {
    const id = this.currentProtocolId++;
    const now = new Date();
    const protocol: Protocol = {
      ...insertProtocol,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.protocols.set(id, protocol);
    return protocol;
  }

  async getProtocol(id: number): Promise<Protocol | undefined> {
    return this.protocols.get(id);
  }

  async getUserProtocols(userId?: number): Promise<Protocol[]> {
    // For now, return all protocols since we don't have user authentication
    return Array.from(this.protocols.values());
  }

  async updateProtocol(id: number, updates: Partial<InsertProtocol>): Promise<Protocol> {
    const existingProtocol = this.protocols.get(id);
    if (!existingProtocol) {
      throw new Error(`Protocol with id ${id} not found`);
    }

    const updatedProtocol: Protocol = {
      ...existingProtocol,
      ...updates,
      updatedAt: new Date(),
    };

    this.protocols.set(id, updatedProtocol);
    return updatedProtocol;
  }

  async deleteProtocol(id: number): Promise<boolean> {
    return this.protocols.delete(id);
  }
}

export const storage = new MemStorage();
