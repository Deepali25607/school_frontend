import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  GraduationCap,
  Mail,
  Star,
  ClipboardList,
  Briefcase,
  ClipboardCheck,
  Activity,
  ShieldAlert,
  CalendarDays,
  Sparkles as SparklesIcon,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  FolderOpen,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import Sparkles from "../../components/fx/Sparkles.jsx";
import DocumentRecords from "../../components/DocumentRecords.jsx";

const STATUS_TONES = {
  Active: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  "On leave": "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  Inactive: "bg-white/5 text-white/55 ring-white/15",
};

const LEAVE_STATUS_TONES = {
  Pending: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  Approved: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Rejected: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

const LEAVE_STATUS_ICONS = {
  Pending: Clock,
  Approved: CheckCircle2,
  Rejected: XCircle,
};

const SEVERITY_TONES = {
  Minor: "bg-white/5 text-white/65 ring-white/15",
  Moderate: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  Major: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function TeacherProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");

  const { data, loading, error, refetch } = useApi(
    () => endpoints.teacherProfile(id),
    [id]
  );

  useRealtime(
    ["teachers.changed", "timetable.changed", "leave.changed", "discipline.changed", "doc-records.changed"],
    () => refetch()
  );

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-44" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const { teacher, classLoad, leave, discipline, activity, docRecords } = data;

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white"
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-500/30 via-accent-violet/20 to-accent-pink/20 p-6 md:p-8"
      >
        <Sparkles count={12} />
        <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-pink font-display text-3xl font-bold text-white shadow-glow md:h-24 md:w-24 md:text-4xl">
              {teacher.avatar}
            </div>
            <div>
              <div className="chip mb-2">
                <SparklesIcon size={12} className="text-accent-gold" />
                Teacher profile
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
                {teacher.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/75">
                <span className="font-mono">{teacher.id}</span>
                <span>·</span>
                <span>{teacher.subject}</span>
                <span>·</span>
                <span className={`rounded-md px-2 py-0.5 font-medium ring-1 ${STATUS_TONES[teacher.status] || STATUS_TONES.Active}`}>
                  {teacher.status}
                </span>
              </div>
              <div className="mt-2 inline-flex items-center gap-2 text-xs text-white/65">
                <Mail size={12} /> {teacher.email}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <HeroStat label="Periods/week" value={classLoad.totalPeriods} icon={ClipboardList} accent="text-brand-300" />
            <HeroStat label="Classes" value={classLoad.classes.length} icon={GraduationCap} accent="text-accent-violet" />
            <HeroStat label="Experience" value={`${teacher.experience}y`} icon={Briefcase} accent="text-accent-gold" />
            <HeroStat label="Rating" value={teacher.rating} icon={Star} accent="text-amber-300" />
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
        <TabButton active={tab === "overview"} onClick={() => setTab("overview")} icon={GraduationCap}>
          Overview
        </TabButton>
        <TabButton active={tab === "classes"} onClick={() => setTab("classes")} icon={ClipboardList}>
          Class load
        </TabButton>
        <TabButton active={tab === "leave"} onClick={() => setTab("leave")} icon={ClipboardCheck}>
          Leave
        </TabButton>
        <TabButton active={tab === "discipline"} onClick={() => setTab("discipline")} icon={ShieldAlert}>
          Incidents logged
        </TabButton>
        <TabButton active={tab === "documents"} onClick={() => setTab("documents")} icon={FolderOpen}>
          Documents
        </TabButton>
        <TabButton active={tab === "activity"} onClick={() => setTab("activity")} icon={Activity}>
          Activity
        </TabButton>
      </div>

      {tab === "overview" && <OverviewSection data={data} />}
      {tab === "classes" && <ClassLoadSection classLoad={classLoad} />}
      {tab === "leave" && <LeaveSection leave={leave} />}
      {tab === "discipline" && <DisciplineSection discipline={discipline} />}
      {tab === "documents" && (
        <DocumentRecords
          ownerType="teacher"
          ownerId={teacher.id}
          records={docRecords?.items || []}
          summary={docRecords?.summary}
          onChange={refetch}
        />
      )}
      {tab === "activity" && <ActivitySection activity={activity} />}
    </div>
  );
}

// =================== shared bits ===================
function HeroStat({ label, value, icon: Icon, accent }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 backdrop-blur">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-white/55">
        <Icon size={11} /> {label}
      </div>
      <div className={`font-display text-2xl font-bold ${accent || ""}`}>{value}</div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
        active
          ? "bg-gradient-to-r from-brand-500/30 to-accent-violet/20 text-white ring-1 ring-white/15"
          : "text-white/65 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon size={13} /> {children}
    </button>
  );
}

function Card({ title, icon: Icon, tint, link, className = "", children }) {
  return (
    <div className={`card relative overflow-hidden ${className}`}>
      <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${tint || "from-white/10"} to-transparent blur-2xl`} />
      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-white/65">
            <Icon size={12} /> {title}
          </div>
          {link && (
            <Link to={link} className="text-[10px] text-brand-300/80 hover:text-brand-200">
              Open →
            </Link>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
      <div className="text-[9px] uppercase tracking-wider text-white/55">{label}</div>
      <div className={`font-display text-lg font-bold ${tone || "text-white/85"}`}>
        {value}
      </div>
    </div>
  );
}

// =================== OVERVIEW ===================
function OverviewSection({ data }) {
  const { teacher, classLoad, leave, discipline } = data;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card title="Teaching profile" icon={GraduationCap} tint="from-brand-500/20">
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Subject" value={teacher.subject} />
          <Metric label="Department" value="Academics" />
          <Metric label="Status" value={teacher.status} tone={teacher.status === "Active" ? "text-emerald-300" : "text-amber-300"} />
          <Metric label="Rating" value={teacher.rating} tone="text-accent-gold" />
        </div>
        <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px]">
          <div className="text-white/55">Contact</div>
          <div className="mt-0.5 font-mono text-white/85">{teacher.email}</div>
        </div>
      </Card>

      <Card title="Workload" icon={ClipboardList} tint="from-accent-violet/20" link="/app/timetable">
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Periods / week" value={classLoad.totalPeriods} tone="text-brand-300" />
          <Metric label="Classes" value={classLoad.classes.length} tone="text-accent-violet" />
        </div>
        {classLoad.subjects.length > 0 && (
          <div className="mt-3">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">Subjects</div>
            <div className="flex flex-wrap gap-1">
              {classLoad.subjects.map((s) => (
                <span key={s} className="rounded-md bg-brand-500/15 px-1.5 py-0.5 text-[10px] font-medium text-brand-300 ring-1 ring-brand-400/30">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card title="Leave summary" icon={ClipboardCheck} tint="from-amber-500/20" link="/app/leave">
        <div className="grid grid-cols-3 gap-2">
          <Metric label="Pending" value={leave.summary.pending} tone={leave.summary.pending > 0 ? "text-amber-300" : "text-white/85"} />
          <Metric label="Approved" value={leave.summary.approved} tone="text-emerald-300" />
          <Metric label="Days off" value={leave.summary.daysApproved} tone="text-accent-violet" />
        </div>
      </Card>

      <Card title="Incidents reported" icon={ShieldAlert} tint="from-rose-500/20" link="/app/discipline" className="md:col-span-2">
        <div className="flex items-baseline gap-3">
          <div className="font-display text-3xl font-bold text-rose-300">{discipline.total}</div>
          <div className="text-xs text-white/55">incidents logged by this teacher</div>
        </div>
        {discipline.recent.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {discipline.recent.slice(0, 3).map((inc) => (
              <div key={inc.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-white/85">{inc.description}</div>
                  <div className="text-[10px] text-white/45">
                    {inc.category} · {inc.reportedOn}
                  </div>
                </div>
                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ${SEVERITY_TONES[inc.severity]}`}>
                  {inc.severity}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Weekly distribution" icon={CalendarDays} tint="from-cyan-500/20">
        <div className="space-y-1.5">
          {DAY_ORDER.map((d) => {
            const count = classLoad.weeklyByDay[d] || 0;
            const max = Math.max(...DAY_ORDER.map((x) => classLoad.weeklyByDay[x] || 0), 1);
            const pct = (count / max) * 100;
            return (
              <div key={d} className="flex items-center gap-2 text-xs">
                <span className="w-8 text-white/55">{d}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full rounded-full bg-gradient-to-r from-brand-400 to-accent-violet"
                  />
                </div>
                <span className="w-6 text-right tabular-nums text-white/65">{count}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// =================== CLASS LOAD ===================
function ClassLoadSection({ classLoad }) {
  if (classLoad.classes.length === 0) {
    return (
      <div className="card text-center text-white/55">
        No periods assigned to this teacher in the current timetable.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card title="Total periods" icon={ClipboardList} tint="from-brand-500/20">
          <div className="font-display text-3xl font-bold text-brand-300">{classLoad.totalPeriods}</div>
          <div className="mt-0.5 text-[10px] text-white/45">per week</div>
        </Card>
        <Card title="Classes covered" icon={GraduationCap} tint="from-accent-violet/20">
          <div className="font-display text-3xl font-bold text-accent-violet">{classLoad.classes.length}</div>
        </Card>
        <Card title="Subjects" icon={ClipboardList} tint="from-emerald-500/20">
          <div className="font-display text-3xl font-bold text-emerald-300">{classLoad.subjects.length}</div>
        </Card>
        <Card title="Avg / class" icon={TrendingUp} tint="from-amber-500/20">
          <div className="font-display text-3xl font-bold text-amber-300">
            {classLoad.classes.length > 0
              ? (classLoad.totalPeriods / classLoad.classes.length).toFixed(1)
              : 0}
          </div>
          <div className="mt-0.5 text-[10px] text-white/45">periods</div>
        </Card>
      </div>

      <Card title="Class breakdown" icon={ClipboardList} tint="from-brand-500/20">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
          {classLoad.classes.map((c) => (
            <div key={c.classKey} className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
              <div className="font-display text-base font-bold">{c.classKey}</div>
              <div className="mt-1 flex items-center justify-between text-xs text-white/55">
                <span>{c.periods} period{c.periods === 1 ? "" : "s"}/week</span>
                <span className="text-brand-300">{Math.round((c.periods / 6) * 100)}%</span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-400 to-accent-violet"
                  style={{ width: `${Math.min(100, (c.periods / 6) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// =================== LEAVE ===================
function LeaveSection({ leave }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card title="Total" icon={ClipboardCheck} tint="from-brand-500/20">
          <div className="font-display text-3xl font-bold">{leave.summary.total}</div>
        </Card>
        <Card title="Pending" icon={Clock} tint="from-amber-500/20">
          <div className={`font-display text-3xl font-bold ${leave.summary.pending > 0 ? "text-amber-300" : "text-white/85"}`}>
            {leave.summary.pending}
          </div>
        </Card>
        <Card title="Approved" icon={CheckCircle2} tint="from-emerald-500/20">
          <div className="font-display text-3xl font-bold text-emerald-300">{leave.summary.approved}</div>
        </Card>
        <Card title="Days off" icon={CalendarDays} tint="from-accent-violet/20">
          <div className="font-display text-3xl font-bold text-accent-violet">{leave.summary.daysApproved}</div>
        </Card>
      </div>

      <Card title="Leave history" icon={ClipboardCheck} tint="from-brand-500/20" link="/app/leave">
        {leave.items.length === 0 ? (
          <div className="text-center text-xs text-white/40">No leave requests on file.</div>
        ) : (
          <ul className="space-y-1.5">
            {leave.items.map((r) => {
              const Icon = LEAVE_STATUS_ICONS[r.status] || Clock;
              return (
                <li
                  key={r.id}
                  className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-xs"
                >
                  <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-white/70 ring-1 ring-white/10">
                    {r.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-white/85">{r.reason}</div>
                    <div className="text-[10px] text-white/45">
                      {r.fromDate} → {r.toDate} · {r.days} day{r.days === 1 ? "" : "s"}
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ${LEAVE_STATUS_TONES[r.status]}`}>
                    <Icon size={10} /> {r.status}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

// =================== DISCIPLINE ===================
function DisciplineSection({ discipline }) {
  if (discipline.total === 0) {
    return (
      <div className="card text-center text-white/55">
        No discipline incidents recorded by this teacher.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <Card title={`${discipline.total} incidents logged`} icon={ShieldAlert} tint="from-rose-500/20" link="/app/discipline">
        <div className="space-y-2">
          {discipline.recent.map((inc) => (
            <div key={inc.id} className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-white/70 ring-1 ring-white/10">
                  {inc.category}
                </span>
                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ${SEVERITY_TONES[inc.severity]}`}>
                  {inc.severity}
                </span>
                <span className="ml-auto text-[10px] text-white/45">{inc.reportedOn}</span>
              </div>
              <div className="mt-2 text-sm text-white/85">{inc.description}</div>
              <div className="mt-1 text-[10px] text-white/45">
                Student: <Link to={`/app/students/${inc.studentId}`} className="text-brand-300 hover:underline">{inc.studentId}</Link>
                {inc.resolution && <span className="ml-2 text-emerald-300/80">✓ {inc.resolution}</span>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// =================== ACTIVITY ===================
function ActivitySection({ activity }) {
  if (!activity || activity.length === 0) {
    return (
      <div className="card text-center text-white/55">
        No recent audit-log activity for this teacher.
      </div>
    );
  }
  return (
    <div className="card">
      <div className="space-y-2">
        {activity.map((a) => (
          <div key={a.id} className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.03] p-2">
            <span className={`mt-0.5 inline-flex w-12 justify-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${methodTone(a.method)}`}>
              {a.method}
            </span>
            <div className="min-w-0 flex-1">
              <code className="block truncate font-mono text-[11px] text-white/85">
                {a.path}
              </code>
            </div>
            <div className="text-right text-[10px] text-white/45">
              {new Date(a.at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function methodTone(method) {
  if (method === "POST") return "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30";
  if (method === "PATCH") return "bg-brand-500/15 text-brand-300 ring-brand-400/30";
  if (method === "DELETE") return "bg-rose-500/15 text-rose-300 ring-rose-400/30";
  return "bg-white/5 text-white/60 ring-white/10";
}
