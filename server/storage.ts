import {
  type Supplier,
  type InsertSupplier,
  type Transaction,
  type InsertTransaction,
  type User,
  type InsertUser,
  suppliers,
  transactions,
  users,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, count } from "drizzle-orm";
import { sanitizeUsers } from "./user-sanitizer";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: {
    id: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    profileImageUrl?: string | null;
  }): Promise<User>;
  getUsersCount(): Promise<number>;
  getUsers(
    page?: number,
    limit?: number
  ): Promise<{
    users: Omit<User, "password">[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined>;
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

export class DatabaseStorage implements IStorage {
  // الكود كما هو عندك (صحيح)
}

export const storage = new DatabaseStorage();
