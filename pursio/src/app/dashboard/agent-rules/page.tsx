"use client";

import React, { useState } from "react";
import { Eye, FileText, Zap, ShieldAlert, Info, Save, X } from "lucide-react";
import { mockPolicy } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useStoredState } from "@/lib/workspace-state";
import { useWorkspace } from "@/components/shell/WorkspaceProvider";
import type { AgentPolicy } from "@/lib/types";

const autonomyModes: {
  value: AgentPolicy["globalMode"];
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: "observe",
    label: "Observe only",
    description: "Pursio finds and scores opportunities but takes no action and sends nothing.",
    icon: Eye,
  },
  {
    value: "prepare",
    label: "Prepare",
    description: "Pursio evaluates and drafts materials but always waits for your approval before sending.",
    icon: FileText,
  },
  {
    value: "auto",
    label: "Automatic",
    description:
      "Pursio sends applications automatically when all policy conditions are met. High-risk actions still require approval.",
    icon: Zap,
  },
];

const permissionMatrix = [
  { action: "Find opportunities", auto: true, prepare: true, observe: true },
  { action: "Score & analyze", auto: true, prepare: true, observe: true },
  { action: "Select CV", auto: true, prepare: true, observe: false },
  { action: "Prepare application / pitch", auto: true, prepare: true, observe: false },
  { action: "Send application email", auto: true, prepare: false, observe: false },
  { action: "Follow up", auto: true, prepare: false, observe: false },
];

const alwaysApproveItems = [
  "Salary negotiation",
  "Interview scheduling commitments",
  "Identity documents",
  "Contracts or legal terms",
  "Take-home tests requiring substantial work",
  "Pricing or financial commitments",
];

export default function AgentRulesPage() {
  const [stored, savePolicy] = useStoredState<AgentPolicy>("policy", mockPolicy);
  const [edits, setEdits] = useState<AgentPolicy | null>(null);
  const policy = edits ?? stored;
  const setPolicy = (update: (previous: AgentPolicy) => AgentPolicy) => setEdits(update(policy));
  const [exclusion, setExclusion] = useState("");
  const { notify } = useWorkspace();

  const handleSave = () => {
    if (policy.autoSendMinScore < policy.minMatchScore) { notify("The auto-send score must be at least the qualifying score."); return; }
    if ((policy.compensationMin ?? 0) < 0) { notify("Compensation cannot be negative."); return; }
    if (!policy.quietHoursStart || !policy.quietHoursEnd || policy.quietHoursStart === policy.quietHoursEnd) { notify("Choose different start and end times for quiet hours."); return; }
    if (savePolicy(policy)) { setEdits(null); notify("Rules saved in this browser. This preview does not send outreach."); }
    else notify("Could not save the rules. Check browser storage access.");
  };

  return (
    <div className="workspace-page !max-w-[1000px]">
      {/* Header */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="text-[24px] font-[600] leading-[32px] text-[var(--app-ink)]">Agent Rules</h1>
          <p className="text-[14px] leading-[21px] text-[var(--app-muted)]">
            Set your preferences and preview how the agent would behave. Saved locally; no outreach is sent.
          </p>
        </div>
        <Button variant="primary" disabled={!edits} onClick={handleSave} loading={false}>
          {!edits ? "No unsaved changes" : (
            <>
              <Save className="h-4 w-4" />
              Save rules
            </>
          )}
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {/* Autonomy mode */}
        <section className="rounded-[10px] border border-[var(--app-line)] bg-[var(--app-surface)] p-5">
          <h2 className="text-[15px] font-[600] leading-[22px] text-[var(--app-ink)] mb-1">Autonomy mode</h2>
          <p className="text-[13px] text-[var(--app-muted)] mb-4">
            Choose how much you want to review before taking action.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {autonomyModes.map((mode) => {
              const Icon = mode.icon;
              const isSelected = policy.globalMode === mode.value;
              return (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setPolicy((p) => ({ ...p, globalMode: mode.value }))}
                  className={cn(
                    "flex flex-col gap-2 rounded-[10px] border p-4 text-left transition-colors",
                    isSelected
                      ? "border-[var(--app-action)] bg-[var(--app-subtle)]"
                      : "border-[var(--app-line)] hover:border-[var(--app-line-strong)] hover:bg-[var(--app-canvas)]",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--app-action)]"
                  )}
                  aria-pressed={isSelected}
                >
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-[8px]",
                    isSelected ? "bg-[var(--app-action)] text-[var(--app-on-action)]" : "bg-[var(--app-subtle)] text-[var(--app-muted)]"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className={cn("text-[14px] font-[600] leading-[21px]",
                    isSelected ? "text-[var(--app-action)]" : "text-[var(--app-ink)]"
                  )}>
                    {mode.label}
                  </p>
                  <p className="text-[13px] leading-[18px] text-[var(--app-muted)]">{mode.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Thresholds */}
        <section className="rounded-[10px] border border-[var(--app-line)] bg-[var(--app-surface)] p-5">
          <h2 className="text-[15px] font-[600] leading-[22px] text-[var(--app-ink)] mb-4">Score thresholds</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[14px] font-[600] text-[var(--app-ink)] mb-1">
                Minimum qualify score
              </label>
              <p className="text-[12px] text-[var(--app-muted)] mb-2">
                Opportunities below this score are skipped automatically.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={policy.minMatchScore}
                  onChange={(e) => setPolicy((p) => ({ ...p, minMatchScore: +e.target.value }))}
                  className="flex-1 accent-[var(--app-action)]"
                  aria-label="Minimum qualify score"
                />
                <span className="w-8 text-[14px] font-[600] text-[var(--app-ink)] text-right">{policy.minMatchScore}</span>
              </div>
            </div>
            <div>
              <label className="block text-[14px] font-[600] text-[var(--app-ink)] mb-1">
                Auto-send minimum score
              </label>
              <p className="text-[12px] text-[var(--app-muted)] mb-2">
                Applications only send automatically at this score or above (requires auto mode).
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={policy.autoSendMinScore}
                  onChange={(e) => setPolicy((p) => ({ ...p, autoSendMinScore: +e.target.value }))}
                  className="flex-1 accent-[var(--app-action)]"
                  aria-label="Auto-send minimum score"
                />
                <span className="w-8 text-[14px] font-[600] text-[var(--app-ink)] text-right">{policy.autoSendMinScore}</span>
              </div>
            </div>
            <div>
              <label className="block text-[14px] font-[600] text-[var(--app-ink)] mb-1">
                Max daily outreach
              </label>
              <p className="text-[12px] text-[var(--app-muted)] mb-2">
                Hard cap on outbound actions per day.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={policy.maxDailyOutreach}
                  onChange={(e) => setPolicy((p) => ({ ...p, maxDailyOutreach: +e.target.value }))}
                  className="flex-1 accent-[var(--app-action)]"
                  aria-label="Max daily outreach"
                />
                <span className="w-8 text-[14px] font-[600] text-[var(--app-ink)] text-right">{policy.maxDailyOutreach}</span>
              </div>
            </div>
            {policy.compensationMin !== undefined && (
              <div>
                <label className="block text-[14px] font-[600] text-[var(--app-ink)] mb-1">
                  Compensation floor (USD/yr)
                </label>
                <p className="text-[12px] text-[var(--app-muted)] mb-2">
                  Roles below this value fail the hard rule automatically.
                </p>
                <input
                  type="number"
                  value={policy.compensationMin}
                  onChange={(e) => setPolicy((p) => ({ ...p, compensationMin: +e.target.value }))}
                  className="h-[36px] w-full rounded-[8px] border border-[var(--app-line)] bg-[var(--app-surface)] px-3 text-[14px] text-[var(--app-ink)] focus:outline focus:outline-2 focus:outline-[var(--app-action)]"
                  aria-label="Compensation floor"
                />
              </div>
            )}
          </div>
        </section>

        {/* Permission matrix */}
        <section className="rounded-[10px] border border-[var(--app-line)] bg-[var(--app-surface)] p-5">
          <h2 className="text-[15px] font-[600] leading-[22px] text-[var(--app-ink)] mb-1">Permission matrix</h2>
          <p className="text-[13px] text-[var(--app-muted)] mb-4">
            What Pursio can do under each autonomy mode.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]" aria-label="Agent permission matrix">
              <thead>
                <tr className="border-b border-[var(--app-line)]">
                  <th className="py-2 text-left font-[500] text-[var(--app-muted)]">Action</th>
                  <th className="py-2 px-4 text-center font-[500] text-[var(--app-muted)]">Observe</th>
                  <th className="py-2 px-4 text-center font-[500] text-[var(--app-muted)]">Prepare</th>
                  <th className="py-2 px-4 text-center font-[500] text-[var(--app-action)]">Auto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--app-line)]">
                {permissionMatrix.map((row) => (
                  <tr
                    key={row.action}
                    className={cn(
                      "transition-colors",
                      policy.globalMode === "auto" && row.auto
                        ? "bg-[var(--app-subtle)]"
                        : policy.globalMode === "prepare" && row.prepare
                        ? "bg-[var(--app-subtle)]"
                        : ""
                    )}
                  >
                    <td className="py-2 text-[var(--app-ink)]">{row.action}</td>
                    {(["observe", "prepare", "auto"] as const).map((mode) => (
                      <td key={mode} className="py-2 px-4 text-center">
                        {row[mode] ? (
                          <span className="inline-block h-4 w-4 rounded-full bg-[var(--app-subtle)] text-[var(--app-secondary)] text-[10px] font-[700] leading-4 text-center">✓</span>
                        ) : (
                          <span className="inline-block h-4 w-4 rounded-full bg-[var(--app-subtle)] text-[var(--app-secondary)] text-[10px] font-[700] leading-4 text-center">–</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Always ask before */}
        <section className="rounded-[10px] border border-[var(--app-line)] bg-[var(--app-surface)] p-5">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="h-4 w-4 text-[var(--app-secondary)]" aria-hidden="true" />
            <h2 className="text-[15px] font-[600] leading-[22px] text-[var(--app-ink)]">Always ask before</h2>
          </div>
          <p className="text-[13px] text-[var(--app-muted)] mb-4">
            These actions always require your explicit approval, regardless of autonomy mode.
          </p>
          <div className="flex flex-wrap gap-2">
            {alwaysApproveItems.map((item) => (
              <Badge key={item} variant="warning">{item}</Badge>
            ))}
          </div>
        </section>

        {/* Exclusions */}
        <section className="rounded-[10px] border border-[var(--app-line)] bg-[var(--app-surface)] p-5">
          <h2 className="text-[15px] font-[600] leading-[22px] text-[var(--app-ink)] mb-1">Exclusions</h2>
          <p className="text-[13px] text-[var(--app-muted)] mb-3">
            Categories, domains or companies Pursio will never contact or apply to.
          </p>
          <div className="flex flex-wrap gap-2">
            {policy.exclusions.map((e) => (
              <Badge key={e} variant="default">{e}<button aria-label={`Remove ${e}`} className="ml-1 p-1" onClick={() => setPolicy(p => ({ ...p, exclusions: p.exclusions.filter(item => item !== e) }))}><X size={12} /></button></Badge>
            ))}
            <form className="flex w-full flex-wrap gap-2 mt-2" onSubmit={event => { event.preventDefault(); const value = exclusion.trim(); if (value && !policy.exclusions.includes(value)) setPolicy(p => ({ ...p, exclusions: [...p.exclusions, value] })); setExclusion(""); }}><input aria-label="New exclusion" value={exclusion} onChange={e => setExclusion(e.target.value)} placeholder="Company or domain" className="workspace-field min-w-0 flex-1" /><Button variant="secondary" type="submit" disabled={!exclusion.trim()}>Add</Button></form>
          </div>
        </section>

        {/* Quiet hours */}
        <section className="rounded-[10px] border border-[var(--app-line)] bg-[var(--app-surface)] p-5">
          <h2 className="text-[15px] font-[600] leading-[22px] text-[var(--app-ink)] mb-1">Quiet hours</h2>
          <p className="text-[13px] text-[var(--app-muted)] mb-3">
            Pursio will not send any outreach during these hours.
          </p>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="min-w-0">
              <label htmlFor="quiet-start" className="block text-[12px] font-[500] text-[var(--app-muted)] mb-1">From</label>
              <input
                id="quiet-start" type="time"
                value={policy.quietHoursStart ?? "22:00"}
                onChange={(e) => setPolicy((p) => ({ ...p, quietHoursStart: e.target.value }))}
                className="h-10 w-full min-w-0 rounded-[8px] border border-[var(--app-line)] bg-[var(--app-surface)] px-3 text-[14px] text-[var(--app-ink)] focus:outline focus:outline-2 focus:outline-[var(--app-action)]"
              />
            </div>
            <span className="text-[var(--app-muted)] mt-4">to</span>
            <div>
              <label htmlFor="quiet-end" className="block text-[12px] font-[500] text-[var(--app-muted)] mb-1">To</label>
              <input
                id="quiet-end" type="time"
                value={policy.quietHoursEnd ?? "08:00"}
                onChange={(e) => setPolicy((p) => ({ ...p, quietHoursEnd: e.target.value }))}
                className="h-10 w-full min-w-0 rounded-[8px] border border-[var(--app-line)] bg-[var(--app-surface)] px-3 text-[14px] text-[var(--app-ink)] focus:outline focus:outline-2 focus:outline-[var(--app-action)]"
              />
            </div>
          </div>
        </section>

        {/* Policy preview */}
        <section className="rounded-[10px] border border-[var(--app-line)] bg-[var(--app-subtle)] p-5">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-[var(--app-action)]" />
            <h2 className="text-[14px] font-[600] text-[var(--app-action)]">Under these rules, Pursio would…</h2>
          </div>
          <ul className="flex flex-col gap-1.5 text-[13px] leading-[18px] text-[var(--app-secondary)]">
            <li>• Qualify opportunities with score ≥ <strong>{policy.minMatchScore}</strong></li>
            <li>• {policy.globalMode === "auto"
              ? `Auto-send applications when score ≥ ${policy.autoSendMinScore} and all hard rules pass`
              : policy.globalMode === "prepare"
              ? "Prepare applications and drafts but always wait for your approval"
              : "Find and score opportunities without taking any action"
            }</li>
            <li>• {policy.globalMode === "auto" ? <>Send at most <strong>{policy.maxDailyOutreach}</strong> outreach messages per day</> : "Send nothing without your approval"}</li>
            {policy.compensationMin && (
              <li>• Reject any role below ${policy.compensationMin.toLocaleString()}/yr</li>
            )}
            <li>• Do not send during quiet hours ({policy.quietHoursStart} – {policy.quietHoursEnd})</li>
            <li>• Always ask before: salary negotiation, interview scheduling, contracts</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
