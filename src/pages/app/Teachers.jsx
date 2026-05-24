import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Mail,
  Star,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader,
  CircleAlert,
  Sparkles as SparklesIcon,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import Avatar from "../../components/Avatar.jsx";
import PhotoUploader from "../../components/PhotoUploader.jsx";
import { PageHeader } from "./Students.jsx";

const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "English",
  "History", "Geography", "Computer Sci", "PE", "Art",
];
const STATUSES = ["Active", "On leave"];

export default function Teachers() {
  const { user } = useAuth();
  const canEdit = ["admin", "principal", "hr"].includes(user?.role);

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const { data, loading, error: fetchError, refetch } = useApi(
    () => endpoints.teachers({ q: debouncedQ }),
    [debouncedQ]
  );
  const items = data?.items || [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="People"
        title="Teachers"
        subtitle={
          data
            ? `${data.total} faculty members across all departments`
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

      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={16} className="text-white/60" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, ID, subject or email…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </div>
        {canEdit && (
          <button
            onClick={() => setEditing("new")}
            className="btn-primary px-4 py-2 text-sm"
          >
            <Plus size={14} /> Onboard teacher
          </button>
        )}
      </div>

      {fetchError && <ErrorState error={fetchError} onRetry={refetch} />}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -6 }}
              className="relative"
            >
              <Link
                to={`/app/teachers/${t.id}`}
                className="card group relative block overflow-hidden"
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-brand-500/30 to-accent-pink/30 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="flex items-start justify-between">
                    <Avatar
                      photoUrl={t.photoUrl}
                      initials={t.avatar}
                      size={56}
                      fallbackClass="from-brand-500 via-accent-violet to-accent-pink"
                      ringClass="shadow-glow"
                    />
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${
                        t.status === "Active"
                          ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
                          : "bg-amber-500/15 text-amber-300 ring-amber-400/30"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <div className="mt-4 font-display text-lg font-semibold">
                    {t.name}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <span className="font-mono text-white/45">{t.id}</span>
                    <span>·</span>
                    <span>{t.subject}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-white/50">Classes</div>
                      <div className="font-display text-base font-semibold">
                        {t.classes}
                      </div>
                    </div>
                    <div>
                      <div className="text-white/50">Exp.</div>
                      <div className="font-display text-base font-semibold">
                        {t.experience}y
                      </div>
                    </div>
                    <div>
                      <div className="text-white/50">Rating</div>
                      <div className="flex items-center gap-1 font-display text-base font-semibold">
                        <Star
                          size={12}
                          className="text-accent-gold"
                          fill="currentColor"
                        />
                        {t.rating}
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `mailto:${t.email}`;
                    }}
                    className="mt-4 flex cursor-pointer items-center gap-2 truncate rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10"
                  >
                    <Mail size={12} /> {t.email}
                  </div>
                </div>
              </Link>
              {canEdit && (
                <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditing(t);
                    }}
                    title="Edit"
                    className="rounded-lg border border-white/10 bg-black/40 p-1.5 text-white/80 backdrop-blur hover:bg-black/60"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleting(t);
                    }}
                    title="Delete"
                    className="rounded-lg border border-rose-400/30 bg-rose-500/30 p-1.5 text-white backdrop-blur hover:bg-rose-500/50"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <TeacherFormModal
            teacher={editing === "new" ? null : editing}
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
            teacher={deleting}
            onCancel={() => setDeleting(null)}
            onConfirm={async () => {
              try {
                await endpoints.teacherDelete(deleting.id);
                setDeleting(null);
                refetch();
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

function TeacherFormModal({ teacher, onClose, onSaved, onError }) {
  const isNew = !teacher;
  const [form, setForm] = useState({
    name: teacher?.name || "",
    subject: teacher?.subject || "Mathematics",
    classes: teacher?.classes ?? 4,
    experience: teacher?.experience ?? 1,
    rating: teacher?.rating || "4.0",
    email: teacher?.email || "",
    status: teacher?.status || "Active",
    photoUrl: teacher?.photoUrl || null,
  });
  const initials = (form.name || "?")
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) await endpoints.teacherAdd(form);
      else await endpoints.teacherUpdate(teacher.id, form);
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
    <Modal onClose={onClose}>
      <form onSubmit={onSubmit}>
        <div className="flex items-center justify-between">
          <div>
            <div className="chip">
              <SparklesIcon size={14} className="text-accent-gold" />
              {isNew ? "Onboard faculty" : `Edit ${teacher.id}`}
            </div>
            <h2 className="mt-2 font-display text-xl font-semibold">
              {isNew ? "New teacher" : teacher.name}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-white/55 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <PhotoUploader
            photoUrl={form.photoUrl}
            initials={initials}
            onChange={(v) => setForm((f) => ({ ...f, photoUrl: v }))}
            fallbackClass="from-brand-500 via-accent-violet to-accent-pink"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" className="col-span-2">
            <input required value={form.name} onChange={set("name")} className={inputCls} />
          </Field>
          <Field label="Subject">
            <select value={form.subject} onChange={set("subject")} className={inputCls}>
              {SUBJECTS.map((s) => (
                <option key={s} value={s} className="bg-black">
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={set("status")} className={inputCls}>
              {STATUSES.map((s) => (
                <option key={s} value={s} className="bg-black">
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Classes / week">
            <input
              type="number"
              min={0}
              max={40}
              value={form.classes}
              onChange={set("classes")}
              className={inputCls}
            />
          </Field>
          <Field label="Experience (years)">
            <input
              type="number"
              min={0}
              max={60}
              value={form.experience}
              onChange={set("experience")}
              className={inputCls}
            />
          </Field>
          <Field label="Rating (0–5)" className="col-span-2">
            <input
              type="number"
              step="0.1"
              min={0}
              max={5}
              value={form.rating}
              onChange={set("rating")}
              className={inputCls}
            />
          </Field>
          <Field label="Email" className="col-span-2">
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              className={inputCls}
              placeholder="auto-generated if blank"
            />
          </Field>
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
            {isNew ? "Onboard" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteConfirmModal({ teacher, onCancel, onConfirm }) {
  const [working, setWorking] = useState(false);
  return (
    <Modal onClose={onCancel}>
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-500/20 text-rose-300">
          <Trash2 size={18} />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold">Remove teacher?</h2>
          <p className="text-sm text-white/55">{teacher.name} · {teacher.id}</p>
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-xs text-rose-100">
        Their timetable slots stay deterministic — re-assign affected periods
        from the Timetable module after this.
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
          Remove
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

function Modal({ children, onClose }) {
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
        className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0d0f24] p-6 shadow-2xl"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
