import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ScrollText,
  Filter,
  Search,
  RefreshCw,
  Activity,
  AlertCircle,
  Users,
  Sparkles as SparklesIcon,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const METHOD_TONES = {
  POST: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  PATCH: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  PUT: "bg-accent-violet/15 text-purple-200 ring-accent-violet/30",
  DELETE: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  GET: "bg-white/5 text-white/60 ring-white/10",
};

const ROLE_TONES = {
  admin: "bg-accent-pink/15 text-pink-200 ring-accent-pink/30",
  principal: "bg-accent-violet/15 text-purple-200 ring-accent-violet/30",
  teacher: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  hr: "bg-accent-gold/15 text-amber-200 ring-accent-gold/30",
  accountant: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  student: "bg-white/5 text-white/65 ring-white/10",
  parent: "bg-white/5 text-white/65 ring-white/10",
};

export default function Audit() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [method, setMethod] = useState("all");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const { data, loading, error, refetch, setData } = useApi(
    () => endpoints.audit({ q: debounced, method, role, status, limit: 200 }),
    [debounced, method, role, status]
  );

  // Live append: each mutation across the platform pushes a new entry here.
  // We prepend in-place rather than refetching so the feed never blanks out
  // and respects whichever filter the user has active client-side.
  useRealtime("audit.appended", (msg) => {
    if (!msg?.entry) return;
    setData((prev) => {
      if (!prev) return prev;
      // Apply current filters so a noisy stream doesn't pollute the view
      const e = msg.entry;
      if (method !== "all" && e.method !== method) return prev;
      if (role !== "all" && e.role !== role) return prev;
      if (status === "ok" && !(e.status >= 200 && e.status < 300)) return prev;
      if (status === "error" && !(e.status >= 400)) return prev;
      if (debounced) {
        const t = debounced.toLowerCase();
        const hit =
          e.path.toLowerCase().includes(t) ||
          (e.userName || "").toLowerCase().includes(t);
        if (!hit) return prev;
      }
      return {
        ...prev,
        total: (prev.total || 0) + 1,
        items: [e, ...(prev.items || [])].slice(0, 200),
        summary: {
          ...(prev.summary || {}),
          total: ((prev.summary && prev.summary.total) || 0) + 1,
          last24h: ((prev.summary && prev.summary.last24h) || 0) + 1,
          failures:
            ((prev.summary && prev.summary.failures) || 0) +
            (e.status >= 400 ? 1 : 0),
        },
      };
    });
  });

  const items = data?.items || [];
  const summary = data?.summary;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Security"
        title="Audit Log"
        subtitle="Every mutation across the platform, with who/when/where"
      />

      {error && <ErrorState error={error} onRetry={refetch} />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile icon={ScrollText} label="Total entries" value={loading ? "—" : summary?.total} tint="from-brand-500/30" />
        <StatTile icon={Activity} label="Last 24h" value={loading ? "—" : summary?.last24h} tint="from-accent-violet/30" />
        <StatTile icon={AlertCircle} label="Failures" value={loading ? "—" : summary?.failures} tint="from-rose-500/30" pulse={summary?.failures > 0} />
        <StatTile icon={Users} label="Active users" value={loading ? "—" : summary?.actors} tint="from-emerald-500/30" />
      </div>

      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={14} className="text-white/55" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search path, user or body…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-white/55" />
          <select value={method} onChange={(e) => setMethod(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
            <option value="all">Any method</option>
            <option>POST</option>
            <option>PATCH</option>
            <option>PUT</option>
            <option>DELETE</option>
          </select>
          <select value={role} onChange={(e) => setRole(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
            <option value="all">Any role</option>
            <option>admin</option>
            <option>principal</option>
            <option>teacher</option>
            <option>hr</option>
            <option>accountant</option>
            <option>student</option>
            <option>parent</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
            <option value="all">Any status</option>
            <option value="ok">Success (2xx)</option>
            <option value="error">Error (4xx/5xx)</option>
          </select>
          <button onClick={refetch} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center text-white/55">
          <SparklesIcon className="mx-auto mb-2 text-accent-gold" size={20} />
          No events match. Trigger any mutation (admissions move, payment, ticket update…) to see entries here.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((e, i) => (
            <Row key={e.id} e={e} idx={i} />
          ))}
        </div>
      )}

      <div className="text-center text-[11px] text-white/40">
        Showing newest first · auto-refresh every 15s · capped at last 2,000 entries on the server
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tint, pulse }) {
  return (
    <div className="card relative overflow-hidden">
      <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${tint} to-transparent blur-2xl ${pulse ? "animate-pulse" : ""}`} />
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

function Row({ e, idx }) {
  const ok = e.status >= 200 && e.status < 300;
  const at = new Date(e.at);
  const ago = relTime(e.at);
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx, 20) * 0.015 }}
      className="flex flex-col gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-3 md:flex-row md:items-center"
    >
      <div className="flex items-center gap-2">
        <span className={`inline-flex w-16 justify-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${METHOD_TONES[e.method] || METHOD_TONES.GET}`}>
          {e.method}
        </span>
        <span
          className={`inline-flex w-12 justify-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${
            ok
              ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
              : "bg-rose-500/15 text-rose-300 ring-rose-400/30"
          }`}
        >
          {e.status}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <code className="block truncate font-mono text-xs text-white/80">
          {e.path}
        </code>
        {e.summary && (
          <div className="mt-1 truncate text-[11px] text-white/45">
            {Object.entries(e.summary)
              .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
              .join(" · ")}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 text-[11px]">
        <span className={`rounded-md px-1.5 py-0.5 font-medium ring-1 ${ROLE_TONES[e.role] || "bg-white/5 ring-white/10"}`}>
          {e.role}
        </span>
        <span className="text-white/65">{e.userName}</span>
        <span className="text-white/45">·</span>
        <span className="tabular-nums text-white/55" title={at.toLocaleString()}>
          {ago}
        </span>
        <span className="text-white/40">·</span>
        <span className="tabular-nums text-white/40">{e.durationMs}ms</span>
      </div>
    </motion.div>
  );
}

function relTime(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return s + "s ago";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}
