import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarClock,
  CalendarPlus,
  Clock,
  Users2,
  UserCheck,
  Search,
  Filter,
  X,
  Plus,
  Check,
  XCircle,
  Hourglass,
  PhoneCall,
  Hand,
  MapPin,
  Sparkles as SparklesIcon,
  Timer,
  GraduationCap,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const STATUS_TONES = {
  confirmed: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  cancelled: "bg-white/5 text-white/45 ring-white/15 line-through",
  completed: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  "no-show": "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

export default function PTM() {
  const { user } = useAuth();
  const canCreateSession = ["admin", "principal"].includes(user?.role);

  const [filter, setFilter] = useState("all");
  const [creating, setCreating] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const { data, loading, error, refetch } = useApi(
    () => endpoints.ptmSessions({ status: filter }),
    [filter]
  );

  useRealtime("ptm.changed", () => refetch());

  const sessions = data?.sessions || [];
  const summary = data?.summary;
  const teachers = data?.teachers || [];

  // Auto-select the next upcoming session on first load
  useEffect(() => {
    if (!activeId && sessions.length > 0) {
      const upcoming = sessions.find((s) => s.status !== "completed");
      setActiveId(upcoming?.id || sessions[0].id);
    }
  }, [sessions, activeId]);

  const active = sessions.find((s) => s.id === activeId);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Engagement"
        title="Parent-Teacher Meetings"
        subtitle={
          summary
            ? `${summary.upcomingSessions} upcoming · ${summary.confirmedBookings} bookings confirmed · ${summary.completedSessions} sessions completed`
            : "Loading…"
        }
      />

      {error && <ErrorState error={error} onRetry={refetch} />}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          icon={CalendarClock}
          label="Upcoming sessions"
          value={summary ? summary.upcomingSessions : "—"}
          tint="from-brand-500/30"
        />
        <StatTile
          icon={UserCheck}
          label="Confirmed bookings"
          value={summary ? summary.confirmedBookings : "—"}
          tint="from-emerald-500/30"
          accent="text-emerald-300"
        />
        <StatTile
          icon={Hourglass}
          label="Next session"
          value={summary?.nextSession ? formatDate(summary.nextSession.date) : "—"}
          subValue={
            summary?.nextSession
              ? `${summary.nextSession.startTime} → ${summary.nextSession.endTime}`
              : null
          }
          tint="from-amber-500/30"
          accent="text-amber-300"
          pulse={!!summary?.nextSession}
        />
        <StatTile
          icon={Check}
          label="Completed"
          value={summary ? summary.completedBookings : "—"}
          tint="from-accent-violet/30"
        />
      </div>

      {/* Sessions list + action */}
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-white/55" />
          <Tab active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </Tab>
          <Tab
            active={filter === "upcoming"}
            onClick={() => setFilter("upcoming")}
          >
            Upcoming
          </Tab>
          <Tab
            active={filter === "completed"}
            onClick={() => setFilter("completed")}
          >
            Completed
          </Tab>
        </div>
        {canCreateSession && (
          <button
            onClick={() => setCreating(true)}
            className="btn-primary px-3 py-2 text-sm"
          >
            <CalendarPlus size={14} /> Schedule session
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="card text-center text-white/55">
          <CalendarClock className="mx-auto mb-2 text-white/30" size={20} />
          No PTM sessions match the current filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {sessions.map((s, i) => (
            <SessionCard
              key={s.id}
              session={s}
              idx={i}
              active={s.id === activeId}
              onClick={() => setActiveId(s.id)}
            />
          ))}
        </div>
      )}

      {/* Active session detail */}
      {active && (
        <SessionDetail
          session={active}
          canBook
          canManage={canCreateSession}
          onChanged={refetch}
        />
      )}

      <AnimatePresence>
        {creating && (
          <NewSessionModal
            teachers={teachers}
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

// ---------- Session card ----------

function SessionCard({ session, idx, active, onClick }) {
  const isCompleted = session.status === "completed";
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(idx * 0.05, 0.2) }}
      className={`card group relative overflow-hidden text-left transition-all ${
        active
          ? "border-brand-500/40 shadow-glow"
          : "hover:-translate-y-0.5 hover:border-brand-500/20 hover:shadow-glow"
      } ${isCompleted ? "opacity-80" : ""}`}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-brand-500/15 to-accent-violet/10 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/55">
          <CalendarClock size={11} /> {session.id}
          {isCompleted && (
            <span className="ml-1 rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] text-white/55 ring-1 ring-white/10">
              Completed
            </span>
          )}
          {!isCompleted && (
            <span className="ml-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] text-emerald-200 ring-1 ring-emerald-400/30">
              Upcoming
            </span>
          )}
        </div>
        <div className="mt-1 line-clamp-2 font-display text-base font-semibold">
          {session.name}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-white/65">
          <div className="flex items-center gap-1.5">
            <CalendarClock size={12} className="text-white/45" />
            {formatDate(session.date)}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-white/45" />
            {session.startTime}–{session.endTime}
          </div>
          <div className="flex items-center gap-1.5">
            <Timer size={12} className="text-white/45" />
            {session.slotMinutes} min slots
          </div>
          <div className="flex items-center gap-1.5">
            <Users2 size={12} className="text-white/45" />
            {session.teachers.length} teachers
          </div>
        </div>
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider">
            <span className="text-white/55">Slots filled</span>
            <span className="text-white/75">
              {session.confirmed}/{session.capacity} · {session.fillPct}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-accent-violet"
              style={{ width: `${Math.max(2, session.fillPct)}%` }}
            />
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// ---------- Session detail / slot grid ----------

function SessionDetail({ session, canBook, canManage, onChanged }) {
  const [bookingFor, setBookingFor] = useState(null);
  const [studentSearchOpen, setStudentSearchOpen] = useState(false);

  // Fetch live bookings for this session
  const { data, loading, refetch } = useApi(
    () => endpoints.ptmSession(session.id),
    [session.id]
  );
  useRealtime("ptm.changed", () => refetch());

  const bookings = data?.bookings || [];

  // Build a lookup: teacherId → { slotStart → booking }
  const bookingByTeacherSlot = useMemo(() => {
    const map = new Map();
    for (const b of bookings) {
      if (b.status === "cancelled") continue;
      if (!map.has(b.teacherId)) map.set(b.teacherId, new Map());
      map.get(b.teacherId).set(b.slotStart, b);
    }
    return map;
  }, [bookings]);

  return (
    <div className="card space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-lg font-semibold">
            {session.name}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-white/65">
            <span className="inline-flex items-center gap-1">
              <CalendarClock size={12} /> {formatDate(session.date)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={12} /> {session.startTime}–{session.endTime}
            </span>
            <span className="inline-flex items-center gap-1">
              <Timer size={12} /> {session.slotMinutes} min
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} /> {session.location}
            </span>
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] ring-1 ring-white/15">
              {session.mode}
            </span>
            <span className="inline-flex items-center gap-1 text-white/55">
              <GraduationCap size={12} /> Grades{" "}
              {session.grades.join(", ")}
            </span>
          </div>
          {session.notes && (
            <div className="mt-2 max-w-xl text-[11px] text-white/55">
              {session.notes}
            </div>
          )}
        </div>
      </div>

      {/* Slot grid */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-white/55">
            Slot grid
          </div>
          <div className="flex items-center gap-3 text-[10px] text-white/55">
            <LegendDot tone="bg-white/10" label="Free" />
            <LegendDot tone="bg-emerald-500/40" label="Booked" />
            <LegendDot tone="bg-brand-500/40" label="Yours" />
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-72" />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
            <table className="min-w-full text-xs">
              <thead className="bg-white/[0.04] text-white/55">
                <tr>
                  <th className="sticky left-0 z-10 bg-[#0f0f29] px-3 py-2 text-left font-medium">
                    Teacher
                  </th>
                  {session.slotTimes.map((t) => (
                    <th
                      key={t}
                      className="whitespace-nowrap px-2 py-2 font-mono font-normal"
                    >
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {session.teachers.map((t) => {
                  const slotMap =
                    bookingByTeacherSlot.get(t.id) || new Map();
                  return (
                    <tr
                      key={t.id}
                      className="border-t border-white/5 hover:bg-white/[0.02]"
                    >
                      <td className="sticky left-0 z-10 bg-[#0f0f29] px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-accent-violet text-[10px] font-bold">
                            {t.avatar}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {t.name}
                            </div>
                            <div className="truncate text-[10px] text-white/45">
                              {t.subject}
                            </div>
                          </div>
                        </div>
                      </td>
                      {session.slotTimes.map((slot) => {
                        const b = slotMap.get(slot);
                        const isBooked = !!b;
                        const isCompleted =
                          session.status === "completed";
                        const disabled =
                          isBooked || isCompleted || !canBook;
                        return (
                          <td key={slot} className="px-1 py-1">
                            <button
                              disabled={disabled}
                              onClick={() => {
                                if (!isBooked) {
                                  setBookingFor({
                                    teacher: t,
                                    slotStart: slot,
                                  });
                                  setStudentSearchOpen(true);
                                }
                              }}
                              className={`h-7 w-12 rounded-md text-[10px] font-medium transition-all ${
                                isBooked
                                  ? "bg-emerald-500/30 text-emerald-100 ring-1 ring-emerald-400/40"
                                  : isCompleted
                                  ? "bg-white/5 text-white/30"
                                  : "bg-white/5 text-white/55 hover:bg-brand-500/30 hover:text-brand-100 hover:ring-1 hover:ring-brand-400/40"
                              } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                              title={
                                isBooked
                                  ? `Booked by ${b.parentName} (${b.studentName})`
                                  : "Click to book this slot"
                              }
                            >
                              {isBooked ? (
                                b.studentName?.split(" ")[0]?.slice(0, 5) ||
                                "✓"
                              ) : (
                                "free"
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking list */}
      <BookingList
        bookings={bookings}
        canManage={canManage}
        onChanged={() => {
          refetch();
          onChanged?.();
        }}
      />

      <AnimatePresence>
        {studentSearchOpen && bookingFor && (
          <BookSlotModal
            session={session}
            teacher={bookingFor.teacher}
            slotStart={bookingFor.slotStart}
            onClose={() => {
              setStudentSearchOpen(false);
              setBookingFor(null);
            }}
            onBooked={() => {
              setStudentSearchOpen(false);
              setBookingFor(null);
              refetch();
              onChanged?.();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function LegendDot({ tone, label }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-block h-2.5 w-3 rounded-sm ${tone}`} />
      {label}
    </span>
  );
}

function Tab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-3 py-1.5 text-xs font-medium ring-1 transition-colors ${
        active
          ? "bg-brand-500/20 text-brand-200 ring-brand-400/30"
          : "bg-white/5 text-white/65 ring-white/10 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

// ---------- bookings list ----------

function BookingList({ bookings, canManage, onChanged }) {
  const [q, setQ] = useState("");
  const filtered = bookings.filter(
    (b) =>
      !q ||
      b.studentName.toLowerCase().includes(q.toLowerCase()) ||
      b.teacherName.toLowerCase().includes(q.toLowerCase()) ||
      b.parentName.toLowerCase().includes(q.toLowerCase()) ||
      b.slotStart.includes(q)
  );

  async function setStatus(b, status) {
    await endpoints.ptmBookingUpdate(b.id, { status });
    onChanged?.();
  }

  async function cancel(b) {
    if (!confirm(`Cancel ${b.parentName}'s slot with ${b.teacherName}?`))
      return;
    await endpoints.ptmBookingCancel(b.id);
    onChanged?.();
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-white/45">
        No bookings yet for this session — click any free slot above to book.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-white/55">
          Bookings · {bookings.length}
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1">
          <Search size={12} className="text-white/55" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter…"
            className="w-40 bg-transparent text-xs outline-none placeholder:text-white/40"
          />
        </div>
      </div>
      <div className="space-y-2">
        {filtered.map((b) => (
          <div
            key={b.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-2 text-xs"
          >
            <div className="flex w-16 items-center gap-1 font-mono text-white/65">
              <Clock size={11} /> {b.slotStart}
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-accent-violet text-[10px] font-bold">
              {b.teacherAvatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">
                <Link
                  to={`/app/students/${b.studentId}`}
                  className="hover:underline"
                >
                  {b.studentName}
                </Link>
                <span className="ml-1 text-white/45">
                  · G{b.studentGrade}-{b.studentSection}
                </span>
              </div>
              <div className="truncate text-[10px] text-white/55">
                with {b.teacherName} ({b.teacherSubject})
              </div>
            </div>
            <div className="min-w-0">
              <div className="truncate text-[11px] text-white/65">
                {b.parentName}
              </div>
              {b.parentPhone && (
                <div className="flex items-center gap-1 text-[10px] text-white/45">
                  <PhoneCall size={9} /> {b.parentPhone}
                </div>
              )}
            </div>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ring-1 ${
                STATUS_TONES[b.status] ||
                "bg-white/5 text-white/65 ring-white/15"
              }`}
            >
              {b.status}
            </span>
            {canManage && b.status === "confirmed" && (
              <div className="flex gap-1">
                <button
                  onClick={() => setStatus(b, "completed")}
                  className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] hover:bg-emerald-500/15"
                  title="Mark completed"
                >
                  <Check size={10} />
                </button>
                <button
                  onClick={() => setStatus(b, "no-show")}
                  className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] hover:bg-rose-500/15"
                  title="Mark no-show"
                >
                  <Hand size={10} />
                </button>
                <button
                  onClick={() => cancel(b)}
                  className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] hover:bg-white/10"
                  title="Cancel"
                >
                  <XCircle size={10} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Book slot modal (student picker) ----------

function BookSlotModal({ session, teacher, slotStart, onClose, onBooked }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

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
        const list = (r.items || r || []).filter((s) =>
          session.grades.includes(s.grade)
        );
        setStudents(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [debounced, session.grades]);

  async function submit(e) {
    e.preventDefault();
    if (!selectedStudent) {
      setErr("Pick a student");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      await endpoints.ptmBook(session.id, {
        teacherId: teacher.id,
        studentId: selectedStudent.id,
        slotStart,
        note: note || undefined,
      });
      onBooked();
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
        className="w-full max-w-lg rounded-3xl bg-[#0a0a1f] p-5 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="font-display text-base font-semibold">
              Book slot
            </div>
            <div className="mt-0.5 text-xs text-white/55">
              {teacher.name} ({teacher.subject}) ·{" "}
              <span className="font-mono">{slotStart}</span> on{" "}
              {formatDate(session.date)}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/55 hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Search student
            </div>
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (selectedStudent) setSelectedStudent(null);
              }}
              placeholder="Type student name or ID…"
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
                    {selectedStudent.section} · Parent:{" "}
                    {selectedStudent.parent}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudent(null);
                    setQuery("");
                  }}
                  className="rounded p-1 text-white/55 hover:bg-white/10"
                >
                  <X size={12} />
                </button>
              </div>
            ) : students.length > 0 ? (
              <div className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-white/10 bg-black/30">
                {students.slice(0, 12).map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => {
                      setSelectedStudent(s);
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

          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Note for the teacher (optional)
            </div>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Discuss math improvement plan…"
              className={`${input} resize-y`}
            />
          </label>
        </div>

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
            disabled={submitting || !selectedStudent}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            {submitting ? "Booking…" : "Book slot"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

// ---------- New session modal ----------

function NewSessionModal({ teachers, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    startTime: "09:00",
    endTime: "13:00",
    slotMinutes: 10,
    grades: [6, 7, 8, 9, 10],
    teacherIds: [],
    mode: "In-person",
    location: "Main Block",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function toggleGrade(g) {
    setForm((f) => ({
      ...f,
      grades: f.grades.includes(g)
        ? f.grades.filter((x) => x !== g)
        : [...f.grades, g].sort((a, b) => a - b),
    }));
  }
  function toggleTeacher(id) {
    setForm((f) => ({
      ...f,
      teacherIds: f.teacherIds.includes(id)
        ? f.teacherIds.filter((x) => x !== id)
        : [...f.teacherIds, id],
    }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setErr("Session name required");
      return;
    }
    if (form.teacherIds.length === 0) {
      setErr("Pick at least one teacher");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      await endpoints.ptmAddSession({
        ...form,
        slotMinutes: Number(form.slotMinutes),
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
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0a0a1f] p-5 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="font-display text-base font-semibold">
            Schedule new PTM
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/55 hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Session name
            </div>
            <input
              autoFocus
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={input}
              placeholder="e.g. Mid-Term PTM · Grades 6-10"
            />
          </label>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Date
              </div>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className={input}
              />
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Start
              </div>
              <input
                type="time"
                required
                value={form.startTime}
                onChange={(e) => set("startTime", e.target.value)}
                className={input}
              />
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                End
              </div>
              <input
                type="time"
                required
                value={form.endTime}
                onChange={(e) => set("endTime", e.target.value)}
                className={input}
              />
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Slot (min)
              </div>
              <input
                type="number"
                min="5"
                max="60"
                required
                value={form.slotMinutes}
                onChange={(e) => set("slotMinutes", e.target.value)}
                className={input}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Mode
              </div>
              <select
                value={form.mode}
                onChange={(e) => set("mode", e.target.value)}
                className={input}
              >
                <option>In-person</option>
                <option>Online</option>
                <option>Hybrid</option>
              </select>
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Location
              </div>
              <input
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                className={input}
                placeholder="Main Block · Classrooms 101-115"
              />
            </label>
          </div>

          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Grades
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGrade(g)}
                  className={`rounded-md px-2 py-1 text-xs ring-1 transition-colors ${
                    form.grades.includes(g)
                      ? "bg-brand-500/20 text-brand-200 ring-brand-400/30"
                      : "bg-white/5 text-white/60 ring-white/10 hover:bg-white/10"
                  }`}
                >
                  G{g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-white/55">
              <span>Teachers ({form.teacherIds.length} selected)</span>
              <button
                type="button"
                onClick={() =>
                  set(
                    "teacherIds",
                    form.teacherIds.length === teachers.length
                      ? []
                      : teachers.map((t) => t.id)
                  )
                }
                className="rounded px-2 py-0.5 text-[10px] hover:bg-white/10"
              >
                {form.teacherIds.length === teachers.length
                  ? "Clear all"
                  : "Select all"}
              </button>
            </div>
            <div className="grid max-h-44 grid-cols-2 gap-1 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-2 md:grid-cols-3">
              {teachers.map((t) => {
                const on = form.teacherIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTeacher(t.id)}
                    className={`flex items-center gap-2 rounded-md p-1.5 text-left text-xs transition-colors ${
                      on
                        ? "bg-brand-500/15 ring-1 ring-brand-400/30"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded text-[8px] font-bold ${
                        on
                          ? "bg-brand-500 text-white"
                          : "bg-white/10 text-white/55"
                      }`}
                    >
                      {on ? <Check size={9} /> : t.avatar}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{t.name}</div>
                      <div className="truncate text-[10px] text-white/45">
                        {t.subject}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Notes (optional)
            </div>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className={`${input} resize-y`}
              placeholder="Any instructions for parents or teachers…"
            />
          </label>
        </div>

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
            {submitting ? "Scheduling…" : "Schedule"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

// ---------- Stat tile ----------

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

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
