import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { loadDatabaseUrl } from "../config/env.js";
import { createDb } from "./index.js";

const { db, pool } = createDb(loadDatabaseUrl());
try {
  await migrate(db, { migrationsFolder: fileURLToPath(new URL("../../drizzle/", import.meta.url)) });
  console.log("Database migrations applied");
} finally {
  await pool.end();
}
