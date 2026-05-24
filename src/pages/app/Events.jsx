import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  Clock,
  Users,
  X,
  Trash2,
  Sparkles as SparklesIcon,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const CATEGORY_TONES = {
  Academic: "bg-brand-500/20 text-brand-200 ring-brand-400/30",
  Sports: "bg-accent-pink/20 text-pink-200 ring-accent-pink/30",
  Cultural: "bg-accent-violet/20 text-purple-200 ring-accent-violet/30",
  Holiday: "bg-emerald-500/20 text-emerald-200 ring-emerald-400/30",
  Meeting: "bg-accent-gold/20 text-amber-200 ring-accent-gold/30",
  Exam: "bg-orange-500/20 text-orange-200 ring-orange-400/30",
};

function pad(n) {
  return String(n).padStart(2, "0");
}
function monthKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export default function Events() {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [category, setCategory] = useState("all");
  const [creating, setCreating] = useState(false);
  const [picked, setPicked] = useState(null);

  const params = useMemo(
    () => ({ month: monthKey(cursor), category }),
    [cursor, category]
  );
  const { data, loading, error, refetch } = useApi(
    () => endpoints.events(params),
    [params.month, params.category]
  );

  const eventsByDate = useMemo(() => {
    const map = {};
    (data?.items || []).forEach((ev) => {
      (map[ev.date] = map[ev.date] || []).push(ev);
    });
    return map;
  }, [data]);

  const grid = useMemo(() => buildCalendarGrid(cursor), [cursor]);

  const monthLabel = cursor.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  const upcoming = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return (data?.items || [])
      .filter((e) => new Date(e.date) >= now)
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .slice(0, 5);
  }, [data]);

  const onDelete = async (id) => {
    await endpoints.eventDelete(id);
    setPicked(null);
    refetch();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Calendar"
        title="Events"
        subtitle="Plan, publish, and track everything on the school calendar"
      />

      {error && <ErrorState error={error} onRetry={refetch} />}

      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCursor(addMonths(cursor, -1))}
            className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="font-display text-lg font-semibold min-w-[180px] text-center">
            {monthLabel}
          </div>
          <button
            onClick={() => setCursor(addMonths(cursor, 1))}
            className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => {
              const d = new Date();
              d.setDate(1);
              setCursor(d);
            }}
            className="ml-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">All categories</option>
            {(data?.categories || []).map((c) => (
              <option key={c.key} value={c.key}>
                {c.key}
              </option>
            ))}
          </select>
          <button
            onClick={() => setCreating(true)}
            className="btn-primary px-3 py-2 text-sm"
          >
            <Plus size={14} /> New event
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        {/* Calendar */}
        <div className="glass-card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-white/10 bg-white/[0.03] text-[10px] uppercase tracking-wider text-white/55">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="px-3 py-2 text-center">
                {d}
              </div>
            ))}
          </div>
          {loading ? (
            <div className="p-4">
              <Skeleton className="h-[460px]" />
            </div>
          ) : (
            <div className="grid grid-cols-7 grid-rows-6">
              {grid.map((cell, i) => (
                <DayCell
                  key={i}
                  cell={cell}
                  events={eventsByDate[cell.iso] || []}
                  onPick={setPicked}
                />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming */}
        <div className="space-y-3">
          <div className="card">
            <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/55">
              <SparklesIcon size={12} className="text-accent-gold" />
              Upcoming
            </div>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="mb-2 h-14" />
              ))
            ) : upcoming.length === 0 ? (
              <div className="text-sm text-white/55">Nothing upcoming.</div>
            ) : (
              <div className="space-y-2">
                {upcoming.map((e) => (
                  <UpcomingCard key={e.id} ev={e} onClick={() => setPicked(e)} />
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="mb-2 text-[11px] uppercase tracking-wider text-white/55">
              Legend
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              {(data?.categories || []).map((c) => (
                <div key={c.key} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: c.color }}
                  />
                  <span className="text-white/70">{c.key}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {picked && (
          <EventModal ev={picked} onClose={() => setPicked(null)} onDelete={onDelete} />
        )}
        {creating && (
          <NewEventModal
            categories={data?.categories || []}
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

function DayCell({ cell, events, onPick }) {
  const isToday =
    cell.iso === new Date().toISOString().slice(0, 10) && cell.inMonth;
  return (
    <div
      className={`relative min-h-[88px] border-b border-r border-white/5 p-1.5 ${
        cell.inMonth ? "" : "bg-black/30"
      }`}
    >
      <div
        className={`flex items-center justify-between text-[11px] ${
          cell.inMonth ? "text-white/70" : "text-white/25"
        }`}
      >
        <span
          className={
            isToday
              ? "inline-flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-accent-pink text-[10px] font-bold text-white"
              : ""
          }
        >
          {cell.day}
        </span>
        {events.length > 2 && (
          <span className="rounded bg-white/10 px-1 py-0.5 text-[9px] text-white/55">
            +{events.length - 2}
          </span>
        )}
      </div>
      <div className="mt-1 space-y-1">
        {events.slice(0, 2).map((ev) => (
          <motion.button
            key={ev.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ x: 1 }}
            onClick={() => onPick(ev)}
            className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] font-medium ring-1 ${
              CATEGORY_TONES[ev.category] || "bg-white/10 ring-white/15"
            }`}
            title={ev.title}
          >
            <span
              className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle"
              style={{ background: ev.color }}
            />
            {ev.startTime !== "00:00" && (
              <span className="opacity-70">{ev.startTime} </span>
            )}
            {ev.title}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function UpcomingCard({ ev, onClick }) {
  const d = new Date(ev.date);
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 2 }}
      className="flex w-full items-start gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3 text-left hover:bg-white/[0.06]"
    >
      <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-gradient-to-br from-brand-500/30 to-accent-pink/30 ring-1 ring-white/10">
        <div className="text-[10px] uppercase text-white/55">
          {d.toLocaleString(undefined, { month: "short" })}
        </div>
        <div className="font-display text-lg font-bold leading-none">
          {d.getDate()}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ${
              CATEGORY_TONES[ev.category] || ""
            }`}
          >
            {ev.category}
          </span>
        </div>
        <div className="mt-0.5 truncate text-sm font-semibold">{ev.title}</div>
        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-white/55">
          <Clock size={10} /> {ev.startTime}–{ev.endTime}
        </div>
      </div>
    </motion.button>
  );
}

function EventModal({ ev, onClose, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a0a1e] via-[#0d0d2a] to-[#101044] p-6 shadow-glow"
      >
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl opacity-50"
          style={{ background: ev.color }}
        />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>
        <div className="relative">
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${
              CATEGORY_TONES[ev.category]
            }`}
          >
            {ev.category}
          </span>
          <div className="mt-2 font-display text-2xl font-bold leading-tight">
            {ev.title}
          </div>
          <div className="mt-1 text-xs text-white/55">{ev.id}</div>

          <div className="mt-5 space-y-2 text-sm">
            <Row icon={CalendarDays} label="Date" value={new Date(ev.date).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })} />
            <Row icon={Clock} label="Time" value={`${ev.startTime} – ${ev.endTime}`} />
            <Row icon={MapPin} label="Location" value={ev.location} />
            <Row icon={Users} label="Attendees" value={`${ev.attendees}`} />
          </div>

          {ev.notes && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm">
              <div className="text-[10px] uppercase tracking-wider text-white/55">
                Notes
              </div>
              <div className="text-white/80">{ev.notes}</div>
            </div>
          )}

          <div className="mt-4 text-xs text-white/55">
            Organized by{" "}
            <span className="font-semibold text-white/85">{ev.organizer}</span>
          </div>

          <div className="mt-5 flex gap-2">
            <button onClick={onClose} className="btn-ghost text-sm">
              Close
            </button>
            <button
              onClick={() => onDelete(ev.id)}
              className="ml-auto inline-flex items-center gap-1 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/15"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function NewEventModal({ categories, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    category: categories[0]?.key || "Academic",
    date: new Date().toISOString().slice(0, 10),
    startTime: "10:00",
    endTime: "11:00",
    location: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await endpoints.eventAdd(form);
      onCreated();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur"
      onClick={onClose}
    >
      <motion.form
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="glass-card relative w-full max-w-lg p-6"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X size={16} />
        </button>
        <div className="mb-1 text-xs uppercase tracking-[0.2em] text-white/55">
          New event
        </div>
        <div className="font-display text-xl font-bold">Schedule</div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Field label="Title" full>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
              required
            />
          </Field>
          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
            >
              {categories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.key}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
              required
            />
          </Field>
          <Field label="Start">
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => set("startTime", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
            />
          </Field>
          <Field label="End">
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => set("endTime", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
            />
          </Field>
          <Field label="Location" full>
            <input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
            />
          </Field>
          <Field label="Notes" full>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
            />
          </Field>
        </div>

        {err && (
          <div className="mt-3 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
            {err}
          </div>
        )}

        <button disabled={busy} className="btn-primary mt-5 w-full">
          {busy ? "Creating…" : "Create event"}
        </button>
      </motion.form>
    </motion.div>
  );
}

function Field({ label, full, children }) {
  return (
    <label className={full ? "col-span-2 block" : "block"}>
      <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">
        {label}
      </div>
      {children}
    </label>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.03] p-2.5">
      <Icon size={14} className="text-white/55" />
      <div className="flex-1">
        <div className="text-[10px] uppercase tracking-wider text-white/45">
          {label}
        </div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}

function buildCalendarGrid(monthStart) {
  // Sun-first 6×7 grid. Each cell: { day, iso, inMonth }
  const first = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
  const startWeekday = first.getDay(); // 0 = Sun
  const out = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(first);
    d.setDate(1 - startWeekday + i);
    out.push({
      day: d.getDate(),
      iso: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      inMonth: d.getMonth() === monthStart.getMonth(),
    });
  }
  return out;
}

function addMonths(d, n) {
  const out = new Date(d);
  out.setMonth(out.getMonth() + n);
  return out;
}
