import { useEffect, useState } from "react";
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
        <StatTile icon={AlertTriangle} label="Allergy risks" value={loading ? "—" : data?.summary?.atRiskToday} tint="from-rose-500/30" pulse={data?.summary?.atRiskToday > 0} />
        <StatTile icon={Leaf} label="Vegetarians" value={loading ? "—" : (data?.summary?.byMealPlan?.Veg || 0) + (data?.summary?.byMealPlan?.Vegan || 0) + (data?.summary?.byMealPlan?.Jain || 0)} tint="from-emerald-500/30" />
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
          <motion.div key="subs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <SubscribersView />
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
function SubscribersView() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [mealPlan, setMealPlan] = useState("all");
  const [specialDietOnly, setSpecialDietOnly] = useState(false);

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
          {(data?.mealPlans || []).map((p) => (
            <div key={p} className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
              <div className="text-[10px] uppercase tracking-wider text-white/55">{p}</div>
              <div className="font-display text-xl font-bold">
                {summary.byMealPlan?.[p] || 0}
              </div>
            </div>
          ))}
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

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">{label}</div>
      {children}
    </label>
  );
}
