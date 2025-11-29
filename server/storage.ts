import { type Supplier, type InsertSupplier, type Transaction, type InsertTransaction } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: string): Promise<boolean>;
  
  getTransactions(): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionsBySupplier(supplierId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  deleteTransaction(id: string): Promise<boolean>;
  deleteTransactionsBySupplier(supplierId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private suppliers: Map<string, Supplier>;
  private transactions: Map<string, Transaction>;

  constructor() {
    this.suppliers = new Map();
    this.transactions = new Map();
  }

  async getSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values());
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const id = randomUUID();
    const supplier: Supplier = { 
      ...insertSupplier, 
      id,
      phone: insertSupplier.phone ?? null,
      email: insertSupplier.email ?? null,
      address: insertSupplier.address ?? null,
      notes: insertSupplier.notes ?? null,
      balance: insertSupplier.balance ?? 0,
    };
    this.suppliers.set(id, supplier);
    return supplier;
  }

  async updateSupplier(id: string, updates: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const existing = this.suppliers.get(id);
    if (!existing) return undefined;
    
    const updated: Supplier = { ...existing, ...updates };
    this.suppliers.set(id, updated);
    return updated;
  }

  async deleteSupplier(id: string): Promise<boolean> {
    return this.suppliers.delete(id);
  }

  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsBySupplier(supplierId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(t => t.supplierId === supplierId);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = { 
      ...insertTransaction, 
      id,
      description: insertTransaction.description ?? null,
    };
    this.transactions.set(id, transaction);
    
    const supplier = await this.getSupplier(insertTransaction.supplierId);
    if (supplier) {
      const balanceChange = insertTransaction.type === "debit" 
        ? -insertTransaction.amount 
        : insertTransaction.amount;
      await this.updateSupplier(insertTransaction.supplierId, {
        balance: (supplier.balance || 0) + balanceChange,
      });
    }
    
    return transaction;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const transaction = this.transactions.get(id);
    if (!transaction) return false;
    
    const supplier = await this.getSupplier(transaction.supplierId);
    if (supplier) {
      const balanceChange = transaction.type === "debit" 
        ? transaction.amount 
        : -transaction.amount;
      await this.updateSupplier(transaction.supplierId, {
        balance: (supplier.balance || 0) + balanceChange,
      });
    }
    
    return this.transactions.delete(id);
  }

  async deleteTransactionsBySupplier(supplierId: string): Promise<void> {
    const transactionsToDelete: string[] = [];
    for (const [id, transaction] of this.transactions.entries()) {
      if (transaction.supplierId === supplierId) {
        transactionsToDelete.push(id);
      }
    }
    for (const id of transactionsToDelete) {
      this.transactions.delete(id);
    }
  }
}

export const storage = new MemStorage();
