import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarClock,
  GraduationCap,
  Printer,
  Filter,
  Pencil,
  RotateCcw,
  X,
  Loader,
  CircleAlert,
  Check,
  Wand,
  MapPin,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const SUBJECT_TONES = {
  Mathematics: "from-brand-500/40 to-brand-400/10 ring-brand-400/30 text-brand-200",
  English: "from-accent-pink/40 to-accent-pink/10 ring-accent-pink/30 text-pink-200",
  Physics: "from-accent-cyan/40 to-accent-cyan/10 ring-accent-cyan/30 text-cyan-200",
  Chemistry: "from-emerald-500/40 to-emerald-400/10 ring-emerald-400/30 text-emerald-200",
  Biology: "from-accent-mint/40 to-accent-mint/10 ring-accent-mint/30 text-emerald-200",
  History: "from-accent-gold/40 to-accent-gold/10 ring-accent-gold/30 text-amber-200",
  Geography: "from-amber-500/40 to-amber-400/10 ring-amber-400/30 text-amber-200",
  "Computer Sci": "from-accent-violet/40 to-accent-violet/10 ring-accent-violet/30 text-purple-200",
  PE: "from-rose-500/40 to-rose-400/10 ring-rose-400/30 text-rose-200",
  Art: "from-fuchsia-500/40 to-fuchsia-400/10 ring-fuchsia-400/30 text-fuchsia-200",
};

const SUBJECTS = Object.keys(SUBJECT_TONES);

export default function Timetable() {
  const { user } = useAuth();
  const canEdit = ["admin", "principal"].includes(user?.role);

  const [grade, setGrade] = useState("8");
  const [section, setSection] = useState("A");
  const [mode, setMode] = useState("class"); // class | teacher
  const [teacherId, setTeacherId] = useState("TCH101");
  const [editingCell, setEditingCell] = useState(null);
  const [error, setError] = useState(null);

  const params = mode === "teacher" ? { teacherId } : { grade, section };
  const { data, loading, error: fetchError, refetch } = useApi(
    () => endpoints.timetable(params),
    [mode, grade, section, teacherId]
  );

  const teachers = useApi(endpoints.teachers, []);
  const conflicts = useApi(endpoints.timetableConflicts, []);
  useRealtime("timetable.changed", () => conflicts.refetch());

  const periods = data?.periods || [];
  const days = data?.days || [];

  const teacherById = useMemo(() => {
    const map = {};
    (teachers.data?.items || []).forEach((t) => (map[t.id] = t));
    return map;
  }, [teachers.data]);

  const onCellClick = (day, cell) => {
    if (!canEdit) return;
    if (mode !== "class") return; // editing only makes sense in class view
    setEditingCell({
      grade: Number(grade),
      section,
      day,
      period: cell.p,
      subject: cell.subject,
      teacherId: cell.teacherId,
      room: cell.room,
      overridden: cell.overridden,
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Academic"
        title="Timetable"
        subtitle={
          canEdit
            ? "Click any cell to override subject, teacher, or room. Reverts restore the auto-generated default."
            : "Class & teacher schedules with auto conflict detection"
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
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
            <ModeButton active={mode === "class"} onClick={() => setMode("class")}>
              <GraduationCap size={14} /> Class view
            </ModeButton>
            <ModeButton active={mode === "teacher"} onClick={() => setMode("teacher")}>
              <CalendarClock size={14} /> Teacher view
            </ModeButton>
          </div>

          {mode === "class" ? (
            <>
              <Filter size={14} className="ml-2 text-white/55" />
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
              >
                {["A", "B", "C", "D"].map((s) => (
                  <option key={s} value={s}>
                    Section {s}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="ml-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
            >
              {(teachers.data?.items || []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.subject}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          <SubjectLegend />
          {canEdit && mode === "class" && (
            <button
              type="button"
              onClick={async () => {
                if (!confirm(`Reset all custom slots for Grade ${grade}-${section}?`)) return;
                try {
                  const r = await endpoints.timetableClearClass(Number(grade), section);
                  refetch();
                  if (r.removed > 0)
                    setError(`Reverted ${r.removed} custom cell${r.removed === 1 ? "" : "s"}.`);
                } catch (e) {
                  setError(e?.response?.data?.error || e.message);
                }
              }}
              className="btn-ghost px-3 py-2 text-sm"
            >
              <RotateCcw size={14} /> Reset class
            </button>
          )}
          <button className="btn-ghost px-3 py-2 text-sm">
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {fetchError && <ErrorState error={fetchError} onRetry={refetch} />}

      <ConflictsBanner items={conflicts.data?.items || []} loading={conflicts.loading} />

      {loading ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-left text-[11px] uppercase tracking-wider text-white/55">
              <tr>
                <th className="sticky left-0 z-10 bg-[#0c0c22]/95 px-4 py-3">Day</th>
                {periods.map((slot) => (
                  <th key={slot.p} className="px-3 py-3 text-center">
                    Period {slot.p}
                    <div className="text-[10px] font-normal text-white/45">
                      {slot.start}–{slot.end}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((d, i) => (
                <motion.tr
                  key={d.day}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-t border-white/5"
                >
                  <td className="sticky left-0 z-10 bg-[#0c0c22]/95 px-4 py-3 font-display font-semibold">
                    {d.day}
                  </td>
                  {periods.map((slot) => {
                    const cell = d.periods.find((p) => p.p === slot.p);
                    return (
                      <td key={slot.p} className="p-1.5">
                        <SlotCell
                          cell={cell}
                          mode={mode}
                          teacher={cell && teacherById[cell.teacherId]}
                          editable={canEdit && mode === "class"}
                          onClick={() => onCellClick(d.day, cell)}
                        />
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {editingCell && (
          <CellEditDrawer
            cell={editingCell}
            teachers={teachers.data?.items || []}
            onClose={() => setEditingCell(null)}
            onChanged={() => {
              refetch();
              conflicts.refetch();
            }}
            onError={setError}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ModeButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? "bg-gradient-to-r from-brand-500/40 to-accent-violet/30 text-white ring-1 ring-white/20"
          : "text-white/65 hover:bg-white/5 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function SlotCell({ cell, mode, teacher, editable, onClick }) {
  if (!cell || cell.free) {
    return (
      <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02] text-[11px] text-white/40">
        Free
      </div>
    );
  }
  const tone =
    SUBJECT_TONES[cell.subject] || "from-white/10 to-transparent ring-white/15 text-white/80";
  const ringExtra = cell.overridden ? "ring-2 ring-amber-400/60" : "ring-1";
  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`group relative h-20 overflow-hidden rounded-lg bg-gradient-to-br ${tone} p-2 ${ringExtra} ${
        editable ? "cursor-pointer" : ""
      }`}
    >
      <div className="font-display text-sm font-semibold leading-tight">
        {cell.subject}
      </div>
      <div className="mt-0.5 text-[10px] opacity-80">
        {mode === "teacher"
          ? `Grade ${cell.grade}-${cell.section}`
          : teacher?.name || cell.teacherId}
      </div>
      <div className="absolute bottom-1.5 right-2 text-[10px] opacity-70">
        {cell.room}
      </div>
      {cell.overridden && (
        <div
          className="absolute left-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-amber-400/30 text-amber-100"
          title="Customised"
        >
          <Wand size={9} />
        </div>
      )}
      {editable && (
        <div className="absolute right-1 top-1 rounded-full bg-black/40 p-1 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
          <Pencil size={10} className="text-white/90" />
        </div>
      )}
    </motion.div>
  );
}

function SubjectLegend() {
  const subjects = ["Mathematics", "Physics", "Chemistry", "English", "Art"];
  return (
    <div className="hidden items-center gap-2 lg:flex">
      {subjects.map((s) => (
        <span
          key={s}
          className={`inline-flex items-center gap-1 rounded-md bg-gradient-to-br ${SUBJECT_TONES[s]} px-1.5 py-0.5 text-[10px] ring-1`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
          {s}
        </span>
      ))}
    </div>
  );
}

function CellEditDrawer({ cell, teachers, onClose, onChanged, onError }) {
  const [subject, setSubject] = useState(cell.subject);
  const [teacherId, setTeacherId] = useState(cell.teacherId);
  const [room, setRoom] = useState(cell.room);
  const [saving, setSaving] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [conflicts, setConflicts] = useState(null);

  const inputCls =
    "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50";

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setConflicts(null);
    try {
      const res = await endpoints.timetableSetCell({
        grade: cell.grade,
        section: cell.section,
        day: cell.day,
        period: cell.period,
        subject,
        teacherId,
        room,
      });
      onChanged();
      // The slot is saved either way; if it double-books a teacher or room,
      // keep the drawer open and surface the clash so the user can adjust.
      if (res?.hasConflict) {
        setConflicts(res.conflicts);
      } else {
        onClose();
      }
    } catch (err) {
      onError(err?.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const onRevert = async () => {
    setReverting(true);
    try {
      await endpoints.timetableClearCell({
        grade: cell.grade,
        section: cell.section,
        day: cell.day,
        period: cell.period,
      });
      onChanged();
      onClose();
    } catch (err) {
      onError(err?.response?.data?.error || err.message);
    } finally {
      setReverting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        exit={{ x: 400 }}
        transition={{ type: "spring", damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#0d0f24] p-6 shadow-2xl"
      >
        <form onSubmit={onSave}>
          <div className="flex items-start justify-between">
            <div>
              <div className="chip">
                <Pencil size={13} className="text-brand-300" />
                Edit slot
              </div>
              <h2 className="mt-2 font-display text-xl font-semibold">
                Grade {cell.grade}-{cell.section} · {cell.day} · Period {cell.period}
              </h2>
              {cell.overridden && (
                <div className="mt-1 flex items-center gap-1 text-xs text-amber-200">
                  <Wand size={11} />
                  Currently customised — revert restores the default.
                </div>
              )}
            </div>
            <button type="button" onClick={onClose} className="text-white/55 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="mt-5 space-y-3">
            <Field label="Subject">
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls}>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s} className="bg-black">
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Teacher">
              <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className={inputCls}>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id} className="bg-black">
                    {t.name} · {t.subject}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Room">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-white/55" />
                <input
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. R-208"
                />
              </div>
            </Field>
          </div>

          {conflicts && (
            <div className="mt-4 rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-xs text-rose-100">
              <div className="mb-1 flex items-center gap-1.5 font-semibold text-rose-200">
                <CircleAlert size={13} /> Saved — but this slot now double-books:
              </div>
              {conflicts.teacherClashes?.length > 0 && (
                <div className="mt-1">
                  <span className="text-rose-300/80">Teacher</span> {teacherId} also teaches{" "}
                  {conflicts.teacherClashes
                    .map((c) => `${c.grade}-${c.section} (${c.subject})`)
                    .join(", ")}
                </div>
              )}
              {conflicts.roomClashes?.length > 0 && (
                <div className="mt-1">
                  <span className="text-rose-300/80">Room</span> {room} also used by{" "}
                  {conflicts.roomClashes
                    .map((c) => `${c.grade}-${c.section} (${c.subject})`)
                    .join(", ")}
                </div>
              )}
              <div className="mt-1.5 text-rose-200/70">
                Pick a different teacher or room above and save again to resolve.
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-2">
            {cell.overridden && (
              <button
                type="button"
                onClick={onRevert}
                disabled={reverting || saving}
                className="flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2.5 text-xs font-medium text-amber-200 hover:bg-amber-500/20 disabled:opacity-50"
              >
                {reverting ? <Loader size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                Revert to default
              </button>
            )}
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
              {saving ? <Loader size={14} className="animate-spin" /> : <Check size={14} />}
              Save
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-white/55">
        {label}
      </span>
      {children}
    </label>
  );
}

function ConflictsBanner({ items, loading }) {
  const [open, setOpen] = useState(false);
  if (loading || !items || items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm text-amber-100">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 text-left"
      >
        <CircleAlert size={16} className="shrink-0 text-amber-300" />
        <span className="font-semibold">
          {items.length} timetable conflict{items.length === 1 ? "" : "s"} detected
        </span>
        <span className="ml-auto text-xs text-amber-200/70">
          {open ? "Hide" : "Show details"}
        </span>
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          {items.map((c) => (
            <div
              key={`${c.grade}-${c.section}-${c.day}-${c.period}`}
              className="rounded-lg border border-amber-400/20 bg-black/20 p-2.5 text-xs"
            >
              <div className="font-medium text-amber-100">
                {c.grade}-{c.section} · {c.day} · Period {c.period} · {c.subject}
              </div>
              {c.teacherClashes.length > 0 && (
                <div className="mt-1 text-amber-200/80">
                  Teacher {c.teacherId} clashes with{" "}
                  {c.teacherClashes.map((t) => `${t.grade}-${t.section}`).join(", ")}
                </div>
              )}
              {c.roomClashes.length > 0 && (
                <div className="mt-0.5 text-amber-200/80">
                  Room {c.room} clashes with{" "}
                  {c.roomClashes.map((t) => `${t.grade}-${t.section}`).join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
