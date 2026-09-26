"use client";
import { useState } from "react";
import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import { WorkspaceProvider } from "@/components/shell/WorkspaceProvider";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <WorkspaceProvider><div className="workspace flex h-dvh overflow-hidden">
    <a href="#workspace-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-lg focus:bg-[var(--app-surface)] focus:p-3">Skip to content</a>
    <div className="hidden h-full shrink-0 border-r border-[var(--app-line)] lg:block"><Sidebar /></div>
    <Dialog open={menuOpen} onOpenChange={setMenuOpen}><DialogContent className="left-0 top-0 h-dvh w-[280px] max-w-[85vw] translate-x-0 translate-y-0 rounded-none border-0 bg-[var(--app-sidebar)] p-0 [&>aside]:w-full"><DialogTitle className="sr-only">Navigation</DialogTitle><DialogDescription className="sr-only">Choose a workspace section.</DialogDescription><Sidebar onNavigate={() => setMenuOpen(false)} /></DialogContent></Dialog>
    <div className="flex min-w-0 flex-1 flex-col"><TopBar onMenu={() => setMenuOpen(true)} /><main id="workspace-main" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto outline-none">{children}</main></div>
  </div></WorkspaceProvider>;
}
