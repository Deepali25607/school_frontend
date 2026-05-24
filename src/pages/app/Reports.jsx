import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import {
  Users,
  GraduationCap,
  UserPlus,
  Wrench,
  IdCard,
  ClipboardCheck,
  Package,
  Calendar,
  FileText,
  HeartPulse,
  ShieldAlert,
  Trophy,
  UtensilsCrossed,
  Sparkles as SparklesIcon,
  TrendingUp,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const FEE_TONES = {
  Paid: "#5cf2c4",
  Partial: "#ffd166",
  Pending: "#ff5ec4",
};

const GRADE_DIST_COLORS = {
  "A+": "#5cf2c4",
  A: "#86ff9d",
  B: "#86a8ff",
  C: "#3ad6ff",
  D: "#ffd166",
  E: "#ff8b5c",
  F: "#ff5ec4",
};

const MODULE_ICONS = {
  students: Users,
  teachers: GraduationCap,
  admissionsInPipeline: UserPlus,
  openTickets: Wrench,
  visitorsToday: IdCard,
  pendingLeaves: ClipboardCheck,
  lowStockItems: Package,
  upcomingEvents: Calendar,
  pendingDocs: FileText,
  sickbayLast7d: HeartPulse,
  openIncidents: ShieldAlert,
  medalsThisYear: Trophy,
  mealsToday: UtensilsCrossed,
};

const MODULE_LABELS = {
  students: "Students",
  teachers: "Teachers",
  admissionsInPipeline: "Admissions in pipeline",
  openTickets: "Open maintenance tickets",
  visitorsToday: "Visitors today",
  pendingLeaves: "Pending leave requests",
  lowStockItems: "Low-stock items",
  upcomingEvents: "Upcoming events",
  pendingDocs: "Pending documents",
  sickbayLast7d: "Sickbay visits (7d)",
  openIncidents: "Open incidents",
  medalsThisYear: "Medals this year",
  mealsToday: "Meals today",
};

const MODULE_TINTS = {
  students: "from-brand-500/30",
  teachers: "from-accent-violet/30",
  admissionsInPipeline: "from-accent-pink/30",
  openTickets: "from-rose-500/30",
  visitorsToday: "from-emerald-500/30",
  pendingLeaves: "from-amber-500/30",
  lowStockItems: "from-orange-500/30",
  upcomingEvents: "from-accent-gold/30",
  pendingDocs: "from-cyan-500/30",
  sickbayLast7d: "from-rose-500/30",
  openIncidents: "from-accent-pink/30",
  medalsThisYear: "from-accent-gold/30",
  mealsToday: "from-orange-500/30",
};

export default function Reports() {
  const { data, loading, error, refetch } = useApi(
    endpoints.reportsOverview,
    []
  );
  // Reports aggregate everything — refresh on any module mutation
  useRealtime(
    [
      "admissions.changed",
      "students.changed",
      "teachers.changed",
      "maintenance.changed",
      "visitors.changed",
      "leave.changed",
      "inventory.changed",
      "events.changed",
      "marks.changed",
      "fees.changed",
      "documents.changed",
      "health.changed",
      "discipline.changed",
      "achievements.changed",
      "cafeteria.changed",
    ],
    () => refetch()
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Analytics"
        title="Reports & Analytics"
        subtitle={
          data
            ? `Live cross-module dashboard · generated ${new Date(data.generatedAt).toLocaleString()}`
            : "Loading consolidated dashboard…"
        }
      />

      {error && <ErrorState error={error} onRetry={refetch} />}

      {/* Module counts strip */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
          {Object.entries(data.moduleCounts).map(([key, value], i) => {
            const Icon = MODULE_ICONS[key] || SparklesIcon;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card relative overflow-hidden"
              >
                <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${MODULE_TINTS[key]} to-transparent blur-2xl`} />
                <div className="relative">
                  <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                    <Icon size={16} />
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-white/55">
                    {MODULE_LABELS[key] || key}
                  </div>
                  <div className="font-display text-2xl font-bold glow-text">
                    {value}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Enrollment by grade */}
        <ChartCard
          title="Enrollment by grade"
          subtitle="Students per grade · school-wide"
          loading={loading}
        >
          {data && (
            <ResponsiveContainer>
              <BarChart data={data.enrollmentByGrade}>
                <defs>
                  <linearGradient id="g-enrollment" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5b81ff" />
                    <stop offset="100%" stopColor="#9b5cff" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="grade" stroke="rgba(255,255,255,0.55)" tickLine={false} axisLine={false} fontSize={10} />
                <YAxis stroke="rgba(255,255,255,0.55)" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="students" fill="url(#g-enrollment)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Attendance % by grade */}
        <ChartCard
          title="Average attendance by grade"
          subtitle="Trailing rolling average · %"
          loading={loading}
        >
          {data && (
            <ResponsiveContainer>
              <BarChart data={data.attendanceByGrade}>
                <defs>
                  <linearGradient id="g-attendance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5cf2c4" />
                    <stop offset="100%" stopColor="#3ad6ff" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="grade" stroke="rgba(255,255,255,0.55)" tickLine={false} axisLine={false} fontSize={10} />
                <YAxis stroke="rgba(255,255,255,0.55)" tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
                <Bar dataKey="present" fill="url(#g-attendance)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* House distribution */}
        <ChartCard
          title="House distribution"
          subtitle="Students by house"
          loading={loading}
        >
          {data && (
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data.houseDist}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {data.houseDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
          {data && (
            <div className="mt-2 flex flex-wrap gap-3 text-xs">
              {data.houseDist.map((h) => (
                <div key={h.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: h.color }} />
                  <span className="text-white/70">{h.name}</span>
                  <span className="text-white/45">({h.value})</span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        {/* Grade distribution (exam marks) */}
        <ChartCard
          title="Exam grade distribution"
          subtitle="Across all completed exams · letter grades"
          loading={loading}
        >
          {data && (
            <ResponsiveContainer>
              <BarChart data={data.gradeDist}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="grade" stroke="rgba(255,255,255,0.55)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.55)" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {data.gradeDist.map((g, i) => (
                    <Cell key={i} fill={GRADE_DIST_COLORS[g.grade] || "#888"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Fee mix */}
      <ChartCard
        title="Fee collection status"
        subtitle="Distribution across the active student body"
        loading={loading}
        tall
      >
        {data && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {data.feeMix.map((m, i) => {
              const total = data.feeMix.reduce((a, b) => a + b.count, 0);
              const pct = total ? Math.round((m.count / total) * 100) : 0;
              return (
                <motion.div
                  key={m.status}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="text-xs uppercase tracking-wider text-white/55">
                    {m.status}
                  </div>
                  <div className="font-display text-3xl font-bold" style={{ color: FEE_TONES[m.status] }}>
                    {m.count}
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full rounded-full"
                      style={{ background: FEE_TONES[m.status] }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-white/55">
                    <span>{pct}% of total</span>
                    <span className="inline-flex items-center gap-1 text-emerald-300/70">
                      <TrendingUp size={10} /> tracked live
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, subtitle, loading, children, tall }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="font-display text-lg font-semibold">{title}</div>
          {subtitle && <div className="text-xs text-white/55">{subtitle}</div>}
        </div>
      </div>
      <div className={tall ? "" : "h-72"}>
        {loading ? <Skeleton className="h-full" /> : children}
      </div>
    </motion.div>
  );
}

const tooltipStyle = {
  background: "#0f1024",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  color: "white",
};
