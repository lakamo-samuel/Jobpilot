import express from "express";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./openapi.js";
import cors from "cors";
import helmet from "helmet";
import { sql } from "drizzle-orm";
import type { AppDependencies } from "./app-dependencies.js";
import { requestContext, requireOrigin, handleError } from "./middleware/request.middleware.js";
import { apiRoutes } from "./modules/index.js";

export function createApp(dependencies: AppDependencies) {
  const { config, db, redis } = dependencies;
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", config.TRUST_PROXY_HOPS);
  app.use(helmet());
  app.use(cors({ origin: config.WEB_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "64kb" }));
  app.get("/openapi.json", (_req, res) => res.json(openApiDocument));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument, { swaggerOptions: { persistAuthorization: false, withCredentials: true, filter: true, docExpansion: "list", defaultModelsExpandDepth: -1, displayRequestDuration: true } }));
  app.use(requestContext);
  app.use(requireOrigin(config));
  app.get("/health/live", (_req, res) => res.json({ status: "ok" }));
  app.get("/health/ready", async (_req, res) => {
    try {
      const [, pong] = await Promise.all([db.execute(sql`select 1`), redis.ping()]);
      if (pong !== "PONG") throw new Error("redis_unavailable");
      res.json({ status: "ok" });
    } catch {
      res.status(503).json({ error: "dependency_unavailable" });
    }
  });
  app.use("/api", apiRoutes(dependencies));
  app.use((_req, res) => res.status(404).json({ error: "not_found" }));
  app.use(handleError);
  return app;
}
