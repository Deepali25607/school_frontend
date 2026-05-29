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
  ShoppingCart,
  Truck,
  Ban,
  CheckCircle2,
  Building2,
  Pencil,
  Trash2,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

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
  const [itemForm, setItemForm] = useState(null); // null | "new" | item object
  const [rowBusy, setRowBusy] = useState(null);

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

  const removeItem = async (a) => {
    if (!window.confirm(`Delete "${a.name}"? This removes the SKU from the catalog.`)) return;
    setRowBusy(a.id);
    try {
      await endpoints.inventoryItemDelete(a.id);
      refetch();
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    } finally {
      setRowBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operations"
        title="Inventory & Assets"
        subtitle="Catalog, stock levels and reorder alerts"
        actions={
          <button onClick={() => setItemForm("new")} className="btn-primary px-3 py-2 text-sm">
            <Plus size={14} /> New item
          </button>
        }
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
              const active = category === c.category;
              return (
                <button
                  type="button"
                  key={c.category}
                  onClick={() => setCategory(active ? "all" : c.category)}
                  title={active ? "Clear filter" : `Filter by ${c.category}`}
                  className={`rounded-xl border p-3 text-left transition-all hover:bg-white/[0.06] ${
                    active
                      ? "border-brand-400/50 bg-white/[0.06] ring-1 ring-brand-400/40"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-[11px] uppercase tracking-wider ${active ? "text-brand-300" : "text-white/55"}`}>
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
                </button>
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
                            CATEGORY_TONES[a.category] || "from-brand-500 to-accent-pink"
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
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setAdjusting(a)}
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                          >
                            Adjust
                          </button>
                          <button
                            onClick={() => setItemForm(a)}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs hover:bg-white/10"
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          <button
                            disabled={rowBusy === a.id}
                            onClick={() => removeItem(a)}
                            title="Delete item"
                            className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-rose-300 hover:bg-rose-500/15 disabled:opacity-50"
                          >
                            <Trash2 size={13} />
                          </button>
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

      <ProcurementSection onStockChanged={refetch} />

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
        {itemForm && (
          <ItemFormModal
            item={itemForm === "new" ? null : itemForm}
            categories={data?.categories || []}
            onCategoriesChanged={refetch}
            onClose={() => setItemForm(null)}
            onSaved={() => {
              setItemForm(null);
              refetch();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const PO_STATUS_TONES = {
  Ordered: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  Received: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Cancelled: "bg-white/10 text-white/55 ring-white/20",
};

function ProcurementSection({ onStockChanged }) {
  const alerts = useApi(endpoints.inventoryAlerts, []);
  const vendors = useApi(endpoints.inventoryVendors, []);
  const purchases = useApi(endpoints.inventoryPurchases, []);
  const [creating, setCreating] = useState(null); // false | true | prefill item
  const [busyId, setBusyId] = useState(null);
  useRealtime("inventory.changed", () => {
    alerts.refetch();
    vendors.refetch();
    purchases.refetch();
  });

  const refreshAll = () => {
    alerts.refetch();
    vendors.refetch();
    purchases.refetch();
    onStockChanged?.();
  };

  const act = async (id, action) => {
    setBusyId(id);
    try {
      await endpoints.inventoryPurchaseAction(id, action);
      refreshAll();
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    } finally {
      setBusyId(null);
    }
  };

  const alertItems = alerts.data?.items || [];
  const poItems = purchases.data?.items || [];

  return (
    <>
      {alertItems.length > 0 && (
        <div className="card border border-rose-400/30">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-300" />
            <div className="font-display font-semibold">
              Low-stock alerts · {alertItems.length} item{alertItems.length === 1 ? "" : "s"}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {alertItems.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div>
                  <div className="text-sm font-medium">{a.name}</div>
                  <div className="text-[11px] text-white/50">
                    {a.qty} {a.unit} left · reorder at {a.reorder}
                  </div>
                </div>
                <button
                  onClick={() => setCreating({ ...a, qtyDefault: a.suggestedQty })}
                  className="inline-flex items-center gap-1 rounded-md bg-brand-500/20 px-2 py-1 text-[11px] font-medium text-brand-200 ring-1 ring-brand-400/30 hover:bg-brand-500/30"
                >
                  <ShoppingCart size={12} /> Reorder
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} className="text-brand-300" />
              <div className="font-display font-semibold">Purchase orders</div>
            </div>
            <button onClick={() => setCreating(true)} className="btn-primary px-3 py-1.5 text-sm">
              <Plus size={14} /> New PO
            </button>
          </div>
          {purchases.loading ? (
            <Skeleton className="h-32" />
          ) : poItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-white/40">
              No purchase orders yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-wider text-white/50">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">Vendor</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Total</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {poItems.map((p) => (
                    <tr key={p.id} className="border-t border-white/5">
                      <td className="px-3 py-2">
                        <div className="font-medium">{p.itemName}</div>
                        <div className="text-[10px] font-mono text-white/40">{p.id} · {p.orderedOn}</div>
                      </td>
                      <td className="px-3 py-2 text-white/70">{p.vendor}</td>
                      <td className="px-3 py-2 text-right">{p.qty}</td>
                      <td className="px-3 py-2 text-right font-mono">{inr(p.total)}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${PO_STATUS_TONES[p.status]}`}>{p.status}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-1.5">
                          {p.status === "Ordered" && (
                            <>
                              <button disabled={busyId === p.id} onClick={() => act(p.id, "receive")} className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-400/30 hover:bg-emerald-500/25 disabled:opacity-50">
                                <Truck size={12} /> Receive
                              </button>
                              <button disabled={busyId === p.id} onClick={() => act(p.id, "cancel")} className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-1 text-[11px] font-medium text-rose-300 ring-1 ring-rose-400/20 hover:bg-rose-500/20 disabled:opacity-50">
                                <Ban size={12} />
                              </button>
                            </>
                          )}
                          {p.status === "Received" && <CheckCircle2 size={14} className="text-emerald-400" />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="mb-3 flex items-center gap-2">
            <Building2 size={16} className="text-accent-violet" />
            <div className="font-display font-semibold">Vendors</div>
          </div>
          {vendors.loading ? (
            <Skeleton className="h-32" />
          ) : (
            <div className="space-y-2">
              {(vendors.data?.items || []).map((v) => (
                <div key={v.vendor} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{v.vendor}</div>
                    <div className="text-[11px] text-white/55">{v.skus} SKUs</div>
                  </div>
                  <div className="mt-0.5 text-[11px] text-white/50">
                    Stock {inr(v.stockValue)}
                    {v.openOrders > 0 && <> · {v.openOrders} open PO ({inr(v.openValue)})</>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {creating && (
          <NewPurchaseModal
            prefill={creating === true ? null : creating}
            onClose={() => setCreating(null)}
            onCreated={() => {
              setCreating(null);
              refreshAll();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function NewPurchaseModal({ prefill, onClose, onCreated }) {
  const allItems = useApi(() => endpoints.inventory({}), []);
  const [itemId, setItemId] = useState(prefill?.id || "");
  const [vendor, setVendor] = useState(prefill?.vendor || "");
  const [qty, setQty] = useState(prefill?.qtyDefault || 1);
  const [unitPrice, setUnitPrice] = useState(prefill?.price || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const items = allItems.data?.items || [];
  useEffect(() => {
    if (!itemId && items.length && !prefill) {
      setItemId(items[0].id);
      setVendor(items[0].vendor);
      setUnitPrice(items[0].price);
    }
  }, [items, itemId, prefill]);

  const pickItem = (id) => {
    setItemId(id);
    const it = items.find((x) => x.id === id);
    if (it) {
      setVendor(it.vendor);
      setUnitPrice(it.price);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await endpoints.inventoryPurchaseAdd({
        itemId,
        vendor,
        qty: Number(qty),
        unitPrice: Number(unitPrice),
      });
      onCreated();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  const cls = "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur"
      onClick={onClose}
    >
      <motion.form
        initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()} onSubmit={submit}
        className="glass-card relative w-full max-w-md p-6"
      >
        <button type="button" onClick={onClose} className="absolute right-3 top-3 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white">
          <X size={16} />
        </button>
        <div className="mb-1 text-xs uppercase tracking-[0.2em] text-white/55">Procurement</div>
        <div className="font-display text-xl font-bold">New purchase order</div>

        <div className="mt-5 space-y-3">
          <label className="block">
            <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">Item</div>
            <select value={itemId} onChange={(e) => pickItem(e.target.value)} className={cls} disabled={!!prefill}>
              {prefill && <option value={prefill.id}>{prefill.name}</option>}
              {!prefill && items.map((it) => <option key={it.id} value={it.id}>{it.name} ({it.sku})</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">Quantity</div>
              <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} className={cls} required />
            </label>
            <label className="block">
              <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">Unit price (₹)</div>
              <input type="number" min="0" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className={cls} required />
            </label>
          </div>
          <label className="block">
            <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">Vendor</div>
            <input value={vendor} onChange={(e) => setVendor(e.target.value)} className={cls} />
          </label>
          <div className="rounded-lg bg-white/[0.04] px-3 py-2 text-sm text-white/70">
            Order total: <span className="font-display font-bold text-white">{inr(Number(qty || 0) * Number(unitPrice || 0))}</span>
          </div>
        </div>

        {err && <div className="mt-3 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">{err}</div>}

        <button disabled={busy || !itemId} className="btn-primary mt-5 w-full disabled:opacity-50">
          {busy ? "Creating…" : "Create purchase order"}
        </button>
      </motion.form>
    </motion.div>
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

// Create / edit a catalog item (SKU). Quantity is only set on creation as the
// opening stock; afterwards it changes through Adjust or by receiving a PO.
function ItemFormModal({ item, categories, onCategoriesChanged, onClose, onSaved }) {
  const isNew = !item;
  const [cats, setCats] = useState(categories.length ? categories : ["Computers"]);
  const [form, setForm] = useState({
    name: item?.name || "",
    category: item?.category || cats[0],
    unit: item?.unit || "unit",
    price: item?.price ?? "",
    qty: item?.qty ?? 0,
    reorder: item?.reorder ?? 0,
    vendor: item?.vendor && item.vendor !== "—" ? item.vendor : "",
    sku: item?.sku || "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [addingCat, setAddingCat] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [catBusy, setCatBusy] = useState(false);
  const [catErr, setCatErr] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const cls = "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10";

  const addCat = async () => {
    const name = newCat.trim();
    if (!name) return;
    setCatBusy(true);
    setCatErr(null);
    try {
      const res = await endpoints.inventoryCategoryAdd(name);
      setCats(res.categories || [...cats, name]);
      setForm((f) => ({ ...f, category: name }));
      setNewCat("");
      setAddingCat(false);
      onCategoriesChanged?.();
    } catch (e) {
      setCatErr(e.response?.data?.error || e.message);
    } finally {
      setCatBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const payload = {
        name: form.name,
        category: form.category,
        unit: form.unit,
        price: Number(form.price) || 0,
        reorder: Number(form.reorder) || 0,
        vendor: form.vendor,
        sku: form.sku.trim() || undefined,
      };
      if (isNew) {
        payload.qty = Number(form.qty) || 0;
        await endpoints.inventoryItemAdd(payload);
      } else {
        await endpoints.inventoryItemUpdate(item.id, payload);
      }
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
        <button type="button" onClick={onClose} className="absolute right-3 top-3 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white">
          <X size={16} />
        </button>
        <div className="mb-1 text-xs uppercase tracking-[0.2em] text-white/55">Catalog</div>
        <div className="font-display text-xl font-bold">{isNew ? "New inventory item" : `Edit ${item.sku}`}</div>

        <div className="mt-5 space-y-3">
          <label className="block">
            <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">Item name</div>
            <input value={form.name} onChange={set("name")} className={cls} required placeholder="e.g. Dell Latitude 7430" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-white/55">Category</span>
                <button
                  type="button"
                  onClick={() => { setAddingCat((v) => !v); setCatErr(null); }}
                  className="text-[11px] font-medium text-brand-300 hover:text-brand-200"
                >
                  {addingCat ? "Pick existing" : "+ New"}
                </button>
              </div>
              {addingCat ? (
                <div className="flex gap-1.5">
                  <input
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCat(); } }}
                    placeholder="New category"
                    className={cls}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={addCat}
                    disabled={catBusy || !newCat.trim()}
                    className="shrink-0 rounded-xl bg-brand-500/20 px-3 text-xs font-medium text-brand-200 ring-1 ring-brand-400/30 hover:bg-brand-500/30 disabled:opacity-50"
                  >
                    {catBusy ? "…" : "Add"}
                  </button>
                </div>
              ) : (
                <select value={form.category} onChange={set("category")} className={cls}>
                  {cats.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
              {catErr && <div className="mt-1 text-[10px] text-rose-300">{catErr}</div>}
            </div>
            <label className="block">
              <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">Unit</div>
              <input value={form.unit} onChange={set("unit")} className={cls} placeholder="unit / piece / box…" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">Unit price (₹)</div>
              <input type="number" min="0" value={form.price} onChange={set("price")} className={cls} required />
            </label>
            <label className="block">
              <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">Reorder at</div>
              <input type="number" min="0" value={form.reorder} onChange={set("reorder")} className={cls} required />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {isNew && (
              <label className="block">
                <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">Opening qty</div>
                <input type="number" min="0" value={form.qty} onChange={set("qty")} className={cls} required />
              </label>
            )}
            <label className="block">
              <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">SKU {isNew && "(optional)"}</div>
              <input value={form.sku} onChange={set("sku")} className={cls} placeholder={isNew ? "auto-generated" : ""} />
            </label>
          </div>
          <label className="block">
            <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">Vendor</div>
            <input value={form.vendor} onChange={set("vendor")} className={cls} placeholder="Supplier name" />
          </label>
        </div>

        {err && <div className="mt-3 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">{err}</div>}

        <button disabled={busy} className="btn-primary mt-5 w-full disabled:opacity-50">
          {busy ? "Saving…" : isNew ? "Create item" : "Save changes"}
        </button>
      </motion.form>
    </motion.div>
  );
}
