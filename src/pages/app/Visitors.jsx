import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck,
  UserX,
  IdCard,
  Phone,
  Clock,
  Search,
  Plus,
  X,
  Sparkles as SparklesIcon,
  LogOut,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

export default function Visitors() {
  const [tab, setTab] = useState("inside");
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [purpose, setPurpose] = useState("all");
  const [creating, setCreating] = useState(false);
  const [showPass, setShowPass] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const params = {
    q: debounced,
    purpose,
    active: tab === "inside" ? "true" : tab === "history" ? "false" : undefined,
  };
  const { data, loading, error, refetch } = useApi(
    () => endpoints.visitors(params),
    [debounced, purpose, tab]
  );
  useRealtime("visitors.changed", () => refetch());

  const items = data?.items || [];
  const summary = data?.summary;

  const onCheckOut = async (id) => {
    await endpoints.visitorCheckOut(id);
    refetch();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Security"
        title="Visitor Management"
        subtitle="Check-in / out, visitor passes and on-site headcount"
      />

      {error && <ErrorState error={error} onRetry={refetch} />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <button type="button" onClick={() => setTab("inside")} className={`block w-full rounded-2xl text-left transition-all ${tab === "inside" ? "ring-1 ring-brand-400/50" : ""}`}>
          <StatTile icon={UserCheck} label="Inside now" value={loading ? "—" : summary?.inside} tint="from-emerald-500/30" pulse={summary?.inside > 0} />
        </button>
        <StatTile icon={SparklesIcon} label="Today" value={loading ? "—" : summary?.todayCheckIns} tint="from-brand-500/30" />
        <button type="button" onClick={() => setTab("all")} className={`block w-full rounded-2xl text-left transition-all ${tab === "all" ? "ring-1 ring-brand-400/50" : ""}`}>
          <StatTile icon={IdCard} label="All time" value={loading ? "—" : summary?.total} tint="from-accent-violet/30" />
        </button>
        <button type="button" onClick={() => setTab("history")} className={`block w-full rounded-2xl text-left transition-all ${tab === "history" ? "ring-1 ring-brand-400/50" : ""}`}>
          <StatTile icon={LogOut} label="Checked out" value={loading ? "—" : (summary?.total - summary?.inside) || 0} tint="from-white/15" />
        </button>
      </div>

      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { k: "inside", label: `Inside (${summary?.inside ?? "…"})` },
            { k: "history", label: "Checked out" },
            { k: "all", label: "All visitors" },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`rounded-xl px-3 py-1.5 text-sm transition-all ${
                tab === t.k
                  ? "bg-gradient-to-r from-brand-500/30 to-accent-violet/20 text-white ring-1 ring-white/15"
                  : "text-white/65 hover:bg-white/5 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex w-72 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <Search size={14} className="text-white/55" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name, phone, pass, host…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
            />
          </div>
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">All purposes</option>
            {(data?.purposes || []).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button
            onClick={() => setCreating(true)}
            className="btn-primary px-3 py-2 text-sm"
          >
            <Plus size={14} /> Check in
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center text-white/55">No visitors match.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((v, i) => (
            <VisitorCard key={v.id} v={v} idx={i} onCheckOut={onCheckOut} onShowPass={setShowPass} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {creating && (
          <CheckInModal
            purposes={data?.purposes || []}
            idTypes={data?.idTypes || []}
            onClose={() => setCreating(false)}
            onCreated={(rec) => {
              setCreating(false);
              setShowPass(rec);
              refetch();
            }}
          />
        )}
        {showPass && <VisitorPass v={showPass} onClose={() => setShowPass(null)} />}
      </AnimatePresence>
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

function VisitorCard({ v, idx, onCheckOut, onShowPass }) {
  const isInside = !v.checkOutAt;
  const initials = v.name
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const inAt = new Date(v.checkInAt);
  const outAt = v.checkOutAt ? new Date(v.checkOutAt) : null;
  const ms = (outAt || new Date()) - inAt;
  const mins = Math.max(0, Math.floor(ms / 60000));
  const duration = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.03 }}
      whileHover={{ y: -3 }}
      className="card relative overflow-hidden"
    >
      {isInside && (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300 ring-1 ring-emerald-400/30">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
          </span>
          INSIDE
        </span>
      )}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl opacity-50"
        style={{
          background: `linear-gradient(135deg, hsl(${v.photoSeed} 80% 55%), hsl(${(v.photoSeed + 60) % 360} 80% 40%))`,
        }}
      />
      <div className="relative">
        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl font-display text-sm font-bold text-white shadow-glow"
            style={{
              background: `linear-gradient(135deg, hsl(${v.photoSeed} 80% 55%), hsl(${(v.photoSeed + 60) % 360} 80% 40%))`,
            }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-base font-semibold">{v.name}</div>
            <div className="text-[10px] uppercase tracking-wider text-white/55">
              {v.id} · pass {v.pass}
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-1.5 text-xs">
          <Row icon={SparklesIcon} label="Purpose" value={v.purpose} />
          <Row icon={UserCheck} label="Host" value={`${v.host} · ${v.hostRole}`} />
          <Row icon={Phone} label="Phone" value={v.phone} />
          <Row icon={IdCard} label="ID" value={`${v.idType} ****${v.idLast4}`} />
        </div>

        <div className="mt-3 flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] p-2 text-[11px]">
          <span className="inline-flex items-center gap-1 text-white/70">
            <Clock size={11} /> in {inAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          <span className="font-display text-white/85">{duration}</span>
          {outAt && (
            <span className="inline-flex items-center gap-1 text-white/70">
              <Clock size={11} /> out {outAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onShowPass(v)}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium hover:bg-white/10"
          >
            View pass
          </button>
          {isInside ? (
            <button
              onClick={() => onCheckOut(v.id)}
              className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/15"
            >
              <UserX size={12} /> Check out
            </button>
          ) : (
            <span className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-xs text-white/40">
              <LogOut size={12} /> Departed
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between text-white/70">
      <span className="inline-flex items-center gap-1.5 text-white/55">
        <Icon size={11} /> {label}
      </span>
      <span className="font-medium text-white/85">{value}</span>
    </div>
  );
}

function CheckInModal({ purposes, idTypes, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    purpose: purposes[0] || "Parent meeting",
    host: "",
    hostRole: "Staff",
    idType: idTypes[0] || "Aadhaar",
    idLast4: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const rec = await endpoints.visitorCheckIn(form);
      onCreated(rec);
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
        <button type="button" onClick={onClose} className="absolute right-3 top-3 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white">
          <X size={16} />
        </button>
        <div className="mb-1 text-xs uppercase tracking-[0.2em] text-white/55">
          Check in visitor
        </div>
        <div className="font-display text-xl font-bold">Issue visitor pass</div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Field label="Name" full>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10" />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10" />
          </Field>
          <Field label="Purpose">
            <select value={form.purpose} onChange={(e) => set("purpose", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
              {purposes.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Host">
            <input value={form.host} onChange={(e) => set("host", e.target.value)} required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10" />
          </Field>
          <Field label="Host role">
            <input value={form.hostRole} onChange={(e) => set("hostRole", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10" />
          </Field>
          <Field label="ID type">
            <select value={form.idType} onChange={(e) => set("idType", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
              {idTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="ID last 4 digits">
            <input maxLength={4} value={form.idLast4} onChange={(e) => set("idLast4", e.target.value.replace(/\D/g,""))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10" />
          </Field>
        </div>

        {err && (
          <div className="mt-3 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">{err}</div>
        )}

        <button disabled={busy} className="btn-primary mt-5 w-full">
          {busy ? "Issuing…" : "Issue pass & check in"}
        </button>
      </motion.form>
    </motion.div>
  );
}

function VisitorPass({ v, onClose }) {
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
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-[#0a0a1e] via-[#0d0d2a] to-[#101044] p-6 shadow-glow"
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full blur-3xl"
          style={{
            background: `linear-gradient(135deg, hsl(${v.photoSeed} 80% 55%), hsl(${(v.photoSeed + 60) % 360} 80% 40%))`,
            opacity: 0.35,
          }}
        />
        <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white">
          <X size={18} />
        </button>
        <div className="relative">
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/55">
            Lumina · Visitor Pass
          </div>
          <div className="mt-1 font-display text-2xl font-bold text-accent-gold">
            {v.pass}
          </div>

          <div className="mt-5 flex items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl font-display text-xl font-bold text-white shadow-glow"
              style={{
                background: `linear-gradient(135deg, hsl(${v.photoSeed} 80% 55%), hsl(${(v.photoSeed + 60) % 360} 80% 40%))`,
              }}
            >
              {v.name.split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div>
              <div className="font-display text-lg font-semibold leading-tight">{v.name}</div>
              <div className="text-[11px] text-white/55">{v.phone}</div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
            <Cell label="Purpose" value={v.purpose} />
            <Cell label="Host" value={v.host} />
            <Cell label="ID" value={`${v.idType} ****${v.idLast4}`} />
            <Cell label="Check-in" value={new Date(v.checkInAt).toLocaleString()} />
          </div>

          {/* decorative QR */}
          <div className="mt-5 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="text-[10px] uppercase tracking-wider text-white/55">
              Carry pass for the duration of your visit
            </div>
            <div className="grid h-12 w-12 grid-cols-7 gap-[2px] rounded-md bg-white p-1.5">
              {Array.from({ length: 49 }).map((_, i) => (
                <div key={i} className={i % 3 === 0 || i % 5 === 0 ? "bg-black" : "bg-white"} />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
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

function Cell({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2">
      <div className="text-[9px] uppercase tracking-wider text-white/45">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
