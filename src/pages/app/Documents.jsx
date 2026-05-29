import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FileText,
  Plus,
  Search,
  Filter,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  BadgeCheck,
  Award,
  IdCard,
  ArrowRightLeft,
  Sparkles as SparklesIcon,
  ShieldCheck,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const TYPE_ICONS = {
  TC: ArrowRightLeft,
  BONAFIDE: BadgeCheck,
  CHARACTER: Award,
  ID_CARD: IdCard,
};

const TYPE_TONES = {
  TC: "bg-accent-pink/15 text-pink-200 ring-accent-pink/30",
  BONAFIDE: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  CHARACTER: "bg-accent-violet/15 text-purple-200 ring-accent-violet/30",
  ID_CARD: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
};

const STATUS_TONES = {
  Requested: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  Approved: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  Issued: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Rejected: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

const STATUS_ICONS = {
  Requested: Clock,
  Approved: ShieldCheck,
  Issued: CheckCircle2,
  Rejected: XCircle,
};

export default function Documents() {
  const { user } = useAuth();
  const canIssue = ["admin", "principal", "hr"].includes(user?.role);

  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [creating, setCreating] = useState(false);
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const { data, loading, error, refetch } = useApi(
    () => endpoints.documents({ q: debounced, status, type }),
    [debounced, status, type]
  );

  useRealtime("documents.changed", () => refetch());

  const items = data?.items || [];
  const summary = data?.summary;
  const types = data?.types || [];

  const onChanged = (updated) => {
    setPicked((p) => (p && updated && p.id === updated.id ? { ...p, ...updated } : p));
    refetch();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Records"
        title="Documents & Certificates"
        subtitle={
          data
            ? `${summary?.total || 0} total · ${summary?.pending || 0} pending issuance`
            : "Loading…"
        }
      />

      {error && <ErrorState error={error} onRetry={refetch} />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile icon={FileText} label="Total" value={loading ? "—" : summary?.total} tint="from-brand-500/30" />
        <StatTile icon={Clock} label="Pending" value={loading ? "—" : summary?.pending} tint="from-amber-500/30" pulse={summary?.pending > 0} />
        <button type="button" onClick={() => setStatus(status === "Issued" ? "all" : "Issued")} className={`block w-full rounded-2xl text-left transition-all ${status === "Issued" ? "ring-1 ring-brand-400/50" : ""}`}>
          <StatTile icon={CheckCircle2} label="Issued" value={loading ? "—" : summary?.Issued} tint="from-emerald-500/30" />
        </button>
        <button type="button" onClick={() => setStatus(status === "Rejected" ? "all" : "Rejected")} className={`block w-full rounded-2xl text-left transition-all ${status === "Rejected" ? "ring-1 ring-brand-400/50" : ""}`}>
          <StatTile icon={XCircle} label="Rejected" value={loading ? "—" : summary?.Rejected} tint="from-rose-500/30" />
        </button>
      </div>

      {/* Document type grid — clickable to prefill the request modal */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {types.map((t, i) => {
          const Icon = TYPE_ICONS[t.code] || FileText;
          return (
            <motion.button
              key={t.code}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -2 }}
              onClick={() => setCreating({ type: t.code })}
              className="card group relative overflow-hidden text-left transition-all"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-accent-violet/20 to-accent-pink/20 blur-2xl" />
              <div className="relative flex items-start gap-3">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${TYPE_TONES[t.code]}`}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-sm font-semibold">{t.label}</div>
                  <div className="mt-0.5 text-[11px] leading-snug text-white/55">
                    {t.description}
                  </div>
                </div>
              </div>
              <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-brand-300 group-hover:text-brand-200">
                <Plus size={12} /> Request
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={14} className="text-white/55" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search student, ID, certificate no…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-white/55" />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">Any type</option>
            {types.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">Any status</option>
            {(data?.statuses || []).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => setCreating(true)} className="btn-primary px-3 py-2 text-sm">
            <Plus size={14} /> New request
          </button>
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
          No documents match. Click a type above to raise the first request.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((d, i) => (
            <Row
              key={d.id}
              d={d}
              idx={i}
              types={types}
              canIssue={canIssue}
              onChanged={onChanged}
              onPick={setPicked}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {creating && (
          <NewDocumentModal
            types={types}
            initialType={typeof creating === "object" ? creating.type : null}
            onClose={() => setCreating(false)}
            onCreated={() => {
              setCreating(false);
              refetch();
            }}
          />
        )}
        {picked && (
          <DocumentDetailModal
            doc={picked}
            types={types}
            canIssue={canIssue}
            onClose={() => setPicked(null)}
            onChanged={onChanged}
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

function Row({ d, idx, types, canIssue, onPick, onChanged }) {
  const TypeIcon = TYPE_ICONS[d.type] || FileText;
  const StatusIcon = STATUS_ICONS[d.status];
  const typeMeta = types.find((t) => t.code === d.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx, 16) * 0.02 }}
      onClick={() => onPick(d)}
      className="group flex cursor-pointer flex-col gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-3 transition-all hover:border-white/15 hover:bg-white/[0.06] md:flex-row md:items-center"
    >
      <div className="flex items-center gap-3 md:w-72">
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ${TYPE_TONES[d.type]}`}>
          <TypeIcon size={14} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-sm font-semibold">
            {typeMeta?.label || d.type}
          </div>
          <div className="text-[11px] text-white/45">{d.id}</div>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm">
          <span className="text-white/85">{d.studentName}</span>
          <span className="ml-1 text-white/45">
            · {d.studentId}
            {d.studentGrade ? ` · Grade ${d.studentGrade}-${d.studentSection}` : ""}
          </span>
        </div>
        <div className="mt-0.5 truncate text-[11px] text-white/45">
          {d.purpose}
        </div>
      </div>
      <div className="flex items-center gap-2 md:w-72 md:justify-end">
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${STATUS_TONES[d.status]}`}>
          <StatusIcon size={11} />
          {d.status}
        </span>
        <div className="hidden text-right text-[11px] text-white/45 md:block">
          <div>req {d.requestedOn}</div>
          {d.issuedOn && <div className="text-emerald-300/70">issued {d.issuedOn}</div>}
        </div>
        {d.status === "Issued" && (
          <Link
            to={`/print/documents/${d.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-medium hover:bg-white/10"
            title="Print certificate"
          >
            <Printer size={12} /> Print
          </Link>
        )}
      </div>
    </motion.div>
  );
}

function DocumentDetailModal({ doc, types, canIssue, onClose, onChanged }) {
  const typeMeta = types.find((t) => t.code === doc.type);
  const TypeIcon = TYPE_ICONS[doc.type] || FileText;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [reason, setReason] = useState(doc.rejectionReason || "");
  const [note, setNote] = useState(doc.notes || "");

  const update = async (patch) => {
    setBusy(true);
    setErr(null);
    try {
      const updated = await endpoints.documentUpdate(doc.id, patch);
      onChanged({ ...doc, ...updated });
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  const next =
    doc.status === "Requested"
      ? "Approved"
      : doc.status === "Approved"
      ? "Issued"
      : null;

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
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a0a1e] via-[#0d0d2a] to-[#101044] shadow-glow"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-accent-violet/30 to-accent-pink/30 blur-3xl" />
        <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white">
          <X size={18} />
        </button>

        <div className="relative p-6">
          <div className="flex items-center gap-3">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${TYPE_TONES[doc.type]}`}>
              <TypeIcon size={18} />
            </span>
            <div>
              <div className="font-display text-lg font-bold">{typeMeta?.label || doc.type}</div>
              <div className="text-xs text-white/55">{doc.id} · requested {doc.requestedOn}</div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="text-[11px] uppercase tracking-wider text-white/55">For student</div>
            <div className="mt-1 text-sm">
              <span className="font-medium">{doc.studentName}</span>
              <span className="ml-1 text-white/45">
                · {doc.studentId}
                {doc.studentGrade ? ` · Grade ${doc.studentGrade}-${doc.studentSection}` : ""}
              </span>
            </div>
            <div className="mt-2 text-[11px] uppercase tracking-wider text-white/55">Purpose</div>
            <div className="text-sm text-white/85">{doc.purpose}</div>
            {doc.certificateNo && (
              <>
                <div className="mt-2 text-[11px] uppercase tracking-wider text-white/55">Certificate No.</div>
                <div className="font-mono text-xs text-emerald-300">{doc.certificateNo}</div>
              </>
            )}
            {doc.issuedOn && (
              <div className="mt-2 text-[11px] text-emerald-300/70">
                Issued on {doc.issuedOn} by {doc.issuedBy}
              </div>
            )}
            {doc.rejectionReason && (
              <div className="mt-2 rounded-lg bg-rose-500/10 px-2 py-1 text-[11px] text-rose-300 ring-1 ring-rose-400/30">
                Rejected — {doc.rejectionReason}
              </div>
            )}
          </div>

          {canIssue ? (
            <div className="mt-4 space-y-3">
              <div className="text-[11px] uppercase tracking-wider text-white/55">
                Office actions
              </div>
              <div className="flex flex-wrap gap-2">
                {next && (
                  <button
                    disabled={busy}
                    onClick={() => update({ status: next })}
                    className="btn-primary px-3 py-1.5 text-xs"
                  >
                    {next === "Approved" ? <ShieldCheck size={12} /> : <CheckCircle2 size={12} />}
                    Mark {next}
                  </button>
                )}
                {doc.status !== "Issued" && doc.status !== "Rejected" && (
                  <button
                    disabled={busy || !reason.trim()}
                    onClick={() => update({ status: "Rejected", reason: reason.trim() })}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
                  >
                    <XCircle size={12} /> Reject
                  </button>
                )}
                {doc.status === "Issued" && (
                  <Link
                    to={`/print/documents/${doc.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                  >
                    <Printer size={12} /> Open print view
                  </Link>
                )}
              </div>
              {doc.status !== "Issued" && doc.status !== "Rejected" && (
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason (required to reject)"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs outline-none focus:border-rose-400/60"
                />
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-[11px] text-white/55">
              Only admin / principal / HR can issue or reject documents.
              {doc.status === "Issued" && (
                <Link
                  to={`/print/documents/${doc.id}`}
                  className="ml-2 inline-flex items-center gap-1 text-emerald-300 hover:underline"
                >
                  <Printer size={11} /> Open print view
                </Link>
              )}
            </div>
          )}

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

function NewDocumentModal({ types, initialType, onClose, onCreated }) {
  const [form, setForm] = useState({
    studentId: "",
    type: initialType || types[0]?.code || "BONAFIDE",
    purpose: "",
    notes: "",
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

  // Live student lookup — typed-in query → debounced search
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
  const typeMeta = types.find((t) => t.code === form.type);
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
      await endpoints.documentAdd(form);
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
          New document request
        </div>
        <div className="font-display text-xl font-bold">
          Request a certificate
        </div>

        <div className="mt-5 space-y-3">
          <Field label="Document type">
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
            >
              {types.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
            </select>
            {typeMeta && (
              <div className="mt-1 text-[11px] text-white/45">{typeMeta.description}</div>
            )}
          </Field>

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
                placeholder="Type student name or ID…"
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

          <Field label="Purpose">
            <input
              value={form.purpose}
              onChange={(e) => set("purpose", e.target.value)}
              placeholder={typeMeta?.requiresReason ? "e.g. Passport application" : "Optional"}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
              required={typeMeta?.requiresReason}
            />
          </Field>

          <Field label="Notes (optional)">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
            />
          </Field>
        </div>

        {err && (
          <div className="mt-3 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
            {err}
          </div>
        )}

        <button disabled={busy} className="btn-primary mt-5 w-full">
          {busy ? "Submitting…" : "Submit request"}
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
