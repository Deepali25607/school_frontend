import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScrollText,
  Filter,
  Search,
  RefreshCw,
  Activity,
  AlertCircle,
  Users,
  Sparkles as SparklesIcon,
  Calendar,
  Download,
  X,
  ChevronRight,
  Globe,
  Clock,
  User as UserIcon,
  ChevronDown,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const PAGE_SIZE = 100;

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

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default function Audit() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [method, setMethod] = useState("all");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [userId, setUserId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(null);
  const [actors, setActors] = useState([]);
  const [exportBusy, setExportBusy] = useState(false);
  const [exportErr, setExportErr] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  // Reset pagination whenever the filter set changes — otherwise the user
  // could end up looking at "page 3" of a much smaller filtered result.
  useEffect(() => {
    setOffset(0);
  }, [debounced, method, role, status, userId, dateFrom, dateTo]);

  // One-shot fetch of distinct actors for the user filter dropdown.
  useEffect(() => {
    endpoints
      .auditActors()
      .then((res) => setActors(res?.items || []))
      .catch(() => setActors([]));
  }, []);

  const queryParams = useMemo(
    () => ({
      q: debounced,
      method,
      role,
      status,
      userId,
      dateFrom,
      dateTo,
      limit: PAGE_SIZE,
      offset,
    }),
    [debounced, method, role, status, userId, dateFrom, dateTo, offset]
  );

  const { data, loading, error, refetch, setData } = useApi(
    () => endpoints.audit(queryParams),
    [
      debounced,
      method,
      role,
      status,
      userId,
      dateFrom,
      dateTo,
      offset,
    ]
  );

  // Live append: realtime audit broadcasts. We only prepend to the *first
  // page* — on later pages, the appended entry would push the visible
  // window out of alignment, so we just refresh the total counter and skip
  // the visual insertion.
  useRealtime("audit.appended", (msg) => {
    if (!msg?.entry) return;
    if (offset !== 0) {
      setData((prev) =>
        prev ? { ...prev, total: (prev.total || 0) + 1 } : prev
      );
      return;
    }
    setData((prev) => {
      if (!prev) return prev;
      const e = msg.entry;
      if (method !== "all" && e.method !== method) return prev;
      if (role !== "all" && e.role !== role) return prev;
      if (userId && e.userId !== userId) return prev;
      if (status === "ok" && !(e.status >= 200 && e.status < 300)) return prev;
      if (status === "error" && !(e.status >= 400)) return prev;
      if (dateFrom) {
        if (Date.parse(e.at) < Date.parse(dateFrom)) return prev;
      }
      if (dateTo) {
        if (Date.parse(e.at) > Date.parse(dateTo + "T23:59:59.999Z"))
          return prev;
      }
      if (debounced) {
        const t = debounced.toLowerCase();
        const hit =
          e.path.toLowerCase().includes(t) ||
          (e.userName || "").toLowerCase().includes(t) ||
          (e.summary && JSON.stringify(e.summary).toLowerCase().includes(t));
        if (!hit) return prev;
      }
      return {
        ...prev,
        total: (prev.total || 0) + 1,
        items: [e, ...(prev.items || [])].slice(0, PAGE_SIZE),
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
  const total = data?.total ?? items.length;
  const hasMore = data?.hasMore;
  const start = total === 0 ? 0 : offset + 1;
  const end = offset + items.length;

  const activeFilters =
    (debounced ? 1 : 0) +
    (method !== "all" ? 1 : 0) +
    (role !== "all" ? 1 : 0) +
    (status !== "all" ? 1 : 0) +
    (userId ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);

  const clearFilters = () => {
    setQ("");
    setMethod("all");
    setRole("all");
    setStatus("all");
    setUserId("");
    setDateFrom("");
    setDateTo("");
  };

  const exportCsv = async () => {
    setExportBusy(true);
    setExportErr(null);
    try {
      const { blob, filename } = await endpoints.auditExport({
        q: debounced,
        method,
        role,
        status,
        userId,
        dateFrom,
        dateTo,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportErr(e?.response?.data?.error || e.message || "Export failed");
    } finally {
      setExportBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Security"
        title="Audit Log"
        subtitle="Every mutation across the platform, with who/when/where"
      />

      {error && <ErrorState error={error} onRetry={refetch} />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          icon={ScrollText}
          label="Total entries"
          value={loading ? "—" : summary?.total}
          tint="from-brand-500/30"
        />
        <StatTile
          icon={Activity}
          label="Last 24h"
          value={loading ? "—" : summary?.last24h}
          tint="from-accent-violet/30"
        />
        <button type="button" onClick={() => setStatus(status === "error" ? "all" : "error")} className={`block w-full rounded-2xl text-left transition-all ${status === "error" ? "ring-1 ring-brand-400/50" : ""}`}>
          <StatTile
            icon={AlertCircle}
            label="Failures"
            value={loading ? "—" : summary?.failures}
            tint="from-rose-500/30"
            pulse={summary?.failures > 0}
          />
        </button>
        <StatTile
          icon={Users}
          label="Active users"
          value={loading ? "—" : summary?.actors}
          tint="from-emerald-500/30"
        />
      </div>

      <div className="card space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <Search size={14} className="text-white/55" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search path, user or summary…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="text-white/40 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={refetch}
              title="Refresh"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={exportCsv}
              disabled={exportBusy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-violet px-3 py-2 text-sm font-semibold text-white shadow shadow-brand-500/20 disabled:opacity-50"
            >
              <Download size={14} />
              {exportBusy ? "Exporting…" : "Export CSV"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-white/55" />
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">Any method</option>
            <option>POST</option>
            <option>PATCH</option>
            <option>PUT</option>
            <option>DELETE</option>
          </select>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">Any role</option>
            <option>admin</option>
            <option>principal</option>
            <option>teacher</option>
            <option>hr</option>
            <option>accountant</option>
            <option>student</option>
            <option>parent</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">Any status</option>
            <option value="ok">Success (2xx)</option>
            <option value="error">Error (4xx/5xx)</option>
          </select>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="max-w-[200px] truncate rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="">Any user</option>
            {actors.map((a) => (
              <option key={a.userId} value={a.userId}>
                {a.userName} ({a.role})
              </option>
            ))}
          </select>
          {activeFilters > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-white/65 hover:bg-white/10"
            >
              <X size={11} /> Clear · {activeFilters}
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Calendar size={14} className="text-white/55" />
          <DateInput
            label="From"
            value={dateFrom}
            onChange={setDateFrom}
            max={dateTo || todayIso()}
          />
          <DateInput
            label="To"
            value={dateTo}
            onChange={setDateTo}
            min={dateFrom}
            max={todayIso()}
          />
          <div className="flex items-center gap-1.5">
            <Preset
              label="Today"
              onClick={() => {
                setDateFrom(todayIso());
                setDateTo(todayIso());
              }}
            />
            <Preset
              label="7d"
              onClick={() => {
                setDateFrom(daysAgoIso(6));
                setDateTo(todayIso());
              }}
            />
            <Preset
              label="30d"
              onClick={() => {
                setDateFrom(daysAgoIso(29));
                setDateTo(todayIso());
              }}
            />
            {(dateFrom || dateTo) && (
              <Preset
                label="All"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
              />
            )}
          </div>
        </div>

        {exportErr && (
          <div className="flex items-start gap-2 rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-400/30">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <span>{exportErr}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-white/55">
        <div>
          {loading ? (
            "Loading…"
          ) : total === 0 ? (
            <span>No matches</span>
          ) : (
            <>
              Showing <span className="text-white">{start.toLocaleString()}</span>
              {" – "}
              <span className="text-white">{end.toLocaleString()}</span> of{" "}
              <span className="text-white">{total.toLocaleString()}</span>{" "}
              filtered entries
            </>
          )}
        </div>
        <div className="text-white/40">
          Capped at 2,000 most recent server-side
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center text-white/55">
          <SparklesIcon className="mx-auto mb-2 text-accent-gold" size={20} />
          {activeFilters > 0
            ? "No events match these filters."
            : "Trigger any mutation (admissions move, payment, ticket update…) to see entries here."}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((e, i) => (
            <Row
              key={e.id}
              e={e}
              idx={i}
              onClick={() => setSelected(e)}
              isSelected={selected?.id === e.id}
            />
          ))}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setOffset(offset + PAGE_SIZE)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                <ChevronDown size={14} /> Load next {PAGE_SIZE}
              </button>
            </div>
          )}
          {offset > 0 && (
            <div className="flex justify-center text-xs text-white/40">
              <button
                type="button"
                onClick={() => setOffset(0)}
                className="hover:text-white"
              >
                ↑ Back to top
              </button>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <DetailDrawer entry={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tint, pulse }) {
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
          <div className="stat-num glow-text">{value}</div>
        </div>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function DateInput({ label, value, onChange, min, max }) {
  return (
    <label className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/70">
      <span className="text-white/55">{label}</span>
      <input
        type="date"
        value={value}
        min={min || undefined}
        max={max || undefined}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-xs text-white outline-none [color-scheme:dark]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-white/40 hover:text-white"
        >
          <X size={11} />
        </button>
      )}
    </label>
  );
}

function Preset({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/65 hover:bg-white/10"
    >
      {label}
    </button>
  );
}

function Row({ e, idx, onClick, isSelected }) {
  const ok = e.status >= 200 && e.status < 300;
  const at = new Date(e.at);
  const ago = relTime(e.at);
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx, 20) * 0.015 }}
      className={`flex w-full flex-col gap-2 rounded-xl border p-3 text-left transition md:flex-row md:items-center ${
        isSelected
          ? "border-brand-400/40 bg-brand-500/10"
          : "border-white/5 bg-white/[0.03] hover:bg-white/[0.06]"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex w-16 justify-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${
            METHOD_TONES[e.method] || METHOD_TONES.GET
          }`}
        >
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
        <span
          className={`rounded-md px-1.5 py-0.5 font-medium ring-1 ${
            ROLE_TONES[e.role] || "bg-white/5 ring-white/10"
          }`}
        >
          {e.role}
        </span>
        <span className="text-white/65">{e.userName}</span>
        <span className="text-white/45">·</span>
        <span
          className="tabular-nums text-white/55"
          title={at.toLocaleString()}
        >
          {ago}
        </span>
        <span className="text-white/40">·</span>
        <span className="tabular-nums text-white/40">{e.durationMs}ms</span>
        <ChevronRight size={12} className="text-white/30" />
      </div>
    </motion.button>
  );
}

function DetailDrawer({ entry, onClose }) {
  const ok = entry.status >= 200 && entry.status < 300;
  const at = new Date(entry.at);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
    >
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-white/10 bg-[#06061a] p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-white/45">
              Audit entry
            </div>
            <div className="font-display text-2xl font-bold text-white">
              {entry.id}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/65 hover:bg-white/10"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex justify-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${
                  METHOD_TONES[entry.method] || METHOD_TONES.GET
                }`}
              >
                {entry.method}
              </span>
              <span
                className={`inline-flex justify-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${
                  ok
                    ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
                    : "bg-rose-500/15 text-rose-300 ring-rose-400/30"
                }`}
              >
                {entry.status}
              </span>
              <span className="ml-auto text-xs text-white/45">
                {entry.durationMs}ms
              </span>
            </div>
            <code className="mt-2 block break-all font-mono text-sm text-white/85">
              {entry.path}
            </code>
          </div>

          <KV
            icon={UserIcon}
            label="Actor"
            value={
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ${
                    ROLE_TONES[entry.role] || "bg-white/5 ring-white/10"
                  }`}
                >
                  {entry.role}
                </span>
                <span className="text-white">{entry.userName}</span>
                {entry.userId && (
                  <span className="font-mono text-[10px] text-white/40">
                    {entry.userId}
                  </span>
                )}
              </div>
            }
          />
          <KV icon={Clock} label="At" value={at.toLocaleString()} />
          {entry.ip && <KV icon={Globe} label="IP" value={entry.ip} />}

          <div>
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-white/55">
              <ScrollText size={12} /> Summary
            </div>
            {entry.summary ? (
              <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-3 text-[11px] text-white/80">
                {JSON.stringify(entry.summary, null, 2)}
              </pre>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/45">
                No request summary captured for this entry.
              </div>
            )}
          </div>
        </div>
      </motion.aside>
    </motion.div>
  );
}

function KV({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/45">
        <Icon size={11} /> {label}
      </div>
      <div className="text-sm text-white/85">{value}</div>
    </div>
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
