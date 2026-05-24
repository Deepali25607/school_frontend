import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Phone,
  Mail,
  Calendar,
  FileCheck2,
  FileX2,
  Plus,
  X,
  ChevronRight,
  Sparkles as SparklesIcon,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const STAGE_TONES = {
  Enquiry: "from-white/15 to-white/5 ring-white/15",
  Application: "from-brand-500/30 to-brand-400/10 ring-brand-400/30",
  Verification: "from-accent-cyan/30 to-accent-cyan/10 ring-accent-cyan/30",
  Interview: "from-accent-violet/30 to-accent-violet/10 ring-accent-violet/30",
  Approved: "from-emerald-500/30 to-emerald-400/10 ring-emerald-400/30",
  Enrolled: "from-accent-gold/30 to-accent-gold/10 ring-accent-gold/30",
  Rejected: "from-rose-500/30 to-rose-400/10 ring-rose-400/30",
};

const STAGE_DOTS = {
  Enquiry: "bg-white/70",
  Application: "bg-brand-400",
  Verification: "bg-accent-cyan",
  Interview: "bg-accent-violet",
  Approved: "bg-emerald-400",
  Enrolled: "bg-accent-gold",
  Rejected: "bg-rose-400",
};

export default function Admissions() {
  const { data, loading, error, refetch } = useApi(endpoints.admissions, []);
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  useRealtime("admissions.changed", () => refetch());

  const stages = data?.stages || [];
  const board = data?.board || {};

  const counts = useMemo(() => {
    const c = {};
    stages.forEach((s) => (c[s] = (board[s] || []).length));
    return c;
  }, [stages, board]);

  const totals = useMemo(() => {
    const items = data?.items || [];
    return {
      total: items.length,
      inPipeline: items.filter((a) => !["Enrolled", "Rejected"].includes(a.stage)).length,
      enrolled: items.filter((a) => a.stage === "Enrolled").length,
      rejected: items.filter((a) => a.stage === "Rejected").length,
    };
  }, [data]);

  const onMove = async (applicantId, toStage) => {
    await endpoints.admissionMove(applicantId, toStage);
    refetch();
    if (selected?.id === applicantId) {
      setSelected((s) => ({ ...s, stage: toStage }));
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Lifecycle"
        title="Admissions"
        subtitle="Track every applicant from enquiry to enrolled"
      />

      {error && <ErrorState error={error} onRetry={refetch} />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Total applicants" value={loading ? "—" : totals.total} tint="from-brand-500/30" />
        <StatTile label="In pipeline" value={loading ? "—" : totals.inPipeline} tint="from-accent-violet/30" />
        <StatTile label="Enrolled" value={loading ? "—" : totals.enrolled} tint="from-accent-gold/30" />
        <StatTile label="Rejected" value={loading ? "—" : totals.rejected} tint="from-rose-500/30" />
      </div>

      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-xs text-white/55">
          Click any card to view details · Use the stage button to advance an applicant
        </div>
        <button onClick={() => setAdding(true)} className="btn-primary px-4 py-2 text-sm">
          <Plus size={14} /> New enquiry
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {stages.map((s, i) => (
            <KanbanColumn
              key={s}
              stage={s}
              items={board[s] || []}
              count={counts[s]}
              idx={i}
              onSelect={setSelected}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <ApplicantModal
            applicant={selected}
            stages={stages}
            onClose={() => setSelected(null)}
            onMove={(stage) => onMove(selected.id, stage)}
          />
        )}
        {adding && (
          <NewEnquiryModal
            onClose={() => setAdding(false)}
            onCreated={() => {
              setAdding(false);
              refetch();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatTile({ label, value, tint }) {
  return (
    <div className="card relative overflow-hidden">
      <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${tint} to-transparent blur-2xl`} />
      <div className="relative">
        <div className="text-xs uppercase tracking-wider text-white/55">{label}</div>
        <div className="stat-num glow-text">{value}</div>
      </div>
    </div>
  );
}

function KanbanColumn({ stage, items, count, idx, onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      className="flex h-[600px] flex-col rounded-2xl border border-white/10 bg-white/[0.025] p-3"
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${STAGE_DOTS[stage]}`} />
          <div className="font-display text-sm font-semibold">{stage}</div>
        </div>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/60 ring-1 ring-white/10">
          {count}
        </span>
      </div>
      <div className="no-scrollbar flex-1 space-y-2 overflow-y-auto">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 p-4 text-center text-[11px] text-white/35">
            Empty
          </div>
        ) : (
          items.map((a, i) => (
            <motion.button
              key={a.id}
              onClick={() => onSelect(a)}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              whileHover={{ y: -2 }}
              className={`relative w-full overflow-hidden rounded-xl bg-gradient-to-br p-3 text-left ring-1 ${STAGE_TONES[stage]}`}
            >
              <div className="flex items-start gap-2.5">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-pink font-display text-xs font-bold">
                  {a.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{a.name}</div>
                  <div className="text-[10px] text-white/55">
                    {a.id} · Grade {a.gradeApplied}
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-white/50">
                <span className="inline-flex items-center gap-1">
                  <Calendar size={9} /> {a.appliedOn}
                </span>
                {a.score != null && (
                  <span className="rounded bg-accent-gold/15 px-1.5 py-0.5 font-semibold text-accent-gold">
                    {a.score}
                  </span>
                )}
              </div>
            </motion.button>
          ))
        )}
      </div>
    </motion.div>
  );
}

function ApplicantModal({ applicant, stages, onClose, onMove }) {
  const a = applicant;
  const currentIdx = stages.indexOf(a.stage);
  const next = stages[currentIdx + 1];
  const docsUploaded = a.documents.filter((d) => d.uploaded).length;
  const docsVerified = a.documents.filter((d) => d.verified).length;

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
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a0a1e] via-[#0d0d2a] to-[#101044] shadow-glow"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-brand-500/30 to-accent-pink/30 blur-3xl" />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="relative p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-accent-violet to-accent-pink font-display text-xl font-bold shadow-glow">
              {a.avatar}
            </div>
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/55">
                Applicant
              </div>
              <div className="font-display text-2xl font-bold leading-tight">
                {a.name}
              </div>
              <div className="text-xs text-white/55">
                {a.id} · Grade {a.gradeApplied} · Applied {a.appliedOn}
              </div>
            </div>
            <span
              className={`rounded-full bg-gradient-to-br px-3 py-1 text-xs font-medium ring-1 ${STAGE_TONES[a.stage]}`}
            >
              {a.stage}
            </span>
          </div>

          {/* Stage stepper */}
          <div className="mt-5 flex flex-wrap items-center gap-1.5">
            {stages.map((s, i) => {
              const done = i <= currentIdx && a.stage !== "Rejected";
              const active = s === a.stage;
              return (
                <button
                  key={s}
                  onClick={() => onMove(s)}
                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium ring-1 transition-all ${
                    active
                      ? "bg-gradient-to-r from-brand-500/30 to-accent-violet/20 text-white ring-white/25"
                      : done
                      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
                      : "bg-white/5 text-white/60 ring-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {done && !active && <CheckCircle2 size={10} />}
                  {s}
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Section title="Contact & background">
              <KV k="Parent" v={a.parentName} />
              <KV k="Phone" v={a.parentContact} icon={Phone} />
              <KV k="Email" v={a.parentEmail} icon={Mail} />
              <KV k="DOB" v={a.dob} />
              <KV k="Source" v={a.source} />
              <KV k="Previous school" v={a.previousSchool} />
            </Section>

            <Section title="Documents">
              <div className="mb-2 text-[11px] text-white/55">
                {docsUploaded}/{a.documents.length} uploaded · {docsVerified} verified
              </div>
              <ul className="space-y-1.5 text-sm">
                {a.documents.map((d) => (
                  <li key={d.name} className="flex items-center justify-between">
                    <span className="text-white/80">{d.name}</span>
                    {d.verified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300">
                        <FileCheck2 size={12} /> Verified
                      </span>
                    ) : d.uploaded ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-300">
                        <FileCheck2 size={12} /> Uploaded
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-white/40">
                        <FileX2 size={12} /> Missing
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          {a.interviewSlot && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm">
              <div className="text-[10px] uppercase tracking-wider text-white/55">Interview</div>
              <div className="font-medium">{a.interviewSlot}</div>
              {a.score != null && (
                <div className="mt-1 text-xs text-white/65">
                  Score:{" "}
                  <span className="font-semibold text-accent-gold">{a.score}/100</span>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm">
            <div className="text-[10px] uppercase tracking-wider text-white/55">Notes</div>
            <div className="text-white/80">{a.notes}</div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {next && next !== "Rejected" && (
              <button onClick={() => onMove(next)} className="btn-primary text-sm">
                Advance to {next} <ChevronRight size={16} />
              </button>
            )}
            {a.stage !== "Rejected" && a.stage !== "Enrolled" && (
              <button
                onClick={() => onMove("Rejected")}
                className="inline-flex items-center gap-1 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300 transition-all hover:bg-rose-500/15"
              >
                <XCircle size={14} /> Reject
              </button>
            )}
            <button onClick={onClose} className="btn-ghost text-sm">
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/55">
        {title}
      </div>
      <div className="space-y-1.5 text-sm">{children}</div>
    </div>
  );
}

function KV({ k, v, icon: Icon }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-white/55">{k}</div>
      <div className="inline-flex items-center gap-1.5 font-medium">
        {Icon && <Icon size={12} className="text-white/40" />}
        {v}
      </div>
    </div>
  );
}

function NewEnquiryModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    gradeApplied: 1,
    parentName: "",
    parentContact: "",
    parentEmail: "",
    previousSchool: "",
    source: "Website",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await endpoints.admissionAdd(form);
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
        className="glass-card relative w-full max-w-lg p-6"
      >
        <button type="button" onClick={onClose} className="absolute right-3 top-3 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white">
          <X size={16} />
        </button>
        <div className="mb-1 text-xs uppercase tracking-[0.2em] text-white/55">
          Add new enquiry
        </div>
        <div className="font-display text-xl font-bold">Applicant details</div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Student name" value={form.name} onChange={(v) => set("name", v)} required />
          <Input label="Grade applied" type="number" min={1} max={12} value={form.gradeApplied} onChange={(v) => set("gradeApplied", Number(v))} required />
          <Input label="Parent name" value={form.parentName} onChange={(v) => set("parentName", v)} />
          <Input label="Parent phone" value={form.parentContact} onChange={(v) => set("parentContact", v)} />
          <Input label="Parent email" value={form.parentEmail} onChange={(v) => set("parentEmail", v)} type="email" />
          <Input label="Previous school" value={form.previousSchool} onChange={(v) => set("previousSchool", v)} />
        </div>

        {err && (
          <div className="mt-3 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
            {err}
          </div>
        )}

        <button disabled={busy} className="btn-primary mt-5 w-full">
          {busy ? "Creating…" : "Create enquiry"}
        </button>
      </motion.form>
    </motion.div>
  );
}

function Input({ label, value, onChange, type = "text", ...rest }) {
  return (
    <label className="block">
      <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
        {...rest}
      />
    </label>
  );
}
