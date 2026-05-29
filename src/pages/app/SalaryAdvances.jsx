import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HandCoins,
  Wallet,
  TrendingDown,
  CheckCircle2,
  Search,
  Filter,
  X,
  Plus,
  Ban,
  ArrowDownUp,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import Portal from "../../components/ui/Portal.jsx";
import { PageHeader } from "./Students.jsx";

const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

const ADVANCE_TONES = {
  Active: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  Cleared: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Cancelled: "bg-white/10 text-white/55 ring-white/20",
};

const SORTS = [
  { value: "recent", label: "Most recent" },
  { value: "outstanding", label: "Highest balance" },
  { value: "amount", label: "Largest amount" },
  { value: "name", label: "Name (A–Z)" },
];

export default function SalaryAdvances() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("Active");
  const [dept, setDept] = useState("all");
  const [sort, setSort] = useState("recent");
  const [granting, setGranting] = useState(null); // null | {} (blank) | staff
  const [busyId, setBusyId] = useState(null);
  const [actionErr, setActionErr] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const { data, loading, error, refetch } = useApi(
    () => endpoints.payrollAdvances({ q: debounced, status, category: dept, sort }),
    [debounced, status, dept, sort]
  );
  // Roster powers the staff picker in the grant modal.
  const { data: roster } = useApi(() => endpoints.payroll({}), []);
  useRealtime("payroll.changed", () => refetch());

  const summary = data?.summary;
  const statuses = ["all", ...(data?.statuses || [])];
  const departments = ["all", ...(data?.departments || [])];
  const methods = data?.methods || ["Bank Transfer", "Cash", "UPI"];
  const items = data?.items || [];

  const cancel = async (id) => {
    setBusyId(id);
    setActionErr(null);
    try {
      await endpoints.payrollAdvanceCancel(id);
      refetch();
    } catch (e) {
      setActionErr(e.response?.data?.error || e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Finance"
        title="Salary Advances"
        subtitle={
          summary
            ? `${summary.activeCount} active · ${inr(summary.outstanding)} outstanding`
            : "Loading…"
        }
        actions={
          <button onClick={() => setGranting({})} className="btn-primary px-3 py-2 text-sm">
            <Plus size={14} /> Grant advance
          </button>
        }
      />

      {error && <ErrorState error={error} onRetry={refetch} />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard icon={HandCoins} label="Outstanding" value={summary ? inr(summary.outstanding) : "—"} tint="from-amber-500/30" />
        <KpiCard icon={Wallet} label="Active advances" value={summary ? summary.activeCount : "—"} tint="from-brand-500/30" />
        <KpiCard icon={TrendingDown} label="Monthly recovery" value={summary ? inr(summary.monthlyRecovery) : "—"} tint="from-rose-500/30" />
        <KpiCard icon={CheckCircle2} label="Recovered to date" value={summary ? inr(summary.recovered) : "—"} tint="from-emerald-500/30" />
      </div>

      <div className="card flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={16} className="text-white/60" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search staff, ID or reason…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-white/55" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
            {statuses.map((s) => (
              <option key={s} value={s}>{s === "all" ? "All statuses" : s}</option>
            ))}
          </select>
          <select value={dept} onChange={(e) => setDept(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
            {departments.map((d) => (
              <option key={d} value={d}>{d === "all" ? "All departments" : d}</option>
            ))}
          </select>
          <div className="flex items-center gap-1.5">
            <ArrowDownUp size={14} className="text-white/55" />
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {actionErr && (
        <div className="rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">{actionErr}</div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3 text-[11px] uppercase tracking-wider text-white/55">
          <span>Advances</span>
          <span>{loading ? "…" : `${items.length} shown`}</span>
        </div>
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-white/40">
            No advances match these filters. Try widening the status or department, or grant a new advance.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {items.map((a, i) => {
              const pct = a.amount ? Math.min(100, Math.round((a.recovered / a.amount) * 100)) : 0;
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.015, 0.3) }}
                  className="flex flex-col gap-3 px-5 py-3 hover:bg-white/[0.02] md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-accent-pink font-display text-xs font-bold">
                      {a.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{a.staffName}</span>
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${ADVANCE_TONES[a.status]}`}>{a.status}</span>
                        <span className="text-[11px] text-white/40">{a.staffId} · {a.id}</span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-white/50">
                        {a.role}{a.department ? ` · ${a.department}` : ""} · granted {a.grantedOn} by {a.grantedBy}
                        {a.reason ? ` · ${a.reason}` : ""}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1.5 w-44 max-w-full overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] text-white/50">
                          {inr(a.recovered)} / {inr(a.amount)}{a.balance > 0 ? ` · ${inr(a.balance)} left` : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 md:justify-end">
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-white/45">Per month</div>
                      <div className="font-display text-sm">{inr(a.perInstallment)}</div>
                      <div className="text-[10px] text-white/40">{a.installments} mo · {a.disbursementMethod}</div>
                    </div>
                    {a.status === "Active" && (
                      <button
                        disabled={busyId === a.id}
                        onClick={() => cancel(a.id)}
                        className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-1 text-[11px] font-medium text-rose-300 ring-1 ring-rose-400/20 hover:bg-rose-500/20 disabled:opacity-50"
                      >
                        <Ban size={12} /> Cancel
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {granting && (
          <GrantAdvanceModal
            preset={granting.id ? granting : null}
            staff={roster?.items || []}
            methods={methods}
            onClose={() => setGranting(null)}
            onSaved={() => { setGranting(null); refetch(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, tint }) {
  return (
    <div className="card relative overflow-hidden">
      <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${tint} to-transparent blur-2xl`} />
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

// Grant a salary advance to a staff member (BRD 7.8). Exported so the Payroll
// page can offer a per-row quick-grant shortcut.
export function GrantAdvanceModal({ preset, staff, methods, onClose, onSaved }) {
  const [staffId, setStaffId] = useState(preset?.id || "");
  const [amount, setAmount] = useState("");
  const [installments, setInstallments] = useState("6");
  const selected = staff.find((s) => s.id === staffId) || preset || null;
  const [method, setMethod] = useState(preset?.paymentMethod || "Bank Transfer");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const cls = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60";

  const amt = Number(amount) || 0;
  const inst = Math.max(1, Number(installments) || 1);
  const perMonth = amt > 0 ? Math.ceil(amt / inst) : 0;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await endpoints.payrollAdvanceGrant({
        staffId,
        amount: amt,
        installments: inst,
        disbursementMethod: method,
        reason: reason.trim() || null,
      });
      onSaved();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Portal>
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur"
      onClick={onClose}
    >
      <motion.form
        initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()} onSubmit={submit}
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a0a1e] via-[#0d0d2a] to-[#101044] p-6 shadow-glow"
      >
        <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"><X size={18} /></button>
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/55">Salary advance</div>
        <div className="font-display text-xl font-bold">Grant advance</div>

        <div className="mt-4 space-y-3">
          <label className="block">
            <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">Staff member</div>
            {preset ? (
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                {preset.name} <span className="text-white/45">· {preset.role} · {preset.id}</span>
              </div>
            ) : (
              <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className={cls} required>
                <option value="">Select staff…</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} · {s.role}</option>
                ))}
              </select>
            )}
          </label>

          {selected?.advances?.outstanding > 0 && (
            <div className="rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] text-amber-300 ring-1 ring-amber-400/25">
              Already has {inr(selected.advances.outstanding)} outstanding ({inr(selected.advances.monthly)}/mo).
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">Amount (₹)</div>
              <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className={cls} required />
            </label>
            <label className="block">
              <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">Installments (mo)</div>
              <input type="number" min="1" max="60" value={installments} onChange={(e) => setInstallments(e.target.value)} className={cls} required />
            </label>
          </div>

          <label className="block">
            <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">Disburse via</div>
            <div className="flex flex-wrap gap-1.5">
              {methods.map((m) => (
                <button type="button" key={m} onClick={() => setMethod(m)} className={`rounded-md px-2.5 py-1 text-xs font-medium ring-1 transition-all ${method === m ? "bg-gradient-to-r from-brand-500/30 to-accent-violet/20 text-white ring-white/25" : "bg-white/5 text-white/65 ring-white/10 hover:bg-white/10"}`}>{m}</button>
              ))}
            </div>
          </label>

          <label className="block">
            <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">Reason (optional)</div>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Medical, festival, relocation…" className={cls} maxLength={200} />
          </label>
        </div>

        {amt > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-gradient-to-r from-amber-500/15 to-emerald-500/10 px-4 py-3">
            <div className="text-xs text-white/60">Monthly recovery</div>
            <div className="font-display text-lg font-bold glow-text">{inr(perMonth)} <span className="text-xs font-normal text-white/50">/mo × {inst}</span></div>
          </div>
        )}

        {err && <div className="mt-3 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">{err}</div>}
        <button disabled={busy} className="btn-primary mt-4 w-full">{busy ? "Granting…" : "Grant advance"}</button>
      </motion.form>
    </motion.div>
    </Portal>
  );
}
