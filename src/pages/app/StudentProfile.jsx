import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Users,
  Phone,
  CalendarCheck,
  Wallet,
  Trophy,
  Sparkles as SparklesIcon,
  HeartPulse,
  ShieldAlert,
  FileText,
  Library,
  Building2,
  Activity,
  AlertTriangle,
  Droplet,
  Syringe,
  Stethoscope,
  ScrollText,
  BadgeCheck,
  Award,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import Sparkles from "../../components/fx/Sparkles.jsx";

const SEVERITY_TONES = {
  Minor: "bg-white/5 text-white/65 ring-white/15",
  Moderate: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  Major: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

const STATUS_TONES = {
  Open: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  "Under Review": "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  Resolved: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Escalated: "bg-accent-pink/15 text-pink-200 ring-accent-pink/30",
};

const DOC_TONES = {
  Requested: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  Approved: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  Issued: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Rejected: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

const FEE_TONES = {
  Paid: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Pending: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  Partial: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
};

const HOUSE_COLORS = {
  Crimson: "from-rose-500 to-rose-700",
  Azure: "from-brand-500 to-brand-700",
  Emerald: "from-emerald-500 to-emerald-700",
  Amber: "from-amber-400 to-amber-600",
};

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");

  const { data, loading, error, refetch } = useApi(
    () => endpoints.studentProfile(id),
    [id]
  );

  // Refresh on any per-student-touching event
  useRealtime(
    [
      "students.changed",
      "attendance.changed",
      "fees.changed",
      "marks.changed",
      "documents.changed",
      "health.changed",
      "discipline.changed",
      "achievements.changed",
      "library.changed",
      "hostel.changed",
    ],
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

  if (error) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  const { student, health, discipline, documents, exams, library, hostel, achievements, cafeteria, billing } = data;
  const houseGrad = HOUSE_COLORS[student.house] || "from-brand-500 to-accent-pink";

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white"
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${houseGrad}/30 p-6 md:p-8`}
      >
        <Sparkles count={12} />
        <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${houseGrad} font-display text-3xl font-bold text-white shadow-glow md:h-24 md:w-24 md:text-4xl`}
            >
              {student.avatar}
            </div>
            <div>
              <div className="chip mb-2">
                <SparklesIcon size={12} className="text-accent-gold" />
                Student profile
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
                {student.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/75">
                <span className="font-mono">{student.id}</span>
                <span>·</span>
                <span>Grade {student.grade} – Section {student.section}</span>
                <span>·</span>
                <span>{student.house} House</span>
              </div>
              <div className="mt-2 inline-flex items-center gap-2 text-xs text-white/65">
                <Phone size={12} /> {student.parent} · {student.contact}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <HeroStat label="Attendance" value={`${student.attendance}%`} icon={CalendarCheck} accent="text-emerald-300" />
            <HeroStat label="GPA" value={student.gpa} icon={Trophy} accent="text-accent-gold" />
            <HeroStat label="Achievements" value={achievements?.points || 0} icon={Award} accent="text-amber-300" />
            <HeroStat label="Demerits" value={discipline.demerits} icon={ShieldAlert} accent={discipline.demerits > 5 ? "text-rose-300" : "text-white/85"} />
            <HeroStat
              label="Fees"
              value={student.feeStatus}
              icon={Wallet}
              chip={FEE_TONES[student.feeStatus]}
            />
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
        <TabButton active={tab === "overview"} onClick={() => setTab("overview")} icon={Users}>
          Overview
        </TabButton>
        <TabButton active={tab === "academic"} onClick={() => setTab("academic")} icon={Trophy}>
          Academic
        </TabButton>
        <TabButton active={tab === "wellbeing"} onClick={() => setTab("wellbeing")} icon={HeartPulse}>
          Wellbeing
        </TabButton>
        <TabButton active={tab === "conduct"} onClick={() => setTab("conduct")} icon={ShieldAlert}>
          Conduct
        </TabButton>
        <TabButton active={tab === "records"} onClick={() => setTab("records")} icon={FileText}>
          Records
        </TabButton>
        <TabButton active={tab === "activity"} onClick={() => setTab("activity")} icon={Activity}>
          Activity
        </TabButton>
      </div>

      {/* Sections */}
      {tab === "overview" && (
        <OverviewSection data={data} />
      )}
      {tab === "academic" && (
        <AcademicSection exams={exams} />
      )}
      {tab === "wellbeing" && (
        <WellbeingSection health={health} cafeteria={cafeteria} />
      )}
      {tab === "conduct" && (
        <ConductSection discipline={discipline} achievements={achievements} />
      )}
      {tab === "records" && (
        <RecordsSection documents={documents} library={library} hostel={hostel} billing={billing} />
      )}
      {tab === "activity" && (
        <ActivitySection activity={data.activity || []} />
      )}
    </div>
  );
}

function HeroStat({ label, value, icon: Icon, accent, chip }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 backdrop-blur">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-white/55">
        <Icon size={11} /> {label}
      </div>
      {chip ? (
        <span className={`mt-1 inline-block rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${chip}`}>
          {value}
        </span>
      ) : (
        <div className={`font-display text-2xl font-bold ${accent || ""}`}>{value}</div>
      )}
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

// =================== OVERVIEW ===================
function OverviewSection({ data }) {
  const { health, discipline, exams, library, hostel, documents } = data;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Academic snapshot */}
      <Card title="Academic" icon={Trophy} tint="from-accent-gold/20">
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Exams taken" value={exams.total} />
          <Metric label="Avg %" value={exams.avgPct !== null ? exams.avgPct + "%" : "—"} tone={exams.avgPct >= 75 ? "text-emerald-300" : exams.avgPct >= 50 ? "text-amber-300" : "text-rose-300"} />
        </div>
        {exams.results.slice(0, 3).map((e) => (
          <div key={e.examId} className="mt-2 flex items-center justify-between text-xs">
            <span className="truncate text-white/70">{e.examName}</span>
            <span className="ml-2 inline-flex items-center gap-1 font-display font-bold text-accent-gold">
              {e.pct}% <span className="text-[10px] text-white/45">· {e.grade}</span>
            </span>
          </div>
        ))}
      </Card>

      {/* Health snapshot */}
      <Card title="Health" icon={HeartPulse} tint="from-rose-500/20" link="/app/health">
        {health ? (
          <>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-1.5 py-0.5 font-semibold text-rose-300 ring-1 ring-rose-400/30">
                <Droplet size={10} /> {health.profile.bloodGroup}
              </span>
              <span className="text-white/55">
                {health.profile.heightCm}cm · {health.profile.weightKg}kg
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 text-white/65">
                <Syringe size={11} className="text-emerald-300" />
                {health.vaxTaken}/{health.vaxTotal} vaccinated
              </span>
              <span className="text-white/45">
                {health.profile.allergies.length} allergies · {health.profile.chronicConditions.length} conditions
              </span>
            </div>
            {health.recentVisits.length > 0 && (
              <div className="mt-2 text-[11px] text-white/45">
                Last visit: {health.recentVisits[0].visitedOn} · {health.recentVisits[0].complaint}
              </div>
            )}
          </>
        ) : (
          <div className="text-xs text-white/40">No health profile on record</div>
        )}
      </Card>

      {/* Discipline snapshot */}
      <Card title="Conduct" icon={ShieldAlert} tint="from-accent-pink/20" link="/app/discipline">
        <div className="grid grid-cols-3 gap-2">
          <Metric label="Total" value={discipline.total} />
          <Metric label="Open" value={discipline.open} tone={discipline.open > 0 ? "text-rose-300" : "text-emerald-300"} />
          <Metric label="Demerits" value={discipline.demerits} tone="text-accent-violet" />
        </div>
        {discipline.recent.slice(0, 2).map((inc) => (
          <div key={inc.id} className="mt-2 flex items-center justify-between text-[11px]">
            <span className="truncate text-white/65">{inc.category}</span>
            <span className={`rounded-md px-1.5 py-0.5 font-medium ring-1 ${SEVERITY_TONES[inc.severity]}`}>
              {inc.severity}
            </span>
          </div>
        ))}
      </Card>

      {/* Documents snapshot */}
      <Card title="Documents" icon={FileText} tint="from-brand-500/20" link="/app/documents">
        <div className="grid grid-cols-2 gap-2">
          <Metric label="Total" value={documents.summary.total} />
          <Metric label="Issued" value={documents.summary.Issued} tone="text-emerald-300" />
          <Metric label="Pending" value={documents.summary.Requested + documents.summary.Approved} tone="text-amber-300" />
          <Metric label="Rejected" value={documents.summary.Rejected} tone="text-rose-300" />
        </div>
      </Card>

      {/* Library snapshot */}
      <Card title="Library" icon={Library} tint="from-accent-violet/20" link="/app/library">
        <div className="grid grid-cols-3 gap-2">
          <Metric label="Total" value={library.total} />
          <Metric label="Current" value={library.current} tone="text-brand-300" />
          <Metric label="Overdue" value={library.overdue} tone={library.overdue > 0 ? "text-rose-300" : "text-white/85"} />
        </div>
      </Card>

      {/* Hostel snapshot */}
      <Card title="Hostel" icon={Building2} tint="from-emerald-500/20" link="/app/hostel">
        {hostel ? (
          <>
            <div className="font-display text-base font-bold">
              {hostel.block} · Room {hostel.number}
            </div>
            <div className="mt-1 text-xs text-white/55">
              Floor {hostel.floor} · {hostel.occupants}/{hostel.capacity} occupied · {hostel.gender}
            </div>
          </>
        ) : (
          <div className="text-xs text-white/40">Day scholar — no hostel assignment</div>
        )}
      </Card>
    </div>
  );
}

// =================== ACADEMIC ===================
function AcademicSection({ exams }) {
  if (exams.results.length === 0) {
    return (
      <div className="card text-center text-white/55">
        <SparklesIcon className="mx-auto mb-2 text-accent-gold" size={20} />
        No completed exam results yet for this grade.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {exams.results.map((e, i) => (
        <motion.div
          key={e.examId}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
          className="card relative overflow-hidden"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-display text-lg font-semibold">{e.examName}</div>
              <div className="text-xs text-white/55">{e.type} · ended {e.endDate}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-white/55">Score</div>
                <div className="font-display text-xl font-bold text-accent-gold">
                  {e.total}<span className="text-sm text-white/55">/{e.max}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-white/55">Result</div>
                <div className="flex items-center gap-1">
                  <span className="font-display text-xl font-bold">{e.pct}%</span>
                  <span className={`rounded-md px-2 py-0.5 text-xs font-bold ring-1 ${gradeTone(e.grade)}`}>
                    {e.grade}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
            {e.subjects.map((s) => {
              const pct = Math.round((s.marks / s.maxMarks) * 100);
              return (
                <div key={s.subject} className="rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1.5">
                  <div className="truncate text-[10px] uppercase tracking-wider text-white/55">{s.subject}</div>
                  <div className="mt-0.5 flex items-baseline gap-1">
                    <span className={`font-display text-sm font-bold ${pct >= 75 ? "text-emerald-300" : pct >= 50 ? "text-amber-300" : "text-rose-300"}`}>
                      {s.marks}
                    </span>
                    <span className="text-[10px] text-white/40">/{s.maxMarks}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${
                        pct >= 75 ? "from-emerald-400 to-emerald-500" : pct >= 50 ? "from-amber-400 to-amber-500" : "from-rose-400 to-rose-500"
                      }`}
                      style={{ width: pct + "%" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function gradeTone(grade) {
  if (grade === "A+" || grade === "A")
    return "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30";
  if (grade === "B")
    return "bg-brand-500/15 text-brand-300 ring-brand-400/30";
  if (grade === "C" || grade === "D")
    return "bg-amber-500/15 text-amber-300 ring-amber-400/30";
  return "bg-rose-500/15 text-rose-300 ring-rose-400/30";
}

// =================== WELLBEING ===================
function WellbeingSection({ health, cafeteria }) {
  if (!health) {
    return (
      <div className="card text-center text-white/55">
        No health profile recorded yet.
        <Link to="/app/health" className="ml-2 text-brand-300 hover:underline">
          Open Health module →
        </Link>
      </div>
    );
  }
  const p = health.profile;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card title="Vital signs" icon={HeartPulse} tint="from-rose-500/20">
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Blood group" value={p.bloodGroup} tone="text-rose-300" />
          <Metric label="Height" value={`${p.heightCm} cm`} />
          <Metric label="Weight" value={`${p.weightKg} kg`} />
          <Metric label="Last checkup" value={p.lastCheckup} />
        </div>
        {p.allergies.length > 0 && (
          <div className="mt-3">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">Allergies</div>
            <div className="flex flex-wrap gap-1">
              {p.allergies.map((a) => (
                <span key={a} className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-medium text-amber-200 ring-1 ring-amber-400/30">
                  <AlertTriangle size={9} /> {a}
                </span>
              ))}
            </div>
          </div>
        )}
        {p.chronicConditions.length > 0 && (
          <div className="mt-2">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">Conditions</div>
            <div className="flex flex-wrap gap-1">
              {p.chronicConditions.map((c) => (
                <span key={c} className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-1.5 py-0.5 text-[11px] font-medium text-rose-200 ring-1 ring-rose-400/30">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-2 text-[11px]">
          <div className="text-white/55">Emergency contact</div>
          <div className="mt-0.5 font-medium">
            {p.emergencyContact?.name} ({p.emergencyContact?.relation})
          </div>
          <div className="font-mono text-white/65">{p.emergencyContact?.phone}</div>
        </div>
      </Card>

      <Card title="Vaccination" icon={Syringe} tint="from-emerald-500/20">
        <div className="mb-2 flex items-center justify-between">
          <div className="font-display text-2xl font-bold text-emerald-300">
            {health.vaxTaken}<span className="text-sm text-white/55">/{health.vaxTotal}</span>
          </div>
          <div className="text-[10px] uppercase tracking-wider text-white/55">
            doses on file
          </div>
        </div>
        <div className="space-y-1">
          {p.vaccinations.map((v) => (
            <div key={v.code} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1 text-xs">
              <span className={v.taken ? "text-white/85" : "text-white/45"}>{v.code}</span>
              <span className={v.taken ? "text-emerald-300" : "text-white/35"}>
                {v.taken ? `✓ ${v.date}` : "Not on file"}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {cafeteria && (
        <Card title="Dietary preferences" icon={Award} tint="from-emerald-500/20" link="/app/cafeteria" className="md:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/30">
              {cafeteria.mealPlan}
            </span>
            {cafeteria.specialDiet && (
              <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-200 ring-1 ring-amber-400/30">
                {cafeteria.specialDiet}
              </span>
            )}
            {(!cafeteria.specialDiet) && (
              <span className="text-[11px] text-white/40">No special diet on file</span>
            )}
          </div>
        </Card>
      )}

      <Card title="Recent nurse visits" icon={Stethoscope} tint="from-accent-violet/20" className="md:col-span-2">
        {health.recentVisits.length === 0 ? (
          <div className="text-xs text-white/40">No visits on record</div>
        ) : (
          <ul className="space-y-1.5">
            {health.recentVisits.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-white/85">{v.complaint}</div>
                  <div className="text-[10px] text-white/45">
                    {v.visitedOn} · {v.attendedBy}
                  </div>
                </div>
                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ${
                  v.severity === "Urgent" ? "bg-rose-500/15 text-rose-300 ring-rose-400/30" :
                  v.severity === "Moderate" ? "bg-amber-500/15 text-amber-300 ring-amber-400/30" :
                  "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
                }`}>
                  {v.severity}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

// =================== CONDUCT ===================
function ConductSection({ discipline, achievements }) {
  return (
    <div className="space-y-4">
      {/* Achievements section — positive recognition shown first */}
      {achievements && achievements.total > 0 && (
        <Card title="Achievements" icon={Award} tint="from-accent-gold/20" link="/app/achievements">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Total wins" value={achievements.total} tone="text-accent-gold" />
            <Metric label="Gold (1st)" value={achievements.gold} tone="text-amber-300" />
            <Metric label="Silver" value={achievements.silver} tone="text-slate-300" />
            <Metric label="Total points" value={achievements.points} tone="text-accent-gold" />
          </div>
          {achievements.recent.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {achievements.recent.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-white/85">{a.title}</div>
                    <div className="text-[10px] text-white/45">
                      {a.position} · {a.level} · {a.date}
                    </div>
                  </div>
                  <span className="ml-2 inline-flex items-center gap-1 font-display font-bold text-accent-gold">
                    +{a.points}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card title="Total" icon={ScrollText} tint="from-brand-500/20">
          <div className="font-display text-3xl font-bold">{discipline.total}</div>
        </Card>
        <Card title="Open" icon={Clock} tint="from-rose-500/20">
          <div className={`font-display text-3xl font-bold ${discipline.open > 0 ? "text-rose-300" : "text-emerald-300"}`}>
            {discipline.open}
          </div>
        </Card>
        <Card title="Demerits" icon={ShieldAlert} tint="from-accent-violet/20">
          <div className="font-display text-3xl font-bold text-accent-violet">{discipline.demerits}</div>
        </Card>
        <Card title="Last 90 days" icon={CalendarCheck} tint="from-amber-500/20">
          <div className="font-display text-3xl font-bold">{discipline.last90}</div>
        </Card>
      </div>

      <Card title="Severity breakdown" icon={TrendingDown} tint="from-accent-pink/20">
        <div className="grid grid-cols-3 gap-3">
          {["Minor", "Moderate", "Major"].map((s) => (
            <div key={s} className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
              <div className={`text-[10px] uppercase tracking-wider ${s === "Major" ? "text-rose-300" : s === "Moderate" ? "text-amber-300" : "text-white/55"}`}>
                {s}
              </div>
              <div className="font-display text-2xl font-bold">{discipline.bySeverity[s] || 0}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Incident history" icon={ScrollText} tint="from-brand-500/20">
        {discipline.recent.length === 0 ? (
          <div className="text-center text-xs text-white/40">No incidents on record — clean slate.</div>
        ) : (
          <div className="space-y-2">
            {discipline.recent.map((i) => (
              <div key={i.id} className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-white/70 ring-1 ring-white/10">
                    {i.category}
                  </span>
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ${SEVERITY_TONES[i.severity]}`}>
                    {i.severity}
                  </span>
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ${STATUS_TONES[i.status]}`}>
                    {i.status}
                  </span>
                  <span className="ml-auto text-[10px] text-white/45">{i.reportedOn}</span>
                </div>
                <div className="mt-2 text-sm text-white/85">{i.description}</div>
                {i.resolution && (
                  <div className="mt-1 text-xs text-emerald-300/80">✓ {i.resolution}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// =================== RECORDS ===================
function RecordsSection({ documents, library, hostel, billing }) {
  return (
    <div className="space-y-4">
      {billing && (
        <Card title="Fee billing" icon={Wallet} tint="from-emerald-500/20" link="/app/fees">
          <div className="grid grid-cols-3 gap-2">
            <Metric label="Annual total" value={`₹${billing.totalExpected.toLocaleString()}`} />
            <Metric label="Paid" value={`₹${billing.totalPaid.toLocaleString()}`} tone="text-emerald-300" />
            <Metric label="Outstanding" value={`₹${billing.outstanding.toLocaleString()}`} tone={billing.outstanding > 0 ? "text-rose-300" : "text-emerald-300"} />
          </div>
          {billing.payments && billing.payments.length > 0 && (
            <div className="mt-3 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-white/55">Recent payments</div>
              {billing.payments.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-emerald-300">
                      ₹{p.amount.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-white/45">
                      {p.mode} · {p.receiptNo || "—"} · {new Date(p.paidOn).toLocaleDateString()}
                    </div>
                  </div>
                  {p.receiptNo && (
                    <Link
                      to={`/print/receipts/${p.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] hover:bg-white/10"
                    >
                      Receipt
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Card title="Documents & certificates" icon={FileText} tint="from-brand-500/20" link="/app/documents">
        {documents.items.length === 0 ? (
          <div className="text-center text-xs text-white/40">No document requests yet.</div>
        ) : (
          <ul className="space-y-1.5">
            {documents.items.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white/85">{d.type}</span>
                    <span className="font-mono text-[10px] text-white/45">{d.id}</span>
                  </div>
                  <div className="text-[10px] text-white/45">
                    Requested {d.requestedOn} · {d.purpose}
                    {d.certificateNo && ` · ${d.certificateNo}`}
                  </div>
                </div>
                <span className={`ml-2 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ${DOC_TONES[d.status]}`}>
                  {d.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Library activity" icon={Library} tint="from-accent-violet/20" link="/app/library">
        {library.issues.length === 0 ? (
          <div className="text-center text-xs text-white/40">No library issues on file.</div>
        ) : (
          <ul className="space-y-1.5">
            {library.issues.map((i) => (
              <li
                key={i.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-white/85">{i.bookTitle}</div>
                  <div className="text-[10px] text-white/45">
                    {i.bookAuthor} · Issued {i.issuedOn} · Due {i.dueOn}
                  </div>
                </div>
                {i.returnedOn ? (
                  <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300 ring-1 ring-emerald-400/30">
                    Returned
                  </span>
                ) : i.overdue ? (
                  <span className="rounded-md bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-medium text-rose-300 ring-1 ring-rose-400/30">
                    Overdue
                  </span>
                ) : (
                  <span className="rounded-md bg-brand-500/15 px-1.5 py-0.5 text-[10px] font-medium text-brand-300 ring-1 ring-brand-400/30">
                    On loan
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Hostel assignment" icon={Building2} tint="from-emerald-500/20" link="/app/hostel">
        {hostel ? (
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-brand-500 font-display text-lg font-bold text-white">
              {hostel.block[0]}
            </div>
            <div>
              <div className="font-display text-lg font-semibold">
                {hostel.block} · Room {hostel.number}
              </div>
              <div className="text-xs text-white/55">
                Floor {hostel.floor} · {hostel.occupants}/{hostel.capacity} occupied · {hostel.gender}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-white/40">Day scholar — no hostel assignment.</div>
        )}
      </Card>
    </div>
  );
}

// =================== ACTIVITY ===================
function ActivitySection({ activity }) {
  if (activity.length === 0) {
    return (
      <div className="card text-center text-white/55">
        No recent activity touching this student.
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
              {a.summary && (
                <div className="mt-0.5 truncate text-[10px] text-white/45">
                  {Object.entries(a.summary).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(" · ")}
                </div>
              )}
            </div>
            <div className="text-right text-[10px] text-white/45">
              <div>{a.userName}</div>
              <div className="text-[9px]">{new Date(a.at).toLocaleString()}</div>
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

// =================== shared bits ===================
function Card({ title, icon: Icon, tint, link, className = "", children }) {
  const content = (
    <>
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
    </>
  );
  return (
    <div className={`card relative overflow-hidden ${className}`}>
      {content}
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
