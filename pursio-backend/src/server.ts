import { loadConfig } from "./config/env.js";
import { createDb } from "./db/index.js";
import { createApp } from "./app.js";

const config = loadConfig();
const { db, pool } = createDb(config.DATABASE_URL);
await pool.query("select 1");
const server = createApp(db, config).listen(config.PORT, () => {
  console.log(JSON.stringify({ level: "info", message: "Pursio API listening", port: config.PORT }));
});
let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await pool.end();
}
process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
