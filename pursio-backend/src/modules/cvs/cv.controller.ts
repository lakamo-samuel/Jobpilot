import type { Request, Response } from "express";
import type { CvService } from "./cv.service.js";

export class CvController {
  constructor(private readonly service: CvService) {}
  list = async (req: Request, res: Response) => res.json({ items: await this.service.list(req.user!.id) });
  get = async (req: Request, res: Response) => {
    const row = await this.service.get(req.user!.id, String(req.params.id));
    if (!row) { res.status(404).json({ error: "not_found" }); return; }
    res.json(row);
  };
  getExtraction = async (req: Request, res: Response) => res.json(await this.service.getExtraction(req.user!.id, String(req.params.id)));
  retryExtraction = async (req: Request, res: Response) => res.status(202).json(await this.service.retryExtraction(req.user!.id, String(req.params.id), req.traceId!));
  upload = async (req: Request, res: Response) => res.status(201).json(await this.service.upload(req.user!.id, req.body, req.file, req.traceId!));
  uploadVersion = async (req: Request, res: Response) => res.status(201).json(await this.service.upload(req.user!.id, req.body, req.file, req.traceId!, String(req.params.id)));
  updateMetadata = async (req: Request, res: Response) => {
    const row = await this.service.updateMetadata(req.user!.id, String(req.params.id), req.body, req.traceId!);
    if (!row) { res.status(404).json({ error: "not_found" }); return; }
    res.json(row);
  };
  setDefault = async (req: Request, res: Response) => {
    const row = await this.service.setDefault(req.user!.id, String(req.params.id), req.traceId!);
    if (!row) { res.status(404).json({ error: "not_found" }); return; }
    res.json(row);
  };
  download = async (req: Request, res: Response) => {
    const file = await this.service.download(req.user!.id, String(req.params.id));
    res.setHeader("Cache-Control", "no-store");
    res.redirect(303, file.url);
  };
  delete = async (req: Request, res: Response) => { await this.service.delete(req.user!.id, String(req.params.id), req.traceId!); res.status(204).end(); };
}
