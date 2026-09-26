import type { Request, Response } from "express";
import type { ProfileService } from "./profile.service.js";

export class ProfileController {
  constructor(private readonly service: ProfileService) {}
  get = async (req: Request, res: Response) => res.json(await this.service.get(req.user!.id));
  update = async (req: Request, res: Response) => res.json(await this.service.update(req.user!.id, req.body, req.traceId!));
  addFact = async (req: Request, res: Response) => res.status(201).json(await this.service.addFact(req.user!.id, req.body, req.traceId!));
  deleteFact = async (req: Request, res: Response) => {
    if (!(await this.service.deleteFact(req.user!.id, String(req.params.id), req.traceId!))) { res.status(404).json({ error: "not_found" }); return; }
    res.status(204).end();
  };
}
