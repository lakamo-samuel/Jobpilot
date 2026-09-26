"use client";

import React, { useState } from "react";
import { CheckCircle2, Circle, Link2, Globe, Plus, Pencil } from "lucide-react";
import { mockProfile } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStoredState } from "@/lib/workspace-state";
import { useWorkspace } from "@/components/shell/WorkspaceProvider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { Profile, ProfileFact } from "@/lib/types";

function FactItem({ fact }: { fact: ProfileFact }) {
  return (
    <div className="flex items-start gap-2.5 py-2">
      {fact.verified ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-[var(--app-secondary)]" aria-label="Verified" />
      ) : (
        <Circle className="h-4 w-4 shrink-0 mt-0.5 text-[var(--app-line-strong)]" aria-label="Unverified" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] leading-[21px] text-[var(--app-ink)]">{fact.value}</p>
        <p className="text-[12px] text-[var(--app-muted)]">
          {fact.type} · from {fact.evidenceSource}
          {!fact.verified && " · unverified"}
        </p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [profile, saveProfile] = useStoredState<Profile>("profile", mockProfile);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [factOpen, setFactOpen] = useState(false);
  const [factValue, setFactValue] = useState("");
  const { notify } = useWorkspace();

  return (
    <div className="workspace-page !max-w-[1080px]">
      {/* Header */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="text-[24px] font-[600] leading-[32px] text-[var(--app-ink)]">Profile</h1>
          <p className="text-[14px] leading-[21px] text-[var(--app-muted)]">
            Your experience, preferences, and the facts behind every application.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setEditing(profile)}>
          <Pencil className="h-4 w-4" />
          Edit profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — professional summary */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Summary */}
          <section className="rounded-[10px] border border-[var(--app-line)] bg-[var(--app-surface)] p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-[600] leading-[22px] text-[var(--app-ink)]">Professional summary</h2>
            </div>
            <p className="text-[15px] font-[600] leading-[22px] text-[var(--app-ink)] mb-1">{profile.headline}</p>
            <p className="text-[14px] leading-[22px] text-[var(--app-secondary)]">{profile.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.links.github && (
                <a
                  href={profile.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[13px] text-[var(--app-action)] hover:underline"
                >
                  <Link2 className="h-3.5 w-3.5" /> GitHub
                </a>
              )}
              {profile.links.portfolio && (
                <a
                  href={profile.links.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[13px] text-[var(--app-action)] hover:underline"
                >
                  <Globe className="h-3.5 w-3.5" /> Portfolio
                </a>
              )}
              {profile.links.linkedin && (
                <a
                  href={profile.links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[13px] text-[var(--app-action)] hover:underline"
                >
                  <Link2 className="h-3.5 w-3.5" /> LinkedIn
                </a>
              )}
            </div>
          </section>

          {/* Verified facts */}
          <section className="rounded-[10px] border border-[var(--app-line)] bg-[var(--app-surface)] p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[15px] font-[600] leading-[22px] text-[var(--app-ink)]">Professional facts</h2>
              <Button variant="ghost" size="sm" onClick={() => setFactOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                Add fact
              </Button>
            </div>
            <p className="text-[13px] text-[var(--app-muted)] mb-3">
              Review the source of each fact. New entries are self-reported and remain unverified.
            </p>
            <div className="divide-y divide-[var(--app-line)]">
              {profile.facts.map((fact) => (
                <FactItem key={fact.id} fact={fact} />
              ))}
            </div>
          </section>

          {/* Skills */}
          <section className="rounded-[10px] border border-[var(--app-line)] bg-[var(--app-surface)] p-5">
            <h2 className="text-[15px] font-[600] leading-[22px] text-[var(--app-ink)] mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-[6px] border border-[var(--app-line)] bg-[var(--app-subtle)] px-2.5 py-1 text-[13px] text-[var(--app-secondary)]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        </div>

        {/* Right column — preferences */}
        <div className="flex flex-col gap-4">
          {/* What I want */}
          <section className="rounded-[10px] border border-[var(--app-line)] bg-[var(--app-surface)] p-4">
            <h2 className="text-[14px] font-[600] leading-[21px] text-[var(--app-ink)] mb-3">What I want</h2>
            <div className="flex flex-col gap-3 text-[13px]">
              <div>
                <p className="text-[12px] font-[500] uppercase tracking-wider text-[var(--app-muted)] mb-1">Target roles</p>
                <div className="flex flex-wrap gap-1">
                  {profile.targetRoles.map((r) => (
                    <Badge key={r} variant="default">{r}</Badge>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-[12px] font-[500] uppercase tracking-wider text-[var(--app-muted)] mb-1">Work mode</p>
                <div className="flex gap-1">
                  {profile.workModes.map((m) => (
                    <Badge key={m} variant="brand" className="capitalize">{m}</Badge>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-[12px] font-[500] uppercase tracking-wider text-[var(--app-muted)] mb-1">Locations</p>
                <div className="flex flex-wrap gap-1">
                  {profile.locations.map((l) => (
                    <Badge key={l} variant="default">{l}</Badge>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-[12px] font-[500] uppercase tracking-wider text-[var(--app-muted)] mb-1">Compensation floor</p>
                <p className="text-[var(--app-ink)] font-[500]">
                  ${profile.compensationMin?.toLocaleString()} {profile.compensationCurrency}/yr
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-[12px] font-[500] uppercase tracking-wider text-[var(--app-muted)] mb-1">Experience</p>
                <p className="text-[var(--app-ink)] font-[500]">{profile.yearsExperience} years</p>
              </div>
            </div>
          </section>
        </div>
      </div>
      <Dialog open={!!editing} onOpenChange={open => { if (!open) setEditing(null); }}><DialogContent className="max-w-[600px]"><DialogHeader><DialogTitle>Edit your profile</DialogTitle><DialogDescription>Changes are saved in this browser’s preview workspace.</DialogDescription></DialogHeader>{editing && <form onSubmit={e => { e.preventDefault(); if (saveProfile({ ...editing, targetRoles: editing.targetRoles.map(s => s.trim()).filter(Boolean), skills: [...new Set(editing.skills.map(s => s.trim()).filter(Boolean))], locations: editing.locations.map(s => s.trim()).filter(Boolean) })) { setEditing(null); notify("Profile saved in this browser."); } else notify("Could not save your profile."); }} className="space-y-4">
        <label className="block text-sm">Headline<input required maxLength={160} className="workspace-field mt-1" value={editing.headline} onChange={e => setEditing({ ...editing, headline: e.target.value })} /></label>
        <label className="block text-sm">Summary<textarea required rows={4} className="workspace-field mt-1" value={editing.summary} onChange={e => setEditing({ ...editing, summary: e.target.value })} /></label>
        {([['targetRoles', 'Target roles'], ['skills', 'Skills'], ['locations', 'Locations']] as const).map(([key, label]) => <label key={key} className="block text-sm">{label}<span className="ml-2 text-xs text-[var(--app-muted)]">Separate with commas</span><input className="workspace-field mt-1" value={editing[key].join(",")} onChange={e => setEditing({ ...editing, [key]: e.target.value.split(",") })} /></label>)}
        <div className="grid grid-cols-2 gap-3"><label className="text-sm">Years of experience<input type="number" min={0} max={80} required className="workspace-field mt-1" value={editing.yearsExperience} onChange={e => setEditing({ ...editing, yearsExperience: +e.target.value })} /></label><label className="text-sm">Minimum annual pay ({editing.compensationCurrency})<input type="number" min={0} className="workspace-field mt-1" value={editing.compensationMin ?? ""} onChange={e => setEditing({ ...editing, compensationMin: e.target.value ? +e.target.value : undefined })} /></label></div>
        <fieldset><legend className="mb-2 text-sm">Work preferences</legend><div className="flex flex-wrap gap-4">{['remote', 'hybrid', 'onsite'].map(mode => <label key={mode} className="flex items-center gap-2 text-sm capitalize"><input type="checkbox" className="accent-[var(--app-action)]" checked={editing.workModes.includes(mode)} onChange={e => setEditing({ ...editing, workModes: e.target.checked ? [...editing.workModes, mode] : editing.workModes.filter(m => m !== mode) })} />{mode}</label>)}</div></fieldset>
        {(['github', 'portfolio', 'linkedin'] as const).map(key => <label key={key} className="block text-sm capitalize">{key}<input type="url" pattern="https?://.*" placeholder="https://" className="workspace-field mt-1" value={editing.links[key] ?? ""} onChange={e => setEditing({ ...editing, links: { ...editing.links, [key]: e.target.value } })} /></label>)}
        <DialogFooter><Button variant="secondary" type="button" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit">Save profile</Button></DialogFooter>
      </form>}</DialogContent></Dialog>
      <Dialog open={factOpen} onOpenChange={setFactOpen}><DialogContent><DialogHeader><DialogTitle>Add a professional fact</DialogTitle><DialogDescription>Add a specific achievement or experience. It will be labeled self-reported until verified.</DialogDescription></DialogHeader><form onSubmit={e => { e.preventDefault(); if (!factValue.trim()) return; if (saveProfile(p => ({ ...p, facts: [...p.facts, { id: crypto.randomUUID(), type: "experience", value: factValue.trim(), verified: false, evidenceSource: "Self-reported" }] }))) { setFactOpen(false); setFactValue(""); notify("Fact added for review."); } else notify("Could not save this fact."); }}><textarea autoFocus required aria-label="Professional fact" rows={4} className="workspace-field" value={factValue} onChange={e => setFactValue(e.target.value)} /><DialogFooter><Button variant="secondary" type="button" onClick={() => setFactOpen(false)}>Cancel</Button><Button type="submit" disabled={!factValue.trim()}>Add fact</Button></DialogFooter></form></DialogContent></Dialog>

    </div>
  );
}
