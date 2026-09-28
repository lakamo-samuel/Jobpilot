import { Queue, type ConnectionOptions } from "bullmq";

export const cvExtractionQueueName = "pursio-cv-extraction";
export type CvExtractionJob = { cvId: string };
export interface CvExtractionQueue { enqueue(cvId: string): Promise<void>; }

export function bullConnection(redisUrl: string): ConnectionOptions {
  const url = new URL(redisUrl);
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: decodeURIComponent(url.username) || undefined,
    password: decodeURIComponent(url.password) || undefined,
    db: url.pathname && url.pathname !== "/" ? Number(url.pathname.slice(1)) : 0,
    ...(url.protocol === "rediss:" ? { tls: {} } : {}),
    maxRetriesPerRequest: null,
  };
}

export class BullCvExtractionQueue implements CvExtractionQueue {
  private readonly queue: Queue<CvExtractionJob>;
  constructor(redisUrl: string) { this.queue = new Queue<CvExtractionJob>(cvExtractionQueueName, { connection: bullConnection(redisUrl) }); }
  async enqueue(cvId: string) {
    await this.queue.add("extract", { cvId }, { jobId: `cv-${cvId}`, attempts: 3, backoff: { type: "exponential", delay: 5000 }, removeOnComplete: 1000, removeOnFail: true });
  }
  close() { return this.queue.close(); }
}
