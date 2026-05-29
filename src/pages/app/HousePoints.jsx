import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Flame,
  Waves,
  Leaf,
  Flag,
  Swords,
  MinusCircle,
  PlusCircle,
  Gem,
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Medal,
  Plus,
  Search,
  Filter,
  X,
  Trash2,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const HOUSE_PALETTES = {
  Crimson: {
    text: "text-pink-300",
    bg: "from-accent-pink/30 to-rose-500/10",
    ring: "ring-accent-pink/40",
    fill: "from-accent-pink to-rose-500",
    icon: Flame,
  },
  Azure: {
    text: "text-brand-300",
    bg: "from-brand-500/30 to-cyan-500/10",
    ring: "ring-brand-400/40",
    fill: "from-brand-500 to-cyan-500",
    icon: Waves,
  },
  Emerald: {
    text: "text-emerald-300",
    bg: "from-emerald-500/30 to-teal-500/10",
    ring: "ring-emerald-400/40",
    fill: "from-emerald-500 to-teal-500",
    icon: Leaf,
  },
  Amber: {
    text: "text-amber-300",
    bg: "from-amber-400/30 to-orange-500/10",
    ring: "ring-amber-400/40",
    fill: "from-amber-400 to-orange-500",
    icon: Crown,
  },
};

const CATEGORY_TONES = {
  Academic: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  Sports: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Cultural: "bg-accent-pink/15 text-pink-200 ring-accent-pink/30",
  "Community Service": "bg-cyan-500/15 text-cyan-300 ring-cyan-400/30",
  Attendance: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
  Leadership: "bg-accent-violet/15 text-purple-200 ring-accent-violet/30",
  Discipline: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  Bonus: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
  Other: "bg-white/5 text-white/65 ring-white/15",
};

export default function HousePoints() {
  const { user } = useAuth();
  const canAward = ["admin", "principal", "teacher", "hr"].includes(user?.role);
  const canDelete = ["admin", "principal"].includes(user?.role);

  const [term, setTerm] = useState("all");
  const [house, setHouse] = useState("all");
  const [category, setCategory] = useState("all");
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const params = useMemo(
    () => ({ term, house, category, q: debounced, limit: 80 }),
    [term, house, category, debounced]
  );

  const { data, loading, error, refetch } = useApi(
    () => endpoints.housePoints(params),
    [params]
  );

  useRealtime("housepoints.changed", () => refetch());

  const summary = data?.summary;
  const leaderboard = summary?.leaderboard || [];
  const items = data?.items || [];
  const categoryBreakdown = data?.categoryBreakdown || {};
  const topContributors = data?.topContributors || [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Spirit"
        title="House Points"
        subtitle={
          summary?.leader
            ? `${summary.leader.house} leads with ${summary.leader.points} pts · ${summary.totalAwards} awards logged · ${summary.deductionsCount} deductions`
            : "Loading…"
        }
      />

      {error && <ErrorState error={error} onRetry={refetch} />}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <button
          type="button"
          onClick={() => summary?.leader && setHouse(house === summary.leader.house ? "all" : summary.leader.house)}
          className={`block w-full rounded-2xl text-left transition-all ${house !== "all" && house === summary?.leader?.house ? "ring-1 ring-brand-400/50" : ""}`}
        >
          <StatTile
            icon={Crown}
            label="Leading house"
            value={summary?.leader?.house || "—"}
            subValue={
              summary?.leader
                ? `${summary.leader.points} pts · +${summary.leader.leadOver} over #2`
                : null
            }
            tint="from-amber-500/30"
            accent={HOUSE_PALETTES[summary?.leader?.house]?.text || "text-amber-300"}
            pulse
          />
        </button>
        <StatTile
          icon={PlusCircle}
          label="Awards logged"
          value={summary ? summary.awardsCount : "—"}
          tint="from-emerald-500/30"
          accent="text-emerald-300"
        />
        <StatTile
          icon={MinusCircle}
          label="Deductions"
          value={summary ? summary.deductionsCount : "—"}
          tint="from-rose-500/30"
          accent="text-rose-300"
        />
        <StatTile
          icon={Activity}
          label="Last 24h delta"
          value={
            summary?.recent24h
              ? Object.values(summary.recent24h).reduce((a, b) => a + b, 0)
              : 0
          }
          tint="from-brand-500/30"
        />
      </div>

      {/* Leaderboard */}
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="font-display text-lg font-semibold">
              House cup leaderboard
            </div>
            <div className="text-xs text-white/55">
              Live standings · animated bars
            </div>
          </div>
          <select
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs outline-none"
          >
            <option value="all">All time</option>
            <option value="Term 1">Term 1</option>
            <option value="Term 2">Term 2</option>
            <option value="Term 3">Term 3</option>
          </select>
        </div>
        {loading || !summary ? (
          <Skeleton className="h-72" />
        ) : (
          <Leaderboard
            leaderboard={leaderboard}
            meta={summary.meta}
            recent24h={summary.recent24h}
          />
        )}
      </div>

      {/* Award form trigger */}
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={14} className="text-white/55" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reason, student, awarder…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-white/55" />
          <select
            value={house}
            onChange={(e) => setHouse(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">All houses</option>
            {(summary?.houses || []).map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">All categories</option>
            {(summary?.categories || []).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          {canAward && (
            <button
              onClick={() => setCreating(true)}
              className="btn-primary px-3 py-2 text-sm"
            >
              <Plus size={14} /> Award points
            </button>
          )}
        </div>
      </div>

      {/* Category breakdown + Top contributors */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {summary && (
          <CategoryBreakdown
            houses={summary.houses}
            categories={summary.categories}
            breakdown={categoryBreakdown}
            meta={summary.meta}
          />
        )}
        {topContributors.length > 0 && (
          <div className="card">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="font-display text-base font-semibold">
                  Top contributors
                </div>
                <div className="text-xs text-white/55">
                  Students with most points this term
                </div>
              </div>
              <Medal size={14} className="text-amber-300" />
            </div>
            <div className="space-y-2">
              {topContributors.map((c, i) => {
                const pal = HOUSE_PALETTES[c.house];
                return (
                  <Link
                    key={c.studentId}
                    to={`/app/students/${c.studentId}`}
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-2 transition-colors hover:border-white/15 hover:bg-white/[0.06]"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-violet text-xs font-bold">
                      {c.studentAvatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium">
                          {c.studentName}
                        </span>
                        <span
                          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] ring-1 ${pal?.ring} ${pal?.text}`}
                        >
                          {c.house}
                        </span>
                      </div>
                      <div className="text-[10px] text-white/55">
                        G{c.studentGrade}-{c.studentSection} · {c.count}{" "}
                        award{c.count === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-display text-base font-bold ${pal?.text}`}>
                        +{c.points}
                      </div>
                      <div className="text-[9px] text-white/45">#{i + 1}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Activity log */}
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="font-display text-base font-semibold">
              Recent activity
            </div>
            <div className="text-xs text-white/55">
              {items.length} award{items.length === 1 ? "" : "s"}{" "}
              {q ? "matching the filter" : "logged"}
            </div>
          </div>
          <Zap size={14} className="text-amber-300" />
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-white/55">
            <Swords className="mx-auto mb-2 text-white/30" size={20} />
            No awards match the current filters.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((a, i) => (
              <AwardRow
                key={a.id}
                award={a}
                canDelete={canDelete}
                idx={i}
                onDelete={async () => {
                  if (!confirm("Remove this award?")) return;
                  await endpoints.housePointDelete(a.id);
                  refetch();
                }}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {creating && (
          <AwardModal
            houses={summary?.houses || []}
            categories={summary?.categories || []}
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

function Leaderboard({ leaderboard, meta, recent24h }) {
  const max = Math.max(...leaderboard.map((l) => Math.abs(l.points)), 100);
  return (
    <div className="space-y-3">
      {leaderboard.map((row, i) => {
        const pal = HOUSE_PALETTES[row.house];
        const Icon = pal?.icon || Flag;
        const m = meta[row.house];
        const recent = recent24h?.[row.house] || 0;
        const pct = (Math.abs(row.points) / max) * 100;
        return (
          <motion.div
            key={row.house}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${pal?.bg} p-4 ring-1 ${pal?.ring}`}
          >
            <div className="absolute -right-10 -top-10 h-32 w-32 opacity-20">
              <Icon size={120} className={pal?.text} />
            </div>
            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${pal?.fill} text-white shadow-glow`}
                  >
                    {i === 0 ? (
                      <Crown size={22} fill="currentColor" />
                    ) : (
                      <Icon size={22} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-xl font-bold">
                        {row.house}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-white/55">
                        #{row.rank}
                      </span>
                      {i === 0 && (
                        <span className="rounded-full bg-amber-500/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-100 ring-1 ring-amber-400/30">
                          Cup leader
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-white/55">
                      {m?.motto} · {m?.emblem}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-display text-3xl font-bold ${pal?.text}`}>
                    {row.points}
                  </div>
                  <div className="flex items-center justify-end gap-1 text-[10px]">
                    {recent !== 0 && (
                      <span
                        className={`inline-flex items-center gap-0.5 ${
                          recent > 0 ? "text-emerald-300" : "text-rose-300"
                        }`}
                      >
                        {recent > 0 ? (
                          <TrendingUp size={9} />
                        ) : (
                          <TrendingDown size={9} />
                        )}
                        {recent > 0 ? "+" : ""}
                        {recent} · 24h
                      </span>
                    )}
                    {row.leadOver > 0 && (
                      <span className="text-white/55">
                        +{row.leadOver} ahead
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/30">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={`h-full bg-gradient-to-r ${pal?.fill}`}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function CategoryBreakdown({ houses, categories, breakdown, meta }) {
  // Skip categories where every house is 0
  const visibleCats = categories.filter((c) =>
    houses.some((h) => breakdown[h]?.[c])
  );
  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="font-display text-base font-semibold">
            Points by category
          </div>
          <div className="text-xs text-white/55">
            Where each house has earned (or lost) its points
          </div>
        </div>
        <Gem size={14} className="text-accent-pink" />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="text-white/55">
            <tr>
              <th className="px-2 py-1 text-left font-medium">Category</th>
              {houses.map((h) => {
                const pal = HOUSE_PALETTES[h];
                return (
                  <th
                    key={h}
                    className={`px-2 py-1 text-right font-medium ${pal?.text}`}
                  >
                    {h}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleCats.map((c) => {
              const max = Math.max(
                ...houses.map((h) => Math.abs(breakdown[h]?.[c] || 0)),
                1
              );
              return (
                <tr key={c} className="border-t border-white/5">
                  <td className="px-2 py-1.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] ring-1 ${
                        CATEGORY_TONES[c] ||
                        "bg-white/5 text-white/65 ring-white/15"
                      }`}
                    >
                      {c}
                    </span>
                  </td>
                  {houses.map((h) => {
                    const v = breakdown[h]?.[c] || 0;
                    const pal = HOUSE_PALETTES[h];
                    const pct = (Math.abs(v) / max) * 100;
                    return (
                      <td key={h} className="px-2 py-1.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {v !== 0 && (
                            <div className="h-1 w-14 overflow-hidden rounded-full bg-white/5">
                              <div
                                className={`h-full bg-gradient-to-r ${pal?.fill}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )}
                          <span
                            className={`min-w-[28px] font-mono ${
                              v < 0
                                ? "text-rose-300"
                                : v > 0
                                ? pal?.text
                                : "text-white/30"
                            }`}
                          >
                            {v === 0 ? "—" : v > 0 ? "+" + v : v}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AwardRow({ award, canDelete, idx, onDelete }) {
  const a = award;
  const pal = HOUSE_PALETTES[a.house];
  const Icon = pal?.icon || Flag;
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(idx * 0.01, 0.15) }}
      className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-2.5"
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${pal?.fill} text-white shadow-glow`}
      >
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`text-sm font-semibold ${pal?.text}`}>{a.house}</span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ring-1 ${
              CATEGORY_TONES[a.category] ||
              "bg-white/5 text-white/65 ring-white/15"
            }`}
          >
            {a.category}
          </span>
          {a.studentName && (
            <Link
              to={`/app/students/${a.studentId}`}
              className="text-[11px] text-brand-300 hover:underline"
            >
              {a.studentName}
            </Link>
          )}
        </div>
        <div className="mt-0.5 truncate text-xs text-white/75">{a.reason}</div>
        <div className="mt-0.5 text-[10px] text-white/45">
          by {a.awardedBy} · {formatRelative(a.awardedAt)} · {a.term}
        </div>
      </div>
      <div className="text-right">
        <div
          className={`font-display text-base font-bold ${
            a.points < 0 ? "text-rose-300" : pal?.text
          }`}
        >
          {a.points > 0 ? "+" : ""}
          {a.points}
        </div>
        {canDelete && (
          <button
            onClick={onDelete}
            className="mt-1 rounded p-1 text-white/40 hover:bg-rose-500/15 hover:text-rose-200"
            title="Remove award"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ---------- Award modal ----------

function AwardModal({ houses, categories, onClose, onCreated }) {
  const [form, setForm] = useState({
    house: houses[0] || "Crimson",
    category: "Academic",
    points: 10,
    reason: "",
    studentId: "",
    term: "Term 3",
    deduction: false,
  });
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

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
        const list = (r.items || r || []).filter(
          (s) => s.house === form.house
        );
        setStudents(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [debounced, form.house]);

  // If house changes, drop the selected student (must belong to the new house)
  useEffect(() => {
    if (selectedStudent && selectedStudent.house !== form.house) {
      setSelectedStudent(null);
      setForm((f) => ({ ...f, studentId: "" }));
      setStudents([]);
    }
  }, [form.house]);

  async function submit(e) {
    e.preventDefault();
    if (!form.reason.trim()) {
      setErr("Reason required");
      return;
    }
    const pts = Math.abs(Number(form.points));
    if (!(pts > 0)) {
      setErr("Points must be positive");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      await endpoints.housePointAdd({
        house: form.house,
        category: form.deduction ? "Discipline" : form.category,
        points: form.deduction ? -pts : pts,
        reason: form.reason,
        studentId: selectedStudent?.id || undefined,
        term: form.term,
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
            {form.deduction ? "Deduct house points" : "Award house points"}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/55 hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        {/* House picker — 4 big buttons */}
        <div className="mb-3">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
            House
          </div>
          <div className="grid grid-cols-4 gap-2">
            {houses.map((h) => {
              const pal = HOUSE_PALETTES[h];
              const Icon = pal?.icon || Flag;
              const on = form.house === h;
              return (
                <button
                  type="button"
                  key={h}
                  onClick={() => set("house", h)}
                  className={`relative overflow-hidden rounded-xl p-3 ring-1 transition-all ${
                    on
                      ? `bg-gradient-to-br ${pal?.bg} ${pal?.ring} scale-105`
                      : "bg-white/5 ring-white/10 hover:bg-white/10"
                  }`}
                >
                  <Icon
                    size={20}
                    className={`mx-auto ${on ? pal?.text : "text-white/55"}`}
                  />
                  <div
                    className={`mt-1 text-xs font-semibold ${
                      on ? pal?.text : "text-white/65"
                    }`}
                  >
                    {h}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Category
            </div>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              disabled={form.deduction}
              className={`${input} disabled:opacity-50`}
            >
              {categories
                .filter((c) => c !== "Discipline")
                .map((c) => (
                  <option key={c}>{c}</option>
                ))}
            </select>
          </label>
          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Term
            </div>
            <select
              value={form.term}
              onChange={(e) => set("term", e.target.value)}
              className={input}
            >
              <option>Term 1</option>
              <option>Term 2</option>
              <option>Term 3</option>
            </select>
          </label>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Points
            </div>
            <input
              type="number"
              min="1"
              required
              value={form.points}
              onChange={(e) => set("points", e.target.value)}
              className={input}
            />
          </label>
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Mode
            </div>
            <button
              type="button"
              onClick={() => set("deduction", !form.deduction)}
              className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs ring-1 ${
                form.deduction
                  ? "bg-rose-500/20 text-rose-200 ring-rose-400/30"
                  : "bg-emerald-500/20 text-emerald-200 ring-emerald-400/30"
              }`}
            >
              {form.deduction ? (
                <MinusCircle size={12} />
              ) : (
                <PlusCircle size={12} />
              )}
              {form.deduction ? "Deduction" : "Award"}
            </button>
          </div>
        </div>

        <label className="mt-3 block">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
            Reason
          </div>
          <input
            value={form.reason}
            onChange={(e) => set("reason", e.target.value)}
            placeholder="e.g. Inter-house football final win"
            className={input}
            required
          />
        </label>

        <label className="mt-3 block">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
            Attribute to student (optional)
          </div>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (selectedStudent) {
                setSelectedStudent(null);
                set("studentId", "");
              }
            }}
            placeholder={`Type a ${form.house} house student name…`}
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
                  {selectedStudent.section}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedStudent(null);
                  setQuery("");
                  set("studentId", "");
                }}
                className="rounded p-1 text-white/55 hover:bg-white/10"
              >
                <X size={12} />
              </button>
            </div>
          ) : students.length > 0 ? (
            <div className="mt-2 max-h-36 overflow-y-auto rounded-lg border border-white/10 bg-black/30">
              {students.slice(0, 10).map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => {
                    setSelectedStudent(s);
                    set("studentId", s.id);
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
            {submitting ? "Saving…" : form.deduction ? "Deduct" : "Award"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function formatRelative(iso) {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}
