import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  MoveRight,
  ChevronsRight,
  Sparkles,
  Wand,
  UserCheck,
  UserX,
  ShieldCheck,
  AlertTriangle,
  History,
  Undo2,
  Cake,
  Info,
  CircleCheck,
  CircleAlert,
  Users,
  Loader,
  TrendingUp,
  CalendarCheck,
  X,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const STREAMS = ["Science", "Commerce", "Arts", "General"];

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Promotion() {
  const { user } = useAuth();
  const canRun = ["admin", "principal"].includes(user?.role);

  const thisYear = new Date().getFullYear();
  const [graduatingYear, setGraduatingYear] = useState(thisYear);
  const [holdBackIds, setHoldBackIds] = useState([]);
  const [gradStreams, setGradStreams] = useState({});
  const [note, setNote] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [committed, setCommitted] = useState(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState(null);
  const [rollbackTarget, setRollbackTarget] = useState(null);

  const cyclesQ = useApi(() => endpoints.promotion(), []);
  const previewQ = useApi(
    () =>
      endpoints.promotionPreview({ holdBackIds, graduatingYear }),
    [holdBackIds.join(","), graduatingYear]
  );

  useRealtime("promotion.changed", () => {
    cyclesQ.refetch();
    previewQ.refetch();
  });
  useRealtime("students.changed", () => previewQ.refetch());

  const preview = previewQ.data;
  const cycles = cyclesQ.data?.cycles || [];
  const summary = cyclesQ.data?.summary || {};

  const toggleHold = (id) => {
    setHoldBackIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    );
  };

  const setStreamFor = (id, stream) => {
    setGradStreams((cur) => ({ ...cur, [id]: stream }));
  };

  const onCommit = async () => {
    setWorking(true);
    setError(null);
    try {
      const cycle = await endpoints.promotionCommit({
        holdBackIds,
        graduatingYear,
        gradStreams,
        note,
      });
      setCommitted(cycle);
      setConfirmOpen(false);
      setHoldBackIds([]);
      setGradStreams({});
      setNote("");
      cyclesQ.refetch();
      previewQ.refetch();
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setWorking(false);
    }
  };

  const onRollback = async (id) => {
    setWorking(true);
    setError(null);
    try {
      await endpoints.promotionRollback(id);
      setRollbackTarget(null);
      cyclesQ.refetch();
      previewQ.refetch();
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setWorking(false);
    }
  };

  if (!canRun) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Operations"
          title="Year-End Promotion"
          subtitle="Restricted to admin and principal."
        />
        <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-6 text-amber-200">
          You don't have permission to run class promotion.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operations · Annual"
        title="Year-End Class Promotion"
        subtitle={
          summary?.lastCycle
            ? `Last cycle: ${summary.lastCycle.targetAcademicYear} · ${summary.lastCycle.promoted} promoted · ${summary.lastCycle.graduated} graduated`
            : "Bulk-promote the active roster up one grade. Grade 12 students graduate into the Alumni directory."
        }
      />

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          <CircleAlert size={18} className="mt-0.5 shrink-0" />
          <div className="flex-1">{error}</div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-200/70 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <SummaryStrip summary={summary} preview={preview} graduatingYear={graduatingYear} />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <FlowDiagram preview={preview} loading={previewQ.loading} />
          <GraduatingCohort
            preview={preview}
            gradStreams={gradStreams}
            setStreamFor={setStreamFor}
            holdBackIds={holdBackIds}
            toggleHold={toggleHold}
          />
        </div>
        <div className="space-y-5">
          <CommitPanel
            preview={preview}
            graduatingYear={graduatingYear}
            setGraduatingYear={setGraduatingYear}
            note={note}
            setNote={setNote}
            holdBackIds={holdBackIds}
            setConfirmOpen={setConfirmOpen}
          />
          <AtRiskPanel
            preview={preview}
            holdBackIds={holdBackIds}
            toggleHold={toggleHold}
          />
        </div>
      </div>

      <HeldBackPanel
        preview={preview}
        holdBackIds={holdBackIds}
        toggleHold={toggleHold}
      />

      <CyclesHistory
        cycles={cycles}
        loading={cyclesQ.loading}
        onRollback={(c) => setRollbackTarget(c)}
      />

      <AnimatePresence>
        {confirmOpen && (
          <ConfirmModal
            preview={preview}
            graduatingYear={graduatingYear}
            note={note}
            working={working}
            onCancel={() => setConfirmOpen(false)}
            onConfirm={onCommit}
          />
        )}
        {rollbackTarget && (
          <RollbackModal
            cycle={rollbackTarget}
            working={working}
            onCancel={() => setRollbackTarget(null)}
            onConfirm={() => onRollback(rollbackTarget.id)}
          />
        )}
        {committed && (
          <CommittedToast
            cycle={committed}
            onDismiss={() => setCommitted(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- summary tiles ----------

function SummaryStrip({ summary, preview, graduatingYear }) {
  const tiles = [
    {
      icon: Users,
      label: "Active roster",
      value: preview?.totals.total ?? "—",
      tone: "text-brand-300",
    },
    {
      icon: MoveRight,
      label: "Would promote",
      value: preview?.totals.promoted ?? "—",
      tone: "text-emerald-300",
    },
    {
      icon: GraduationCap,
      label: `Would graduate (${graduatingYear})`,
      value: preview?.totals.graduated ?? "—",
      tone: "text-amber-300",
    },
    {
      icon: UserX,
      label: "Marked hold-back",
      value: preview?.totals.heldBack ?? 0,
      tone: "text-rose-300",
    },
    {
      icon: History,
      label: "Cycles run",
      value: summary?.cyclesCommitted ?? 0,
      tone: "text-purple-300",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="rounded-2xl border border-white/10 bg-white/5 p-4"
        >
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/50">
            <t.icon size={14} className={t.tone} />
            {t.label}
          </div>
          <div className={`mt-2 text-2xl font-semibold ${t.tone}`}>
            {t.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- flow diagram ----------

function FlowDiagram({ preview, loading }) {
  if (loading || !preview) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  const rows = preview.perGrade;
  const maxCount = Math.max(1, ...rows.map((r) => r.count));

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="chip">
            <Wand size={14} className="text-accent-violet" />
            Promotion flow · {preview.targetAcademicYear}
          </div>
          <h3 className="mt-2 font-display text-xl font-semibold">
            Per-grade movement
          </h3>
        </div>
        <div className="text-right text-xs uppercase tracking-wider text-white/45">
          From → To
        </div>
      </div>

      <div className="space-y-1.5">
        {rows.map((row) => {
          const grad = row.toGrade === "Alumni";
          const empty = row.count === 0;
          return (
            <div
              key={row.fromGrade}
              className={`grid grid-cols-[80px_minmax(0,1fr)_64px_minmax(0,1fr)_72px] items-center gap-3 rounded-xl px-3 py-2.5 ${
                empty
                  ? "opacity-40"
                  : grad
                  ? "bg-gradient-to-r from-amber-500/15 to-transparent ring-1 ring-amber-400/30"
                  : "bg-white/5 hover:bg-white/[0.07]"
              }`}
            >
              <div className="text-sm font-semibold text-white/80">
                Grade {row.fromGrade}
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(row.count / maxCount) * 100}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    grad
                      ? "bg-gradient-to-r from-amber-400 to-orange-500"
                      : "bg-gradient-to-r from-brand-500 to-accent-violet"
                  }`}
                />
              </div>
              <div className="flex items-center justify-center">
                {grad ? (
                  <Cake size={18} className="text-amber-300" />
                ) : (
                  <ChevronsRight size={18} className="text-white/40" />
                )}
              </div>
              <div className="text-sm font-medium text-white/75">
                {grad ? (
                  <span className="text-amber-200">
                    → Alumni · Class of {preview.targetAcademicYear.split("-")[0]}
                  </span>
                ) : (
                  <>→ Grade {row.toGrade}</>
                )}
              </div>
              <div className="text-right text-sm tabular-nums font-semibold text-white">
                {row.count}
                <span className="ml-1 text-xs text-white/45">students</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- graduating cohort ----------

function GraduatingCohort({ preview, gradStreams, setStreamFor, holdBackIds, toggleHold }) {
  const list = preview?.graduating || [];
  if (list.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="chip">
          <GraduationCap size={14} className="text-amber-300" />
          Graduating cohort
        </div>
        <div className="mt-3 text-sm text-white/55">
          No students currently in Grade 12.
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="chip">
            <GraduationCap size={14} className="text-amber-300" />
            Graduating cohort
          </div>
          <h3 className="mt-2 font-display text-xl font-semibold">
            {list.length} alumni-to-be
          </h3>
        </div>
        <div className="text-xs text-white/45">
          Pick a stream for each grad — used to seed the alumni record.
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {list.map((s) => {
          const heldBack = holdBackIds.includes(s.id);
          const stream = gradStreams[s.id] || s.defaultStream;
          return (
            <div
              key={s.id}
              className={`flex items-center gap-3 rounded-xl border border-white/10 bg-gradient-to-r from-white/[0.04] to-transparent p-3 ${
                heldBack ? "opacity-40 line-through" : ""
              }`}
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber-400/30 to-orange-500/20 text-xs font-bold text-amber-200">
                {s.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white">
                  {s.name}
                </div>
                <div className="text-xs text-white/55">
                  {s.id} · {s.section} · {s.house} · GPA {s.gpa}
                </div>
              </div>
              <select
                value={stream}
                onChange={(e) => setStreamFor(s.id, e.target.value)}
                disabled={heldBack}
                className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 outline-none focus:border-amber-400/50"
              >
                {STREAMS.map((st) => (
                  <option key={st} value={st} className="bg-black">
                    {st}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => toggleHold(s.id)}
                title={heldBack ? "Restore for graduation" : "Hold in Grade 12"}
                className="rounded-md p-1.5 text-white/45 hover:bg-white/10 hover:text-white"
              >
                {heldBack ? <UserCheck size={16} /> : <UserX size={16} />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- commit panel ----------

function CommitPanel({ preview, graduatingYear, setGraduatingYear, note, setNote, holdBackIds, setConfirmOpen }) {
  const ready = !!preview;
  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-white/[0.03] to-transparent p-5">
      <div className="chip">
        <ShieldCheck size={14} className="text-emerald-300" />
        Commit cycle
      </div>
      <h3 className="mt-2 font-display text-xl font-semibold">
        Promote into {preview?.targetAcademicYear || `${graduatingYear}-${graduatingYear + 1}`}
      </h3>
      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-white/55">
            Graduating year
          </span>
          <input
            type="number"
            value={graduatingYear}
            onChange={(e) => setGraduatingYear(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-white/55">
            Note (optional)
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="e.g. Promoted by Principal after Aug 28 staff meet."
            className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50"
          />
        </label>
        <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-white/55">
          <div className="flex items-center gap-2 text-white/75">
            <Info size={14} className="text-emerald-300" />
            Pre-commit snapshot is stored — you can roll back this cycle later.
          </div>
          <ul className="mt-2 space-y-1">
            <li>• {preview?.totals.promoted ?? "—"} students will move up one grade</li>
            <li>• {preview?.totals.graduated ?? "—"} students will become alumni</li>
            <li>• {holdBackIds.length} held in current grade</li>
          </ul>
        </div>
        <button
          type="button"
          disabled={!ready}
          onClick={() => setConfirmOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:shadow-emerald-500/40 disabled:opacity-50"
        >
          <ShieldCheck size={16} />
          Review & commit
        </button>
      </div>
    </div>
  );
}

// ---------- at-risk panel ----------

function AtRiskPanel({ preview, holdBackIds, toggleHold }) {
  const list = preview?.atRisk || [];
  return (
    <div className="rounded-2xl border border-amber-400/30 bg-amber-500/[0.06] p-5">
      <div className="flex items-center justify-between">
        <div className="chip">
          <AlertTriangle size={14} className="text-amber-300" />
          At-risk students
        </div>
        {preview && (
          <div className="text-xs text-white/50">
            Showing {list.length}/{preview.atRiskTotal}
          </div>
        )}
      </div>
      <h3 className="mt-2 font-display text-lg font-semibold">
        Low attendance / fees pending
      </h3>
      {list.length === 0 ? (
        <div className="mt-3 text-sm text-white/55">
          Nobody is flagged — clean cohort 🎯
        </div>
      ) : (
        <div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto pr-1">
          {list.map((s) => {
            const held = holdBackIds.includes(s.id);
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-lg bg-black/20 p-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">
                    {s.name}{" "}
                    <span className="text-xs font-normal text-white/45">
                      · {s.id} · G{s.grade}-{s.section}
                    </span>
                  </div>
                  <div className="text-xs text-amber-200/80">{s.reason}</div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleHold(s.id)}
                  className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium ${
                    held
                      ? "bg-rose-500/20 text-rose-200 ring-1 ring-rose-400/40"
                      : "bg-white/5 text-white/65 hover:bg-white/10"
                  }`}
                >
                  {held ? "Held back" : "Hold back"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- held-back panel ----------

function HeldBackPanel({ preview, holdBackIds, toggleHold }) {
  if (holdBackIds.length === 0) return null;
  const map = new Map((preview?.heldBack || []).map((s) => [s.id, s]));
  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/[0.05] p-5">
      <div className="chip">
        <UserX size={14} className="text-rose-300" />
        Held back ({holdBackIds.length})
      </div>
      <h3 className="mt-2 font-display text-lg font-semibold">
        Will stay in current grade
      </h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {holdBackIds.map((id) => {
          const s = map.get(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggleHold(id)}
              className="group flex items-center gap-2 rounded-full bg-rose-500/15 px-3 py-1.5 text-xs text-rose-100 ring-1 ring-rose-400/30 hover:bg-rose-500/25"
            >
              <span>
                {s ? `${s.name} · G${s.grade}` : id}
              </span>
              <X size={12} className="opacity-60 group-hover:opacity-100" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- cycles history ----------

function CyclesHistory({ cycles, loading, onRollback }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (cycles.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="chip">
          <History size={14} className="text-purple-300" />
          Cycle history
        </div>
        <div className="mt-3 text-sm text-white/55">
          No cycles have been committed yet.
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="chip">
        <History size={14} className="text-purple-300" />
        Cycle history
      </div>
      <h3 className="mt-2 mb-3 font-display text-xl font-semibold">
        Past promotions
      </h3>
      <div className="space-y-2">
        {cycles.map((c) => {
          const committed = c.status === "committed";
          return (
            <div
              key={c.id}
              className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 text-sm ${
                committed
                  ? "border-emerald-500/30 bg-emerald-500/[0.05]"
                  : "border-white/10 bg-white/[0.02] opacity-70"
              }`}
            >
              <div className="flex items-center gap-2">
                {committed ? (
                  <CircleCheck size={16} className="text-emerald-300" />
                ) : (
                  <Undo2 size={16} className="text-white/45" />
                )}
                <span className="font-mono text-xs text-white/55">{c.id}</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">
                  {c.targetAcademicYear}
                </div>
                <div className="text-xs text-white/50">
                  {committed ? "Committed" : "Rolled back"}{" "}
                  {fmtDate(committed ? c.committedAt : c.rolledBackAt)} by{" "}
                  {committed ? c.committedBy : c.rolledBackBy}
                  {c.note && <span> · "{c.note}"</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-200 ring-1 ring-emerald-400/30">
                  {c.totals.promoted} promoted
                </span>
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-200 ring-1 ring-amber-400/30">
                  {c.totals.graduated} graduated
                </span>
                {c.totals.heldBack > 0 && (
                  <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-rose-200 ring-1 ring-rose-400/30">
                    {c.totals.heldBack} held
                  </span>
                )}
              </div>
              {committed && (
                <button
                  type="button"
                  onClick={() => onRollback(c)}
                  className="flex items-center gap-1 rounded-md border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-500/20"
                >
                  <Undo2 size={14} />
                  Roll back
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- modals ----------

function ConfirmModal({ preview, graduatingYear, note, working, onCancel, onConfirm }) {
  return (
    <Modal onClose={onCancel}>
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500/20 text-emerald-300">
          <ShieldCheck size={18} />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold">
            Commit promotion?
          </h2>
          <p className="text-sm text-white/60">
            This will mutate the active roster.
          </p>
        </div>
      </div>
      <div className="mt-5 space-y-3 text-sm">
        <Row
          label="Target academic year"
          value={preview?.targetAcademicYear || `${graduatingYear}-${graduatingYear + 1}`}
        />
        <Row label="Students to promote" value={preview?.totals.promoted ?? 0} />
        <Row label="Students to graduate" value={preview?.totals.graduated ?? 0} />
        <Row label="Held back" value={preview?.totals.heldBack ?? 0} />
        {note && <Row label="Note" value={note} />}
      </div>
      <div className="mt-5 flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-200">
        <Info size={14} className="mt-0.5 shrink-0" />
        A snapshot will be saved so you can roll back if needed.
      </div>
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={working}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={working}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50"
        >
          {working ? (
            <Loader size={16} className="animate-spin" />
          ) : (
            <ShieldCheck size={16} />
          )}
          Commit
        </button>
      </div>
    </Modal>
  );
}

function RollbackModal({ cycle, working, onCancel, onConfirm }) {
  return (
    <Modal onClose={onCancel}>
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-500/20 text-rose-300">
          <Undo2 size={18} />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold">Roll back cycle?</h2>
          <p className="text-sm text-white/60">{cycle.id} · {cycle.targetAcademicYear}</p>
        </div>
      </div>
      <div className="mt-5 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-xs text-rose-100">
        Restores the pre-commit student snapshot AND deletes{" "}
        <strong>{cycle.totals.graduated}</strong> alumni records created by this
        cycle.
      </div>
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={working}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={working}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 disabled:opacity-50"
        >
          {working ? (
            <Loader size={16} className="animate-spin" />
          ) : (
            <Undo2 size={16} />
          )}
          Roll back
        </button>
      </div>
    </Modal>
  );
}

function CommittedToast({ cycle, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 7000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.95 }}
      className="fixed inset-x-0 bottom-6 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-emerald-600/30 via-teal-600/20 to-emerald-500/10 p-4 shadow-2xl backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", delay: 0.1 }}
        className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-500/30 text-emerald-200"
      >
        <Sparkles size={22} />
      </motion.div>
      <div className="flex-1">
        <div className="font-display text-lg font-semibold text-white">
          {cycle.targetAcademicYear} promotion committed
        </div>
        <div className="text-sm text-emerald-100/85">
          {cycle.totals.promoted} promoted · {cycle.totals.graduated} graduated
          {cycle.totals.heldBack > 0 && ` · ${cycle.totals.heldBack} held`}
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-full p-1.5 text-emerald-200/70 hover:bg-white/10 hover:text-white"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

function Modal({ children, onClose }) {
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
        className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0d0f24] p-6 shadow-2xl"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.04] px-3 py-2">
      <span className="text-white/60">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
