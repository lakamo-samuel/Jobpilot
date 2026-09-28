import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { test } from "@jest/globals";
import { eq } from "drizzle-orm";
import { createDb } from "../src/db/index.js";
import { cvs, users } from "../src/db/schema/index.js";
import { CvRepository } from "../src/modules/cvs/cv.repository.js";
import { CvExtractionService } from "../src/modules/cvs/cv-extraction.service.js";
import { extractCvText } from "../src/modules/cvs/cv-text-parser.js";
import { keepEvidenceBoundClaims, type ExtractedCvProfile } from "../src/modules/cvs/cv-extraction.schema.js";
import type { FileStore } from "../src/integrations/storage/file-store.js";
import type { AiProvider } from "../src/integrations/ai/ai-provider.js";

const fixture = (name: string) => readFile(new URL(`./fixtures/${name}`, import.meta.url));
const pdf = "application/pdf";
const docx = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const profile: ExtractedCvProfile = {
  name: { value: "Alex Smith", evidence: "Alex Smith" },
  headline: { value: "Backend Engineer", evidence: "Backend Engineer" },
  skills: [{ value: "Node.js", evidence: "Skills Node.js" }, { value: "Kubernetes", evidence: "Skills Kubernetes" }],
  experience: [], education: [],
};

test("extracts selectable text from PDF and DOCX", async () => {
  for (const [file, mime] of [["sample-cv.pdf", pdf], ["sample-cv.docx", docx]]) {
    const text = await extractCvText(await fixture(file), mime);
    assert.match(text, /Alex Smith/);
    assert.match(text, /PostgreSQL/);
  }
});

test("removes claims without matching source evidence", () => {
  const filtered = keepEvidenceBoundClaims(profile, "Alex Smith Backend Engineer Skills Node.js and PostgreSQL");
  assert.deepEqual(filtered.skills, [{ value: "Node.js", evidence: "Skills Node.js" }]);
  assert.equal(filtered.name?.value, "Alex Smith");
});

(process.env.TEST_DATABASE_URL ? test : test.skip)("extraction stores owner-only text and supports failed-job retry", async () => {
  const { db, pool } = createDb(process.env.TEST_DATABASE_URL!);
  const [owner] = await db.insert(users).values({ email: `extract-${randomUUID()}@example.test`, passwordHash: "test", displayName: "Alex" }).returning({ id: users.id });
  const [stranger] = await db.insert(users).values({ email: `extract-${randomUUID()}@example.test`, passwordHash: "test", displayName: "Other" }).returning({ id: users.id });
  const repository = new CvRepository(db);
  try {
    const [cv] = await db.insert(cvs).values({ userId: owner.id, familyId: randomUUID(), label: "CV", fileName: "sample.pdf", storageKey: "test/sample.pdf", mimeType: pdf, checksum: randomUUID(), byteSize: 100, version: 1 }).returning({ id: cvs.id });
    const files: FileStore = { put: async () => {}, downloadUrl: () => "", get: async () => fixture("sample-cv.pdf"), delete: async () => {} };
    const ai: AiProvider = { generateJson: async () => profile as never };
    await new CvExtractionService(repository, files, ai).process(cv.id, 0, 3);
    const ready = await repository.get(owner.id, cv.id);
    assert.equal(ready?.status, "ready");
    assert.match(ready?.extractedText ?? "", /Alex Smith/);
    assert.deepEqual(ready?.extractedProfile?.skills, [{ value: "Node.js", evidence: "Skills Node.js" }]);
    assert.equal(await repository.get(stranger.id, cv.id), undefined);
    assert.equal(await repository.retryExtraction(stranger.id, cv.id, randomUUID()), undefined);
    const [failed] = await db.insert(cvs).values({ userId: owner.id, familyId: randomUUID(), label: "Scanned", fileName: "scan.pdf", storageKey: "test/scan.pdf", mimeType: pdf, checksum: randomUUID(), byteSize: 100, version: 1 }).returning({ id: cvs.id });
    const blankFiles = { ...files, get: async () => Buffer.from("bad file") };
    await assert.rejects(new CvExtractionService(repository, blankFiles, ai).process(failed.id, 2, 3));
    assert.equal((await repository.get(owner.id, failed.id))?.status, "error");
    assert.equal((await repository.retryExtraction(owner.id, failed.id, randomUUID()))?.status, "parsing");
  } finally {
    await db.delete(users).where(eq(users.id, owner.id));
    await db.delete(users).where(eq(users.id, stranger.id));
    await pool.end();
  }
});
