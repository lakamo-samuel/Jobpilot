Pursio — Product Blueprint v0.1

Personal Autonomous Opportunity Agent

Product Blueprint v0.1 • PRD • FRD • Technical Design • Data Model • Agent Specification • UX/UI • Security • Roadmap

Status: Personal-first MVP / internal tool

0. Executive Summary

Pursio is a personal autonomous opportunity agent. It continuously discovers relevant jobs and client opportunities, evaluates them against the owner's profile, prepares tailored application or outreach material, takes permitted actions automatically, and monitors replies and outcomes.

The first version is intentionally personal-first: one owner, one profile, one or more CVs, one Gmail connection, configurable autonomy rules, and a complete activity trail. It is not initially a public SaaS.

Core product loop:

Understand the owner: skills, experience, preferences, portfolio, GitHub, compensation floor, locations, work type, exclusions and CVs.
Observe opportunity sources: primarily Gmail job alerts and direct messages; later approved APIs, feeds and public business discovery sources.
Extract and normalize opportunities into structured records.
Score fit and explain why the opportunity is or is not suitable.
Choose the appropriate CV/profile material and prepare a tailored application, cover note or client pitch.
Act according to autonomy policy: auto-execute low-risk actions, request approval for restricted actions, or skip.
Monitor replies, classify interest, notify the owner and maintain the opportunity pipeline.
Learn from explicit feedback and outcomes without silently changing critical rules.

MVP success definition:

Pursio can reliably ingest job-related Gmail messages and convert them into deduplicated opportunities.
It can score each opportunity against the owner's profile with an auditable explanation.
It can generate a truthful tailored application package without inventing experience or credentials.
It can track sent outreach/applications and detect replies in the same conversation.
It can notify the owner when a recruiter/client shows meaningful interest.
Every autonomous action is constrained by user-defined rules and recorded in an immutable-style audit log.
1. Product Requirements Document (PRD)
1.1 Problem

Job hunting and freelance client acquisition are fragmented. Opportunities arrive through email alerts, job platforms, recruiter messages and manual searches. The user repeatedly evaluates fit, edits CVs, writes messages, applies, follows up and tracks replies. The repetitive work consumes time that could be spent improving skills or doing paid work.

1.2 Product vision

A persistent personal agent that knows what the owner wants, watches for suitable opportunities, prepares the right materials, acts within explicit boundaries and surfaces only decisions or conversations that deserve human attention.

1.3 Goals
Reduce repetitive opportunity-search and application work.
Increase the number of genuinely relevant opportunities processed.
Keep applications and outreach personalized rather than mass-spammed.
Provide one pipeline for jobs and client prospects.
Make autonomy controllable, observable and reversible where possible.
Preserve factual integrity in CVs, applications and pitches.
1.4 Non-goals for V1
Building a full CV design/editor product.
Becoming a general-purpose CRM.
Automating arbitrary websites through stealth browser behavior.
Circumventing platform anti-bot controls, CAPTCHAs or access restrictions.
Mass unsolicited messaging.
Automatically negotiating or accepting contracts/offers.
Supporting teams, organizations, billing or subscriptions.
1.5 Primary user

The initial user is the owner/developer: a software engineer seeking software jobs, internships, freelance work and direct client opportunities. Architecture should avoid hard-coding software engineering so the product can broaden later.

1.6 Opportunity types
Type	Examples	Primary action
Job	Full-time, part-time, internship, contract	Assess → tailor CV/materials → apply or prepare application
Client	Business needing a website/app/technical service	Research → qualify → personalized pitch → follow-up
Inbound	Recruiter/client replies or direct requests	Classify → notify → draft response
1.7 Functional scope by release
Capability	MVP	Later
Profile & preferences	Yes	Multiple personas/profiles
CV upload/versioning	Yes	External CV-generator API
Gmail ingestion	Yes	Outlook/other mail
Job email extraction	Yes	Direct job-board APIs
Fit scoring	Yes	Outcome-trained ranking
Application drafting	Yes	More ATS-specific flows
Auto-send email outreach	Rule-controlled	Campaign optimization
Client discovery	Basic approved sources/manual import	Broader discovery/enrichment
Reply detection	Yes	Conversation copilot
Browser auto-apply	No	Only compliant/approved integrations
Dashboard/pipeline	Yes	Analytics/cohorts
1.8 Key metrics
Relevant opportunity precision: percentage of surfaced opportunities the owner considers worth pursuing.
Processing success rate: percentage of source messages successfully extracted and classified.
Application/outreach completion rate.
Positive reply rate and interview/client-interest rate.
False-action rate: autonomous actions the owner would not have approved; target should be near zero.
Duplicate rate.
Time saved per week.
2. Functional Requirements Document (FRD)
2.1 Onboarding & profile
ID	Requirement
FR-001	Create a single-owner account and authenticated session.
FR-002	Capture target roles, skills, years/level, preferred industries, work modes, locations/time zones, compensation floor, contract preferences and excluded categories.
FR-003	Store portfolio, GitHub and other professional links.
FR-004	Allow hard rules such as 'never apply below X', 'remote only', 'do not contact this company/domain', and 'never claim skills not in my profile'.
2.2 CV / document manager
ID	Requirement
FR-010	Upload PDF/DOCX CVs and preserve the original file.
FR-011	Extract a structured candidate profile from each CV.
FR-012	Support multiple CV versions with labels such as Frontend, Full-stack and General.
FR-013	Select a default CV and allow the agent to choose a better matching version.
FR-014	Track which CV version was used for each opportunity.
FR-015	Provide an integration boundary for a future external CV-generation/tailoring service.
2.3 Gmail integration
ID	Requirement
FR-020	Connect Gmail using OAuth rather than storing the Gmail password.
FR-021	Ingest relevant messages using configurable labels/senders/keywords and provider metadata.
FR-022	Classify messages: job alert, recruiter outreach, client reply, rejection, interview/meeting, unrelated, or uncertain.
FR-023	Preserve source message/thread identifiers so replies can be correlated.
FR-024	Avoid processing the same message more than once.
FR-025	Support disconnect/revoke and stop all future processing.
2.4 Opportunity extraction & matching
ID	Requirement
FR-030	Extract company, role/service need, description, skills, location, work mode, compensation if present, source URL, deadline and contact information.
FR-031	Normalize opportunities into one common model regardless of source.
FR-032	Deduplicate by source ID, canonical URL and semantic similarity.
FR-033	Produce a 0–100 match score plus separate hard-rule pass/fail.
FR-034	Explain matched skills, gaps, unknowns, risks and the reason for the recommendation.
FR-035	Never convert an unknown requirement into a claimed user skill.
2.5 Action engine
ID	Requirement
FR-040	Actions have risk levels and an autonomy mode: automatic, approval-required or forbidden.
FR-041	Generate truthful tailored cover notes, email applications and client pitches.
FR-042	Use the selected CV and include only verified profile facts.
FR-043	Send email through the connected mailbox only when policy allows.
FR-044	Record the exact content, model output version, policy decision and execution result.
FR-045	Rate-limit outreach and prevent repeated contact with the same recipient/company.
FR-046	Do not bypass CAPTCHA, platform restrictions or unsupported application mechanisms.
2.6 Reply intelligence
ID	Requirement
FR-050	Watch tracked Gmail threads for replies.
FR-051	Classify reply intent: interested, question, interview/request, neutral, rejection, out-of-office, unsubscribe/stop.
FR-052	Immediately stop automated follow-up when a recipient asks not to be contacted.
FR-053	Notify the owner for high-value replies such as client interest, recruiter response or interview invitation.
FR-054	Generate a suggested response but require approval for negotiation, pricing commitments, contracts and sensitive decisions.
2.7 Dashboard & controls
ID	Requirement
FR-060	Show daily summary: found, qualified, acted on, replies, interviews/interested clients and failures.
FR-061	Unified opportunity pipeline with filters for Jobs, Clients and Inbound.
FR-062	Opportunity detail view includes evidence, fit analysis, CV used, drafts/actions and conversation history.
FR-063	Activity log shows every automated/manual action.
FR-064	Agent can be globally paused with one control.
FR-065	Allow per-source and per-action autonomy configuration.
3. UX / UI Specification
3.1 Design direction

Pursio should feel like an operations cockpit, not a traditional job board. The interface should be calm, light, information-dense and confidence-oriented. Automation status and reasons must be visible; the user should never wonder what the agent did.

3.2 Information architecture
Overview — today's activity, high-priority opportunities, replies requiring attention, agent status.
Opportunities — unified pipeline with Jobs / Clients / Inbound tabs.
Inbox — tracked conversations and AI classification.
Activity — chronological audit trail of discoveries, decisions, sends, failures and retries.
Profile — professional facts, goals, constraints and links.
CVs — uploaded versions, extracted data, default/role mapping and usage history.
Integrations — Gmail first; future CV service and opportunity providers.
Agent Rules — autonomy, thresholds, limits, exclusions and quiet hours.
Settings — notifications, privacy, data retention and model/provider configuration.
3.3 Overview wireframe
Top bar: Pursio logo/name | Agent status (Running / Paused / Attention) | Pause button | notifications.
Primary cards: Opportunities found today | High matches | Applications/outreach sent | Positive replies.
Main column: 'Needs your attention' cards, followed by 'Agent activity'. Side column: agent health, Gmail sync, queue status and today's limits.
3.4 Opportunity card
Company/client name and role or service need.
Opportunity type and source.
Match score plus hard-rule status.
Three concise reasons for fit and important gaps.
Status: New → Qualified → Prepared → Applied/Contacted → Replied → Interview/Interested → Won/Offer or Closed.
Primary action changes by state: Review, Approve, Open conversation, Mark outcome.
3.5 Visual principles
Use generous whitespace, subtle borders and restrained status colors.
Never hide automation behind animation; show explicit state and timestamps.
Scores should always be accompanied by reasons.
Dangerous actions use clear confirmation and policy explanation.
Mobile UI focuses on notifications, approvals, replies and pause/resume; deep configuration is desktop-first.
4. Technical Design Document (TDD)
4.1 Recommended stack
Layer	Choice	Reason
Frontend	Next.js + TypeScript + Tailwind	Fast dashboard development, typed full-stack ecosystem.
Backend API	Node.js + TypeScript; Next route handlers initially or separate Fastify/Express service	Keep MVP simple; split when worker/API load warrants it.
Database	PostgreSQL + Drizzle ORM	Relational integrity, JSONB where useful, familiar stack.
Queue	Redis + BullMQ	Scheduled ingestion, parsing, AI jobs, retries, follow-ups.
Object storage	S3-compatible storage / Cloudflare R2	CV/document originals and generated artifacts.
AI layer	Provider abstraction over OpenAI/Gemini/etc.	Avoid coupling core domain logic to one model.
Email	Gmail API with OAuth	Read alerts, thread correlation, drafts/sending under owner account.
Auth	Auth.js/Better Auth or equivalent	Single-owner auth now; OAuth-friendly.
Hosting	Vercel for UI/API if suitable + VPS/container worker	Long-running workers should not depend on short serverless executions.
4.2 Architecture

Browser → Web App/API → PostgreSQL. Background workers consume BullMQ jobs. Gmail ingestion creates source events. The extraction agent creates normalized opportunities. Policy/matching evaluates them. Preparation agents generate drafts/materials. The action executor performs only policy-authorized actions. Reply ingestion updates conversations and triggers notifications. Object storage holds CVs and generated documents.

4.3 Service boundaries
Identity/Profile Service — owner profile, preferences, professional facts.
Document Service — CV storage, parsing, versions, external CV-provider adapter.
Integration Service — OAuth tokens and provider-specific adapters.
Ingestion Service — Gmail events/polling fallback, source normalization and idempotency.
Opportunity Service — normalized jobs/client prospects, deduplication and lifecycle.
Matching Service — hard constraints, weighted score and explanation.
Agent Orchestrator — decides which specialist agent/job runs next.
Policy Engine — deterministic authorization of autonomous actions.
Action Executor — email/draft/notification execution; never decides its own permission.
Conversation Service — threads, replies, intent classification and follow-up state.
Audit Service — append-only-style event records and trace IDs.
4.4 Processing pipeline
Receive Gmail event or scheduled sync.
Store source_event with provider ID and content hash.
Classify message. Exit if unrelated.
Extract candidate opportunity/reply into strict schema.
Resolve duplicates and existing thread/company relationships.
Run deterministic hard rules.
Run semantic fit scoring and explanation.
If below threshold, archive as skipped; otherwise prepare action.
Select CV; optionally call CV-provider adapter when enabled.
Generate application/pitch from verified facts.
Policy engine returns AUTO_EXECUTE, REQUIRE_APPROVAL or DENY.
Executor performs allowed action and records audit event.
Monitor thread; classify future replies and escalate when appropriate.
4.5 API surface (illustrative)
Method	Route	Purpose
GET	/api/dashboard	Overview metrics and attention items
GET/PUT	/api/profile	Read/update professional profile
POST	/api/cvs	Upload CV
GET	/api/cvs	List CV versions
POST	/api/integrations/gmail/connect	Start Gmail OAuth
DELETE	/api/integrations/gmail	Disconnect Gmail
GET	/api/opportunities	Filter/search pipeline
GET	/api/opportunities/:id	Opportunity detail
POST	/api/opportunities/:id/approve	Approve pending action
POST	/api/opportunities/:id/reject	Reject pending action
GET/PUT	/api/agent-policy	Read/update autonomy rules
POST	/api/agent/pause	Global kill switch
POST	/api/agent/resume	Resume processing
GET	/api/activity	Audit/activity feed
5. Data Model
5.1 Core entities
Entity	Important fields
users	id, email, display_name, timezone, created_at
profiles	user_id, headline, summary, years_experience, target_roles[], skills JSONB, locations[], work_modes[], compensation_min, links JSONB
profile_facts	id, user_id, fact_type, value, evidence_source, verified, created_at
cvs	id, user_id, label, storage_key, mime_type, checksum, extracted_profile JSONB, is_default, version, created_at
integrations	id, user_id, provider, status, encrypted_token_ref, scopes, last_sync_at
source_events	id, provider, external_id, thread_external_id, content_hash, received_at, processed_at, classification
companies	id, name, domain, normalized_domain, metadata JSONB
contacts	id, company_id, name, email, role, do_not_contact
opportunities	id, type, company_id, title, description, source_url, source_event_id, location, work_mode, compensation JSONB, deadline, status, discovered_at
opportunity_requirements	id, opportunity_id, category, value, importance, evidence
matches	id, opportunity_id, profile_id, score, hard_rule_pass, matched JSONB, gaps JSONB, explanation, model_trace_id
applications	id, opportunity_id, cv_id, channel, status, submitted_at, external_reference
outreach_messages	id, opportunity_id, contact_id, direction, subject, body, provider_message_id, sent_at
conversations	id, opportunity_id, provider, external_thread_id, intent, last_message_at, needs_attention
action_requests	id, opportunity_id, action_type, risk_level, policy_decision, payload JSONB, status, expires_at
agent_policies	id, user_id, version, global_mode, thresholds JSONB, limits JSONB, exclusions JSONB, updated_at
agent_runs	id, agent_name, trigger_type, status, input_ref, output_ref, started_at, ended_at, trace_id
audit_events	id, actor, event_type, entity_type, entity_id, trace_id, details JSONB, created_at
notifications	id, user_id, type, title, body, entity_ref, read_at, created_at
5.2 Important constraints/indexes
Unique (provider, external_id) on source_events for idempotency.
Unique normalized company domain where known.
Unique provider thread ID on conversations.
Indexes on opportunities(status, type, discovered_at), matches(score), audit_events(trace_id, created_at).
GIN indexes only where JSONB querying proves necessary.
CV checksum prevents accidental duplicate uploads.
Contacts marked do_not_contact must be enforced at the database/service boundary, not only in prompts.
6. Agent Specification
6.1 Agent architecture

Use a deterministic orchestrator with specialist AI components rather than one unrestricted agent. The LLM proposes structured outputs; application code validates schemas and the policy engine decides whether anything may execute.

Agent	Responsibility	May execute external action?
Intake Classifier	Classify incoming source events	No
Opportunity Extractor	Extract structured job/client data with evidence	No
Matcher	Evaluate fit and explain score	No
Researcher	Gather permitted context from configured sources	No
CV Selector	Choose best existing CV / request external tailoring	Only through approved adapter
Application Writer	Draft truthful application/cover note	No
Outreach Writer	Draft personalized client pitch	No
Reply Analyst	Classify reply intent and urgency	No
Follow-up Planner	Suggest timing/content under limits	No
Policy Engine	Deterministically authorize/deny/request approval	Decision only
Action Executor	Perform pre-authorized actions	Yes, but cannot override policy
6.2 Autonomy levels
Level	Meaning	Example
A0 — Observe	Read/classify only	Detect a LinkedIn job-alert email
A1 — Prepare	Create draft/materials	Draft cover note and choose CV
A2 — Execute low risk	Act when deterministic rules pass	Send a pre-approved style of email application
A3 — Restricted	Always require owner approval	Quote pricing, negotiate, accept interview time, sign/accept terms
Denied	Never automate	CAPTCHA bypass, fabricated credentials, prohibited contact
6.3 Non-negotiable agent rules
Never fabricate education, experience, employers, skills, metrics, certifications, salary history or portfolio work.
Unknown information stays unknown; ask or omit it.
Hard constraints are deterministic and override model enthusiasm.
Never contact a recipient/company on the do-not-contact list.
Honor unsubscribe/stop requests immediately.
No repeated outreach beyond configured frequency/cadence.
No CAPTCHA bypass, anti-bot evasion, credential sharing or platform-rule circumvention.
No accepting offers, contracts, financial commitments or legal terms autonomously.
Every external action must have a traceable policy decision and audit record.
When confidence is low or extracted facts conflict, route to owner attention.
6.4 Example matching formula

Hard rules are evaluated first. If they pass, a configurable semantic score can combine skill alignment, role alignment, experience level, work mode/location, compensation, domain preference and opportunity quality. The score is a prioritization aid, not permission to invent missing qualifications.

6.5 Prompt/output discipline
All agents return schema-validated JSON before prose is rendered.
Prompts receive only the minimum necessary user data.
Profile facts are tagged verified/unverified with evidence source.
Generated messages cite internal fact IDs during generation; the IDs are removed before sending.
Store model/provider, prompt version and output hash for reproducibility/debugging.
Do not let free-form model output directly invoke tools.
7. Security, Privacy & Reliability
7.1 Security requirements
OAuth tokens encrypted at rest; never log access/refresh tokens.
Request minimum Gmail scopes needed for the enabled feature set.
Secrets remain server-side and are loaded from a secret manager/environment.
Signed upload URLs and private object storage for CVs.
Strict MIME/size validation for documents.
CSRF/session protections, rate limiting and secure cookies.
Audit sensitive settings changes and integration connect/disconnect events.
Global pause/kill switch must stop new external actions immediately.
7.2 Privacy
CVs and emails contain sensitive personal data; retain only what the product needs.
Allow deleting stored CVs, extracted profile data and imported opportunity data.
Keep raw email bodies only when needed; otherwise retain normalized fields plus provider references.
Do not use personal messages or CV content to train models unless the owner explicitly opts into such a provider arrangement.
7.3 Reliability
Idempotent workers and retry with exponential backoff.
Dead-letter queue for repeatedly failing events.
Provider rate-limit handling.
Health status for Gmail sync, queue, database, object storage and AI provider.
No automatic retry of an external send unless idempotency can prove it was not already sent.
8. External Integrations Strategy
8.1 Gmail

Gmail is the first major integration because it can serve as both an opportunity intake channel and the communication/reply channel. The app should use Google OAuth and the Gmail API. For development, begin with read/classify + draft creation; enable sending only after the policy/audit path is proven.

8.2 CV-generation service

Do not build a CV designer in V1. Define a ResumeProvider interface so Pursio can later integrate with a service that exposes a suitable API. Until then, Pursio selects among uploaded CVs and can generate structured tailoring instructions without altering the original file.

ResumeProvider interface:

createTailoredResume(baseResume, verifiedProfileFacts, jobRequirements)
getResumeStatus(externalJobId)
downloadResume(externalResumeId)
deleteResume(externalResumeId)
8.3 Opportunity sources

Prefer user-authorized inbox data, official APIs, feeds and sources that permit automated access. Avoid making the product dependent on brittle scraping or automated behavior that violates a platform's rules.

9. Notification Specification
Critical: Gmail disconnected, action failed after retries, suspicious authentication issue.
High value: recruiter replied, client interested, interview invitation, question requiring owner input.
Approval: restricted action waiting for owner.
Digest: daily summary of discoveries, actions and outcomes.
Low priority: skipped opportunities and routine successful processing stay in the activity feed unless requested.
10. State Machines
10.1 Opportunity lifecycle

NEW → QUALIFIED or SKIPPED → PREPARED → PENDING_APPROVAL (optional) → APPLIED/CONTACTED → REPLIED → INTERVIEW/INTERESTED → OFFER/WON or REJECTED/LOST/CLOSED.

10.2 Action lifecycle

CREATED → POLICY_EVALUATED → APPROVAL_PENDING or AUTHORIZED or DENIED → EXECUTING → SUCCEEDED or FAILED → RETRY_SCHEDULED / DEAD_LETTER.

10.3 Conversation lifecycle

ACTIVE → NEEDS_ATTENTION → WAITING_ON_OTHER_PARTY → FOLLOW_UP_DUE → CLOSED. A stop/unsubscribe intent immediately sets DO_NOT_CONTACT.

11. Testing & Acceptance Plan
11.1 Test layers
Unit: parsing helpers, scoring rules, policy engine, dedupe keys.
Contract: Gmail adapter, AI structured outputs, ResumeProvider adapter.
Integration: email → opportunity → match → draft → approval → send → reply.
Security: OAuth/token handling, authorization, upload validation, secret leakage.
Agent evals: extraction accuracy, hallucination/factuality, reply classification, fit ranking.
Failure testing: duplicate webhook/event, provider timeout, AI malformed output, queue retry, send ambiguity.
11.2 MVP acceptance criteria
100 seeded job-alert emails process without duplicate opportunities.
Malformed/irrelevant emails do not trigger outbound actions.
No generated application contains facts outside the verified profile/CV dataset.
A hard-rule failure can never be overridden by an LLM score.
A reply to a tracked thread updates the correct opportunity.
An 'interested' reply generates a notification and stops blind follow-up.
Global pause prevents all new external actions.
Every send has an associated policy decision and audit trace.
12. Implementation Roadmap

Phase 0 — Foundation (1–2 days)
Repository, Next.js/TypeScript, PostgreSQL/Drizzle, auth, environment config. Core schema, migrations, logging, audit primitives. Basic dashboard shell and agent pause state.

Phase 1 — Profile + CVs (2–3 days)
Profile/preferences/rules UI. CV upload, storage, parsing and verified fact model. CV list/version/default selection.

Phase 2 — Gmail intelligence (3–5 days)
Google OAuth and Gmail adapter. Message ingestion/idempotency. Classification, extraction, opportunity pipeline and source links. Reply/thread correlation.

Phase 3 — Matching + preparation (3–5 days)
Hard-rule engine. Fit scoring/explanation. CV selection. Application/outreach drafting with factuality controls.

Phase 4 — Controlled autonomy (3–5 days)
Action requests and approval UI. Policy engine. Gmail draft/send executor. Rate limits, do-not-contact and global pause. Notifications and reply escalation.

Phase 5 — Client discovery (after core loop works)
Approved discovery source adapters. Company/contact normalization. Qualification rules and personalized outreach. Follow-up cadence and outcome tracking.

Phase 6 — External CV service
Evaluate providers based on API access, output quality, data/privacy terms and export formats. Implement ResumeProvider adapter without coupling domain logic to one vendor.

13. Coding-Agent Build Rules
Build vertical slices; do not generate the entire system in one prompt.
No direct Gmail calls from React components; integrations live behind server-side adapters.
No LLM decides whether an external action is authorized.
Use Zod or equivalent validation at every external/AI boundary.
Use migrations; never mutate production schema manually.
Every worker is idempotent.
Every external action receives a trace ID and audit event.
Keep provider adapters replaceable.
Write tests for policy rules before enabling auto-send.
Do not add features outside this blueprint without updating the relevant requirement/design section.
14. Open Decisions
Decision	Current direction
Final name	Pursio — working name; availability/trademark/domain not checked.
Backend shape	Start integrated with Next.js if convenient; split worker/API when needed.
AI provider	Provider abstraction; choose based on structured-output quality/cost.
Gmail mode	Read/classify + drafts first, then controlled sending.
CV tailoring	Existing uploaded CVs first; external service later.
Client discovery provider	Undecided; use compliant source adapters.
Notifications	In-app first; optional email/push/Telegram/WhatsApp later.
Hosting	UI/serverless + separate persistent worker is preferred.
Billing	Deferred while the core application is built; normal workspace features remain free, and AI/automation payment rules will be designed later.
15. Recommended First Build Slice
Owner signs in and completes profile.
Owner uploads a CV.
Owner connects Gmail.
Pursio finds one job-alert email.
It extracts the job into an opportunity.
It scores the job and explains the score.
It chooses the CV and drafts an application email.
The owner approves it.
Pursio creates/sends the email through Gmail.
A simulated or real reply updates the opportunity and appears under 'Needs your attention'.

Once this slice is reliable, automatic execution is mostly a policy change around a proven pipeline — not a different architecture.

Appendix A — Example Agent Policy
Auto-prepare when hard rules pass and match score ≥ 70.
Auto-send email applications only when match score ≥ 85, compensation is not below floor, required experience is within configured tolerance, and no custom application questions require unsupported facts.
Never auto-send client outreach to more than the configured daily cap.
Never auto-follow-up after a negative/stop response.
Always request approval for pricing, interview scheduling commitments, take-home tests requiring substantial work, contracts, financial information or identity documents.
Appendix B — Definition of Done for V1

V1 is done when Pursio can run for a full week on the owner's real inbox without duplicate actions, fabricated profile claims, unexplained sends or lost replies; the owner can pause it instantly; and the dashboard provides enough evidence to understand every decision.