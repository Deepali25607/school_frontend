import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Package,
  AlertTriangle,
  TrendingUp,
  Boxes,
  Filter,
  Plus,
  Minus,
  X,
  Sparkles as SparklesIcon,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const CATEGORY_TONES = {
  Computers: "from-brand-500 to-accent-violet",
  Furniture: "from-accent-violet to-accent-pink",
  Sports: "from-accent-pink to-rose-500",
  Lab: "from-accent-cyan to-emerald-500",
  Classroom: "from-accent-gold to-orange-500",
  Electrical: "from-amber-500 to-yellow-500",
  Stationery: "from-emerald-500 to-accent-mint",
};

export default function Inventory() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState("all");
  const [lowOnly, setLowOnly] = useState(false);
  const [adjusting, setAdjusting] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const { data, loading, error, refetch } = useApi(
    () =>
      endpoints.inventory({
        q: debounced,
        category,
        lowStock: lowOnly ? "true" : undefined,
      }),
    [debounced, category, lowOnly]
  );

  const items = data?.items || [];
  const sum = data?.summary;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operations"
        title="Inventory & Assets"
        subtitle="Catalog, stock levels and reorder alerts"
      />

      {error && <ErrorState error={error} onRetry={refetch} />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile icon={Boxes} label="SKUs" value={loading ? "—" : sum?.skus} tint="from-brand-500/30" />
        <StatTile icon={Package} label="Total value" value={loading ? "—" : `₹${(sum?.totalValue / 100000).toFixed(1)}L`} tint="from-accent-violet/30" />
        <StatTile icon={AlertTriangle} label="Low stock" value={loading ? "—" : sum?.lowStock} tint="from-rose-500/30" pulse={sum?.lowStock > 0} />
        <StatTile icon={TrendingUp} label="Categories" value={loading ? "—" : sum?.byCategory?.length} tint="from-emerald-500/30" />
      </div>

      {/* Category breakdown bars */}
      {!loading && sum?.byCategory && (
        <div className="card">
          <div className="mb-3 font-display text-lg font-semibold">
            By category
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
            {sum.byCategory.map((c) => {
              const maxValue = Math.max(...sum.byCategory.map((x) => x.value));
              const pct = (c.value / maxValue) * 100;
              return (
                <div
                  key={c.category}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-white/55">
                        {c.category}
                      </div>
                      <div className="font-display font-semibold">
                        {c.skus} SKUs · {c.qty.toLocaleString()} units
                      </div>
                    </div>
                    <div className="text-right font-display text-sm font-bold text-white/85">
                      ₹{(c.value / 100000).toFixed(1)}L
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7 }}
                      className={`h-full bg-gradient-to-r ${
                        CATEGORY_TONES[c.category] || "from-brand-500 to-accent-pink"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={16} className="text-white/60" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, SKU or vendor…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-white/55" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">All categories</option>
            {(data?.categories || []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            onClick={() => setLowOnly((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium ring-1 transition-all ${
              lowOnly
                ? "bg-rose-500/15 text-rose-300 ring-rose-400/40"
                : "bg-white/5 text-white/65 ring-white/10 hover:bg-white/10"
            }`}
          >
            <AlertTriangle size={13} /> Low stock only
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-white/55">No items match.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03] text-left text-[11px] uppercase tracking-wider text-white/55">
                <tr>
                  <th className="px-5 py-3">Item</th>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3 text-right">Qty</th>
                  <th className="px-5 py-3 text-right">Reorder at</th>
                  <th className="px-5 py-3 text-right">Unit price</th>
                  <th className="px-5 py-3 text-right">Value</th>
                  <th className="px-5 py-3">Vendor</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((a, i) => {
                  const low = a.qty <= a.reorder;
                  return (
                    <motion.tr
                      key={a.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.015 }}
                      className="border-t border-white/5 hover:bg-white/[0.025]"
                    >
                      <td className="px-5 py-3 font-medium">{a.name}</td>
                      <td className="px-5 py-3 font-mono text-xs text-white/55">
                        {a.sku}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-md bg-gradient-to-br ${
                            CATEGORY_TONES[a.category] || ""
                          } bg-clip-text px-2 py-0.5 text-[11px] font-medium text-transparent ring-1 ring-white/10`}
                        >
                          {a.category}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className={`inline-flex items-center gap-1.5 font-display font-semibold ${low ? "text-rose-300" : ""}`}>
                          {low && <AlertTriangle size={12} />}
                          {a.qty.toLocaleString()} {a.unit}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-white/55">
                        {a.reorder}
                      </td>
                      <td className="px-5 py-3 text-right">
                        ₹{a.price.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right font-display font-semibold">
                        ₹{(a.qty * a.price).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-white/70">{a.vendor}</td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => setAdjusting(a)}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                        >
                          Adjust
                        </button>
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
        {adjusting && (
          <AdjustModal
            asset={adjusting}
            onClose={() => setAdjusting(null)}
            onSaved={() => {
              setAdjusting(null);
              refetch();
            }}
          />
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

function AdjustModal({ asset, onClose, onSaved }) {
  const [delta, setDelta] = useState(0);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const newQty = asset.qty + delta;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await endpoints.inventoryAdjust(asset.id, { delta, note });
      onSaved();
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
        className="glass-card relative w-full max-w-md p-6"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X size={16} />
        </button>
        <div className="mb-1 text-xs uppercase tracking-[0.2em] text-white/55">
          Stock adjustment
        </div>
        <div className="font-display text-xl font-bold leading-tight">
          {asset.name}
        </div>
        <div className="mt-0.5 text-xs text-white/55">
          {asset.sku} · current qty {asset.qty.toLocaleString()} {asset.unit}
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setDelta((d) => d - 1)}
              className="rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/10"
            >
              <Minus size={16} />
            </button>
            <input
              type="number"
              value={delta}
              onChange={(e) => setDelta(Number(e.target.value || 0))}
              className="w-24 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center font-display text-xl font-bold outline-none focus:border-brand-400/60 focus:bg-white/10"
            />
            <button
              type="button"
              onClick={() => setDelta((d) => d + 1)}
              className="rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/10"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="mt-3 text-center text-xs text-white/55">
            New quantity will be{" "}
            <span
              className={`font-display text-base font-bold ${
                newQty < 0
                  ? "text-rose-300"
                  : newQty <= asset.reorder
                  ? "text-amber-300"
                  : "text-emerald-300"
              }`}
            >
              {newQty.toLocaleString()}
            </span>{" "}
            {asset.unit}
          </div>
        </div>

        <label className="mt-4 block">
          <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">
            Note (optional)
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Purchase order PO-1234"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
          />
        </label>

        {err && (
          <div className="mt-3 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
            {err}
          </div>
        )}

        <button
          disabled={busy || delta === 0}
          className="btn-primary mt-5 w-full disabled:opacity-50"
        >
          {busy ? "Saving…" : `Apply ${delta >= 0 ? "+" : ""}${delta}`}
        </button>
      </motion.form>
    </motion.div>
  );
}
