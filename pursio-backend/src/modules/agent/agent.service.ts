import { AgentRepository } from "./agent.repository.js";
import { policySchema } from "./agent.schema.js";
export class AgentService {
  constructor(private readonly repository: AgentRepository) {}
  async getPolicy(userId: string) {
    const policy = await this.repository.getPolicy(userId);
    return { globalMode: policy.globalMode, paused: policy.paused, version: policy.version, ...policy.data };
  }
  async updatePolicy(userId: string, body: unknown, traceId: string) {
    const { globalMode, ...data } = policySchema.parse(body);
    await this.repository.updatePolicy(userId, globalMode, data, traceId);
    return { globalMode, ...data };
  }
  async setPaused(userId: string, paused: boolean, traceId: string) {
    await this.repository.setPaused(userId, paused, traceId);
    return { paused };
  }
}
