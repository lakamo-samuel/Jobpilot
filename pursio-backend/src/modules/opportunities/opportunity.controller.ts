import type { Request, Response } from "express";
import type { OpportunityService } from "./opportunity.service.js";

export class OpportunityController {
  constructor(private readonly service: OpportunityService) {}
  list = async (req: Request, res: Response) => res.json({ items: await this.service.list(req.user!.id, req.query) });
  get = async (req: Request, res: Response) => {
    const row = await this.service.get(req.user!.id, String(req.params.id));
    if (!row) { res.status(404).json({ error: "not_found" }); return; }
    res.json(row);
  };
  create = async (req: Request, res: Response) => {
    const row = await this.service.create(req.user!.id, req.body, req.traceId!);
    if (!row) { res.status(409).json({ error: "duplicate_opportunity" }); return; }
    res.status(201).json(row);
  };
  update = async (req: Request, res: Response) => {
    const row = await this.service.update(req.user!.id, String(req.params.id), req.body, req.traceId!);
    if (!row) { res.status(404).json({ error: "not_found" }); return; }
    res.json(row);
  };
  setStatus = async (req: Request, res: Response) => {
    const row = await this.service.setStatus(req.user!.id, String(req.params.id), req.body, req.traceId!);
    if (!row) { res.status(404).json({ error: "not_found" }); return; }
    res.json(row);
  };
  delete = async (req: Request, res: Response) => {
    if (!(await this.service.delete(req.user!.id, String(req.params.id), req.traceId!))) { res.status(404).json({ error: "not_found" }); return; }
    res.status(204).end();
  };
}
