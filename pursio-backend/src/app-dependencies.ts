import { createClient } from "redis";
import type { Config } from "./config/env.js";
import { createDb, type Database } from "./db/index.js";
import { createAiProvider } from "./integrations/ai/index.js";
import type { AiProvider } from "./integrations/ai/ai-provider.js";
import { createEmailSender } from "./integrations/email/index.js";
import type { EmailSender } from "./integrations/email/email-sender.js";
import { GoogleGmailProvider, type GmailProvider } from "./integrations/gmail/gmail-provider.js";
import { createGoogleAuthorization, createGoogleVerifier } from "./integrations/google/index.js";
import type { GoogleAuthorization } from "./integrations/google/google-authorization.js";
import type { GoogleVerifier } from "./integrations/google/google-verifier.js";
import { createFileStore } from "./integrations/storage/index.js";
import type { FileStore } from "./integrations/storage/file-store.js";
import type { JobSearchCache } from "./modules/jobs/job-search.service.js";
import { BullCvExtractionQueue, type CvExtractionQueue } from "./queues/cv-extraction.queue.js";

export type RedisHealth = { ping(): Promise<string> };
export type AppDependencies = {
  config: Config;
  db: Database;
  redis: RedisHealth;
  aiProvider?: AiProvider;
  emailSender?: EmailSender;
  fileStore?: FileStore;
  cvExtractionQueue?: CvExtractionQueue;
  jobSearchCache?: JobSearchCache;
  googleVerifier?: GoogleVerifier;
  googleAuthorization?: GoogleAuthorization;
  gmailProvider?: GmailProvider;
};

export function createRuntimeDependencies(config: Config) {
  const { db, pool } = createDb(config.DATABASE_URL);
  const redis = createClient({ url: config.REDIS_URL, socket: { connectTimeout: 5000, reconnectStrategy: retries => retries < 3 ? Math.min(100 * 2 ** retries, 1000) : false } });
  redis.on("error", error => console.error(JSON.stringify({ level: "error", dependency: "redis", message: error.message })));
  const cvExtractionQueue = new BullCvExtractionQueue(config.REDIS_URL);
  const dependencies: AppDependencies = {
    config, db, redis, cvExtractionQueue, jobSearchCache: redis,
    aiProvider: createAiProvider(config),
    emailSender: createEmailSender(config),
    fileStore: createFileStore(config),
    googleVerifier: createGoogleVerifier(config),
    googleAuthorization: createGoogleAuthorization(config),
    gmailProvider: config.GMAIL_REDIRECT_URI ? new GoogleGmailProvider(config.GOOGLE_CLIENT_ID!, config.GOOGLE_CLIENT_SECRET!, config.GMAIL_REDIRECT_URI) : undefined,
  };
  return { dependencies, pool, redis, cvExtractionQueue };
}
