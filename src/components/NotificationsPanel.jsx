import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellOff,
  UserPlus,
  GraduationCap,
  AlertOctagon,
  Wrench,
  IdCard,
  FileText,
  BadgeCheck,
  ClipboardCheck,
  Megaphone,
  HeartPulse,
  Package,
  Calendar,
  Wallet,
  ShieldAlert,
  Trophy,
  CheckCheck,
  Sparkles as SparklesIcon,
} from "lucide-react";
import { useNotifications } from "../lib/useNotifications.js";

// Map of icon names → component (matches `icon` strings the backend emits)
const ICON_MAP = {
  Bell,
  UserPlus,
  GraduationCap,
  AlertOctagon,
  Wrench,
  IdCard,
  FileText,
  BadgeCheck,
  ClipboardCheck,
  Megaphone,
  HeartPulse,
  Package,
  Calendar,
  Wallet,
  ShieldAlert,
  Trophy,
};

const SEVERITY_TONES = {
  info: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  success: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  warning: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  alert: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

const SEVERITY_DOTS = {
  info: "bg-brand-400",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  alert: "bg-rose-400",
};

export default function NotificationsPanel({ open, anchorRef, onClose }) {
  const { items, unreadCount, loading, markRead, markAllRead } =
    useNotifications(30);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      if (anchorRef?.current?.contains(e.target)) return;
      onClose?.();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, anchorRef, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleClick = (n) => {
    if (!n.read) markRead(n.id);
    if (n.link) {
      onClose?.();
      navigate(n.link);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-x-3 top-16 z-40 w-auto origin-top overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a1c]/95 shadow-glow backdrop-blur-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[380px] sm:max-w-[calc(100vw-1.5rem)] sm:origin-top-right"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-accent-violet/25 to-accent-pink/25 blur-3xl" />

          <div className="relative flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                <Bell size={13} />
              </div>
              <div>
                <div className="font-display text-sm font-semibold">
                  Notifications
                </div>
                <div className="text-[10px] uppercase tracking-wider text-white/55">
                  {unreadCount > 0
                    ? `${unreadCount} unread`
                    : "All caught up"}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCheck size={11} /> Mark all read
            </button>
          </div>

          <div className="relative max-h-[440px] overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded-lg bg-white/5"
                  />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="px-6 py-10 text-center text-white/55">
                <BellOff size={20} className="mx-auto mb-2 text-white/40" />
                <div className="text-sm">Nothing yet</div>
                <div className="mt-1 text-[11px] text-white/40">
                  Mutations across the platform will show up here
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-white/[0.04]">
                {items.map((n, i) => (
                  <Item key={n.id} n={n} idx={i} onClick={handleClick} />
                ))}
              </ul>
            )}
          </div>

          <div className="relative border-t border-white/10 px-4 py-2 text-center">
            <Link
              to="/app/audit"
              onClick={onClose}
              className="inline-flex items-center gap-1 text-[11px] text-white/65 hover:text-white"
            >
              <SparklesIcon size={11} className="text-accent-gold" />
              View full audit log
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Item({ n, idx, onClick }) {
  const Icon = ICON_MAP[n.icon] || Bell;
  const ago = relTime(n.ts);
  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(idx, 8) * 0.025 }}
    >
      <button
        type="button"
        onClick={() => onClick(n)}
        className={`group relative flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
          n.read ? "hover:bg-white/[0.04]" : "bg-white/[0.025] hover:bg-white/[0.05]"
        }`}
      >
        {!n.read && (
          <span
            className={`absolute left-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full ${SEVERITY_DOTS[n.severity] || "bg-brand-400"} shadow-glow`}
          />
        )}
        <span
          className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ring-1 ${SEVERITY_TONES[n.severity] || SEVERITY_TONES.info}`}
        >
          <Icon size={13} />
        </span>
        <div className="min-w-0 flex-1">
          <div
            className={`truncate text-[13px] leading-snug ${n.read ? "font-normal text-white/70" : "font-semibold text-white"}`}
          >
            {n.title}
          </div>
          {n.body && (
            <div className="mt-0.5 line-clamp-2 text-[11px] text-white/55">
              {n.body}
            </div>
          )}
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-white/40">
            <span>{ago}</span>
            {n.link && <span className="text-brand-300/70">· open →</span>}
          </div>
        </div>
      </button>
    </motion.li>
  );
}

function relTime(iso) {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
