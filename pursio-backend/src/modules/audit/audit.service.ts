import { AuditRepository } from "./audit.repository.js";
export class AuditService {
  constructor(private readonly repository: AuditRepository) {}
  list(userId: string) { return this.repository.list(userId); }
}
