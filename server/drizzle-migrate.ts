// server/drizzle-migrate.ts
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./db";

async function main() {
  console.log("Running drizzle migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  await pool.end();
  console.log("Migrations applied");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
