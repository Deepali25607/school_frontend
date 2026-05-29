import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Activity,
  AlertTriangle,
  Syringe,
  Search,
  Filter,
  Plus,
  X,
  Stethoscope,
  Droplet,
  ShieldAlert,
  Phone,
  CalendarClock,
  Save,
  Sparkles as SparklesIcon,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlarmClock,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const SEVERITY_TONES = {
  Routine: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Minor: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  Moderate: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  Urgent: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

const BLOOD_TONES = {
  "A+": "from-rose-500/30",
  "A-": "from-rose-400/30",
  "B+": "from-brand-500/30",
  "B-": "from-brand-400/30",
  "O+": "from-emerald-500/30",
  "O-": "from-emerald-400/30",
  "AB+": "from-accent-violet/30",
  "AB-": "from-accent-pink/30",
};

export default function Health() {
  const { user } = useAuth();
  const canEdit = ["admin", "principal", "teacher"].includes(user?.role);

  const [tab, setTab] = useState("profiles");

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Wellbeing"
        title="Health & Medical"
        subtitle="Student health profiles, nurse-visit log and vaccinations"
      />

      <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
        <TabButton active={tab === "profiles"} onClick={() => setTab("profiles")}>
          <Heart size={14} /> Health profiles
        </TabButton>
        <TabButton active={tab === "visits"} onClick={() => setTab("visits")}>
          <Stethoscope size={14} /> Nurse-visit log
        </TabButton>
        <TabButton active={tab === "vaccinations"} onClick={() => setTab("vaccinations")}>
          <Syringe size={14} /> Vaccinations
        </TabButton>
      </div>

      <AnimatePresence mode="wait">
        {tab === "profiles" && (
          <motion.div
            key="profiles"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <ProfilesTab canEdit={canEdit} />
          </motion.div>
        )}
        {tab === "visits" && (
          <motion.div
            key="visits"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <VisitsTab canEdit={canEdit} />
          </motion.div>
        )}
        {tab === "vaccinations" && (
          <motion.div
            key="vax"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <VaccinationsTab />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
        active
          ? "bg-gradient-to-r from-brand-500/30 to-accent-violet/20 text-white ring-1 ring-white/15"
          : "text-white/65 hover:bg-white/5 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

// ============== PROFILES TAB ==============
function ProfilesTab({ canEdit }) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [condition, setCondition] = useState("all");
  const [bloodGroup, setBloodGroup] = useState("all");
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const { data, loading, error, refetch } = useApi(
    () => endpoints.healthProfiles({ q: debounced, condition, bloodGroup }),
    [debounced, condition, bloodGroup]
  );

  useRealtime("health.changed", () => refetch());

  const items = data?.items || [];
  const summary = data?.summary;

  return (
    <div className="space-y-5">
      {error && <ErrorState error={error} onRetry={refetch} />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile icon={Heart} label="Total profiles" value={loading ? "—" : summary?.totalProfiles} tint="from-brand-500/30" />
        <button type="button" onClick={() => setCondition(condition === "allergies" ? "all" : "allergies")} className={`block w-full rounded-2xl text-left transition-all ${condition === "allergies" ? "ring-1 ring-brand-400/50" : ""}`}>
          <StatTile icon={AlertTriangle} label="With allergies" value={loading ? "—" : summary?.withAllergies} tint="from-amber-500/30" />
        </button>
        <button type="button" onClick={() => setCondition(condition === "chronic" ? "all" : "chronic")} className={`block w-full rounded-2xl text-left transition-all ${condition === "chronic" ? "ring-1 ring-brand-400/50" : ""}`}>
          <StatTile icon={Activity} label="Chronic conditions" value={loading ? "—" : summary?.withConditions} tint="from-rose-500/30" pulse={summary?.withConditions > 0} />
        </button>
        <StatTile icon={Syringe} label="Fully vaccinated" value={loading ? "—" : summary?.fullyVaccinated} tint="from-emerald-500/30" />
      </div>

      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={14} className="text-white/55" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by ID, allergy or condition…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-white/55" />
          <select
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">Any blood group</option>
            {(data?.bloodGroups || []).map((b) => <option key={b}>{b}</option>)}
          </select>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">All students</option>
            <option value="allergies">Has allergies</option>
            <option value="chronic">Has chronic conditions</option>
            {(data?.commonConditions || []).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center text-white/55">
          <SparklesIcon className="mx-auto mb-2 text-accent-gold" size={20} />
          No profiles match this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((p, i) => (
            <ProfileCard key={p.studentId} p={p} idx={i} onPick={setPicked} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {picked && (
          <ProfileModal
            initial={picked}
            canEdit={canEdit}
            vaccines={data?.vaccines || []}
            onClose={() => setPicked(null)}
            onChanged={() => refetch()}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfileCard({ p, idx, onPick }) {
  const vax = p.vaccinations.filter((v) => v.taken).length;
  const total = p.vaccinations.length;
  const pct = Math.round((vax / total) * 100);
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx, 12) * 0.03 }}
      whileHover={{ y: -2 }}
      onClick={() => onPick(p)}
      className="card group relative overflow-hidden text-left"
    >
      <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${BLOOD_TONES[p.bloodGroup] || "from-white/15"} to-transparent blur-2xl`} />
      <div className="relative flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-violet font-display text-sm font-bold text-white shadow-glow">
          {p.studentAvatar || p.studentName?.[0]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-sm font-semibold">
            {p.studentName}
          </div>
          <div className="text-[11px] text-white/45">
            {p.studentId} · Grade {p.studentGrade}-{p.studentSection}
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-300 ring-1 ring-rose-400/30">
          <Droplet size={10} />
          {p.bloodGroup}
        </span>
      </div>

      <div className="relative mt-3 flex flex-wrap gap-1">
        {p.allergies.length > 0 ? (
          p.allergies.map((a) => (
            <span key={a} className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-200 ring-1 ring-amber-400/30">
              <AlertTriangle size={9} /> {a}
            </span>
          ))
        ) : (
          <span className="text-[10px] text-white/40">No allergies</span>
        )}
      </div>

      {p.chronicConditions.length > 0 && (
        <div className="relative mt-1.5 flex flex-wrap gap-1">
          {p.chronicConditions.map((c) => (
            <span key={c} className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-medium text-rose-200 ring-1 ring-rose-400/30">
              <ShieldAlert size={9} /> {c}
            </span>
          ))}
        </div>
      )}

      <div className="relative mt-3 flex items-center justify-between text-[11px] text-white/55">
        <div className="inline-flex items-center gap-1">
          <Syringe size={11} className="text-emerald-300" />
          <span className="font-mono">{vax}/{total}</span>
          <span className="text-white/40">vax</span>
        </div>
        <div className="inline-flex items-center gap-1">
          <CalendarClock size={11} />
          <span>{p.lastCheckup}</span>
        </div>
      </div>

      <div className="relative mt-2 h-1 overflow-hidden rounded-full bg-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, delay: idx * 0.03 }}
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-brand-400"
        />
      </div>
    </motion.button>
  );
}

function ProfileModal({ initial, canEdit, vaccines, onClose, onChanged }) {
  const [p, setP] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [allergyInput, setAllergyInput] = useState("");
  const [conditionInput, setConditionInput] = useState("");
  const [visits, setVisits] = useState([]);
  const [visitsLoading, setVisitsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    endpoints
      .healthProfile(initial.studentId)
      .then((res) => {
        if (cancelled) return;
        // Merge in newer server state but preserve in-flight edits
        setP((prev) => ({ ...prev, ...res.profile, studentName: prev.studentName, studentGrade: prev.studentGrade, studentSection: prev.studentSection, studentAvatar: prev.studentAvatar }));
        setVisits(res.visits || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setVisitsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initial.studentId]);

  const set = (k, v) => setP((prev) => ({ ...prev, [k]: v }));
  const setEmergency = (k, v) =>
    setP((prev) => ({ ...prev, emergencyContact: { ...prev.emergencyContact, [k]: v } }));

  const addAllergy = () => {
    const t = allergyInput.trim();
    if (!t) return;
    if (p.allergies.includes(t)) return;
    set("allergies", [...p.allergies, t]);
    setAllergyInput("");
  };
  const addCondition = () => {
    const t = conditionInput.trim();
    if (!t) return;
    if (p.chronicConditions.includes(t)) return;
    set("chronicConditions", [...p.chronicConditions, t]);
    setConditionInput("");
  };
  const toggleVaccine = (code) => {
    set(
      "vaccinations",
      p.vaccinations.map((v) =>
        v.code === code
          ? {
              ...v,
              taken: !v.taken,
              date: !v.taken ? new Date().toISOString().slice(0, 10) : null,
            }
          : v
      )
    );
  };

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      await endpoints.healthProfileUpdate(p.studentId, {
        bloodGroup: p.bloodGroup,
        heightCm: p.heightCm,
        weightKg: p.weightKg,
        allergies: p.allergies,
        chronicConditions: p.chronicConditions,
        emergencyContact: p.emergencyContact,
        doctor: p.doctor,
        vaccinations: p.vaccinations,
        notes: p.notes,
      });
      onChanged();
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  const bmi = useMemo(() => {
    const h = Number(p.heightCm) / 100;
    const w = Number(p.weightKg);
    if (!h || !w) return null;
    return (w / (h * h)).toFixed(1);
  }, [p.heightCm, p.weightKg]);

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
        className="relative max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a0a1e] via-[#0d0d2a] to-[#101044] shadow-glow"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-rose-500/25 to-brand-500/25 blur-3xl" />
        <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white">
          <X size={18} />
        </button>

        <div className="relative max-h-[88vh] overflow-y-auto p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-violet font-display text-base font-bold text-white shadow-glow">
              {p.studentAvatar || p.studentName?.[0]}
            </div>
            <div>
              <div className="font-display text-lg font-bold">{p.studentName}</div>
              <div className="text-xs text-white/55">
                {p.studentId} · Grade {p.studentGrade}-{p.studentSection}
              </div>
            </div>
          </div>

          {/* Quick metrics */}
          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
            <Metric label="Blood group" value={p.bloodGroup} icon={Droplet} tone="text-rose-300" />
            <Metric label="Height" value={`${p.heightCm} cm`} icon={ChevronRight} />
            <Metric label="Weight" value={`${p.weightKg} kg`} icon={ChevronRight} />
            <Metric label="BMI" value={bmi || "—"} icon={Activity} />
          </div>

          {/* Editable fields */}
          {canEdit ? (
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
              <Field label="Blood group">
                <select
                  value={p.bloodGroup}
                  onChange={(e) => set("bloodGroup", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                >
                  {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map((b) => <option key={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="Height (cm)">
                <input
                  type="number"
                  value={p.heightCm}
                  onChange={(e) => set("heightCm", Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                />
              </Field>
              <Field label="Weight (kg)">
                <input
                  type="number"
                  value={p.weightKg}
                  onChange={(e) => set("weightKg", Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                />
              </Field>
            </div>
          ) : null}

          {/* Allergies */}
          <Section
            title="Allergies"
            icon={AlertTriangle}
            tone="text-amber-300"
            count={p.allergies.length}
          >
            <div className="flex flex-wrap gap-1.5">
              {p.allergies.map((a) => (
                <Pill
                  key={a}
                  tone="bg-amber-500/15 text-amber-200 ring-amber-400/30"
                  onRemove={canEdit ? () => set("allergies", p.allergies.filter((x) => x !== a)) : null}
                >
                  {a}
                </Pill>
              ))}
              {p.allergies.length === 0 && (
                <span className="text-[11px] text-white/40">None on record</span>
              )}
            </div>
            {canEdit && (
              <div className="mt-2 flex gap-2">
                <input
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAllergy())}
                  placeholder="Add allergy…"
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs outline-none focus:border-amber-400/60"
                />
                <button
                  type="button"
                  onClick={addAllergy}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                >
                  Add
                </button>
              </div>
            )}
          </Section>

          {/* Chronic conditions */}
          <Section
            title="Chronic conditions"
            icon={ShieldAlert}
            tone="text-rose-300"
            count={p.chronicConditions.length}
          >
            <div className="flex flex-wrap gap-1.5">
              {p.chronicConditions.map((c) => (
                <Pill
                  key={c}
                  tone="bg-rose-500/15 text-rose-200 ring-rose-400/30"
                  onRemove={canEdit ? () => set("chronicConditions", p.chronicConditions.filter((x) => x !== c)) : null}
                >
                  {c}
                </Pill>
              ))}
              {p.chronicConditions.length === 0 && (
                <span className="text-[11px] text-white/40">None on record</span>
              )}
            </div>
            {canEdit && (
              <div className="mt-2 flex gap-2">
                <input
                  value={conditionInput}
                  onChange={(e) => setConditionInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCondition())}
                  placeholder="Add condition…"
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs outline-none focus:border-rose-400/60"
                />
                <button
                  type="button"
                  onClick={addCondition}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                >
                  Add
                </button>
              </div>
            )}
          </Section>

          {/* Vaccinations */}
          <Section
            title="Vaccination record"
            icon={Syringe}
            tone="text-emerald-300"
            count={`${p.vaccinations.filter((v) => v.taken).length} / ${p.vaccinations.length}`}
          >
            <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
              {p.vaccinations.map((v) => {
                const meta = vaccines.find((x) => x.code === v.code);
                return (
                  <button
                    key={v.code}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => toggleVaccine(v.code)}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-all ${
                      v.taken
                        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                        : "border-white/10 bg-white/[0.03] text-white/55"
                    } ${canEdit ? "hover:border-white/20 hover:bg-white/10 cursor-pointer" : "cursor-default"}`}
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{meta?.name || v.code}</div>
                      {v.date && <div className="text-[10px] text-white/45">on {v.date}</div>}
                    </div>
                    <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full ring-1 ${v.taken ? "bg-emerald-400/20 ring-emerald-400/40" : "ring-white/15"}`}>
                      {v.taken ? "✓" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Emergency contact */}
          <Section title="Emergency contact" icon={Phone} tone="text-brand-300">
            {canEdit ? (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <input
                  value={p.emergencyContact?.name || ""}
                  onChange={(e) => setEmergency("name", e.target.value)}
                  placeholder="Name"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs outline-none"
                />
                <input
                  value={p.emergencyContact?.relation || ""}
                  onChange={(e) => setEmergency("relation", e.target.value)}
                  placeholder="Relation"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs outline-none"
                />
                <input
                  value={p.emergencyContact?.phone || ""}
                  onChange={(e) => setEmergency("phone", e.target.value)}
                  placeholder="Phone"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs outline-none"
                />
              </div>
            ) : (
              <div className="text-xs text-white/75">
                {p.emergencyContact?.name} ({p.emergencyContact?.relation}) ·{" "}
                <span className="font-mono">{p.emergencyContact?.phone}</span>
              </div>
            )}
          </Section>

          {/* Recent visits */}
          <Section title="Recent visits" icon={Stethoscope} tone="text-purple-300">
            {visitsLoading ? (
              <div className="text-[11px] text-white/40">Loading…</div>
            ) : visits.length === 0 ? (
              <div className="text-[11px] text-white/40">No nurse visits on file</div>
            ) : (
              <ul className="space-y-1.5">
                {visits.slice(0, 5).map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{v.complaint}</div>
                      <div className="text-[10px] text-white/45">
                        {v.visitedOn} · {v.attendedBy}
                      </div>
                    </div>
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ${SEVERITY_TONES[v.severity]}`}>
                      {v.severity}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {err && (
            <div className="mt-3 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
              {err}
            </div>
          )}

          {canEdit && (
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                disabled={busy}
                onClick={save}
                className="btn-primary px-4 py-1.5 text-xs"
              >
                <Save size={12} />
                {busy ? "Saving…" : "Save changes"}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============== VISITS TAB ==============
function VisitsTab({ canEdit }) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [severity, setSeverity] = useState("all");
  const [sinceDays, setSinceDays] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const { data, loading, error, refetch } = useApi(
    () =>
      endpoints.healthVisits({
        q: debounced,
        severity,
        sinceDays: sinceDays || undefined,
      }),
    [debounced, severity, sinceDays]
  );

  useRealtime("health.changed", () => refetch());

  const items = data?.items || [];
  const summary = data?.summary;

  return (
    <div className="space-y-5">
      {error && <ErrorState error={error} onRetry={refetch} />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile icon={Stethoscope} label="Visits today" value={loading ? "—" : summary?.visitsToday} tint="from-brand-500/30" />
        <StatTile icon={CalendarClock} label="Last 7 days" value={loading ? "—" : summary?.visitsLast7d} tint="from-accent-violet/30" />
        <StatTile icon={AlertTriangle} label="Urgent (7d)" value={loading ? "—" : summary?.urgentLast7d} tint="from-rose-500/30" pulse={summary?.urgentLast7d > 0} />
        <StatTile icon={Heart} label="Total profiles" value={loading ? "—" : summary?.totalProfiles} tint="from-emerald-500/30" />
      </div>

      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={14} className="text-white/55" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by student, complaint…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-white/55" />
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">Any severity</option>
            {(data?.severities || []).map((s) => <option key={s}>{s}</option>)}
          </select>
          <select
            value={sinceDays}
            onChange={(e) => setSinceDays(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="">All time</option>
            <option value="1">Last 24h</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
          {canEdit && (
            <button onClick={() => setCreating(true)} className="btn-primary px-3 py-2 text-sm">
              <Plus size={14} /> Log visit
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center text-white/55">
          <SparklesIcon className="mx-auto mb-2 text-accent-gold" size={20} />
          No visits match. Log the first nurse visit with the button above.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((v, i) => <VisitRow key={v.id} v={v} idx={i} />)}
        </div>
      )}

      <AnimatePresence>
        {creating && (
          <NewVisitModal
            severities={data?.severities || []}
            complaints={data?.complaints || []}
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

function VisitRow({ v, idx }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx, 16) * 0.02 }}
      className="flex flex-col gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-3 md:flex-row md:items-center"
    >
      <div className="flex items-center gap-2 md:w-64">
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${SEVERITY_TONES[v.severity]}`}>
          {v.severity}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{v.studentName}</div>
          <div className="text-[10px] text-white/45">
            {v.studentId} · Grade {v.studentGrade}-{v.studentSection}
          </div>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm">
          <span className="text-white/85">{v.complaint}</span>
          <span className="ml-1 text-white/45">— {v.diagnosis}</span>
        </div>
        <div className="mt-0.5 truncate text-[11px] text-white/45">{v.treatment}</div>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-white/55">
        <span>{v.attendedBy}</span>
        <span className="text-white/40">·</span>
        <span className="tabular-nums">{v.visitedOn}</span>
        {v.followUp && (
          <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-300 ring-1 ring-amber-400/30">
            follow-up
          </span>
        )}
      </div>
    </motion.div>
  );
}

function NewVisitModal({ severities, complaints, onClose, onCreated }) {
  const [form, setForm] = useState({
    studentId: "",
    complaint: complaints[0] || "",
    severity: "Minor",
    diagnosis: "",
    treatment: "",
    attendedBy: "Nurse on duty",
    followUp: false,
  });
  const [studentQuery, setStudentQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [studentLoading, setStudentLoading] = useState(false);
  // Keep the chosen student in its own state — the search-results `students`
  // array is cleared as soon as the query empties, so we can't rely on it
  // to display the selection.
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      if (!studentQuery.trim()) {
        setStudents([]);
        return;
      }
      setStudentLoading(true);
      try {
        const res = await endpoints.students({ q: studentQuery });
        if (!cancelled) setStudents(res.items.slice(0, 8));
      } catch {
        if (!cancelled) setStudents([]);
      } finally {
        if (!cancelled) setStudentLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [studentQuery]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const selected = selectedStudent;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.studentId) {
      setErr("Pick a student first");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await endpoints.healthVisitAdd(form);
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
        className="glass-card relative w-full max-w-md p-6"
      >
        <button type="button" onClick={onClose} className="absolute right-3 top-3 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white">
          <X size={16} />
        </button>
        <div className="mb-1 text-xs uppercase tracking-[0.2em] text-white/55">
          New nurse-office visit
        </div>
        <div className="font-display text-xl font-bold">Log visit</div>

        <div className="mt-5 space-y-3">
          <Field label="Student">
            <div className="relative">
              <input
                value={selected ? `${selected.name} · ${selected.id}` : studentQuery}
                onChange={(e) => {
                  setStudentQuery(e.target.value);
                  if (form.studentId) {
                    set("studentId", "");
                    setSelectedStudent(null);
                  }
                }}
                placeholder="Type name or ID…"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
              />
              {!form.studentId && studentQuery && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-[#0c0c22] shadow-glow">
                  {studentLoading && (
                    <div className="px-3 py-2 text-xs text-white/55">Searching…</div>
                  )}
                  {!studentLoading && students.length === 0 && (
                    <div className="px-3 py-2 text-xs text-white/45">No matches</div>
                  )}
                  {students.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => {
                        set("studentId", s.id);
                        setSelectedStudent(s);
                        setStudentQuery("");
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-white/10"
                    >
                      <div className="font-medium">{s.name}</div>
                      <div className="text-[11px] text-white/45">
                        {s.id} · Grade {s.grade}-{s.section}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Complaint">
              <select
                value={form.complaint}
                onChange={(e) => set("complaint", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
              >
                {complaints.map((c) => <option key={c}>{c}</option>)}
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field label="Severity">
              <select
                value={form.severity}
                onChange={(e) => set("severity", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
              >
                {severities.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Diagnosis">
            <input
              value={form.diagnosis}
              onChange={(e) => set("diagnosis", e.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
            />
          </Field>

          <Field label="Treatment">
            <textarea
              value={form.treatment}
              onChange={(e) => set("treatment", e.target.value)}
              rows={2}
              placeholder="What was done…"
              className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Attended by">
              <input
                value={form.attendedBy}
                onChange={(e) => set("attendedBy", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
              />
            </Field>
            <Field label="Follow-up needed">
              <button
                type="button"
                onClick={() => set("followUp", !form.followUp)}
                className={`w-full rounded-xl border px-3 py-2 text-sm transition-all ${
                  form.followUp
                    ? "border-amber-400/40 bg-amber-500/15 text-amber-200"
                    : "border-white/10 bg-white/5 text-white/55 hover:bg-white/10"
                }`}
              >
                {form.followUp ? "Yes — follow up" : "No"}
              </button>
            </Field>
          </div>
        </div>

        {err && (
          <div className="mt-3 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
            {err}
          </div>
        )}

        <button disabled={busy} className="btn-primary mt-5 w-full">
          {busy ? "Saving…" : "Save visit"}
        </button>
      </motion.form>
    </motion.div>
  );
}

// ============== shared little bits ==============
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

function Section({ title, icon: Icon, tone, count, children }) {
  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className={`inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider ${tone}`}>
          <Icon size={12} /> {title}
        </div>
        {count !== undefined && (
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/55 ring-1 ring-white/10">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Metric({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
      <div className="text-[9px] uppercase tracking-wider text-white/50">{label}</div>
      <div className={`flex items-center gap-1 font-display text-base font-bold ${tone || ""}`}>
        <Icon size={13} /> {value}
      </div>
    </div>
  );
}

function Pill({ tone, onRemove, children }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${tone}`}>
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 inline-flex h-3 w-3 items-center justify-center rounded hover:bg-white/15"
          aria-label="Remove"
        >
          <X size={9} />
        </button>
      )}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-1 text-[11px] uppercase tracking-wider text-white/55">
        {label}
      </div>
      {children}
    </label>
  );
}

// ============== VACCINATIONS ==============
//
// Two layouts driven by role:
//   - Staff (admin/principal/hr): roster-wide compliance overview with
//     per-vaccine counters, an "overdue students" filter, and click-through
//     to a per-student dose ledger where they can record new doses.
//   - Parent/student/teacher: their own (or first scoped) student's card.

const VAX_STATUS_TONES = {
  done: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  due: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
  overdue: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  "not-yet": "bg-white/5 text-white/45 ring-white/10",
};
const VAX_STATUS_LABEL = {
  done: "Done",
  due: "Due",
  overdue: "Overdue",
  "not-yet": "Not yet",
};

function VaccinationsTab() {
  const { user } = useAuth();
  const isStaff = ["admin", "principal", "hr"].includes(user?.role);
  const isParent = user?.role === "parent";
  const isStudent = user?.role === "student";
  const isTeacher = user?.role === "teacher";

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
    if (isTeacher && user?.scope?.studentIds?.length) {
      return user.scope.studentIds.slice(0, 1).map((id) => ({ id, name: id }));
    }
    return [];
  }, [user, isParent, isStudent, isTeacher]);

  // For non-staff: a single per-student view.
  const [selectedStudent, setSelectedStudent] = useState(myStudents[0]?.id || null);

  // For staff: compliance overview + drilldown.
  const [drillId, setDrillId] = useState(null);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [gradeFilter, setGradeFilter] = useState("all");

  if (!isStaff) {
    if (myStudents.length === 0) {
      return (
        <div className="card text-center text-white/55">
          <SparklesIcon className="mx-auto mb-2 text-accent-gold" size={20} />
          No linked student record — vaccinations are not visible here.
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {myStudents.length > 1 && (
          <div className="card flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-white/55">
              For
            </span>
            <select
              value={selectedStudent || ""}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
            >
              {myStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {selectedStudent && (
          <StudentVaccinationCard
            studentId={selectedStudent}
            canRecord={false}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StaffComplianceOverview
        showOverdueOnly={showOverdueOnly}
        setShowOverdueOnly={setShowOverdueOnly}
        gradeFilter={gradeFilter}
        setGradeFilter={setGradeFilter}
        onPickStudent={(id) => setDrillId(id)}
      />

      <AnimatePresence>
        {drillId && (
          <motion.div
            key="drill"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="card"
          >
            <div className="mb-3 flex items-center gap-2">
              <ChevronRight size={14} className="text-white/45" />
              <div className="text-xs uppercase tracking-wider text-white/55">
                Student detail
              </div>
              <button
                type="button"
                onClick={() => setDrillId(null)}
                className="ml-auto rounded-md border border-white/10 bg-white/5 p-1 text-white/55 hover:bg-white/10"
              >
                <X size={12} />
              </button>
            </div>
            <StudentVaccinationCard studentId={drillId} canRecord />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StaffComplianceOverview({
  showOverdueOnly,
  setShowOverdueOnly,
  gradeFilter,
  setGradeFilter,
  onPickStudent,
}) {
  const { data, loading, error, refetch } = useApi(
    () =>
      endpoints.vaccinationCompliance(
        gradeFilter === "all" ? {} : { grade: gradeFilter }
      ),
    [gradeFilter]
  );
  useRealtime("health.changed", refetch);

  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (loading)
    return (
      <div className="space-y-2">
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
      </div>
    );

  const overduePct =
    data?.totalStudents > 0
      ? Math.round((data.studentsWithOverdue / data.totalStudents) * 100)
      : 0;
  const compliancePct =
    data?.totalStudents > 0
      ? Math.round((data.fullyCompliantStudents / data.totalStudents) * 100)
      : 0;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          icon={ShieldCheck}
          label="Fully compliant"
          value={`${data.fullyCompliantStudents}/${data.totalStudents}`}
          tint="from-emerald-500/30"
        />
        <StatTile
          icon={TrendingUp}
          label="Compliance"
          value={`${compliancePct}%`}
          tint="from-brand-500/30"
        />
        <StatTile
          icon={AlarmClock}
          label="Students with overdue"
          value={data.studentsWithOverdue}
          tint="from-rose-500/30"
          pulse={data.studentsWithOverdue > 0}
        />
        <StatTile
          icon={Syringe}
          label="Vaccines tracked"
          value={data.perVaccine.length}
          tint="from-accent-violet/30"
        />
      </div>

      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-white/75">
          <Filter size={14} className="text-white/55" />
          <select
            value={gradeFilter}
            onChange={(e) =>
              setGradeFilter(e.target.value === "all" ? "all" : Number(e.target.value))
            }
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">All grades</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
          </select>
          <label className="ml-2 inline-flex items-center gap-1.5 text-xs text-white/70">
            <input
              type="checkbox"
              checked={showOverdueOnly}
              onChange={(e) => setShowOverdueOnly(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-white/20 bg-white/10"
            />
            Show students with overdue only
          </label>
        </div>
        <div className="text-[11px] text-white/45">
          Click a vaccine to see its breakdown · click a student to drill in.
        </div>
      </div>

      <div className="card">
        <div className="mb-3 flex items-center gap-2">
          <Syringe size={14} className="text-brand-300" />
          <div className="text-sm font-semibold text-white">
            Per-vaccine compliance
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-wider text-white/55">
              <tr>
                <th className="px-3 py-2">Vaccine</th>
                <th className="px-3 py-2">Done</th>
                <th className="px-3 py-2">Due</th>
                <th className="px-3 py-2">Overdue</th>
                <th className="px-3 py-2">Not yet</th>
                <th className="px-3 py-2">Compliance</th>
              </tr>
            </thead>
            <tbody>
              {data.perVaccine.map((v) => {
                const eligible = v.done + v.due + v.overdue;
                const pct = eligible ? Math.round((v.done / eligible) * 100) : 100;
                return (
                  <tr key={v.code} className="border-t border-white/5">
                    <td className="px-3 py-2">
                      <div className="font-medium">{v.code}</div>
                      <div className="text-[10px] text-white/45">{v.name}</div>
                    </td>
                    <td className="px-3 py-2 text-emerald-300">{v.done}</td>
                    <td className="px-3 py-2 text-amber-200">{v.due}</td>
                    <td className="px-3 py-2 text-rose-300">{v.overdue}</td>
                    <td className="px-3 py-2 text-white/45">{v.notYet}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full bg-gradient-to-r from-brand-500 to-emerald-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-white/65">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <OverdueStudentList
        overdueIds={data.overdueStudentIds}
        showOverdueOnly={showOverdueOnly}
        onPickStudent={onPickStudent}
      />
    </>
  );
}

function OverdueStudentList({ overdueIds, showOverdueOnly, onPickStudent }) {
  // We list overdue students (always) and toggle showing the rest.
  // The current visible list is just overdueIds; non-overdue lookups would
  // require another API hit so we keep the table focused for now.
  if (!overdueIds || overdueIds.length === 0) {
    return (
      <div className="card flex items-center gap-2 text-sm text-emerald-300">
        <CheckCircle2 size={14} /> Every tracked student is on schedule.
      </div>
    );
  }
  return (
    <div className="card">
      <div className="mb-3 flex items-center gap-2">
        <AlarmClock size={14} className="text-rose-300" />
        <div className="text-sm font-semibold text-white">
          Students with overdue doses
        </div>
        <span className="ml-2 rounded-md bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-200 ring-1 ring-rose-400/30">
          {overdueIds.length}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {overdueIds.slice(0, 60).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onPickStudent(id)}
            className="flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/[0.06] px-3 py-2 text-left text-sm hover:bg-rose-500/10"
          >
            <Syringe size={12} className="text-rose-300" />
            <span className="font-mono text-xs text-white/85">{id}</span>
            <ChevronRight size={12} className="ml-auto text-white/40" />
          </button>
        ))}
        {overdueIds.length > 60 && (
          <div className="col-span-full text-center text-[11px] text-white/45">
            …and {overdueIds.length - 60} more.
          </div>
        )}
      </div>
    </div>
  );
}

function StudentVaccinationCard({ studentId, canRecord }) {
  const { data, loading, error, refetch } = useApi(
    () => endpoints.vaccinationStatus(studentId),
    [studentId]
  );
  useRealtime("health.changed", refetch);

  const [recordingFor, setRecordingFor] = useState(null);

  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (loading || !data)
    return (
      <div className="space-y-2">
        <Skeleton className="h-16" />
        <Skeleton className="h-48" />
      </div>
    );

  const { student, summary, vaccines } = data;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/app/students/${student.id}`}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-pink font-display text-xs font-bold text-white"
          >
            {student.avatar || "?"}
          </Link>
          <div>
            <Link
              to={`/app/students/${student.id}`}
              className="font-display text-lg font-semibold hover:text-brand-300"
            >
              {student.name}
            </Link>
            <div className="text-[11px] text-white/55">
              {student.id} · Grade {student.grade}-{student.section}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 font-medium text-emerald-300 ring-1 ring-emerald-400/30">
            {summary.done} done
          </span>
          {summary.due > 0 && (
            <span className="rounded-md bg-amber-500/15 px-2 py-0.5 font-medium text-amber-200 ring-1 ring-amber-400/30">
              {summary.due} due
            </span>
          )}
          {summary.overdue > 0 && (
            <span className="rounded-md bg-rose-500/15 px-2 py-0.5 font-medium text-rose-300 ring-1 ring-rose-400/30">
              {summary.overdue} overdue
            </span>
          )}
          {summary.notYet > 0 && (
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-white/55 ring-1 ring-white/10">
              {summary.notYet} not yet
            </span>
          )}
          <span className="rounded-md bg-brand-500/15 px-2 py-0.5 font-semibold text-brand-200 ring-1 ring-brand-400/30">
            {summary.compliancePct}% compliant
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {vaccines.map((vac) => (
          <div
            key={vac.code}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500/30 to-accent-violet/30 ring-1 ring-white/10">
                <Syringe size={13} className="text-brand-200" />
              </div>
              <div>
                <div className="text-sm font-semibold">
                  {vac.code}
                  {vac.annual && (
                    <span className="ml-2 rounded-md bg-accent-violet/15 px-1.5 py-0.5 text-[9px] font-medium text-purple-200 ring-1 ring-accent-violet/30">
                      annual
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-white/55">{vac.name}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {vac.doses.map((dose) => (
                <div
                  key={dose.label}
                  className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.04] px-3 py-2 text-xs"
                >
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium ring-1 ${VAX_STATUS_TONES[dose.status]}`}
                  >
                    {dose.status === "done" && <CheckCircle2 size={10} />}
                    {dose.status === "overdue" && <AlertTriangle size={10} />}
                    {dose.status === "due" && <Clock size={10} />}
                    {VAX_STATUS_LABEL[dose.status]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-white/85">
                      {dose.label}
                    </div>
                    <div className="text-[10px] text-white/45">
                      {dose.administeredOn
                        ? `Given ${dose.administeredOn}${dose.administeredBy ? " · " + dose.administeredBy : ""}`
                        : `Required by Grade ${dose.requiredByGrade}${dose.gapMonths ? ` · gap ${dose.gapMonths}mo` : ""}`}
                    </div>
                  </div>
                  {canRecord && dose.status !== "done" && dose.status !== "not-yet" && (
                    <button
                      type="button"
                      onClick={() =>
                        setRecordingFor({ code: vac.code, label: dose.label })
                      }
                      className="inline-flex items-center gap-1 rounded-md bg-brand-500/15 px-2 py-0.5 text-[10px] font-medium text-brand-200 ring-1 ring-brand-400/30 hover:bg-brand-500/25"
                    >
                      <Plus size={10} /> Record
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {recordingFor && (
          <RecordDoseModal
            studentId={studentId}
            studentName={student.name}
            code={recordingFor.code}
            label={recordingFor.label}
            onClose={() => setRecordingFor(null)}
            onRecorded={() => {
              setRecordingFor(null);
              refetch();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function RecordDoseModal({ studentId, studentName, code, label, onClose, onRecorded }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [administeredBy, setAdministeredBy] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await endpoints.vaccinationRecord(studentId, {
        code,
        label,
        date,
        administeredBy: administeredBy.trim() || undefined,
      });
      onRecorded();
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur"
    >
      <motion.form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        className="glass-card relative w-full max-w-md p-6"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X size={16} />
        </button>
        <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/55">
          <Syringe size={12} /> Record dose
        </div>
        <div className="font-display text-xl font-bold">
          {code} · {label}
        </div>
        <div className="text-xs text-white/55">For {studentName}</div>

        <div className="mt-4 space-y-3">
          <Field label="Administered on">
            <input
              type="date"
              value={date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none [color-scheme:dark] focus:border-brand-400/60"
            />
          </Field>
          <Field label="Administered by (optional)">
            <input
              type="text"
              value={administeredBy}
              onChange={(e) => setAdministeredBy(e.target.value)}
              maxLength={80}
              placeholder="Dr. Priya Menon / school clinic / hospital"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-brand-400/60"
            />
          </Field>

          {err && (
            <div className="rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-violet px-3 py-2 text-sm font-semibold text-white shadow shadow-brand-500/20 disabled:opacity-50"
          >
            <CheckCircle2 size={14} />
            {busy ? "Saving…" : "Record dose"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
