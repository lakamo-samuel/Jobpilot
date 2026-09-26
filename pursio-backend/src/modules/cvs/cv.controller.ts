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
  upload = async (req: Request, res: Response) => res.status(201).json(await this.service.upload(req.user!.id, req.body, req.file, req.traceId!));
  uploadVersion = async (req: Request, res: Response) => res.status(201).json(await this.service.upload(req.user!.id, req.body, req.file, req.traceId!, String(req.params.id)));
  rename = async (req: Request, res: Response) => {
    const row = await this.service.rename(req.user!.id, String(req.params.id), req.body, req.traceId!);
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
    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Content-Length", file.body.length);
    res.attachment(file.fileName);
    res.send(file.body);
  };
  delete = async (req: Request, res: Response) => { await this.service.delete(req.user!.id, String(req.params.id), req.traceId!); res.status(204).end(); };
}
