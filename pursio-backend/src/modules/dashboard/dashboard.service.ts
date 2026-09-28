import type { DashboardRepository } from "./dashboard.repository.js";

export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}
  get(userId: string) { return this.repository.get(userId); }
}
