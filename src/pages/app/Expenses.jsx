import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  CheckCircle2,
  XCircle,
  Wallet,
  Clock,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const STATUS_TONES = {
  Pending: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  Approved: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  Paid: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Rejected: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

const inr = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function Expenses() {
  const { data, loading, error, refetch } = useApi(endpoints.expenses, []);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState({ status: "all", category: "all", q: "" });
  const [busyId, setBusyId] = useState(null);
  useRealtime("expenses.changed", () => refetch());

  const items = data?.items || [];
  const summary = data?.summary;

  const filtered = useMemo(() => {
    return items.filter((e) => {
      if (filter.status !== "all" && e.status !== filter.status) return false;
      if (filter.category !== "all" && e.category !== filter.category) return false;
      if (filter.q) {
        const t = filter.q.toLowerCase();
        if (
          !e.title.toLowerCase().includes(t) &&
          !e.vendor.toLowerCase().includes(t) &&
          !e.id.toLowerCase().includes(t)
        )
          return false;
      }
      return true;
    });
  }, [items, filter]);

  const act = async (id, status) => {
    setBusyId(id);
    try {
      await endpoints.expenseSetStatus(id, { status });
      refetch();
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    } finally {
      setBusyId(null);
    }
  };

  const budgetPct = summary?.monthBudget
    ? Math.min(100, Math.round((summary.monthSpend / summary.monthBudget) * 100))
    : 0;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Finance"
        title="Expense Management"
        subtitle="Record expenses, run the approval workflow, pay vendors and track budgets"
      />

      {error && <ErrorState error={error} onRetry={refetch} />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile icon={TrendingUp} label="Spent this month" value={loading ? "—" : inr(summary?.monthSpend)} sub={summary ? `${budgetPct}% of ${inr(summary.monthBudget)} budget` : ""} tint="from-brand-500/30" />
        <StatTile icon={Clock} label="Pending approval" value={loading ? "—" : summary?.pendingCount} sub={summary ? inr(summary.pendingValue) : ""} tint="from-amber-500/30" pulse={summary?.pendingCount > 0} />
        <StatTile icon={Wallet} label="Approved · unpaid" value={loading ? "—" : inr(summary?.approvedUnpaid)} tint="from-accent-violet/30" />
        <StatTile icon={CheckCircle2} label="Total paid" value={loading ? "—" : inr(summary?.totalPaid)} tint="from-emerald-500/30" />
      </div>

      <BudgetReport />

      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={filter.q}
            onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))}
            placeholder="Search title / vendor…"
            className="w-44 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
          />
          <select
            value={filter.status}
            onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm outline-none"
          >
            <option value="all">All statuses</option>
            {(data?.statuses || []).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filter.category}
            onChange={(e) => setFilter((f) => ({ ...f, category: e.target.value }))}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm outline-none"
          >
            <option value="all">All categories</option>
            {(data?.categories || []).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary px-3 py-2 text-sm">
          <Plus size={14} /> New expense
        </button>
      </div>

      {loading ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-white/50">
                  <th className="px-4 py-3">Expense</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-white/40">
                      No expenses match these filters
                    </td>
                  </tr>
                ) : (
                  filtered.map((e) => (
                    <tr key={e.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="px-4 py-3">
                        <div className="font-medium">{e.title}</div>
                        <div className="text-[11px] text-white/45">{e.id} · {e.submittedOn}</div>
                      </td>
                      <td className="px-4 py-3 text-white/70">{e.category}</td>
                      <td className="px-4 py-3 text-white/70">{e.vendor}</td>
                      <td className="px-4 py-3 text-right font-mono">{inr(e.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${STATUS_TONES[e.status]}`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          {e.status === "Pending" && (
                            <>
                              <button disabled={busyId === e.id} onClick={() => act(e.id, "Approved")} className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-400/30 hover:bg-emerald-500/25 disabled:opacity-50">
                                <CheckCircle2 size={12} /> Approve
                              </button>
                              <button disabled={busyId === e.id} onClick={() => act(e.id, "Rejected")} className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-2 py-1 text-[11px] font-medium text-rose-300 ring-1 ring-rose-400/30 hover:bg-rose-500/25 disabled:opacity-50">
                                <XCircle size={12} /> Reject
                              </button>
                            </>
                          )}
                          {e.status === "Approved" && (
                            <button disabled={busyId === e.id} onClick={() => act(e.id, "Paid")} className="inline-flex items-center gap-1 rounded-md bg-brand-500/20 px-2 py-1 text-[11px] font-medium text-brand-200 ring-1 ring-brand-400/30 hover:bg-brand-500/30 disabled:opacity-50">
                              <Wallet size={12} /> Mark paid
                            </button>
                          )}
                          {e.status === "Paid" && (
                            <span className="text-[11px] text-white/45">{e.paymentRef}</span>
                          )}
                          {e.status === "Rejected" && <span className="text-[11px] text-white/30">—</span>}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {creating && (
          <NewExpenseModal
            categories={data?.categories || []}
            vendors={data?.vendors || []}
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

function BudgetReport() {
  const { data, loading } = useApi(endpoints.expenseReport, []);
  if (loading || !data) return null;
  const rows = data.rows.filter((r) => r.actual > 0 || r.budget > 0);
  return (
    <div className="card">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 size={16} className="text-brand-300" />
        <div className="font-display font-semibold">Budget vs actual · {data.month}</div>
        <span className="ml-auto text-xs text-white/55">
          {inr(data.totals.actual)} of {inr(data.totals.budget)}
          <span className={data.totals.variance >= 0 ? "text-emerald-300" : "text-rose-300"}>
            {" "}({data.totals.variance >= 0 ? "+" : ""}{inr(data.totals.variance)})
          </span>
        </span>
      </div>
      <div className="space-y-2.5">
        {rows.map((r) => {
          const pct = r.budget ? Math.min(100, Math.round((r.actual / r.budget) * 100)) : 100;
          const over = r.actual > r.budget;
          return (
            <div key={r.category}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-white/70">{r.category}</span>
                <span className={over ? "text-rose-300" : "text-white/55"}>
                  {inr(r.actual)} / {inr(r.budget)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className={`h-full rounded-full ${over ? "bg-rose-400/70" : "bg-gradient-to-r from-brand-500 to-accent-violet"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, sub, tint, pulse }) {
  return (
    <div className="card relative overflow-hidden">
      <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${tint} to-transparent blur-2xl ${pulse ? "animate-pulse" : ""}`} />
      <div className="relative flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-white/55">{label}</div>
          <div className="stat-num glow-text">{value}</div>
          {sub && <div className="mt-0.5 text-[11px] text-white/45">{sub}</div>}
        </div>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function NewExpenseModal({ categories, vendors, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    category: categories[0] || "Maintenance",
    vendor: vendors[0] || "",
    amount: "",
    note: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await endpoints.expenseAdd({ ...form, amount: Number(form.amount) });
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
        <div className="mb-1 text-xs uppercase tracking-[0.2em] text-white/55">Record expense</div>
        <div className="font-display text-xl font-bold">New expense</div>

        <div className="mt-5 space-y-3">
          <Field label="Title">
            <input value={form.title} onChange={(e) => set("title", e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10" required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10">
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Amount (₹)">
              <input type="number" min="1" value={form.amount} onChange={(e) => set("amount", e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10" required />
            </Field>
          </div>
          <Field label="Vendor">
            <input list="expense-vendors" value={form.vendor} onChange={(e) => set("vendor", e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10" />
            <datalist id="expense-vendors">
              {vendors.map((v) => <option key={v} value={v} />)}
            </datalist>
          </Field>
          <Field label="Note (optional)">
            <input value={form.note} onChange={(e) => set("note", e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10" />
          </Field>
        </div>

        {err && (
          <div className="mt-3 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">{err}</div>
        )}

        <button disabled={busy} className="btn-primary mt-5 w-full">
          {busy ? "Saving…" : "Submit for approval"}
        </button>
      </motion.form>
    </motion.div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">{label}</div>
      {children}
    </label>
  );
}
