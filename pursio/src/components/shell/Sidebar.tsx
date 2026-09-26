"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, LayoutDashboard, Briefcase, Inbox, Activity, FileText, User, SlidersHorizontal, Plug, Settings, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
const groups = [
  { label: "Workspace", items: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/opportunities", label: "Opportunities", icon: Briefcase },
    { href: "/dashboard/inbox", label: "Inbox", icon: Inbox },
    { href: "/dashboard/activity", label: "Activity", icon: Activity },
  ] },
  { label: "Your foundation", items: [
    { href: "/dashboard/cvs", label: "Documents", icon: FileText },
    { href: "/dashboard/profile", label: "Profile", icon: User },
    { href: "/dashboard/agent-rules", label: "Agent rules", icon: SlidersHorizontal },
    { href: "/dashboard/integrations", label: "Connections", icon: Plug },
  ] },
];
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return <aside className="flex h-full w-[232px] flex-col bg-[var(--app-sidebar)] text-[var(--app-ink)]">
    <Link href="/dashboard" onClick={onNavigate} className="flex h-[72px] shrink-0 items-center gap-2.5 px-6" aria-label="Pursio home"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--app-action)] text-[var(--app-on-action)]"><ArrowUp size={19} className="rotate-45" strokeWidth={2.5} /></span><span className="text-lg font-semibold tracking-[-.04em]">pursio<span className="text-[var(--app-muted)]">.</span></span></Link>
    <nav aria-label="Main navigation" className="flex-1 space-y-8 overflow-y-auto px-3 pt-6">
      {groups.map(group => <div key={group.label}><p className="eyebrow mb-3 px-3">{group.label}</p><ul className="space-y-1">{group.items.map(({ href, label, icon: Icon }) => {
        const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return <li key={href}><Link href={href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={cn("flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13px] transition-colors", active ? "bg-[var(--app-surface)] font-semibold text-[var(--app-ink)] shadow-[0_1px_3px_#00000008]" : "text-[var(--app-secondary)] hover:bg-[var(--app-subtle)]")}><Icon size={17} strokeWidth={1.6} />{label}{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--app-accent)]" />}</Link></li>;
      })}</ul></div>)}
    </nav>
    <div className="space-y-3 p-3">
      <Link href="/dashboard/settings" onClick={onNavigate} aria-current={pathname === "/dashboard/settings" ? "page" : undefined} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13px] text-[var(--app-secondary)] hover:bg-[var(--app-subtle)]"><Settings size={17} />Settings</Link>
      <div className="border-t border-[var(--app-line)] px-3 pt-4 pb-2"><div className="flex items-center justify-between"><p className="text-xs font-medium">Preview workspace</p><ArrowUpRight size={14} className="text-[var(--app-muted)]" /></div><p className="mt-1 text-[11px] leading-5 text-[var(--app-muted)]">Sample opportunities. No emails sent.</p></div>
    </div>
  </aside>;
}
