import { type Supplier, type InsertSupplier, type Transaction, type InsertTransaction, type User, type InsertUser, suppliers, transactions, users } from "@shared/schema";
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
  getUsers(page?: number, limit?: number): Promise<{ users: Omit<User, "password">[]; total: number; page: number; limit: number; totalPages: number }>;
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
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ ...userData, role: userData.role || "viewer" })
      .returning();
    return user;
  }

  async upsertUser(userData: {
    id: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    profileImageUrl?: string | null;
  }): Promise<User> {
    const existing = await this.getUser(userData.id);

    if (existing) {
      const [user] = await db
        .update(users)
        .set({
          email: userData.email ?? existing.email,
          firstName: userData.firstName ?? existing.firstName,
          lastName: userData.lastName ?? existing.lastName,
          profileImageUrl: userData.profileImageUrl ?? existing.profileImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userData.id))
        .returning();

      return user;
    }

    const [user] = await db
      .insert(users)
      .values({
        id: userData.id,
        email: userData.email ?? null,
        firstName: userData.firstName ?? null,
        lastName: userData.lastName ?? null,
        profileImageUrl: userData.profileImageUrl ?? null,
        role: "viewer",
      })
      .returning();

    return user;
  }

  async getUsersCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(users);
    return Number(result?.count ?? 0);
  }

  async getUsers(page: number = 1, limit: number = 20): Promise<{ users: Omit<User, "password">[]; total: number; page: number; limit: number; totalPages: number }> {
    const offset = (page - 1) * limit;
    const [countResult] = await db.select({ total: count() }).from(users);
    const total = Number(countResult?.total ?? 0);

    const usersList = await db
      .select()
      .from(users)
      .limit(limit)
      .offset(offset);

    return {
      users: sanitizeUsers(usersList),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers);
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier || undefined;
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const [supplier] = await db
      .insert(suppliers)
      .values(insertSupplier)
      .returning();
    return supplier;
  }

  async updateSupplier(id: string, updates: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [supplier] = await db
      .update(suppliers)
      .set(updates)
      .where(eq(suppliers.id, id))
      .returning();
    return supplier || undefined;
  }

  async deleteSupplier(id: string): Promise<boolean> {
    const result = await db.delete(suppliers).where(eq(suppliers.id, id)).returning();
    return result.length > 0;
  }

  async getTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.date));
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async getTransactionsBySupplier(supplierId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.supplierId, supplierId))
      .orderBy(desc(transactions.date));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    return await db.transaction(async (tx) => {
      const [transaction] = await tx
        .insert(transactions)
        .values(insertTransaction)
        .returning();

      const balanceChange = insertTransaction.type === "debit"
        ? -insertTransaction.amount
        : insertTransaction.amount;

      await tx
        .update(suppliers)
        .set({
          balance: sql`COALESCE(${suppliers.balance}, 0) + ${balanceChange}`
        })
        .where(eq(suppliers.id, insertTransaction.supplierId));

      return transaction;
    });
  }

  async deleteTransaction(id: string): Promise<boolean> {
    return await db.transaction(async (tx) => {
      const [transaction] = await tx
        .select()
        .from(transactions)
        .where(eq(transactions.id, id));

      if (!transaction) return false;

      const balanceChange = transaction.type === "debit"
        ? transaction.amount
        : -transaction.amount;

      await tx
        .update(suppliers)
        .set({
          balance: sql`COALESCE(${suppliers.balance}, 0) + ${balanceChange}`
        })
        .where(eq(suppliers.id, transaction.supplierId));

      const result = await tx
        .delete(transactions)
        .where(eq(transactions.id, id))
        .returning();

      return result.length > 0;
    });
  }

  async deleteTransactionsBySupplier(supplierId: string): Promise<void> {
    await db.delete(transactions).where(eq(transactions.supplierId, supplierId));
  }
}

export const storage = new DatabaseStorage();
