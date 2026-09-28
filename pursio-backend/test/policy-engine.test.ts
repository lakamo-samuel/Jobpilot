import assert from "node:assert/strict";
import { test } from "@jest/globals";
import { evaluateEmailSend, type SendContext, type SendPolicy } from "../src/agent/policy/policy-engine.js";
const policy: SendPolicy = { paused: false, globalMode: "auto", minMatchScore: 70, autoSendMinScore: 85, maxDailyOutreach: 5, exclusions: [] };
const context: SendContext = { matchScore: 90, hardRulePass: true, companyName: "Example", companyDomain: "example.com", doNotContact: false, risk: "low", hasUnknowns: false, sentToday: 0, localTime: "12:00" };
const decide = (p: Partial<SendPolicy> = {}, c: Partial<SendContext> = {}) => evaluateEmailSend({ ...policy, ...p }, { ...context, ...c });

test("only an eligible low-risk send may execute automatically", () => {
  assert.equal(decide().decision, "AUTO_EXECUTE");
  assert.equal(decide({ globalMode: "prepare" }).decision, "REQUIRE_APPROVAL");
  assert.equal(decide({}, { risk: "restricted" }).decision, "REQUIRE_APPROVAL");
});
test("hard rules, pause, exclusions and stop requests always deny", () => {
  assert.equal(decide({ paused: true }).decision, "DENY");
  assert.equal(decide({}, { hardRulePass: false }).decision, "DENY");
  assert.equal(decide({ exclusions: ["example.com"] }).decision, "DENY");
  assert.equal(decide({ exclusions: ["example.com"] }, { companyDomain: "jobs.example.com" }).decision, "DENY");
  assert.equal(decide({}, { doNotContact: true }).decision, "DENY");
  assert.equal(decide({}, { risk: "forbidden" }).decision, "DENY");
});
test("limits and uncertainty prevent automatic sends", () => {
  assert.equal(decide({}, { sentToday: 5 }).decision, "DENY");
  assert.equal(decide({}, { matchScore: 69 }).decision, "DENY");
  assert.equal(decide({}, { matchScore: 75 }).decision, "REQUIRE_APPROVAL");
  assert.equal(decide({}, { hasUnknowns: true }).decision, "REQUIRE_APPROVAL");
  assert.equal(decide({ quietHoursStart: "22:00", quietHoursEnd: "07:00" }, { localTime: "23:00" }).decision, "REQUIRE_APPROVAL");
});
