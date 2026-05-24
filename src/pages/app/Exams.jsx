import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  ClipboardList,
  Trophy,
  ChevronRight,
  Sparkles as SparklesIcon,
  Filter,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader,
  CircleAlert,
  CalendarClock,
  MapPin,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const STATUS_TONES = {
  Completed: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Ongoing: "bg-accent-pink/15 text-pink-200 ring-accent-pink/30",
  Scheduled: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
};

const TYPE_TONES = {
  "Unit Test": "from-brand-500 to-accent-cyan",
  "Mid-term": "from-accent-violet to-brand-500",
  Final: "from-accent-pink to-accent-violet",
  Practical: "from-accent-gold to-accent-pink",
};

const TYPES = ["Unit Test", "Mid-term", "Final", "Practical"];
const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology",
  "English", "History", "Geography", "Computer Sci",
];

function todayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function Exams() {
  const { user } = useAuth();
  const canEdit = ["admin", "principal"].includes(user?.role);

  const { data, loading, error: fetchError, refetch } = useApi(
    endpoints.exams,
    []
  );
  const [grade, setGrade] = useState("all");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState(null); // null | "new" | exam
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);

  const filtered = useMemo(() => {
    const items = data?.items || [];
    return items.filter(
      (e) =>
        (grade === "all" || String(e.grade) === grade) &&
        (status === "all" || e.status === status)
    );
  }, [data, grade, status]);

  const counts = useMemo(() => {
    const items = data?.items || [];
    return {
      total: items.length,
      ongoing: items.filter((e) => e.status === "Ongoing").length,
      scheduled: items.filter((e) => e.status === "Scheduled").length,
      completed: items.filter((e) => e.status === "Completed").length,
    };
  }, [data]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Academic"
        title="Exams & Results"
        subtitle="Schedule exams, enter marks, generate results & report cards"
      />

      {fetchError && <ErrorState error={fetchError} onRetry={refetch} />}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          <CircleAlert size={18} className="mt-0.5 shrink-0" />
          <div className="flex-1">{error}</div>
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile icon={ClipboardList} label="Total exams" value={counts.total} tint="from-brand-500/30" />
        <StatTile icon={CalendarDays} label="Scheduled" value={counts.scheduled} tint="from-accent-cyan/30" />
        <StatTile icon={SparklesIcon} label="Ongoing" value={counts.ongoing} tint="from-accent-pink/30" />
        <StatTile icon={Trophy} label="Completed" value={counts.completed} tint="from-accent-gold/30" />
      </div>

      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-white/55" />
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
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">Any status</option>
            <option>Scheduled</option>
            <option>Ongoing</option>
            <option>Completed</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-white/50">
            Showing {filtered.length} of {data?.total ?? "—"}
          </div>
          {canEdit && (
            <button
              onClick={() => setEditing("new")}
              className="btn-primary px-3 py-2 text-sm"
            >
              <Plus size={14} /> Schedule exam
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((exam, i) => (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ y: -4 }}
              className="card group relative overflow-hidden"
            >
              <div
                className={`pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br ${
                  TYPE_TONES[exam.type] || "from-brand-500 to-accent-pink"
                } opacity-20 blur-2xl transition-opacity group-hover:opacity-40`}
              />
              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-white/50">
                      {exam.type} · {exam.id}
                    </div>
                    <div className="font-display text-lg font-semibold">
                      {exam.name}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${
                      STATUS_TONES[exam.status]
                    }`}
                  >
                    {exam.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                  <Meta label="Papers" value={exam.papers.length} />
                  <Meta label="From" value={exam.startDate || "—"} />
                  <Meta label="To" value={exam.endDate || "—"} />
                </div>

                <div className="mt-4 flex flex-wrap gap-1">
                  {exam.papers.slice(0, 4).map((p) => (
                    <span
                      key={p.subject}
                      className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/70"
                    >
                      {p.subject}
                    </span>
                  ))}
                  {exam.papers.length > 4 && (
                    <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/50">
                      +{exam.papers.length - 4} more
                    </span>
                  )}
                </div>

                <div className="mt-5 flex items-center gap-2">
                  <Link
                    to={`/app/exams/${exam.id}`}
                    className="inline-flex flex-1 items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium transition-all hover:bg-white/10"
                  >
                    <span>Open exam</span>
                    <ChevronRight size={16} />
                  </Link>
                  {canEdit && (
                    <>
                      <button
                        onClick={() => setEditing(exam)}
                        title="Edit"
                        className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-white/75 hover:bg-white/10 hover:text-white"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleting(exam)}
                        title="Delete"
                        className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-2.5 text-rose-300 hover:bg-rose-500/20"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <ExamFormModal
            exam={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              refetch();
            }}
            onError={setError}
          />
        )}
        {deleting && (
          <DeleteConfirmModal
            exam={deleting}
            onCancel={() => setDeleting(null)}
            onConfirm={async () => {
              try {
                const result = await endpoints.examDelete(deleting.id);
                setDeleting(null);
                refetch();
                if (result.removedMarks > 0) {
                  // Surface so the admin knows associated marks were cascaded
                  setError(
                    `Deleted ${deleting.id} and removed ${result.removedMarks} mark entries.`
                  );
                }
              } catch (e) {
                setError(e?.response?.data?.error || e.message);
                setDeleting(null);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tint }) {
  return (
    <div className="card relative overflow-hidden">
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${tint} to-transparent blur-2xl`}
      />
      <div className="relative flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-white/55">
            {label}
          </div>
          <div className="stat-num glow-text">{value}</div>
        </div>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2">
      <div className="text-[10px] uppercase tracking-wider text-white/45">
        {label}
      </div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function ExamFormModal({ exam, onClose, onSaved, onError }) {
  const isNew = !exam;
  const [name, setName] = useState(exam?.name || "");
  const [type, setType] = useState(exam?.type || "Unit Test");
  const [grade, setGrade] = useState(exam?.grade || 8);
  const [papers, setPapers] = useState(
    exam?.papers
      ? exam.papers.map((p) => ({ ...p }))
      : [
          {
            subject: "Mathematics",
            date: todayPlus(7),
            startTime: "09:30",
            endTime: "12:30",
            maxMarks: 100,
            room: "Hall 101",
          },
        ]
  );
  const [saving, setSaving] = useState(false);

  const usedSubjects = new Set(papers.map((p) => p.subject));
  const availableSubjects = SUBJECTS.filter((s) => !usedSubjects.has(s));

  const setPaper = (idx, field, value) =>
    setPapers((cur) =>
      cur.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );

  const addPaper = () => {
    if (availableSubjects.length === 0) return;
    setPapers((cur) => [
      ...cur,
      {
        subject: availableSubjects[0],
        date: todayPlus(7 + cur.length),
        startTime: "09:30",
        endTime: "12:30",
        maxMarks: 100,
        room: "Hall 101",
      },
    ]);
  };

  const removePaper = (idx) =>
    setPapers((cur) => cur.filter((_, i) => i !== idx));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (papers.length === 0) {
      onError("Add at least one paper.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name || `${type} · Grade ${grade}`,
        type,
        grade: Number(grade),
        papers: papers.map((p) => ({ ...p, maxMarks: Number(p.maxMarks) })),
      };
      if (isNew) await endpoints.examAdd(payload);
      else await endpoints.examUpdate(exam.id, payload);
      onSaved();
    } catch (err) {
      onError(err?.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50";

  return (
    <Modal onClose={onClose} wide>
      <form onSubmit={onSubmit}>
        <div className="flex items-center justify-between">
          <div>
            <div className="chip">
              <CalendarClock size={14} className="text-accent-gold" />
              {isNew ? "Schedule exam" : `Edit ${exam.id}`}
            </div>
            <h2 className="mt-2 font-display text-xl font-semibold">
              {isNew ? "New exam" : exam.name}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-white/55 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <Field label="Type">
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
              {TYPES.map((t) => (
                <option key={t} value={t} className="bg-black">
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Grade">
            <select value={grade} onChange={(e) => setGrade(e.target.value)} className={inputCls}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                <option key={g} value={g} className="bg-black">
                  Grade {g}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Exam name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`${type} · Grade ${grade}`}
              className={inputCls}
            />
          </Field>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-white/55">
              Papers ({papers.length})
            </div>
            <button
              type="button"
              onClick={addPaper}
              disabled={availableSubjects.length === 0}
              className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/75 hover:bg-white/10 disabled:opacity-50"
            >
              <Plus size={12} /> Add paper
            </button>
          </div>
          <div className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
            {papers.map((p, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[1.4fr_1.1fr_0.8fr_0.8fr_0.7fr_1fr_auto] gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2"
              >
                <select
                  value={p.subject}
                  onChange={(e) => setPaper(idx, "subject", e.target.value)}
                  className={inputCls}
                >
                  {SUBJECTS.map((s) => (
                    <option
                      key={s}
                      value={s}
                      disabled={usedSubjects.has(s) && p.subject !== s}
                      className="bg-black"
                    >
                      {s}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={p.date}
                  onChange={(e) => setPaper(idx, "date", e.target.value)}
                  className={`${inputCls} [color-scheme:dark]`}
                />
                <input
                  type="time"
                  value={p.startTime}
                  onChange={(e) => setPaper(idx, "startTime", e.target.value)}
                  className={`${inputCls} [color-scheme:dark]`}
                />
                <input
                  type="time"
                  value={p.endTime}
                  onChange={(e) => setPaper(idx, "endTime", e.target.value)}
                  className={`${inputCls} [color-scheme:dark]`}
                />
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={p.maxMarks}
                  onChange={(e) => setPaper(idx, "maxMarks", e.target.value)}
                  className={inputCls}
                  title="Max marks"
                />
                <div className="flex items-center gap-1">
                  <MapPin size={12} className="text-white/45" />
                  <input
                    value={p.room}
                    onChange={(e) => setPaper(idx, "room", e.target.value)}
                    className={inputCls}
                    placeholder="Hall"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removePaper(idx)}
                  disabled={papers.length === 1}
                  title={papers.length === 1 ? "Need at least one paper" : "Remove paper"}
                  className="rounded-md border border-rose-400/30 bg-rose-500/10 p-2 text-rose-300 hover:bg-rose-500/20 disabled:opacity-40"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-500 to-accent-violet px-4 py-2.5 text-sm font-semibold text-white shadow shadow-brand-500/20 disabled:opacity-50"
          >
            {saving ? <Loader size={14} className="animate-spin" /> : isNew ? <Plus size={14} /> : <Pencil size={14} />}
            {isNew ? "Schedule" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteConfirmModal({ exam, onCancel, onConfirm }) {
  const [working, setWorking] = useState(false);
  return (
    <Modal onClose={onCancel}>
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-500/20 text-rose-300">
          <Trash2 size={18} />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold">Delete exam?</h2>
          <p className="text-sm text-white/55">{exam.name} · {exam.id}</p>
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-xs text-rose-100">
        Removes the exam and cascades all entered marks for its papers.
      </div>
      <div className="mt-5 flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          disabled={working}
          onClick={async () => {
            setWorking(true);
            await onConfirm();
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow shadow-rose-500/20 disabled:opacity-50"
        >
          {working ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
          Delete
        </button>
      </div>
    </Modal>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs uppercase tracking-wider text-white/55">
        {label}
      </span>
      {children}
    </label>
  );
}

function Modal({ children, onClose, wide = false }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.96, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 12 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${wide ? "max-w-3xl" : "max-w-lg"} rounded-2xl border border-white/15 bg-[#0d0f24] p-6 shadow-2xl`}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
