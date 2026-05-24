import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Landmark,
  HandCoins,
  Gift,
  Sparkle,
  Banknote,
  GraduationCap,
  Trophy,
  ClipboardCheck,
  UserCheck,
  XCircle,
  CheckCircle2,
  FileText,
  Percent,
  PiggyBank,
  Coins,
  Plus,
  Search,
  X,
  Hourglass,
  AlertCircle,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const TYPE_TONES = {
  Merit: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
  "Need-based": "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  Sports: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Arts: "bg-accent-pink/15 text-pink-200 ring-accent-pink/30",
  Sibling: "bg-white/5 text-white/65 ring-white/15",
  "Alumni-funded":
    "bg-accent-violet/15 text-purple-200 ring-accent-violet/30",
  "Staff ward": "bg-cyan-500/15 text-cyan-300 ring-cyan-400/30",
  "Single parent": "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

const TYPE_ICONS = {
  Merit: Trophy,
  "Need-based": HandCoins,
  Sports: Trophy,
  Arts: Sparkle,
  Sibling: GraduationCap,
  "Alumni-funded": Gift,
  "Staff ward": UserCheck,
  "Single parent": HandCoins,
};

const STATUS_TONES = {
  Applied: "bg-white/5 text-white/65 ring-white/15",
  "Under Review": "bg-amber-500/15 text-amber-200 ring-amber-400/30",
  Awarded: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Rejected: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  Withdrawn: "bg-white/5 text-white/45 ring-white/15 line-through",
};

const STATUS_ORDER = [
  "Applied",
  "Under Review",
  "Awarded",
  "Rejected",
  "Withdrawn",
];

export default function Scholarships() {
  const { user } = useAuth();
  const canManageSchemes = ["admin", "principal"].includes(user?.role);
  const canApply = [
    "admin",
    "principal",
    "teacher",
    "hr",
    "parent",
  ].includes(user?.role);
  const canDecide = ["admin", "principal", "hr"].includes(user?.role);

  const [tab, setTab] = useState("schemes");
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [creatingScheme, setCreatingScheme] = useState(false);
  const [applyTo, setApplyTo] = useState(null);
  const [openApp, setOpenApp] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const schemeParams = useMemo(
    () => ({ q: debounced, type }),
    [debounced, type]
  );
  const appParams = useMemo(
    () => ({ q: debounced, status }),
    [debounced, status]
  );

  const {
    data: schemesData,
    loading: schemesLoading,
    refetch: refetchSchemes,
  } = useApi(() => endpoints.schemes(schemeParams), [schemeParams]);

  const {
    data: appsData,
    loading: appsLoading,
    refetch: refetchApps,
  } = useApi(() => endpoints.scholarshipApplications(appParams), [appParams]);

  useRealtime("scholarships.changed", () => {
    refetchSchemes();
    refetchApps();
  });

  const schemes = schemesData?.items || [];
  const types = schemesData?.types || [];
  const summary = schemesData?.summary;
  const applications = appsData?.items || [];
  const statuses = appsData?.statuses || STATUS_ORDER;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Financial Aid"
        title="Scholarships"
        subtitle={
          summary
            ? `${summary.activeSchemes} active schemes · ${summary.awarded} awarded · ${summary.pending} pending review`
            : "Loading…"
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          icon={Landmark}
          label="Active schemes"
          value={summary ? summary.activeSchemes : "—"}
          tint="from-brand-500/30"
        />
        <StatTile
          icon={CheckCircle2}
          label="Awarded"
          value={summary ? summary.awarded : "—"}
          tint="from-emerald-500/30"
          accent="text-emerald-300"
        />
        <StatTile
          icon={Hourglass}
          label="Pending review"
          value={summary ? summary.pending : "—"}
          tint="from-amber-500/30"
          accent="text-amber-300"
          pulse={(summary?.pending || 0) > 0}
        />
        <StatTile
          icon={PiggyBank}
          label="Committed (fixed)"
          value={
            summary
              ? "₹" + Number(summary.committedFixed).toLocaleString("en-IN")
              : "—"
          }
          subValue={
            summary?.committedPercentageCount > 0
              ? `+ ${summary.committedPercentageCount} % schemes`
              : null
          }
          tint="from-accent-violet/30"
          accent="text-purple-300"
        />
      </div>

      {/* Tab switcher */}
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
          <TabBtn
            active={tab === "schemes"}
            onClick={() => setTab("schemes")}
            icon={Landmark}
          >
            Schemes
          </TabBtn>
          <TabBtn
            active={tab === "applications"}
            onClick={() => setTab("applications")}
            icon={ClipboardCheck}
          >
            Applications
          </TabBtn>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex w-full max-w-xs items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 md:w-auto">
            <Search size={14} className="text-white/55" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={
                tab === "schemes"
                  ? "Search schemes…"
                  : "Search by student or scheme…"
              }
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
            />
          </div>
          {tab === "schemes" ? (
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
            >
              <option value="all">All types</option>
              {types.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          ) : (
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
            >
              <option value="all">All statuses</option>
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          )}
          {tab === "schemes" && canManageSchemes && (
            <button
              onClick={() => setCreatingScheme(true)}
              className="btn-primary px-3 py-2 text-sm"
            >
              <Plus size={14} /> New scheme
            </button>
          )}
        </div>
      </div>

      {/* Tab body */}
      {tab === "schemes" ? (
        <SchemesGrid
          schemes={schemes}
          loading={schemesLoading}
          canApply={canApply}
          onApply={(s) => setApplyTo(s)}
        />
      ) : (
        <ApplicationsList
          applications={applications}
          loading={appsLoading}
          onOpen={(a) => setOpenApp(a)}
        />
      )}

      <AnimatePresence>
        {creatingScheme && (
          <NewSchemeModal
            types={types}
            onClose={() => setCreatingScheme(false)}
            onCreated={() => {
              setCreatingScheme(false);
              refetchSchemes();
              refetchApps();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {applyTo && (
          <ApplyModal
            scheme={applyTo}
            onClose={() => setApplyTo(null)}
            onApplied={() => {
              setApplyTo(null);
              refetchApps();
              refetchSchemes();
              setTab("applications");
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openApp && (
          <ApplicationDetail
            app={openApp}
            canDecide={canDecide}
            onClose={() => setOpenApp(null)}
            onChanged={() => {
              refetchApps();
              refetchSchemes();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- pieces ----------

function StatTile({ icon: Icon, label, value, subValue, tint, pulse, accent }) {
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
          <div className={`stat-num glow-text ${accent || ""}`}>{value}</div>
          {subValue && (
            <div className="mt-1 text-[10px] text-white/55">{subValue}</div>
          )}
        </div>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-brand-500/25 text-brand-100 ring-1 ring-brand-400/30"
          : "text-white/55 hover:bg-white/5"
      }`}
    >
      <Icon size={12} />
      {children}
    </button>
  );
}

// ---------- Schemes grid ----------

function SchemesGrid({ schemes, loading, canApply, onApply }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }
  if (schemes.length === 0) {
    return (
      <div className="card text-center text-white/55">
        <Landmark className="mx-auto mb-2 text-white/30" size={20} />
        No schemes match the current filters.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {schemes.map((s, i) => (
        <SchemeCard
          key={s.id}
          scheme={s}
          idx={i}
          canApply={canApply}
          onApply={() => onApply(s)}
        />
      ))}
    </div>
  );
}

function SchemeCard({ scheme, idx, canApply, onApply }) {
  const s = scheme;
  const Icon = TYPE_ICONS[s.type] || Landmark;
  const isFull = s.slotsRemaining === 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.2) }}
      className={`card relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-glow ${
        !s.active ? "opacity-60" : ""
      }`}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-brand-500/15 to-accent-violet/10 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ring-1 ${
                TYPE_TONES[s.type] || "bg-white/5 text-white/65 ring-white/15"
              }`}
            >
              <Icon size={9} />
              {s.type}
            </span>
            {!s.active && (
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/55 ring-1 ring-white/15">
                Inactive
              </span>
            )}
            {isFull && s.active && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-200 ring-1 ring-amber-400/30">
                Slots full · waitlist
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-white/45">{s.id}</span>
        </div>
        <div className="mt-2 line-clamp-2 font-display text-base font-semibold">
          {s.name}
        </div>

        <div className="mt-2 rounded-xl border border-white/10 bg-gradient-to-br from-brand-500/10 to-transparent p-3">
          <div className="flex items-center gap-2">
            {s.valueType === "percentage" ? (
              <Percent size={14} className="text-brand-300" />
            ) : (
              <Banknote size={14} className="text-emerald-300" />
            )}
            <div className="font-display text-lg font-bold">
              {s.valueLabel}
            </div>
          </div>
          <div className="text-[10px] text-white/55">
            {s.valueType === "percentage"
              ? "Discount on annual fees"
              : "One-time fixed grant"}
          </div>
        </div>

        {s.criteria && (
          <div className="mt-3 line-clamp-2 text-[11px] text-white/65">
            {s.criteria}
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-white/45">
              Sponsor
            </div>
            <div className="mt-0.5 truncate text-white/75">{s.sponsor}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-white/45">
              Academic year
            </div>
            <div className="mt-0.5 truncate text-white/75">
              {s.academicYear}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider">
            <span className="text-white/55">Slots</span>
            <span className="text-white/75">
              {s.awardedCount}/{s.slots} · {s.fillPct}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(2, s.fillPct)}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-brand-500 to-accent-violet"
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-[10px] text-white/55">
            {s.appliedCount} application{s.appliedCount === 1 ? "" : "s"}
          </div>
          {canApply && s.active && (
            <button
              onClick={onApply}
              className="inline-flex items-center gap-1 rounded-lg bg-brand-500/20 px-3 py-1.5 text-xs text-brand-200 ring-1 ring-brand-400/30 hover:bg-brand-500/30"
            >
              Apply <Plus size={11} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ---------- Applications list ----------

function ApplicationsList({ applications, loading, onOpen }) {
  // Group by status pipeline
  const byStatus = useMemo(() => {
    const m = {};
    for (const s of STATUS_ORDER) m[s] = [];
    for (const a of applications) {
      if (!m[a.status]) m[a.status] = [];
      m[a.status].push(a);
    }
    return m;
  }, [applications]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-72" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {STATUS_ORDER.map((status) => (
        <StatusColumn
          key={status}
          status={status}
          items={byStatus[status] || []}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}

function StatusColumn({ status, items, onOpen }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-white/75">
          <StatusIcon status={status} />
          {status}
        </div>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/65">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 p-3 text-center text-[10px] text-white/30">
          empty
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <ApplicationMini key={a.id} a={a} onClick={() => onOpen(a)} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }) {
  const I =
    status === "Applied"
      ? FileText
      : status === "Under Review"
      ? Hourglass
      : status === "Awarded"
      ? CheckCircle2
      : status === "Rejected"
      ? XCircle
      : AlertCircle;
  return <I size={12} className="text-white/55" />;
}

function ApplicationMini({ a, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-left text-xs transition-colors hover:border-white/20 hover:bg-white/[0.07]"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-accent-violet text-[10px] font-bold">
          {a.studentAvatar}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{a.studentName}</div>
          <div className="truncate text-[10px] text-white/45">
            G{a.studentGrade}-{a.studentSection} · {a.studentHouse}
          </div>
        </div>
      </div>
      <div className="mt-2">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ring-1 ${
            TYPE_TONES[a.schemeType] ||
            "bg-white/5 text-white/65 ring-white/15"
          }`}
        >
          {a.schemeType}
        </span>
      </div>
      <div className="mt-1 truncate text-[10px] text-white/65">
        {a.schemeName}
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-white/45">
        <span>{a.schemeValueLabel}</span>
        <span>
          {a.daysInPipeline}d{" "}
          {a.status === "Awarded" || a.status === "Rejected"
            ? "ago"
            : "in queue"}
        </span>
      </div>
    </button>
  );
}

// ---------- Application detail panel ----------

function ApplicationDetail({ app: initialApp, canDecide, onClose, onChanged }) {
  const [a, setA] = useState(initialApp);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(initialApp.reviewerNote || "");
  const [disbursement, setDisbursement] = useState(
    initialApp.disbursement || "Annual lump sum"
  );

  useEffect(() => {
    setA(initialApp);
    setNote(initialApp.reviewerNote || "");
    setDisbursement(initialApp.disbursement || "Annual lump sum");
  }, [initialApp.id]);

  async function transition(status) {
    setBusy(true);
    try {
      const updated = await endpoints.scholarshipDecide(a.id, {
        status,
        note,
        disbursement: status === "Awarded" ? disbursement : undefined,
      });
      setA(updated);
      onChanged?.();
    } catch (e) {
      alert(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  }

  async function withdraw() {
    if (!confirm("Withdraw this application?")) return;
    setBusy(true);
    try {
      const updated = await endpoints.scholarshipWithdraw(a.id);
      setA(updated);
      onChanged?.();
    } catch (e) {
      alert(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: 480 }}
        animate={{ x: 0 }}
        exit={{ x: 480 }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-[#0a0a1f] p-6 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ring-1 ${
                  STATUS_TONES[a.status]
                }`}
              >
                {a.status}
              </span>
              <span className="text-[11px] font-mono text-white/45">{a.id}</span>
            </div>
            <div className="mt-1 font-display text-lg font-semibold">
              {a.schemeName}
            </div>
            <div className="text-xs text-white/55">
              {a.schemeType} · {a.schemeValueLabel} · {a.academicYear}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/55 hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        {/* Student card */}
        <Link
          to={`/app/students/${a.studentId}`}
          className="card mb-3 flex items-center gap-3 transition-colors hover:border-brand-500/30"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-violet font-display text-sm font-bold">
            {a.studentAvatar}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-sm font-semibold">
              {a.studentName}
            </div>
            <div className="truncate text-[11px] text-white/55">
              {a.studentId} · Grade {a.studentGrade}-{a.studentSection} ·{" "}
              {a.studentHouse}
            </div>
          </div>
        </Link>

        {/* Reason */}
        {a.reason && (
          <div className="card mb-3">
            <div className="text-[10px] uppercase tracking-wider text-white/55">
              Reason / case
            </div>
            <div className="mt-1 text-sm text-white/85">{a.reason}</div>
          </div>
        )}

        {/* Need-based extras */}
        {a.familyIncome != null && (
          <div className="card mb-3">
            <div className="text-[10px] uppercase tracking-wider text-white/55">
              Declared family income
            </div>
            <div className="mt-0.5 font-display text-xl font-bold text-brand-200">
              ₹{Number(a.familyIncome).toLocaleString("en-IN")}
              <span className="ml-1 text-xs font-normal text-white/55">
                / year
              </span>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="card mb-3 space-y-1.5 text-[11px] text-white/75">
          <Timeline label="Applied" date={a.appliedAt} on />
          <Timeline
            label="Decided"
            date={a.decidedAt}
            on={!!a.decidedAt}
            tone={
              a.status === "Awarded"
                ? "emerald"
                : a.status === "Rejected"
                ? "rose"
                : "neutral"
            }
          />
          {a.reviewer && (
            <div className="text-[10px] text-white/45">
              Reviewed by {a.reviewer}
            </div>
          )}
        </div>

        {a.reviewerNote && a.status !== "Applied" && (
          <div className="card mb-3 border-white/5">
            <div className="text-[10px] uppercase tracking-wider text-white/55">
              Reviewer note
            </div>
            <div className="mt-1 whitespace-pre-wrap text-sm text-white/85">
              {a.reviewerNote}
            </div>
          </div>
        )}

        {a.disbursement && a.status === "Awarded" && (
          <div className="card mb-3 border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 to-transparent">
            <div className="text-[10px] uppercase tracking-wider text-emerald-300">
              Disbursement plan
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-sm">
              <Coins size={14} className="text-emerald-300" />
              {a.disbursement}
            </div>
          </div>
        )}

        {/* Decision panel */}
        {canDecide && !["Awarded", "Rejected", "Withdrawn"].includes(a.status) && (
          <div className="card mb-3">
            <div className="mb-2 text-[10px] uppercase tracking-wider text-white/55">
              Decide
            </div>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reviewer note (visible to the family)…"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
            />
            <div className="mt-2">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Disbursement (if awarded)
              </div>
              <select
                value={disbursement}
                onChange={(e) => setDisbursement(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
              >
                <option>Annual lump sum</option>
                <option>Per-term split</option>
                <option>Monthly</option>
              </select>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {a.status === "Applied" && (
                <button
                  onClick={() => transition("Under Review")}
                  disabled={busy}
                  className="inline-flex items-center gap-1 rounded-xl border border-amber-400/30 bg-amber-500/15 px-3 py-2 text-xs text-amber-200 hover:bg-amber-500/25 disabled:opacity-50"
                >
                  <Hourglass size={11} /> Move to review
                </button>
              )}
              <button
                onClick={() => transition("Awarded")}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-50"
              >
                <CheckCircle2 size={11} /> Award
              </button>
              <button
                onClick={() => transition("Rejected")}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-xl border border-rose-400/30 bg-rose-500/15 px-3 py-2 text-xs text-rose-200 hover:bg-rose-500/25 disabled:opacity-50"
              >
                <XCircle size={11} /> Reject
              </button>
            </div>
          </div>
        )}

        {!["Awarded", "Withdrawn"].includes(a.status) && (
          <button
            onClick={withdraw}
            disabled={busy}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/65 hover:bg-white/10 disabled:opacity-50"
          >
            Withdraw application
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

function Timeline({ label, date, on, tone = "brand" }) {
  const toneClasses =
    tone === "emerald"
      ? "bg-emerald-500"
      : tone === "rose"
      ? "bg-rose-500"
      : tone === "neutral"
      ? "bg-white/30"
      : "bg-brand-500";
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex h-3 w-3 items-center justify-center rounded-full ${
          on ? toneClasses : "bg-white/15"
        }`}
      />
      <span className="text-white/75">{label}</span>
      <span className="ml-auto text-white/45">
        {date ? formatDate(date) : "—"}
      </span>
    </div>
  );
}

// ---------- Apply modal (with student picker) ----------

function ApplyModal({ scheme, onClose, onApplied }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reason, setReason] = useState("");
  const [familyIncome, setFamilyIncome] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debounced || debounced.length < 2) {
      setStudents([]);
      return;
    }
    let cancelled = false;
    endpoints
      .students({ q: debounced })
      .then((r) => {
        if (cancelled) return;
        setStudents(r.items || r || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  async function submit(e) {
    e.preventDefault();
    if (!selectedStudent) {
      setErr("Pick a student");
      return;
    }
    if (scheme.type === "Need-based" && !familyIncome) {
      setErr("Family income required for Need-based scholarships");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      await endpoints.scholarshipApply({
        schemeId: scheme.id,
        studentId: selectedStudent.id,
        reason: reason || undefined,
        familyIncome: familyIncome ? Number(familyIncome) : undefined,
      });
      onApplied();
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const input =
    "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.form
        onSubmit={submit}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 320 }}
        className="w-full max-w-lg overflow-y-auto rounded-3xl bg-[#0a0a1f] p-5 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="font-display text-base font-semibold">
              Apply to scheme
            </div>
            <div className="mt-0.5 text-xs text-white/55">
              {scheme.name} ·{" "}
              <span className="text-brand-200">{scheme.valueLabel}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/55 hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Search student
            </div>
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (selectedStudent) setSelectedStudent(null);
              }}
              placeholder="Type student name or ID…"
              className={input}
            />
            {selectedStudent ? (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-brand-400/30 bg-brand-500/10 p-2 text-xs">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-accent-violet text-[10px] font-bold">
                  {selectedStudent.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">
                    {selectedStudent.name}
                  </div>
                  <div className="truncate text-[10px] text-white/55">
                    {selectedStudent.id} · Grade {selectedStudent.grade}-
                    {selectedStudent.section} ·{" "}
                    {selectedStudent.house}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudent(null);
                    setQuery("");
                  }}
                  className="rounded p-1 text-white/55 hover:bg-white/10"
                >
                  <X size={12} />
                </button>
              </div>
            ) : students.length > 0 ? (
              <div className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-white/10 bg-black/30">
                {students.slice(0, 12).map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => {
                      setSelectedStudent(s);
                      setQuery("");
                    }}
                    className="flex w-full items-center gap-2 border-b border-white/5 px-2 py-1.5 text-left text-xs last:border-0 hover:bg-white/5"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-accent-violet text-[9px] font-bold">
                      {s.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{s.name}</div>
                      <div className="truncate text-[10px] text-white/55">
                        {s.id} · G{s.grade}-{s.section}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </label>

          {scheme.type === "Need-based" && (
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Declared family income (₹ per year)
              </div>
              <input
                type="number"
                min="0"
                step="1000"
                value={familyIncome}
                onChange={(e) => setFamilyIncome(e.target.value)}
                placeholder="e.g. 250000"
                className={input}
              />
            </label>
          )}

          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Reason / supporting case
            </div>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is the student eligible for this scheme?"
              className={`${input} resize-y`}
            />
          </label>
        </div>

        {err && (
          <div className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {err}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm text-white/65 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !selectedStudent}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit application"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

// ---------- New scheme modal ----------

function NewSchemeModal({ types, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    type: types[0] || "Merit",
    valueType: "percentage",
    value: 25,
    slots: 5,
    criteria: "",
    sponsor: "School Corpus",
    academicYear: "2026-27",
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setErr("Name required");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      await endpoints.schemeAdd({
        ...form,
        value: Number(form.value),
        slots: Number(form.slots),
      });
      onCreated();
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const input =
    "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.form
        onSubmit={submit}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 320 }}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0a0a1f] p-5 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="font-display text-base font-semibold">
            New scholarship scheme
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/55 hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Name
            </div>
            <input
              autoFocus
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={input}
              placeholder="e.g. Founder's Merit Award"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Type
              </div>
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                className={input}
              >
                {types.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Academic year
              </div>
              <input
                value={form.academicYear}
                onChange={(e) => set("academicYear", e.target.value)}
                className={input}
                placeholder="2026-27"
              />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Value type
              </div>
              <select
                value={form.valueType}
                onChange={(e) => set("valueType", e.target.value)}
                className={input}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed (₹)</option>
              </select>
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                {form.valueType === "percentage" ? "Percent" : "Amount (₹)"}
              </div>
              <input
                type="number"
                required
                min="1"
                value={form.value}
                onChange={(e) => set("value", e.target.value)}
                className={input}
              />
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Slots
              </div>
              <input
                type="number"
                required
                min="1"
                value={form.slots}
                onChange={(e) => set("slots", e.target.value)}
                className={input}
              />
            </label>
          </div>

          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Criteria
            </div>
            <textarea
              rows={3}
              value={form.criteria}
              onChange={(e) => set("criteria", e.target.value)}
              className={`${input} resize-y`}
              placeholder="Who qualifies for this scheme?"
            />
          </label>

          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Sponsor
            </div>
            <input
              value={form.sponsor}
              onChange={(e) => set("sponsor", e.target.value)}
              className={input}
              placeholder="e.g. Class of 2014 Alumni / School Corpus"
            />
          </label>
        </div>

        {err && (
          <div className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {err}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm text-white/65 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create scheme"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
