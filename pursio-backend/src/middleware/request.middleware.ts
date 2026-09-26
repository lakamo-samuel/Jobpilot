import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import multer from "multer";
import { AppError } from "../shared/errors/app-error.js";
import type { Config } from "../config/env.js";

export function requestContext(req: Request, res: Response, next: NextFunction) {
  req.traceId = randomUUID();
  res.setHeader("X-Request-Id", req.traceId);
  next();
}
export function requireOrigin(config: Config) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && req.headers.origin !== config.WEB_ORIGIN) {
      res.status(403).json({ error: "invalid_origin" }); return;
    }
    next();
  };
}
export const handleError = (error: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof AppError) { res.status(error.status).json({ error: error.code }); return; }
  if (error instanceof multer.MulterError) { res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ error: "invalid_upload" }); return; }
  if (error instanceof ZodError) { res.status(400).json({ error: "invalid_input", issues: error.issues }); return; }
  if (error instanceof SyntaxError && "body" in error) { res.status(400).json({ error: "invalid_json" }); return; }
  console.error(JSON.stringify({ level: "error", traceId: req.traceId, message: error instanceof Error ? error.message : "unknown_error" }));
  res.status(500).json({ error: "internal_error", traceId: req.traceId });
};
