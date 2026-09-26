export type SendDecision = { decision: "DENY" | "REQUIRE_APPROVAL" | "AUTO_EXECUTE"; reason: string };
export type SendPolicy = {
  paused: boolean;
  globalMode: "observe" | "prepare" | "auto";
  minMatchScore: number;
  autoSendMinScore: number;
  maxDailyOutreach: number;
  exclusions: string[];
  quietHoursStart?: string;
  quietHoursEnd?: string;
};
export type SendContext = {
  matchScore: number;
  hardRulePass: boolean;
  companyName: string;
  companyDomain?: string;
  doNotContact: boolean;
  risk: "low" | "restricted" | "forbidden";
  hasUnknowns: boolean;
  sentToday: number;
  localTime: string;
};

const deny = (reason: string): SendDecision => ({ decision: "DENY", reason });
const ask = (reason: string): SendDecision => ({ decision: "REQUIRE_APPROVAL", reason });
const normalize = (value: string) => value.trim().toLowerCase().replace(/^www\./, "");
function isExcluded(policy: SendPolicy, context: SendContext) {
  const company = normalize(context.companyName);
  const domain = normalize(context.companyDomain ?? "");
  return policy.exclusions.some(item => {
    const excluded = normalize(item);
    return !!excluded && (excluded === company || excluded === domain || (!!domain && domain.endsWith(`.${excluded}`)));
  });
}
function insideQuietHours(start: string, end: string, time: string) {
  if (start === end) return false;
  return start < end ? time >= start && time < end : time >= start || time < end;
}

export function evaluateEmailSend(policy: SendPolicy, context: SendContext): SendDecision {
  if (policy.paused) return deny("agent_paused");
  if (context.risk === "forbidden") return deny("forbidden_action");
  if (context.doNotContact || isExcluded(policy, context)) return deny("do_not_contact");
  if (!context.hardRulePass) return deny("hard_rule_failed");
  if (context.matchScore < policy.minMatchScore) return deny("below_match_threshold");
  if (policy.globalMode === "observe") return deny("observe_mode");
  if (context.sentToday >= policy.maxDailyOutreach) return deny("daily_limit_reached");
  if (context.risk === "restricted") return ask("restricted_action");
  if (policy.globalMode === "prepare") return ask("prepare_mode");
  if (context.hasUnknowns) return ask("unresolved_information");
  if (context.matchScore < policy.autoSendMinScore) return ask("below_auto_send_threshold");
  if (policy.quietHoursStart && policy.quietHoursEnd && insideQuietHours(policy.quietHoursStart, policy.quietHoursEnd, context.localTime)) return ask("quiet_hours");
  return { decision: "AUTO_EXECUTE", reason: "policy_conditions_met" };
}
