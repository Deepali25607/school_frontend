import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Wallet,
  Banknote,
  TrendingDown,
  Receipt,
  Search,
  Filter,
  X,
  Sparkles as SparklesIcon,
  Printer,
  Plus,
  Play,
  Trash2,
  Landmark,
  CheckCircle2,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import Portal from "../../components/ui/Portal.jsx";
import { PageHeader } from "./Students.jsx";
import { GrantAdvanceModal } from "./SalaryAdvances.jsx";

const STATUS_TONES = {
  Draft: "bg-white/10 text-white/70 ring-white/20",
  Processed: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  Paid: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
};
const lakh = (n) => `₹${(Number(n || 0) / 100000).toFixed(2)}L`;
const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

export default function Payroll() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [dept, setDept] = useState("all");
  const [previewId, setPreviewId] = useState(null);
  const [editing, setEditing] = useState(null); // employee being maintained
  const [bulkOpen, setBulkOpen] = useState(false);
  const [granting, setGranting] = useState(null); // employee (or {}) getting an advance

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const { data, loading, error, refetch } = useApi(
    () => endpoints.payroll({ q: debounced, department: dept }),
    [debounced, dept]
  );
  useRealtime("payroll.changed", () => refetch());

  const summary = data?.summary;
  const departments = ["all", ...(data?.departments || [])];
  const paymentMethods = data?.paymentMethods || ["Bank Transfer", "Cash", "UPI"];
  const banks = data?.banks || [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Finance"
        title="Payroll"
        subtitle={
          summary
            ? `Run for ${new Date().toLocaleString(undefined, {
                month: "long",
                year: "numeric",
              })} · ${summary.headcount} employees`
            : "Loading…"
        }
      />

      {error && <ErrorState error={error} onRetry={refetch} />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          icon={Users}
          label="Headcount"
          value={summary ? summary.headcount : "—"}
          tint="from-brand-500/30"
        />
        <KpiCard
          icon={Wallet}
          label="Gross payroll"
          value={summary ? `₹${(summary.gross / 100000).toFixed(2)}L` : "—"}
          tint="from-accent-violet/30"
        />
        <KpiCard
          icon={TrendingDown}
          label="Deductions"
          value={summary ? `₹${(summary.deductions / 100000).toFixed(2)}L` : "—"}
          tint="from-rose-500/30"
        />
        <KpiCard
          icon={Banknote}
          label="Net payout"
          value={summary ? `₹${(summary.net / 100000).toFixed(2)}L` : "—"}
          tint="from-emerald-500/30"
        />
      </div>

      <PayrollRuns />

      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={16} className="text-white/60" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, role or ID…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-white/55" />
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d === "all" ? "All departments" : d}
              </option>
            ))}
          </select>
          <button onClick={() => setBulkOpen(true)} className="btn-ghost px-3 py-2 text-sm">
            <Users size={14} /> Bulk update
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03] text-left text-[11px] uppercase tracking-wider text-white/55">
                <tr>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Gross</th>
                  <th className="px-5 py-3">Deductions</th>
                  <th className="px-5 py-3">Net</th>
                  <th className="px-5 py-3">Pay via</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {(data?.items || []).map((s, i) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.015 }}
                    className="border-t border-white/5 hover:bg-white/[0.025]"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-pink font-display text-xs font-bold">
                          {s.avatar}
                        </div>
                        <div>
                          <div className="font-medium">{s.name}</div>
                          <div className="text-[11px] text-white/50">
                            {s.id} · {s.yearsOfService}y
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-white/80">{s.role}</td>
                    <td className="px-5 py-3 text-white/70">{s.department}</td>
                    <td className="px-5 py-3 font-display">
                      ₹{s.gross.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 font-display text-rose-300">
                      ₹{s.totalDeductions.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 font-display text-emerald-300">
                      ₹{s.net.toLocaleString()}
                      {s.advances?.outstanding > 0 && (
                        <div className="mt-0.5 text-[10px] font-sans font-normal text-amber-300/80">
                          adv. {inr(s.advances.outstanding)} left
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-white/70 ring-1 ring-white/10">
                        {s.paymentMethod}
                      </span>
                      <div className="mt-0.5 text-[10px] text-white/40">
                        {s.account || s.upiId || "—"}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${
                          s.status === "Active"
                            ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
                            : "bg-amber-500/15 text-amber-300 ring-amber-400/30"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setEditing(s)}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setGranting(s)}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                        >
                          Advance
                        </button>
                        <button
                          onClick={() => setPreviewId(s.id)}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                        >
                          Payslip
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {previewId && (
          <PayslipModal id={previewId} onClose={() => setPreviewId(null)} />
        )}
        {editing && (
          <PayrollEditModal
            employee={editing}
            methods={paymentMethods}
            banks={banks}
            onClose={() => setEditing(null)}
            onSaved={() => { setEditing(null); refetch(); }}
          />
        )}
        {bulkOpen && (
          <BulkPayrollModal
            departments={data?.departments || []}
            methods={paymentMethods}
            onClose={() => setBulkOpen(false)}
            onSaved={() => { setBulkOpen(false); refetch(); }}
          />
        )}
        {granting && (
          <GrantAdvanceModal
            preset={granting.id ? granting : null}
            staff={data?.items || []}
            methods={paymentMethods}
            onClose={() => setGranting(null)}
            onSaved={() => { setGranting(null); refetch(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PayrollRuns() {
  const { data, loading, error, refetch } = useApi(endpoints.payrollRuns, []);
  const [busyId, setBusyId] = useState(null);
  const [bankRunId, setBankRunId] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [err, setErr] = useState(null);
  useRealtime("payroll.changed", () => refetch());

  const runs = data?.items || [];

  const create = async () => {
    setBusyId("new");
    setErr(null);
    try {
      await endpoints.payrollRunCreate(month);
      refetch();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setBusyId(null);
    }
  };

  const act = async (id, fn) => {
    setBusyId(id);
    setErr(null);
    try {
      await fn();
      refetch();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="card">
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Receipt size={16} className="text-brand-300" />
          <div className="font-display font-semibold">Payroll runs</div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm outline-none [color-scheme:dark]"
          />
          <button
            onClick={create}
            disabled={busyId === "new"}
            className="btn-primary px-3 py-1.5 text-sm disabled:opacity-50"
          >
            <Plus size={14} /> {busyId === "new" ? "Creating…" : "New run"}
          </button>
        </div>
      </div>

      {err && (
        <div className="mb-3 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
          {err}
        </div>
      )}
      {error && <ErrorState error={error} onRetry={refetch} />}

      {loading ? (
        <Skeleton className="h-24" />
      ) : runs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-white/40">
          No payroll runs yet. Pick a month and create one to generate payslips.
        </div>
      ) : (
        <div className="space-y-2">
          {runs.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-3">
                <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${STATUS_TONES[r.status]}`}>
                  {r.status}
                </span>
                <div>
                  <div className="font-medium">{r.month}</div>
                  <div className="text-[11px] text-white/45">
                    {r.headcount} employees · net {lakh(r.net)}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {r.status === "Draft" && (
                  <button disabled={busyId === r.id} onClick={() => act(r.id, () => endpoints.payrollRunAction(r.id, "process"))} className="inline-flex items-center gap-1 rounded-md bg-brand-500/20 px-2 py-1 text-[11px] font-medium text-brand-200 ring-1 ring-brand-400/30 hover:bg-brand-500/30 disabled:opacity-50">
                    <Play size={12} /> Process
                  </button>
                )}
                {r.status === "Processed" && (
                  <button disabled={busyId === r.id} onClick={() => act(r.id, () => endpoints.payrollRunAction(r.id, "pay"))} className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-400/30 hover:bg-emerald-500/25 disabled:opacity-50">
                    <CheckCircle2 size={12} /> Pay
                  </button>
                )}
                {r.status !== "Draft" && (
                  <button onClick={() => setBankRunId(r.id)} className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[11px] font-medium text-white/70 ring-1 ring-white/10 hover:bg-white/10">
                    <Landmark size={12} /> Bank report
                  </button>
                )}
                {r.status === "Draft" && (
                  <button disabled={busyId === r.id} onClick={() => act(r.id, () => endpoints.payrollRunDelete(r.id))} className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-1 text-[11px] font-medium text-rose-300 ring-1 ring-rose-400/20 hover:bg-rose-500/20 disabled:opacity-50">
                    <Trash2 size={12} /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {bankRunId && <BankReportModal runId={bankRunId} onClose={() => setBankRunId(null)} />}
      </AnimatePresence>
    </div>
  );
}

function BankReportModal({ runId, onClose }) {
  const { data, loading, error } = useApi(() => endpoints.payrollBankReport(runId), [runId]);
  return (
    <Portal>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur"
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.96, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 10 }}
        className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a0a1e] via-[#0d0d2a] to-[#101044] p-6 shadow-glow"
      >
        <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white">
          <X size={18} />
        </button>
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/55">Disbursement report</div>
        {loading ? (
          <Skeleton className="mt-4 h-40" />
        ) : error ? (
          <ErrorState error={error} />
        ) : data ? (
          <>
            <div className="mt-1 font-display text-2xl font-bold">{data.month}</div>
            <div className="mt-1 text-sm text-white/60">
              {data.status} · grand total <span className="text-emerald-300">{inr(data.grandTotal)}</span>
            </div>
            <div className="mt-4 space-y-3">
              {(data.methods || []).map((m) => (
                <div key={m.method} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{m.method}</div>
                    <div className="text-sm text-white/70">{m.count} · {inr(m.total)}</div>
                  </div>
                  <div className="mt-2 space-y-1">
                    {m.lines.map((l) => (
                      <div key={l.employeeId} className="flex items-center justify-between text-[12px] text-white/60">
                        <span>
                          {l.name}
                          {l.account ? ` · ${l.account}${l.bank ? ` (${l.bank})` : ""}` : l.upiId ? ` · ${l.upiId}` : " · cash"}
                        </span>
                        <span className="font-mono">{inr(l.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </motion.div>
    </motion.div>
    </Portal>
  );
}

function KpiCard({ icon: Icon, label, value, tint }) {
  return (
    <div className="card relative overflow-hidden">
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${tint} to-transparent blur-2xl`}
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

function PayslipModal({ id, onClose }) {
  const { data, loading, error } = useApi(() => endpoints.payrollStaff(id), [id]);
  const month = new Date().toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur"
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.96, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 10 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a0a1e] via-[#0d0d2a] to-[#101044] p-8 shadow-glow"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-brand-500/30 to-accent-pink/30 blur-3xl" />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>

        {loading ? (
          <div className="relative space-y-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-44" />
          </div>
        ) : error ? (
          <ErrorState error={error} />
        ) : data ? (
          <div className="relative">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-white/55">
                  Lumina · Payslip
                </div>
                <div className="mt-1 font-display text-2xl font-bold">
                  {month}
                </div>
              </div>
              <div className="chip">
                <SparklesIcon size={12} className="text-accent-gold" />
                #{data.id}
              </div>
            </div>

            <div className="mt-5 flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-accent-violet to-accent-pink font-display text-lg font-bold shadow-glow">
                {data.avatar}
              </div>
              <div className="flex-1">
                <div className="font-display text-lg font-semibold">
                  {data.name}
                </div>
                <div className="text-xs text-white/60">
                  {data.role} · {data.department} · {data.yearsOfService}y
                </div>
                <div className="mt-1 text-[11px] text-white/45">
                  {data.paymentMethod}
                  {data.account ? ` · ${data.bank} · ${data.account}` : data.upiId ? ` · ${data.upiId}` : ""}
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Block title="Earnings">
                <Row label="Basic" value={data.components.base} />
                <Row label="HRA" value={data.components.hra} />
                <Row label="Transport" value={data.components.transport} />
                <Row label="Special allowance" value={data.components.special} />
                {data.components.overtime > 0 && (
                  <Row label="Overtime" value={data.components.overtime} />
                )}
                {data.components.bonus > 0 && (
                  <Row label="Bonus" value={data.components.bonus} />
                )}
                <Total label="Gross" value={data.gross} tone="text-emerald-300" />
              </Block>
              <Block title="Deductions">
                <Row label="PF" value={data.deductions.pf} />
                {data.deductions.esi > 0 && (
                  <Row label="ESI" value={data.deductions.esi} />
                )}
                {data.deductions.tax > 0 && (
                  <Row label="Tax (TDS)" value={data.deductions.tax} />
                )}
                {data.deductions.loan > 0 && (
                  <Row label="Loan EMI" value={data.deductions.loan} />
                )}
                {data.deductions.advance > 0 && (
                  <Row label="Advance recovery" value={data.deductions.advance} />
                )}
                <Total label="Total deductions" value={data.totalDeductions} tone="text-rose-300" />
              </Block>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-gradient-to-r from-brand-500/20 via-accent-violet/15 to-accent-pink/15 p-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/55">
                  Net pay
                </div>
                <div className="font-display text-3xl font-bold glow-text">
                  ₹{data.net.toLocaleString()}
                </div>
              </div>
              <button className="btn-ghost px-3 py-2 text-sm">
                <Printer size={14} /> Print PDF
              </button>
            </div>
          </div>
        ) : null}
      </motion.div>
    </motion.div>
  );
}

function Block({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/55">
        {title}
      </div>
      <div className="space-y-1.5 text-sm">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-white/70">{label}</div>
      <div className="font-display">₹{value.toLocaleString()}</div>
    </div>
  );
}

function Total({ label, value, tone }) {
  return (
    <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
      <div className="font-semibold text-white">{label}</div>
      <div className={`font-display text-lg font-bold ${tone}`}>
        ₹{value.toLocaleString()}
      </div>
    </div>
  );
}

const COMP_LABELS = { base: "Basic", hra: "HRA", transport: "Transport", special: "Special allowance", overtime: "Overtime", bonus: "Bonus" };
const DED_LABELS = { pf: "PF", esi: "ESI", tax: "Tax (TDS)", loan: "Loan EMI" };

// Individual payroll maintenance — edit one employee's salary structure,
// payment method and bank/UPI details.
function PayrollEditModal({ employee, methods, banks, onClose, onSaved }) {
  const [components, setComponents] = useState({ ...employee.components });
  const [deductions, setDeductions] = useState({ ...employee.deductions });
  const [method, setMethod] = useState(employee.paymentMethod);
  const [bank, setBank] = useState(employee.bank || "");
  const [account, setAccount] = useState(employee.account || "");
  const [upiId, setUpiId] = useState(employee.upiId || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const gross = Object.values(components).reduce((a, v) => a + (Number(v) || 0), 0);
  const totalDed = Object.values(deductions).reduce((a, v) => a + (Number(v) || 0), 0);
  const net = gross - totalDed;
  const cls = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm outline-none focus:border-brand-400/60";

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await endpoints.payrollUpdate(employee.id, {
        components: Object.fromEntries(Object.entries(components).map(([k, v]) => [k, Number(v) || 0])),
        deductions: Object.fromEntries(Object.entries(deductions).map(([k, v]) => [k, Number(v) || 0])),
        paymentMethod: method,
        bank: method === "Bank Transfer" ? bank : null,
        account: method === "Bank Transfer" ? account : null,
        upiId: method === "UPI" ? upiId : null,
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
        initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 10 }}
        onClick={(e) => e.stopPropagation()} onSubmit={save}
        className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a0a1e] via-[#0d0d2a] to-[#101044] p-6 shadow-glow"
      >
        <button type="button" onClick={onClose} className="absolute right-4 top-4 z-10 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"><X size={18} /></button>
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/55">Maintain payroll</div>
        <div className="font-display text-xl font-bold">{employee.name}</div>
        <div className="text-xs text-white/55">{employee.role} · {employee.department} · {employee.id}</div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1.5 text-[11px] uppercase tracking-wider text-white/55">Earnings</div>
            <div className="space-y-1.5">
              {Object.keys(COMP_LABELS).map((k) => (
                <label key={k} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-white/60">{COMP_LABELS[k]}</span>
                  <input type="number" min="0" value={components[k] ?? 0} onChange={(e) => setComponents((p) => ({ ...p, [k]: e.target.value }))} className={`${cls} w-28 text-right font-mono`} />
                </label>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-[11px] uppercase tracking-wider text-white/55">Deductions</div>
            <div className="space-y-1.5">
              {Object.keys(DED_LABELS).map((k) => (
                <label key={k} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-white/60">{DED_LABELS[k]}</span>
                  <input type="number" min="0" value={deductions[k] ?? 0} onChange={(e) => setDeductions((p) => ({ ...p, [k]: e.target.value }))} className={`${cls} w-28 text-right font-mono`} />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="mb-2 text-[11px] uppercase tracking-wider text-white/55">Payment method</div>
          <div className="flex flex-wrap gap-1.5">
            {methods.map((m) => (
              <button type="button" key={m} onClick={() => setMethod(m)} className={`rounded-md px-2.5 py-1 text-xs font-medium ring-1 transition-all ${method === m ? "bg-gradient-to-r from-brand-500/30 to-accent-violet/20 text-white ring-white/25" : "bg-white/5 text-white/65 ring-white/10 hover:bg-white/10"}`}>{m}</button>
            ))}
          </div>
          {method === "Bank Transfer" && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <select value={bank} onChange={(e) => setBank(e.target.value)} className={cls}>
                <option value="">Select bank</option>
                {banks.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="Account no." className={cls} />
            </div>
          )}
          {method === "UPI" && (
            <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="name@bank UPI ID" className={`${cls} mt-3`} />
          )}
          {method === "Cash" && <div className="mt-2 text-[11px] text-white/45">Paid in cash at the accounts office.</div>}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-gradient-to-r from-brand-500/15 to-accent-violet/10 px-4 py-3">
          <div className="text-xs text-white/60">Net pay</div>
          <div className="font-display text-xl font-bold glow-text">{inr(net)}</div>
        </div>

        {err && <div className="mt-3 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">{err}</div>}
        <button disabled={busy} className="btn-primary mt-4 w-full">{busy ? "Saving…" : "Save payroll"}</button>
      </motion.form>
    </motion.div>
    </Portal>
  );
}

// Mass payroll maintenance — apply a change across many staff at once.
function BulkPayrollModal({ departments, methods, onClose, onSaved }) {
  const [action, setAction] = useState("raisePercent");
  const [category, setCategory] = useState("all");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [result, setResult] = useState(null);
  const cls = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60";

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const payload = { action, category };
      payload.value = action === "setMethod" ? value : Number(value);
      const r = await endpoints.payrollBulk(payload);
      setResult(r);
      setTimeout(onSaved, 900);
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
        className="glass-card relative w-full max-w-md p-6"
      >
        <button type="button" onClick={onClose} className="absolute right-3 top-3 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"><X size={16} /></button>
        <div className="mb-1 text-xs uppercase tracking-[0.2em] text-white/55">Mass payroll update</div>
        <div className="font-display text-xl font-bold">Bulk maintain payroll</div>

        <div className="mt-5 space-y-3">
          <label className="block">
            <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">Apply to</div>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={cls}>
              <option value="all">All staff</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label className="block">
            <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">Action</div>
            <select value={action} onChange={(e) => { setAction(e.target.value); setValue(""); }} className={cls}>
              <option value="raisePercent">Apply salary increment (%)</option>
              <option value="setBonus">Set bonus (₹)</option>
              <option value="setMethod">Set payment method</option>
            </select>
          </label>
          <label className="block">
            <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">
              {action === "raisePercent" ? "Increment %" : action === "setBonus" ? "Bonus amount (₹)" : "Payment method"}
            </div>
            {action === "setMethod" ? (
              <select value={value} onChange={(e) => setValue(e.target.value)} className={cls} required>
                <option value="">Select…</option>
                {methods.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            ) : (
              <input type="number" value={value} onChange={(e) => setValue(e.target.value)} className={cls} required />
            )}
          </label>
        </div>

        {err && <div className="mt-3 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">{err}</div>}
        {result && <div className="mt-3 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs text-emerald-300 ring-1 ring-emerald-400/30">Updated {result.updated} staff.</div>}
        <button disabled={busy} className="btn-primary mt-5 w-full">{busy ? "Applying…" : "Apply to all matched"}</button>
      </motion.form>
    </motion.div>
    </Portal>
  );
}
