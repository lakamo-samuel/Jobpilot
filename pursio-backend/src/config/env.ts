import { z } from "zod";

const optionalValue = <T extends z.ZodType>(validator: T) => z.preprocess(value => value === "" ? undefined : value, validator.optional());
const databaseUrl = z.url().refine(value => ["postgresql:", "postgres:"].includes(new URL(value).protocol), "Use a PostgreSQL URL");
const webOrigin = z.url().refine(value => new URL(value).origin === value, "Use an origin without a path or trailing slash");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: databaseUrl,
  REDIS_URL: z.url().refine(value => ["redis:", "rediss:"].includes(new URL(value).protocol), "Use a Redis URL"),
  WEB_ORIGIN: webOrigin,
  COOKIE_SECURE: z.enum(["true", "false"]).default("false"),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(3).default(0),
  RESEND_API_KEY: optionalValue(z.string().min(1)),
  AUTH_EMAIL_FROM: optionalValue(z.email()),
  GOOGLE_CLIENT_ID: optionalValue(z.string().min(10)),
  GOOGLE_CLIENT_SECRET: optionalValue(z.string().min(10)),
  GOOGLE_REDIRECT_URI: optionalValue(z.url()),
  GMAIL_REDIRECT_URI: optionalValue(z.url()),
  GMAIL_TOKEN_ENCRYPTION_KEY: optionalValue(z.string().regex(/^[a-fA-F0-9]{64}$/, "Use 32 random bytes encoded as 64 hex characters")),
  CLOUDINARY_CLOUD_NAME: optionalValue(z.string().min(1)),
  CLOUDINARY_API_KEY: optionalValue(z.string().min(1)),
  CLOUDINARY_API_SECRET: optionalValue(z.string().min(1)),
  CV_MAX_FILES: z.coerce.number().int().min(1).max(100).default(10),
  CV_MAX_STORAGE_BYTES: z.coerce.number().int().min(10485760).max(1073741824).default(104857600),
  GEMINI_API_KEY: optionalValue(z.string().min(1)),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  AI_DAILY_REQUEST_LIMIT: z.coerce.number().int().min(1).max(1000).default(20),
  JOOBLE_REGIONS_JSON: z.string().default("{}"),
});

export const loadDatabaseUrl = (env: NodeJS.ProcessEnv = process.env) => databaseUrl.parse(env.DATABASE_URL);

export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const config = schema.parse(env);
  let parsedRegions: unknown;
  try { parsedRegions = JSON.parse(config.JOOBLE_REGIONS_JSON); } catch { throw new Error("JOOBLE_REGIONS_JSON must be valid JSON"); }
  const regionSchema = z.record(z.string().regex(/^[A-Z]{2}$/), z.object({ host: z.string().regex(/^(?:[a-z]{2}|uk)\.jooble\.org$|^jooble\.org$/), key: z.string().min(1) }).strict());
  const joobleRegions = regionSchema.parse(parsedRegions);
  for (const [country, region] of Object.entries(joobleRegions)) {
    const expected = country === "US" ? "jooble.org" : `${country === "GB" ? "uk" : country.toLowerCase()}.jooble.org`;
    if (region.host !== expected) throw new Error(`Jooble host does not match ${country}`);
  }
  if (config.NODE_ENV === "production" && (config.COOKIE_SECURE !== "true" || !config.WEB_ORIGIN.startsWith("https://"))) {
    throw new Error("Production requires HTTPS WEB_ORIGIN and COOKIE_SECURE=true");
  }
  if (config.NODE_ENV === "production" && (!config.RESEND_API_KEY || !config.AUTH_EMAIL_FROM)) throw new Error("Production requires Resend email configuration");
  const googleParts = [config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET, config.GOOGLE_REDIRECT_URI].filter(Boolean).length;
  if (googleParts !== 0 && googleParts !== 3) throw new Error("Google redirect auth requires client ID, client secret, and redirect URI together");
  if (config.NODE_ENV === "production" && googleParts !== 3) throw new Error("Production requires Google redirect auth configuration");
  if (config.GOOGLE_REDIRECT_URI) {
    const callback = new URL(config.GOOGLE_REDIRECT_URI);
    if (callback.pathname !== "/api/auth/google/callback" || callback.search || callback.hash || (config.NODE_ENV === "production" && callback.protocol !== "https:")) throw new Error("GOOGLE_REDIRECT_URI must be the HTTPS backend Google callback URL in production");
  }
  if (Boolean(config.GMAIL_REDIRECT_URI) !== Boolean(config.GMAIL_TOKEN_ENCRYPTION_KEY)) throw new Error("Gmail redirect URI and token encryption key must be provided together");
  if (config.GMAIL_REDIRECT_URI && googleParts !== 3) throw new Error("Gmail requires Google OAuth configuration");
  if (config.GMAIL_REDIRECT_URI) {
    const callback = new URL(config.GMAIL_REDIRECT_URI);
    if (callback.pathname !== "/api/integrations/gmail/callback" || callback.search || callback.hash || (config.NODE_ENV === "production" && callback.protocol !== "https:")) throw new Error("GMAIL_REDIRECT_URI must be the backend Gmail callback URL");
  }
  if (config.NODE_ENV === "production" && !config.GEMINI_API_KEY) throw new Error("Production requires GEMINI_API_KEY");
  const cloudinaryParts = [config.CLOUDINARY_CLOUD_NAME, config.CLOUDINARY_API_KEY, config.CLOUDINARY_API_SECRET].filter(Boolean).length;
  if (cloudinaryParts !== 0 && cloudinaryParts !== 3) throw new Error("All Cloudinary credentials must be provided together");
  if (config.NODE_ENV === "production" && cloudinaryParts !== 3) throw new Error("Production requires Cloudinary credentials");
  return { ...config, joobleRegions };
}

export type Config = ReturnType<typeof loadConfig>;
