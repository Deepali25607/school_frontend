import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  UtensilsCrossed,
  Coffee,
  Sandwich,
  Soup,
  Leaf,
  Drumstick,
  AlertTriangle,
  Sparkles as SparklesIcon,
  Flame,
  CircleDollarSign,
  Users,
  Calendar,
  Search,
  Filter,
  Save,
  X,
  ShieldAlert,
  ShoppingCart,
  Plus,
  Check,
  Ban,
  Receipt,
  ChefHat,
  CheckCircle2,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const MEAL_ICONS = {
  Breakfast: Coffee,
  Lunch: UtensilsCrossed,
  Snack: Sandwich,
  Dinner: Soup,
};

const MEAL_TINTS = {
  Breakfast: "from-amber-500/20",
  Lunch: "from-brand-500/20",
  Snack: "from-emerald-500/20",
  Dinner: "from-accent-violet/20",
};

const PLAN_TONES = {
  Veg: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  "Non-veg": "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  Eggetarian: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  Jain: "bg-orange-500/15 text-orange-200 ring-orange-400/30",
  Vegan: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  None: "bg-white/5 text-white/55 ring-white/15",
};

export default function Cafeteria() {
  const { user } = useAuth();
  const canEditMenu = ["admin", "principal", "hr"].includes(user?.role);

  const [tab, setTab] = useState("today");
  const [subsSpecialDiet, setSubsSpecialDiet] = useState(false); // preset for the Subscribers view, driven by KPI cards

  const { data, loading, error, refetch } = useApi(endpoints.cafeteriaMenu, []);
  useRealtime("cafeteria.changed", () => refetch());

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Wellbeing"
        title="Cafeteria & Mess"
        subtitle={
          data
            ? `Today is ${data.today} · ${data.summary?.todayCalories || 0} kcal across all meals`
            : "Loading menu…"
        }
      />

      {error && <ErrorState error={error} onRetry={refetch} />}

      {/* Summary tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile icon={UtensilsCrossed} label="Meals today" value={loading ? "—" : data?.summary?.todayMeals} tint="from-brand-500/30" />
        <StatTile icon={Flame} label="kcal (total)" value={loading ? "—" : data?.summary?.todayCalories} tint="from-amber-500/30" />
        <button type="button" onClick={() => { setSubsSpecialDiet(true); setTab("subscribers"); }} className={`block w-full rounded-2xl text-left transition-all ${tab === "subscribers" && subsSpecialDiet ? "ring-1 ring-brand-400/50" : ""}`}>
          <StatTile icon={AlertTriangle} label="Allergy risks" value={loading ? "—" : data?.summary?.atRiskToday} tint="from-rose-500/30" pulse={data?.summary?.atRiskToday > 0} />
        </button>
        <button type="button" onClick={() => { setSubsSpecialDiet(false); setTab("subscribers"); }} className={`block w-full rounded-2xl text-left transition-all ${tab === "subscribers" && !subsSpecialDiet ? "ring-1 ring-brand-400/50" : ""}`}>
          <StatTile icon={Leaf} label="Vegetarians" value={loading ? "—" : (data?.summary?.byMealPlan?.Veg || 0) + (data?.summary?.byMealPlan?.Vegan || 0) + (data?.summary?.byMealPlan?.Jain || 0)} tint="from-emerald-500/30" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
        <TabButton active={tab === "today"} onClick={() => setTab("today")} icon={Coffee}>
          Today
        </TabButton>
        <TabButton active={tab === "week"} onClick={() => setTab("week")} icon={Calendar}>
          Week
        </TabButton>
        <TabButton active={tab === "subscribers"} onClick={() => setTab("subscribers")} icon={Users}>
          Subscribers
        </TabButton>
        <TabButton active={tab === "orders"} onClick={() => setTab("orders")} icon={ShoppingCart}>
          Pre-orders
        </TabButton>
      </div>

      <AnimatePresence mode="wait">
        {tab === "today" && data && (
          <motion.div key="today" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <TodayView data={data} canEditMenu={canEditMenu} onChanged={refetch} />
          </motion.div>
        )}
        {tab === "week" && data && (
          <motion.div key="week" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <WeekView week={data.week} today={data.today} canEditMenu={canEditMenu} onChanged={refetch} />
          </motion.div>
        )}
        {tab === "subscribers" && (
          <motion.div key={`subs-${subsSpecialDiet}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <SubscribersView initialSpecialDiet={subsSpecialDiet} />
          </motion.div>
        )}
        {tab === "orders" && (
          <motion.div key="orders" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <OrdersView week={data?.week} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
        active
          ? "bg-gradient-to-r from-brand-500/30 to-accent-violet/20 text-white ring-1 ring-white/15"
          : "text-white/65 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon size={13} /> {children}
    </button>
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

// ============== TODAY ==============
function TodayView({ data, canEditMenu, onChanged }) {
  const { today } = data;
  const todayMeals = data.week.find((d) => d.day === today)?.meals || {};
  const order = ["Breakfast", "Lunch", "Snack", "Dinner"];
  const [editing, setEditing] = useState(null);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {order.map((meal) => {
          const m = todayMeals[meal];
          if (!m) return null;
          return (
            <MealCard
              key={meal}
              meal={meal}
              day={today}
              m={m}
              canEditMenu={canEditMenu}
              onEdit={() => setEditing({ day: today, meal, m })}
            />
          );
        })}
      </div>

      <AnimatePresence>
        {editing && (
          <EditMealModal
            day={editing.day}
            meal={editing.meal}
            initial={editing.m}
            allergens={data.commonAllergens}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              onChanged();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MealCard({ meal, day, m, canEditMenu, onEdit, compact }) {
  const Icon = MEAL_ICONS[meal] || UtensilsCrossed;
  return (
    <div className={`card relative overflow-hidden ${compact ? "p-3" : ""}`}>
      <div className={`pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br ${MEAL_TINTS[meal]} to-transparent blur-2xl`} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
              <Icon size={15} />
            </div>
            <div>
              <div className="font-display text-base font-bold">{meal}</div>
              <div className="text-[10px] uppercase tracking-wider text-white/55">{day}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {m.vegetarian ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                <Leaf size={9} /> Veg
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-rose-300 ring-1 ring-rose-400/30">
                <Drumstick size={9} /> Non-veg
              </span>
            )}
            {canEditMenu && onEdit && (
              <button
                onClick={onEdit}
                className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] hover:bg-white/10"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        <ul className={`mt-3 space-y-1 ${compact ? "text-[11px]" : "text-sm"}`}>
          {m.items.map((it, i) => (
            <li key={i} className="flex items-center gap-2 text-white/85">
              <span className="inline-block h-1 w-1 rounded-full bg-white/40" />
              {it}
            </li>
          ))}
        </ul>

        <div className={`mt-3 flex items-center justify-between ${compact ? "text-[10px]" : "text-xs"} text-white/55`}>
          <span className="inline-flex items-center gap-1">
            <Flame size={11} className="text-amber-300" />
            {m.calories} kcal
          </span>
          <span className="inline-flex items-center gap-1">
            <CircleDollarSign size={11} className="text-emerald-300" />
            ₹{m.cost}
          </span>
        </div>

        {m.allergens && m.allergens.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {m.allergens.map((a) => (
              <span key={a} className="inline-flex items-center gap-0.5 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-200 ring-1 ring-amber-400/30">
                <AlertTriangle size={8} /> {a}
              </span>
            ))}
          </div>
        )}

        {m.atRisk && m.atRisk.length > 0 && (
          <div className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/10 p-2">
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-rose-300">
              <ShieldAlert size={10} /> Allergy alert — {m.atRisk.length} {m.atRisk.length === 1 ? "student" : "students"}
            </div>
            <div className="mt-1 space-y-0.5">
              {m.atRisk.slice(0, 4).map((r) => (
                <Link
                  key={r.studentId}
                  to={`/app/students/${r.studentId}`}
                  className="block text-[11px] text-rose-200 hover:underline"
                >
                  {r.studentName} ({r.studentId}) — allergic to {r.flaggedAllergens.join(", ")}
                </Link>
              ))}
              {m.atRisk.length > 4 && (
                <div className="text-[10px] text-rose-300/70">+ {m.atRisk.length - 4} more</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============== WEEK ==============
function WeekView({ week, today, canEditMenu, onChanged }) {
  const [editing, setEditing] = useState(null);
  return (
    <div className="space-y-3">
      {week.map((d) => (
        <div key={d.day} className={`card relative overflow-hidden ${d.day === today ? "ring-1 ring-brand-400/40" : ""}`}>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="font-display text-lg font-bold">{d.day}</div>
              {d.day === today && (
                <span className="rounded-full bg-gradient-to-r from-brand-500/30 to-accent-violet/20 px-2 py-0.5 text-[10px] font-medium ring-1 ring-white/15">
                  Today
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
            {["Breakfast", "Lunch", "Snack", "Dinner"].map((meal) => {
              const m = d.meals[meal];
              if (!m) return null;
              const Icon = MEAL_ICONS[meal];
              return (
                <button
                  key={meal}
                  onClick={() => canEditMenu && setEditing({ day: d.day, meal, m })}
                  disabled={!canEditMenu}
                  className={`rounded-xl border border-white/5 bg-white/[0.03] p-3 text-left transition-all ${canEditMenu ? "hover:border-white/15 hover:bg-white/[0.06]" : "cursor-default"}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={13} className="text-white/55" />
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-white/70">{meal}</div>
                    {m.vegetarian ? (
                      <Leaf size={10} className="ml-auto text-emerald-300" />
                    ) : (
                      <Drumstick size={10} className="ml-auto text-rose-300" />
                    )}
                  </div>
                  <ul className="mt-2 space-y-0.5 text-[11px] text-white/65">
                    {m.items.slice(0, 4).map((it, i) => (
                      <li key={i} className="truncate">· {it}</li>
                    ))}
                    {m.items.length > 4 && (
                      <li className="text-white/40">+ {m.items.length - 4} more</li>
                    )}
                  </ul>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-white/45">
                    <span>{m.calories} kcal</span>
                    <span>₹{m.cost}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <AnimatePresence>
        {editing && (
          <EditMealModal
            day={editing.day}
            meal={editing.meal}
            initial={editing.m}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              onChanged();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============== EDIT MEAL MODAL ==============
function EditMealModal({ day, meal, initial, allergens = [], onClose, onSaved }) {
  const [form, setForm] = useState({
    items: initial.items.join("\n"),
    vegetarian: initial.vegetarian,
    allergens: [...(initial.allergens || [])],
    calories: initial.calories,
    cost: initial.cost,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const toggleAllergen = (a) =>
    set(
      "allergens",
      form.allergens.includes(a)
        ? form.allergens.filter((x) => x !== a)
        : [...form.allergens, a]
    );

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await endpoints.cafeteriaMealUpdate(day, meal, {
        items: form.items.split("\n").map((s) => s.trim()).filter(Boolean),
        vegetarian: form.vegetarian,
        allergens: form.allergens,
        calories: Number(form.calories) || 0,
        cost: Number(form.cost) || 0,
      });
      onSaved();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  const ALLERGEN_OPTIONS =
    allergens.length > 0
      ? allergens
      : [
          "Peanuts",
          "Tree nuts",
          "Dairy",
          "Eggs",
          "Wheat / Gluten",
          "Soy",
          "Shellfish",
          "Sesame",
          "Mustard",
        ];

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
        <div className="mb-1 text-xs uppercase tracking-[0.2em] text-white/55">
          Edit menu
        </div>
        <div className="font-display text-xl font-bold">{day} · {meal}</div>

        <div className="mt-5 space-y-3">
          <Field label="Items (one per line)">
            <textarea
              value={form.items}
              onChange={(e) => set("items", e.target.value)}
              rows={5}
              className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60"
              required
            />
          </Field>

          <Field label="Vegetarian?">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => set("vegetarian", true)}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm transition-all ${
                  form.vegetarian
                    ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                    : "border-white/10 bg-white/5 text-white/55 hover:bg-white/10"
                }`}
              >
                <Leaf size={13} className="inline mr-1" /> Vegetarian
              </button>
              <button
                type="button"
                onClick={() => set("vegetarian", false)}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm transition-all ${
                  !form.vegetarian
                    ? "border-rose-400/40 bg-rose-500/15 text-rose-200"
                    : "border-white/10 bg-white/5 text-white/55 hover:bg-white/10"
                }`}
              >
                <Drumstick size={13} className="inline mr-1" /> Non-veg
              </button>
            </div>
          </Field>

          <Field label="Allergens">
            <div className="flex flex-wrap gap-1">
              {ALLERGEN_OPTIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAllergen(a)}
                  className={`rounded-md px-2 py-0.5 text-[11px] ring-1 transition-all ${
                    form.allergens.includes(a)
                      ? "bg-amber-500/15 text-amber-200 ring-amber-400/30"
                      : "bg-white/5 text-white/55 ring-white/10 hover:bg-white/10"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Calories">
              <input
                type="number"
                value={form.calories}
                onChange={(e) => set("calories", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
              />
            </Field>
            <Field label="Cost (₹)">
              <input
                type="number"
                value={form.cost}
                onChange={(e) => set("cost", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
              />
            </Field>
          </div>
        </div>

        {err && (
          <div className="mt-3 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
            {err}
          </div>
        )}

        <button disabled={busy} className="btn-primary mt-5 w-full">
          <Save size={13} /> {busy ? "Saving…" : "Save menu"}
        </button>
      </motion.form>
    </motion.div>
  );
}

// ============== SUBSCRIBERS ==============
function SubscribersView({ initialSpecialDiet = false }) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [mealPlan, setMealPlan] = useState("all");
  const [specialDietOnly, setSpecialDietOnly] = useState(initialSpecialDiet);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const { data, loading, error, refetch } = useApi(
    () =>
      endpoints.cafeteriaPreferences({
        q: debounced,
        mealPlan,
        specialDiet: specialDietOnly ? "true" : undefined,
      }),
    [debounced, mealPlan, specialDietOnly]
  );

  useRealtime("cafeteria.changed", () => refetch());

  const items = data?.items || [];
  const summary = data?.summary;

  return (
    <div className="space-y-4">
      {error && <ErrorState error={error} onRetry={refetch} />}

      {/* Meal-plan distribution */}
      {summary && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
          {(data?.mealPlans || []).map((p) => {
            const active = mealPlan === p;
            return (
              <button
                type="button"
                key={p}
                onClick={() => setMealPlan(active ? "all" : p)}
                title={active ? "Show all plans" : `Filter to ${p}`}
                className={`rounded-lg border p-2 text-left transition-all hover:bg-white/[0.06] ${
                  active ? "border-brand-400/50 bg-white/[0.06] ring-1 ring-brand-400/40" : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <div className="text-[10px] uppercase tracking-wider text-white/55">{p}</div>
                <div className="font-display text-xl font-bold">
                  {summary.byMealPlan?.[p] || 0}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={14} className="text-white/55" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by student name or ID…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-white/55" />
          <select
            value={mealPlan}
            onChange={(e) => setMealPlan(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">All plans</option>
            {(data?.mealPlans || []).map((p) => <option key={p}>{p}</option>)}
          </select>
          <button
            onClick={() => setSpecialDietOnly(!specialDietOnly)}
            className={`rounded-xl border px-3 py-2 text-sm transition-all ${
              specialDietOnly
                ? "border-amber-400/40 bg-amber-500/15 text-amber-200"
                : "border-white/10 bg-white/5 text-white/65 hover:bg-white/10"
            }`}
          >
            Special diet only
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center text-white/55">
          <SparklesIcon className="mx-auto mb-2 text-accent-gold" size={20} />
          No students match this filter.
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((s, i) => (
            <motion.div
              key={s.studentId}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 16) * 0.015 }}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-2.5"
            >
              <Link
                to={`/app/students/${s.studentId}`}
                className="flex flex-1 items-center gap-3 hover:text-brand-300"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-violet text-[10px] font-bold text-white">
                  {s.studentAvatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{s.studentName}</div>
                  <div className="text-[10px] text-white/45">
                    {s.studentId} · Grade {s.studentGrade}-{s.studentSection}
                  </div>
                </div>
              </Link>
              <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${PLAN_TONES[s.mealPlan]}`}>
                {s.mealPlan}
              </span>
              {s.specialDiet && (
                <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-200 ring-1 ring-amber-400/30">
                  {s.specialDiet}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============== PRE-ORDERS ==============
//
// Two layouts: parents/students see a "book a meal" panel + their own
// upcoming/past orders. Staff (admin/principal/hr) see a date-scoped
// view with headcount tiles + every active order across all students.

const MEALS_ORDER = ["Breakfast", "Lunch", "Snack", "Dinner"];

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function isoPlusDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const STATUS_TONES = {
  pending: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
  confirmed: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  served: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  cancelled: "bg-white/5 text-white/45 ring-white/10",
};

function OrdersView({ week }) {
  const { user } = useAuth();
  const isParent = user?.role === "parent";
  const isStudent = user?.role === "student";
  const isStaff = ["admin", "principal", "hr"].includes(user?.role);
  const canMarkPaid = ["admin", "principal", "accountant"].includes(user?.role);

  const myStudents = useMemo(() => {
    if (isParent) return user?.scope?.children || [];
    if (isStudent && user?.scope?.studentId) {
      return [
        {
          id: user.scope.studentId,
          name: user.name,
          grade: user.scope.grade,
          section: user.scope.section,
        },
      ];
    }
    return [];
  }, [user, isParent, isStudent]);

  const canBookForSelf = isParent || isStudent;

  // staff filters
  const [staffDate, setStaffDate] = useState(isoToday());

  // own-view local state
  const [pickedDate, setPickedDate] = useState(isoToday());
  const [pickedStudent, setPickedStudent] = useState(myStudents[0]?.id || "");
  const [pickedMeal, setPickedMeal] = useState("Lunch");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [bookErr, setBookErr] = useState(null);
  const [ok, setOk] = useState(null);

  useEffect(() => {
    if (!pickedStudent && myStudents[0]?.id) {
      setPickedStudent(myStudents[0].id);
    }
  }, [myStudents, pickedStudent]);

  // Orders feed — staff: by date; non-staff: their own + upcoming.
  const ordersParams = useMemo(() => {
    if (isStaff) return { date: staffDate };
    if (isParent || isStudent) return { studentId: pickedStudent || undefined };
    return {};
  }, [isStaff, isParent, isStudent, staffDate, pickedStudent]);

  const { data, loading, error, refetch } = useApi(
    () => endpoints.cafeteriaOrders(ordersParams),
    [JSON.stringify(ordersParams)]
  );

  const summaryReq = useApi(
    () => (isStaff ? endpoints.cafeteriaOrdersSummary(staffDate) : Promise.resolve(null)),
    [isStaff, staffDate]
  );

  useRealtime("cafeteria.changed", () => {
    refetch();
    if (isStaff) summaryReq.refetch();
  });

  // The selected day's menu — used to preview what they'll actually be
  // served before they tap "Place order".
  const previewMeal = useMemo(() => {
    if (!week) return null;
    const d = new Date(pickedDate + "T00:00:00");
    if (Number.isNaN(d.getTime())) return null;
    const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
    const dayName = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][dayIdx];
    const dayMenu = week.find((w) => w.day === dayName);
    return dayMenu?.meals?.[pickedMeal] || null;
  }, [week, pickedDate, pickedMeal]);

  const placeOrder = async (e) => {
    e.preventDefault();
    setBookErr(null);
    setOk(null);
    if (!pickedStudent) {
      setBookErr("Pick a student first");
      return;
    }
    setBusy(true);
    try {
      const order = await endpoints.cafeteriaOrderCreate({
        studentId: pickedStudent,
        date: pickedDate,
        meal: pickedMeal,
        notes: notes.trim(),
      });
      setOk(`Booked ${order.meal} for ${order.date} · ₹${order.cost}`);
      setNotes("");
      refetch();
      setTimeout(() => setOk(null), 3500);
    } catch (e) {
      setBookErr(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (id) => {
    try {
      await endpoints.cafeteriaOrderCancel(id);
      refetch();
    } catch (e) {
      alert(e?.response?.data?.error || e.message);
    }
  };

  const serve = async (id) => {
    try {
      await endpoints.cafeteriaOrderServe(id);
      refetch();
      summaryReq.refetch();
    } catch (e) {
      alert(e?.response?.data?.error || e.message);
    }
  };

  const togglePaid = async (o) => {
    try {
      await endpoints.cafeteriaOrderPayment(
        o.id,
        o.paymentStatus === "paid" ? "unpaid" : "paid"
      );
      refetch();
      summaryReq.refetch();
    } catch (e) {
      alert(e?.response?.data?.error || e.message);
    }
  };

  const items = data?.items || [];
  const summary = summaryReq.data;

  return (
    <div className="space-y-4">
      {error && <ErrorState error={error} onRetry={refetch} />}

      {/* Booking panel — only for parents/students with at least one child */}
      {canBookForSelf && myStudents.length > 0 && (
        <div className="card">
          <div className="mb-3 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500/30 to-accent-violet/30 ring-1 ring-white/10">
              <ShoppingCart size={16} className="text-brand-200" />
            </div>
            <div>
              <div className="font-display text-base font-semibold text-white">
                Book a meal
              </div>
              <div className="text-xs text-white/55">
                Lock in tomorrow's plate — pay at the counter or settle online.
              </div>
            </div>
          </div>

          <form onSubmit={placeOrder} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              {myStudents.length > 1 ? (
                <Field label="For student">
                  <select
                    value={pickedStudent}
                    onChange={(e) => setPickedStudent(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/50"
                  >
                    {myStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : (
                <Field label="For student">
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80">
                    {myStudents[0]?.name || "—"}
                  </div>
                </Field>
              )}
              <Field label="Date">
                <input
                  type="date"
                  min={isoToday()}
                  max={isoPlusDays(13)}
                  value={pickedDate}
                  onChange={(e) => setPickedDate(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none [color-scheme:dark]"
                />
              </Field>
              <Field label="Meal">
                <select
                  value={pickedMeal}
                  onChange={(e) => setPickedMeal(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/50"
                >
                  {MEALS_ORDER.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </Field>
              <Field label="Notes (optional)">
                <input
                  type="text"
                  maxLength={280}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="No onion, half portion…"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-brand-400/50"
                />
              </Field>
            </div>

            {previewMeal ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/80">
                    <Receipt size={14} className="text-brand-300" />
                    Today's {pickedMeal.toLowerCase()}
                  </div>
                  <div className="font-display text-base font-semibold text-white">
                    ₹{previewMeal.cost}
                  </div>
                </div>
                <div className="mt-1 text-xs text-white/65">
                  {(previewMeal.items || []).join(" · ")}
                </div>
                {previewMeal.allergens?.length > 0 && (
                  <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-amber-200">
                    <AlertTriangle size={10} />
                    {previewMeal.allergens.join(", ")}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/55">
                No menu set yet for that date/meal.
              </div>
            )}

            {bookErr && (
              <div className="flex items-start gap-2 rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-400/30">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                <span>{bookErr}</span>
              </div>
            )}
            {ok && (
              <div className="flex items-start gap-2 rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300 ring-1 ring-emerald-400/30">
                <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
                <span>{ok}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-xs text-white/45">
                Orders can be cancelled any time before they're marked served.
              </div>
              <button
                type="submit"
                disabled={busy || !previewMeal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-500 to-accent-violet px-4 py-2 text-sm font-semibold text-white shadow shadow-brand-500/20 disabled:opacity-50"
              >
                <Plus size={14} />
                {busy ? "Booking…" : "Place order"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff: per-day headcount tiles */}
      {isStaff && (
        <>
          <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <ChefHat size={16} className="text-brand-300" />
              <div>
                <div className="text-sm font-semibold text-white">
                  Kitchen view
                </div>
                <div className="text-xs text-white/55">
                  Headcount, payment and service progress by meal.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-white/55" />
              <input
                type="date"
                value={staffDate}
                onChange={(e) => setStaffDate(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {MEALS_ORDER.map((m) => {
              const Icon = MEAL_ICONS[m];
              const s = summary?.byMeal?.[m];
              return (
                <div
                  key={m}
                  className="card relative overflow-hidden"
                >
                  <div
                    className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${MEAL_TINTS[m]} to-transparent blur-2xl`}
                  />
                  <div className="relative">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/55">
                      <Icon size={12} /> {m}
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <div className="stat-num glow-text">
                        {s?.count ?? 0}
                      </div>
                      <div className="text-xs text-white/55">orders</div>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] text-white/65">
                      <div>
                        <div className="text-white/45">served</div>
                        <div className="font-semibold text-emerald-300">
                          {s?.served ?? 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/45">paid</div>
                        <div className="font-semibold text-brand-300">
                          {s?.paid ?? 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/45">unpaid</div>
                        <div className="font-semibold text-amber-300">
                          {s?.unpaid ?? 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {summary && summary.totalOrders > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/65">
              <CircleDollarSign className="mr-1.5 inline" size={12} />
              Revenue for {summary.date}:{" "}
              <span className="font-semibold text-white">
                ₹{summary.totalRevenue.toLocaleString()}
              </span>
            </div>
          )}
        </>
      )}

      {/* Orders feed */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-white/55">
            {isStaff
              ? `Orders for ${staffDate}`
              : canBookForSelf
              ? "Your orders"
              : "All orders"}
          </div>
          <div className="text-xs text-white/45">
            {loading ? "Loading…" : `${items.length} total`}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="card text-center text-white/55">
            <SparklesIcon className="mx-auto mb-2 text-accent-gold" size={20} />
            {canBookForSelf
              ? "No orders yet — pick a date and meal above to book one."
              : "No orders for this date."}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((o, i) => (
              <OrderRow
                key={o.id}
                o={o}
                idx={i}
                isStaff={isStaff}
                canMarkPaid={canMarkPaid}
                onCancel={() => cancel(o.id)}
                onServe={() => serve(o.id)}
                onTogglePaid={() => togglePaid(o)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderRow({ o, idx, isStaff, canMarkPaid, onCancel, onServe, onTogglePaid }) {
  const Icon = MEAL_ICONS[o.meal] || UtensilsCrossed;
  const canCancel = o.status !== "served" && o.status !== "cancelled";
  const canServe = isStaff && o.status !== "served" && o.status !== "cancelled";
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx, 16) * 0.015 }}
      className={`flex flex-col gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-3 md:flex-row md:items-center ${
        o.status === "cancelled" ? "opacity-55" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={`grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br ${MEAL_TINTS[o.meal] || "from-white/10"} to-transparent ring-1 ring-white/10`}>
          <Icon size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-white">{o.meal}</span>
            <span className="text-white/45">·</span>
            <span className="text-white/70">{o.date}</span>
            {o.vegetarian ? (
              <Leaf size={12} className="text-emerald-300" />
            ) : (
              <Drumstick size={12} className="text-rose-300" />
            )}
          </div>
          <div className="truncate text-[11px] text-white/55">
            {(o.items || []).join(" · ")}
          </div>
          {isStaff && (
            <div className="mt-0.5 text-[10px] text-white/45">
              Student: {o.studentId} · Order {o.id}
            </div>
          )}
          {o.notes && (
            <div className="mt-1 text-[11px] italic text-amber-200">
              "{o.notes}"
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
        <span className="font-semibold text-white">₹{o.cost}</span>
        <span
          className={`rounded-md px-2 py-0.5 text-[10px] font-medium ring-1 ${STATUS_TONES[o.status] || ""}`}
        >
          {o.status}
        </span>
        <span
          className={`rounded-md px-2 py-0.5 text-[10px] font-medium ring-1 ${
            o.paymentStatus === "paid"
              ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
              : "bg-amber-500/15 text-amber-200 ring-amber-400/30"
          }`}
        >
          {o.paymentStatus}
        </span>
        {canMarkPaid && o.status !== "cancelled" && (
          <button
            type="button"
            onClick={onTogglePaid}
            title={o.paymentStatus === "paid" ? "Mark unpaid" : "Mark paid"}
            className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/65 hover:bg-white/10"
          >
            <CircleDollarSign size={11} />
          </button>
        )}
        {canServe && (
          <button
            type="button"
            onClick={onServe}
            className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-200 ring-1 ring-emerald-400/30 hover:bg-emerald-500/30"
          >
            <Check size={11} /> Mark served
          </button>
        )}
        {canCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/65 hover:bg-white/10"
          >
            <Ban size={11} /> Cancel
          </button>
        )}
      </div>
    </motion.div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">{label}</div>
      {children}
    </label>
  );
}
