import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  CreditCard,
  Banknote,
  Receipt,
  Plus,
  Search,
  Filter,
  X,
  Printer,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles as SparklesIcon,
  Wallet,
  Smartphone,
  Building2,
  ScrollText,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const STATUS_TONES = {
  Paid: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Pending: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  Partial: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  Success: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Failed: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

const STATUS_ICONS = {
  Success: CheckCircle2,
  Pending: Clock,
  Failed: XCircle,
};

const MODE_ICONS = {
  UPI: Smartphone,
  Card: CreditCard,
  "Net Banking": Building2,
  Cash: Banknote,
  Cheque: ScrollText,
};

export default function Fees() {
  const { user } = useAuth();
  const canCollect = ["admin", "principal", "accountant", "parent"].includes(user?.role);

  const ledger = useApi(endpoints.feesLedger, []);
  const monthly = useApi(endpoints.feesMonthly, []);
  const [tab, setTab] = useState("ledger");
  const [paying, setPaying] = useState(null); // student object or true for blank

  useRealtime("fees.changed", () => {
    ledger.refetch();
  });

  const totals = useMemo(() => {
    const items = ledger.data?.items || [];
    return {
      collected: items.reduce((a, r) => a + r.paid, 0),
      pending: items.reduce((a, r) => a + r.pending, 0),
      receipts: items.filter((r) => r.paid > 0).length,
    };
  }, [ledger.data]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Finance"
        title="Fees & Payments"
        subtitle="Collection, transactions, scholarships and receipts"
      />

      {(ledger.error || monthly.error) && (
        <ErrorState
          error={ledger.error || monthly.error}
          onRetry={() => {
            ledger.refetch();
            monthly.refetch();
          }}
        />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard
          icon={Banknote}
          label="Collected (YTD)"
          value={ledger.loading ? "—" : `₹${(totals.collected / 100000).toFixed(1)}L`}
          tint="from-emerald-500/30 to-emerald-400/10"
        />
        <KpiCard
          icon={CreditCard}
          label="Pending"
          value={ledger.loading ? "—" : `₹${(totals.pending / 100000).toFixed(1)}L`}
          tint="from-rose-500/30 to-rose-400/10"
        />
        <KpiCard
          icon={Receipt}
          label="Students who've paid"
          value={ledger.loading ? "—" : totals.receipts}
          tint="from-brand-500/30 to-accent-violet/20"
        />
      </div>

      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-display text-lg font-semibold">Collection by month</div>
          {canCollect && (
            <button
              onClick={() => setPaying({ blank: true })}
              className="btn-primary px-3 py-2 text-sm"
            >
              <Plus size={14} /> Record payment
            </button>
          )}
        </div>
        <div className="h-72">
          {monthly.loading || !monthly.data ? (
            <Skeleton className="h-full" />
          ) : (
            <ResponsiveContainer>
              <BarChart data={monthly.data}>
                <defs>
                  <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9b5cff" />
                    <stop offset="100%" stopColor="#3d5fff" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="m" stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} />
                <Tooltip
                  contentStyle={{
                    background: "#0f1024",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    color: "white",
                  }}
                  formatter={(v) => `₹${(v / 100000).toFixed(2)}L`}
                />
                <Bar dataKey="v" radius={[8, 8, 0, 0]} fill="url(#bar)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card">
        <div className="mb-3 flex items-center gap-2">
          {[
            { k: "ledger", label: "Ledger" },
            { k: "payments", label: "Payments" },
            { k: "structures", label: "Fee structures" },
            { k: "scholarships", label: "Scholarships" },
          ].map((t) => (
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

        {tab === "ledger" && (
          <LedgerTable
            loading={ledger.loading}
            items={ledger.data?.items || []}
            canCollect={canCollect}
            onCollect={(s) => setPaying(s)}
          />
        )}

        {tab === "payments" && <PaymentsTab />}

        {tab === "structures" && (
          <div className="text-sm text-white/65">
            Define class-wise fee structures, recurring vs one-time charges,
            late fines and grace periods. (UI scaffolded — wire to backend.)
          </div>
        )}
        {tab === "scholarships" && (
          <div className="text-sm text-white/65">
            Manage merit, need-based and sibling scholarships with auto-apply
            rules. (UI scaffolded.)
          </div>
        )}
      </div>

      <AnimatePresence>
        {paying && (
          <PaymentModal
            student={paying.blank ? null : paying}
            onClose={() => setPaying(null)}
            onSuccess={() => {
              setPaying(null);
              ledger.refetch();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function LedgerTable({ loading, items, canCollect, onCollect }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-white/[0.03] text-left text-[11px] uppercase tracking-wider text-white/55">
          <tr>
            <th className="px-5 py-3">Student</th>
            <th className="px-5 py-3">Grade</th>
            <th className="px-5 py-3">Total</th>
            <th className="px-5 py-3">Paid</th>
            <th className="px-5 py-3">Pending</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {items.slice(0, 25).map((r, i) => (
            <motion.tr
              key={r.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="border-t border-white/5 hover:bg-white/[0.025]"
            >
              <td className="px-5 py-3">
                <Link to={`/app/students/${r.id}`} className="font-medium hover:text-brand-300">
                  {r.name}
                </Link>
                <div className="text-[10px] font-mono text-white/40">{r.id}</div>
              </td>
              <td className="px-5 py-3 text-white/70">{r.grade}-{r.section}</td>
              <td className="px-5 py-3">₹{r.total.toLocaleString()}</td>
              <td className="px-5 py-3 text-emerald-300">₹{r.paid.toLocaleString()}</td>
              <td className="px-5 py-3 text-rose-300">₹{r.pending.toLocaleString()}</td>
              <td className="px-5 py-3">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${STATUS_TONES[r.status] || "bg-white/10 text-white/70"}`}>
                  {r.status}
                </span>
              </td>
              <td className="px-5 py-3 text-right">
                {canCollect && r.pending > 0 ? (
                  <button
                    onClick={() => onCollect(r)}
                    className="rounded-lg border border-brand-400/30 bg-brand-500/15 px-3 py-1.5 text-xs font-medium text-brand-200 hover:bg-brand-500/25"
                  >
                    Collect
                  </button>
                ) : (
                  <span className="text-[11px] text-white/40">—</span>
                )}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PaymentsTab() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [mode, setMode] = useState("all");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const { data, loading, error, refetch } = useApi(
    () => endpoints.feesPayments({ q: debounced, mode, status }),
    [debounced, mode, status]
  );

  useRealtime("fees.changed", () => refetch());

  const items = data?.items || [];
  const summary = data?.summary;

  return (
    <div className="space-y-3">
      {error && <ErrorState error={error} onRetry={refetch} />}

      {summary && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Tile label="Today" value={summary.todayCount} amount={`₹${summary.todayAmount.toLocaleString()}`} tone="text-emerald-300" />
          <Tile label="Last 7 days" amount={`₹${(summary.last7dAmount / 1000).toFixed(1)}k`} value={summary.success} tone="text-brand-300" />
          <Tile label="Pending" value={summary.pending} tone={summary.pending > 0 ? "text-amber-300" : "text-white/85"} />
          <Tile label="Failed" value={summary.failed} tone="text-rose-300" />
        </div>
      )}

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={14} className="text-white/55" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search receipt no, txn ref, student…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-white/55" />
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
            <option value="all">Any mode</option>
            {(data?.modes || []).map((m) => <option key={m}>{m}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
            <option value="all">Any status</option>
            {(data?.statuses || []).map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] py-10 text-center text-white/55">
          <SparklesIcon className="mx-auto mb-2 text-accent-gold" size={20} />
          No payments match this filter.
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((p, i) => <PaymentRow key={p.id} p={p} idx={i} />)}
        </div>
      )}
    </div>
  );
}

function Tile({ label, value, amount, tone }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="text-[10px] uppercase tracking-wider text-white/55">{label}</div>
      <div className={`font-display text-xl font-bold ${tone || ""}`}>{value}</div>
      {amount && <div className="text-[10px] text-white/55">{amount}</div>}
    </div>
  );
}

function PaymentRow({ p, idx }) {
  const ModeIcon = MODE_ICONS[p.mode] || Wallet;
  const StatusIcon = STATUS_ICONS[p.status] || Clock;
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx, 16) * 0.02 }}
      className="flex flex-col gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-3 md:flex-row md:items-center"
    >
      <div className="flex items-center gap-3 md:w-64">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
          <ModeIcon size={14} />
        </span>
        <div className="min-w-0">
          <Link to={`/app/students/${p.studentId}`} className="block truncate text-sm font-medium hover:text-brand-300">
            {p.studentName}
          </Link>
          <div className="text-[10px] text-white/45">
            {p.studentId} · {p.mode}
          </div>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-lg font-bold text-emerald-300">
            ₹{p.amount.toLocaleString()}
          </span>
          {p.receiptNo && (
            <span className="font-mono text-[10px] text-white/55">{p.receiptNo}</span>
          )}
        </div>
        <div className="text-[10px] text-white/45">
          {p.txnRef} · {new Date(p.paidOn).toLocaleString()}
        </div>
      </div>
      <div className="flex items-center gap-2 md:justify-end">
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${STATUS_TONES[p.status]}`}>
          <StatusIcon size={11} /> {p.status}
        </span>
        {p.status === "Success" && (
          <Link
            to={`/print/receipts/${p.id}`}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-medium hover:bg-white/10"
            title="Print receipt"
          >
            <Printer size={11} /> Receipt
          </Link>
        )}
      </div>
    </motion.div>
  );
}

function PaymentModal({ student, onClose, onSuccess }) {
  const [billing, setBilling] = useState(null);
  const [studentQuery, setStudentQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [studentLoading, setStudentLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(student && !student.blank ? student : null);
  const [form, setForm] = useState({
    amount: "",
    mode: "UPI",
    paidBy: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [result, setResult] = useState(null);

  // Load billing details once a student is selected
  useEffect(() => {
    if (!selectedStudent?.id) {
      setBilling(null);
      return;
    }
    let cancelled = false;
    endpoints
      .feesStudent(selectedStudent.id)
      .then((res) => {
        if (cancelled) return;
        setBilling(res);
        setForm((p) => ({
          ...p,
          amount: String(res.outstanding),
          paidBy: res.student?.parent || "",
        }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedStudent?.id]);

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

  const submit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      setErr("Pick a student first");
      return;
    }
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      setErr("Enter a valid amount");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await endpoints.feesPaymentAdd({
        studentId: selectedStudent.id,
        amount,
        mode: form.mode,
        paidBy: form.paidBy,
        notes: form.notes,
      });
      setResult(res);
      if (res.status === "Success") {
        // Auto-success after a moment so the modal shows the receipt link
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  // Success / failure card after a payment attempt
  if (result) {
    const isSuccess = result.status === "Success";
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card relative w-full max-w-sm p-6 text-center"
        >
          <button onClick={onClose} className="absolute right-3 top-3 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white">
            <X size={16} />
          </button>
          <div className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full ${
            isSuccess
              ? "bg-emerald-500/20 ring-2 ring-emerald-400/40"
              : result.status === "Pending"
              ? "bg-amber-500/20 ring-2 ring-amber-400/40"
              : "bg-rose-500/20 ring-2 ring-rose-400/40"
          }`}>
            {isSuccess ? <CheckCircle2 size={32} className="text-emerald-300" /> :
             result.status === "Pending" ? <Clock size={32} className="text-amber-300" /> :
             <XCircle size={32} className="text-rose-300" />}
          </div>
          <div className="font-display text-xl font-bold">
            {isSuccess ? "Payment received" : result.status === "Pending" ? "Payment pending" : "Payment failed"}
          </div>
          <div className="mt-1 text-sm text-white/65">
            ₹{result.amount.toLocaleString()} via {result.mode}
          </div>
          {result.receiptNo && (
            <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] p-2 font-mono text-[11px] text-emerald-300">
              {result.receiptNo}
            </div>
          )}
          <div className="mt-1 font-mono text-[10px] text-white/45">{result.txnRef}</div>

          <div className="mt-4 flex gap-2">
            {result.receiptNo && (
              <Link
                to={`/print/receipts/${result.id}`}
                className="btn-primary flex-1 justify-center px-3 py-2 text-xs"
              >
                <Printer size={12} /> Print receipt
              </Link>
            )}
            <button
              onClick={onSuccess}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
            >
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

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
          Record fee payment
        </div>
        <div className="font-display text-xl font-bold">Collect payment</div>

        <div className="mt-5 space-y-3">
          {!selectedStudent ? (
            <Field label="Student">
              <div className="relative">
                <input
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                  placeholder="Type name or ID…"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60"
                />
                {studentQuery && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-[#0c0c22] shadow-glow">
                    {studentLoading && <div className="px-3 py-2 text-xs text-white/55">Searching…</div>}
                    {!studentLoading && students.length === 0 && <div className="px-3 py-2 text-xs text-white/45">No matches</div>}
                    {students.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => {
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
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <div>
                <div className="font-medium text-white">{selectedStudent.name}</div>
                <div className="text-[11px] text-white/55">
                  {selectedStudent.id} · Grade {selectedStudent.grade}-{selectedStudent.section}
                </div>
              </div>
              {!student?.blank && student && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudent(null);
                    setBilling(null);
                  }}
                  className="text-[11px] text-white/55 hover:text-white"
                >
                  change
                </button>
              )}
            </div>
          )}

          {billing && (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-white/55">Annual total</span>
                <span className="font-mono text-white/85">₹{billing.totalExpected.toLocaleString()}</span>
              </div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-emerald-300/70">Paid so far</span>
                <span className="font-mono text-emerald-300">₹{billing.totalPaid.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-1">
                <span className="text-rose-300/70">Outstanding</span>
                <span className="font-mono font-bold text-rose-300">₹{billing.outstanding.toLocaleString()}</span>
              </div>
            </div>
          )}

          <Field label="Amount (₹)">
            <input
              type="number"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              placeholder="Enter amount"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-base outline-none focus:border-brand-400/60"
              required
            />
          </Field>

          <Field label="Payment mode">
            <div className="grid grid-cols-5 gap-1">
              {["UPI", "Card", "Net Banking", "Cash", "Cheque"].map((m) => {
                const Icon = MODE_ICONS[m];
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => set("mode", m)}
                    className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-[10px] transition-all ${
                      form.mode === m
                        ? "border-brand-400/40 bg-brand-500/15 text-brand-200"
                        : "border-white/10 bg-white/5 text-white/55 hover:bg-white/10"
                    }`}
                  >
                    <Icon size={14} />
                    <span className="truncate">{m}</span>
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Paid by">
            <input
              value={form.paidBy}
              onChange={(e) => set("paidBy", e.target.value)}
              placeholder="Parent / guardian name"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
            />
          </Field>

          <Field label="Notes (optional)">
            <input
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="e.g. Second installment"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
            />
          </Field>
        </div>

        {err && (
          <div className="mt-3 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
            {err}
          </div>
        )}

        <button disabled={busy || !selectedStudent} className="btn-primary mt-5 w-full">
          {busy ? "Processing…" : `Pay ₹${Number(form.amount || 0).toLocaleString()}`}
        </button>
        {form.mode !== "Cash" && form.mode !== "Cheque" && (
          <div className="mt-2 text-center text-[10px] text-white/40">
            Gateway responses are simulated — most succeed, a few will return Pending/Failed for realism.
          </div>
        )}
      </motion.form>
    </motion.div>
  );
}

function KpiCard({ icon: Icon, label, value, tint }) {
  return (
    <div className="card relative overflow-hidden">
      <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${tint} blur-2xl`} />
      <div className="relative">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
          <Icon size={18} />
        </div>
        <div className="text-xs uppercase tracking-wider text-white/55">{label}</div>
        <div className="stat-num glow-text mt-1">{value}</div>
      </div>
    </div>
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
