import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  BrainCircuit,
  BookOpenCheck,
  ListChecks,
  CheckCircle2,
  CheckCheck,
  Trash2,
  Pencil,
  Plus,
  Play,
  Percent,
  Timer,
  History,
  LibraryBig,
  X,
  Search,
  Filter,
  ChevronRight,
  AlertTriangle,
  Sparkles as SparklesIcon,
  Save,
  TrendingUp,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "History",
  "Geography",
  "Computer Sci",
];

const SUBJECT_TONES = {
  Mathematics: "from-brand-500/30 to-accent-violet/30",
  Physics: "from-accent-cyan/30 to-brand-500/30",
  Chemistry: "from-emerald-500/30 to-accent-cyan/30",
  Biology: "from-emerald-500/30 to-amber-500/30",
  English: "from-accent-pink/30 to-accent-violet/30",
  History: "from-amber-500/30 to-accent-pink/30",
  Geography: "from-accent-violet/30 to-accent-pink/30",
  "Computer Sci": "from-accent-cyan/30 to-accent-violet/30",
};

export default function Quizzes() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";
  const isAuthor = ["admin", "principal", "teacher"].includes(user?.role);
  const isLearner = user?.role === "student" || user?.role === "parent";

  const [tab, setTab] = useState(isLearner ? "browse" : "browse");

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Learning"
        title="Quizzes & Question Bank"
        subtitle={
          isAuthor
            ? "Author MCQ sets, share with students, and see how the class scored."
            : "Pick a quiz, get instant marking and explanations."
        }
      />

      <div className="card flex flex-wrap items-center gap-2">
        <TabButton active={tab === "browse"} onClick={() => setTab("browse")} icon={LibraryBig}>
          Browse
        </TabButton>
        {isLearner && (
          <TabButton active={tab === "mine"} onClick={() => setTab("mine")} icon={History}>
            My attempts
          </TabButton>
        )}
        {isAuthor && (
          <TabButton active={tab === "author"} onClick={() => setTab("author")} icon={BrainCircuit}>
            My sets
          </TabButton>
        )}
      </div>

      <AnimatePresence mode="wait">
        {tab === "browse" && (
          <motion.div key="browse" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <BrowseView isAuthor={isAuthor} isLearner={isLearner} />
          </motion.div>
        )}
        {tab === "mine" && isLearner && (
          <motion.div key="mine" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <MyAttemptsView />
          </motion.div>
        )}
        {tab === "author" && isAuthor && (
          <motion.div key="author" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <AuthorView userId={user?.sub || user?.id} role={user?.role} />
          </motion.div>
        )}
      </AnimatePresence>
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

// ============== BROWSE ==============

function BrowseView({ isAuthor, isLearner }) {
  const { user } = useAuth();
  const [subject, setSubject] = useState("all");
  const [grade, setGrade] = useState("");
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [taking, setTaking] = useState(null); // {set, attempt, take}

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const { data, loading, error, refetch } = useApi(
    () => endpoints.quizSets({ subject, grade: grade || undefined, q: debounced }),
    [subject, grade, debounced]
  );
  useRealtime("quizzes.changed", refetch);

  const startQuiz = async (set) => {
    try {
      let studentId = null;
      if (user?.role === "parent") {
        const child = (user.scope?.children || []).find((c) => c.grade === set.grade);
        if (!child) {
          alert(
            `No linked child in Grade ${set.grade} — pick a quiz for a grade your child is in.`
          );
          return;
        }
        studentId = child.id;
      }
      const out = await endpoints.quizAttemptStart(set.id, studentId);
      setTaking({ set, attempt: out.attempt, take: out.take });
    } catch (e) {
      alert(e?.response?.data?.error || e.message);
    }
  };

  if (taking) {
    return (
      <TakeQuiz
        take={taking.take}
        attemptId={taking.attempt.id}
        onExit={() => setTaking(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {error && <ErrorState error={error} onRetry={refetch} />}

      {data?.summary && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile icon={LibraryBig} label="Sets" value={data.summary.totalSets} tint="from-brand-500/30" />
          <StatTile icon={ListChecks} label="Questions" value={data.summary.totalQuestions} tint="from-accent-violet/30" />
          <StatTile icon={CheckCheck} label="Attempts" value={data.summary.totalAttempts} tint="from-emerald-500/30" />
          <StatTile icon={TrendingUp} label="Last 7 days" value={data.summary.attemptsLast7} tint="from-amber-500/30" />
        </div>
      )}

      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={14} className="text-white/55" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title or description…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-white/55" />
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">All subjects</option>
            {SUBJECTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="">All grades</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : (data.items || []).length === 0 ? (
        <div className="card text-center text-white/55">
          <SparklesIcon className="mx-auto mb-2 text-accent-gold" size={20} />
          {isAuthor
            ? "No quizzes yet — switch to 'My sets' to create one."
            : "No quizzes available for that filter yet."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((s, i) => (
            <QuizCard
              key={s.id}
              set={s}
              idx={i}
              isLearner={isLearner}
              onTake={() => startQuiz(s)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QuizCard({ set, idx, isLearner, onTake }) {
  const tone = SUBJECT_TONES[set.subject] || "from-brand-500/30 to-accent-violet/30";
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i_delay(idx) }}
      className="card relative overflow-hidden"
    >
      <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${tone} blur-2xl opacity-60`} />
      <div className="relative">
        <div className="flex items-center gap-2 text-xs text-white/60">
          <span className="rounded-md bg-white/5 px-2 py-0.5 ring-1 ring-white/10">
            {set.subject}
          </span>
          <span className="rounded-md bg-white/5 px-2 py-0.5 ring-1 ring-white/10">
            Grade {set.grade}
          </span>
        </div>
        <div className="mt-2 line-clamp-2 font-display text-base font-semibold leading-snug">
          {set.title}
        </div>
        {set.description && (
          <div className="mt-1 line-clamp-2 text-xs text-white/55">
            {set.description}
          </div>
        )}
        <div className="mt-3 flex items-center gap-2 text-[11px] text-white/55">
          <ListChecks size={11} /> {set.questionCount || 0} questions
          {set.createdByName && (
            <>
              <span>·</span>
              <span>by {set.createdByName}</span>
            </>
          )}
        </div>
        <button
          onClick={onTake}
          disabled={!set.questionCount}
          className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-violet px-3 py-2 text-xs font-semibold text-white shadow shadow-brand-500/20 disabled:opacity-50"
        >
          <Play size={12} />
          {isLearner ? "Take quiz" : "Test-drive"}
        </button>
      </div>
    </motion.div>
  );
}

function i_delay(i) {
  return Math.min(i, 12) * 0.03;
}

// ============== TAKE QUIZ ==============

function TakeQuiz({ take, attemptId, onExit }) {
  const [answers, setAnswers] = useState({});
  const [idx, setIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);
  const [startedAt] = useState(() => Date.now());
  const [elapsedSec, setElapsedSec] = useState(0);

  // Tick the timer while the quiz is open and unsubmitted.
  useEffect(() => {
    if (result) return;
    const t = setInterval(() => {
      setElapsedSec(Math.round((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [result, startedAt]);

  const q = take.questions[idx];
  const total = take.questions.length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === total;

  const pick = (oi) => {
    setAnswers((a) => ({ ...a, [q.id]: oi }));
  };

  const next = () => setIdx((v) => Math.min(v + 1, total - 1));
  const prev = () => setIdx((v) => Math.max(v - 1, 0));

  const submit = async () => {
    setSubmitting(true);
    setErr(null);
    try {
      const out = await endpoints.quizAttemptSubmit(attemptId, answers);
      setResult(out);
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return <ResultsView result={result} take={take} onExit={onExit} />;
  }

  return (
    <div className="space-y-4">
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-white/55">
            <span className="rounded-md bg-white/5 px-2 py-0.5 ring-1 ring-white/10">
              {take.subject}
            </span>
            <span className="rounded-md bg-white/5 px-2 py-0.5 ring-1 ring-white/10">
              Grade {take.grade}
            </span>
          </div>
          <div className="mt-1 font-display text-lg font-bold">{take.title}</div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1 text-white/70 ring-1 ring-white/10">
            <Timer size={12} /> {formatDuration(elapsedSec)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1 text-white/70 ring-1 ring-white/10">
            <CheckCheck size={12} /> {answeredCount}/{total} answered
          </span>
          <button
            type="button"
            onClick={onExit}
            className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/65 hover:bg-white/10"
          >
            Abandon
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-accent-violet transition-all"
          style={{ width: `${((idx + 1) / total) * 100}%` }}
        />
      </div>

      <div className="card">
        <div className="mb-2 text-xs uppercase tracking-wider text-white/55">
          Question {idx + 1} of {total} · {q.points} pt{q.points === 1 ? "" : "s"}
        </div>
        <div className="font-display text-lg leading-snug text-white">
          {q.text}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {q.options.map((opt, oi) => {
            const picked = answers[q.id] === oi;
            return (
              <button
                key={oi}
                type="button"
                onClick={() => pick(oi)}
                className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                  picked
                    ? "border-brand-400/50 bg-brand-500/15 text-white"
                    : "border-white/10 bg-white/5 text-white/85 hover:bg-white/10"
                }`}
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-md font-mono text-[10px] font-bold ring-1 ${
                    picked
                      ? "bg-brand-500/30 text-brand-200 ring-brand-400/40"
                      : "bg-white/5 text-white/55 ring-white/10"
                  }`}
                >
                  {String.fromCharCode(65 + oi)}
                </span>
                <span className="flex-1">{opt}</span>
                {picked && <CheckCircle2 size={14} className="text-brand-300" />}
              </button>
            );
          })}
        </div>
      </div>

      {err && (
        <div className="flex items-start gap-2 rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-400/30">
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
          <span>{err}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prev}
          disabled={idx === 0}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 disabled:opacity-40"
        >
          ← Previous
        </button>
        <div className="flex flex-wrap gap-1.5">
          {take.questions.map((qq, i) => (
            <button
              key={qq.id}
              type="button"
              onClick={() => setIdx(i)}
              className={`h-6 w-6 rounded-md text-[10px] font-medium ring-1 transition ${
                i === idx
                  ? "bg-brand-500/30 text-brand-200 ring-brand-400/40"
                  : answers[qq.id] !== undefined
                  ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
                  : "bg-white/5 text-white/45 ring-white/10"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        {idx < total - 1 ? (
          <button
            type="button"
            onClick={next}
            className="rounded-lg bg-gradient-to-r from-brand-500 to-accent-violet px-4 py-2 text-sm font-semibold text-white shadow shadow-brand-500/20"
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !allAnswered}
            className="rounded-lg bg-gradient-to-r from-emerald-500 to-brand-500 px-4 py-2 text-sm font-semibold text-white shadow shadow-emerald-500/20 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : allAnswered ? "Submit" : `Answer all to submit`}
          </button>
        )}
      </div>
    </div>
  );
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ============== RESULTS ==============

function ResultsView({ result, take, onExit }) {
  const { attempt, breakdown } = result;
  const pct = attempt.maxScore
    ? Math.round((attempt.score / attempt.maxScore) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <div className="card relative overflow-hidden">
        <div
          className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl ${
            pct >= 80
              ? "bg-gradient-to-br from-emerald-500/40 to-transparent"
              : pct >= 50
              ? "bg-gradient-to-br from-amber-500/40 to-transparent"
              : "bg-gradient-to-br from-rose-500/40 to-transparent"
          }`}
        />
        <div className="relative flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-white/55">
              Final score
            </div>
            <div className="font-display text-4xl font-bold">
              {attempt.score} / {attempt.maxScore}
            </div>
            <div className="text-sm text-white/70">{take.title}</div>
          </div>
          <div className="flex items-center gap-6">
            <Stat label="Score" value={`${pct}%`} icon={Percent} />
            <Stat
              label="Time"
              value={formatDuration(attempt.timeSpentSec || 0)}
              icon={Timer}
            />
            <Stat
              label="Correct"
              value={`${breakdown.filter((b) => b.correct).length}/${breakdown.length}`}
              icon={CheckCheck}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {take.questions.map((q, qi) => {
          const b = breakdown[qi];
          return (
            <div
              key={q.id}
              className={`card relative overflow-hidden ${
                b.correct ? "ring-1 ring-emerald-400/30" : "ring-1 ring-rose-400/30"
              }`}
            >
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium ring-1 ${
                    b.correct
                      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
                      : "bg-rose-500/15 text-rose-300 ring-rose-400/30"
                  }`}
                >
                  {b.correct ? <CheckCircle2 size={11} /> : <X size={11} />}
                  {b.correct ? "Correct" : "Wrong"}
                </span>
                <span className="text-white/55">
                  +{b.correct ? b.points : 0}/{b.points}
                </span>
                <span className="ml-auto text-[10px] text-white/40">
                  Q{qi + 1}
                </span>
              </div>
              <div className="mt-2 font-display text-base">{q.text}</div>
              <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {q.options.map((opt, oi) => {
                  const picked = b.pickedIndex === oi;
                  const correct = b.correctIndex === oi;
                  let cls =
                    "border border-white/10 bg-white/[0.03] text-white/65";
                  if (correct)
                    cls = "border border-emerald-400/40 bg-emerald-500/10 text-emerald-200";
                  else if (picked && !correct)
                    cls = "border border-rose-400/40 bg-rose-500/10 text-rose-200";
                  return (
                    <div
                      key={oi}
                      className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${cls}`}
                    >
                      <span className="font-mono text-[10px] text-white/55">
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {correct && <CheckCircle2 size={12} className="text-emerald-300" />}
                      {picked && !correct && <X size={12} className="text-rose-300" />}
                    </div>
                  );
                })}
              </div>
              {b.explanation && (
                <div className="mt-2 rounded-lg border border-brand-400/20 bg-brand-500/[0.06] px-3 py-2 text-xs text-brand-100/85">
                  <strong className="text-brand-200">Why:</strong> {b.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-brand-500 to-accent-violet px-4 py-2 text-sm font-semibold text-white shadow shadow-brand-500/20"
        >
          Back to quizzes
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="text-right">
      <div className="flex items-center justify-end gap-1 text-[10px] uppercase tracking-wider text-white/55">
        <Icon size={10} /> {label}
      </div>
      <div className="font-display text-xl font-bold">{value}</div>
    </div>
  );
}

// ============== MY ATTEMPTS ==============

function MyAttemptsView() {
  const { data, loading, error, refetch } = useApi(endpoints.quizAttempts, []);
  useRealtime("quizzes.changed", refetch);

  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (loading)
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );

  const items = (data?.items || []).filter((a) => a.submittedAt);
  if (items.length === 0) {
    return (
      <div className="card text-center text-white/55">
        <SparklesIcon className="mx-auto mb-2 text-accent-gold" size={20} />
        No attempts yet — go take a quiz from the Browse tab.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((a, i) => {
        const pct = a.maxScore ? Math.round((a.score / a.maxScore) * 100) : 0;
        return (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 16) * 0.015 }}
            className="flex flex-col gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-3 md:flex-row md:items-center"
          >
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand-500/30 to-accent-violet/30 ring-1 ring-white/10">
                <Brain size={14} className="text-brand-200" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  {a.setTitle}
                </div>
                <div className="text-[11px] text-white/55">
                  {a.subject} · Grade {a.grade} ·{" "}
                  {new Date(a.submittedAt).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-3 text-xs">
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-white/65 ring-1 ring-white/10">
                <Timer size={11} className="-mt-0.5 mr-1 inline" />
                {formatDuration(a.timeSpentSec || 0)}
              </span>
              <span
                className={`rounded-md px-2 py-0.5 font-semibold ring-1 ${
                  pct >= 80
                    ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
                    : pct >= 50
                    ? "bg-amber-500/15 text-amber-200 ring-amber-400/30"
                    : "bg-rose-500/15 text-rose-300 ring-rose-400/30"
                }`}
              >
                {a.score}/{a.maxScore} · {pct}%
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ============== AUTHOR (TEACHER) ==============

function AuthorView({ userId, role }) {
  const isOwnerOnly = role === "teacher";
  const { data, loading, error, refetch } = useApi(
    () => endpoints.quizSets(isOwnerOnly ? { createdBy: userId } : {}),
    [userId, isOwnerOnly]
  );
  useRealtime("quizzes.changed", refetch);

  const [editing, setEditing] = useState(null); // set object or {} for new
  const [analyticsFor, setAnalyticsFor] = useState(null);

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <div className="card flex items-center justify-between">
        <div className="text-sm text-white/70">
          {isOwnerOnly
            ? "Your quiz sets"
            : "All quiz sets — admin/principal can edit any."}
        </div>
        <button
          type="button"
          onClick={() => setEditing({})}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-500 to-accent-violet px-3 py-1.5 text-sm font-semibold text-white shadow shadow-brand-500/20"
        >
          <Plus size={13} /> New set
        </button>
      </div>

      {loading ? (
        <Skeleton className="h-40" />
      ) : (data?.items || []).length === 0 ? (
        <div className="card text-center text-white/55">
          <SparklesIcon className="mx-auto mb-2 text-accent-gold" size={20} />
          No sets yet — click "New set" to author your first quiz.
        </div>
      ) : (
        <div className="space-y-2">
          {data.items.map((s) => (
            <div
              key={s.id}
              className="flex flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3 md:flex-row md:items-center"
            >
              <div className="flex items-center gap-2 md:flex-1">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand-500/30 to-accent-violet/30 ring-1 ring-white/10">
                  <BookOpenCheck size={14} className="text-brand-200" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white">
                    {s.title}
                  </div>
                  <div className="text-[11px] text-white/55">
                    {s.subject} · Grade {s.grade} · {s.questionCount} question
                    {s.questionCount === 1 ? "" : "s"}
                    {s.createdByName ? ` · by ${s.createdByName}` : ""}
                  </div>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setAnalyticsFor(s)}
                  className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-white/75 hover:bg-white/10"
                >
                  <TrendingUp size={12} /> Analytics
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const full = await endpoints.quizSet(s.id);
                      setEditing(full);
                    } catch (e) {
                      alert(e?.response?.data?.error || e.message);
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-white/75 hover:bg-white/10"
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm(`Delete "${s.title}"? Past attempts will stay archived.`))
                      return;
                    try {
                      await endpoints.quizSetDelete(s.id);
                      refetch();
                    } catch (e) {
                      alert(e?.response?.data?.error || e.message);
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-rose-200 hover:bg-rose-500/20"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <SetBuilderModal
            initial={editing.id ? editing : null}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              refetch();
            }}
          />
        )}
        {analyticsFor && (
          <AnalyticsModal
            set={analyticsFor}
            onClose={() => setAnalyticsFor(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function blankQuestion() {
  return {
    text: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    points: 1,
    explanation: "",
  };
}

function SetBuilderModal({ initial, onClose, onSaved }) {
  const isEdit = !!initial;
  const [title, setTitle] = useState(initial?.title || "");
  const [subject, setSubject] = useState(initial?.subject || SUBJECTS[0]);
  const [grade, setGrade] = useState(initial?.grade || 8);
  const [description, setDescription] = useState(initial?.description || "");
  const [questions, setQuestions] = useState(() => {
    const list = initial?.questions || [];
    return list.length > 0 ? list.map((q) => ({ ...q })) : [blankQuestion()];
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const updateQ = (idx, patch) => {
    setQuestions((qs) => qs.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };
  const updateOpt = (qi, oi, val) => {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qi
          ? { ...q, options: q.options.map((o, j) => (j === oi ? val : o)) }
          : q
      )
    );
  };
  const addQ = () => setQuestions((qs) => [...qs, blankQuestion()]);
  const removeQ = (idx) =>
    setQuestions((qs) =>
      qs.length === 1 ? qs : qs.filter((_, i) => i !== idx)
    );

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const payload = { title, subject, grade: Number(grade), description, questions };
      if (isEdit) {
        await endpoints.quizSetUpdate(initial.id, payload);
      } else {
        await endpoints.quizSetCreate(payload);
      }
      onSaved();
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur p-4"
    >
      <motion.form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        className="glass-card relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden p-0"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-white/55">
              {isEdit ? "Edit quiz set" : "New quiz set"}
            </div>
            <div className="font-display text-xl font-bold">
              {title || "Untitled quiz"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Field label="Title">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={140}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50"
              />
            </Field>
            <Field label="Subject">
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
              >
                {SUBJECTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Grade">
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Description (optional)">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={600}
              placeholder="One-liner shown above the quiz"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50"
            />
          </Field>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-white/55">
              Questions ({questions.length})
            </div>
            <button
              type="button"
              onClick={addQ}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/75 hover:bg-white/10"
            >
              <Plus size={11} /> Add question
            </button>
          </div>

          {questions.map((q, qi) => (
            <div
              key={qi}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="flex items-start gap-2">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-brand-500/15 text-xs font-bold text-brand-200 ring-1 ring-brand-400/30">
                  Q{qi + 1}
                </div>
                <textarea
                  value={q.text}
                  onChange={(e) => updateQ(qi, { text: e.target.value })}
                  required
                  rows={2}
                  maxLength={600}
                  placeholder="Question text"
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50"
                />
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQ(qi)}
                    className="rounded-md border border-rose-400/30 bg-rose-500/10 p-1 text-rose-300 hover:bg-rose-500/20"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {q.options.map((opt, oi) => (
                  <label
                    key={oi}
                    className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 text-sm transition ${
                      q.correctIndex === oi
                        ? "border-emerald-400/40 bg-emerald-500/10"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`correct-${qi}`}
                      checked={q.correctIndex === oi}
                      onChange={() => updateQ(qi, { correctIndex: oi })}
                      className="mt-1 h-3.5 w-3.5"
                    />
                    <span className="font-mono text-[10px] text-white/55">
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <input
                      value={opt}
                      onChange={(e) => updateOpt(qi, oi, e.target.value)}
                      required
                      maxLength={200}
                      placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                      className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
                    />
                  </label>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                <Field label="Points">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={q.points}
                    onChange={(e) => updateQ(qi, { points: Number(e.target.value) })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50"
                  />
                </Field>
                <Field label="Explanation (shown after submit)">
                  <input
                    value={q.explanation || ""}
                    onChange={(e) => updateQ(qi, { explanation: e.target.value })}
                    maxLength={600}
                    placeholder="Why is this the right answer?"
                    className="md:col-span-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50"
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t border-white/10 px-6 py-4">
          {err && (
            <div className="flex items-center gap-1.5 rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs text-rose-300 ring-1 ring-rose-400/30">
              <AlertTriangle size={12} /> {err}
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-500 to-accent-violet px-4 py-2 text-sm font-semibold text-white shadow shadow-brand-500/20 disabled:opacity-50"
            >
              <Save size={14} />
              {busy ? "Saving…" : isEdit ? "Save changes" : "Create quiz"}
            </button>
          </div>
        </div>
      </motion.form>
    </motion.div>
  );
}

function AnalyticsModal({ set, onClose }) {
  const { data, loading, error } = useApi(
    () => endpoints.quizSetAnalytics(set.id),
    [set.id]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur p-4"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        className="glass-card relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden p-0"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-white/55">
              Analytics
            </div>
            <div className="font-display text-lg font-bold">{set.title}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {error && <ErrorState error={error} />}
          {loading || !data ? (
            <Skeleton className="h-40" />
          ) : data.totalAttempts === 0 ? (
            <div className="text-center text-white/55">
              <SparklesIcon className="mx-auto mb-2 text-accent-gold" size={20} />
              No attempts yet — analytics will populate once students take this quiz.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <StatTile icon={CheckCheck} label="Attempts" value={data.totalAttempts} tint="from-brand-500/30" />
                <StatTile icon={Percent} label="Avg score" value={`${data.avgPct ?? 0}%`} tint="from-accent-violet/30" />
                <StatTile icon={Timer} label="Median time" value={formatDuration(data.medianTimeSec || 0)} tint="from-emerald-500/30" />
              </div>
              <div>
                <div className="mb-2 text-xs uppercase tracking-wider text-white/55">
                  Per-question correctness
                </div>
                <div className="space-y-1.5">
                  {data.perQuestion.map((q, i) => (
                    <div
                      key={q.questionId}
                      className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-sm"
                    >
                      <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-brand-500/15 text-[10px] font-bold text-brand-200 ring-1 ring-brand-400/30">
                        Q{i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs text-white/85">
                          {q.text}
                        </div>
                      </div>
                      {q.attempted > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                            <div
                              className={`h-full ${
                                q.correctPct >= 70
                                  ? "bg-emerald-400"
                                  : q.correctPct >= 40
                                  ? "bg-amber-400"
                                  : "bg-rose-400"
                              }`}
                              style={{ width: `${q.correctPct}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-[10px] text-white/65">
                            {q.correctPct}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-white/40">No data</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============== SHARED ==============

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
