import { Worker } from "bullmq";
import { loadConfig } from "./config/env.js";
import { createRuntimeDependencies } from "./app-dependencies.js";
import { checkStartupDependencies } from "./config/startup-checks.js";
import { GmailRepository } from "./modules/gmail/gmail.repository.js";
import { GmailService } from "./modules/gmail/gmail.service.js";
import { CvRepository } from "./modules/cvs/cv.repository.js";
import { CvExtractionService } from "./modules/cvs/cv-extraction.service.js";
import { bullConnection, cvExtractionQueueName, type CvExtractionJob } from "./queues/cv-extraction.queue.js";

const config = loadConfig();
const runtime = createRuntimeDependencies(config);
await checkStartupDependencies(runtime);
const repository = new CvRepository(runtime.dependencies.db);
const service = new CvExtractionService(repository, runtime.dependencies.fileStore, runtime.dependencies.aiProvider);
const worker = new Worker<CvExtractionJob>(cvExtractionQueueName, job => service.process(job.data.cvId, job.attemptsMade, job.opts.attempts ?? 1), { connection: bullConnection(config.REDIS_URL), concurrency: 2 });
worker.on("failed", job => console.error(JSON.stringify({ level: "warn", message: "CV extraction attempt failed", cvId: job?.data.cvId })));
worker.on("error", () => console.error(JSON.stringify({ level: "error", message: "CV extraction worker error" })));

async function recoverPending() {
  for (const { id } of await repository.listPendingExtraction()) await runtime.cvExtractionQueue.enqueue(id);
}
await recoverPending();
const recoveryTimer = setInterval(() => void recoverPending().catch(() => console.error(JSON.stringify({ level: "warn", message: "CV extraction recovery scan failed" }))), 60_000);
const gmailRepository = new GmailRepository(runtime.dependencies.db);
const gmailService = new GmailService(gmailRepository, runtime.dependencies.gmailProvider, runtime.dependencies.googleVerifier, config);
let gmailScanning = false;
async function scanGmail() {
  if (!runtime.dependencies.gmailProvider || gmailScanning) return;
  gmailScanning = true;
  try {
    for (;;) {
      const userIds = await gmailRepository.claimDueSyncs(5);
      if (!userIds.length) break;
      await Promise.all(userIds.map(async userId => {
        try { await gmailService.sync(userId, true); }
        catch (error) { console.error(JSON.stringify({ level: "warn", message: "Gmail sync failed", userId, errorCode: error instanceof Error ? error.message : "unknown" })); }
      }));
    }
  } finally { gmailScanning = false; }
}
void scanGmail().catch(() => console.error(JSON.stringify({ level: "warn", message: "Gmail scheduler failed" })));
const gmailTimer = setInterval(() => void scanGmail().catch(() => console.error(JSON.stringify({ level: "warn", message: "Gmail scheduler failed" }))), 60_000);
console.log(JSON.stringify({ level: "info", message: "CV extraction worker listening" }));
let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  clearInterval(recoveryTimer);
  clearInterval(gmailTimer);
  await Promise.allSettled([worker.close(), runtime.cvExtractionQueue.close()]);
  await Promise.allSettled([runtime.redis.quit(), runtime.pool.end()]);
}
process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
