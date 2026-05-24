import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

// Dashboard is the home — pin it so users can't lock themselves out
// of any navigation.
const PINNED = new Set(["/app"]);

function storageKey(userId) {
  return `lumina-sidebar-hidden:${userId || "anon"}`;
}

/**
 * Per-user sidebar customisation, persisted in localStorage.
 *
 * Hidden items still reachable via Cmd+K and direct URL — this just declutters
 * the rail so users don't see modules they never use.
 */
export function useSidebarPrefs() {
  const { user } = useAuth();
  const [hidden, setHidden] = useState(() => new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(user?.id));
      const arr = raw ? JSON.parse(raw) : [];
      setHidden(new Set(Array.isArray(arr) ? arr : []));
    } catch {
      setHidden(new Set());
    }
  }, [user?.id]);

  const save = (next) => {
    setHidden(next);
    try {
      localStorage.setItem(storageKey(user?.id), JSON.stringify([...next]));
    } catch {}
  };

  const toggle = (to) => {
    if (PINNED.has(to)) return;
    const next = new Set(hidden);
    if (next.has(to)) next.delete(to);
    else next.add(to);
    save(next);
  };

  const hideAll = (paths) => {
    const next = new Set(hidden);
    for (const p of paths) if (!PINNED.has(p)) next.add(p);
    save(next);
  };

  const showAll = (paths) => {
    const next = new Set(hidden);
    for (const p of paths) next.delete(p);
    save(next);
  };

  const reset = () => save(new Set());

  return {
    hidden,
    isHidden: (to) => hidden.has(to),
    isPinned: (to) => PINNED.has(to),
    toggle,
    hideAll,
    showAll,
    reset,
  };
}
