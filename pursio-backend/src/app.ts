import express from "express";
import cors from "cors";
import helmet from "helmet";
import { sql } from "drizzle-orm";
import type { Config } from "./config/env.js";
import type { Database } from "./db/index.js";
import { requestContext, requireOrigin, handleError } from "./middleware/request.middleware.js";
import { apiRoutes } from "./modules/index.js";

export function createApp(db: Database, config: Config) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: config.WEB_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "64kb" }));
  app.use(requestContext);
  app.use(requireOrigin(config));
  app.get("/health/live", (_req, res) => res.json({ status: "ok" }));
  app.get("/health/ready", async (_req, res) => { await db.execute(sql`select 1`); res.json({ status: "ok" }); });
  app.use("/api", apiRoutes(db, config));
  app.use((_req, res) => res.status(404).json({ error: "not_found" }));
  app.use(handleError);
  return app;
}
