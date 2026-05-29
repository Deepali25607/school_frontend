import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Medal,
  Award,
  Star,
  Plus,
  Search,
  Filter,
  X,
  Crown,
  Calendar,
  Sparkles as SparklesIcon,
  Activity,
  Globe,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const POSITION_TONES = {
  "1st": "bg-gradient-to-br from-amber-400 to-amber-600 text-white",
  "2nd": "bg-gradient-to-br from-slate-300 to-slate-500 text-white",
  "3rd": "bg-gradient-to-br from-orange-400 to-orange-700 text-white",
  Finalist: "bg-gradient-to-br from-brand-500 to-accent-violet text-white",
  Participation: "bg-white/10 text-white/65",
};

const POSITION_ICONS = {
  "1st": Crown,
  "2nd": Medal,
  "3rd": Medal,
  Finalist: Star,
  Participation: Award,
};

const LEVEL_TONES = {
  School: "bg-white/5 text-white/65 ring-white/15",
  "Inter-school": "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  District: "bg-accent-violet/15 text-purple-200 ring-accent-violet/30",
  State: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  National: "bg-accent-pink/15 text-pink-200 ring-accent-pink/30",
  International: "bg-gradient-to-r from-amber-500/20 to-accent-pink/20 text-amber-200 ring-amber-400/30",
};

const CATEGORY_TONES = {
  Sports: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Academic: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  Arts: "bg-accent-pink/15 text-pink-200 ring-accent-pink/30",
  Cultural: "bg-accent-violet/15 text-purple-200 ring-accent-violet/30",
  Leadership: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  "Community Service": "bg-cyan-500/15 text-cyan-300 ring-cyan-400/30",
  Olympiad: "bg-accent-gold/20 text-amber-200 ring-accent-gold/30",
  Debate: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

export default function Achievements() {
  const { user } = useAuth();
  const canCreate = ["admin", "principal", "teacher"].includes(user?.role);

  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState("all");
  const [position, setPosition] = useState("all");
  const [sinceDays, setSinceDays] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const { data, loading, error, refetch } = useApi(
    () =>
      endpoints.achievements({
        q: debounced,
        category,
        level,
        position,
        sinceDays: sinceDays || undefined,
      }),
    [debounced, category, level, position, sinceDays]
  );

  useRealtime("achievements.changed", () => refetch());

  const items = data?.items || [];
  const summary = data?.summary;
  const top = data?.topStudents || [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Recognition"
        title="Sports & Achievements"
        subtitle={
          data
            ? `${summary?.total || 0} achievements logged · ${summary?.thisYear || 0} this year`
            : "Loading…"
        }
      />

      {error && <ErrorState error={error} onRetry={refetch} />}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile icon={Trophy} label="Total wins" value={loading ? "—" : summary?.total} tint="from-accent-gold/30" />
        <button type="button" onClick={() => setPosition(position === "1st" ? "all" : "1st")} className={`block w-full rounded-2xl text-left transition-all ${position === "1st" ? "ring-1 ring-brand-400/50" : ""}`}>
          <StatTile icon={Crown} label="Gold (1st)" value={loading ? "—" : summary?.gold} tint="from-amber-500/30" accent="text-amber-300" />
        </button>
        <button type="button" onClick={() => setLevel(level === "National" ? "all" : "National")} className={`block w-full rounded-2xl text-left transition-all ${level === "National" ? "ring-1 ring-brand-400/50" : ""}`}>
          <StatTile icon={Globe} label="National+" value={loading ? "—" : summary?.national} tint="from-accent-pink/30" accent="text-pink-300" pulse={summary?.national > 0} />
        </button>
        <button type="button" onClick={() => setSinceDays(sinceDays === "365" ? "" : "365")} className={`block w-full rounded-2xl text-left transition-all ${sinceDays === "365" ? "ring-1 ring-brand-400/50" : ""}`}>
          <StatTile icon={Calendar} label="This year" value={loading ? "—" : summary?.thisYear} tint="from-brand-500/30" />
        </button>
      </div>

      {/* Podium — top 3 students by points */}
      {top.length > 0 && !loading && (
        <div className="card relative overflow-hidden">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-amber-500/20 to-accent-pink/20 blur-3xl" />
          <div className="relative">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="font-display text-lg font-semibold">Top achievers</div>
                <div className="text-xs text-white/55">By total points across all events</div>
              </div>
              <SparklesIcon size={16} className="text-accent-gold" />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {top.slice(0, 3).map((s, i) => (
                <PodiumCard key={s.studentId} entry={s} place={i + 1} />
              ))}
            </div>
            {top.length > 3 && (
              <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-5">
                {top.slice(3, 8).map((s, i) => (
                  <Link
                    key={s.studentId}
                    to={`/app/students/${s.studentId}`}
                    className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] p-2 transition-colors hover:border-white/15 hover:bg-white/[0.06]"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-accent-violet text-[10px] font-bold">
                      {s.studentAvatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium">{s.studentName}</div>
                      <div className="text-[10px] text-white/45">
                        #{i + 4} · {s.points}pt
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={14} className="text-white/55" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search event, student, category…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-white/55" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">Any category</option>
            {(data?.categories || []).map((c) => <option key={c}>{c}</option>)}
          </select>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">Any level</option>
            {(data?.levels || []).map((l) => <option key={l}>{l}</option>)}
          </select>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">Any position</option>
            {(data?.positions || []).map((p) => <option key={p}>{p}</option>)}
          </select>
          <select
            value={sinceDays}
            onChange={(e) => setSinceDays(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="">All time</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">This year</option>
          </select>
          {canCreate && (
            <button onClick={() => setCreating(true)} className="btn-primary px-3 py-2 text-sm">
              <Plus size={14} /> Log achievement
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center text-white/55">
          <SparklesIcon className="mx-auto mb-2 text-accent-gold" size={20} />
          No achievements match — be the first to log one.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {items.map((a, i) => (
            <AchievementCard key={a.id} a={a} idx={i} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {creating && (
          <NewAchievementModal
            categories={data?.categories || []}
            levels={data?.levels || []}
            positions={data?.positions || []}
            levelPoints={data?.levelPoints || {}}
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

function StatTile({ icon: Icon, label, value, tint, pulse, accent }) {
  return (
    <div className="card relative overflow-hidden">
      <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${tint} to-transparent blur-2xl ${pulse ? "animate-pulse" : ""}`} />
      <div className="relative flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-white/55">{label}</div>
          <div className={`stat-num glow-text ${accent || ""}`}>{value}</div>
        </div>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function PodiumCard({ entry, place }) {
  const PlaceIcon = place === 1 ? Crown : Medal;
  const order = place === 1 ? "md:order-2" : place === 2 ? "md:order-1" : "md:order-3";
  const height = place === 1 ? "md:h-[140px]" : place === 2 ? "md:h-[120px]" : "md:h-[100px]";
  const gradient =
    place === 1
      ? "from-amber-400/30 to-amber-600/20 ring-amber-400/30"
      : place === 2
      ? "from-slate-300/30 to-slate-500/20 ring-slate-400/30"
      : "from-orange-400/30 to-orange-600/20 ring-orange-400/30";
  return (
    <Link
      to={`/app/students/${entry.studentId}`}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 ring-1 transition-all hover:scale-[1.02] ${gradient} ${order} ${height}`}
    >
      <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-bold backdrop-blur">
        <PlaceIcon size={10} /> #{place}
      </div>
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-violet font-display text-base font-bold text-white shadow-glow">
          {entry.studentAvatar}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-base font-semibold">
            {entry.studentName}
          </div>
          <div className="text-[11px] text-white/65">
            Grade {entry.studentGrade}-{entry.studentSection} · {entry.studentHouse}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="text-[9px] uppercase tracking-wider text-white/55">Points</div>
          <div className="font-display text-2xl font-bold">{entry.points}</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] uppercase tracking-wider text-white/55">Wins</div>
          <div className="font-display text-base font-bold">
            {entry.count}
            {entry.gold > 0 && (
              <span className="ml-1 text-xs text-amber-300">· {entry.gold}🥇</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function AchievementCard({ a, idx }) {
  const PositionIcon = POSITION_ICONS[a.position] || Award;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx, 12) * 0.03 }}
      whileHover={{ y: -2 }}
      className="card group relative overflow-hidden"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-accent-gold/15 to-accent-pink/10 blur-2xl" />
      <div className="relative">
        <div className="flex items-start gap-3">
          <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl shadow-glow ${POSITION_TONES[a.position]}`}>
            <PositionIcon size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ${CATEGORY_TONES[a.category] || "bg-white/5 text-white/65 ring-white/10"}`}>
                {a.category}
              </span>
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ${LEVEL_TONES[a.level]}`}>
                {a.level}
              </span>
              {a.certificate && (
                <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300 ring-1 ring-emerald-400/30">
                  Certificate
                </span>
              )}
            </div>
            <div className="mt-1.5 font-display text-sm font-semibold leading-snug">
              {a.title}
            </div>
            <div className="mt-1 truncate text-[11px] text-white/55">
              {a.position} · {a.event}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-wider text-white/55">Points</div>
            <div className="font-display text-lg font-bold text-accent-gold">{a.points}</div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-xs">
          <Link
            to={`/app/students/${a.studentId}`}
            className="flex min-w-0 items-center gap-2 hover:text-brand-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-accent-violet text-[10px] font-bold text-white">
              {a.studentAvatar}
            </div>
            <div className="min-w-0">
              <div className="truncate font-medium text-white/85">{a.studentName}</div>
              <div className="text-[10px] text-white/45">
                {a.studentId} · Grade {a.studentGrade}-{a.studentSection}
              </div>
            </div>
          </Link>
          <div className="text-right text-[10px] text-white/45">
            <div>{a.date}</div>
            <div className="truncate max-w-[120px]">by {a.awardedBy}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function NewAchievementModal({ categories, levels, positions, levelPoints, onClose, onCreated }) {
  const [form, setForm] = useState({
    studentId: "",
    title: "",
    category: categories[0] || "Sports",
    level: "School",
    position: "1st",
    event: "",
    awardedBy: "Principal's Office",
    date: new Date().toISOString().slice(0, 10),
    certificate: true,
  });
  const [studentQuery, setStudentQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [studentLoading, setStudentLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

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
  const selected = selectedStudent;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.studentId) {
      setErr("Pick a student first");
      return;
    }
    if (!form.title.trim()) {
      setErr("Title is required");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await endpoints.achievementAdd({
        ...form,
        event: form.event || form.title,
      });
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
        <div className="mb-1 text-xs uppercase tracking-[0.2em] text-white/55">
          New achievement
        </div>
        <div className="font-display text-xl font-bold">Log a recognition</div>

        <div className="mt-5 space-y-3">
          <Field label="Student">
            <div className="relative">
              <input
                value={selected ? `${selected.name} · ${selected.id}` : studentQuery}
                onChange={(e) => {
                  setStudentQuery(e.target.value);
                  if (form.studentId) {
                    set("studentId", "");
                    setSelectedStudent(null);
                  }
                }}
                placeholder="Type name or ID…"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
              />
              {!form.studentId && studentQuery && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-[#0c0c22] shadow-glow">
                  {studentLoading && (
                    <div className="px-3 py-2 text-xs text-white/55">Searching…</div>
                  )}
                  {!studentLoading && students.length === 0 && (
                    <div className="px-3 py-2 text-xs text-white/45">No matches</div>
                  )}
                  {students.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => {
                        set("studentId", s.id);
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

          <Field label="Title">
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Inter-school Football Cup"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
              >
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Position">
              <select
                value={form.position}
                onChange={(e) => set("position", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
              >
                {positions.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Level">
              <select
                value={form.level}
                onChange={(e) => set("level", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
              >
                {levels.map((l) => (
                  <option key={l} value={l}>
                    {l} · {levelPoints[l] || "?"}pt
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
              />
            </Field>
          </div>

          <Field label="Awarded by">
            <input
              value={form.awardedBy}
              onChange={(e) => set("awardedBy", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
            />
          </Field>

          <label className="flex items-center gap-2 text-xs text-white/65">
            <input
              type="checkbox"
              checked={form.certificate}
              onChange={(e) => set("certificate", e.target.checked)}
              className="rounded border-white/20 bg-white/10"
            />
            Certificate / medal issued
          </label>
        </div>

        {err && (
          <div className="mt-3 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
            {err}
          </div>
        )}

        <button disabled={busy} className="btn-primary mt-5 w-full">
          {busy ? "Logging…" : "Log achievement"}
        </button>
      </motion.form>
    </motion.div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">
        {label}
      </div>
      {children}
    </label>
  );
}
