import { OpportunityRepository } from "./opportunity.repository.js";
import { manualStatusSchema, opportunityIdSchema, opportunityInputSchema, opportunityListSchema, opportunityUpdateSchema } from "./opportunity.schema.js";

function canonicalUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) if (/^(utm_|fbclid$|gclid$)/i.test(key)) url.searchParams.delete(key);
  return url.toString();
}
export class OpportunityService {
  constructor(private readonly repository: OpportunityRepository) {}
  list(userId: string, query: unknown) { return this.repository.list(userId, opportunityListSchema.parse(query)); }
  get(userId: string, id: string) { return this.repository.get(userId, opportunityIdSchema.parse(id)); }
  create(userId: string, body: unknown, traceId: string) {
    const input = opportunityInputSchema.parse(body);
    return this.repository.create(userId, { ...input, deadline: input.deadline ? new Date(input.deadline) : undefined, sourceUrl: input.sourceUrl ? canonicalUrl(input.sourceUrl) : undefined }, traceId);
  }
  update(userId: string, id: string, body: unknown, traceId: string) {
    const input = opportunityUpdateSchema.parse(body);
    return this.repository.update(userId, opportunityIdSchema.parse(id), { ...input, deadline: input.deadline ? new Date(input.deadline) : undefined, sourceUrl: input.sourceUrl ? canonicalUrl(input.sourceUrl) : undefined }, traceId);
  }
  setStatus(userId: string, id: string, body: unknown, traceId: string) {
    const { status } = manualStatusSchema.parse(body);
    return this.repository.update(userId, opportunityIdSchema.parse(id), { status }, traceId);
  }
  delete(userId: string, id: string, traceId: string) { return this.repository.delete(userId, opportunityIdSchema.parse(id), traceId); }
}
