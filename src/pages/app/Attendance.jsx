import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  Clock,
  Plane,
  Save,
  CheckCircle2,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const STATUS = [
  { key: "Present", icon: Check, color: "bg-emerald-500/20 text-emerald-300 ring-emerald-400/40" },
  { key: "Absent", icon: X, color: "bg-rose-500/20 text-rose-300 ring-rose-400/40" },
  { key: "Late", icon: Clock, color: "bg-amber-500/20 text-amber-300 ring-amber-400/40" },
  { key: "Leave", icon: Plane, color: "bg-brand-500/20 text-brand-300 ring-brand-400/40" },
];

export default function Attendance() {
  const { data, loading, error, refetch } = useApi(
    endpoints.attendanceToday,
    []
  );
  const [rows, setRows] = useState([]);
  const [grade, setGrade] = useState("all");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    if (data?.items) setRows(data.items);
  }, [data]);

  const filtered = useMemo(
    () => rows.filter((r) => grade === "all" || String(r.grade) === grade),
    [rows, grade]
  );

  const summary = STATUS.map((s) => ({
    ...s,
    count: filtered.filter((r) => r.status === s.key).length,
  }));

  const setStatus = (id, status) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const entries = Object.fromEntries(rows.map((r) => [r.id, r.status]));
      await endpoints.saveAttendance(data.date, entries);
      setSavedAt(new Date());
      setTimeout(() => setSavedAt(null), 2400);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Today"
        title="Attendance"
        subtitle={new Date().toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      />

      {error && <ErrorState error={error} onRetry={refetch} />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {summary.map((s, i) => (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card flex items-center justify-between"
          >
            <div>
              <div className="text-xs uppercase tracking-wider text-white/60">
                {s.key}
              </div>
              <div className="stat-num">{loading ? "—" : s.count}</div>
            </div>
            <div
              className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${s.color}`}
            >
              <s.icon size={18} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
        >
          <option value="all">All grades</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
            <option key={g} value={g}>
              Grade {g}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {savedAt && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-300 ring-1 ring-emerald-400/30"
              >
                <CheckCircle2 size={14} /> Saved at{" "}
                {savedAt.toLocaleTimeString()}
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={onSave}
            disabled={saving || loading}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-60"
          >
            <Save size={14} /> {saving ? "Saving…" : "Save attendance"}
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
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Grade</th>
                  <th className="px-5 py-3">Section</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.015 }}
                    className="border-t border-white/5 hover:bg-white/[0.025]"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-pink font-display text-[11px] font-bold">
                          {r.avatar}
                        </div>
                        <div>
                          <div className="font-medium">{r.name}</div>
                          <div className="text-[11px] text-white/50">
                            {r.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">{r.grade}</td>
                    <td className="px-5 py-3">{r.section}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {STATUS.map((s) => {
                          const active = r.status === s.key;
                          return (
                            <button
                              key={s.key}
                              onClick={() => setStatus(r.id, s.key)}
                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium ring-1 transition-all ${
                                active
                                  ? s.color
                                  : "bg-white/5 text-white/55 ring-white/10 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              <s.icon size={11} />
                              {s.key}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
