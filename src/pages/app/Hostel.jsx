import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  BedDouble,
  UserPlus,
  UserMinus,
  Filter,
  X,
  Sparkles as SparklesIcon,
  Home,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const STATUS_TONES = {
  Vacant: "from-white/10 to-white/5 ring-white/15 text-white/60",
  Available: "from-emerald-500/30 to-emerald-400/10 ring-emerald-400/30 text-emerald-200",
  Full: "from-accent-pink/30 to-accent-violet/10 ring-accent-pink/30 text-pink-200",
};

const BLOCK_TONES = {
  A: "from-brand-500 to-accent-cyan",
  B: "from-accent-violet to-brand-500",
  C: "from-accent-pink to-accent-violet",
  D: "from-accent-gold to-accent-pink",
};

export default function Hostel() {
  const summary = useApi(endpoints.hostelSummary, []);
  const [block, setBlock] = useState("A");
  const [status, setStatus] = useState("all");
  const rooms = useApi(
    () => endpoints.hostelRooms({ block, status }),
    [block, status]
  );
  const [selected, setSelected] = useState(null);

  const blocks = rooms.data?.blocks || summary.data?.blocks || [];

  // Group rooms by floor
  const byFloor = useMemo(() => {
    const items = rooms.data?.items || [];
    const groups = {};
    items.forEach((r) => {
      (groups[r.floor] = groups[r.floor] || []).push(r);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([floor, rs]) => ({ floor, rooms: rs }));
  }, [rooms.data]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operations"
        title="Hostel"
        subtitle="Rooms, occupancy and warden management"
      />

      {summary.error && <ErrorState error={summary.error} onRetry={summary.refetch} />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile icon={Building2} label="Total rooms" value={summary.loading ? "—" : summary.data?.totalRooms} tint="from-brand-500/30" />
        <StatTile icon={BedDouble} label="Total beds" value={summary.loading ? "—" : summary.data?.totalBeds} tint="from-accent-violet/30" />
        <StatTile icon={SparklesIcon} label="Occupied" value={summary.loading ? "—" : `${summary.data?.occupied} (${summary.data?.occupancyPct}%)`} tint="from-emerald-500/30" />
        <StatTile icon={Home} label="Vacant beds" value={summary.loading ? "—" : summary.data?.vacantBeds} tint="from-accent-gold/30" />
      </div>

      {/* Block cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {blocks.map((b, i) => {
          const occPct = b.beds ? Math.round((b.occupied / b.beds) * 100) : 0;
          const active = block === b.id;
          return (
            <motion.button
              key={b.id}
              onClick={() => setBlock(b.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              className={`relative overflow-hidden rounded-2xl border p-4 text-left transition-all ${
                active
                  ? "border-white/25 bg-white/[0.07] shadow-glow"
                  : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
              }`}
            >
              <div
                className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${BLOCK_TONES[b.id]} opacity-30 blur-2xl`}
              />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-white/55">
                      Block {b.id}
                    </div>
                    <div className="font-display text-lg font-semibold">
                      {b.name}
                    </div>
                  </div>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/65 ring-1 ring-white/10">
                    {b.gender}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-white/65">
                  <span>{b.rooms} rooms</span>
                  <span>
                    {b.occupied}/{b.beds} beds
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${occPct}%` }}
                    transition={{ duration: 0.8 }}
                    className={`h-full bg-gradient-to-r ${BLOCK_TONES[b.id]}`}
                  />
                </div>
                <div className="mt-1 text-right text-[10px] text-white/55">
                  {occPct}% occupancy
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-white/55" />
          <div className="text-xs text-white/55">Showing</div>
          <select
            value={block}
            onChange={(e) => setBlock(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">All blocks</option>
            {blocks.map((b) => (
              <option key={b.id} value={b.id}>
                Block {b.id} · {b.name}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">All statuses</option>
            <option>Vacant</option>
            <option>Available</option>
            <option>Full</option>
          </select>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-white/55">
          <Dot tone="bg-white/40" /> Vacant
          <Dot tone="bg-emerald-400" /> Available
          <Dot tone="bg-accent-pink" /> Full
        </div>
      </div>

      {/* Room grid */}
      {rooms.error && <ErrorState error={rooms.error} onRetry={rooms.refetch} />}

      {rooms.loading ? (
        <div className="space-y-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <div className="space-y-4">
          {byFloor.map(({ floor, rooms: rs }) => (
            <div key={floor} className="space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-white/55">
                Floor {floor}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                {rs.map((r, i) => (
                  <RoomCell key={r.id} r={r} idx={i} onClick={() => setSelected(r)} />
                ))}
              </div>
            </div>
          ))}
          {byFloor.length === 0 && (
            <div className="card text-center text-white/55">
              No rooms match your filter.
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <RoomModal
            room={selected}
            onClose={() => setSelected(null)}
            onChanged={() => {
              rooms.refetch();
              summary.refetch();
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
      <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${tint} to-transparent blur-2xl`} />
      <div className="relative flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-white/55">{label}</div>
          <div className="stat-num glow-text">{value}</div>
        </div>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function Dot({ tone }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${tone}`} />;
}

function RoomCell({ r, idx, onClick }) {
  const tone = STATUS_TONES[r.status];
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: idx * 0.01 }}
      whileHover={{ y: -2 }}
      className={`group relative overflow-hidden rounded-xl bg-gradient-to-br p-3 text-left ring-1 ${tone}`}
    >
      <div className="flex items-center justify-between">
        <div className="font-display text-sm font-bold">{r.id}</div>
        <BedDouble size={12} />
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-wider opacity-70">
        {r.status}
      </div>
      <div className="mt-2 flex items-center gap-0.5">
        {Array.from({ length: r.capacity }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i < r.occupants.length ? "bg-current opacity-80" : "bg-white/15"
            }`}
          />
        ))}
      </div>
      <div className="mt-1 text-[10px] opacity-60">
        {r.occupants.length}/{r.capacity} beds
      </div>
    </motion.button>
  );
}

function RoomModal({ room: initial, onClose, onChanged }) {
  const [room, setRoom] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [adding, setAdding] = useState(false);

  const evict = async (studentId) => {
    setBusy(true);
    setErr(null);
    try {
      const updated = await endpoints.hostelEvict(room.id, { studentId });
      setRoom(updated);
      onChanged();
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
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a0a1e] via-[#0d0d2a] to-[#101044] shadow-glow"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-brand-500/30 to-accent-pink/30 blur-3xl" />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>
        <div className="relative p-6">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/55">
            Room
          </div>
          <div className="font-display text-2xl font-bold">{room.id}</div>
          <div className="text-xs text-white/55">
            {room.blockName} · Floor {room.floor} · {room.gender} · Warden {room.warden}
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <div className="uppercase tracking-wider text-white/55">
                Occupancy
              </div>
              <div className="font-display font-semibold">
                {room.occupants.length}/{room.capacity}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: room.capacity }).map((_, i) => {
                const filled = i < room.occupants.length;
                return (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-full ${
                      filled
                        ? "bg-gradient-to-r from-brand-400 to-accent-pink"
                        : "bg-white/10"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            <div className="text-[11px] uppercase tracking-wider text-white/55">
              Occupants
            </div>
            {room.occupants.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/10 p-4 text-center text-xs text-white/40">
                No occupants
              </div>
            ) : (
              room.occupants.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] p-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-accent-pink font-display text-[10px] font-bold">
                      {o.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{o.name}</div>
                      <div className="text-[10px] text-white/50">
                        {o.id} · Grade {o.grade}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => evict(o.id)}
                    disabled={busy}
                    className="inline-flex items-center gap-1 rounded-md border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-[11px] font-medium text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
                  >
                    <UserMinus size={11} /> Evict
                  </button>
                </div>
              ))
            )}
          </div>

          {err && (
            <div className="mt-3 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
              {err}
            </div>
          )}

          <div className="mt-5 flex gap-2">
            {room.occupants.length < room.capacity && (
              <button onClick={() => setAdding(true)} className="btn-primary text-sm">
                <UserPlus size={14} /> Assign student
              </button>
            )}
            <button onClick={onClose} className="btn-ghost text-sm">
              Close
            </button>
          </div>
        </div>

        <AnimatePresence>
          {adding && (
            <AssignForm
              room={room}
              onCancel={() => setAdding(false)}
              onAssigned={(updated) => {
                setRoom(updated);
                setAdding(false);
                onChanged();
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function AssignForm({ room, onCancel, onAssigned }) {
  const [form, setForm] = useState({ studentId: "", name: "", grade: 8 });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const updated = await endpoints.hostelAssign(room.id, form);
      onAssigned(updated);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      onSubmit={submit}
      className="relative border-t border-white/10 bg-white/[0.03] p-6"
    >
      <div className="text-[11px] uppercase tracking-wider text-white/55">
        Assign new student
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Input label="Student ID" value={form.studentId} onChange={(v) => setForm((p) => ({ ...p, studentId: v }))} placeholder="STU1042" />
        <Input label="Name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} required />
        <Input label="Grade" type="number" min={1} max={12} value={form.grade} onChange={(v) => setForm((p) => ({ ...p, grade: Number(v) }))} />
      </div>
      {err && (
        <div className="mt-3 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
          {err}
        </div>
      )}
      <div className="mt-3 flex gap-2">
        <button disabled={busy} className="btn-primary text-sm">
          {busy ? "Assigning…" : "Confirm"}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost text-sm">
          Cancel
        </button>
      </div>
    </motion.form>
  );
}

function Input({ label, value, onChange, type = "text", ...rest }) {
  return (
    <label className="block">
      <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
        {...rest}
      />
    </label>
  );
}
