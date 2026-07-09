import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  X,
  Loader,
  CircleAlert,
  Check,
  Trash2,
  Pencil,
  GraduationCap,
  Clock3,
  NotebookPen,
  Home,
  ImagePlus,
  ImageIcon,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useRealtime } from "../../lib/useRealtime.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { resizeImageToDataURL, downloadDataUrl } from "../../lib/image.js";
import { PageHeader } from "./Students.jsx";

const SECTIONS = ["A", "B", "C", "D"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];
const MAX_IMAGES = 6;

// Local (not UTC) YYYY-MM-DD, so a log written at 9 PM IST lands on today.
function localDateStr(d = new Date()) {
  return d.toLocaleDateString("en-CA");
}

function fmtDay(dateStr) {
  const today = localDateStr();
  const yesterday = localDateStr(new Date(Date.now() - 86400000));
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

export default function TeachingLog() {
  const { user } = useAuth();
  const role = user?.role;
  const canCreate = role === "admin" || role === "principal" || role === "teacher";
  const isParent = role === "parent";

  const [range, setRange] = useState("week"); // today | week | all
  const [subject, setSubject] = useState("");
  const [childId, setChildId] = useState(""); // parent-only child filter
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [editing, setEditing] = useState(null); // null | "new" | log
  const [opening, setOpening] = useState(null); // null | log id
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 200);
    return () => clearTimeout(t);
  }, [q]);

  const children = user?.scope?.children || [];
  const selectedChild = children.find((c) => c.id === childId) || null;

  const { data, loading, error: fetchError, refetch } = useApi(() => {
    const p = { subject };
    if (range === "today") p.date = localDateStr();
    if (range === "week")
      p.from = localDateStr(new Date(Date.now() - 6 * 86400000));
    if (selectedChild) {
      p.grade = selectedChild.grade;
      p.section = selectedChild.section;
    }
    return endpoints.teachingLogs(p);
  }, [range, subject, selectedChild]);
  useRealtime(["teaching-logs.changed"], () => refetch());

  const items = useMemo(() => {
    const list = data?.items || [];
    if (!debouncedQ.trim()) return list;
    const t = debouncedQ.toLowerCase();
    return list.filter(
      (l) =>
        l.topic.toLowerCase().includes(t) ||
        l.subject.toLowerCase().includes(t) ||
        (l.teacherName || "").toLowerCase().includes(t) ||
        (l.details || "").toLowerCase().includes(t)
    );
  }, [data, debouncedQ]);

  // Group into [dateStr, entries[]] pairs — the list arrives newest-day first.
  const byDay = useMemo(() => {
    const groups = new Map();
    for (const l of items) {
      if (!groups.has(l.date)) groups.set(l.date, []);
      groups.get(l.date).push(l);
    }
    return [...groups.entries()];
  }, [items]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Academic"
        title="Teaching Diary"
        subtitle={
          data
            ? role === "teacher"
              ? `${items.length} lesson${items.length === 1 ? "" : "s"} logged in your classes`
              : `${items.length} lesson${items.length === 1 ? "" : "s"} — review what was covered in class`
            : "Loading…"
        }
      />

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          <CircleAlert size={18} className="mt-0.5 shrink-0" />
          <div className="flex-1">{error}</div>
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={16} className="text-white/60" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search topic, subject, teacher…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isParent && children.length > 1 && (
            <select
              value={childId}
              onChange={(e) => setChildId(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50"
            >
              <option value="">All children</option>
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.grade}-{c.section}
                </option>
              ))}
            </select>
          )}
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50"
          >
            <option value="">All subjects</option>
            {(data?.subjects || []).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1 text-xs">
            {[
              { id: "today", label: "Today" },
              { id: "week", label: "Last 7 days" },
              { id: "all", label: "All" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setRange(t.id)}
                className={`rounded-md px-2.5 py-1 transition ${
                  range === t.id
                    ? "bg-brand-500/20 text-brand-200 ring-1 ring-brand-400/30"
                    : "text-white/65 hover:bg-white/5"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {canCreate && (
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="btn-primary px-4 py-2 text-sm"
            >
              <Plus size={14} /> Log a lesson
            </button>
          )}
        </div>
      </div>

      {fetchError && <ErrorState error={fetchError} onRetry={refetch} />}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {byDay.map(([date, logs]) => (
            <section key={date}>
              <div className="mb-2 flex items-center gap-2">
                <div className="text-sm font-semibold text-white">{fmtDay(date)}</div>
                <div className="text-xs text-white/45">{date}</div>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {logs.map((l) => (
                  <LogCard
                    key={l.id}
                    l={l}
                    role={role}
                    teacherId={user?.scope?.teacherId}
                    onOpen={() => setOpening(l.id)}
                    onEdit={() => setEditing(l)}
                    onDeleted={refetch}
                    onError={setError}
                  />
                ))}
              </div>
            </section>
          ))}
          {byDay.length === 0 && (
            <div className="card text-center text-sm text-white/55">
              {canCreate
                ? "No lessons logged yet for this view. Use “Log a lesson” after each class so students and parents can revise at home."
                : "Nothing has been logged for this view yet — check back after school hours."}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {editing === "new" && (
          <LogFormModal
            mode="create"
            user={user}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              refetch();
            }}
            onError={setError}
          />
        )}
        {editing && editing !== "new" && (
          <LogFormModal
            mode="edit"
            initial={editing}
            user={user}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              refetch();
            }}
            onError={setError}
          />
        )}
        {opening && (
          <LogDetailModal
            id={opening}
            onClose={() => setOpening(null)}
            onError={setError}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============ Card ============

function LogCard({ l, role, teacherId, onOpen, onEdit, onDeleted, onError }) {
  const isOwner = role === "teacher" && teacherId && l.teacherId === teacherId;
  const canManage = role === "admin" || role === "principal" || isOwner;
  const [busy, setBusy] = useState(false);

  const onDelete = async (e) => {
    e.stopPropagation();
    if (busy) return;
    if (!window.confirm(`Delete the ${l.subject} log “${l.topic}”?`)) return;
    setBusy(true);
    try {
      await endpoints.teachingLogDelete(l.id);
      onDeleted();
    } catch (err) {
      onError(err?.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onOpen}
      className="card group cursor-pointer text-left transition hover:border-brand-400/30 hover:bg-white/[0.06]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="rounded-full bg-brand-500/15 px-2 py-0.5 font-medium text-brand-200 ring-1 ring-brand-400/30">
            {l.subject}
          </span>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-white/65 ring-1 ring-white/10">
            <GraduationCap size={11} className="mr-1 inline" />
            Grade {l.grade}{l.section ? `-${l.section}` : " (all)"}
          </span>
          {l.period && (
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-white/65 ring-1 ring-white/10">
              <Clock3 size={11} className="mr-1 inline" />
              Period {l.period}
            </span>
          )}
        </div>
        {canManage && (
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
            <span
              role="button"
              tabIndex={0}
              title="Edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              onKeyDown={(e) => e.key === "Enter" && onEdit()}
              className="rounded-md p-1 text-white/55 hover:bg-white/10 hover:text-white"
            >
              <Pencil size={13} />
            </span>
            <span
              role="button"
              tabIndex={0}
              title="Delete"
              onClick={onDelete}
              onKeyDown={(e) => e.key === "Enter" && onDelete(e)}
              className="rounded-md p-1 text-white/55 hover:bg-rose-500/20 hover:text-rose-300"
            >
              {busy ? <Loader size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 font-medium text-white">{l.topic}</div>
      {l.details && (
        <div className="mt-1 line-clamp-2 text-xs text-white/55">{l.details}</div>
      )}
      {l.homework && (
        <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-500/10 px-2 py-1.5 text-xs text-amber-200 ring-1 ring-amber-400/20">
          <Home size={12} className="mt-0.5 shrink-0" />
          <span className="line-clamp-2">{l.homework}</span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-[11px] text-white/45">
        <span>{l.teacherName}</span>
        {l.imageCount > 0 && (
          <span className="flex items-center gap-1">
            <ImageIcon size={11} /> {l.imageCount} photo{l.imageCount === 1 ? "" : "s"}
          </span>
        )}
      </div>
    </button>
  );
}

// ============ Create / edit ============

function LogFormModal({ mode, initial, user, onClose, onSaved, onError }) {
  const isEdit = mode === "edit";
  const [date, setDate] = useState(initial?.date || localDateStr());
  const [grade, setGrade] = useState(() => {
    if (initial?.grade) return initial.grade;
    const firstClass = user?.scope?.classes?.[0];
    if (firstClass) return Number(firstClass.split("-")[0]);
    return 8;
  });
  const [section, setSection] = useState(() => {
    if (initial?.section !== undefined) return initial.section || "";
    const firstClass = user?.scope?.classes?.[0];
    return firstClass ? firstClass.split("-")[1] || "" : "";
  });
  const [subject, setSubject] = useState(
    initial?.subject || user?.scope?.subjects?.[0] || "Mathematics"
  );
  const [period, setPeriod] = useState(initial?.period ?? "");
  const [topic, setTopic] = useState(initial?.topic || "");
  const [details, setDetails] = useState(initial?.details || "");
  const [homework, setHomework] = useState(initial?.homework || "");
  const [images, setImages] = useState(initial?.images || []);
  // On create, images are ready immediately. On edit the list item carries only
  // an imageCount (not the heavy base64), so we fetch the full record before the
  // payload is allowed to include `images` — otherwise saving would wipe them.
  const [imagesReady, setImagesReady] = useState(!isEdit);
  const [busy, setBusy] = useState(false);

  // Admins/principals log on behalf of a teacher, so they pick one; teachers
  // are pinned to themselves server-side and never see this field.
  const isTeacher = user?.role === "teacher";
  const [teacherId, setTeacherId] = useState(initial?.teacherId || "");
  const [teacherOptions, setTeacherOptions] = useState([]);
  useEffect(() => {
    if (isTeacher) return;
    let cancelled = false;
    endpoints
      .teachers()
      .then((res) => {
        if (!cancelled) setTeacherOptions(res?.items || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isTeacher]);

  useEffect(() => {
    if (!isEdit || !initial?.id) return;
    let cancelled = false;
    endpoints
      .teachingLog(initial.id)
      .then((res) => {
        if (!cancelled) {
          setImages(res?.images || []);
          setImagesReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) setImagesReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isEdit, initial?.id]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const payload = {
        date,
        grade: Number(grade),
        section: section || null,
        subject,
        period: period === "" ? null : Number(period),
        topic: topic.trim(),
        details: details.trim(),
        homework: homework.trim(),
      };
      if (!isTeacher && teacherId) payload.teacherId = teacherId;
      if (imagesReady) payload.images = images;
      if (isEdit) {
        await endpoints.teachingLogUpdate(initial.id, payload);
      } else {
        await endpoints.teachingLogAdd(payload);
      }
      onSaved();
    } catch (err) {
      onError(err?.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  // Teacher: restrict grade picker to grades they teach.
  const teacherGrades = useMemo(() => {
    const cls = user?.scope?.classes || [];
    return [...new Set(cls.map((c) => Number(c.split("-")[0])))].sort((a, b) => a - b);
  }, [user]);

  const inputCls =
    "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50";

  return (
    <ModalShell
      title={isEdit ? `Edit lesson log — ${initial?.topic}` : "Log a lesson"}
      onClose={onClose}
      width="lg"
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Field label="Date *">
            <input
              type="date"
              required
              value={date}
              max={localDateStr()}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Grade *">
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className={inputCls}
            >
              {(isTeacher && teacherGrades.length
                ? teacherGrades
                : Array.from({ length: 12 }, (_, i) => i + 1)
              ).map((g) => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
          </Field>
          <Field label="Section">
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className={inputCls}
            >
              <option value="">All sections</option>
              {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Period">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className={inputCls}
            >
              <option value="">—</option>
              {PERIODS.map((p) => <option key={p} value={p}>Period {p}</option>)}
            </select>
          </Field>
        </div>
        <div className={isTeacher ? "" : "grid grid-cols-1 gap-3 md:grid-cols-2"}>
          {!isTeacher && (
            <Field label="Teacher *">
              <select
                required
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className={inputCls}
              >
                <option value="">Select teacher…</option>
                {teacherOptions.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} · {t.subject}</option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Subject *">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={inputCls}
            >
              {["Mathematics", "Physics", "Chemistry", "Biology", "English",
                "History", "Geography", "Computer Sci", "PE", "Art"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Topic covered *">
          <input
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={200}
            className={inputCls}
            placeholder="e.g. Quadratic Equations — factorisation method"
          />
        </Field>
        <Field label="What was taught">
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={4}
            maxLength={8000}
            className={inputCls}
            placeholder="Concepts explained, examples solved in class, page/exercise numbers, anything students should revise…"
          />
        </Field>
        <Field label="Homework / revision">
          <textarea
            value={homework}
            onChange={(e) => setHomework(e.target.value)}
            rows={2}
            maxLength={2000}
            className={inputCls}
            placeholder="e.g. Solve Ex 4.2 Q1–Q10; revise the notes before Friday's quiz"
          />
        </Field>

        <Field label="Board / notes photos">
          {isEdit && !imagesReady ? (
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-xs text-white/55">
              <Loader size={14} className="animate-spin" /> Loading existing photos…
            </div>
          ) : (
            <ImagesEditor
              images={images}
              onChange={setImages}
              onError={onError}
              hint="Photos of the blackboard / class notes. Students and parents can view and download these."
            />
          )}
        </Field>

        <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            {busy ? <Loader size={14} className="animate-spin" /> : <Check size={14} />}
            {isEdit ? "Save changes" : "Add to diary"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ============ Detail (read view for everyone) ============

function LogDetailModal({ id, onClose, onError }) {
  const { data, loading, error } = useApi(() => endpoints.teachingLog(id), [id]);

  useEffect(() => {
    if (error) onError(error?.response?.data?.error || error.message);
  }, [error, onError]);

  return (
    <ModalShell
      title={data ? data.topic : "Lesson details"}
      onClose={onClose}
      width="lg"
    >
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-6" />
          <Skeleton className="h-24" />
        </div>
      ) : !data ? (
        <div className="text-sm text-white/55">Could not load this entry.</div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="rounded-full bg-brand-500/15 px-2 py-0.5 font-medium text-brand-200 ring-1 ring-brand-400/30">
              {data.subject}
            </span>
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-white/65 ring-1 ring-white/10">
              Grade {data.grade}{data.section ? `-${data.section}` : " (all sections)"}
            </span>
            {data.period && (
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-white/65 ring-1 ring-white/10">
                Period {data.period}
              </span>
            )}
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-white/65 ring-1 ring-white/10">
              {fmtDay(data.date)} · {data.date}
            </span>
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-white/65 ring-1 ring-white/10">
              <NotebookPen size={11} className="mr-1 inline" />
              {data.teacherName}
            </span>
          </div>

          {data.details ? (
            <div>
              <div className="mb-1 text-xs uppercase tracking-wider text-white/55">
                What was taught
              </div>
              <div className="whitespace-pre-wrap rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/85">
                {data.details}
              </div>
            </div>
          ) : (
            <div className="text-xs text-white/45">No extra notes for this lesson.</div>
          )}

          {data.homework && (
            <div>
              <div className="mb-1 text-xs uppercase tracking-wider text-amber-200/80">
                Homework / revision
              </div>
              <div className="flex items-start gap-2 whitespace-pre-wrap rounded-xl bg-amber-500/10 p-3 text-sm text-amber-100 ring-1 ring-amber-400/20">
                <Home size={14} className="mt-0.5 shrink-0" />
                <span>{data.homework}</span>
              </div>
            </div>
          )}

          <ImageGallery images={data.images} title={data.topic} label="Class photos" />
        </div>
      )}
    </ModalShell>
  );
}

// ============ Shared shells (house pattern: duplicated per page) ============

function ModalShell({ title, onClose, width = "md", children }) {
  const maxW = width === "lg" ? "max-w-2xl" : "max-w-lg";
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.98 }}
        onClick={(e) => e.stopPropagation()}
        className={`mt-12 w-full ${maxW} rounded-2xl border border-white/10 bg-[#0d0f24] p-5 shadow-2xl`}
      >
        <div className="mb-3 flex items-start justify-between">
          <h3 className="font-display text-lg font-semibold text-white">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-white/55 hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
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

// ============ Photos ============

function ImagesEditor({ images, onChange, onError, hint = "JPG/PNG · auto-resized." }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const onPick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (fileRef.current) fileRef.current.value = "";
    if (!files.length) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      onError?.(`You can attach up to ${MAX_IMAGES} photos`);
      return;
    }
    const picked = files.slice(0, room);
    setBusy(true);
    try {
      const resized = [];
      for (const f of picked) resized.push(await resizeImageToDataURL(f));
      onChange([...images, ...resized]);
      if (files.length > room)
        onError?.(`Added ${room} — limit is ${MAX_IMAGES} photos`);
    } catch (ex) {
      onError?.(ex.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {images.map((src, i) => (
          <div
            key={i}
            className="group relative h-20 w-20 overflow-hidden rounded-lg ring-1 ring-white/15"
          >
            <img src={src} alt={`Attachment ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              title="Remove"
              className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white opacity-0 transition hover:bg-black/80 group-hover:opacity-100"
            >
              <X size={11} />
            </button>
          </div>
        ))}
        {images.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="grid h-20 w-20 place-items-center rounded-lg border border-dashed border-white/20 bg-white/5 text-white/55 transition hover:bg-white/10 disabled:opacity-50"
            title="Add photos"
          >
            {busy ? <Loader size={16} className="animate-spin" /> : <ImagePlus size={18} />}
          </button>
        )}
      </div>
      <div className="mt-1.5 text-[11px] text-white/45">
        Up to {MAX_IMAGES} photos · {hint}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onPick}
        className="hidden"
      />
    </div>
  );
}

function safeImageName(title, i) {
  const base = String(title || "lesson")
    .replace(/[^\w.-]+/g, "_")
    .slice(0, 40)
    .replace(/^_+|_+$/g, "");
  return `${base || "lesson"}-photo-${i + 1}.jpg`;
}

function ImageGallery({ images, title, label = "Photos" }) {
  const [open, setOpen] = useState(null); // index | null
  if (!images?.length) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-white/85">
        <ImageIcon size={13} className="text-brand-200" />
        {label}
        <span className="text-[11px] font-normal text-white/45">({images.length})</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {images.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpen(i)}
            className="h-20 w-20 overflow-hidden rounded-lg ring-1 ring-white/15 transition hover:ring-brand-400/50"
          >
            <img src={src} alt={`${label} ${i + 1}`} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      <AnimatePresence>
        {open !== null && (
          <Lightbox
            images={images}
            index={open}
            title={title}
            onClose={() => setOpen(null)}
            onIndex={setOpen}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Lightbox({ images, index, title, onClose, onIndex }) {
  const src = images[index];
  const prev = () => onIndex((index - 1 + images.length) % images.length);
  const next = () => onIndex((index + 1) % images.length);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-full max-w-3xl flex-col items-center gap-3"
      >
        <img
          src={src}
          alt={`${title} photo ${index + 1}`}
          className="max-h-[75vh] w-auto rounded-xl object-contain ring-1 ring-white/15"
        />
        <div className="flex items-center gap-2 text-xs text-white/70">
          {images.length > 1 && (
            <button
              type="button"
              onClick={prev}
              className="rounded-md bg-white/10 p-1.5 hover:bg-white/20"
            >
              <ChevronLeft size={14} />
            </button>
          )}
          <span>
            {index + 1} / {images.length}
          </span>
          {images.length > 1 && (
            <button
              type="button"
              onClick={next}
              className="rounded-md bg-white/10 p-1.5 hover:bg-white/20"
            >
              <ChevronRight size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={() => downloadDataUrl(src, safeImageName(title, index))}
            className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-1.5 hover:bg-white/20"
          >
            <Download size={13} /> Download
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-white/10 p-1.5 hover:bg-white/20"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
