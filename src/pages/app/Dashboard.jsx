import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import {
  Users,
  GraduationCap,
  Wallet,
  TrendingUp,
  CalendarCheck,
  Sparkles as SparklesIcon,
  ArrowUpRight,
} from "lucide-react";
import Sparkles from "../../components/fx/Sparkles.jsx";
import { RECENT_ACTIVITY } from "../../lib/mockData.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { endpoints } from "../../lib/api.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

function StatCard({ icon: Icon, label, value, delta, tint, idx }) {
  return (
    <motion.div
      {...fadeUp}
      transition={{ delay: idx * 0.05, duration: 0.5 }}
      whileHover={{ y: -4 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5"
    >
      <div
        className="absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl"
        style={{ background: tint }}
      />
      <div className="relative">
        <div className="flex items-center justify-between text-white/60">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
            <Icon size={18} />
          </div>
          {delta && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] font-medium text-emerald-300">
              <TrendingUp size={12} /> {delta}
            </span>
          )}
        </div>
        <div className="mt-4 text-xs uppercase tracking-[0.18em] text-white/55">
          {label}
        </div>
        <div className="stat-num glow-text mt-1">{value}</div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useApi(endpoints.dashboard, []);
  useRealtime(
    ["attendance.changed", "fees.changed", "students.changed", "teachers.changed"],
    () => refetch()
  );

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-700/40 via-accent-violet/25 to-accent-pink/25 p-6 md:p-8"
      >
        <Sparkles count={18} />
        <div className="relative z-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="chip mb-2">
              <SparklesIcon size={14} className="text-accent-gold" />
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              {greeting},{" "}
              <span className="glow-text">{user?.name?.split(" ")[0]}</span>.
            </h1>
            <p className="mt-1 text-white/70">
              Here's what's happening across your school today.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost">Generate report</button>
            <button className="btn-primary">
              Quick action <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </motion.div>

      {error && <ErrorState error={error} onRetry={refetch} />}

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            idx={0}
            icon={Users}
            label="Total students"
            value={data.stats.totalStudents.toLocaleString()}
            delta="+4.2%"
            tint="radial-gradient(circle, rgba(91,129,255,0.35), transparent 60%)"
          />
          <StatCard
            idx={1}
            icon={GraduationCap}
            label="Teachers"
            value={data.stats.totalTeachers}
            delta="+1.1%"
            tint="radial-gradient(circle, rgba(155,92,255,0.35), transparent 60%)"
          />
          <StatCard
            idx={2}
            icon={Wallet}
            label="Fee collected (₹)"
            value={`${(data.stats.feeCollected / 100000).toFixed(1)}L`}
            delta="+12.6%"
            tint="radial-gradient(circle, rgba(92,242,196,0.35), transparent 60%)"
          />
          <StatCard
            idx={3}
            icon={CalendarCheck}
            label="Attendance today"
            value={`${data.stats.attendanceToday}%`}
            delta="+0.8%"
            tint="radial-gradient(circle, rgba(255,94,196,0.35), transparent 60%)"
          />
        </div>
      ) : null}

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="card lg:col-span-2"
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="font-display text-lg font-semibold">
                Attendance trend
              </div>
              <div className="text-xs text-white/60">
                This week · school-wide
              </div>
            </div>
            <div className="chip">Live</div>
          </div>
          <div className="h-72">
            {loading || !data ? (
              <Skeleton className="h-full" />
            ) : (
              <ResponsiveContainer>
                <AreaChart data={data.attendanceTrend} margin={{ left: -20 }}>
                  <defs>
                    <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5b81ff" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#5b81ff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff5ec4" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#ff5ec4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.06)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    stroke="rgba(255,255,255,0.5)"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.5)"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0f1024",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      color: "white",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="present"
                    stroke="#86a8ff"
                    strokeWidth={2.5}
                    fill="url(#gP)"
                  />
                  <Area
                    type="monotone"
                    dataKey="absent"
                    stroke="#ff5ec4"
                    strokeWidth={2}
                    fill="url(#gA)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="card"
        >
          <div className="mb-3">
            <div className="font-display text-lg font-semibold">
              Fee collection mix
            </div>
            <div className="text-xs text-white/60">By category · YTD</div>
          </div>
          <div className="h-60">
            {loading || !data ? (
              <Skeleton className="h-full" />
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={data.feeBreakdown}
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.feeBreakdown.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#0f1024",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      color: "white",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {data && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              {data.feeBreakdown.map((e) => (
                <div key={e.name} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: e.color }}
                  />
                  <span className="text-white/70">{e.name}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Activity + Announcements */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="card lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="font-display text-lg font-semibold">
              Recent activity
            </div>
            <button className="text-xs text-white/60 hover:text-white">
              View all
            </button>
          </div>
          <ul className="space-y-3">
            {RECENT_ACTIVITY.map((a, i) => (
              <motion.li
                key={a.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3"
              >
                <div
                  className={`mt-0.5 h-2.5 w-2.5 rounded-full ${
                    a.type === "fee"
                      ? "bg-emerald-400"
                      : a.type === "attendance"
                      ? "bg-brand-400"
                      : a.type === "admission"
                      ? "bg-accent-pink"
                      : a.type === "exam"
                      ? "bg-accent-gold"
                      : "bg-accent-cyan"
                  } shadow-glow`}
                />
                <div className="flex-1">
                  <div className="text-sm">{a.text}</div>
                  <div className="text-[11px] uppercase tracking-wider text-white/45">
                    {a.time}
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="card"
        >
          <div className="mb-4 font-display text-lg font-semibold">
            Announcements
          </div>
          <div className="space-y-3">
            {(data?.announcements || []).map((a) => (
              <div
                key={a.id}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 transition-transform hover:-translate-y-1"
              >
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-brand-500/20 to-accent-pink/20 blur-2xl" />
                <span className="chip mb-2">{a.tag}</span>
                <div className="font-display font-semibold leading-snug">
                  {a.title}
                </div>
                <p className="mt-1 text-xs text-white/65">{a.body}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
