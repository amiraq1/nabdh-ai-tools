import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import { env } from "./config";

const ssl =
  env.NODE_ENV === "production"
    ? { rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED ?? true }
    : env.DB_SSL_REJECT_UNAUTHORIZED !== undefined
      ? { rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED }
      : undefined;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ...(ssl ? { ssl } : {}),
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
});

export const db = drizzle(pool as any, { schema });
