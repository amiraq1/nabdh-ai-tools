// server/drizzle-migrate.ts
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./db";
import { logger } from "./logger";

async function main() {
  logger.info("Running drizzle migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  await pool.end();
  logger.info("Migrations applied");
}

main().catch((err) => {
  logger.error({ err }, "Migration failed");
  process.exit(1);
});
