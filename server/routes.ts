import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSupplierSchema, insertTransactionSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated, requireRole } from "./replitAuth";
import { 
  uploadBackupToGoogleDrive, 
  listBackups, 
  downloadBackup, 
  deleteBackup, 
  checkGoogleDriveConnection 
} from "./googleDrive";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  await setupAuth(app);

  app.get("/api/auth/user", async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.claims?.sub) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/users", isAuthenticated, requireRole(["admin"]), async (_req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:id/role", isAuthenticated, requireRole(["admin"]), async (req, res) => {
    try {
      const { role } = req.body;
      if (!["admin", "editor", "viewer"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      const user = await storage.updateUserRole(req.params.id, role);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  app.get("/api/suppliers", isAuthenticated, async (_req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });

  app.get("/api/suppliers/:id", isAuthenticated, async (req, res) => {
    try {
      const supplier = await storage.getSupplier(req.params.id);
      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch supplier" });
    }
  });

  app.post("/api/suppliers", isAuthenticated, requireRole(["admin", "editor"]), async (req, res) => {
    try {
      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(validatedData);
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create supplier" });
    }
  });

  app.patch("/api/suppliers/:id", isAuthenticated, requireRole(["admin", "editor"]), async (req, res) => {
    try {
      const validatedData = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(req.params.id, validatedData);
      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update supplier" });
    }
  });

  app.delete("/api/suppliers/:id", isAuthenticated, requireRole(["admin"]), async (req, res) => {
    try {
      await storage.deleteTransactionsBySupplier(req.params.id);
      const deleted = await storage.deleteSupplier(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete supplier" });
    }
  });

  app.get("/api/transactions", isAuthenticated, async (_req, res) => {
    try {
      const transactions = await storage.getTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.get("/api/transactions/:id", isAuthenticated, async (req, res) => {
    try {
      const transaction = await storage.getTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transaction" });
    }
  });

  app.get("/api/suppliers/:id/transactions", isAuthenticated, async (req, res) => {
    try {
      const transactions = await storage.getTransactionsBySupplier(req.params.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", isAuthenticated, requireRole(["admin", "editor"]), async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      
      const supplier = await storage.getSupplier(validatedData.supplierId);
      if (!supplier) {
        return res.status(400).json({ error: "Supplier not found" });
      }
      
      const transaction = await storage.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  app.delete("/api/transactions/:id", isAuthenticated, requireRole(["admin"]), async (req, res) => {
    try {
      const deleted = await storage.deleteTransaction(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete transaction" });
    }
  });

  app.get("/api/google-drive/status", isAuthenticated, requireRole(["admin"]), async (_req, res) => {
    try {
      const status = await checkGoogleDriveConnection();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to check Google Drive status" });
    }
  });

  app.get("/api/google-drive/backups", isAuthenticated, requireRole(["admin"]), async (_req, res) => {
    try {
      const backups = await listBackups();
      res.json(backups);
    } catch (error) {
      res.status(500).json({ error: "Failed to list backups" });
    }
  });

  app.post("/api/google-drive/backup", isAuthenticated, requireRole(["admin"]), async (_req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      const transactions = await storage.getTransactions();
      const users = await storage.getUsers();
      
      const result = await uploadBackupToGoogleDrive({
        suppliers,
        transactions,
        users,
      });
      
      res.json(result);
    } catch (error) {
      console.error("Backup error:", error);
      res.status(500).json({ error: "Failed to create backup" });
    }
  });

  app.get("/api/google-drive/backups/:fileId", isAuthenticated, requireRole(["admin"]), async (req, res) => {
    try {
      const backup = await downloadBackup(req.params.fileId);
      res.json(backup);
    } catch (error) {
      res.status(500).json({ error: "Failed to download backup" });
    }
  });

  app.delete("/api/google-drive/backups/:fileId", isAuthenticated, requireRole(["admin"]), async (req, res) => {
    try {
      await deleteBackup(req.params.fileId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete backup" });
    }
  });

  return httpServer;
}
