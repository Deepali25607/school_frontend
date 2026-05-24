import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCog,
  UserX,
  UserCheck,
  Wand2,
  Sparkles,
  Zap,
  BrainCircuit,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  BookOpen,
  History,
  CircleCheck,
  CircleAlert,
  AlertTriangle,
  Info,
  Loader,
  X,
  Check,
  Repeat,
  Filter,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function isoOffset(iso, days) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function fmtFullDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Substitutes() {
  const { user } = useAuth();
  const canAssign = ["admin", "principal", "hr"].includes(user?.role);
  const canAutoFill = ["admin", "principal"].includes(user?.role);

  const [date, setDate] = useState(todayISO());
  const [drawerGap, setDrawerGap] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const dayQ = useApi(() => endpoints.substitutes(date), [date]);
  const histQ = useApi(
    () =>
      showHistory
        ? endpoints.substitutesHistory({})
        : Promise.resolve({ items: [], summary: {} }),
    [showHistory]
  );

  useRealtime("substitutes.changed", () => {
    dayQ.refetch();
    if (showHistory) histQ.refetch();
  });
  useRealtime("leave.changed", () => dayQ.refetch());

  const snap = dayQ.data;

  const assign = async (gap, sub) => {
    setBusy(true);
    setError(null);
    try {
      await endpoints.substituteAssign({
        date,
        period: gap.period,
        classGrade: gap.classGrade,
        classSection: gap.classSection,
        subject: gap.subject,
        originalTeacherId: gap.originalTeacherId,
        substituteTeacherId: sub.teacherId,
      });
      setToast({
        kind: "ok",
        title: `${sub.name} assigned`,
        body: `Grade ${gap.classGrade}-${gap.classSection} · ${gap.subject} · period ${gap.period}`,
      });
      setDrawerGap(null);
      dayQ.refetch();
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (gap) => {
    if (!gap.assignment) return;
    setBusy(true);
    setError(null);
    try {
      await endpoints.substituteCancel(gap.assignment.id);
      setToast({
        kind: "ok",
        title: "Assignment cancelled",
        body: `Grade ${gap.classGrade}-${gap.classSection} · period ${gap.period}`,
      });
      dayQ.refetch();
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  const autoFill = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await endpoints.substituteAutoFill(date);
      setToast({
        kind: r.created.length ? "ok" : "warn",
        title: `${r.created.length} gap${r.created.length === 1 ? "" : "s"} filled automatically`,
        body: r.skipped.length
          ? `${r.skipped.length} skipped — open the drawer to assign manually.`
          : "All gaps cleared.",
      });
      dayQ.refetch();
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operations · Daily"
        title="Substitute Assignment"
        subtitle="Cover for teachers on leave. Suggestions are scored by subject match, current load, and availability."
      />

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          <CircleAlert size={18} className="mt-0.5 shrink-0" />
          <div className="flex-1">{error}</div>
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <DateStrip
        date={date}
        setDate={setDate}
        snap={snap}
        loading={dayQ.loading}
        canAutoFill={canAutoFill}
        onAutoFill={autoFill}
        busy={busy}
        showHistory={showHistory}
        setShowHistory={setShowHistory}
      />

      {dayQ.error && <ErrorState error={dayQ.error} onRetry={dayQ.refetch} />}

      {!snap?.dayIsSchoolDay && !dayQ.loading && snap && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/55">
          <Calendar size={32} className="mx-auto mb-2 text-white/40" />
          <div className="font-display text-xl">School holiday</div>
          <div className="mt-1 text-sm">
            {fmtFullDate(date)} — no scheduled periods.
          </div>
        </div>
      )}

      {snap?.dayIsSchoolDay && (
        <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <GapsBoard
              snap={snap}
              loading={dayQ.loading}
              canAssign={canAssign}
              onOpenGap={(g) => setDrawerGap(g)}
              onCancelAssignment={cancel}
              busy={busy}
            />
          </div>
          <div className="space-y-5">
            <TeachersOnLeavePanel snap={snap} loading={dayQ.loading} />
            <ShortcutsCard date={date} />
          </div>
        </div>
      )}

      <AnimatePresence>
        {showHistory && (
          <HistoryPanel
            data={histQ.data}
            loading={histQ.loading}
            onClose={() => setShowHistory(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {drawerGap && (
          <SuggestDrawer
            gap={drawerGap}
            canAssign={canAssign}
            busy={busy}
            onAssign={(sub) => assign(drawerGap, sub)}
            onClose={() => setDrawerGap(null)}
          />
        )}
        {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ---------- date strip + summary tiles ----------

function DateStrip({
  date,
  setDate,
  snap,
  loading,
  canAutoFill,
  onAutoFill,
  busy,
  showHistory,
  setShowHistory,
}) {
  const open = snap?.summary?.open ?? 0;
  const filled = snap?.summary?.filled ?? 0;
  const total = snap?.summary?.totalGaps ?? 0;
  const fillPct = total === 0 ? 0 : Math.round((filled / total) * 100);

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-full bg-white/5 p-1 ring-1 ring-white/10">
          <button
            type="button"
            onClick={() => setDate(isoOffset(date, -1))}
            className="rounded-full p-1.5 text-white/65 hover:bg-white/10 hover:text-white"
            title="Previous day"
          >
            <ChevronLeft size={16} />
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border-0 bg-transparent px-2 py-1 text-sm text-white outline-none [color-scheme:dark]"
          />
          <button
            type="button"
            onClick={() => setDate(isoOffset(date, 1))}
            className="rounded-full p-1.5 text-white/65 hover:bg-white/10 hover:text-white"
            title="Next day"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setDate(todayISO())}
          className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-white/75 ring-1 ring-white/10 hover:bg-white/10"
        >
          Today
        </button>
        <div className="text-sm text-white/65">
          {fmtFullDate(date)}{" "}
          {snap && (
            <span className="text-white/40">· {snap.day || "Holiday"}</span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${
              showHistory
                ? "bg-purple-500/20 text-purple-100 ring-1 ring-purple-400/40"
                : "bg-white/5 text-white/75 ring-1 ring-white/10 hover:bg-white/10"
            }`}
          >
            <History size={14} /> History
          </button>
          {canAutoFill && (
            <button
              type="button"
              disabled={busy || open === 0 || loading}
              onClick={onAutoFill}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-accent-violet to-brand-500 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-accent-violet/20 disabled:opacity-50"
            >
              <Wand2 size={14} />
              Auto-fill {open > 0 && `(${open})`}
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile
          icon={UserX}
          tone="text-rose-300"
          label="Teachers on leave"
          value={snap?.summary?.teachersOnLeave ?? (loading ? "…" : 0)}
        />
        <Tile
          icon={AlertTriangle}
          tone="text-amber-300"
          label="Open gaps"
          value={open}
        />
        <Tile
          icon={CircleCheck}
          tone="text-emerald-300"
          label="Filled"
          value={filled}
        />
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/50">
            <Zap size={12} className="text-brand-300" />
            Coverage
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-brand-300 tabular-nums">
              {fillPct}%
            </span>
            <span className="text-xs text-white/45">
              {filled}/{total}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${fillPct}%` }}
              transition={{ duration: 0.6 }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-brand-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Tile({ icon: Icon, tone, label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/50">
        <Icon size={12} className={tone} /> {label}
      </div>
      <div className={`mt-2 text-2xl font-semibold ${tone}`}>{value}</div>
    </div>
  );
}

// ---------- gaps board ----------

function GapsBoard({ snap, loading, canAssign, onOpenGap, onCancelAssignment, busy }) {
  if (loading || !snap) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }
  if (snap.summary.totalGaps === 0) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] p-8 text-center">
        <CircleCheck size={36} className="mx-auto text-emerald-300" />
        <div className="mt-3 font-display text-xl text-emerald-100">
          All clear — no gaps to fill
        </div>
        <div className="mt-1 text-sm text-emerald-100/70">
          No teachers on leave for this day, or they have no scheduled periods.
        </div>
      </div>
    );
  }

  // Group gaps by period for a clean visual flow.
  const byPeriod = new Map();
  for (const g of snap.gaps) {
    const arr = byPeriod.get(g.period) || [];
    arr.push(g);
    byPeriod.set(g.period, arr);
  }
  const periods = Array.from(byPeriod.keys()).sort((a, b) => a - b);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-3 flex items-center gap-2">
        <UserCog size={18} className="text-accent-violet" />
        <h3 className="font-display text-xl font-semibold">Coverage board</h3>
        <span className="ml-auto text-xs text-white/45">
          Grouped by period
        </span>
      </div>

      <div className="space-y-4">
        {periods.map((p) => {
          const slot = byPeriod.get(p);
          const sample = slot[0];
          return (
            <div key={p}>
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-white/50">
                <Clock size={12} />
                Period {p}
                <span className="text-white/35">
                  {sample.start}–{sample.end}
                </span>
                <span className="text-white/35">· {slot.length} gap{slot.length === 1 ? "" : "s"}</span>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {slot.map((g) => (
                  <GapCard
                    key={g.key}
                    gap={g}
                    canAssign={canAssign}
                    onOpen={() => onOpenGap(g)}
                    onCancel={() => onCancelAssignment(g)}
                    busy={busy}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GapCard({ gap, canAssign, onOpen, onCancel, busy }) {
  const filled = !!gap.assignment;
  return (
    <motion.div
      layout
      className={`rounded-xl border p-3 transition ${
        filled
          ? "border-emerald-500/30 bg-emerald-500/[0.05]"
          : "border-amber-400/30 bg-amber-500/[0.05]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-xs font-semibold text-white">
            G{gap.classGrade}-{gap.classSection}
          </span>
          <span className="text-sm font-medium text-white">{gap.subject}</span>
        </div>
        <span className="flex items-center gap-1 text-xs text-white/45">
          <MapPin size={11} /> {gap.room}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-white/55">
        <UserX size={12} className="text-rose-300" />
        <span className="line-through">{gap.originalTeacherName}</span>
        <span className="rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-rose-200 ring-1 ring-rose-400/30">
          {gap.leaveType}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        {filled ? (
          <div className="flex min-w-0 items-center gap-2">
            <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400/30 to-teal-500/20 text-[10px] font-bold text-emerald-200">
              {gap.assignment.substituteAvatar || "??"}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-emerald-100">
                {gap.assignment.substituteTeacherName}
              </div>
              <div className="truncate text-[10px] text-white/45">
                by {gap.assignment.assignedBy} · {fmtDateTime(gap.assignment.assignedAt)}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-amber-100/85">
            <span className="font-medium">Awaiting assignment</span>
            {gap.suggestions.length > 0 && (
              <span className="text-white/45"> · {gap.suggestions.length} candidates</span>
            )}
          </div>
        )}
        <div className="flex shrink-0 items-center gap-1">
          {filled && canAssign && (
            <button
              type="button"
              disabled={busy}
              onClick={onCancel}
              className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 hover:bg-white/10"
              title="Cancel this assignment"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={onOpen}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ${
              filled
                ? "bg-white/5 text-white/75 ring-1 ring-white/10 hover:bg-white/10"
                : "bg-gradient-to-r from-brand-500 to-accent-violet text-white shadow shadow-brand-500/20"
            }`}
          >
            {filled ? <Repeat size={12} /> : <Sparkles size={12} />}
            {filled ? "Reassign" : "Pick sub"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ---------- right side: teachers on leave + tips ----------

function TeachersOnLeavePanel({ snap, loading }) {
  if (loading || !snap) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-rose-400/20 bg-rose-500/[0.04] p-5">
      <div className="chip">
        <UserX size={14} className="text-rose-300" />
        Teachers on leave
      </div>
      <div className="mt-3 space-y-2">
        {snap.teachersOnLeave.length === 0 ? (
          <div className="text-sm text-white/55">
            Nobody is on approved leave for this day.
          </div>
        ) : (
          snap.teachersOnLeave.map((t) => (
            <div
              key={t.teacherId}
              className="flex items-center gap-3 rounded-xl bg-black/20 p-2.5"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose-500/30 to-pink-500/20 text-xs font-bold text-rose-100">
                {t.avatar || "??"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white">
                  {t.name}
                </div>
                <div className="truncate text-xs text-white/50">
                  {t.subject || "—"} · {t.leaveType} leave · until {t.toDate}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ShortcutsCard({ date }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="chip">
        <BrainCircuit size={14} className="text-brand-300" />
        How scoring works
      </div>
      <ul className="mt-3 space-y-1.5 text-xs text-white/65">
        <li className="flex items-start gap-2">
          <Check size={12} className="mt-0.5 shrink-0 text-emerald-300" />
          <span>
            <strong>+30</strong> if the candidate teaches the same subject
          </span>
        </li>
        <li className="flex items-start gap-2">
          <Check size={12} className="mt-0.5 shrink-0 text-emerald-300" />
          <span>
            <strong>+12</strong> for a cognate subject (e.g. Physics ↔ Chemistry)
          </span>
        </li>
        <li className="flex items-start gap-2">
          <Check size={12} className="mt-0.5 shrink-0 text-emerald-300" />
          <span>
            <strong>−8</strong> per substitution already taken that day
          </span>
        </li>
        <li className="flex items-start gap-2">
          <Check size={12} className="mt-0.5 shrink-0 text-emerald-300" />
          <span>
            Small bias toward more experienced teachers as a tiebreaker
          </span>
        </li>
      </ul>
      <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-2.5 text-[11px] text-white/50">
        Teachers with a clashing class at that period are excluded outright.
      </div>
    </div>
  );
}

// ---------- suggestion drawer ----------

function SuggestDrawer({ gap, canAssign, busy, onAssign, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        exit={{ x: 400 }}
        transition={{ type: "spring", damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#0d0f24] p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="chip">
              <Sparkles size={14} className="text-accent-gold" />
              Suggested substitutes
            </div>
            <h2 className="mt-2 font-display text-xl font-semibold">
              Grade {gap.classGrade}-{gap.classSection} · Period {gap.period}
            </h2>
            <div className="mt-1 text-sm text-white/55">
              {gap.subject} · {gap.start}–{gap.end} · {gap.room}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-white/55 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-xs text-white/65">
          <div className="flex items-center gap-2">
            <UserX size={12} className="text-rose-300" />
            <span className="line-through">{gap.originalTeacherName}</span>
            <span className="rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-rose-200">
              {gap.leaveType} leave
            </span>
          </div>
        </div>

        {gap.assignment && (
          <div className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
            <div className="flex items-center gap-2">
              <CircleCheck size={14} />
              Currently assigned: <strong>{gap.assignment.substituteTeacherName}</strong>
            </div>
            <div className="mt-1 text-xs text-emerald-100/70">
              Picking another candidate below will replace this assignment.
            </div>
          </div>
        )}

        <div className="mt-4 space-y-2">
          {gap.suggestions.length === 0 ? (
            <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-100">
              No eligible substitutes — every other teacher either has a clash,
              is on leave, or is already over-booked.
            </div>
          ) : (
            gap.suggestions.map((s, i) => (
              <div
                key={s.teacherId}
                className={`rounded-xl border p-3 ${
                  i === 0
                    ? "border-brand-400/40 bg-gradient-to-br from-brand-500/15 via-white/[0.03] to-transparent ring-1 ring-brand-400/30"
                    : "border-white/10 bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500/30 to-accent-violet/20 text-xs font-bold text-brand-100">
                    {s.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-white">
                        {s.name}
                      </span>
                      {i === 0 && (
                        <span className="rounded-full bg-accent-gold/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200 ring-1 ring-accent-gold/40">
                          Top pick
                        </span>
                      )}
                    </div>
                    <div className="truncate text-xs text-white/55">
                      <BookOpen size={10} className="mr-1 inline" />
                      {s.subject} · {s.experience}y exp · ★ {s.rating}
                    </div>
                    <div className="mt-1 text-[11px] text-white/45">
                      {s.reason}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <div className="font-mono text-lg font-semibold text-brand-200 tabular-nums">
                        {s.score}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-white/40">
                        score
                      </div>
                    </div>
                    {canAssign && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onAssign(s)}
                        className="flex items-center gap-1 rounded-md bg-gradient-to-r from-emerald-500 to-teal-500 px-2.5 py-1 text-xs font-semibold text-white shadow shadow-emerald-500/20 disabled:opacity-50"
                      >
                        {busy ? (
                          <Loader size={11} className="animate-spin" />
                        ) : (
                          <UserCheck size={11} />
                        )}
                        Assign
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------- history overlay panel ----------

function HistoryPanel({ data, loading, onClose }) {
  const items = data?.items || [];
  const grouped = useMemo(() => {
    const m = new Map();
    for (const it of items) {
      const arr = m.get(it.date) || [];
      arr.push(it);
      m.set(it.date, arr);
    }
    return Array.from(m.entries()).slice(0, 20);
  }, [items]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-2xl border border-purple-400/20 bg-purple-500/[0.04] p-5"
    >
      <div className="mb-3 flex items-center gap-2">
        <History size={16} className="text-purple-300" />
        <h3 className="font-display text-xl font-semibold">
          Recent substitutions
        </h3>
        <span className="ml-auto text-xs text-white/45">
          {items.length} record{items.length === 1 ? "" : "s"}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1.5 text-white/55 hover:bg-white/10 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : items.length === 0 ? (
        <div className="text-sm text-white/55">
          No substitutions on record yet — they'll appear here after you fill
          your first gap.
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(([date, list]) => (
            <div key={date}>
              <div className="mb-1 text-xs uppercase tracking-wider text-white/45">
                {fmtFullDate(date)}
              </div>
              <div className="space-y-1.5">
                {list.map((s) => (
                  <div
                    key={s.id}
                    className={`flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2 text-xs ${
                      s.status === "confirmed"
                        ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                        : "border-white/10 bg-white/[0.02] opacity-70 line-through"
                    }`}
                  >
                    <span className="font-mono text-white/45">{s.id}</span>
                    <span className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono font-semibold text-white">
                      G{s.classGrade}-{s.classSection}
                    </span>
                    <span className="text-white/75">
                      P{s.period} · {s.subject || "—"}
                    </span>
                    <span className="flex items-center gap-1 text-white/55">
                      <UserX size={11} className="text-rose-300" />
                      {s.originalTeacherName}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-200">
                      <UserCheck size={11} />
                      {s.substituteTeacherName}
                    </span>
                    {s.note && (
                      <span className="text-white/45">"{s.note}"</span>
                    )}
                    <span className="ml-auto text-white/40">
                      {fmtDateTime(s.assignedAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ---------- toast ----------

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, [onDismiss]);
  const tone =
    toast.kind === "ok"
      ? "border-emerald-400/40 from-emerald-600/30 to-teal-500/10 text-emerald-100"
      : "border-amber-400/40 from-amber-600/30 to-orange-500/10 text-amber-100";
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.95 }}
      className={`fixed inset-x-0 bottom-6 z-50 mx-auto flex max-w-md items-start gap-3 rounded-2xl border bg-gradient-to-br p-4 shadow-2xl backdrop-blur-xl ${tone}`}
    >
      {toast.kind === "ok" ? (
        <CircleCheck size={20} className="mt-0.5" />
      ) : (
        <Info size={20} className="mt-0.5" />
      )}
      <div className="flex-1">
        <div className="font-display text-base font-semibold">{toast.title}</div>
        <div className="text-sm opacity-85">{toast.body}</div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-full p-1 hover:bg-white/10"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
