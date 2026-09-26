import { ProfileRepository } from "./profile.repository.js";
import { profileSchema } from "./profile.schema.js";
import { factIdSchema, profileFactInputSchema } from "./profile-fact.schema.js";
export class ProfileService {
  constructor(private readonly repository: ProfileRepository) {}
  get(userId: string) { return this.repository.get(userId); }
  async addFact(userId: string, body: unknown, traceId: string) {
    const input = profileFactInputSchema.parse(body);
    return this.repository.addFact(userId, input.type, input.value, traceId);
  }
  deleteFact(userId: string, id: string, traceId: string) { return this.repository.deleteFact(userId, factIdSchema.parse(id), traceId); }
  async update(userId: string, body: unknown, traceId: string) {
    const input = profileSchema.parse(body);
    await this.repository.update(userId, input, traceId);
    return input;
  }
}
