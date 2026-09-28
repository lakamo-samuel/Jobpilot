import { Router } from "express";
import type { AppDependencies } from "../../app-dependencies.js";
import { HimalayasJobSource } from "../../integrations/jobs/himalayas-job-source.js";
import { JoobleJobSource } from "../../integrations/jobs/jooble-job-source.js";
import { OpportunityRepository } from "../opportunities/opportunity.repository.js";
import { JobSearchService } from "./job-search.service.js";

export function jobRoutes({ config, db, jobSearchCache }: AppDependencies) {
  const router = Router();
  const remote = new HimalayasJobSource();
  const regional = new Map(Object.entries(config.joobleRegions).map(([country, region]) => [country, new JoobleJobSource(region)]));
  const service = new JobSearchService(config, jobSearchCache, input => input.workMode === "remote" ? remote : regional.get(input.country), new OpportunityRepository(db));
  router.get("/sources", (_req, res) => res.json(service.sources()));
  router.post("/search", async (req, res) => res.json(await service.search(req.user!.id, req.body)));
  router.post("/save", async (req, res) => {
    const result = await service.save(req.user!.id, req.body, req.traceId!);
    res.status(result.created ? 201 : 200).json(result);
  });
  return router;
}
