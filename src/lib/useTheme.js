import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "lumina-theme";
const VALID = new Set(["dark", "light", "system"]);

function readStored() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return VALID.has(v) ? v : "dark";
  } catch {
    return "dark";
  }
}

function systemPrefersDark() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
  );
}

function resolve(mode) {
  if (mode === "system") return systemPrefersDark() ? "dark" : "light";
  return mode;
}

function apply(mode) {
  const resolved = resolve(mode);
  const root = document.documentElement;
  root.setAttribute("data-theme", resolved);
  root.classList.toggle("dark", resolved === "dark");
  root.classList.toggle("light", resolved === "light");
  root.style.colorScheme = resolved;
}

// Apply once at module load so the very first paint (before React hydrates the
// hook) already has the right theme — avoids the dark-flash for light users.
if (typeof document !== "undefined") {
  apply(readStored());
}

export function useTheme() {
  const [mode, setMode] = useState(readStored);

  useEffect(() => {
    apply(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [mode]);

  const set = useCallback((next) => {
    if (VALID.has(next)) setMode(next);
  }, []);

  return {
    mode,
    resolved: resolve(mode),
    setTheme: set,
    isDark: resolve(mode) === "dark",
    isLight: resolve(mode) === "light",
  };
}
