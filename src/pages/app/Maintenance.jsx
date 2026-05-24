import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench,
  Plus,
  MapPin,
  Clock,
  User,
  X,
  AlertOctagon,
  Sparkles as SparklesIcon,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const STAGE_TONES = {
  Open: "from-rose-500/30 to-rose-400/10 ring-rose-400/30",
  Assigned: "from-amber-500/30 to-amber-400/10 ring-amber-400/30",
  "In Progress": "from-brand-500/30 to-brand-400/10 ring-brand-400/30",
  Resolved: "from-emerald-500/30 to-emerald-400/10 ring-emerald-400/30",
  Closed: "from-white/15 to-white/5 ring-white/15",
};

const STAGE_DOTS = {
  Open: "bg-rose-400",
  Assigned: "bg-amber-400",
  "In Progress": "bg-brand-400",
  Resolved: "bg-emerald-400",
  Closed: "bg-white/40",
};

const PRIORITY_TONES = {
  Low: "bg-white/5 text-white/65 ring-white/15",
  Medium: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  High: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  Critical: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

export default function Maintenance() {
  const { data, loading, error, refetch } = useApi(endpoints.maintenance, []);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  useRealtime("maintenance.changed", () => refetch());

  const stages = data?.stages || [];
  const tickets = data?.items || [];
  const summary = data?.summary;

  const board = useMemo(() => {
    const m = {};
    stages.forEach((s) => (m[s] = []));
    tickets.forEach((t) => m[t.stage]?.push(t));
    return m;
  }, [tickets, stages]);

  const refresh = (updated) => {
    setSelected((s) => (s && updated && s.id === updated.id ? updated : s));
    refetch();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operations"
        title="Maintenance"
        subtitle="Track complaints, assign technicians and close out repairs"
      />

      {error && <ErrorState error={error} onRetry={refetch} />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile icon={Wrench} label="Total tickets" value={loading ? "—" : summary?.total} tint="from-brand-500/30" />
        <StatTile icon={Zap} label="Open + Assigned" value={loading ? "—" : (summary?.Open || 0) + (summary?.Assigned || 0)} tint="from-amber-500/30" />
        <StatTile icon={AlertOctagon} label="Critical (active)" value={loading ? "—" : summary?.critical} tint="from-rose-500/30" pulse={summary?.critical > 0} />
        <StatTile icon={CheckCircle2} label="Resolved" value={loading ? "—" : (summary?.Resolved || 0) + (summary?.Closed || 0)} tint="from-emerald-500/30" />
      </div>

      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-xs text-white/55">
          Click any ticket to assign a technician or advance its stage
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary px-3 py-2 text-sm">
          <Plus size={14} /> Raise ticket
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-96" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
          {stages.map((s, i) => (
            <Column key={s} stage={s} tickets={board[s] || []} idx={i} onPick={setSelected} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <TicketModal
            ticket={selected}
            technicians={data?.technicians || []}
            stages={stages}
            onClose={() => setSelected(null)}
            onChanged={refresh}
          />
        )}
        {creating && (
          <NewTicketModal
            categories={data?.categories || []}
            priorities={data?.priorities || []}
            onClose={() => setCreating(false)}
            onCreated={() => {
              setCreating(false);
              refetch();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tint, pulse }) {
  return (
    <div className="card relative overflow-hidden">
      <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${tint} to-transparent blur-2xl ${pulse ? "animate-pulse" : ""}`} />
      <div className="relative flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-white/55">{label}</div>
          <div className="stat-num glow-text">{value}</div>
        </div>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function Column({ stage, tickets, idx, onPick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      className="flex h-[560px] flex-col rounded-2xl border border-white/10 bg-white/[0.025] p-3"
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${STAGE_DOTS[stage]}`} />
          <div className="font-display text-sm font-semibold">{stage}</div>
        </div>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/60 ring-1 ring-white/10">
          {tickets.length}
        </span>
      </div>
      <div className="no-scrollbar flex-1 space-y-2 overflow-y-auto">
        {tickets.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 p-4 text-center text-[11px] text-white/35">
            Empty
          </div>
        ) : (
          tickets.map((t, i) => (
            <motion.button
              key={t.id}
              onClick={() => onPick(t)}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              whileHover={{ y: -2 }}
              className={`relative w-full overflow-hidden rounded-xl bg-gradient-to-br p-3 text-left ring-1 ${STAGE_TONES[stage]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-display text-sm font-semibold leading-tight">
                  {t.title}
                </div>
                <span className={`flex-shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-medium ring-1 ${PRIORITY_TONES[t.priority]}`}>
                  {t.priority}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[10px] text-white/55">
                <MapPin size={9} /> {t.location}
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-white/45">
                <span>{t.category}</span>
                <span>{t.reportedOn}</span>
              </div>
              {t.assignedTo && (
                <div className="mt-2 inline-flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/70">
                  <User size={9} /> {t.assignedTo}
                </div>
              )}
            </motion.button>
          ))
        )}
      </div>
    </motion.div>
  );
}

function TicketModal({ ticket, technicians, stages, onClose, onChanged }) {
  const [t, setT] = useState(ticket);
  const [note, setNote] = useState(ticket.resolutionNote || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const update = async (patch) => {
    setBusy(true);
    setErr(null);
    try {
      const updated = await endpoints.maintenanceUpdate(t.id, patch);
      setT(updated);
      onChanged(updated);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a0a1e] via-[#0d0d2a] to-[#101044] shadow-glow"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-brand-500/30 to-accent-pink/30 blur-3xl" />
        <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white">
          <X size={18} />
        </button>

        <div className="relative p-6">
          <div className="flex items-center gap-2">
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${PRIORITY_TONES[t.priority]}`}>{t.priority}</span>
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-medium text-white/70 ring-1 ring-white/10">{t.category}</span>
            <span className="text-xs text-white/45">{t.id}</span>
          </div>
          <div className="mt-3 font-display text-xl font-bold leading-tight">{t.title}</div>
          <div className="mt-1 text-xs text-white/55">
            {t.location} · reported by {t.reportedBy} on {t.reportedOn}
          </div>

          {/* Stage stepper */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {stages.map((s) => {
              const active = s === t.stage;
              return (
                <button
                  key={s}
                  disabled={busy}
                  onClick={() => update({ stage: s })}
                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium ring-1 transition-all ${
                    active
                      ? "bg-gradient-to-r from-brand-500/30 to-accent-violet/20 text-white ring-white/25"
                      : "bg-white/5 text-white/60 ring-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${STAGE_DOTS[s]}`} />
                  {s}
                </button>
              );
            })}
          </div>

          {/* Assign technician */}
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="text-[10px] uppercase tracking-wider text-white/55">
              Assign technician
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                onClick={() => update({ assignedTo: null })}
                disabled={busy}
                className={`rounded-md px-2 py-1 text-[11px] font-medium ring-1 transition-all ${
                  !t.assignedTo
                    ? "bg-white/10 text-white ring-white/20"
                    : "bg-white/5 text-white/55 ring-white/10 hover:bg-white/10"
                }`}
              >
                Unassigned
              </button>
              {technicians.map((tech) => {
                const active = t.assignedTo === tech.id || t.assignedTo === tech.name;
                return (
                  <button
                    key={tech.id}
                    onClick={() => update({ assignedTo: tech.name })}
                    disabled={busy}
                    className={`rounded-md px-2 py-1 text-[11px] font-medium ring-1 transition-all ${
                      active
                        ? "bg-gradient-to-r from-brand-500/30 to-accent-violet/20 text-white ring-white/25"
                        : "bg-white/5 text-white/65 ring-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {tech.name}
                    <span className="ml-1 text-[9px] text-white/40">·{tech.skill}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resolution note */}
          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Resolution note
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="What was done…"
              className="w-full resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
            />
            <button
              onClick={() => update({ resolutionNote: note })}
              disabled={busy || note === (t.resolutionNote || "")}
              className="mt-2 inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium hover:bg-white/10 disabled:opacity-50"
            >
              Save note
            </button>
            {t.resolvedOn && (
              <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-emerald-300">
                <Clock size={11} /> Resolved on {t.resolvedOn}
              </div>
            )}
          </div>

          {err && (
            <div className="mt-3 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
              {err}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function NewTicketModal({ categories, priorities, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    category: categories[0] || "Electrical",
    priority: "Medium",
    location: "",
    reportedBy: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await endpoints.maintenanceAdd(form);
      onCreated();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur"
      onClick={onClose}
    >
      <motion.form
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="glass-card relative w-full max-w-md p-6"
      >
        <button type="button" onClick={onClose} className="absolute right-3 top-3 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white">
          <X size={16} />
        </button>
        <div className="mb-1 text-xs uppercase tracking-[0.2em] text-white/55">
          Raise maintenance ticket
        </div>
        <div className="font-display text-xl font-bold">Report an issue</div>

        <div className="mt-5 space-y-3">
          <Field label="Title">
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
              >
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select
                value={form.priority}
                onChange={(e) => set("priority", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
              >
                {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Location">
            <input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Block · Room"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
            />
          </Field>
          <Field label="Reported by">
            <input
              value={form.reportedBy}
              onChange={(e) => set("reportedBy", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
            />
          </Field>
        </div>

        {err && (
          <div className="mt-3 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
            {err}
          </div>
        )}

        <button disabled={busy} className="btn-primary mt-5 w-full">
          {busy ? "Raising…" : "Raise ticket"}
        </button>
      </motion.form>
    </motion.div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">
        {label}
      </div>
      {children}
    </label>
  );
}
