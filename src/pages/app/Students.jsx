import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Filter,
  Download,
  Phone,
  Sparkles as SparklesIcon,
  Pencil,
  Trash2,
  X,
  Loader,
  CircleAlert,
  MoreVertical,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import Avatar from "../../components/Avatar.jsx";
import PhotoUploader from "../../components/PhotoUploader.jsx";

const FEE_TONES = {
  Paid: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Pending: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  Partial: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
};

const SECTIONS = ["A", "B", "C", "D"];
const HOUSES = ["Crimson", "Azure", "Emerald", "Amber"];
const FEE_STATUSES = ["Paid", "Pending", "Partial"];

export default function Students() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = ["admin", "principal"].includes(user?.role);

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [grade, setGrade] = useState("all");
  const [editing, setEditing] = useState(null); // null | "new" | student object
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const { data, loading, error: fetchError, refetch } = useApi(
    () => endpoints.students({ q: debouncedQ, grade }),
    [debouncedQ, grade]
  );

  // Pin the student's own record to the top of their batch so they can find
  // themselves immediately. The seed student account's name doesn't always
  // match the linked Student record so a "You" tag is the clearest signal.
  const myStudentId = user?.scope?.studentId || null;
  const items = (() => {
    const raw = data?.items || [];
    if (!myStudentId) return raw;
    const mine = raw.find((s) => s.id === myStudentId);
    if (!mine) return raw;
    return [mine, ...raw.filter((s) => s.id !== myStudentId)];
  })();

  const onExport = () => {
    const rows = items.map((s) =>
      [s.id, s.name, s.grade, s.section, s.house, s.attendance, s.feeStatus, s.gpa, s.parent, s.contact].join(",")
    );
    const csv = ["ID,Name,Grade,Section,House,Attendance,FeeStatus,GPA,Parent,Contact", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Academic"
        title="Students"
        subtitle={
          data ? `${data.total} learners match your search` : "Loading…"
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
            placeholder="Search by name or ID…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </div>
        <div className="flex items-center gap-2">
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
          <button onClick={onExport} className="btn-ghost px-3 py-2 text-sm">
            <Download size={14} /> Export
          </button>
          {canEdit && (
            <button
              onClick={() => setEditing("new")}
              className="btn-primary px-3 py-2 text-sm"
            >
              <Plus size={14} /> Add student
            </button>
          )}
        </div>
      </div>

      {fetchError && <ErrorState error={fetchError} onRetry={refetch} />}

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-white/55">
            No students match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03] text-left text-[11px] uppercase tracking-wider text-white/55">
                <tr>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Grade</th>
                  <th className="px-5 py-3">House</th>
                  <th className="px-5 py-3">Attendance</th>
                  <th className="px-5 py-3">GPA</th>
                  <th className="px-5 py-3">Fees</th>
                  <th className="px-5 py-3">Parent</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.slice(0, 60).map((s, i) => {
                  const isSelf = s.id === myStudentId;
                  return (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.012 }}
                    onClick={() => navigate(`/app/students/${s.id}`)}
                    className={`group cursor-pointer border-t border-white/5 transition-colors hover:bg-white/[0.04] ${
                      isSelf ? "bg-emerald-500/[0.06] hover:bg-emerald-500/[0.10]" : ""
                    }`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          photoUrl={s.photoUrl}
                          initials={s.avatar}
                          size={36}
                          fallbackClass={isSelf ? "from-emerald-500 to-teal-500" : "from-brand-500 to-accent-pink"}
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium">{s.name}</span>
                            {isSelf && (
                              <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-200 ring-1 ring-emerald-400/40">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-white/50">
                            Section {s.section}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-white/70">{s.id}</td>
                    <td className="px-5 py-3">{s.grade}</td>
                    <td className="px-5 py-3">
                      <HouseChip name={s.house} />
                    </td>
                    <td className="px-5 py-3">
                      <AttendanceBar pct={s.attendance} />
                    </td>
                    <td className="px-5 py-3 font-display">{s.gpa}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${
                          FEE_TONES[s.feeStatus]
                        }`}
                      >
                        {s.feeStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 text-white/70">
                        <Phone size={12} /> {s.parent}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/app/students/${s.id}`}
                          className="inline-block rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                        >
                          View
                        </Link>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => setEditing(s)}
                              title="Edit"
                              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => setDeleting(s)}
                              title="Delete"
                              className="rounded-lg border border-rose-400/20 bg-rose-500/10 p-1.5 text-rose-300 hover:bg-rose-500/20"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {editing && (
          <StudentFormModal
            student={editing === "new" ? null : editing}
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
            student={deleting}
            onCancel={() => setDeleting(null)}
            onConfirm={async () => {
              try {
                await endpoints.studentDelete(deleting.id);
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

function StudentFormModal({ student, onClose, onSaved, onError }) {
  const isNew = !student;
  const [form, setForm] = useState({
    name: student?.name || "",
    grade: student?.grade || 1,
    section: student?.section || "A",
    house: student?.house || "Azure",
    attendance: student?.attendance ?? 100,
    feeStatus: student?.feeStatus || "Pending",
    parent: student?.parent || "",
    contact: student?.contact || "",
    gpa: student?.gpa || "3.50",
    photoUrl: student?.photoUrl || null,
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
      if (isNew) await endpoints.studentAdd(form);
      else await endpoints.studentUpdate(student.id, form);
      onSaved();
    } catch (err) {
      onError(err?.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <form onSubmit={onSubmit}>
        <div className="flex items-center justify-between">
          <div>
            <div className="chip">
              <SparklesIcon size={14} className="text-accent-gold" />
              {isNew ? "New student" : `Edit ${student.id}`}
            </div>
            <h2 className="mt-2 font-display text-xl font-semibold">
              {isNew ? "Enrol a new student" : student.name}
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
            fallbackClass="from-brand-500 to-accent-pink"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" className="col-span-2">
            <input required value={form.name} onChange={set("name")} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50" />
          </Field>
          <Field label="Grade">
            <select value={form.grade} onChange={set("grade")} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                <option key={g} value={g} className="bg-black">
                  Grade {g}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Section">
            <select value={form.section} onChange={set("section")} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50">
              {SECTIONS.map((s) => (
                <option key={s} value={s} className="bg-black">
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="House">
            <select value={form.house} onChange={set("house")} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50">
              {HOUSES.map((h) => (
                <option key={h} value={h} className="bg-black">
                  {h}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fee status">
            <select value={form.feeStatus} onChange={set("feeStatus")} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50">
              {FEE_STATUSES.map((s) => (
                <option key={s} value={s} className="bg-black">
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Attendance %">
            <input
              type="number"
              min={0}
              max={100}
              value={form.attendance}
              onChange={set("attendance")}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50"
            />
          </Field>
          <Field label="GPA">
            <input
              type="number"
              step="0.01"
              min={0}
              max={5}
              value={form.gpa}
              onChange={set("gpa")}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50"
            />
          </Field>
          <Field label="Parent name" className="col-span-2">
            <input value={form.parent} onChange={set("parent")} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50" />
          </Field>
          <Field label="Contact" className="col-span-2">
            <input value={form.contact} onChange={set("contact")} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50" placeholder="+91 9XXXXXXXXX" />
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
            {isNew ? "Create" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteConfirmModal({ student, onCancel, onConfirm }) {
  const [working, setWorking] = useState(false);
  return (
    <Modal onClose={onCancel}>
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-500/20 text-rose-300">
          <Trash2 size={18} />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold">Delete student?</h2>
          <p className="text-sm text-white/55">{student.name} · {student.id}</p>
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-xs text-rose-100">
        This removes the active record. Linked alumni records (if any) stay
        intact.
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

function HouseChip({ name }) {
  const map = {
    Crimson: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
    Azure: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
    Emerald: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
    Amber: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${
        map[name] || "bg-white/10 text-white/70"
      }`}
    >
      {name}
    </span>
  );
}

function AttendanceBar({ pct }) {
  const color =
    pct >= 90
      ? "from-emerald-400 to-emerald-500"
      : pct >= 80
      ? "from-brand-400 to-accent-violet"
      : "from-rose-400 to-accent-pink";
  return (
    <div className="flex w-32 items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8 }}
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
        />
      </div>
      <span className="w-10 text-right text-xs text-white/70">{pct}%</span>
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <div className="chip mb-2">
          <SparklesIcon size={14} className="text-accent-gold" />
          {eyebrow}
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-white/65">{subtitle}</p>}
      </div>
    </div>
  );
}
