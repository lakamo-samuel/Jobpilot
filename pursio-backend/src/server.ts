import { loadConfig } from "./config/env.js";
import { createRuntimeDependencies } from "./app-dependencies.js";
import { checkStartupDependencies } from "./config/startup-checks.js";
import { createApp } from "./app.js";

const config = loadConfig();
const runtime = createRuntimeDependencies(config);
try {
  await checkStartupDependencies(runtime);
} catch (error) {
  await Promise.allSettled([runtime.redis.quit().catch(() => undefined), runtime.cvExtractionQueue.close(), runtime.pool.end()]);
  throw error;
}
const server = createApp(runtime.dependencies).listen(config.PORT, () => {
  console.log(JSON.stringify({ level: "info", message: "Pursio API listening", port: config.PORT }));
});
let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  await new Promise<void>(resolve => server.close(() => resolve()));
  await Promise.allSettled([runtime.redis.quit(), runtime.cvExtractionQueue.close(), runtime.pool.end()]);
}
process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
