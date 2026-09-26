import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function scoreColor(score: number): string {
  if (score >= 70) return "text-[var(--app-secondary)]";
  if (score >= 40) return "text-[var(--app-secondary)]";
  return "text-[var(--app-secondary)]";
}

export function scoreBg(score: number): string {
  if (score >= 70) return "bg-[var(--app-subtle)] text-[var(--app-secondary)] border-[var(--app-line)]";
  if (score >= 40) return "bg-[var(--app-subtle)] text-[var(--app-secondary)] border-[var(--app-line)]";
  return "bg-[var(--app-subtle)] text-[var(--app-secondary)] border-[var(--app-line)]";
}

export function opportunityStatusColor(status: string): string {
  const map: Record<string, string> = {
    NEW: "bg-[var(--app-subtle)] text-[var(--app-secondary)] border-[var(--app-line)]",
    QUALIFIED: "bg-[var(--app-subtle)] text-[var(--app-secondary)] border-[var(--app-line)]",
    PREPARED: "bg-[var(--app-subtle)] text-[var(--app-secondary)] border-[var(--app-line)]",
    PENDING_APPROVAL: "bg-[var(--app-subtle)] text-[var(--app-secondary)] border-[var(--app-line)]",
    APPLIED: "bg-[var(--app-subtle)] text-[var(--app-secondary)] border-[var(--app-line)]",
    CONTACTED: "bg-[var(--app-subtle)] text-[var(--app-secondary)] border-[var(--app-line)]",
    REPLIED: "bg-[var(--app-subtle)] text-[var(--app-secondary)] border-[var(--app-line)]",
    INTERVIEW: "bg-[var(--app-subtle)] text-[var(--app-secondary)] border-[var(--app-line)]",
    INTERESTED: "bg-[var(--app-subtle)] text-[var(--app-secondary)] border-[var(--app-line)]",
    OFFER: "bg-[var(--app-subtle)] text-[var(--app-secondary)] border-[var(--app-line)]",
    WON: "bg-[var(--app-subtle)] text-[var(--app-secondary)] border-[var(--app-line)]",
    REJECTED: "bg-[var(--app-subtle)] text-[var(--app-secondary)] border-[var(--app-line)]",
    CLOSED: "bg-[var(--app-subtle)] text-[var(--app-secondary)] border-[var(--app-line)]",
    SKIPPED: "bg-[var(--app-subtle)] text-[var(--app-secondary)] border-[var(--app-line)]",
  };
  return map[status] ?? "bg-[var(--app-subtle)] text-[var(--app-secondary)] border-[var(--app-line)]";
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + "…";
}
