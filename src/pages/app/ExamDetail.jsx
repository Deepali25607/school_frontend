import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Clock,
  MapPin,
  ChevronLeft,
  Ticket,
  Save,
  Trophy,
  CheckCircle2,
  Sparkles as SparklesIcon,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";

const STATUS_TONES = {
  Completed: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Ongoing: "bg-accent-pink/15 text-pink-200 ring-accent-pink/30",
  Scheduled: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
};

const TABS = [
  { k: "schedule", label: "Schedule" },
  { k: "hall-ticket", label: "Hall ticket" },
  { k: "marks", label: "Marks entry" },
  { k: "results", label: "Results & ranks" },
];

export default function ExamDetail() {
  const { id } = useParams();
  const exam = useApi(() => endpoints.examMarks(id), [id]);
  const [tab, setTab] = useState("schedule");

  const data = exam.data;

  return (
    <div className="space-y-5">
      <div>
        <Link
          to="/app/exams"
          className="mb-3 inline-flex items-center gap-1 text-xs text-white/55 hover:text-white"
        >
          <ChevronLeft size={14} /> All exams
        </Link>
        {exam.loading ? (
          <Skeleton className="h-20" />
        ) : exam.error ? (
          <ErrorState error={exam.error} onRetry={exam.refetch} />
        ) : (
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-700/30 via-accent-violet/20 to-accent-pink/20 p-6">
            <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
              <div>
                <div className="chip mb-2">
                  <SparklesIcon size={14} className="text-accent-gold" />
                  {data.exam.type}
                </div>
                <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
                  {data.exam.name}
                </h1>
                <div className="mt-1 text-sm text-white/65">
                  {data.exam.startDate} → {data.exam.endDate} · {data.exam.papers.length} papers
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${
                  STATUS_TONES[data.exam.status]
                }`}
              >
                {data.exam.status}
              </span>
            </div>
          </div>
        )}
      </div>

      {data && (
        <>
          <div className="card flex flex-wrap items-center gap-2">
            {TABS.map((t) => (
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

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {tab === "schedule" && <Schedule exam={data.exam} />}
              {tab === "hall-ticket" && (
                <HallTicket exam={data.exam} student={data.rows[0]} />
              )}
              {tab === "marks" && (
                <MarksEntry
                  exam={data.exam}
                  rows={data.rows}
                  onSaved={() => exam.refetch()}
                />
              )}
              {tab === "results" && <Results exam={data.exam} rows={data.rows} />}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

function Schedule({ exam }) {
  return (
    <div className="card">
      <div className="mb-4 font-display text-lg font-semibold">
        Paper schedule
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-left text-[11px] uppercase tracking-wider text-white/55">
            <tr>
              <th className="px-5 py-3">Subject</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Time</th>
              <th className="px-5 py-3">Room</th>
              <th className="px-5 py-3">Max marks</th>
            </tr>
          </thead>
          <tbody>
            {exam.papers.map((p, i) => (
              <motion.tr
                key={p.subject}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="border-t border-white/5"
              >
                <td className="px-5 py-3 font-medium">{p.subject}</td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays size={12} className="text-white/55" />
                    {p.date}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-2">
                    <Clock size={12} className="text-white/55" />
                    {p.startTime} – {p.endTime}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-2">
                    <MapPin size={12} className="text-white/55" />
                    {p.room}
                  </span>
                </td>
                <td className="px-5 py-3 font-display">{p.maxMarks}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HallTicket({ exam, student }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
      <div className="card">
        <div className="mb-3 font-display text-lg font-semibold">
          Hall ticket preview
        </div>
        <p className="text-sm text-white/65">
          Hall tickets are generated per-student. A QR code links to the
          student's profile and attendance record. Below is a live preview for{" "}
          <span className="font-semibold text-white">{student?.name}</span>.
          Bulk-print from the action button on the right.
        </p>
        <div className="mt-5">
          <TicketCard exam={exam} student={student} />
        </div>
      </div>

      <div className="card">
        <div className="mb-2 font-display text-lg font-semibold">
          Bulk actions
        </div>
        <p className="text-sm text-white/65">
          Generate hall tickets for the entire grade in one go.
        </p>
        <div className="mt-4 space-y-2">
          <button className="btn-primary w-full">
            <Ticket size={14} /> Generate all hall tickets
          </button>
          <button className="btn-ghost w-full">Email to parents</button>
          <button className="btn-ghost w-full">Download PDF (zip)</button>
        </div>
      </div>
    </div>
  );
}

function TicketCard({ exam, student }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a0a1e] via-[#0d0d2a] to-[#101044] p-6 shadow-glow">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-brand-500/40 to-accent-pink/40 blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/55">
            Lumina · Hall Ticket
          </div>
          <div className="font-display text-sm text-accent-gold">
            #{exam.id}
          </div>
        </div>
        <div className="mt-4 flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-accent-violet to-accent-pink font-display text-xl font-bold">
            {student?.avatar || "—"}
          </div>
          <div className="flex-1">
            <div className="font-display text-xl font-bold">{student?.name}</div>
            <div className="text-xs text-white/60">
              {student?.studentId} · Grade {exam.grade}-{student?.section}
            </div>
          </div>
          <QRish />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
          <Field label="Exam" value={exam.name} />
          <Field label="Type" value={exam.type} />
          <Field label="From" value={exam.startDate} />
          <Field label="To" value={exam.endDate} />
        </div>
        <div className="mt-5 border-t border-white/10 pt-4 text-[10px] uppercase tracking-wider text-white/45">
          Carry this card on all exam days · No phones · No malpractice
        </div>
      </div>
    </div>
  );
}

function QRish() {
  // Decorative QR-like grid (no external dep)
  return (
    <div className="grid h-16 w-16 grid-cols-7 gap-[2px] rounded-md bg-white p-1.5">
      {Array.from({ length: 49 }).map((_, i) => (
        <div
          key={i}
          className={i % 3 === 0 || i % 5 === 0 ? "bg-black" : "bg-white"}
        />
      ))}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2">
      <div className="text-[9px] uppercase tracking-wider text-white/45">
        {label}
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function MarksEntry({ exam, rows, onSaved }) {
  const [draft, setDraft] = useState(() => deepClone(rows));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => setDraft(deepClone(rows)), [rows]);

  const setMark = (studentId, subject, value) => {
    setDraft((prev) =>
      prev.map((r) =>
        r.studentId === studentId
          ? { ...r, subjects: { ...r.subjects, [subject]: value } }
          : r
      )
    );
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const payload = draft.map((r) => ({
        studentId: r.studentId,
        subjects: r.subjects,
      }));
      await endpoints.saveMarks(exam.id, payload);
      setSavedAt(new Date());
      setTimeout(() => setSavedAt(null), 2400);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="font-display text-lg font-semibold">Marks entry</div>
          <div className="text-xs text-white/55">
            Grade {exam.grade} · {draft.length} students · {exam.papers.length}{" "}
            papers
          </div>
        </div>
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
          <button onClick={onSave} disabled={saving} className="btn-primary text-sm">
            <Save size={14} /> {saving ? "Saving…" : "Save marks"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-left text-[11px] uppercase tracking-wider text-white/55">
            <tr>
              <th className="sticky left-0 z-10 bg-[#0c0c22]/95 px-4 py-3">
                Student
              </th>
              {exam.papers.map((p) => (
                <th key={p.subject} className="px-3 py-3 text-center">
                  {p.subject}
                  <div className="text-[10px] font-normal text-white/40">
                    / {p.maxMarks}
                  </div>
                </th>
              ))}
              <th className="px-3 py-3 text-center">Total</th>
              <th className="px-3 py-3 text-center">%</th>
              <th className="px-3 py-3 text-center">Grade</th>
            </tr>
          </thead>
          <tbody>
            {draft.map((r, i) => {
              const total = exam.papers.reduce((acc, p) => {
                const v = r.subjects[p.subject];
                return acc + (v === null || v === "" || isNaN(Number(v)) ? 0 : Number(v));
              }, 0);
              const max = exam.papers.reduce((a, p) => a + p.maxMarks, 0);
              const any = exam.papers.some((p) => {
                const v = r.subjects[p.subject];
                return v !== null && v !== "" && !isNaN(Number(v));
              });
              const pct = any ? (total / max) * 100 : null;
              return (
                <motion.tr
                  key={r.studentId}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.01 }}
                  className="border-t border-white/5"
                >
                  <td className="sticky left-0 z-10 bg-[#0c0c22]/95 px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-accent-pink font-display text-[10px] font-bold">
                        {r.avatar}
                      </div>
                      <div>
                        <div className="font-medium">{r.name}</div>
                        <div className="text-[10px] text-white/45">
                          {r.studentId}
                        </div>
                      </div>
                    </div>
                  </td>
                  {exam.papers.map((p) => {
                    const v = r.subjects[p.subject];
                    return (
                      <td key={p.subject} className="px-2 py-1 text-center">
                        <input
                          inputMode="numeric"
                          value={v === null ? "" : v}
                          onChange={(e) =>
                            setMark(
                              r.studentId,
                              p.subject,
                              e.target.value === "" ? null : e.target.value
                            )
                          }
                          className="w-16 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-center text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
                          placeholder="—"
                        />
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-center font-display font-semibold">
                    {any ? total : "—"}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {pct === null ? "—" : `${pct.toFixed(1)}%`}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {pct === null ? (
                      "—"
                    ) : (
                      <GradeChip pct={pct} />
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Results({ exam, rows }) {
  const ranked = useMemo(
    () =>
      [...rows]
        .filter((r) => r.pct !== null)
        .sort((a, b) => b.pct - a.pct),
    [rows]
  );

  const top3 = ranked.slice(0, 3);
  const allHavePct = ranked.length > 0;
  const classAvg = allHavePct
    ? ranked.reduce((a, r) => a + r.pct, 0) / ranked.length
    : null;
  const highest = allHavePct ? ranked[0].pct : null;
  const lowest = allHavePct ? ranked[ranked.length - 1].pct : null;

  if (!allHavePct) {
    return (
      <div className="card text-center text-white/55">
        Results will appear here once marks are entered and saved.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SmallStat label="Students" value={ranked.length} />
        <SmallStat label="Class average" value={`${classAvg.toFixed(1)}%`} />
        <SmallStat label="Highest" value={`${highest.toFixed(1)}%`} />
        <SmallStat label="Lowest" value={`${lowest.toFixed(1)}%`} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {top3.map((s, idx) => (
          <PodiumCard key={s.studentId} rank={idx + 1} student={s} />
        ))}
      </div>

      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-display text-lg font-semibold">
            Full leaderboard
          </div>
          <button className="btn-ghost px-3 py-1.5 text-xs">
            Export report cards
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-left text-[11px] uppercase tracking-wider text-white/55">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Percentage</th>
                <th className="px-4 py-3">Grade</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r, i) => (
                <motion.tr
                  key={r.studentId}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.01 }}
                  className="border-t border-white/5"
                >
                  <td className="px-4 py-2.5">
                    <RankBadge rank={i + 1} />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-accent-pink font-display text-[10px] font-bold">
                        {r.avatar}
                      </div>
                      <div>
                        <div className="font-medium">{r.name}</div>
                        <div className="text-[10px] text-white/45">
                          {r.studentId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-display">
                    {r.total} / {r.max}
                  </td>
                  <td className="px-4 py-2.5">
                    <PercentBar pct={r.pct} />
                  </td>
                  <td className="px-4 py-2.5">
                    <GradeChip pct={r.pct} />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SmallStat({ label, value }) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wider text-white/55">
        {label}
      </div>
      <div className="stat-num glow-text">{value}</div>
    </div>
  );
}

function PodiumCard({ rank, student }) {
  const tones = [
    "from-accent-gold to-accent-pink", // 1
    "from-brand-400 to-accent-violet", // 2
    "from-accent-cyan to-brand-500", // 3
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.06 }}
      className="card relative overflow-hidden"
    >
      <div
        className={`pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br ${tones[rank - 1]} opacity-30 blur-2xl`}
      />
      <div className="relative">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/55">
          <Trophy size={14} className="text-accent-gold" />
          {rank === 1 ? "Top of class" : rank === 2 ? "2nd place" : "3rd place"}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${tones[rank - 1]} font-display text-lg font-bold shadow-glow`}
          >
            {student.avatar}
          </div>
          <div>
            <div className="font-display text-lg font-semibold">
              {student.name}
            </div>
            <div className="text-xs text-white/55">{student.studentId}</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <Field label="Percentage" value={`${student.pct.toFixed(2)}%`} />
          <Field label="Grade" value={student.grade} />
        </div>
      </div>
    </motion.div>
  );
}

function RankBadge({ rank }) {
  const tones =
    rank === 1
      ? "bg-accent-gold/15 text-accent-gold ring-accent-gold/40"
      : rank === 2
      ? "bg-brand-500/15 text-brand-300 ring-brand-400/40"
      : rank === 3
      ? "bg-accent-pink/15 text-pink-200 ring-accent-pink/40"
      : "bg-white/5 text-white/65 ring-white/15";
  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ring-1 ${tones}`}
    >
      {rank}
    </span>
  );
}

function GradeChip({ pct }) {
  const grade =
    pct >= 90
      ? "A+"
      : pct >= 80
      ? "A"
      : pct >= 70
      ? "B"
      : pct >= 60
      ? "C"
      : pct >= 50
      ? "D"
      : pct >= 35
      ? "E"
      : "F";
  const tones = {
    "A+": "bg-emerald-500/15 text-emerald-300 ring-emerald-400/40",
    A: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/40",
    B: "bg-brand-500/15 text-brand-300 ring-brand-400/40",
    C: "bg-accent-cyan/15 text-cyan-200 ring-accent-cyan/40",
    D: "bg-amber-500/15 text-amber-300 ring-amber-400/40",
    E: "bg-orange-500/15 text-orange-300 ring-orange-400/40",
    F: "bg-rose-500/15 text-rose-300 ring-rose-400/40",
  };
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-xs font-bold ring-1 ${tones[grade]}`}
    >
      {grade}
    </span>
  );
}

function PercentBar({ pct }) {
  const color =
    pct >= 80
      ? "from-emerald-400 to-emerald-500"
      : pct >= 60
      ? "from-brand-400 to-accent-violet"
      : "from-rose-400 to-accent-pink";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7 }}
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
        />
      </div>
      <span className="w-12 text-right text-xs text-white/70">
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

function deepClone(x) {
  return JSON.parse(JSON.stringify(x));
}
