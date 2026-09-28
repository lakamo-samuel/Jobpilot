import assert from "node:assert/strict";
import { test } from "@jest/globals";
import { cvEditSchema, cvInputSchema } from "../src/modules/cvs/cv.schema.js";

test("CV role focus is user-defined, editable, and optional on versions", () => {
  assert.deepEqual(cvEditSchema.parse({ roleFocus: "Video editor" }), { roleFocus: "Video editor" });
  assert.deepEqual(cvEditSchema.parse({ label: "Full-stack CV", roleFocus: "Full-stack developer" }), { label: "Full-stack CV", roleFocus: "Full-stack developer" });
  assert.equal(cvInputSchema.parse({ label: "New version" }).roleFocus, undefined);
  assert.equal(cvEditSchema.safeParse({}).success, false);
  assert.equal(cvEditSchema.safeParse({ roleFocus: "x".repeat(161) }).success, false);
});
