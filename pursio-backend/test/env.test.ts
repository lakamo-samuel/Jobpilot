import { test } from "@jest/globals";
import assert from "node:assert/strict";
import { loadConfig, loadDatabaseUrl } from "../src/config/env.js";

const base = { DATABASE_URL: "postgresql://user:pass@localhost:5434/pursio", WEB_ORIGIN: "http://localhost:3000", REDIS_URL: "redis://localhost:6381" };

test("empty integration placeholders are optional in development", () => {
  const config = loadConfig({ ...base, RESEND_API_KEY: "", AUTH_EMAIL_FROM: "", GOOGLE_CLIENT_ID: "", GOOGLE_CLIENT_SECRET: "", GOOGLE_REDIRECT_URI: "", CLOUDINARY_CLOUD_NAME: "", GEMINI_API_KEY: "" });
  assert.equal(config.RESEND_API_KEY, undefined);
  assert.equal(config.GOOGLE_CLIENT_ID, undefined);
  assert.equal(config.GEMINI_API_KEY, undefined);
});

test("production validates all required integrations and secure origin", () => {
  assert.throws(() => loadConfig({ ...base, NODE_ENV: "production" }));
  const production = { ...base, NODE_ENV: "production", WEB_ORIGIN: "https://pursio.example", COOKIE_SECURE: "true", RESEND_API_KEY: "resend-key", AUTH_EMAIL_FROM: "auth@example.com", GOOGLE_CLIENT_ID: "google-client-id", GOOGLE_CLIENT_SECRET: "google-client-secret", GOOGLE_REDIRECT_URI: "https://api.pursio.example/api/auth/google/callback", GEMINI_API_KEY: "gemini-key", CLOUDINARY_CLOUD_NAME: "cloud", CLOUDINARY_API_KEY: "key", CLOUDINARY_API_SECRET: "secret" };
  assert.equal(loadConfig(production).NODE_ENV, "production");
  assert.throws(() => loadConfig({ ...production, CLOUDINARY_API_SECRET: "" }));
  assert.throws(() => loadConfig({ ...production, GOOGLE_CLIENT_SECRET: "" }));
  assert.throws(() => loadConfig({ ...production, WEB_ORIGIN: "https://pursio.example/" }));
});

test("PostgreSQL URLs accept Render's postgres scheme", () => {
  assert.equal(loadDatabaseUrl({ DATABASE_URL: "postgres://user:pass@localhost:5432/db" }), "postgres://user:pass@localhost:5432/db");
  assert.throws(() => loadDatabaseUrl({ DATABASE_URL: "mysql://user:pass@localhost/db" }));
});

test("Jooble regional keys have validated matching hosts", () => {
  assert.equal(loadConfig({ ...base, JOOBLE_REGIONS_JSON: '{"NG":{"host":"ng.jooble.org","key":"secret"}}' }).joobleRegions.NG.host, "ng.jooble.org");
  assert.throws(() => loadConfig({ ...base, JOOBLE_REGIONS_JSON: '{"NG":{"host":"us.jooble.org","key":"secret"}}' }));
  assert.throws(() => loadConfig({ ...base, JOOBLE_REGIONS_JSON: '{"NG":{"host":"evil.example","key":"secret"}}' }));
});
