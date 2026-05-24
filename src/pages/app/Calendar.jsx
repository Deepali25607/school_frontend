import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Sparkles as SparklesIcon,
  Sun,
  Trophy,
  PartyPopper,
  ClipboardCheck,
  ArrowRight,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const TYPE_TONES = {
  Holiday: "bg-rose-500/20 text-rose-200 ring-rose-400/30",
  Event: "bg-accent-violet/20 text-purple-200 ring-accent-violet/30",
  Exam: "bg-accent-gold/25 text-amber-200 ring-accent-gold/40",
  Leave: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
};

const TYPE_BG = {
  Holiday: "bg-rose-500",
  Event: "bg-accent-violet",
  Exam: "bg-accent-gold",
  Leave: "bg-amber-400",
};

const TYPE_ICONS = {
  Holiday: Sun,
  Event: PartyPopper,
  Exam: Trophy,
  Leave: ClipboardCheck,
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function ymd(date) {
  return date.toISOString().slice(0, 10);
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

// Generate the 6×7 grid of day cells for a given month — leading days from
// the previous month + trailing days from the next.
function buildMonthGrid(anchor) {
  const first = startOfMonth(anchor);
  // Make Monday the first column. JS: Sun=0..Sat=6 → shift so Mon=0..Sun=6.
  const firstWeekday = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - firstWeekday);
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }
  return cells;
}

export default function Calendar() {
  const [anchor, setAnchor] = useState(() => new Date());
  const [activeTypes, setActiveTypes] = useState(
    new Set(["Holiday", "Event", "Exam", "Leave"])
  );
  const [selectedDay, setSelectedDay] = useState(null);

  // Fetch a wide window so adjacent months also render — single call for the
  // 6-row grid plus a little buffer.
  const rangeFrom = useMemo(() => {
    const d = startOfMonth(anchor);
    d.setDate(d.getDate() - 14);
    return ymd(d);
  }, [anchor]);
  const rangeTo = useMemo(() => {
    const d = endOfMonth(anchor);
    d.setDate(d.getDate() + 14);
    return ymd(d);
  }, [anchor]);

  const { data, loading, error, refetch } = useApi(
    () => endpoints.calendar({ from: rangeFrom, to: rangeTo }),
    [rangeFrom, rangeTo]
  );

  useRealtime(
    ["events.changed", "leave.changed", "marks.changed"],
    () => refetch()
  );

  const entries = data?.entries || [];
  const summary = data?.summary;

  // Group entries by date for fast cell lookup
  const byDate = useMemo(() => {
    const map = new Map();
    for (const e of entries) {
      if (!activeTypes.has(e.type)) continue;
      const arr = map.get(e.date) || [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return map;
  }, [entries, activeTypes]);

  const cells = useMemo(() => buildMonthGrid(anchor), [anchor]);
  const today = ymd(new Date());
  const currentMonth = anchor.getMonth();

  const toggleType = (t) => {
    setActiveTypes((cur) => {
      const next = new Set(cur);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Academic"
        title="Calendar"
        subtitle={
          data
            ? `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()} · ${entries.length} entries in window`
            : "Loading…"
        }
      />

      {error && <ErrorState error={error} onRetry={refetch} />}

      {/* Upcoming highlights */}
      {summary && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <UpcomingTile label="Next holiday" entry={summary.nextHoliday} icon={Sun} tone="from-rose-500/20" />
          <UpcomingTile label="Next event" entry={summary.nextEvent} icon={PartyPopper} tone="from-accent-violet/20" />
          <UpcomingTile label="Next exam" entry={summary.nextExam} icon={Trophy} tone="from-accent-gold/20" />
        </div>
      )}

      {/* Month nav + filters */}
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAnchor((a) => addMonths(a, -1))}
            className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10"
            aria-label="Previous month"
          >
            <ChevronLeft size={14} />
          </button>
          <div className="font-display text-xl font-bold">
            {MONTHS[anchor.getMonth()]} {anchor.getFullYear()}
          </div>
          <button
            onClick={() => setAnchor((a) => addMonths(a, 1))}
            className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10"
            aria-label="Next month"
          >
            <ChevronRight size={14} />
          </button>
          <button
            onClick={() => setAnchor(new Date())}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
          >
            Today
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-white/55" />
          {["Holiday", "Event", "Exam", "Leave"].map((t) => {
            const Icon = TYPE_ICONS[t];
            const active = activeTypes.has(t);
            const count = entries.filter((e) => e.type === t).length;
            return (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ring-1 transition-all ${
                  active
                    ? TYPE_TONES[t]
                    : "bg-white/5 text-white/45 ring-white/10 hover:bg-white/10"
                }`}
              >
                <Icon size={11} /> {t} <span className="text-[10px] opacity-70">· {count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Month grid */}
      {loading && !data ? (
        <Skeleton className="h-[520px]" />
      ) : (
        <div className="card overflow-hidden p-0">
          {/* Day-of-week header */}
          <div className="grid grid-cols-7 border-b border-white/10 bg-white/[0.04]">
            {WEEKDAYS.map((w) => (
              <div key={w} className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((cell, i) => {
              const cellKey = ymd(cell);
              const dayEntries = byDate.get(cellKey) || [];
              const isCurrentMonth = cell.getMonth() === currentMonth;
              const isToday = cellKey === today;
              const isWeekend = cell.getDay() === 0 || cell.getDay() === 6;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay({ date: cell, entries: dayEntries })}
                  className={`group relative min-h-[100px] border-b border-r border-white/5 p-1.5 text-left transition-colors hover:bg-white/[0.04] ${
                    !isCurrentMonth ? "bg-white/[0.01]" : ""
                  } ${isWeekend && isCurrentMonth ? "bg-rose-500/[0.02]" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full text-[10px] font-bold ${
                        isToday
                          ? "bg-gradient-to-br from-brand-500 to-accent-violet text-white ring-2 ring-white/20"
                          : isCurrentMonth
                          ? isWeekend
                            ? "text-rose-300/80"
                            : "text-white/85"
                          : "text-white/30"
                      }`}
                    >
                      {cell.getDate()}
                    </span>
                    {dayEntries.length > 3 && (
                      <span className="text-[9px] text-white/45">+{dayEntries.length - 3}</span>
                    )}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {dayEntries.slice(0, 3).map((e, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-1 truncate rounded px-1 py-0.5 text-[9px] font-medium ring-1 ${TYPE_TONES[e.type]}`}
                        title={e.title}
                      >
                        <span className={`h-1 w-1 flex-shrink-0 rounded-full ${TYPE_BG[e.type]}`} />
                        <span className="truncate">{e.title}</span>
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Day detail panel */}
      <AnimatePresence>
        {selectedDay && (
          <DayPanel
            date={selectedDay.date}
            entries={selectedDay.entries}
            onClose={() => setSelectedDay(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function UpcomingTile({ label, entry, icon: Icon, tone }) {
  return (
    <div className="card relative overflow-hidden">
      <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${tone} to-transparent blur-2xl`} />
      <div className="relative">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/55">
          <Icon size={12} /> {label}
        </div>
        {entry ? (
          <>
            <div className="mt-2 font-display text-base font-semibold leading-tight">
              {entry.title}
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-white/55">
              <span>
                {new Date(entry.date).toLocaleDateString(undefined, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </span>
              {entry.link && (
                <Link to={entry.link} className="ml-auto inline-flex items-center gap-0.5 text-brand-300 hover:text-brand-200">
                  Open <ArrowRight size={11} />
                </Link>
              )}
            </div>
            {entry.sublabel && (
              <div className="mt-1 text-[10px] text-white/45">{entry.sublabel}</div>
            )}
          </>
        ) : (
          <div className="mt-2 text-xs text-white/45">None upcoming in this window</div>
        )}
      </div>
    </div>
  );
}

function DayPanel({ date, entries, onClose }) {
  const niceDate = date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-end bg-black/55 p-0 backdrop-blur md:items-stretch md:p-4"
    >
      <motion.div
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="relative h-[70vh] w-full overflow-hidden rounded-t-3xl border border-white/10 bg-gradient-to-br from-[#0a0a1e] via-[#0d0d2a] to-[#101044] md:h-full md:max-w-md md:rounded-3xl"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-brand-500/25 to-accent-pink/25 blur-3xl" />
        <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white">
          <X size={18} />
        </button>

        <div className="relative h-full overflow-y-auto p-6">
          <div className="chip mb-2">
            <CalendarDays size={12} className="text-accent-gold" />
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight">
            {niceDate}
          </h2>

          {entries.length === 0 ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-6 text-center text-white/55">
              <SparklesIcon className="mx-auto mb-2 text-accent-gold" size={20} />
              Nothing scheduled — clear day.
            </div>
          ) : (
            <ul className="mt-5 space-y-2">
              {entries.map((e, i) => {
                const Icon = TYPE_ICONS[e.type];
                return (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <div className={`rounded-xl border border-white/5 bg-white/[0.03] p-3 ${e.link ? "transition-all hover:border-white/15 hover:bg-white/[0.06]" : ""}`}>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ring-1 ${TYPE_TONES[e.type]}`}>
                          <Icon size={13} />
                        </span>
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ${TYPE_TONES[e.type]}`}>
                          {e.type}
                        </span>
                        {e.link && (
                          <Link
                            to={e.link}
                            className="ml-auto inline-flex items-center gap-0.5 text-[10px] text-brand-300 hover:text-brand-200"
                          >
                            Open <ArrowRight size={10} />
                          </Link>
                        )}
                      </div>
                      <div className="mt-2 font-display text-sm font-semibold leading-snug">
                        {e.title}
                      </div>
                      {e.sublabel && (
                        <div className="mt-0.5 text-[11px] text-white/55">
                          {e.sublabel}
                        </div>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
