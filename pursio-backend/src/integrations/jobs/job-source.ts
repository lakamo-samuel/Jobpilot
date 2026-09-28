import type { DiscoveredJob, JobSearchInput } from "../../modules/jobs/job.schema.js";
export interface JobSource {
  readonly name: "himalayas" | "jooble";
  search(input: JobSearchInput): Promise<DiscoveredJob[]>;
}
