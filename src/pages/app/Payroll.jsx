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
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const DEPARTMENTS = ["all", "Academics", "Finance", "Operations", "Transport"];

export default function Payroll() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [dept, setDept] = useState("all");
  const [previewId, setPreviewId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const { data, loading, error, refetch } = useApi(
    () => endpoints.payroll({ q: debounced, department: dept }),
    [debounced, dept]
  );

  const summary = data?.summary;

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
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d === "all" ? "All departments" : d}
              </option>
            ))}
          </select>
          <button className="btn-primary px-3 py-2 text-sm">
            <Receipt size={14} /> Run payroll
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
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setPreviewId(s.id)}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                      >
                        Payslip
                      </button>
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
      </AnimatePresence>
    </div>
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
                  {data.bank} · {data.account}
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
