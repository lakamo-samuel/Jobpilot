"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { X } from "lucide-react";
import { useStoredState } from "@/lib/workspace-state";

type Theme = "light" | "dark" | "system";
const Context = createContext<{
  theme: Theme; setTheme: (theme: Theme) => void;
  paused: boolean; togglePaused: () => void;
  notify: (message: string) => void;
} | null>(null);
export function useWorkspace() { const context = useContext(Context); if (!context) throw new Error("Workspace provider missing"); return context; }
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [theme, saveTheme] = useStoredState<Theme>("theme", "system");
  const [paused, savePaused] = useStoredState("paused", false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => { document.documentElement.dataset.appTheme = theme === "system" ? (media.matches ? "dark" : "light") : theme; };
    apply(); media.addEventListener("change", apply);
    return () => { media.removeEventListener("change", apply); delete document.documentElement.dataset.appTheme; };
  }, [theme]);
  useEffect(() => { if (!message) return; const timeout = setTimeout(() => setMessage(""), 6000); return () => clearTimeout(timeout); }, [message]);
  return <Context.Provider value={{ theme, setTheme: t => { if (!saveTheme(t)) setMessage("Your browser could not save the theme. Enable local storage and try again."); }, paused, togglePaused: () => { if (!savePaused(!paused)) setMessage("Could not save the agent preference."); }, notify: setMessage }}>
    {children}
    {message && <div role="status" className="fixed bottom-5 left-4 right-4 z-[70] mx-auto flex max-w-lg items-center gap-4 rounded-xl border border-[var(--app-line-strong)] bg-[var(--app-surface)] px-4 py-3 text-sm text-[var(--app-ink)] shadow-xl"><p className="flex-1">{message}</p><button aria-label="Dismiss notification" onClick={() => setMessage("")} className="p-2"><X size={16} /></button></div>}
  </Context.Provider>;
}
