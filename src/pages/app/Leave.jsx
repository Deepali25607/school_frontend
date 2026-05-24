import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Check,
  X,
  Calendar,
  Clock,
  Sparkles as SparklesIcon,
  AlertTriangle,
  CalendarDays,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const STATUS_TONES = {
  Pending: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  Approved: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Rejected: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

const TYPE_TONES = {
  Sick: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  Casual: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  Earned: "bg-accent-violet/15 text-purple-200 ring-accent-violet/30",
  Maternity: "bg-accent-pink/15 text-pink-200 ring-accent-pink/30",
  Personal: "bg-accent-cyan/15 text-cyan-200 ring-accent-cyan/30",
  Study: "bg-accent-gold/15 text-amber-200 ring-accent-gold/30",
};

export default function Leave() {
  const { user } = useAuth();
  const canApprove = ["admin", "principal", "hr"].includes(user?.role);
  const [tab, setTab] = useState(canApprove ? "queue" : "history");
  const [applying, setApplying] = useState(false);

  const all = useApi(endpoints.leave, []);

  const items = all.data?.items || [];
  const summary = all.data?.summary;

  const pending = items.filter((r) => r.status === "Pending");
  const decided = items.filter((r) => r.status !== "Pending");

  const onDecide = async (id, status) => {
    await endpoints.leaveDecide(id, status);
    all.refetch();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="HR"
        title="Leave Management"
        subtitle="Apply for leave, track approvals, manage balances"
      />

      {all.error && <ErrorState error={all.error} onRetry={all.refetch} />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Pending" value={all.loading ? "—" : summary?.pending} tint="from-amber-500/30" pulse={summary?.pending > 0} />
        <StatTile label="Approved" value={all.loading ? "—" : summary?.approved} tint="from-emerald-500/30" />
        <StatTile label="Rejected" value={all.loading ? "—" : summary?.rejected} tint="from-rose-500/30" />
        <StatTile label="Total" value={all.loading ? "—" : summary?.total} tint="from-brand-500/30" />
      </div>

      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {(canApprove
            ? [
                { k: "queue", label: `Approval queue (${pending.length})` },
                { k: "history", label: "All history" },
              ]
            : [{ k: "history", label: "My requests" }]
          ).map((t) => (
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
        <button onClick={() => setApplying(true)} className="btn-primary px-3 py-2 text-sm">
          <Plus size={14} /> Apply for leave
        </button>
      </div>

      {tab === "queue" && canApprove && (
        <QueueTab
          items={pending}
          loading={all.loading}
          onDecide={onDecide}
        />
      )}

      {tab === "history" && (
        <HistoryTab items={decided} loading={all.loading} canApprove={canApprove} onDecide={onDecide} />
      )}

      <AnimatePresence>
        {applying && (
          <ApplyModal
            onClose={() => setApplying(false)}
            onApplied={() => {
              setApplying(false);
              all.refetch();
            }}
            currentUser={user}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatTile({ label, value, tint, pulse }) {
  return (
    <div className="card relative overflow-hidden">
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${tint} to-transparent blur-2xl ${
          pulse ? "animate-pulse" : ""
        }`}
      />
      <div className="relative">
        <div className="text-xs uppercase tracking-wider text-white/55">{label}</div>
        <div className="stat-num glow-text">{value}</div>
      </div>
    </div>
  );
}

function QueueTab({ items, loading, onDecide }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-44" />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="card text-center text-white/55">
        <SparklesIcon className="mx-auto mb-2 text-accent-gold" size={20} />
        All clear — no pending leave requests.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((r, i) => (
        <RequestCard key={r.id} r={r} idx={i} onDecide={onDecide} actions />
      ))}
    </div>
  );
}

function HistoryTab({ items, loading, canApprove, onDecide }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return <div className="card text-center text-white/55">Nothing here yet.</div>;
  }
  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-left text-[11px] uppercase tracking-wider text-white/55">
            <tr>
              <th className="px-5 py-3">Applicant</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">From → To</th>
              <th className="px-5 py-3 text-right">Days</th>
              <th className="px-5 py-3">Reason</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Decided by</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r, i) => (
              <motion.tr
                key={r.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.015 }}
                className="border-t border-white/5 hover:bg-white/[0.025]"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-accent-pink font-display text-[10px] font-bold">
                      {r.avatar}
                    </div>
                    <div>
                      <div className="font-medium">{r.applicantName}</div>
                      <div className="text-[10px] text-white/50">
                        {r.applicantId} · {r.applicantType}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${TYPE_TONES[r.type] || ""}`}>
                    {r.type}
                  </span>
                </td>
                <td className="px-5 py-3 text-white/70 tabular-nums">
                  {r.fromDate} → {r.toDate}
                </td>
                <td className="px-5 py-3 text-right font-display">{r.days}</td>
                <td className="px-5 py-3 max-w-[240px] truncate text-white/70" title={r.reason}>
                  {r.reason}
                </td>
                <td className="px-5 py-3">
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${STATUS_TONES[r.status]}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-white/65">
                  {r.decidedBy || "—"}
                  {r.decidedOn && (
                    <div className="text-[10px] text-white/40">{r.decidedOn}</div>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RequestCard({ r, idx, onDecide, actions }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      whileHover={{ y: -3 }}
      className="card relative overflow-hidden"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-brand-500/20 to-accent-pink/20 blur-2xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-pink font-display text-sm font-bold">
              {r.avatar}
            </div>
            <div>
              <div className="font-display font-semibold">{r.applicantName}</div>
              <div className="text-[10px] uppercase tracking-wider text-white/55">
                {r.applicantId} · {r.applicantType}
              </div>
            </div>
          </div>
          <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${TYPE_TONES[r.type] || ""}`}>
            {r.type}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <Meta icon={CalendarDays} label="From" value={r.fromDate} />
          <Meta icon={CalendarDays} label="To" value={r.toDate} />
          <Meta icon={Clock} label="Duration" value={`${r.days} day${r.days > 1 ? "s" : ""}`} />
          <Meta icon={Calendar} label="Applied" value={r.appliedOn} />
        </div>

        <div className="mt-3 rounded-lg border border-white/5 bg-white/[0.03] p-2 text-sm">
          <div className="text-[10px] uppercase tracking-wider text-white/55">
            Reason
          </div>
          <div className="text-white/85">{r.reason}</div>
        </div>

        {actions && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => onDecide(r.id, "Approved")}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-300 transition-all hover:bg-emerald-500/25"
            >
              <Check size={14} /> Approve
            </button>
            <button
              onClick={() => onDecide(r.id, "Rejected")}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-300 transition-all hover:bg-rose-500/15"
            >
              <X size={14} /> Reject
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Meta({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-white/45">
        <Icon size={9} /> {label}
      </div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function ApplyModal({ onClose, onApplied, currentUser }) {
  const isStaff = ["teacher", "hr", "accountant"].includes(currentUser?.role);
  const [form, setForm] = useState({
    applicantId: currentUser?.role === "student" ? "STU1003" : "",
    applicantType: isStaff ? "teacher" : currentUser?.role === "student" ? "student" : "student",
    applicantName: currentUser?.name || "",
    type: "Sick",
    fromDate: new Date().toISOString().slice(0, 10),
    toDate: new Date().toISOString().slice(0, 10),
    reason: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await endpoints.leaveApply(form);
      onApplied();
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
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X size={16} />
        </button>
        <div className="mb-1 text-xs uppercase tracking-[0.2em] text-white/55">
          Apply for leave
        </div>
        <div className="font-display text-xl font-bold">Request</div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Field label="Name" full>
            <input
              value={form.applicantName}
              onChange={(e) => set("applicantName", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
              required
            />
          </Field>
          <Field label="ID">
            <input
              value={form.applicantId}
              onChange={(e) => set("applicantId", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
              placeholder="STU1003 or TCH101"
              required
            />
          </Field>
          <Field label="As">
            <select
              value={form.applicantType}
              onChange={(e) => set("applicantType", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher / Staff</option>
            </select>
          </Field>
          <Field label="Type">
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
            >
              {["Sick", "Casual", "Earned", "Maternity", "Personal", "Study"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="From">
            <input
              type="date"
              value={form.fromDate}
              onChange={(e) => set("fromDate", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
              required
            />
          </Field>
          <Field label="To">
            <input
              type="date"
              value={form.toDate}
              onChange={(e) => set("toDate", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
              required
            />
          </Field>
          <Field label="Reason" full>
            <textarea
              value={form.reason}
              onChange={(e) => set("reason", e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
              required
            />
          </Field>
        </div>

        {err && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
            <AlertTriangle size={12} className="mt-0.5" />
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

function Field({ label, full, children }) {
  return (
    <label className={full ? "col-span-2 block" : "block"}>
      <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">
        {label}
      </div>
      {children}
    </label>
  );
}
