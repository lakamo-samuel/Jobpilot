import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "@jest/globals";
import { eq } from "drizzle-orm";
import { createDb } from "../src/db/index.js";
import { cvs, users } from "../src/db/schema/index.js";
import { AppError } from "../src/shared/errors/app-error.js";
import { CvRepository } from "../src/modules/cvs/cv.repository.js";

(process.env.TEST_DATABASE_URL ? test : test.skip)("CV quota counts distinct families, not versions, and serializes concurrent uploads", async () => {
  const { db, pool } = createDb(process.env.TEST_DATABASE_URL!);
  const [user] = await db.insert(users).values({ email: `cv-${randomUUID()}@example.test`, passwordHash: "test", displayName: "CV Test" }).returning({ id: users.id });
  const repository = new CvRepository(db);
  try {
    for (let n = 0; n < 9; n++) {
      await db.insert(cvs).values({ userId: user.id, familyId: randomUUID(), label: `CV ${n}`, fileName: `cv${n}.pdf`, storageKey: `tests/${randomUUID()}.pdf`, mimeType: "application/pdf", checksum: randomUUID(), byteSize: 100, version: 1 });
    }
    const attempts = await Promise.allSettled([repository.reserve(user.id, 100, true, 10, 104857600), repository.reserve(user.id, 100, true, 10, 104857600)]);
    assert.equal(attempts.filter(x => x.status === "fulfilled").length, 1);
    assert.equal(attempts.filter(x => x.status === "rejected" && x.reason instanceof AppError && x.reason.code === "cv_quota_exceeded").length, 1);
    await repository.release((attempts.find(x => x.status === "fulfilled") as PromiseFulfilledResult<string>).value);
    await db.insert(cvs).values({ userId: user.id, familyId: randomUUID(), label: "CV 10", fileName: "cv10.pdf", storageKey: `tests/${randomUUID()}.pdf`, mimeType: "application/pdf", checksum: randomUUID(), byteSize: 100, version: 1 });
    await assert.rejects(repository.reserve(user.id, 100, true, 10, 104857600), (error: unknown) => error instanceof AppError && error.code === "cv_quota_exceeded");
    const versionReservation = await repository.reserve(user.id, 100, false, 10, 104857600);
    await repository.release(versionReservation);
  } finally {
    await db.delete(users).where(eq(users.id, user.id));
    await pool.end();
  }
});

(process.env.TEST_DATABASE_URL ? test : test.skip)("CV metadata edits are owner-only and keep other fields", async () => {
  const { db, pool } = createDb(process.env.TEST_DATABASE_URL!);
  const [owner, stranger] = await db.insert(users).values([
    { email: `cv-${randomUUID()}@example.test`, passwordHash: "test", displayName: "Owner" },
    { email: `cv-${randomUUID()}@example.test`, passwordHash: "test", displayName: "Stranger" },
  ]).returning({ id: users.id });
  const repository = new CvRepository(db);
  try {
    const [cv] = await db.insert(cvs).values({ userId: owner.id, familyId: randomUUID(), label: "General", roleFocus: "General", fileName: "cv.pdf", storageKey: `tests/${randomUUID()}.pdf`, mimeType: "application/pdf", checksum: randomUUID(), byteSize: 100, version: 1 }).returning({ id: cvs.id });
    assert.equal(await repository.updateMetadata(stranger.id, cv.id, { roleFocus: "Video editor" }, randomUUID()), undefined);
    const focused = await repository.updateMetadata(owner.id, cv.id, { roleFocus: "Full-stack developer" }, randomUUID());
    assert.equal(focused?.label, "General");
    assert.equal(focused?.roleFocus, "Full-stack developer");
    const renamed = await repository.updateMetadata(owner.id, cv.id, { label: "Full-stack CV" }, randomUUID());
    assert.equal(renamed?.label, "Full-stack CV");
    assert.equal(renamed?.roleFocus, "Full-stack developer");
  } finally {
    await db.delete(users).where(eq(users.id, owner.id));
    await db.delete(users).where(eq(users.id, stranger.id));
    await pool.end();
  }
});
