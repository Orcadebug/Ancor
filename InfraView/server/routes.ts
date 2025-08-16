import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDeploymentSchema, insertDocumentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard stats endpoint
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      // For demo purposes, using user-1. In production, get from auth
      const stats = await storage.getDashboardStats("user-1");
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Deployments endpoints
  app.get("/api/deployments", async (req, res) => {
    try {
      // For demo purposes, using user-1. In production, get from auth
      const deployments = await storage.getDeployments("user-1");
      res.json(deployments);
    } catch (error) {
      console.error("Error fetching deployments:", error);
      res.status(500).json({ message: "Failed to fetch deployments" });
    }
  });

  app.get("/api/deployments/:id", async (req, res) => {
    try {
      const deployment = await storage.getDeployment(req.params.id);
      if (!deployment) {
        return res.status(404).json({ message: "Deployment not found" });
      }
      res.json(deployment);
    } catch (error) {
      console.error("Error fetching deployment:", error);
      res.status(500).json({ message: "Failed to fetch deployment" });
    }
  });

  app.post("/api/deployments", async (req, res) => {
    try {
      const validatedData = insertDeploymentSchema.parse({
        ...req.body,
        userId: "user-1", // For demo purposes
      });
      
      const deployment = await storage.createDeployment(validatedData);
      res.status(201).json(deployment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid deployment data", errors: error.errors });
      }
      console.error("Error creating deployment:", error);
      res.status(500).json({ message: "Failed to create deployment" });
    }
  });

  app.patch("/api/deployments/:id", async (req, res) => {
    try {
      const updated = await storage.updateDeployment(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Deployment not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating deployment:", error);
      res.status(500).json({ message: "Failed to update deployment" });
    }
  });

  app.delete("/api/deployments/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteDeployment(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Deployment not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting deployment:", error);
      res.status(500).json({ message: "Failed to delete deployment" });
    }
  });

  // System metrics endpoint
  app.get("/api/system-metrics", async (req, res) => {
    try {
      // For demo purposes, get metrics for the first active deployment
      const deployments = await storage.getDeployments("user-1");
      const activeDeployment = deployments.find(d => d.status === "active");
      
      if (!activeDeployment) {
        return res.json({
          gpuUtilization: 0,
          responseTime: "0",
          queueLength: 0,
          queriesToday: 0,
          errorRate: "0",
        });
      }

      const metrics = await storage.getSystemMetrics(activeDeployment.id);
      if (!metrics) {
        // Return default metrics if none exist
        return res.json({
          gpuUtilization: 78,
          responseTime: "1.2",
          queueLength: 23,
          queriesToday: 1247,
          errorRate: "0.8",
        });
      }

      res.json(metrics);
    } catch (error) {
      console.error("Error fetching system metrics:", error);
      res.status(500).json({ message: "Failed to fetch system metrics" });
    }
  });

  // Documents endpoints
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getDocuments("user-1");
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents/upload", async (req, res) => {
    try {
      // In a real implementation, this would handle file uploads
      // For now, we'll simulate the upload process
      
      if (!req.body || !req.body.name) {
        return res.status(400).json({ message: "File name is required" });
      }

      const documentData = {
        userId: "user-1",
        name: req.body.name,
        type: req.body.type || "pdf",
        size: req.body.size || 1024000,
        deploymentId: req.body.deploymentId || null,
      };

      const validatedData = insertDocumentSchema.parse(documentData);
      const document = await storage.createDocument(validatedData);
      
      // Simulate processing
      setTimeout(async () => {
        await storage.updateDocument(document.id, {
          status: "completed",
          uploadProgress: 100,
          processedAt: new Date(),
        });
      }, 2000);

      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid document data", errors: error.errors });
      }
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Workflows endpoints
  app.get("/api/workflows", async (req, res) => {
    try {
      const workflows = await storage.getWorkflows("user-1");
      res.json(workflows);
    } catch (error) {
      console.error("Error fetching workflows:", error);
      res.status(500).json({ message: "Failed to fetch workflows" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
