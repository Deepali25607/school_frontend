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
  ClipboardList,
  GraduationCap,
  Clock3,
  Send,
  FileText,
  CircleCheckBig,
  BookOpen,
  Users,
  ImagePlus,
  Download,
  ImageIcon,
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
const MAX_IMAGES = 6;
const STATUS_TONES = {
  Submitted: "bg-brand-500/15 text-brand-200 ring-brand-400/30",
  Graded:    "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Late:      "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  "Not yet": "bg-white/5 text-white/55 ring-white/10",
};

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}
function isPast(iso) {
  return new Date(iso).getTime() < Date.now();
}

export default function Assignments() {
  const { user } = useAuth();
  const role = user?.role;
  const canCreate = role === "admin" || role === "principal" || role === "teacher";
  const isStudent = role === "student";

  const [filter, setFilter] = useState("all"); // all | open | closed
  const [subject, setSubject] = useState("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [editing, setEditing] = useState(null); // null | "new" | assignment
  const [opening, setOpening] = useState(null); // null | assignment id
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 200);
    return () => clearTimeout(t);
  }, [q]);

  const { data, loading, error: fetchError, refetch } = useApi(
    () => endpoints.assignments({ status: filter === "all" ? "" : filter, subject }),
    [filter, subject]
  );
  useRealtime(["assignments.changed"], () => refetch());

  const items = useMemo(() => {
    const list = data?.items || [];
    if (!debouncedQ.trim()) return list;
    const t = debouncedQ.toLowerCase();
    return list.filter(
      (a) =>
        a.title.toLowerCase().includes(t) ||
        a.subject.toLowerCase().includes(t) ||
        a.id.toLowerCase().includes(t)
    );
  }, [data, debouncedQ]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Academic"
        title="Assignments"
        subtitle={
          data
            ? `${items.length} assignment${items.length === 1 ? "" : "s"}${role === "teacher" ? " in your classes" : ""}`
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
            placeholder="Search title, subject, ID…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
              { id: "all", label: "All" },
              { id: "open", label: "Open" },
              { id: "closed", label: "Closed" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilter(t.id)}
                className={`rounded-md px-2.5 py-1 transition ${
                  filter === t.id
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
              <Plus size={14} /> New assignment
            </button>
          )}
        </div>
      </div>

      {fetchError && <ErrorState error={fetchError} onRetry={refetch} />}

      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((a) => (
            <AssignmentCard
              key={a.id}
              a={a}
              role={role}
              onOpen={() => setOpening(a.id)}
              onEdit={() => setEditing(a)}
            />
          ))}
          {items.length === 0 && (
            <div className="card md:col-span-2 xl:col-span-3 text-center text-sm text-white/55">
              No assignments match these filters.
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {editing === "new" && (
          <AssignmentFormModal
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
          <AssignmentFormModal
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
          <AssignmentDetailModal
            id={opening}
            user={user}
            onClose={() => setOpening(null)}
            onChanged={() => refetch()}
            onError={setError}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============ Card ============

function AssignmentCard({ a, role, onOpen, onEdit }) {
  const due = new Date(a.dueAt);
  const past = isPast(a.dueAt);
  const myStatus = a.mySubmission?.status || (role === "student" ? "Not yet" : null);
  const isOwner = role === "teacher" && a.teacherId && a._owned !== false; // best-effort

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="card relative cursor-pointer overflow-hidden"
      onClick={onOpen}
    >
      <div
        className={`pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-gradient-to-br ${
          past ? "from-rose-500/15 to-amber-500/15" : "from-brand-500/25 to-accent-violet/25"
        } blur-2xl`}
      />
      <div className="relative">
        <div className="flex items-start gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500/25 to-accent-violet/25 ring-1 ring-white/10">
            <BookOpen size={16} className="text-brand-200" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-base font-semibold text-white">
              {a.title}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-white/55">
              <span>{a.subject}</span>
              <span>·</span>
              <span>Grade {a.grade}{a.section ? `-${a.section}` : ""}</span>
            </div>
          </div>
        </div>

        {a.description && (
          <p className="mt-3 line-clamp-2 text-xs text-white/65">
            {a.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ring-1 ${
              past
                ? "bg-rose-500/10 text-rose-300 ring-rose-400/30"
                : "bg-emerald-500/10 text-emerald-300 ring-emerald-400/30"
            }`}
          >
            <Clock3 size={10} /> {past ? "Closed" : "Due"} · {fmtDate(a.dueAt)}
          </span>
          {a.maxMarks ? (
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-white/55 ring-1 ring-white/10">
              {a.maxMarks} marks
            </span>
          ) : null}
          {a.imageCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-white/55 ring-1 ring-white/10">
              <ImageIcon size={10} /> {a.imageCount} photo{a.imageCount === 1 ? "" : "s"}
            </span>
          )}
          {myStatus && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ring-1 ${STATUS_TONES[myStatus] || STATUS_TONES["Not yet"]}`}
            >
              {myStatus === "Graded" ? <CircleCheckBig size={10} /> : <FileText size={10} />}
              {myStatus === "Graded" && a.mySubmission?.marks != null
                ? `Graded · ${a.mySubmission.marks}${a.maxMarks ? `/${a.maxMarks}` : ""}`
                : myStatus}
            </span>
          )}
        </div>

        {role === "parent" && Array.isArray(a.childSubmissions) && a.childSubmissions.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
            {a.childSubmissions.map((c) => {
              const tone = STATUS_TONES[c.status] || STATUS_TONES["Not yet"];
              const firstName = c.studentName?.split(" ")[0] || c.studentId;
              return (
                <span
                  key={c.studentId}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ring-1 ${tone}`}
                  title={`${c.studentName} — ${c.status}`}
                >
                  <span className="font-medium">{firstName}</span>
                  <span className="opacity-75">·</span>
                  <span>
                    {c.status === "Graded" && c.marks != null
                      ? `Graded · ${c.marks}${a.maxMarks ? `/${a.maxMarks}` : ""}`
                      : c.status}
                  </span>
                </span>
              );
            })}
          </div>
        )}

        {(role === "teacher" || role === "admin" || role === "principal") && onEdit && (
          <div
            className="mt-3 flex justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/75 hover:bg-white/10"
            >
              <Pencil size={11} /> Edit
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============ Create / edit form ============

function AssignmentFormModal({ mode, initial, user, onClose, onSaved, onError }) {
  const isEdit = mode === "edit";
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [subject, setSubject] = useState(initial?.subject || "Mathematics");
  const [grade, setGrade] = useState(() => {
    if (initial?.grade) return initial.grade;
    const firstClass = user?.scope?.classes?.[0];
    if (firstClass) return Number(firstClass.split("-")[0]);
    return 8;
  });
  const [section, setSection] = useState(initial?.section || "");
  const [dueAt, setDueAt] = useState(
    initial?.dueAt
      ? new Date(initial.dueAt).toISOString().slice(0, 16)
      : new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 16)
  );
  const [maxMarks, setMaxMarks] = useState(initial?.maxMarks ?? 100);
  const [images, setImages] = useState(initial?.images || []);
  // On create, images are ready immediately. On edit the list item carries only
  // an imageCount (not the heavy base64), so we fetch the full record before the
  // payload is allowed to include `images` — otherwise saving would wipe them.
  const [imagesReady, setImagesReady] = useState(!isEdit);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isEdit || !initial?.id) return;
    let cancelled = false;
    endpoints
      .assignment(initial.id)
      .then((res) => {
        if (!cancelled) {
          setImages(res?.assignment?.images || []);
          setImagesReady(true);
        }
      })
      .catch(() => {
        // Couldn't load existing photos — keep them untouched by not sending
        // the images field on save (imagesReady stays false).
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
        title: title.trim(),
        description: description.trim(),
        subject,
        grade: Number(grade),
        section: section || null,
        dueAt: new Date(dueAt).toISOString(),
        maxMarks: maxMarks === "" ? null : Number(maxMarks),
      };
      // Only include images when we have the authoritative set (always on create;
      // on edit, once the existing photos have loaded).
      if (imagesReady) payload.images = images;
      if (isEdit) {
        await endpoints.assignmentUpdate(initial.id, payload);
      } else {
        await endpoints.assignmentAdd(payload);
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
  const isTeacher = user?.role === "teacher";

  const inputCls =
    "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50";

  return (
    <ModalShell
      title={isEdit ? `Edit assignment — ${initial?.title}` : "New assignment"}
      onClose={onClose}
      width="lg"
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <Field label="Title *">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className={inputCls}
            placeholder="e.g. Chapter 5 — Word Problems"
          />
        </Field>
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={4000}
            className={inputCls}
            placeholder="Instructions, links, what to submit, etc."
          />
        </Field>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
          <Field label="Max marks">
            <input
              type="number"
              min={1}
              max={1000}
              value={maxMarks}
              onChange={(e) => setMaxMarks(e.target.value)}
              className={inputCls}
              placeholder="optional"
            />
          </Field>
        </div>
        <Field label="Due at *">
          <input
            type="datetime-local"
            required
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Question photos">
          {isEdit && !imagesReady ? (
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-xs text-white/55">
              <Loader size={14} className="animate-spin" /> Loading existing photos…
            </div>
          ) : (
            <ImagesEditor
              images={images}
              onChange={setImages}
              onError={onError}
              hint="Photos of the question paper / worksheet. Students and parents can view and download these."
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
            {isEdit ? "Save changes" : "Create assignment"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ============ Detail (view + submit + grade) ============

function AssignmentDetailModal({ id, user, onClose, onChanged, onError }) {
  const { data, loading, error, refetch } = useApi(
    () => endpoints.assignment(id),
    [id]
  );
  const [submitText, setSubmitText] = useState("");
  const [submitImages, setSubmitImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (data?.mySubmission) {
      setSubmitText(data.mySubmission.text || "");
      setSubmitImages(data.mySubmission.images || []);
    }
  }, [data]);

  const role = user?.role;
  const a = data?.assignment;
  const past = a ? isPast(a.dueAt) : false;
  const isOwner =
    role === "teacher" && user?.scope?.teacherId === a?.teacherId;
  const canEdit = role === "admin" || role === "principal" || isOwner;
  const canGrade =
    role === "admin" ||
    role === "principal" ||
    (role === "teacher" && a && (
      isOwner ||
      (user?.scope?.classes || []).includes(`${a.grade}-${a.section || ""}`)
    ));

  const onSubmit = async () => {
    if (submitting) return;
    if (!submitText.trim() && submitImages.length === 0) {
      onError("Write an answer or attach a photo before submitting");
      return;
    }
    setSubmitting(true);
    try {
      await endpoints.assignmentSubmit(id, {
        text: submitText.trim(),
        images: submitImages,
      });
      await refetch();
      onChanged();
    } catch (err) {
      onError(err?.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (deleting) return;
    if (!window.confirm("Delete this assignment? Submissions will also be removed.")) return;
    setDeleting(true);
    try {
      await endpoints.assignmentDelete(id);
      onChanged();
      onClose();
    } catch (err) {
      onError(err?.response?.data?.error || err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ModalShell title={a ? a.title : "Loading…"} onClose={onClose} width="lg">
      {loading || !a ? (
        <Skeleton className="h-64" />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <div className="space-y-4">
          {/* Header */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider text-white/55">
              <span className="rounded-md bg-white/5 px-2 py-0.5 ring-1 ring-white/10">{a.id}</span>
              <span className="text-brand-200">{a.subject}</span>
              <span>Grade {a.grade}{a.section ? `-${a.section}` : ""}</span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ring-1 ${
                  past
                    ? "bg-rose-500/10 text-rose-300 ring-rose-400/30"
                    : "bg-emerald-500/10 text-emerald-300 ring-emerald-400/30"
                }`}
              >
                <Clock3 size={10} /> {past ? "Closed" : "Due"} · {fmtDate(a.dueAt)}
              </span>
              {a.maxMarks ? (
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-white/55 ring-1 ring-white/10">
                  {a.maxMarks} marks
                </span>
              ) : null}
            </div>
            {a.description && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-white/85">
                {a.description}
              </p>
            )}
          </div>

          {/* Question photos — visible to everyone who can see the assignment */}
          {Array.isArray(a.images) && a.images.length > 0 && (
            <ImageGallery
              images={a.images}
              title={`${a.title} - question`}
              label="Question paper"
            />
          )}

          {/* Student submit panel */}
          {role === "student" && (
            <div className="rounded-xl border border-brand-400/30 bg-brand-500/[0.06] p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-brand-100">
                  <Send size={14} /> Your submission
                </div>
                {data.mySubmission && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] ring-1 ${STATUS_TONES[data.mySubmission.status]}`}
                  >
                    {data.mySubmission.status}
                    {data.mySubmission.marks != null
                      ? ` · ${data.mySubmission.marks}${a.maxMarks ? `/${a.maxMarks}` : ""}`
                      : ""}
                  </span>
                )}
              </div>
              <textarea
                value={submitText}
                onChange={(e) => setSubmitText(e.target.value)}
                rows={5}
                maxLength={8000}
                disabled={data.mySubmission?.status === "Graded"}
                placeholder="Write your answer / notes here…"
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50 disabled:opacity-60"
              />
              {/* Answer sheet photos — editable until graded, read-only after */}
              <div className="mt-2">
                <div className="mb-1 text-xs uppercase tracking-wider text-brand-100/80">
                  Answer sheet photos
                </div>
                {data.mySubmission?.status === "Graded" ? (
                  submitImages.length > 0 ? (
                    <ImageGallery
                      images={submitImages}
                      title={`${a.title} - my answer`}
                      label="Your answer sheet"
                      compact
                    />
                  ) : (
                    <div className="text-[11px] text-white/45">No photos attached.</div>
                  )
                ) : (
                  <ImagesEditor
                    images={submitImages}
                    onChange={setSubmitImages}
                    onError={onError}
                    hint="Photos of your solved answer sheet."
                  />
                )}
              </div>
              {data.mySubmission?.feedback && (
                <div className="mt-2 rounded-lg border border-emerald-400/30 bg-emerald-500/[0.06] p-2 text-xs text-emerald-100">
                  <div className="font-semibold">Teacher feedback</div>
                  <div className="mt-0.5 whitespace-pre-wrap text-emerald-200/90">
                    {data.mySubmission.feedback}
                  </div>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between">
                <div className="text-[11px] text-white/45">
                  {data.mySubmission
                    ? `Submitted ${fmtDate(data.mySubmission.submittedAt)}${past && data.mySubmission.status !== "Graded" ? " · resubmissions disabled" : ""}`
                    : past
                    ? "Past due — late submission will be flagged"
                    : "You can re-submit until graded"}
                </div>
                <button
                  type="button"
                  disabled={submitting || data.mySubmission?.status === "Graded"}
                  onClick={onSubmit}
                  className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
                >
                  {submitting ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
                  {data.mySubmission ? "Re-submit" : "Submit"}
                </button>
              </div>
            </div>
          )}

          {/* Parent: per-child progress panel */}
          {role === "parent" && Array.isArray(data.childSubmissions) && data.childSubmissions.length > 0 && (
            <ChildrenProgressPanel
              childSubmissions={data.childSubmissions}
              assignment={a}
            />
          )}

          {/* Teacher / admin submissions panel */}
          {data.submissions && (
            <SubmissionsPanel
              submissions={data.submissions}
              summary={data.summary}
              assignment={a}
              canGrade={canGrade}
              onChanged={() => {
                refetch();
                onChanged();
              }}
              onError={onError}
            />
          )}

          {/* Footer actions */}
          {canEdit && (
            <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-3">
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200 hover:bg-rose-500/20 disabled:opacity-50"
              >
                {deleting ? <Loader size={12} className="animate-spin" /> : <Trash2 size={12} />}
                Delete assignment
              </button>
            </div>
          )}
        </div>
      )}
    </ModalShell>
  );
}

// ============ Children's progress panel (parent) ============

function ChildrenProgressPanel({ childSubmissions, assignment }) {
  return (
    <div className="rounded-xl border border-amber-400/30 bg-amber-500/[0.05] p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-amber-100">
        <Users size={14} className="text-amber-300" />
        Your children's progress
        <span className="ml-1 text-[11px] font-normal text-amber-200/70">
          ({childSubmissions.length} {childSubmissions.length === 1 ? "child" : "children"})
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {childSubmissions.map((c) => {
          const sub = c.submission;
          const status = sub?.status || "Not yet";
          const tone = STATUS_TONES[status] || STATUS_TONES["Not yet"];
          return (
            <li
              key={c.studentId}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {c.studentAvatar && (
                  <img
                    src={c.studentAvatar}
                    alt=""
                    className="h-6 w-6 rounded-full object-cover ring-1 ring-white/10"
                  />
                )}
                <span className="font-medium text-white">{c.studentName}</span>
                <span className="text-[10px] text-white/45">
                  Grade {c.grade}{c.section ? `-${c.section}` : ""}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ring-1 ${tone}`}
                >
                  {status}
                </span>
                {sub?.marks != null && (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300 ring-1 ring-emerald-400/30">
                    {sub.marks}{assignment.maxMarks ? `/${assignment.maxMarks}` : ""}
                  </span>
                )}
                {sub?.submittedAt && (
                  <span className="text-[10px] text-white/45">
                    {fmtDate(sub.submittedAt)}
                  </span>
                )}
              </div>
              {sub ? (
                <>
                  {sub.text && (
                    <p className="mt-1.5 whitespace-pre-wrap text-xs text-white/75">
                      {sub.text}
                    </p>
                  )}
                  {Array.isArray(sub.images) && sub.images.length > 0 && (
                    <div className="mt-2">
                      <ImageGallery
                        images={sub.images}
                        title={`${assignment.title} - ${c.studentName} answer`}
                        label="Answer sheet"
                        compact
                      />
                    </div>
                  )}
                  {sub.feedback && (
                    <div className="mt-1.5 rounded-md border border-emerald-400/25 bg-emerald-500/[0.06] p-2 text-[11px] text-emerald-100">
                      <span className="font-semibold">Teacher feedback: </span>
                      <span className="text-emerald-200/90">{sub.feedback}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="mt-1.5 text-xs italic text-white/45">
                  Not submitted yet.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ============ Submissions panel (teacher/admin) ============

function SubmissionsPanel({ submissions, summary, assignment, canGrade, onChanged, onError }) {
  const [editing, setEditing] = useState(null); // submission id being graded
  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  const startGrading = (sub) => {
    setEditing(sub.id);
    setMarks(sub.marks ?? "");
    setFeedback(sub.feedback ?? "");
  };

  const saveGrade = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await endpoints.assignmentGrade(assignment.id, editing, {
        marks: marks === "" ? null : Number(marks),
        feedback,
      });
      setEditing(null);
      onChanged();
    } catch (err) {
      onError(err?.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <ClipboardList size={14} className="text-brand-200" />
          Submissions
        </div>
        {summary && (
          <div className="flex items-center gap-1.5 text-[11px] text-white/55">
            <span>{summary.submitted} submitted</span>
            <span>·</span>
            <span className="text-emerald-300">{summary.graded} graded</span>
            <span>·</span>
            <span className="text-amber-300">{summary.late} late</span>
            {summary.total != null && (
              <>
                <span>·</span>
                <span>{summary.total} students</span>
              </>
            )}
          </div>
        )}
      </div>

      {submissions.length === 0 ? (
        <p className="mt-3 text-xs text-white/50">No submissions yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {submissions.map((s) => (
            <li
              key={s.id}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono text-[10px] text-white/45">{s.studentId}</span>
                <span className="font-medium text-white">{s.studentName}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ring-1 ${STATUS_TONES[s.status]}`}
                >
                  {s.status}
                </span>
                <span className="text-[10px] text-white/45">
                  {fmtDate(s.submittedAt)}
                </span>
                {s.marks != null && (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300 ring-1 ring-emerald-400/30">
                    {s.marks}{assignment.maxMarks ? `/${assignment.maxMarks}` : ""}
                  </span>
                )}
                {canGrade && editing !== s.id && (
                  <button
                    type="button"
                    onClick={() => startGrading(s)}
                    className="ml-auto rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/80 hover:bg-white/10"
                  >
                    {s.status === "Graded" ? "Re-grade" : "Grade"}
                  </button>
                )}
              </div>
              {s.text && (
                <p className="mt-1.5 whitespace-pre-wrap text-xs text-white/75">
                  {s.text}
                </p>
              )}
              {Array.isArray(s.images) && s.images.length > 0 && (
                <div className="mt-2">
                  <ImageGallery
                    images={s.images}
                    title={`${assignment.title} - ${s.studentName} answer`}
                    label="Answer sheet"
                    compact
                  />
                </div>
              )}
              {s.feedback && editing !== s.id && (
                <div className="mt-1.5 rounded-md border border-emerald-400/25 bg-emerald-500/[0.06] p-2 text-[11px] text-emerald-100">
                  <span className="font-semibold">Feedback: </span>
                  <span className="text-emerald-200/90">{s.feedback}</span>
                </div>
              )}

              {editing === s.id && (
                <div className="mt-2 space-y-2 rounded-md border border-brand-400/30 bg-brand-500/[0.06] p-2">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] uppercase tracking-wider text-white/55">
                      Marks
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={assignment.maxMarks || 1000}
                      value={marks}
                      onChange={(e) => setMarks(e.target.value)}
                      className="w-24 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white outline-none focus:border-brand-400/50"
                    />
                    {assignment.maxMarks && (
                      <span className="text-[11px] text-white/55">/ {assignment.maxMarks}</span>
                    )}
                  </div>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={2}
                    placeholder="Feedback (optional)"
                    className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white outline-none focus:border-brand-400/50"
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/75 hover:bg-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveGrade}
                      disabled={busy}
                      className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-emerald-500 to-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                    >
                      {busy ? <Loader size={11} className="animate-spin" /> : <Check size={11} />}
                      Save grade
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============ Shared ============

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

// Editable photo picker used in the create/edit form. Resizes each picked file
// to a base64 data URL and reports the full list up via onChange.
function ImagesEditor({
  images,
  onChange,
  onError,
  hint = "JPG/PNG · auto-resized.",
}) {
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
  const base = String(title || "assignment")
    .replace(/[^\w.-]+/g, "_")
    .slice(0, 40)
    .replace(/^_+|_+$/g, "");
  return `${base || "assignment"}-photo-${i + 1}.jpg`;
}

// Read-only gallery — thumbnails open a lightbox and every photo can be
// downloaded. `label` distinguishes question papers from answer sheets;
// `compact` renders it inline (no card chrome) for nesting inside list rows.
function ImageGallery({ images, title, label = "Photos", compact = false }) {
  const [open, setOpen] = useState(null); // index | null
  if (!images?.length) return null;

  return (
    <div className={compact ? "" : "rounded-xl border border-white/10 bg-white/[0.03] p-3"}>
      <div className="flex items-center gap-2 text-xs font-medium text-white/85">
        <ImageIcon size={13} className="text-brand-200" />
        {label}
        <span className="text-[11px] font-normal text-white/45">({images.length})</span>
      </div>
      <div
        className={`mt-2 grid gap-2 ${
          compact ? "grid-cols-4 sm:grid-cols-6" : "grid-cols-3 sm:grid-cols-4"
        }`}
      >
        {images.map((src, i) => (
          <div
            key={i}
            className="group relative aspect-square overflow-hidden rounded-lg ring-1 ring-white/10"
          >
            <button type="button" onClick={() => setOpen(i)} className="h-full w-full" title="View">
              <img
                src={src}
                alt={`Photo ${i + 1}`}
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
            </button>
            <button
              type="button"
              onClick={() => downloadDataUrl(src, safeImageName(title, i))}
              title="Download"
              className="absolute bottom-1 right-1 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white opacity-0 transition hover:bg-black/80 group-hover:opacity-100"
            >
              <Download size={13} />
            </button>
          </div>
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
  const prev = () => onIndex((index - 1 + images.length) % images.length);
  const next = () => onIndex((index + 1) % images.length);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, images.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[70] flex flex-col gap-3 bg-black/90 p-4"
    >
      <div
        className="flex items-center justify-between text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0 truncate text-sm text-white/80">
          {title} · {index + 1}/{images.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadDataUrl(images[index], safeImageName(title, index))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
          >
            <Download size={13} /> Download
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {images.length > 1 && (
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Previous"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <img
          src={images[index]}
          alt={`Photo ${index + 1}`}
          className="max-h-full max-w-full rounded-lg object-contain"
        />
        {images.length > 1 && (
          <button
            type="button"
            onClick={next}
            className="absolute right-2 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Next"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
