// server/drizzle-migrate.ts
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { pool } from "./db";

async function main() {
  console.log("Running drizzle migrations...");
  await migrate(pool, { migrationsFolder: "./drizzle" });
  await pool.end();
  console.log("Migrations applied");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
