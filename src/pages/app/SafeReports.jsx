import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LifeBuoy,
  ShieldAlert,
  ShieldCheck,
  Send,
  Eye,
  EyeOff,
  Hash,
  Flag,
  Siren,
  Sparkles as SparklesIcon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquareWarning,
  X,
  Search,
  Filter,
  Copy,
  Lock,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const CATEGORIES = [
  "Bullying",
  "Safety concern",
  "Harassment",
  "Mental health",
  "Academic stress",
  "Facilities issue",
  "Other",
];

const SEVERITIES = [
  { id: "low", label: "Low", tone: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30" },
  { id: "medium", label: "Medium", tone: "bg-amber-500/15 text-amber-200 ring-amber-400/30" },
  { id: "high", label: "High", tone: "bg-orange-500/15 text-orange-200 ring-orange-400/30" },
  { id: "critical", label: "Critical", tone: "bg-rose-500/15 text-rose-300 ring-rose-400/30" },
];

const STATUSES = ["received", "investigating", "resolved", "closed"];

const STATUS_TONES = {
  received: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
  investigating: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  resolved: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  closed: "bg-white/5 text-white/55 ring-white/10",
};

export default function SafeReports() {
  const { user } = useAuth();
  const isLead = ["admin", "principal", "hr"].includes(user?.role);

  const [tab, setTab] = useState(isLead ? "queue" : "submit");

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Wellbeing"
        title="Safe space"
        subtitle={
          isLead
            ? "Confidential reports from students, parents and staff — triage with care."
            : "Tell us what's wrong. You can stay anonymous — we'll give you a tracking code so you can follow up."
        }
      />

      <div className="card flex flex-wrap items-center gap-2">
        {[
          { k: "submit", label: "Submit a report", show: true },
          { k: "track", label: "Track by code", show: true },
          { k: "mine", label: "My reports", show: !isLead },
          { k: "queue", label: "Triage queue", show: isLead },
        ]
          .filter((t) => t.show)
          .map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`rounded-xl px-3 py-1.5 text-sm transition-all ${
                tab === t.k
                  ? "bg-gradient-to-r from-brand-500/30 to-accent-violet/20 text-white ring-1 ring-white/15"
                  : "text-white/65 hover:bg-white/5 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "submit" && (
          <motion.div key="submit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <SubmitView />
          </motion.div>
        )}
        {tab === "track" && (
          <motion.div key="track" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <TrackView />
          </motion.div>
        )}
        {tab === "mine" && !isLead && (
          <motion.div key="mine" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <MineView />
          </motion.div>
        )}
        {tab === "queue" && isLead && (
          <motion.div key="queue" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <QueueView />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============== SUBMIT ==============

function SubmitView() {
  const [category, setCategory] = useState("Bullying");
  const [severity, setSeverity] = useState("medium");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [submitted, setSubmitted] = useState(null);
  const [copied, setCopied] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const rec = await endpoints.safeReportSubmit({
        category,
        severity,
        subject: subject.trim(),
        description: description.trim(),
        anonymous,
      });
      setSubmitted(rec);
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  const copyCode = async () => {
    if (!submitted?.code) return;
    try {
      await navigator.clipboard.writeText(submitted.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore — non-secure context
    }
  };

  if (submitted) {
    return (
      <div className="card relative overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-emerald-500/30 to-transparent blur-3xl" />
        <div className="relative space-y-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/30">
            <CheckCircle2 size={24} className="text-emerald-300" />
          </div>
          <div>
            <div className="font-display text-2xl font-bold text-white">
              Report received
            </div>
            <p className="mt-1 max-w-xl text-sm text-white/70">
              A safeguarding lead will pick this up shortly.{" "}
              {submitted.anonymous
                ? "Your identity was not recorded — please save the tracking code below."
                : "You can follow progress under My reports."}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
            <div className="text-xs uppercase tracking-wider text-emerald-200/85">
              Tracking code
            </div>
            <div className="mt-1 flex items-center gap-3">
              <code className="font-mono text-2xl font-bold tracking-wider text-emerald-200">
                {submitted.code}
              </code>
              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/65 hover:bg-white/10"
              >
                <Copy size={11} /> {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-2 text-xs text-emerald-100/75">
              Save this somewhere safe. You'll need it to check status under
              "Track by code".
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setSubmitted(null);
                setSubject("");
                setDescription("");
              }}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 hover:bg-white/10"
            >
              File another report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div className="rounded-xl border border-brand-400/25 bg-brand-500/10 p-3 text-xs text-brand-100/85">
        <div className="flex items-center gap-2 font-semibold text-brand-200">
          <Lock size={12} /> Confidential channel
        </div>
        <p className="mt-1">
          Whatever you write here is read by trained safeguarding leads
          (admin / principal / HR) only. You can write anonymously — we
          will not record your identity.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Field label="Category">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/50"
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Severity">
          <div className="flex flex-wrap gap-1.5">
            {SEVERITIES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSeverity(s.id)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium ring-1 transition ${
                  severity === s.id ? s.tone : "bg-white/5 text-white/55 ring-white/10 hover:bg-white/10"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Identity">
          <button
            type="button"
            onClick={() => setAnonymous((v) => !v)}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              anonymous
                ? "border-accent-violet/40 bg-accent-violet/15 text-purple-200"
                : "border-white/10 bg-white/5 text-white/65"
            }`}
          >
            {anonymous ? <EyeOff size={14} /> : <Eye size={14} />}
            {anonymous ? "Anonymous" : "Submit with name"}
          </button>
        </Field>
      </div>

      <Field label="Subject">
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          maxLength={140}
          placeholder="One-line summary"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-brand-400/50"
        />
      </Field>

      <Field label="What happened?">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          maxLength={4000}
          rows={8}
          placeholder="Share what you saw, heard or experienced. Times, places, people involved — anything you're comfortable sharing helps."
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-brand-400/50"
        />
        <div className="mt-1 text-right text-[10px] text-white/40">
          {description.length}/4000
        </div>
      </Field>

      {err && (
        <div className="flex items-start gap-2 rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-400/30">
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
          <span>{err}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-[11px] text-white/45">
          Severity helps us prioritise — when in doubt, pick higher.
        </div>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-500 to-accent-violet px-4 py-2 text-sm font-semibold text-white shadow shadow-brand-500/20 disabled:opacity-50"
        >
          <Send size={14} /> {busy ? "Filing…" : "Submit report"}
        </button>
      </div>
    </form>
  );
}

// ============== TRACK ==============

function TrackView() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [rec, setRec] = useState(null);

  const lookup = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setRec(null);
    try {
      const r = await endpoints.safeReportLookup(code.trim());
      setRec(r);
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={lookup} className="card">
        <Field label="Tracking code">
          <div className="flex gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <Hash size={14} className="text-white/55" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                placeholder="XXXX-XXXX"
                className="flex-1 bg-transparent font-mono text-sm tracking-wider text-white outline-none placeholder:text-white/40"
              />
            </div>
            <button
              type="submit"
              disabled={busy || !code.trim()}
              className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-brand-500 to-accent-violet px-4 py-2 text-sm font-semibold text-white shadow shadow-brand-500/20 disabled:opacity-50"
            >
              <Search size={14} /> Look up
            </button>
          </div>
        </Field>

        {err && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-400/30">
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
            <span>{err}</span>
          </div>
        )}
      </form>

      {rec && <PublicReportView rec={rec} />}
    </div>
  );
}

function PublicReportView({ rec }) {
  return (
    <div className="card space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-white/45">
            <span className="font-mono">{rec.code}</span> · {rec.category}
          </div>
          <div className="mt-1 font-display text-xl font-bold">
            {rec.subject}
          </div>
        </div>
        <span
          className={`rounded-md px-2 py-0.5 text-[10px] font-medium ring-1 ${STATUS_TONES[rec.status]}`}
        >
          {rec.status}
        </span>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/80">
        {rec.description}
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-wider text-white/55">
          Progress
        </div>
        <div className="space-y-2">
          {rec.statusHistory.map((h, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 text-xs"
            >
              <div className="grid h-6 w-6 place-items-center rounded-md bg-brand-500/20 text-brand-200">
                <Flag size={11} />
              </div>
              <span className="font-medium text-white">
                {h.fromStatus ? `${h.fromStatus} → ${h.toStatus}` : h.toStatus}
              </span>
              {h.note && <span className="text-white/55">· {h.note}</span>}
              <span className="ml-auto text-white/40">
                {new Date(h.at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Responses */}
      {rec.responses?.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wider text-white/55">
            Responses from safeguarding team
          </div>
          {rec.responses.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-brand-400/25 bg-brand-500/10 p-3 text-sm"
            >
              <div className="flex items-center gap-2 text-[11px] text-brand-100/75">
                <ShieldCheck size={12} /> {r.byName} ({r.byRole}) ·{" "}
                {new Date(r.at).toLocaleString()}
              </div>
              <div className="mt-1 whitespace-pre-wrap text-white/85">
                {r.text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============== MINE ==============

function MineView() {
  const { data, loading, error, refetch } = useApi(endpoints.safeReportsMine, []);
  useRealtime("safe-reports.changed", refetch);

  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (loading)
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );

  const items = data?.items || [];
  if (items.length === 0) {
    return (
      <div className="card text-center text-white/55">
        <SparklesIcon className="mx-auto mb-2 text-accent-gold" size={20} />
        Reports you file with your name attached will show up here. Anonymous
        reports stay hidden by design — track them with the code instead.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((r) => (
        <PublicReportView key={r.id} rec={r} />
      ))}
    </div>
  );
}

// ============== STAFF QUEUE ==============

function QueueView() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const { data, loading, error, refetch } = useApi(
    () => endpoints.safeReports({ q: debounced, status, category, severity }),
    [debounced, status, category, severity]
  );
  useRealtime("safe-reports.changed", refetch);

  const items = data?.items || [];
  const summary = data?.summary;

  return (
    <div className="space-y-4">
      {error && <ErrorState error={error} onRetry={refetch} />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatTile icon={LifeBuoy} label="All reports" value={summary?.total ?? 0} tint="from-brand-500/30" />
        <StatTile icon={Clock} label="Received" value={summary?.byStatus?.received ?? 0} tint="from-amber-500/30" />
        <StatTile icon={MessageSquareWarning} label="Investigating" value={summary?.byStatus?.investigating ?? 0} tint="from-accent-violet/30" />
        <StatTile icon={CheckCircle2} label="Resolved" value={summary?.byStatus?.resolved ?? 0} tint="from-emerald-500/30" />
        <StatTile icon={Siren} label="Open critical" value={summary?.openCritical ?? 0} tint="from-rose-500/30" pulse={(summary?.openCritical || 0) > 0} />
      </div>

      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={14} className="text-white/55" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search subject, body or code…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-white/55" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
            <option value="all">Any status</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
            <option value="all">Any category</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
            <option value="all">Any severity</option>
            {SEVERITIES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center text-white/55">
          <SparklesIcon className="mx-auto mb-2 text-accent-gold" size={20} />
          Nothing matches these filters.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((r, i) => (
            <QueueRow key={r.id} r={r} idx={i} onOpen={() => setSelectedId(r.id)} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedId && (
          <ReportDrawer
            id={selectedId}
            onClose={() => setSelectedId(null)}
            onChanged={refetch}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function QueueRow({ r, idx, onOpen }) {
  const sev = SEVERITIES.find((s) => s.id === r.severity);
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx, 16) * 0.015 }}
      className="flex w-full flex-col gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-3 text-left hover:bg-white/[0.06] md:flex-row md:items-center"
    >
      <div className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand-500/30 to-accent-violet/30 ring-1 ring-white/10">
          <ShieldAlert size={14} className="text-brand-200" />
        </div>
        <div>
          <div className="flex items-center gap-2 text-xs text-white/55">
            <code className="font-mono">{r.code}</code>
            <span>·</span>
            <span>{r.category}</span>
          </div>
          <div className="text-sm font-semibold text-white">{r.subject}</div>
        </div>
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-2 text-[11px]">
        {r.anonymous && (
          <span className="inline-flex items-center gap-1 rounded-md bg-accent-violet/15 px-2 py-0.5 text-purple-200 ring-1 ring-accent-violet/30">
            <EyeOff size={11} /> anonymous
          </span>
        )}
        {!r.anonymous && r.reporterName && (
          <span className="text-white/65">{r.reporterName}</span>
        )}
        {r.reporterRole && (
          <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-white/55 ring-1 ring-white/10">
            {r.reporterRole}
          </span>
        )}
        <span className={`rounded-md px-2 py-0.5 ring-1 ${sev?.tone || ""}`}>
          {sev?.label || r.severity}
        </span>
        <span className={`rounded-md px-2 py-0.5 ring-1 ${STATUS_TONES[r.status]}`}>
          {r.status}
        </span>
        <span className="text-white/40">
          {new Date(r.createdAt).toLocaleDateString()}
        </span>
      </div>
    </motion.button>
  );
}

function ReportDrawer({ id, onClose, onChanged }) {
  const { data, loading, error, refetch } = useApi(
    () => endpoints.safeReport(id),
    [id]
  );

  const [statusDraft, setStatusDraft] = useState(null);
  const [statusNote, setStatusNote] = useState("");
  const [respText, setRespText] = useState("");
  const [respAudience, setRespAudience] = useState("reporter");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (data) {
      setStatusDraft(data.status);
      setStatusNote("");
    }
  }, [data]);

  const saveStatus = async () => {
    if (!statusDraft || statusDraft === data.status) return;
    setBusy(true);
    setErr(null);
    try {
      await endpoints.safeReportUpdate(id, {
        status: statusDraft,
        statusNote: statusNote.trim() || undefined,
      });
      await refetch();
      onChanged?.();
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  const sendResponse = async () => {
    if (!respText.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await endpoints.safeReportRespond(id, {
        text: respText.trim(),
        audience: respAudience,
      });
      setRespText("");
      await refetch();
      onChanged?.();
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
    >
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l border-white/10 bg-[#06061a] p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-white/45">
              Report
            </div>
            <div className="flex items-center gap-2 font-mono text-sm text-white/55">
              {data?.id} · {data?.code}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/65 hover:bg-white/10"
          >
            <X size={14} />
          </button>
        </div>

        {error && <ErrorState error={error} onRetry={refetch} />}
        {loading || !data ? (
          <Skeleton className="h-40" />
        ) : (
          <div className="space-y-4">
            <div>
              <div className="font-display text-2xl font-bold text-white">
                {data.subject}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-md bg-white/5 px-2 py-0.5 text-white/65 ring-1 ring-white/10">
                  {data.category}
                </span>
                {(() => {
                  const sev = SEVERITIES.find((s) => s.id === data.severity);
                  return (
                    <span className={`rounded-md px-2 py-0.5 ring-1 ${sev?.tone}`}>
                      {sev?.label || data.severity}
                    </span>
                  );
                })()}
                <span className={`rounded-md px-2 py-0.5 ring-1 ${STATUS_TONES[data.status]}`}>
                  {data.status}
                </span>
                {data.anonymous ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-accent-violet/15 px-2 py-0.5 text-purple-200 ring-1 ring-accent-violet/30">
                    <EyeOff size={11} /> anonymous · {data.reporterRole}
                  </span>
                ) : (
                  <span className="text-white/65">
                    Filed by {data.reporterName} ({data.reporterRole})
                  </span>
                )}
                <span className="text-white/40">
                  {new Date(data.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm whitespace-pre-wrap">
              {data.description}
            </div>

            {/* Status workflow */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-white/55">
                <Flag size={11} /> Status
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusDraft(s)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium ring-1 transition ${
                      statusDraft === s ? STATUS_TONES[s] : "bg-white/5 text-white/55 ring-white/10 hover:bg-white/10"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {statusDraft && statusDraft !== data.status && (
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    maxLength={280}
                    placeholder="Optional note for the audit trail"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
                  />
                  <button
                    type="button"
                    onClick={saveStatus}
                    disabled={busy}
                    className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-brand-500 to-accent-violet px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Apply: {data.status} → {statusDraft}
                  </button>
                </div>
              )}
            </div>

            {/* Status history */}
            <div className="space-y-1.5">
              <div className="text-xs uppercase tracking-wider text-white/55">
                Timeline
              </div>
              {data.statusHistory.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 text-xs"
                >
                  <span className="font-medium text-white">
                    {h.fromStatus ? `${h.fromStatus} → ${h.toStatus}` : h.toStatus}
                  </span>
                  {h.note && <span className="text-white/55">· {h.note}</span>}
                  {h.byRole && (
                    <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-white/55 ring-1 ring-white/10">
                      {h.byRole}
                    </span>
                  )}
                  <span className="ml-auto text-white/40">
                    {new Date(h.at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Responses */}
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-white/55">
                Conversation & notes
              </div>
              {data.responses.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/45">
                  No responses yet.
                </div>
              ) : (
                data.responses.map((rsp) => (
                  <div
                    key={rsp.id}
                    className={`rounded-xl border p-3 text-sm ${
                      rsp.audience === "reporter"
                        ? "border-brand-400/25 bg-brand-500/10"
                        : "border-amber-400/25 bg-amber-500/10"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[11px] text-white/65">
                      {rsp.audience === "reporter" ? (
                        <Send size={11} />
                      ) : (
                        <Lock size={11} />
                      )}
                      <span className="font-medium">
                        {rsp.audience === "reporter"
                          ? "Visible to reporter"
                          : "Internal note"}
                      </span>
                      <span>·</span>
                      <span>
                        {rsp.byName} ({rsp.byRole})
                      </span>
                      <span className="ml-auto text-white/40">
                        {new Date(rsp.at).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1 whitespace-pre-wrap text-white/85">
                      {rsp.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Compose */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-white/55">
                <Send size={11} /> Add response
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRespAudience("reporter")}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium ring-1 transition ${
                    respAudience === "reporter"
                      ? "bg-brand-500/15 text-brand-300 ring-brand-400/30"
                      : "bg-white/5 text-white/55 ring-white/10 hover:bg-white/10"
                  }`}
                >
                  Visible to reporter
                </button>
                <button
                  type="button"
                  onClick={() => setRespAudience("internal")}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium ring-1 transition ${
                    respAudience === "internal"
                      ? "bg-amber-500/15 text-amber-200 ring-amber-400/30"
                      : "bg-white/5 text-white/55 ring-white/10 hover:bg-white/10"
                  }`}
                >
                  Internal note
                </button>
              </div>
              <textarea
                value={respText}
                onChange={(e) => setRespText(e.target.value)}
                rows={4}
                maxLength={4000}
                placeholder={
                  respAudience === "reporter"
                    ? "What you write here will be visible to the reporter under their tracking code."
                    : "Internal-only — visible to safeguarding leads."
                }
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
              />
              <div className="mt-2 flex items-center justify-end gap-2">
                {err && (
                  <span className="text-xs text-rose-300">{err}</span>
                )}
                <button
                  type="button"
                  onClick={sendResponse}
                  disabled={busy || !respText.trim()}
                  className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-brand-500 to-accent-violet px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  <Send size={12} />
                  {busy ? "Sending…" : "Send"}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.aside>
    </motion.div>
  );
}

// ============== SHARED PRIMITIVES ==============

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

function StatTile({ icon: Icon, label, value, tint, pulse }) {
  return (
    <div className="card relative overflow-hidden">
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${tint} to-transparent blur-2xl ${
          pulse ? "animate-pulse" : ""
        }`}
      />
      <div className="relative flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-white/55">
            {label}
          </div>
          <div className="stat-num glow-text">{value}</div>
        </div>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}
