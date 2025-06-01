import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProtocolSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Protocol routes
  app.post("/api/protocols", async (req, res) => {
    try {
      const protocolData = insertProtocolSchema.parse(req.body);
      const protocol = await storage.createProtocol(protocolData);
      res.json(protocol);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          message: "Failed to create protocol" 
        });
      }
    }
  });

  app.get("/api/protocols", async (req, res) => {
    try {
      const protocols = await storage.getUserProtocols();
      res.json(protocols);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch protocols" 
      });
    }
  });

  app.get("/api/protocols/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid protocol ID" });
      }

      const protocol = await storage.getProtocol(id);
      if (!protocol) {
        return res.status(404).json({ message: "Protocol not found" });
      }

      res.json(protocol);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch protocol" 
      });
    }
  });

  app.put("/api/protocols/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid protocol ID" });
      }

      const updates = insertProtocolSchema.partial().parse(req.body);
      const protocol = await storage.updateProtocol(id, updates);
      res.json(protocol);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          message: "Failed to update protocol" 
        });
      }
    }
  });

  app.delete("/api/protocols/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid protocol ID" });
      }

      const deleted = await storage.deleteProtocol(id);
      if (!deleted) {
        return res.status(404).json({ message: "Protocol not found" });
      }

      res.json({ message: "Protocol deleted successfully" });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to delete protocol" 
      });
    }
  });

  // Protocol validation endpoint
  app.post("/api/protocols/validate", async (req, res) => {
    try {
      const { blocks, connections } = req.body;
      
      if (!Array.isArray(blocks) || !Array.isArray(connections)) {
        return res.status(400).json({ 
          message: "Invalid protocol data format" 
        });
      }

      const issues: string[] = [];
      
      // Basic validation logic
      const zkBlocks = blocks.filter((b: any) => b.type === 'zk');
      const cryptoBlocks = blocks.filter((b: any) => b.type === 'crypto');
      const verificationBlocks = blocks.filter((b: any) => b.type === 'verification');
      
      if (zkBlocks.length === 0 && cryptoBlocks.length === 0) {
        issues.push("Protocol should contain at least one cryptographic primitive");
      }
      
      if (connections.length === 0 && blocks.length > 1) {
        issues.push("Multiple blocks should be connected to show data flow");
      }
      
      if (verificationBlocks.length === 0) {
        issues.push("Consider adding verification components for security");
      }

      // Check for disconnected blocks
      const connectedBlockIds = new Set([
        ...connections.map((c: any) => c.sourceBlockId),
        ...connections.map((c: any) => c.targetBlockId)
      ]);
      
      const disconnectedBlocks = blocks.filter((b: any) => 
        !connectedBlockIds.has(b.id) && blocks.length > 1
      );
      
      if (disconnectedBlocks.length > 0) {
        issues.push(`${disconnectedBlocks.length} block(s) are not connected to the protocol flow`);
      }

      res.json({
        valid: issues.length === 0,
        issues,
        suggestions: issues.length === 0 ? ["Protocol structure looks good!"] : []
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to validate protocol" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
