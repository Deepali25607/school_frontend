import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Search,
  Eye,
  EyeOff,
  Pin,
  RotateCcw,
  Sparkles,
  Check,
} from "lucide-react";

/**
 * Customize-sidebar modal. The full role-allowed nav list is passed in; the
 * user can toggle individual items off (they'll disappear from the rail but
 * still resolve via Cmd+K and direct URL).
 */
export default function CustomizeSidebar({
  navItems,
  isHidden,
  isPinned,
  toggle,
  hideAll,
  showAll,
  reset,
  onClose,
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return navItems;
    return navItems.filter((n) => n.label.toLowerCase().includes(t));
  }, [navItems, q]);

  const visibleCount = navItems.filter((n) => !isHidden(n.to)).length;
  const hiddenCount = navItems.length - visibleCount;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.96, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 12 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl border border-white/15 bg-[#0d0f24] shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-white/10 p-5">
          <div>
            <div className="chip">
              <Sparkles size={13} className="text-accent-gold" />
              Customize sidebar
            </div>
            <h2 className="mt-2 font-display text-xl font-semibold">
              Pick what shows in your rail
            </h2>
            <p className="mt-1 text-xs text-white/55">
              {visibleCount} visible · {hiddenCount} hidden. Hidden items still
              work — search them via{" "}
              <kbd className="rounded border border-white/15 bg-white/5 px-1 py-px text-[10px]">
                Ctrl+K
              </kbd>{" "}
              or open by URL.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-white/55 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
            <Search size={14} className="text-white/55" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter modules…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-white/35"
            />
          </div>
          <button
            type="button"
            onClick={() => showAll(navItems.map((n) => n.to))}
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/75 hover:bg-white/10"
            title="Show every module again"
          >
            <Eye size={12} /> Show all
          </button>
          <button
            type="button"
            onClick={() => hideAll(navItems.map((n) => n.to))}
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/75 hover:bg-white/10"
            title="Hide everything except pinned items"
          >
            <EyeOff size={12} /> Hide all
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {filtered.length === 0 ? (
            <div className="px-3 py-10 text-center text-sm text-white/55">
              No modules match "{q}".
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {filtered.map((n) => {
                const hidden = isHidden(n.to);
                const pinned = isPinned(n.to);
                return (
                  <button
                    key={n.to}
                    type="button"
                    disabled={pinned}
                    onClick={() => toggle(n.to)}
                    className={`group flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${
                      pinned
                        ? "cursor-not-allowed border-amber-400/30 bg-amber-500/10"
                        : hidden
                        ? "border-white/5 bg-white/[0.02] text-white/45 hover:border-white/15 hover:bg-white/5"
                        : "border-brand-400/30 bg-brand-500/[0.07] text-white hover:bg-brand-500/15"
                    }`}
                  >
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${
                        pinned
                          ? "bg-amber-500/20 text-amber-200"
                          : hidden
                          ? "bg-white/5 text-white/40"
                          : "bg-brand-500/20 text-brand-200"
                      }`}
                    >
                      <n.icon size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {n.label}
                      </div>
                      <div className="truncate text-[11px] text-white/45">
                        {n.to}
                      </div>
                    </div>
                    {pinned ? (
                      <Pin size={13} className="text-amber-300" />
                    ) : hidden ? (
                      <EyeOff size={14} className="text-white/40" />
                    ) : (
                      <Check size={14} className="text-brand-300" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-white/10 p-4">
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/75 hover:bg-white/10"
          >
            <RotateCcw size={12} /> Reset to defaults
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gradient-to-r from-brand-500 to-accent-violet px-4 py-2 text-sm font-semibold text-white shadow shadow-brand-500/20"
          >
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
