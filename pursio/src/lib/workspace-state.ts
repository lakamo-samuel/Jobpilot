"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
const eventName = "pursio:storage";
const prefix = "pursio:";
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(eventName, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(eventName, callback); };
}
export function readStored(key: string): string | null {
  try { return localStorage.getItem(prefix + key); } catch { return null; }
}
export function useStoredState<T>(key: string, initial: T) {
  const raw = useSyncExternalStore(subscribe, () => readStored(key), () => null);
  const value = useMemo(() => { try { return raw === null ? initial : JSON.parse(raw) as T; } catch { return initial; } }, [raw, initial]);
  const setValue = useCallback((next: T | ((previous: T) => T)) => {
    const old = readStored(key);
    let previous = initial;
    try { if (old !== null) previous = JSON.parse(old); } catch { /* use default */ }
    const result = typeof next === "function" ? (next as (p: T) => T)(previous) : next;
    try {
      localStorage.setItem(prefix + key, JSON.stringify(result));
      window.dispatchEvent(new Event(eventName));
      return true;
    } catch { return false; }
  }, [key, initial]);
  return [value, setValue] as const;
}
export function exportWorkspace() {
  const data: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) { try { data[key.slice(prefix.length)] = JSON.parse(localStorage.getItem(key)!); } catch { /* skip invalid entries */ } }
  }
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = "pursio-workspace.json"; anchor.click(); URL.revokeObjectURL(url);
}
export function resetWorkspace() {
  Object.keys(localStorage).filter(key => key.startsWith(prefix) && key !== prefix + "theme").forEach(key => localStorage.removeItem(key));
  window.dispatchEvent(new Event(eventName));
}
export function entityHref(ref?: { type: string; id: string }) {
  if (!ref) return "/dashboard/activity";
  if (ref.type === "conversation") return `/dashboard/inbox?id=${encodeURIComponent(ref.id)}`;
  if (ref.type === "opportunity") return `/dashboard/opportunities?id=${encodeURIComponent(ref.id)}`;
  if (ref.type === "integration") return "/dashboard/integrations";
  return "/dashboard/profile";
}
