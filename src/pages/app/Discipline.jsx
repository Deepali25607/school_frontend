import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  Search,
  Filter,
  X,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Users,
  Calendar,
  AlertTriangle,
  Gavel,
  Phone,
  Sparkles as SparklesIcon,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const SEVERITY_TONES = {
  Minor: "bg-white/5 text-white/65 ring-white/15",
  Moderate: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  Major: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

const STATUS_TONES = {
  Open: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  "Under Review": "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  Resolved: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Escalated: "bg-accent-pink/15 text-pink-200 ring-accent-pink/30",
};

const STATUS_DOTS = {
  Open: "bg-rose-400",
  "Under Review": "bg-amber-400",
  Resolved: "bg-emerald-400",
  Escalated: "bg-accent-pink",
};

const STATUS_ICONS = {
  Open: Clock,
  "Under Review": AlertTriangle,
  Resolved: CheckCircle2,
  Escalated: ArrowUpRight,
};

export default function Discipline() {
  const { user } = useAuth();
  const canCreate = ["admin", "principal", "teacher"].includes(user?.role);
  const canEscalate = ["admin", "principal"].includes(user?.role);

  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [category, setCategory] = useState("all");
  const [sinceDays, setSinceDays] = useState("");
  const [picked, setPicked] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const { data, loading, error, refetch } = useApi(
    () =>
      endpoints.discipline({
        q: debounced,
        status,
        severity,
        category,
        sinceDays: sinceDays || undefined,
      }),
    [debounced, status, severity, category, sinceDays]
  );

  useRealtime("discipline.changed", () => refetch());

  const items = data?.items || [];
  const summary = data?.summary;

  const onChanged = (updated) => {
    setPicked((p) => (p && updated && p.id === updated.id ? { ...p, ...updated } : p));
    refetch();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Conduct"
        title="Discipline & Behavior"
        subtitle={
          data
            ? `${summary?.total || 0} incidents on record · ${summary?.openCount || 0} active`
            : "Loading…"
        }
      />

      {error && <ErrorState error={error} onRetry={refetch} />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          icon={Gavel}
          label="Open + Review"
          value={loading ? "—" : summary?.openCount}
          tint="from-rose-500/30"
          pulse={summary?.openCount > 0}
        />
        <StatTile
          icon={Clock}
          label="This week"
          value={loading ? "—" : summary?.thisWeek}
          tint="from-amber-500/30"
        />
        <StatTile
          icon={Phone}
          label="Parent meetings"
          value={loading ? "—" : summary?.pendingMeetings}
          tint="from-accent-pink/30"
        />
        <StatTile
          icon={ShieldAlert}
          label="Total demerits"
          value={loading ? "—" : summary?.totalDemerits}
          tint="from-accent-violet/30"
        />
      </div>

      {/* Filters */}
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={14} className="text-white/55" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search ID, student, category, description…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-white/55" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">Any status</option>
            {(data?.statuses || []).map((s) => <option key={s}>{s}</option>)}
          </select>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">Any severity</option>
            {(data?.severities || []).map((s) => <option key={s}>{s}</option>)}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">Any category</option>
            {(data?.categories || []).map((c) => <option key={c}>{c}</option>)}
          </select>
          <select
            value={sinceDays}
            onChange={(e) => setSinceDays(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="">All time</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          {canCreate && (
            <button onClick={() => setCreating(true)} className="btn-primary px-3 py-2 text-sm">
              <Plus size={14} /> Log incident
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center text-white/55">
          <SparklesIcon className="mx-auto mb-2 text-accent-gold" size={20} />
          No incidents match this filter — that's a good sign.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((i, idx) => (
            <IncidentRow key={i.id} inc={i} idx={idx} onPick={setPicked} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {picked && (
          <IncidentModal
            incident={picked}
            statuses={data?.statuses || []}
            resolutions={data?.resolutions || []}
            canEscalate={canEscalate}
            onClose={() => setPicked(null)}
            onChanged={onChanged}
          />
        )}
        {creating && (
          <NewIncidentModal
            categories={data?.categories || []}
            severities={data?.severities || []}
            reporters={data?.reporters || []}
            severityDemerits={data?.severityDemerits || {}}
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

function IncidentRow({ inc, idx, onPick }) {
  const StatusIcon = STATUS_ICONS[inc.status];
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx, 16) * 0.02 }}
      onClick={() => onPick(inc)}
      className="group relative flex w-full flex-col gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-3 text-left transition-all hover:border-white/15 hover:bg-white/[0.06] md:flex-row md:items-center"
    >
      <span
        className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-r ${STATUS_DOTS[inc.status]}`}
      />
      <div className="ml-2 flex items-center gap-2 md:w-60">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-violet font-display text-xs font-bold text-white">
          {inc.studentAvatar || inc.studentName?.[0]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{inc.studentName}</div>
          <div className="text-[10px] text-white/45">
            {inc.studentId} · Grade {inc.studentGrade}-{inc.studentSection}
          </div>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-white/70 ring-1 ring-white/10">
            {inc.category}
          </span>
          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ${SEVERITY_TONES[inc.severity]}`}>
            {inc.severity}
          </span>
          <span className="font-mono text-[10px] text-white/40">{inc.id}</span>
        </div>
        <div className="mt-1 truncate text-sm text-white/85">{inc.description}</div>
        {inc.resolution && (
          <div className="mt-0.5 truncate text-[11px] text-emerald-300/80">
            ✓ {inc.resolution}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 md:w-60 md:justify-end">
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${STATUS_TONES[inc.status]}`}>
          <StatusIcon size={11} /> {inc.status}
        </span>
        <div className="text-right text-[11px] text-white/45">
          <div className="tabular-nums">{inc.reportedOn}</div>
          <div className="font-semibold text-accent-violet/90">{inc.demerits}d</div>
        </div>
      </div>
    </motion.button>
  );
}

function IncidentModal({ incident, statuses, resolutions, canEscalate, onClose, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [resolution, setResolution] = useState(incident.resolution || "");
  const [parentNotified, setParentNotified] = useState(!!incident.parentNotified);
  const [meetingDate, setMeetingDate] = useState(incident.parentMeetingAt || "");

  const update = async (patch) => {
    setBusy(true);
    setErr(null);
    try {
      const updated = await endpoints.disciplineUpdate(incident.id, patch);
      onChanged({ ...incident, ...updated });
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  const StatusIcon = STATUS_ICONS[incident.status];

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
        className="relative max-h-[88vh] w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a0a1e] via-[#0d0d2a] to-[#101044] shadow-glow"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-rose-500/25 to-accent-pink/25 blur-3xl" />
        <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white">
          <X size={18} />
        </button>

        <div className="relative max-h-[88vh] overflow-y-auto p-6">
          <div className="flex items-center gap-2">
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${SEVERITY_TONES[incident.severity]}`}>
              {incident.severity}
            </span>
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-medium text-white/70 ring-1 ring-white/10">
              {incident.category}
            </span>
            <span className="font-mono text-xs text-white/40">{incident.id}</span>
            <span className={`ml-auto inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${STATUS_TONES[incident.status]}`}>
              <StatusIcon size={11} /> {incident.status}
            </span>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="text-[10px] uppercase tracking-wider text-white/55">Student</div>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-violet text-xs font-bold">
                {incident.studentAvatar || incident.studentName?.[0]}
              </div>
              <div>
                <div className="font-medium">{incident.studentName}</div>
                <div className="text-[10px] text-white/45">
                  {incident.studentId} · Grade {incident.studentGrade}-{incident.studentSection}{incident.studentHouse ? ` · ${incident.studentHouse}` : ""}
                </div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-[10px] uppercase tracking-wider text-white/55">Demerits</div>
                <div className="text-lg font-bold text-accent-violet">{incident.demerits}</div>
              </div>
            </div>
            <div className="mt-3 text-[10px] uppercase tracking-wider text-white/55">
              Description
            </div>
            <p className="mt-1 text-sm leading-relaxed text-white/85">
              {incident.description}
            </p>
            <div className="mt-2 text-[10px] uppercase tracking-wider text-white/55">
              Reported by
            </div>
            <div className="text-xs text-white/75">{incident.reportedBy}</div>
            <div className="mt-1 text-[10px] text-white/40">
              Occurred {incident.occurredOn} · logged {incident.reportedOn}
            </div>
          </div>

          {/* Status workflow */}
          <div className="mt-4">
            <div className="mb-2 text-[10px] uppercase tracking-wider text-white/55">
              Status
            </div>
            <div className="flex flex-wrap gap-1.5">
              {statuses.map((s) => {
                const active = s === incident.status;
                const isEscalate = s === "Escalated";
                const disabled = busy || (isEscalate && !canEscalate);
                return (
                  <button
                    key={s}
                    disabled={disabled}
                    onClick={() => update({ status: s })}
                    title={isEscalate && !canEscalate ? "Only admin/principal can escalate" : ""}
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium ring-1 transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                      active
                        ? "bg-gradient-to-r from-brand-500/30 to-accent-violet/20 text-white ring-white/25"
                        : "bg-white/5 text-white/65 ring-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_DOTS[s]}`} />
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parent contact */}
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="text-[10px] uppercase tracking-wider text-white/55">Parent contact</div>
            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={() => {
                  setParentNotified(!parentNotified);
                  update({ parentNotified: !parentNotified });
                }}
                disabled={busy}
                className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium ring-1 transition-all ${
                  parentNotified
                    ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
                    : "bg-white/5 text-white/60 ring-white/10 hover:bg-white/10"
                }`}
              >
                {parentNotified ? <CheckCircle2 size={11} /> : <Phone size={11} />}
                {parentNotified ? "Notified" : "Not yet notified"}
              </button>
              <div className="flex-1">
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs outline-none"
                />
              </div>
              <button
                onClick={() => update({ parentMeetingAt: meetingDate || null })}
                disabled={busy || meetingDate === (incident.parentMeetingAt || "")}
                className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] hover:bg-white/10 disabled:opacity-50"
              >
                <Calendar size={11} className="inline" /> Save meeting
              </button>
            </div>
          </div>

          {/* Resolution */}
          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Resolution
            </div>
            <div className="flex flex-wrap gap-1">
              {resolutions.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setResolution(r)}
                  className={`rounded-md px-2 py-0.5 text-[10px] ring-1 transition-all ${
                    resolution === r
                      ? "bg-brand-500/20 text-brand-200 ring-brand-400/30"
                      : "bg-white/5 text-white/55 ring-white/10 hover:bg-white/10"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={2}
              placeholder="Edit or write your own…"
              className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60"
            />
            <button
              onClick={() => update({ resolution })}
              disabled={busy || resolution === (incident.resolution || "")}
              className="mt-2 inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs hover:bg-white/10 disabled:opacity-50"
            >
              <ShieldCheck size={11} /> Save resolution
            </button>
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

function NewIncidentModal({ categories, severities, reporters, severityDemerits, onClose, onCreated }) {
  const [form, setForm] = useState({
    studentId: "",
    category: categories[0] || "Disruption",
    severity: "Minor",
    description: "",
    reportedBy: reporters[0] || "",
    occurredOn: new Date().toISOString().slice(0, 10),
  });
  const [studentQuery, setStudentQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [studentLoading, setStudentLoading] = useState(false);
  // Keep the chosen student in its own state — the search-results `students`
  // array is cleared as soon as the query empties, so we can't rely on it
  // to display the selection.
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      if (!studentQuery.trim()) {
        setStudents([]);
        return;
      }
      setStudentLoading(true);
      try {
        const res = await endpoints.students({ q: studentQuery });
        if (!cancelled) setStudents(res.items.slice(0, 8));
      } catch {
        if (!cancelled) setStudents([]);
      } finally {
        if (!cancelled) setStudentLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [studentQuery]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const selected = selectedStudent;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.studentId) {
      setErr("Pick a student first");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await endpoints.disciplineAdd(form);
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
          New incident report
        </div>
        <div className="font-display text-xl font-bold">Log a behavioral incident</div>

        <div className="mt-5 space-y-3">
          <Field label="Student">
            <div className="relative">
              <input
                value={selected ? `${selected.name} · ${selected.id}` : studentQuery}
                onChange={(e) => {
                  setStudentQuery(e.target.value);
                  if (form.studentId) {
                    set("studentId", "");
                    setSelectedStudent(null);
                  }
                }}
                placeholder="Type name or ID…"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
              />
              {!form.studentId && studentQuery && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-[#0c0c22] shadow-glow">
                  {studentLoading && (
                    <div className="px-3 py-2 text-xs text-white/55">Searching…</div>
                  )}
                  {!studentLoading && students.length === 0 && (
                    <div className="px-3 py-2 text-xs text-white/45">No matches</div>
                  )}
                  {students.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => {
                        set("studentId", s.id);
                        setSelectedStudent(s);
                        setStudentQuery("");
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-white/10"
                    >
                      <div className="font-medium">{s.name}</div>
                      <div className="text-[11px] text-white/45">
                        {s.id} · Grade {s.grade}-{s.section}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
              >
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Severity">
              <select
                value={form.severity}
                onChange={(e) => set("severity", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
              >
                {severities.map((s) => (
                  <option key={s} value={s}>
                    {s} · {severityDemerits[s] ?? "?"}d
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="What happened. Stick to facts."
              className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Reported by">
              <select
                value={form.reportedBy}
                onChange={(e) => set("reportedBy", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
              >
                {reporters.map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Occurred on">
              <input
                type="date"
                value={form.occurredOn}
                onChange={(e) => set("occurredOn", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
              />
            </Field>
          </div>
        </div>

        {err && (
          <div className="mt-3 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
            {err}
          </div>
        )}

        <button disabled={busy} className="btn-primary mt-5 w-full">
          {busy ? "Logging…" : "Log incident"}
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
