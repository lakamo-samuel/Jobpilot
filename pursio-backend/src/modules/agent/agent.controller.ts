import type { Request, Response } from "express";
import type { AgentService } from "./agent.service.js";

export class AgentController {
  constructor(private readonly service: AgentService) {}
  getPolicy = async (req: Request, res: Response) => res.json(await this.service.getPolicy(req.user!.id));
  updatePolicy = async (req: Request, res: Response) => res.json(await this.service.updatePolicy(req.user!.id, req.body, req.traceId!));
  pause = async (req: Request, res: Response) => res.json(await this.service.setPaused(req.user!.id, true, req.traceId!));
  resume = async (req: Request, res: Response) => res.json(await this.service.setPaused(req.user!.id, false, req.traceId!));
}
