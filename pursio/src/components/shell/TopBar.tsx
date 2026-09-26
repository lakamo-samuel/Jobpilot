"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, Moon, Sun, Pause, Play, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useWorkspace } from "./WorkspaceProvider";
import { mockNotifications } from "@/lib/mock-data";
import { entityHref, useStoredState } from "@/lib/workspace-state";
const titles: Record<string, string> = { dashboard: "Overview", opportunities: "Opportunities", inbox: "Inbox", activity: "Activity", cvs: "Documents", profile: "Profile", "agent-rules": "Agent rules", integrations: "Connections", settings: "Settings" };
const emptyRead: string[] = [];
export function TopBar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const { theme, setTheme, paused, togglePaused } = useWorkspace();
  const [read, setRead] = useStoredState("read-notifications", emptyRead);
  const unread = mockNotifications.filter(n => !n.readAt && !read.includes(n.id)).length;
  return <header className="flex h-[64px] shrink-0 items-center justify-between gap-2 border-b border-[var(--app-line)] bg-[var(--app-canvas)] px-4 sm:px-8">
    <div className="flex min-w-0 items-center gap-2"><Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open navigation"><Menu size={19} /></Button><span className="hidden text-xs text-[var(--app-muted)] sm:inline">Workspace</span><span className="hidden text-[var(--app-line-strong)] sm:inline">/</span><span className="truncate text-xs font-medium">{titles[pathname.split("/").pop()!] ?? "Workspace"}</span></div>
    <div className="flex items-center gap-1 sm:gap-2">
      <button onClick={togglePaused} aria-label={paused ? "Resume agent preview" : "Pause agent preview"} className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs text-[var(--app-secondary)] hover:bg-[var(--app-subtle)]"><span className={paused ? "h-1.5 w-1.5 rounded-full bg-[var(--app-muted)]" : "h-1.5 w-1.5 rounded-full bg-[var(--app-accent)]"} /><span className="hidden sm:inline">Agent</span>{paused ? "Paused" : "Ready"}{paused ? <Play size={12} /> : <Pause size={12} />}</button>
      <Button variant="ghost" size="icon" aria-label="Toggle color theme" onClick={() => { const dark = document.documentElement.dataset.appTheme === "dark"; setTheme(dark ? "light" : "dark"); }} title={`Theme: ${theme}`}><Sun size={17} className="hidden [[data-app-theme=dark]_&]:block" /><Moon size={17} className="[[data-app-theme=dark]_&]:hidden" /></Button>
      <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="relative" aria-label={`Notifications, ${unread} unread`}><Bell size={17} />{unread > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[var(--app-accent)]" />}</Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-[320px] max-w-[calc(100vw-24px)]"><DropdownMenuLabel>Notifications</DropdownMenuLabel><DropdownMenuSeparator />{mockNotifications.map(n => <DropdownMenuItem key={n.id} asChild><Link href={entityHref(n.entityRef)} onClick={() => setRead(previous => [...new Set([...previous, n.id])])} className="flex flex-col items-start gap-1 py-3"><span className="text-[13px] font-medium">{n.title}</span><span className="text-xs leading-5 text-[var(--app-muted)]">{n.body}</span></Link></DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>
      <DropdownMenu><DropdownMenuTrigger asChild><button aria-label="User menu" className="ml-1 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--app-line-strong)] text-xs font-medium">O</button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Olamide · Preview</DropdownMenuLabel><DropdownMenuItem asChild><Link href="/dashboard/profile"><User size={15} />Your profile</Link></DropdownMenuItem><DropdownMenuItem asChild><Link href="/dashboard/settings"><Settings size={15} />Settings</Link></DropdownMenuItem></DropdownMenuContent></DropdownMenu>
    </div>
  </header>;
}
