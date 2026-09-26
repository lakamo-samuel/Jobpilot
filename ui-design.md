Pursio — UI/UX Design System & Implementation Specification

v1.0 • Agent-ready design contract • Desktop + Mobile • Light-first

Purpose: Give a coding/design agent enough constraints to build Pursio consistently without inventing visual rules.

1. Design Mission

Pursio is an autonomous opportunity agent. The interface must communicate trust, control, intelligence and momentum. It is not a job-board clone, a generic CRM, or an 'AI magic' demo. The user must always understand what Pursio found, why it made a decision, what it did, what happened afterward, and where human attention is required.

1.1 Product personality
Attribute	UI implication
Calm	Low visual noise, neutral surfaces, restrained color, minimal motion.
Intelligent	Strong information hierarchy, contextual reasoning, useful summaries.
Precise	Aligned grids, compact data presentation, explicit labels and states.
Autonomous	Visible agent state, event stream, progress and action history.
Trustworthy	Explain decisions, preserve user control, expose uncertainty and failures.
1.2 Core UX hierarchy

Design information priority in this order: Needs Attention → High-value Opportunities → Conversations/Replies → Agent Activity → Analytics → Configuration.

1.3 Anti-patterns — DO NOT implement
Do not make the primary experience a chatbot.
Do not use purple/blue gradients as generic AI decoration.
Do not use glassmorphism as the default surface treatment.
Do not make every section a floating card.
Do not add charts merely because this is a dashboard.
Do not use color alone to communicate state.
Do not hide autonomous actions behind vague messages such as 'AI handled it'.
Do not create giant pill-shaped controls everywhere.
Do not use excessive shadows, neon glows, animated particles or bouncing AI orbs.
Do not invent new colors, spacing, radii or typography outside this specification.
2. Layout System
2.1 Desktop application shell
Property	Specification
Minimum supported desktop	1024px
Primary design width	1440px
Sidebar	232px expanded; optional 72px collapsed
Top bar	64px height
Content padding	32px at ≥1280px; 24px at 1024–1279px
Content max width	No artificial max for tables; editorial/detail content may cap at ~960px
Detail drawer	420–480px; max ~42vw
Grid	12-column conceptual grid; 24px gutters

Shell: fixed left navigation + top utility bar + scrollable workspace. Tables/lists own the horizontal space. A right detail drawer may overlay or reserve space depending on viewport.

2.2 Breakpoints
Token	Width	Behavior
sm	640px	Mobile refinements
md	768px	Tablet; side panels become overlays
lg	1024px	Desktop sidebar available
xl	1280px	32px content gutters
2xl	1536px	More breathing room; do not stretch readable prose excessively
2.3 Mobile shell

Below 768px use a top bar plus bottom navigation. Primary tabs: Home, Opportunities, Inbox, More. Mobile is optimized for checking attention items, approving actions, reading replies, pausing/resuming the agent and reviewing opportunities — not for dense system configuration.

2.4 Density
Default row height: 52–60px depending on secondary metadata.
Compact data-table mode may use 44–48px rows.
Cards should be used for summaries, attention items and entities — not every piece of information.
Long descriptions and email bodies should use a readable text column rather than full viewport width.
3. Color System
3.1 Primitive palette
Family	Token	Value
Indigo	50	
#EEF2FF
Indigo	100	
#E0E7FF
Indigo	200	
#C7D2FE
Indigo	300	
#A5B4FC
Indigo	400	
#818CF8
Indigo	500	
#6366F1
Indigo	600	
#4F46E5
Indigo	700	
#4338CA
Indigo	800	
#3730A3
Indigo	900	
#312E81
Indigo	950	
#1E1B4B
Neutral	0	
#FFFFFF
Neutral	25	
#FCFCFD
Neutral	50	
#F8F9FB
Neutral	100	
#F3F4F6
Neutral	200	
#E4E4E7
Neutral	300	
#D4D4D8
Neutral	400	
#A1A1AA
Neutral	500	
#71717A
Neutral	600	
#52525B
Neutral	700	
#3F3F46
Neutral	800	
#27272A
Neutral	900	
#18181B
Neutral	950	
#09090B
Green	600	
#15803D
Amber	700	
#B45309
Red	600	
#DC2626
Blue	600	
#2563EB
3.2 Light semantic tokens
Token	Value	Usage
color.bg.canvas	
#F8F9FB	Application background
color.bg.surface	
#FFFFFF	Primary panels/cards
color.bg.subtle	
#F3F4F6	Secondary surfaces, hover zones
color.text.primary	
#18181B	Primary text
color.text.secondary	
#52525B	Secondary copy
color.text.muted	
#71717A	Metadata
color.border.default	
#E4E4E7	Standard border
color.border.strong	
#D4D4D8	Emphasized separators
color.brand.default	
#4F46E5	Primary action / Pursio identity
color.brand.hover	
#4338CA	Primary hover
color.brand.subtle	
#EEF2FF	Brand-tinted background
color.status.success	
#15803D	Success
color.status.warning	
#B45309	Attention/warning
color.status.danger	
#DC2626	Failure/destructive
color.status.info	
#2563EB	Informational
color.focus	
#4F46E5	Keyboard focus ring
3.3 Dark semantic tokens (supported after light)
Token	Value
color.bg.canvas	
#09090B
color.bg.surface	
#111113
color.bg.subtle	
#18181B
color.text.primary	
#FAFAFA
color.text.secondary	
#A1A1AA
color.text.muted	
#71717A
color.border.default	
#27272A
color.brand.default	
#818CF8
3.4 Color rules
Approximately 85–90% of visible UI should remain neutral.
Brand color is for primary actions, selected navigation, agent activity and controlled emphasis.
Success/warning/danger/info colors are semantic, never decorative.
Every status requires text and/or icon in addition to color.
Do not use red for ordinary negative metrics; reserve it for errors, destructive actions and blocked states.
Meet WCAG AA contrast: at least 4.5:1 for normal text and 3:1 for meaningful non-text UI/focus boundaries where applicable.
4. Typography
4.1 Font family

Primary: Geist Sans. Technical metadata only: Geist Mono. If Geist is unavailable, use a high-quality system sans fallback. Never use a decorative display face inside the product UI.

4.2 Type scale
Style	Size / line-height	Weight	Usage
Display	32 / 40	600	Rare hero/empty onboarding heading
Page title	24 / 32	600	Page heading
Section title	18 / 28	600	Major section
Card title	15 / 22	600	Entity/card title
Body	14 / 21	400	Default application text
Body strong	14 / 21	600	Emphasis
Reading body	15–16 / 24	400	Emails, descriptions, explanations
Small	13 / 18	400	Secondary data
Metadata	12 / 16	500	Timestamp, labels, compact table metadata
Mono	12–13 / 18	400	Run IDs, event keys, technical traces
4.3 Typography rules
Use sentence case, not Title Case everywhere.
Numbers in metric cards may use 28–32px semibold.
Never use all-caps for paragraphs. Small section labels may use uppercase sparingly with tracking.
Keep line length around 60–80 characters for long reading content.
Do not communicate hierarchy through font size alone; use spacing, weight and grouping.
5. Spacing, Radius, Border & Elevation
5.1 Spacing tokens
Token	px
space-1	4
space-2	8
space-3	12
space-4	16
space-5	20
space-6	24
space-8	32
space-10	40
space-12	48
space-16	64

16px and 24px are the dominant internal layout values. Do not introduce arbitrary values unless required by a precise optical adjustment.

5.2 Radius
Token	px	Usage
radius-sm	6	Badges, compact controls
radius-md	8	Buttons, inputs
radius-lg	10	Cards
radius-xl	12	Large panels/drawers
radius-modal	14	Modal surfaces
radius-full	9999	Avatar and true pills only
5.3 Borders and shadows
Default container separation: 1px solid color.border.default.
Prefer borders and surface contrast to shadows.
Cards resting in the page flow generally have no shadow.
Use subtle elevation only for menus, popovers, command palette, modal, floating toast and temporary overlays.
Never use heavy ambient shadows around every dashboard card.
6. Iconography & Motion
6.1 Icons

Use Lucide icons consistently. Default stroke 1.75–2px. Standard sizes: 16, 18, 20 and 24px. Never mix multiple icon libraries or emoji as interface icons.

6.2 Motion
Interaction	Duration
Micro state / hover	100–150ms
Panel / drawer	150–200ms
Toast / modal	180–250ms
Agent pulse	Very subtle; slow and non-distracting
Use ease-out for entrances and ease-in for exits.
Motion communicates state change; it is not decoration.
Honor prefers-reduced-motion.
Never use perpetual decorative motion except a subtle agent-running indicator.
7. Navigation
7.1 Desktop sidebar

Sections: MAIN — Overview, Opportunities, Inbox, Activity. WORKSPACE — CVs, Profile, Agent Rules. SYSTEM — Integrations, Settings. Bottom area: agent status and user menu.

Selected item: brand-subtle background + brand icon/text; do not use a giant filled pill.
Unread/attention count may appear as a compact badge.
Agent status remains visible near the bottom: Running, Paused, Attention, Offline/Error.
Sidebar collapse is optional for MVP but architecture should permit it.
7.2 Top bar
Current page context/breadcrumb when needed.
Global search / command palette trigger.
Agent status shortcut.
Notifications.
Primary contextual action only when the page genuinely has one.
8. Core Component Specifications
8.1 Buttons
Variant	Usage	Style notes
Primary	One per view; main action	Brand fill; white label; radius-md
Secondary	Supporting actions	Neutral border + surface; brand text on hover
Ghost	Tertiary / inline	No border/fill at rest; subtle hover surface
Destructive	Delete, disconnect, revoke	Danger color fill or border
Icon-only	Toolbar / compact actions	32–36px target; always has accessible name

Heights: default 36px, large 40px, small 28–30px. Loading state: spinner replaces label; disable interaction. Never use disabled as a way to hide an unavailable action; explain why it is unavailable instead.

8.2 Form inputs
Component	Notes
Text input	36px height; focus ring color.focus; error border color.status.danger
Textarea	Auto-grow preferred; min 3 rows
Select	Match input height; native or custom with keyboard support
Checkbox / radio	16px touch zone; custom styled; 44px mobile touch zone
Toggle	For binary on/off settings; always labeled
Search	Leading icon; clear button when filled

Inline validation: show error below field on blur or submit; never obscure the field. Required fields use accessible markup; avoid asterisk-only notation.

8.3 Badges / status chips
Use	Size	Color
Opportunity status	Small, 6px radius	Semantic per status
Match score	Numeric, compact	Green ≥70, amber 40–69, neutral <40
Attention indicator	Dot or small badge	Danger/amber
Type label	Extra small	Neutral

Text + color always; color alone is never the sole status indicator.

8.4 Tables / lists
Columns: sticky header on scroll; sortable where useful; no unnecessary sort controls.
Row hover: subtle bg change (color.bg.subtle).
Selected/active row (detail drawer open): brand-subtle left border or background.
Pagination or infinite scroll; prefer paginated for large datasets.
Empty state inline with the table area, not below.
8.5 Detail drawer
Opens from right, 420–480px.
Overlay on viewport <1280px; may push content on wider.
Sticky header with entity title + close + primary action.
Scrollable body.
Never nest modals inside the drawer for primary flows.
8.6 Modals
Use for confirmation of destructive/irreversible actions and for focused single-step inputs only.
Max width ~480px for single-column forms.
Backdrop: 50% neutral-900 opacity.
Always closeable via Escape + explicit button.
Do not use modals for multi-step flows or information display.
8.7 Toast / notifications
Appear top-right desktop, top-center mobile.
Auto-dismiss after 4–6s for info/success; persist for error/critical.
Max two visible at once; queue additional.
Never toast for background agent activity that already updates the activity feed.
8.8 Command palette
Triggered by Cmd/Ctrl+K.
Search across pages, opportunities, actions, settings.
Keyboard navigation required.
Show recent items when empty.
8.9 AgentStatus component

Core persistent component. States: Running (subtle brand pulse), Paused (neutral), Processing (active indicator), Attention (amber), Error (danger). Always shows last-sync time. One-click access to pause/resume. Visible in sidebar bottom and top bar shortcut.

8.10 MatchScore component

Numeric score (0–100) with color band and always-visible explanation trigger. Never show a score without context for why. Hard-rule fail shows a distinct indicator regardless of score value.

9. Interaction Patterns
9.1 Approval flow

Attention card appears in Overview and Opportunities. Card explains what the agent prepared, why, what action is requested and what policy permits. Primary action: Approve & Send / Approve & Draft. Secondary: Edit, Reject. Approval must be explicit; no accidental execution. Confirm with a brief success indicator (not a blocking modal).

9.2 Pause/resume

Available from top bar, sidebar bottom and agent status component. Pause is immediate; in-progress sends already authorized complete. Resume shows last pause reason if relevant. Never hide or disable the pause control.

9.3 Opportunity review

Click row → detail drawer. Browser back / Escape closes drawer. Keyboard navigation through list while drawer open is supported. Drawer shows all required context to make a decision without full-page navigation.

9.4 Bulk actions

Defer until there is a safe, user-validated use case. No bulk-send without individual review for V1.

9.5 Onboarding

Linear flow: account → profile → CV upload → Gmail connect → first look at pipeline. Each step has a clear purpose explanation. Allow skipping non-critical steps with a 'complete later' path. Show progress. After onboarding, redirect to Overview with a contextual 'Getting started' panel that fades as items are completed.

10. Screen Specifications
10.1 Overview

Primary content: Needs Your Attention (first), then Today's Activity feed. Metric summary row: opportunities found, high matches, actions taken, positive replies — numbers only, no decorative charts. Side column: agent health widget, Gmail sync status, queue depth, daily limit usage. Do not add charts to Overview until there is real data to visualize.

10.2 Agent status widget (sidebar bottom)

Compact: status icon + label + last sync. Expand on hover or click: queue depth, last run, error count, pause/resume button.

10.3 Opportunities list
Default view: list/table.
Optional Pipeline toggle.
Columns: Company, Opportunity, Type/Source, Match, Status, Updated. Compensation/location appear responsively or as secondary metadata.
Click row → detail drawer. Open full detail from drawer.
Bulk actions should not exist until there is a safe, proven use case.
10.4 Opportunity detail
Header: company, title/service need, status, source, primary action.
Summary: location/work mode, compensation, deadline, discovered time.
Match: score + confidence + hard-rule status.
Why it matches: strongest matches, gaps, unknowns, reasoning.
Requirements: structured list with required/preferred distinction.
Application/outreach: selected CV, generated message, attachments, action state.
Conversation: thread preview if one exists.
Timeline: discovery → evaluation → preparation → action → reply/outcome.
Raw source link/message is accessible but not the default visual focus.
10.5 Needs Your Attention

This is a first-class experience, not merely a notification list. Group items by urgency: Reply/Interview, Approval required, Missing information, Integration/problem. Each card explains why the user is needed and offers one clear next action.

10.6 Inbox
Conversation list left; active thread right on desktop.
Filters: Needs attention, Recruiters, Clients, Applications, Closed.
Thread header includes linked opportunity and current status.
AI may summarize long threads above messages.
Suggested reply appears as a draft area, clearly distinguished from sent content.
Pricing, negotiation, contracts and sensitive commitments visibly require approval.
10.7 Activity
Chronological event stream, grouped Today / Yesterday / dates.
Filters by event type, opportunity and result.
Each event shows time, icon, human-readable action, entity and relevant metadata.
Expandable technical details may expose trace ID, provider and failure reason.
Do not present this as chat bubbles.
10.8 CVs
Header with Upload CV.
CV cards/list: label, filename, version, extracted role focus, last used, default indicator.
Detail: verified extracted facts, skills, experience, education and usage history.
Actions: Set default, Rename label, Replace/new version, Delete.
Show which opportunities used each version.
Future external CV service appears as an integration, not a built-in fake editor.
10.9 Profile
Professional summary.
Verified facts: experience, education, skills, links.
Target roles and opportunity preferences.
Compensation/work-mode/location constraints.
Separate 'Facts about me' from 'What I want' so matching logic stays understandable.
10.10 Agent Rules
Top: autonomy mode — Observe only / Prepare / Controlled auto-execute.
Job rules: minimum match threshold, compensation, work type, location, experience tolerance.
Client outreach rules: daily cap, allowed business types, follow-up cadence.
Permission matrix: Find, Analyze, Select CV, Prepare, Send, Follow up.
'Always ask before' section for salary negotiation, interview commitments, identity documents, contracts and unusual questions.
Exclusions/do-not-contact.
Quiet hours and notification preferences if supported.
Preview panel: 'Under these rules Pursio would...' with examples.
10.11 Integrations
Cards with provider logo/name, status, permissions summary, last sync and actions.
Gmail: Connected / reconnect required / disconnected.
Future Resume Provider: clear 'Coming later' only if intentionally shown; otherwise omit.
Never show an integration as connected unless the backend confirms it.
10.12 Settings
Appearance, notifications, data retention/privacy, AI provider configuration if exposed, account/security.
Destructive account/data actions grouped in a Danger Zone.
Do not duplicate agent behavior settings here; Agent Rules owns them.
11. Empty, Loading, Error & Success States
11.1 Empty states
Context	Copy direction
No opportunities	'No opportunities yet. Pursio is watching your connected sources.' Show source status and last check.
No replies	'No replies need your attention.' Avoid making an empty state feel like failure.
No CV	Explain why a CV is needed and offer Upload CV.
No Gmail	Explain what connecting Gmail enables; CTA Connect Gmail.
11.2 Loading
Use skeletons for ordinary page/list loading.
Use explicit step progress for agent operations.
Never show fake progress percentages unless backend progress is measurable.
Preserve already-loaded content during background refresh.
11.3 Errors

Error pattern: human title → what happened → impact → recovery action → optional technical details. Example: 'Gmail connection expired. Pursio cannot monitor new opportunities until you reconnect. Existing opportunities are unaffected. [Reconnect Gmail]'.

11.4 Success

Use subtle confirmation. Do not interrupt the user with a modal for routine success. External actions such as sending an application should update the persistent opportunity/activity state immediately.

12. Accessibility Contract
Target WCAG 2.2 AA.
Normal text contrast ≥4.5:1; meaningful non-text boundaries/status/focus ≥3:1 where applicable.
Full keyboard navigation for desktop workflows.
Visible focus state on every interactive element.
Icon-only controls have accessible names and tooltips where useful.
Inputs have programmatic labels; errors are associated with fields.
Tables use semantic headers.
Dynamic agent status and important asynchronous results use appropriate live-region announcements without becoming noisy.
Color never carries meaning alone.
Respect reduced motion.
Mobile touch targets should be approximately 44px or larger for primary interactions.
Use semantic HTML before ARIA; ARIA supplements rather than replaces native semantics.
13. Responsive Rules
Desktop	Tablet	Mobile
Sidebar fixed	Sidebar overlay/collapsible	Bottom nav
Tables primary	Tables simplified	Stacked opportunity rows
Detail drawer	Overlay drawer	Full-screen detail
4 metric cards row	2x2 grid	2-column or horizontal compact grid
Inbox split view	Split if space permits	Conversation list → full thread
Agent rules multi-column	Single/two column	Single column; advanced sections collapsed

At no breakpoint should critical actions disappear without an alternative. Preserve state when moving between list and detail.

14. Design Tokens for Implementation
14.1 CSS token naming

Use primitive tokens internally and semantic tokens in components. Components must not reference raw hex values.

Category	Examples
Color	--color-bg-canvas, --color-bg-surface, --color-text-primary, --color-brand-default, --color-status-danger
Spacing	--space-1 ... --space-16
Radius	--radius-sm, --radius-md, --radius-lg, --radius-xl
Typography	--font-sans, --font-mono, --text-body, --text-small, --leading-body
Size	--sidebar-width, --topbar-height, --control-height
Motion	--duration-fast, --duration-normal, --ease-standard
14.2 Tailwind implementation
Map semantic tokens to Tailwind theme variables/utilities; avoid arbitrary color classes in feature code.
Create shared primitives/components before pages.
Dark mode changes semantic token values, not component class logic wherever possible.
Use class variance utilities or equivalent for component variants rather than copy-pasted class strings.
15. Component State Matrix
Component	Required states
Button	default, hover, focus-visible, active, disabled, loading
Input	default, hover, focus, filled, disabled, error
Nav item	default, hover, selected, focus, badge
Opportunity row	default, hover, selected/drawer-open, attention, keyboard focus
Integration card	connected, syncing, disconnected, error
Agent status	running, paused, processing, attention, error
Action request	pending, approved, rejected, expired, executing, failed
CV	default, selected/default, processing, parsing error
Toast	success, info, warning, error
Skeleton	loading only; no fake content
16. Microcopy Rules
Use direct verbs: Review application, Approve & send, Pause Pursio, Reconnect Gmail.
Prefer human-readable causes over internal codes.
Never imply an action succeeded until backend confirmation exists.
Use 'Pursio' when describing agent actions; use 'you' for owner actions.
Distinguish Drafted, Approved, Sending and Sent.
Avoid hype such as 'magic', 'perfect match', 'guaranteed', or 'Pursio knows best'.
Match language: 'Strong match' rather than 'You should definitely apply'.
Failures should explain impact and recovery.
17. Data Visualization Rules
Do not create charts until data answers a real question.
Preferred early visualization: simple weekly funnel — Discovered → Qualified → Applied/Contacted → Replies → Interviews/Interested → Won/Offer.
Use direct labels rather than legends when possible.
Never use 3D charts.
Do not use pie/donut charts for decorative dashboard filler.
Show zero/insufficient-data states honestly.
18. Figma / Design-System Structure
18.1 Recommended pages
00 — Cover & principles
01 — Foundations
02 — Tokens / Variables
03 — Components
04 — Patterns
05 — Desktop screens
06 — Mobile screens
07 — Prototype flows
08 — Accessibility / annotations
09 — Archive / explorations
18.2 Variables

Create Primitives and Semantic collections. Use Light/Dark modes in semantic tokens. Name by role, not appearance. Example: color/surface/primary rather than white; color/action/primary rather than indigo-600. Components should consume semantic variables.

18.3 Component construction
Use Auto Layout for reusable components and page structures.
Use component properties/variants for state, size, icon presence and semantic intent.
Document intended use and prohibited use for complex components.
Match component names to code names where practical to improve agent/developer handoff.
19. Coding Agent Instructions — Paste This With the PRD
Treat this UI/UX specification as a design contract. Do not improvise a new visual language.
Build foundations/tokens first, then primitives, then composite components, then screens.
Use the exact semantic token architecture. Never scatter raw hex values through feature components.
Build light mode first; architecture must support dark mode through semantic tokens.
Implement accessibility states at component creation time, not as cleanup.
Use list/table as the default Opportunities view. Pipeline/Kanban is secondary.
Make Needs Your Attention the primary operational section on Overview.
Keep Pursio observable: agent status, action state, reason and timestamps must be visible.
Never turn Activity into chat UI.
Do not add decorative gradients, glassmorphism, neon glows, random charts or oversized rounded cards.
Use Lucide consistently.
Use the specified spacing/radius/type scales.
Create all component states before wiring live data.
Use realistic placeholder content during UI implementation; avoid lorem ipsum.
Do not invent product features. If a screen needs missing behavior, leave a clearly marked TODO tied to the PRD/FRD.
Desktop must be polished at 1440px and functional down to 1024px. Mobile must be polished around 390px.
Test keyboard navigation, focus states, overflow, empty/loading/error states and long text before declaring a screen complete.
20. Build Order
Design tokens + Tailwind/theme mapping.
App shell: sidebar, top bar, responsive mobile navigation.
Primitives: buttons, inputs, select, badges, tabs, tooltip, avatar, dropdown.
Core domain components: AgentStatus, MatchScore, OpportunityRow, ActivityEvent, AttentionCard, CVCard, IntegrationCard.
Overview.
Opportunities list + filters + detail drawer.
Opportunity full detail.
Inbox/conversation.
Activity.
CVs + Profile.
Agent Rules.
Integrations + Settings.
Onboarding.
Responsive/mobile pass.
Accessibility and state QA.
Dark theme only after light UI is stable.
21. Definition of Design Done
No raw colors or arbitrary spacing in feature components.
All core components have hover/focus/disabled/loading/error states as applicable.
Every autonomous action can be understood from the UI.
Every high-risk action exposes human approval.
Global pause is reachable and obvious.
Empty/loading/error/success states exist for every major data surface.
Opportunities remain scannable with 100+ records.
Long company names, titles, emails and descriptions do not break layout.
Keyboard-only navigation can complete core review/approval flows.
Mobile can review, approve, reply and pause the agent.
UI contains no fake functionality or misleading status.
Design matches the product personality: calm, intelligent, precise, autonomous, trustworthy.
22. Research Basis

The specification follows established usability principles around visibility of system status, user control, consistency, error prevention, recognition over recall and minimalist presentation. The token architecture follows current Figma guidance: primitives → semantic tokens → optional component tokens, with variables/modes supporting consistent theming and design-to-code handoff.