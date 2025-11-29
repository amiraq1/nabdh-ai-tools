import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  category: text("category").notNull(),
  notes: text("notes"),
  balance: real("balance").notNull().default(0),
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
});

export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull(),
  type: text("type").notNull(), // 'credit' | 'debit'
  amount: real("amount").notNull(),
  description: text("description"),
  date: text("date").notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export const supplierCategories = [
  "مواد غذائية",
  "إلكترونيات",
  "مواد بناء",
  "ملابس",
  "أثاث",
  "معدات",
  "خدمات",
  "أخرى",
] as const;

export type SupplierCategory = typeof supplierCategories[number];
