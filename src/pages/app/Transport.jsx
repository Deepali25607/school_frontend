import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bus,
  MapPin,
  Users,
  Gauge,
  Clock,
  Sparkles as SparklesIcon,
  Phone,
  CircleDot,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader,
  CircleAlert,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const PALETTE = [
  "#5b81ff", "#ff5ec4", "#5cf2c4", "#ffd166",
  "#9b5cff", "#3ad6ff", "#ff8b5c", "#86ff9d",
];

export default function Transport() {
  const { user } = useAuth();
  const canEdit = ["admin", "principal"].includes(user?.role);

  const { data, loading, error: fetchError, refetch } = useApi(
    endpoints.transportRoutes,
    []
  );
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const t = setInterval(() => refetch(), 5000);
    return () => clearInterval(t);
  }, [refetch]);

  const routes = data?.items || [];
  const selected = useMemo(
    () => routes.find((r) => r.id === selectedId) || routes[0],
    [routes, selectedId]
  );

  const totals = useMemo(() => {
    return {
      routes: routes.length,
      buses: routes.length,
      students: routes.reduce((a, r) => a + r.totalStudents, 0),
      onSchedule: routes.filter((r) => r.status === "On schedule").length,
      delayed: routes.filter((r) => r.status !== "On schedule").length,
    };
  }, [routes]);

  const visibleRoutes = useMemo(() => {
    if (statusFilter === "all") return routes;
    if (statusFilter === "Delayed")
      return routes.filter((r) => r.status !== "On schedule");
    return routes.filter((r) => r.status === statusFilter);
  }, [routes, statusFilter]);

  const toggleStatus = (value) =>
    setStatusFilter((cur) => (cur === value ? "all" : value));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operations"
        title="Transport"
        subtitle={
          user?.role === "parent"
            ? "Live tracking for your children's bus routes"
            : "Live bus tracking, routes, and parent notifications"
        }
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
        <StatTile
          icon={Bus}
          label="Buses"
          value={loading ? "—" : totals.buses}
          tint="from-brand-500/30"
          onClick={() => setStatusFilter("all")}
          active={statusFilter === "all"}
        />
        <StatTile
          icon={MapPin}
          label="Routes"
          value={loading ? "—" : totals.routes}
          tint="from-accent-violet/30"
          onClick={() => setStatusFilter("all")}
          active={statusFilter === "all"}
        />
        <StatTile icon={Users} label="Students" value={loading ? "—" : totals.students} tint="from-accent-pink/30" />
        <StatTile
          icon={Gauge}
          label="On schedule"
          value={loading ? "—" : `${totals.onSchedule}/${totals.routes}`}
          tint="from-emerald-500/30"
          onClick={() => toggleStatus("On schedule")}
          active={statusFilter === "On schedule"}
        />
      </div>

      {(canEdit || statusFilter !== "all" || totals.delayed > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {totals.delayed > 0 && (
              <button
                type="button"
                onClick={() => toggleStatus("Delayed")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
                  statusFilter === "Delayed"
                    ? "bg-rose-500/20 text-rose-200 ring-rose-400/40"
                    : "bg-white/5 text-white/70 ring-white/10 hover:bg-white/10"
                }`}
              >
                <CircleAlert size={12} /> Delayed ({totals.delayed})
              </button>
            )}
            {statusFilter !== "all" && (
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-white/70 ring-1 ring-white/10 hover:bg-white/10"
              >
                Filter: {statusFilter} <X size={12} />
              </button>
            )}
          </div>
          {canEdit && (
            <button
              onClick={() => setEditing("new")}
              className="btn-primary px-3 py-2 text-sm"
            >
              <Plus size={14} /> New route
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        {/* Route list */}
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))
          ) : (
            visibleRoutes.map((r) => (
              <motion.div
                key={r.id}
                whileHover={{ x: 2 }}
                className={`group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all ${
                  (selected?.id || routes[0]?.id) === r.id
                    ? "border-white/20 bg-white/[0.07] shadow-glow"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                }`}
              >
                <div
                  className="absolute left-0 top-0 h-full w-1"
                  style={{ background: r.color }}
                />
                <button
                  onClick={() => setSelectedId(r.id)}
                  className="block w-full text-left"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-display text-base font-semibold">
                        {r.name}
                      </div>
                      <div className="mt-0.5 text-xs text-white/55">
                        {r.bus.plate} · {r.bus.driver}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${
                        r.status === "On schedule"
                          ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
                          : "bg-rose-500/15 text-rose-300 ring-rose-400/30"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-white/55">
                    <span className="inline-flex items-center gap-1">
                      <Users size={11} /> {r.totalStudents} students
                      {r.over && (
                        <span className="ml-1 rounded-full bg-rose-500/20 px-1.5 py-0 text-[9px] text-rose-200 ring-1 ring-rose-400/30">
                          over capacity
                        </span>
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} /> {r.lastPing}
                    </span>
                  </div>
                  <ProgressBar progress={r.progress} color={r.color} />
                </button>
                {canEdit && (
                  <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(r);
                      }}
                      title="Edit route"
                      className="rounded-lg border border-white/10 bg-black/40 p-1.5 text-white/85 backdrop-blur hover:bg-black/60"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleting(r);
                      }}
                      title="Delete route"
                      className="rounded-lg border border-rose-400/30 bg-rose-500/30 p-1.5 text-white backdrop-blur hover:bg-rose-500/50"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </motion.div>
            ))
          )}
          {!loading && routes.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-white/55">
              {user?.role === "parent"
                ? "None of your children are assigned to a bus route."
                : "No routes yet."}{" "}
              {canEdit && (
                <button
                  onClick={() => setEditing("new")}
                  className="text-brand-300 underline-offset-2 hover:underline"
                >
                  Create your first route
                </button>
              )}
            </div>
          )}
          {!loading && routes.length > 0 && visibleRoutes.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-white/55">
              No {statusFilter === "Delayed" ? "delayed" : statusFilter.toLowerCase()} routes.{" "}
              <button
                onClick={() => setStatusFilter("all")}
                className="text-brand-300 underline-offset-2 hover:underline"
              >
                Show all
              </button>
            </div>
          )}
        </div>

        {/* Map + details */}
        <div className="space-y-4">
          {selected && (
            <>
              <RouteMap route={selected} allRoutes={routes} />
              <RouteDetails route={selected} />
            </>
          )}
          {!selected && !loading && (
            <div className="card text-center text-white/55">
              No active routes.
            </div>
          )}
          {loading && !selected && <Skeleton className="h-96" />}
        </div>
      </div>

      <AnimatePresence>
        {editing && (
          <RouteFormModal
            route={editing === "new" ? null : editing}
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
            route={deleting}
            onCancel={() => setDeleting(null)}
            onConfirm={async () => {
              try {
                await endpoints.transportRouteDelete(deleting.id);
                setDeleting(null);
                if (selectedId === deleting.id) setSelectedId(null);
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

function StatTile({ icon: Icon, label, value, tint, onClick, active }) {
  const inner = (
    <div className="card relative h-full overflow-hidden">
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

  if (!onClick) return inner;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-2xl text-left transition-all ${
        active ? "ring-1 ring-brand-400/60 shadow-glow" : "hover:ring-1 hover:ring-white/15"
      }`}
    >
      {inner}
    </button>
  );
}

function ProgressBar({ progress, color }) {
  return (
    <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/10">
      <motion.div
        initial={false}
        animate={{ width: `${Math.round(progress * 100)}%` }}
        transition={{ type: "spring", stiffness: 60, damping: 20 }}
        className="h-full rounded-full"
        style={{
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
        }}
      />
    </div>
  );
}

function RouteMap({ route, allRoutes }) {
  const stops = route.stops;
  const segments = stops.slice(0, -1).map((s, i) => {
    const next = stops[i + 1];
    const dx = next.x - s.x;
    const dy = next.y - s.y;
    return { ...s, next, len: Math.hypot(dx, dy) };
  });
  const totalLen = segments.reduce((a, s) => a + s.len, 0);
  const target = route.progress * totalLen;
  let acc = 0;
  let busPos = { x: stops[0].x, y: stops[0].y };
  for (const seg of segments) {
    if (acc + seg.len >= target) {
      const t = (target - acc) / seg.len;
      busPos = {
        x: seg.x + (seg.next.x - seg.x) * t,
        y: seg.y + (seg.next.y - seg.y) * t,
      };
      break;
    }
    acc += seg.len;
  }

  const path = stops.map((s, i) => `${i === 0 ? "M" : "L"} ${s.x} ${s.y}`).join(" ");
  const otherRoutes = allRoutes.filter((r) => r.id !== route.id);

  return (
    <div className="glass-card relative overflow-hidden p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="font-display text-lg font-semibold">
            Live map · {route.name}
          </div>
          <div className="text-xs text-white/55">
            Pings every 5s · {Math.round(route.progress * 100)}% of route
          </div>
        </div>
        <div className="chip">
          <CircleDot size={10} className="text-emerald-400" /> Live
        </div>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#070718] to-[#0a0a28] p-2">
        <svg viewBox="0 0 1000 600" className="block h-[360px] w-full">
          <defs>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </pattern>
            <radialGradient id="busGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={route.color} stopOpacity="0.7" />
              <stop offset="100%" stopColor={route.color} stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width="1000" height="600" fill="url(#grid-pattern)" />

          {otherRoutes.map((r) => {
            const p = r.stops
              .map((s, i) => `${i === 0 ? "M" : "L"} ${s.x} ${s.y}`)
              .join(" ");
            return (
              <path
                key={r.id}
                d={p}
                fill="none"
                stroke={r.color}
                strokeWidth="1.5"
                strokeOpacity="0.18"
                strokeDasharray="4 6"
              />
            );
          })}

          <path
            d={path}
            fill="none"
            stroke={route.color}
            strokeOpacity="0.25"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={path}
            fill="none"
            stroke={route.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="2 6"
          />

          {stops.map((s, i) => (
            <g key={i}>
              <circle
                cx={s.x}
                cy={s.y}
                r={s.school ? 14 : 8}
                fill="#0a0a28"
                stroke={s.school ? "#ffd166" : route.color}
                strokeWidth="2.5"
              />
              {s.school && (
                <circle
                  cx={s.x}
                  cy={s.y}
                  r="22"
                  fill="none"
                  stroke="#ffd166"
                  strokeOpacity="0.4"
                  strokeWidth="1"
                >
                  <animate attributeName="r" from="14" to="28" dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" from="0.5" to="0" dur="2.5s" repeatCount="indefinite" />
                </circle>
              )}
              <text
                x={s.x}
                y={s.y - 16}
                fill="white"
                fontSize="11"
                fontWeight="600"
                textAnchor="middle"
                style={{ fontFamily: "Inter" }}
              >
                {s.name}
              </text>
              <text
                x={s.x}
                y={s.y + 22}
                fill="rgba(255,255,255,0.55)"
                fontSize="10"
                textAnchor="middle"
                style={{ fontFamily: "Inter" }}
              >
                {s.eta}
              </text>
            </g>
          ))}

          <motion.g
            animate={{ cx: busPos.x, cy: busPos.y, x: busPos.x - 14, y: busPos.y - 14 }}
            transition={{ type: "spring", stiffness: 60, damping: 22 }}
          >
            <motion.circle
              animate={{ cx: busPos.x, cy: busPos.y }}
              transition={{ type: "spring", stiffness: 60, damping: 22 }}
              r="22"
              fill="url(#busGlow)"
            />
            <motion.rect
              animate={{ x: busPos.x - 14, y: busPos.y - 9 }}
              transition={{ type: "spring", stiffness: 60, damping: 22 }}
              width="28"
              height="18"
              rx="4"
              fill={route.color}
              stroke="white"
              strokeWidth="1.5"
            />
            <motion.text
              animate={{ x: busPos.x, y: busPos.y + 4 }}
              transition={{ type: "spring", stiffness: 60, damping: 22 }}
              fill="#06061a"
              fontSize="10"
              fontWeight="700"
              textAnchor="middle"
              style={{ fontFamily: "Inter" }}
            >
              BUS
            </motion.text>
          </motion.g>
        </svg>
      </div>
    </div>
  );
}

function RouteDetails({ route }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-display text-lg font-semibold">Vehicle</div>
          <span
            className="rounded-md px-2 py-0.5 text-[10px] font-medium ring-1 ring-white/15"
            style={{ background: `${route.color}25`, color: route.color }}
          >
            {route.name}
          </span>
        </div>
        <div className="space-y-2 text-sm">
          <KV k="Bus #" v={route.bus.id} />
          <KV k="Plate" v={route.bus.plate} />
          <KV k="Capacity" v={`${route.bus.capacity} seats`} />
          <KV k="Driver" v={route.bus.driver} icon={Phone} />
          <KV k="Helper" v={route.bus.helper || "—"} />
          <KV k="Status" v={route.status} />
        </div>
      </div>
      <div className="card">
        <div className="mb-3 font-display text-lg font-semibold">Stops</div>
        <ol className="space-y-2">
          {route.stops.map((s, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.03] p-2.5"
            >
              <div
                className={`mt-1 h-2.5 w-2.5 rounded-full ${
                  s.school ? "bg-accent-gold" : "bg-white/40"
                }`}
                style={s.school ? undefined : { background: route.color }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-[11px] tabular-nums text-white/55">
                    {s.eta}
                  </div>
                </div>
                <div className="text-[11px] text-white/45">
                  {s.school ? "Drop-off" : `${s.students} students`}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function KV({ k, v, icon: Icon }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-white/55">{k}</div>
      <div className="inline-flex items-center gap-1.5 font-medium">
        {Icon && <Icon size={12} className="text-white/40" />}
        {v}
      </div>
    </div>
  );
}

// ---------- form modal ----------

function defaultStop(i) {
  return {
    name: "",
    eta: `${7 + Math.floor(i * 0.4)}:${String(15 + i * 7).padStart(2, "0").slice(-2)}`,
    students: 4,
    x: 120 + i * 110,
    y: 200 + (i % 2 === 0 ? -60 : 60),
  };
}

function RouteFormModal({ route, onClose, onSaved, onError }) {
  const isNew = !route;
  const [name, setName] = useState(route?.name || "");
  const [color, setColor] = useState(route?.color || PALETTE[0]);
  const [bus, setBus] = useState({
    plate: route?.bus?.plate || "KA-01-0000",
    capacity: route?.bus?.capacity ?? 32,
    driver: route?.bus?.driver || "",
    helper: route?.bus?.helper || "",
  });
  const [status, setStatus] = useState(route?.status || "On schedule");
  const [stops, setStops] = useState(() => {
    if (route) return route.stops.filter((s) => !s.school).map((s) => ({ ...s }));
    return [defaultStop(0), defaultStop(1), defaultStop(2)];
  });
  const [saving, setSaving] = useState(false);

  const setBusField = (k) => (e) =>
    setBus((b) => ({ ...b, [k]: e.target.value }));

  const setStop = (i, k, v) =>
    setStops((cur) => cur.map((s, idx) => (idx === i ? { ...s, [k]: v } : s)));

  const addStop = () =>
    setStops((cur) => [...cur, defaultStop(cur.length)]);

  const removeStop = (i) =>
    setStops((cur) => (cur.length > 1 ? cur.filter((_, idx) => idx !== i) : cur));

  const moveStop = (i, dir) =>
    setStops((cur) => {
      const next = [...cur];
      const j = i + dir;
      if (j < 0 || j >= next.length) return cur;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const totalStudents = stops.reduce(
    (a, s) => a + (Number(s.students) || 0),
    0
  );
  const overCapacity = totalStudents > Number(bus.capacity || 0);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (stops.length === 0) {
      onError("Add at least one stop.");
      return;
    }
    if (stops.some((s) => !s.name.trim())) {
      onError("Every stop needs a name.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name || `Route ${Date.now().toString().slice(-4)}`,
        color,
        status,
        bus: {
          ...bus,
          capacity: Number(bus.capacity),
        },
        stops: stops.map((s) => ({
          name: s.name.trim(),
          eta: s.eta,
          students: Number(s.students),
          x: Number(s.x),
          y: Number(s.y),
        })),
      };
      if (isNew) await endpoints.transportRouteAdd(payload);
      else await endpoints.transportRouteUpdate(route.id, payload);
      onSaved();
    } catch (err) {
      onError(err?.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50";
  const smallInputCls =
    "w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white outline-none focus:border-brand-400/50";

  return (
    <Modal onClose={onClose} wide>
      <form onSubmit={onSubmit}>
        <div className="flex items-center justify-between">
          <div>
            <div className="chip">
              <Bus size={13} className="text-brand-300" />
              {isNew ? "New route" : `Edit ${route.id}`}
            </div>
            <h2 className="mt-2 font-display text-xl font-semibold">
              {isNew ? "Plan a bus route" : route.name}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-white/55 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Route + Bus row */}
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Field label="Route name" className="md:col-span-2">
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="e.g. Route 9 — Whitefield" />
          </Field>
          <Field label="Color">
            <div className="flex flex-wrap gap-1.5">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ background: c }}
                  className={`h-7 w-7 rounded-md ring-2 transition ${
                    color === c ? "ring-white scale-110" : "ring-white/10 hover:ring-white/40"
                  }`}
                  title={c}
                />
              ))}
            </div>
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
              <option className="bg-black">On schedule</option>
              <option className="bg-black">Delayed</option>
            </select>
          </Field>
          <Field label="Plate">
            <input value={bus.plate} onChange={setBusField("plate")} className={inputCls} placeholder="KA-01-1234" />
          </Field>
          <Field label="Capacity (seats)">
            <input
              type="number"
              min={1}
              max={80}
              value={bus.capacity}
              onChange={setBusField("capacity")}
              className={inputCls}
            />
          </Field>
          <Field label="Driver">
            <input value={bus.driver} onChange={setBusField("driver")} className={inputCls} placeholder="Anand R." />
          </Field>
          <Field label="Helper">
            <input value={bus.helper} onChange={setBusField("helper")} className={inputCls} placeholder="Ramesh" />
          </Field>
        </div>

        {/* Stops */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-white/55">
              Stops ({stops.length}) — school auto-added at the end
            </div>
            <button
              type="button"
              onClick={addStop}
              className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/75 hover:bg-white/10"
            >
              <Plus size={12} /> Add stop
            </button>
          </div>
          <div className="max-h-[36vh] space-y-1.5 overflow-y-auto rounded-lg border border-white/10 bg-white/[0.02] p-2">
            <div className="grid grid-cols-[20px_1.5fr_0.8fr_0.7fr_0.7fr_0.7fr_auto] items-center gap-2 px-2 text-[10px] uppercase tracking-wider text-white/45">
              <span></span>
              <span>Stop name</span>
              <span>ETA</span>
              <span>Students</span>
              <span>x</span>
              <span>y</span>
              <span></span>
            </div>
            {stops.map((s, i) => (
              <div
                key={i}
                className="grid grid-cols-[20px_1.5fr_0.8fr_0.7fr_0.7fr_0.7fr_auto] items-center gap-2 rounded-md border border-white/5 bg-black/20 p-2"
              >
                <div className="flex flex-col items-center text-white/30">
                  <button
                    type="button"
                    onClick={() => moveStop(i, -1)}
                    disabled={i === 0}
                    className="text-[10px] hover:text-white disabled:opacity-30"
                    title="Move up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStop(i, 1)}
                    disabled={i === stops.length - 1}
                    className="text-[10px] hover:text-white disabled:opacity-30"
                    title="Move down"
                  >
                    ▼
                  </button>
                </div>
                <input
                  value={s.name}
                  onChange={(e) => setStop(i, "name", e.target.value)}
                  placeholder={`Stop ${i + 1}`}
                  className={smallInputCls}
                />
                <input
                  value={s.eta}
                  onChange={(e) => setStop(i, "eta", e.target.value)}
                  placeholder="7:30"
                  className={smallInputCls}
                />
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={s.students}
                  onChange={(e) => setStop(i, "students", e.target.value)}
                  className={smallInputCls}
                />
                <input
                  type="number"
                  min={0}
                  max={1000}
                  value={s.x}
                  onChange={(e) => setStop(i, "x", e.target.value)}
                  className={smallInputCls}
                  title="Map x (0-1000)"
                />
                <input
                  type="number"
                  min={0}
                  max={600}
                  value={s.y}
                  onChange={(e) => setStop(i, "y", e.target.value)}
                  className={smallInputCls}
                  title="Map y (0-600)"
                />
                <button
                  type="button"
                  onClick={() => removeStop(i)}
                  disabled={stops.length === 1}
                  className="rounded-md border border-rose-400/30 bg-rose-500/10 p-1.5 text-rose-300 hover:bg-rose-500/20 disabled:opacity-40"
                  title="Remove stop"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <div className="text-white/55">
              Total pickups: <strong className="text-white">{totalStudents}</strong> students
            </div>
            {overCapacity ? (
              <div className="rounded-full bg-rose-500/15 px-2 py-0.5 text-rose-200 ring-1 ring-rose-400/30">
                Over capacity ({totalStudents} &gt; {bus.capacity} seats)
              </div>
            ) : (
              <div className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-200 ring-1 ring-emerald-400/30">
                Within capacity
              </div>
            )}
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
            {isNew ? "Create route" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteConfirmModal({ route, onCancel, onConfirm }) {
  const [working, setWorking] = useState(false);
  return (
    <Modal onClose={onCancel}>
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-500/20 text-rose-300">
          <Trash2 size={18} />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold">Delete route?</h2>
          <p className="text-sm text-white/55">{route.name} · {route.id} · {route.bus.plate}</p>
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-xs text-rose-100">
        Removes the route and its {route.stops.length} stops. Bus assignment goes
        away — parents on this route will need to be notified separately.
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
          Delete route
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
        className={`max-h-[90vh] w-full ${wide ? "max-w-3xl" : "max-w-lg"} overflow-y-auto rounded-2xl border border-white/15 bg-[#0d0f24] p-6 shadow-2xl`}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
