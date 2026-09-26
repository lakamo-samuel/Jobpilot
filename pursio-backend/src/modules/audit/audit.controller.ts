import type { Request, Response } from "express";
import type { AuditService } from "./audit.service.js";

export class AuditController {
  constructor(private readonly service: AuditService) {}
  list = async (req: Request, res: Response) => res.json({ items: await this.service.list(req.user!.id) });
}
