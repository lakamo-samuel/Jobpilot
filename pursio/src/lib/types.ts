// ─── Core Domain Types ────────────────────────────────────────

export type OpportunityType = "JOB" | "CLIENT" | "INBOUND";

export type OpportunityStatus =
  | "NEW"
  | "QUALIFIED"
  | "SKIPPED"
  | "PREPARED"
  | "PENDING_APPROVAL"
  | "APPLIED"
  | "CONTACTED"
  | "REPLIED"
  | "INTERVIEW"
  | "INTERESTED"
  | "OFFER"
  | "WON"
  | "REJECTED"
  | "LOST"
  | "CLOSED";

export type AgentStatus = "running" | "paused" | "processing" | "attention" | "error" | "offline";

export type ActionStatus = "pending" | "approved" | "rejected" | "expired" | "executing" | "failed" | "succeeded";

export type ReplyIntent =
  | "interested"
  | "question"
  | "interview"
  | "neutral"
  | "rejection"
  | "out_of_office"
  | "unsubscribe";

export type NotificationType = "critical" | "high_value" | "approval" | "digest" | "info";

export interface MatchSummary {
  score: number;
  hardRulePass: boolean;
  matchedSkills: string[];
  gaps: string[];
  unknowns: string[];
  explanation: string;
}

export interface Opportunity {
  id: string;
  type: OpportunityType;
  companyName: string;
  companyDomain?: string;
  title: string;
  description: string;
  location?: string;
  workMode?: "remote" | "hybrid" | "onsite";
  compensation?: { min?: number; max?: number; currency?: string };
  deadline?: string;
  source: string;
  sourceUrl?: string;
  status: OpportunityStatus;
  discoveredAt: string;
  updatedAt: string;
  match?: MatchSummary;
  cvUsed?: string;
  requiresAttention?: boolean;
  attentionReason?: string;
}

export interface CV {
  id: string;
  label: string;
  fileName: string;
  version: number;
  isDefault: boolean;
  roleFocus: string;
  skills: string[];
  lastUsed?: string;
  usageCount: number;
  uploadedAt: string;
  status: "ready" | "parsing" | "error";
}

export interface ProfileFact {
  id: string;
  type: string;
  value: string;
  verified: boolean;
  evidenceSource: string;
}

export interface Profile {
  headline: string;
  summary: string;
  yearsExperience: number;
  targetRoles: string[];
  skills: string[];
  locations: string[];
  workModes: string[];
  compensationMin?: number;
  compensationCurrency: string;
  links: { github?: string; portfolio?: string; linkedin?: string };
  facts: ProfileFact[];
}

export interface AgentPolicy {
  globalMode: "observe" | "prepare" | "auto";
  minMatchScore: number;
  autoSendMinScore: number;
  maxDailyOutreach: number;
  compensationMin?: number;
  requireApprovalFor: string[];
  exclusions: string[];
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface AuditEvent {
  id: string;
  eventType: string;
  actor: "agent" | "owner";
  entityType: string;
  entityId?: string;
  traceId: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface Conversation {
  id: string;
  opportunityId: string;
  companyName: string;
  role: string;
  lastMessage: string;
  lastMessageAt: string;
  intent?: ReplyIntent;
  needsAttention: boolean;
  messageCount: number;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  entityRef?: { type: string; id: string };
  readAt?: string;
  createdAt: string;
}

export interface Integration {
  id: string;
  provider: "gmail" | "resume_provider";
  status: "connected" | "disconnected" | "error" | "syncing";
  lastSyncAt?: string;
  scopes: string[];
  email?: string;
}

export interface DashboardMetrics {
  opportunitiesFoundToday: number;
  highMatches: number;
  actionsTaken: number;
  positiveReplies: number;
  agentStatus: AgentStatus;
  lastSyncAt: string;
  queueDepth: number;
  dailyLimitUsed: number;
  dailyLimitMax: number;
}

export interface AttentionItem {
  id: string;
  urgency: "reply_interview" | "approval_required" | "missing_info" | "integration_problem";
  title: string;
  description: string;
  action: string;
  entityRef: { type: string; id: string };
  createdAt: string;
}
