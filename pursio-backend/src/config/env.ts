import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.url().startsWith("postgresql://"),
  WEB_ORIGIN: z.url(),
  COOKIE_SECURE: z.enum(["true", "false"]).default("false"),
  REGISTRATION_KEY: z.string().min(32),
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  LOCAL_STORAGE_DIR: z.string().default("./uploads"),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ENDPOINT: z.url().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
});

export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const config = schema.parse(env);
  if (config.NODE_ENV === "production" && (config.COOKIE_SECURE !== "true" || !config.WEB_ORIGIN.startsWith("https://"))) {
    throw new Error("Production requires HTTPS WEB_ORIGIN and COOKIE_SECURE=true");
  }
  if (config.NODE_ENV === "production" && config.STORAGE_DRIVER !== "s3") throw new Error("Production requires private S3-compatible CV storage");
  if (config.STORAGE_DRIVER === "s3" && (!config.S3_BUCKET || !config.S3_REGION)) throw new Error("S3_BUCKET and S3_REGION are required");
  if (!!config.S3_ACCESS_KEY_ID !== !!config.S3_SECRET_ACCESS_KEY) throw new Error("S3 credentials must be provided together");
  return config;
}

export type Config = ReturnType<typeof loadConfig>;
