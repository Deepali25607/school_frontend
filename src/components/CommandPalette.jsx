import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Sparkles as SparklesIcon,
  Users,
  GraduationCap,
  UserPlus,
  FileText,
  Library,
  IdCard,
  Wrench,
  Package,
  Calendar,
  Building2,
  HeartPulse,
  ShieldAlert,
  Trophy,
  UtensilsCrossed,
  Clock,
  LayoutDashboard,
  Wallet,
  CalendarCheck,
  ClipboardList,
  Bus,
  Briefcase,
  BookOpen,
  Megaphone,
  ClipboardCheck,
  Settings,
  ScrollText,
  BarChart3,
  Award,
  CalendarClock,
  Vote,
  Landmark,
  Crown,
  Target,
  Swords,
  Compass,
  Lightbulb,
  ArrowUpFromLine,
  UserCog,
  UsersRound,
} from "lucide-react";
import { endpoints } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { NAV } from "../layouts/nav.js";

const ICON_MAP = {
  Users,
  GraduationCap,
  UserPlus,
  FileText,
  Library,
  IdCard,
  Wrench,
  Package,
  Calendar,
  Building2,
  HeartPulse,
  ShieldAlert,
  Trophy,
  Award,
  Wallet,
  Megaphone,
  CalendarClock,
  Vote,
  Landmark,
  Crown,
  Target,
  Swords,
  Compass,
  Lightbulb,
  ArrowUpFromLine,
  UserCog,
  UsersRound,
};

// Quick navigation entries shown when the query is empty.
const QUICK_NAV = [
  { label: "Dashboard", link: "/app", icon: LayoutDashboard },
  { label: "Students", link: "/app/students", icon: Users },
  { label: "Teachers", link: "/app/teachers", icon: GraduationCap },
  { label: "Attendance", link: "/app/attendance", icon: CalendarCheck },
  { label: "Fees & Finance", link: "/app/fees", icon: Wallet },
  { label: "Exams & Results", link: "/app/exams", icon: Trophy },
  { label: "Timetable", link: "/app/timetable", icon: ClipboardList },
  { label: "Library", link: "/app/library", icon: Library },
  { label: "Transport", link: "/app/transport", icon: Bus },
  { label: "Hostel", link: "/app/hostel", icon: Building2 },
  { label: "Payroll", link: "/app/payroll", icon: Briefcase },
  { label: "Online Learning", link: "/app/learning", icon: BookOpen },
  { label: "Events", link: "/app/events", icon: Calendar },
  { label: "Inventory", link: "/app/inventory", icon: Package },
  { label: "Leave", link: "/app/leave", icon: ClipboardCheck },
  { label: "Communications", link: "/app/communications", icon: Megaphone },
  { label: "Admissions", link: "/app/admissions", icon: UserPlus },
  { label: "Maintenance", link: "/app/maintenance", icon: Wrench },
  { label: "Visitors", link: "/app/visitors", icon: IdCard },
  { label: "Documents", link: "/app/documents", icon: FileText },
  { label: "Health", link: "/app/health", icon: HeartPulse },
  { label: "Discipline", link: "/app/discipline", icon: ShieldAlert },
  { label: "Achievements", link: "/app/achievements", icon: Trophy },
  { label: "Cafeteria", link: "/app/cafeteria", icon: UtensilsCrossed },
  { label: "Calendar", link: "/app/calendar", icon: Calendar },
  { label: "Alumni", link: "/app/alumni", icon: Award },
  { label: "Notice Board", link: "/app/notices", icon: Megaphone },
  { label: "PTM Scheduling", link: "/app/ptm", icon: CalendarClock },
  { label: "Polls & Surveys", link: "/app/polls", icon: Vote },
  { label: "Scholarships", link: "/app/scholarships", icon: Landmark },
  { label: "House Points", link: "/app/house-points", icon: Crown },
  { label: "Fundraising", link: "/app/fundraising", icon: Target },
  { label: "Sports", link: "/app/sports", icon: Swords },
  { label: "Careers", link: "/app/careers", icon: Compass },
  { label: "Suggestion Box", link: "/app/suggestions", icon: Lightbulb },
  { label: "Substitutes", link: "/app/substitutes", icon: UserCog },
  { label: "Staff Directory", link: "/app/staff", icon: UsersRound },
  { label: "Year-End Promotion", link: "/app/promotion", icon: ArrowUpFromLine },
  { label: "Reports", link: "/app/reports", icon: BarChart3 },
  { label: "Audit Log", link: "/app/audit", icon: ScrollText },
  { label: "Settings", link: "/app/settings", icon: Settings },
];

const RECENT_KEY = "lumina-search-recent";
const MAX_RECENT = 5;

function loadRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
function saveRecent(arr) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(arr.slice(0, MAX_RECENT)));
  } catch {
    /* ignore quota errors */
  }
}

export default function CommandPalette({ open, onClose, initialQuery = "" }) {
  const [q, setQ] = useState(initialQuery);
  const [debounced, setDebounced] = useState(initialQuery);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [recent, setRecent] = useState(() => loadRecent());
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // The palette respects the same permission stack the sidebar does:
  //   role default (NAV.roles)  →  admin-set hidden paths
  // Anything filtered out here is also unreachable from search results.
  const allowedPaths = useMemo(() => {
    const role = user?.role;
    const adminHidden = new Set(user?.permissions?.hiddenPaths || []);
    return new Set(
      NAV
        .filter((n) => n.roles === "*" || (role && n.roles.includes(role)))
        .filter((n) => !adminHidden.has(n.to))
        .map((n) => n.to)
    );
  }, [user?.role, user?.permissions?.hiddenPaths]);
  const visibleQuickNav = useMemo(
    () => QUICK_NAV.filter((n) => allowedPaths.has(n.link)),
    [allowedPaths]
  );

  // Reset state whenever the palette is opened
  useEffect(() => {
    if (open) {
      setQ(initialQuery);
      setDebounced(initialQuery);
      setActiveIdx(0);
      setResults(null);
      setRecent(loadRecent());
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, initialQuery]);

  // Debounce the query
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 180);
    return () => clearTimeout(t);
  }, [q]);

  // Fetch results when the debounced query changes
  useEffect(() => {
    if (!open) return;
    if (!debounced.trim()) {
      setResults(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    endpoints
      .search(debounced)
      .then((res) => {
        if (!cancelled) {
          setResults(res);
          setActiveIdx(0);
        }
      })
      .catch(() => {
        if (!cancelled) setResults({ q: debounced, total: 0, groups: [] });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, open]);

  // Flatten the current visible list into a single sequence for keyboard nav.
  // When q is empty we show recent + quick-nav; otherwise we show search hits.
  const flat = useMemo(() => {
    if (debounced.trim() && results) {
      return results.groups.flatMap((g) =>
        g.items.map((item) => ({ ...item, _group: g.category }))
      );
    }
    return [
      ...recent.map((r) => ({
        category: "Recent",
        label: r,
        sublabel: "Search again",
        link: null,
        icon: "Clock",
        _group: "Recent",
        _query: r,
      })),
      ...visibleQuickNav.map((n) => ({
        category: "Go to",
        label: n.label,
        sublabel: n.link,
        link: n.link,
        icon: "_quick",
        _quickIcon: n.icon,
        _group: "Go to",
      })),
    ];
  }, [debounced, results, recent, visibleQuickNav]);

  const pickItem = useCallback(
    (item) => {
      if (item?._query !== undefined) {
        // it's a recent-search entry — re-run that search
        setQ(item._query);
        return;
      }
      if (!item?.link) return;
      // Remember this query if it produced a hit
      if (debounced.trim()) {
        const next = [debounced, ...recent.filter((r) => r !== debounced)].slice(0, MAX_RECENT);
        setRecent(next);
        saveRecent(next);
      }
      onClose?.();
      navigate(item.link);
    },
    [debounced, recent, navigate, onClose]
  );

  // Keyboard handlers
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(flat.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = flat[activeIdx];
        if (item) pickItem(item);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, flat, activeIdx, pickItem, onClose]);

  // Scroll the active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const node = listRef.current.querySelector(`[data-idx="${activeIdx}"]`);
    if (node) node.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/55 p-4 pt-[10vh] backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a1c]/95 shadow-glow backdrop-blur-xl"
          >
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-brand-500/20 to-accent-pink/20 blur-3xl" />

            {/* Search input */}
            <div className="relative flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <Search size={16} className="text-white/55" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search students, teachers, documents, books, tickets…"
                className="flex-1 bg-transparent text-base outline-none placeholder:text-white/40"
              />
              {loading && (
                <span className="flex h-3 w-3 items-center justify-center">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-brand-400" />
                </span>
              )}
              <button
                onClick={onClose}
                className="rounded-md p-1 text-white/55 hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>

            {/* Results */}
            <div ref={listRef} className="relative max-h-[60vh] overflow-y-auto p-2">
              {debounced.trim() && results && results.total === 0 && !loading ? (
                <Empty q={debounced} />
              ) : debounced.trim() && results ? (
                <ResultsGroups
                  groups={results.groups}
                  activeIdx={activeIdx}
                  onPick={pickItem}
                  setActive={setActiveIdx}
                />
              ) : (
                <EmptyStateLists
                  recent={recent}
                  activeIdx={activeIdx}
                  onPick={pickItem}
                  setActive={setActiveIdx}
                  quickNav={visibleQuickNav}
                />
              )}
            </div>

            {/* Footer hint bar */}
            <div className="relative flex items-center justify-between border-t border-white/10 px-4 py-2 text-[10px] text-white/55">
              <div className="flex items-center gap-3">
                <Hint>
                  <ArrowUp size={9} /> <ArrowDown size={9} /> navigate
                </Hint>
                <Hint>
                  <CornerDownLeft size={9} /> open
                </Hint>
                <Hint>esc close</Hint>
              </div>
              <div className="inline-flex items-center gap-1">
                <SparklesIcon size={10} className="text-accent-gold" /> Lumina search
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function Hint({ children }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px]">
      {children}
    </span>
  );
}

function ResultsGroups({ groups, activeIdx, onPick, setActive }) {
  let counter = -1;
  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <div key={g.category}>
          <div className="px-2 pb-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/45">
            {g.category}
          </div>
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              counter += 1;
              const idx = counter;
              return (
                <ResultRow
                  key={it.category + "-" + it.id + "-" + idx}
                  item={it}
                  idx={idx}
                  active={idx === activeIdx}
                  onPick={onPick}
                  setActive={setActive}
                />
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function EmptyStateLists({ recent, activeIdx, onPick, setActive, quickNav }) {
  let counter = -1;
  return (
    <div className="space-y-3">
      {recent.length > 0 && (
        <div>
          <div className="px-2 pb-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/45">
            Recent searches
          </div>
          <ul className="space-y-0.5">
            {recent.map((r) => {
              counter += 1;
              const idx = counter;
              const item = {
                category: "Recent",
                label: r,
                sublabel: "Run this search again",
                link: null,
                icon: "Clock",
                _query: r,
              };
              return (
                <ResultRow
                  key={"recent-" + r}
                  item={item}
                  idx={idx}
                  active={idx === activeIdx}
                  onPick={onPick}
                  setActive={setActive}
                />
              );
            })}
          </ul>
        </div>
      )}
      <div>
        <div className="px-2 pb-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/45">
          Go to module
        </div>
        <ul className="grid grid-cols-2 gap-0.5">
          {quickNav.map((n) => {
            counter += 1;
            const idx = counter;
            const item = {
              category: "Go to",
              label: n.label,
              sublabel: n.link,
              link: n.link,
              icon: "_quick",
              _quickIcon: n.icon,
            };
            return (
              <ResultRow
                key={n.link}
                item={item}
                idx={idx}
                active={idx === activeIdx}
                onPick={onPick}
                setActive={setActive}
                compact
              />
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function ResultRow({ item, idx, active, onPick, setActive, compact }) {
  const Icon =
    item.icon === "_quick"
      ? item._quickIcon
      : item.icon === "Clock"
      ? Clock
      : ICON_MAP[item.icon] || Search;
  return (
    <li>
      <button
        data-idx={idx}
        onMouseEnter={() => setActive(idx)}
        onClick={() => onPick(item)}
        className={`group relative flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors ${
          active
            ? "bg-gradient-to-r from-brand-500/30 to-accent-violet/20 ring-1 ring-white/15"
            : "hover:bg-white/[0.04]"
        }`}
      >
        <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-white/5 ring-1 ring-white/10">
          {item.avatar ? (
            <span className="text-[10px] font-semibold">{item.avatar}</span>
          ) : (
            <Icon size={13} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className={`truncate text-[13px] ${active ? "text-white" : "text-white/85"}`}>
            {item.label}
          </div>
          {!compact && item.sublabel && (
            <div className="truncate text-[10px] text-white/45">
              {item.sublabel}
            </div>
          )}
        </div>
        {active && (
          <CornerDownLeft size={12} className="text-white/60" />
        )}
      </button>
    </li>
  );
}

function Empty({ q }) {
  return (
    <div className="px-6 py-12 text-center text-white/55">
      <Search size={20} className="mx-auto mb-2 text-white/40" />
      <div className="text-sm">No results for &ldquo;{q}&rdquo;</div>
      <div className="mt-1 text-[11px] text-white/40">
        Try a student ID, certificate number, book title, or ticket title
      </div>
    </div>
  );
}
