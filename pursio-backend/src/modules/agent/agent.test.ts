import assert from "node:assert/strict";
import test from "node:test";
import { defaultPolicy, policySchema } from "./agent.schema.js";

test("policy rejects auto-send threshold below qualification threshold", () => {
  assert.equal(policySchema.safeParse({ ...defaultPolicy, autoSendMinScore: 60 }).success, false);
});

test("policy rejects outreach limits outside the permitted range", () => {
  assert.equal(policySchema.safeParse({ ...defaultPolicy, maxDailyOutreach: -1 }).success, false);
  assert.equal(policySchema.safeParse({ ...defaultPolicy, maxDailyOutreach: 101 }).success, false);
});
