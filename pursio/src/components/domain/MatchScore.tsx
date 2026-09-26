import React from "react";
import { Info, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { MatchSummary } from "@/lib/types";

interface MatchScoreProps {
  match: MatchSummary;
  size?: "default" | "compact" | "large";
  showExplanation?: boolean;
}

function getScoreStyle(score: number, hardRulePass: boolean) {
  if (!hardRulePass) return { bg: "bg-[var(--app-subtle)] border-[var(--app-line)]", text: "text-[var(--app-secondary)]", label: "Rule fail" };
  if (score >= 70) return { bg: "bg-[var(--app-subtle)] border-[var(--app-line)]", text: "text-[var(--app-secondary)]", label: "Strong" };
  if (score >= 40) return { bg: "bg-[var(--app-subtle)] border-[var(--app-line)]", text: "text-[var(--app-secondary)]", label: "Moderate" };
  return { bg: "bg-[var(--app-subtle)] border-[var(--app-line)]", text: "text-[var(--app-secondary)]", label: "Weak" };
}

export function MatchScore({ match, size = "default", showExplanation = true }: MatchScoreProps) {
  const style = getScoreStyle(match.score, match.hardRulePass);

  if (size === "compact") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-[6px] border px-1.5 py-0.5 text-[12px] font-[600] leading-[16px] cursor-default",
              style.bg,
              style.text
            )}
            aria-label={`Match score ${match.score}${!match.hardRulePass ? ", hard rule failed" : ""}`}
          >
            {!match.hardRulePass && <ShieldX className="h-3 w-3" aria-hidden="true" />}
            {match.hardRulePass ? match.score : "✕"}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[240px]">
          {!match.hardRulePass ? (
            <p>Hard rule failed — {match.explanation}</p>
          ) : (
            <p>{match.explanation}</p>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  if (size === "large") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px] border text-[24px] font-[600] leading-none",
              style.bg,
              style.text
            )}
            aria-label={`Match score ${match.score}`}
          >
            {match.hardRulePass ? match.score : "✕"}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <p className={cn("text-[15px] font-[600] leading-[22px]", style.text)}>
                {style.label} match
              </p>
              {!match.hardRulePass && (
                <span className="inline-flex items-center gap-1 rounded-[6px] border border-[var(--app-danger)] bg-[var(--app-danger-subtle)] px-1.5 py-0.5 text-[12px] font-[500] text-[var(--app-danger)]">
                  <ShieldX className="h-3 w-3" /> Hard rule failed
                </span>
              )}
            </div>
            <p className="text-[13px] leading-[18px] text-[var(--app-muted)]">{match.explanation}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {match.matchedSkills.length > 0 && (
            <div>
              <p className="text-[12px] font-[500] uppercase tracking-wider text-[var(--app-muted)] mb-1.5">
                Strong match
              </p>
              <ul className="flex flex-wrap gap-1">
                {match.matchedSkills.map((s) => (
                  <li
                    key={s}
                    className="rounded-[6px] border border-[var(--app-line)] bg-[var(--app-subtle)] px-2 py-0.5 text-[12px] text-[var(--app-secondary)]"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {match.gaps.length > 0 && (
            <div>
              <p className="text-[12px] font-[500] uppercase tracking-wider text-[var(--app-muted)] mb-1.5">
                Gaps
              </p>
              <ul className="flex flex-wrap gap-1">
                {match.gaps.map((g) => (
                  <li
                    key={g}
                    className="rounded-[6px] border border-[var(--app-line)] bg-[var(--app-subtle)] px-2 py-0.5 text-[12px] text-[var(--app-secondary)]"
                  >
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {match.unknowns.length > 0 && (
          <div className="flex items-center gap-1.5 text-[13px] text-[var(--app-muted)]">
            <Info className="h-3.5 w-3.5 shrink-0" />
            Unknown: {match.unknowns.join(", ")}
          </div>
        )}
      </div>
    );
  }

  // default size
  return (
    <div className="flex items-start gap-2">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border text-[15px] font-[600] leading-none",
          style.bg,
          style.text
        )}
        aria-label={`Match score ${match.score}`}
      >
        {match.hardRulePass ? match.score : "✕"}
      </div>
      {showExplanation && (
        <div className="min-w-0">
          <p className={cn("text-[13px] font-[600] leading-[18px]", style.text)}>
            {style.label}
            {!match.hardRulePass && (
              <span className="ml-1.5 text-[12px] font-[400] text-[var(--app-danger)]">— hard rule failed</span>
            )}
          </p>
          <p className="text-[12px] leading-[16px] text-[var(--app-muted)] line-clamp-1">{match.explanation}</p>
        </div>
      )}
    </div>
  );
}
