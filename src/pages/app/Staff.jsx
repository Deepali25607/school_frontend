import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users as UsersIcon,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader,
  CircleAlert,
  Check,
  Mail,
  Phone,
  Calendar,
  IdCard,
  MapPin,
  Sparkles,
  Wallet,
  BookMarked,
  Calculator,
  Briefcase,
  HardHat,
  Bus,
  Shield,
  Wrench,
  Monitor,
  Stethoscope,
  UserCog,
  Building,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import Avatar from "../../components/Avatar.jsx";
import PhotoUploader from "../../components/PhotoUploader.jsx";
import { PageHeader } from "./Students.jsx";

// Per-category visual palette — icon + ring/text/bg tones tying back to the
// Tailwind palette used elsewhere in the app.
const CATEGORY_META = {
  "Academic Support": {
    icon: BookMarked,
    text: "text-emerald-300",
    ring: "ring-emerald-400/30",
    bg: "bg-emerald-500/15",
    grad: "from-emerald-500/30 to-teal-500/15",
  },
  Finance: {
    icon: Calculator,
    text: "text-amber-300",
    ring: "ring-amber-400/30",
    bg: "bg-amber-500/15",
    grad: "from-amber-500/30 to-orange-500/15",
  },
  Administration: {
    icon: Briefcase,
    text: "text-brand-300",
    ring: "ring-brand-400/30",
    bg: "bg-brand-500/15",
    grad: "from-brand-500/30 to-cyan-500/15",
  },
  Operations: {
    icon: HardHat,
    text: "text-cyan-300",
    ring: "ring-cyan-400/30",
    bg: "bg-cyan-500/15",
    grad: "from-cyan-500/30 to-brand-500/15",
  },
  Transport: {
    icon: Bus,
    text: "text-pink-300",
    ring: "ring-accent-pink/30",
    bg: "bg-accent-pink/15",
    grad: "from-accent-pink/30 to-rose-500/15",
  },
  Security: {
    icon: Shield,
    text: "text-rose-300",
    ring: "ring-rose-400/30",
    bg: "bg-rose-500/15",
    grad: "from-rose-500/30 to-pink-500/15",
  },
  Maintenance: {
    icon: Wrench,
    text: "text-orange-300",
    ring: "ring-orange-400/30",
    bg: "bg-orange-500/15",
    grad: "from-orange-500/30 to-amber-500/15",
  },
  IT: {
    icon: Monitor,
    text: "text-purple-300",
    ring: "ring-accent-violet/30",
    bg: "bg-accent-violet/15",
    grad: "from-accent-violet/30 to-brand-500/15",
  },
  Medical: {
    icon: Stethoscope,
    text: "text-fuchsia-300",
    ring: "ring-fuchsia-400/30",
    bg: "bg-fuchsia-500/15",
    grad: "from-fuchsia-500/30 to-pink-500/15",
  },
  HR: {
    icon: UserCog,
    text: "text-violet-300",
    ring: "ring-violet-400/30",
    bg: "bg-violet-500/15",
    grad: "from-violet-500/30 to-purple-500/15",
  },
  Other: {
    icon: Building,
    text: "text-white/70",
    ring: "ring-white/15",
    bg: "bg-white/5",
    grad: "from-white/10 to-transparent",
  },
};

const STATUS_TONES = {
  Active: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  "On leave": "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  Probation: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  Resigned: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

function fmtINR(n) {
  if (n === null || n === undefined || n === "") return "—";
  const num = Number(n);
  if (!Number.isFinite(num)) return "—";
  return "₹" + num.toLocaleString("en-IN");
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function yearsBetween(iso) {
  if (!iso) return 0;
  const days = (Date.now() - new Date(iso).getTime()) / 86400000;
  return Math.max(0, Math.floor(days / 365.25));
}

export default function Staff() {
  const { user } = useAuth();
  const canEdit = ["admin", "principal", "hr"].includes(user?.role);

  const [q, setQ] = useState("");
  const [debQ, setDebQ] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("name");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebQ(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const params = { q: debQ, category, status, sort };
  const { data, loading, error: fetchError, refetch } = useApi(
    () => endpoints.staff(params),
    [debQ, category, status, sort]
  );

  useRealtime("staff.changed", () => refetch());

  const items = data?.items || [];
  const summary = data?.summary || {};
  const categories = data?.categories || Object.keys(CATEGORY_META);
  const statuses = data?.statuses || ["Active", "On leave", "Resigned", "Probation"];
  const employmentTypes = data?.employmentTypes || ["Full-time", "Part-time", "Contract", "Intern"];
  const designationsByCategory = data?.designationsByCategory || {};

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="People"
        title="Staff Directory"
        subtitle={
          summary?.total
            ? `${summary.total} staff across ${Object.keys(summary.byCategory).filter(c => summary.byCategory[c] > 0).length} categories · ${summary.active} active · ₹${(summary.payroll || 0).toLocaleString("en-IN")} monthly payroll`
            : "All non-faculty staff with full profiles"
        }
      />

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          <CircleAlert size={18} className="mt-0.5 shrink-0" />
          <div className="flex-1">{error}</div>
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {fetchError && <ErrorState error={fetchError} onRetry={refetch} />}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile icon={UsersIcon} label="Total staff" value={summary.total ?? "—"} tone="text-brand-300" />
        <StatTile icon={Check} label="Active" value={summary.active ?? "—"} tone="text-emerald-300" />
        <StatTile icon={Calendar} label="On leave" value={summary.onLeave ?? "—"} tone="text-amber-300" />
        <StatTile icon={Wallet} label="Monthly payroll" value={summary.payroll ? "₹" + summary.payroll.toLocaleString("en-IN") : "—"} tone="text-purple-300" />
      </div>

      {/* Category filter chips */}
      <div className="card">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <CategoryChip
            active={category === "all"}
            label="All"
            count={summary.total ?? 0}
            onClick={() => setCategory("all")}
          />
          {categories.map((c) => (
            <CategoryChip
              key={c}
              active={category === c}
              label={c}
              icon={CATEGORY_META[c]?.icon}
              count={summary.byCategory?.[c] ?? 0}
              tone={CATEGORY_META[c]}
              onClick={() => setCategory(c)}
            />
          ))}
        </div>

        {/* Search + status + sort + Add */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-1 min-w-[220px] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <Search size={16} className="text-white/55" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, id, designation, email, phone…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-white/40"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">Any status</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="name">Sort: Name</option>
            <option value="joined">Sort: Recently joined</option>
            <option value="salary">Sort: Salary</option>
          </select>
          {canEdit && (
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="btn-primary px-3 py-2 text-sm"
            >
              <Plus size={14} /> Add staff
            </button>
          )}
        </div>
      </div>

      {/* Card grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-sm text-white/55">
          No staff match your filters.{" "}
          {canEdit && (
            <button
              onClick={() => setEditing("new")}
              className="text-brand-300 underline-offset-2 hover:underline"
            >
              Add your first staff member
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((s, i) => (
            <StaffCard
              key={s.id}
              s={s}
              delay={i * 0.025}
              onOpen={() => setViewing(s)}
              canEdit={canEdit}
              onEdit={() => setEditing(s)}
              onDelete={() => setDeleting(s)}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {viewing && (
          <ProfileDrawer
            staff={viewing}
            canEdit={canEdit}
            onClose={() => setViewing(null)}
            onEdit={() => {
              setEditing(viewing);
              setViewing(null);
            }}
            onDelete={() => {
              setDeleting(viewing);
              setViewing(null);
            }}
          />
        )}
        {editing && (
          <StaffFormModal
            staff={editing === "new" ? null : editing}
            categories={categories}
            statuses={statuses}
            employmentTypes={employmentTypes}
            designationsByCategory={designationsByCategory}
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
            staff={deleting}
            onCancel={() => setDeleting(null)}
            onConfirm={async () => {
              try {
                await endpoints.staffDelete(deleting.id);
                setDeleting(null);
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

// ---------- list-level primitives ----------

function StatTile({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/50">
        <Icon size={12} className={tone} /> {label}
      </div>
      <div className={`mt-2 text-2xl font-semibold ${tone}`}>{value}</div>
    </div>
  );
}

function CategoryChip({ active, label, icon: Icon, count, tone, onClick }) {
  const base = "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition";
  const activeCls = tone
    ? `${tone.bg} ${tone.text} ${tone.ring}`
    : "bg-brand-500/20 text-brand-200 ring-brand-400/40";
  const idleCls = "bg-white/5 text-white/65 ring-white/10 hover:bg-white/10";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${active ? activeCls : idleCls}`}
    >
      {Icon && <Icon size={12} />}
      <span>{label}</span>
      <span className="rounded-full bg-black/30 px-1.5 py-0 text-[10px] tabular-nums">
        {count}
      </span>
    </button>
  );
}

function StaffCard({ s, delay, onOpen, canEdit, onEdit, onDelete }) {
  const meta = CATEGORY_META[s.category] || CATEGORY_META.Other;
  const Icon = meta.icon;
  const years = yearsBetween(s.joinedOn);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -3 }}
      className="card group relative overflow-hidden"
    >
      <div
        className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${meta.grad} opacity-50 blur-2xl transition-opacity group-hover:opacity-80`}
      />
      <button
        type="button"
        onClick={onOpen}
        className="relative block w-full text-left"
      >
        <div className="flex items-start gap-3">
          <Avatar
            photoUrl={s.photoUrl}
            initials={s.avatar}
            size={48}
            fallbackClass={meta.grad}
            ringClass="ring-1 ring-white/10"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-base font-semibold">
              {s.name}
            </div>
            <div className="truncate text-xs text-white/55">
              {s.designation}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ${meta.bg} ${meta.text} ${meta.ring}`}
              >
                <Icon size={9} /> {s.category}
              </span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ${STATUS_TONES[s.status] || STATUS_TONES.Active}`}
              >
                {s.status}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px] text-white/55">
          <div className="flex items-center gap-1 truncate">
            <IdCard size={10} /> {s.employeeCode || s.id}
          </div>
          <div className="flex items-center gap-1 truncate">
            <Calendar size={10} /> {years}y at school
          </div>
          {s.phone && (
            <div className="flex items-center gap-1 truncate col-span-2">
              <Phone size={10} /> {s.phone}
            </div>
          )}
        </div>
      </button>

      {canEdit && (
        <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="Edit"
            className="rounded-lg border border-white/10 bg-black/40 p-1.5 text-white/85 backdrop-blur hover:bg-black/60"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete"
            className="rounded-lg border border-rose-400/30 bg-rose-500/30 p-1.5 text-white backdrop-blur hover:bg-rose-500/50"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ---------- profile drawer ----------

function ProfileDrawer({ staff, canEdit, onClose, onEdit, onDelete }) {
  const s = staff;
  const meta = CATEGORY_META[s.category] || CATEGORY_META.Other;
  const Icon = meta.icon;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        exit={{ x: 400 }}
        transition={{ type: "spring", damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#0d0f24] shadow-2xl"
      >
        <div className={`relative overflow-hidden bg-gradient-to-br ${meta.grad} p-6 pb-8`}>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-white/65 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
          <div className="flex items-start gap-4">
            <Avatar
              photoUrl={s.photoUrl}
              initials={s.avatar}
              size={80}
              fallbackClass="from-white/20 to-white/10"
              ringClass="shadow-glow ring-2 ring-white/20"
            />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-2xl font-bold text-white">
                {s.name}
              </h2>
              <p className="text-sm text-white/85">{s.designation}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${meta.bg} ${meta.text} ${meta.ring}`}>
                  <Icon size={11} /> {s.category}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${STATUS_TONES[s.status] || STATUS_TONES.Active}`}>
                  {s.status}
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/85 ring-1 ring-white/15">
                  {s.employmentType}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <Section title="Identity">
            <KV k="Employee code" v={s.employeeCode || "—"} />
            <KV k="System ID" v={<span className="font-mono">{s.id}</span>} />
            <KV k="Department" v={s.department || "—"} />
            <KV k="Gender" v={s.gender === "M" ? "Male" : s.gender === "F" ? "Female" : "—"} />
          </Section>
          <Section title="Contact">
            <KV k="Email" v={s.email || "—"} icon={Mail} />
            <KV k="Phone" v={s.phone || "—"} icon={Phone} />
            <KV k="Address" v={s.address || "—"} icon={MapPin} />
          </Section>
          <Section title="Employment">
            <KV k="Joined" v={fmtDate(s.joinedOn)} icon={Calendar} />
            <KV k="Tenure" v={`${yearsBetween(s.joinedOn)} years`} />
            <KV k="Type" v={s.employmentType} />
            <KV k="Salary" v={fmtINR(s.salary)} icon={Wallet} />
          </Section>
          {s.emergencyContact && (s.emergencyContact.name || s.emergencyContact.phone) && (
            <Section title="Emergency contact">
              <KV k="Name" v={s.emergencyContact.name || "—"} />
              <KV k="Relation" v={s.emergencyContact.relation || "—"} />
              <KV k="Phone" v={s.emergencyContact.phone || "—"} icon={Phone} />
            </Section>
          )}
          {s.notes && (
            <Section title="Notes">
              <div className="text-sm text-white/80">{s.notes}</div>
            </Section>
          )}

          {canEdit && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={onEdit}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-500 to-accent-violet px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Pencil size={14} /> Edit profile
              </button>
              <button
                onClick={onDelete}
                className="flex items-center justify-center gap-2 rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-200 hover:bg-rose-500/20"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-2 text-[10px] uppercase tracking-wider text-white/45">
        {title}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function KV({ k, v, icon: Icon }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <div className="text-white/55">{k}</div>
      <div className="inline-flex items-center gap-1.5 text-right font-medium text-white">
        {Icon && <Icon size={12} className="text-white/40" />}
        <span>{v}</span>
      </div>
    </div>
  );
}

// ---------- form modal ----------

function StaffFormModal({
  staff,
  categories,
  statuses,
  employmentTypes,
  designationsByCategory,
  onClose,
  onSaved,
  onError,
}) {
  const isNew = !staff;
  const [form, setForm] = useState({
    name: staff?.name || "",
    category: staff?.category || categories[0] || "Administration",
    designation: staff?.designation || "",
    department: staff?.department || "",
    email: staff?.email || "",
    phone: staff?.phone || "",
    joinedOn: staff?.joinedOn || new Date().toISOString().slice(0, 10),
    status: staff?.status || "Active",
    employmentType: staff?.employmentType || "Full-time",
    salary: staff?.salary ?? "",
    gender: staff?.gender || "",
    address: staff?.address || "",
    ec_name: staff?.emergencyContact?.name || "",
    ec_relation: staff?.emergencyContact?.relation || "",
    ec_phone: staff?.emergencyContact?.phone || "",
    notes: staff?.notes || "",
    photoUrl: staff?.photoUrl || null,
  });
  const initials = (form.name || "?")
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // When category changes, pre-fill designation suggestion if blank
  useEffect(() => {
    if (form.designation) return;
    const sugg = designationsByCategory[form.category]?.[0];
    if (sugg) setForm((f) => ({ ...f, designation: sugg }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.category]);

  const designationOptions = designationsByCategory[form.category] || [];

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        category: form.category,
        designation: form.designation,
        department: form.department || form.category,
        email: form.email || null,
        phone: form.phone || null,
        joinedOn: form.joinedOn || null,
        status: form.status,
        employmentType: form.employmentType,
        salary: form.salary === "" ? null : Number(form.salary),
        gender: form.gender || null,
        address: form.address || null,
        emergencyContact:
          form.ec_name || form.ec_phone || form.ec_relation
            ? {
                name: form.ec_name || null,
                relation: form.ec_relation || null,
                phone: form.ec_phone || null,
              }
            : null,
        notes: form.notes || null,
        photoUrl: form.photoUrl || null,
      };
      if (isNew) await endpoints.staffAdd(payload);
      else await endpoints.staffUpdate(staff.id, payload);
      onSaved();
    } catch (err) {
      onError(err?.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50";

  return (
    <Modal onClose={onClose} wide>
      <form onSubmit={onSubmit}>
        <div className="flex items-center justify-between">
          <div>
            <div className="chip">
              <Sparkles size={13} className="text-accent-gold" />
              {isNew ? "Add staff" : `Edit ${staff.employeeCode || staff.id}`}
            </div>
            <h2 className="mt-2 font-display text-xl font-semibold">
              {isNew ? "New staff member" : staff.name}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-white/55 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <PhotoUploader
            photoUrl={form.photoUrl}
            initials={initials}
            onChange={(v) => setForm((f) => ({ ...f, photoUrl: v }))}
            fallbackClass={CATEGORY_META[form.category]?.grad || "from-brand-500 to-accent-violet"}
          />
        </div>

        <SectionHeading>Identity</SectionHeading>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Field label="Full name" className="col-span-2">
            <input required value={form.name} onChange={set("name")} className={inputCls} placeholder="Anand Rao" />
          </Field>
          <Field label="Gender">
            <select value={form.gender} onChange={set("gender")} className={inputCls}>
              <option value="" className="bg-black">—</option>
              <option value="M" className="bg-black">Male</option>
              <option value="F" className="bg-black">Female</option>
              <option value="O" className="bg-black">Other</option>
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={set("status")} className={inputCls}>
              {statuses.map((s) => (
                <option key={s} value={s} className="bg-black">{s}</option>
              ))}
            </select>
          </Field>
        </div>

        <SectionHeading>Role</SectionHeading>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Field label="Category">
            <select value={form.category} onChange={set("category")} className={inputCls}>
              {categories.map((c) => (
                <option key={c} value={c} className="bg-black">{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Designation">
            {designationOptions.length > 0 ? (
              <input
                value={form.designation}
                onChange={set("designation")}
                list="staff-designations"
                className={inputCls}
                placeholder="Job title"
              />
            ) : (
              <input value={form.designation} onChange={set("designation")} className={inputCls} placeholder="Job title" />
            )}
            {designationOptions.length > 0 && (
              <datalist id="staff-designations">
                {designationOptions.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            )}
          </Field>
          <Field label="Department">
            <input value={form.department} onChange={set("department")} className={inputCls} placeholder={form.category} />
          </Field>
          <Field label="Employment type">
            <select value={form.employmentType} onChange={set("employmentType")} className={inputCls}>
              {employmentTypes.map((t) => (
                <option key={t} value={t} className="bg-black">{t}</option>
              ))}
            </select>
          </Field>
        </div>

        <SectionHeading>Contact</SectionHeading>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Field label="Email">
            <input type="email" value={form.email} onChange={set("email")} className={inputCls} placeholder="name@lumina.edu" />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={set("phone")} className={inputCls} placeholder="+91 9XXXXXXXXX" />
          </Field>
          <Field label="Address">
            <input value={form.address} onChange={set("address")} className={inputCls} placeholder="Locality, City" />
          </Field>
        </div>

        <SectionHeading>Employment</SectionHeading>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Field label="Joined on">
            <input type="date" value={form.joinedOn} onChange={set("joinedOn")} className={`${inputCls} [color-scheme:dark]`} />
          </Field>
          <Field label="Salary (₹/month)">
            <input
              type="number"
              min={0}
              value={form.salary}
              onChange={set("salary")}
              className={inputCls}
              placeholder="e.g. 45000"
            />
          </Field>
        </div>

        <SectionHeading>Emergency contact</SectionHeading>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Field label="Name">
            <input value={form.ec_name} onChange={set("ec_name")} className={inputCls} />
          </Field>
          <Field label="Relation">
            <select value={form.ec_relation} onChange={set("ec_relation")} className={inputCls}>
              <option value="" className="bg-black">—</option>
              <option className="bg-black">Spouse</option>
              <option className="bg-black">Parent</option>
              <option className="bg-black">Sibling</option>
              <option className="bg-black">Friend</option>
              <option className="bg-black">Other</option>
            </select>
          </Field>
          <Field label="Phone">
            <input value={form.ec_phone} onChange={set("ec_phone")} className={inputCls} placeholder="+91 …" />
          </Field>
        </div>

        <SectionHeading>Notes</SectionHeading>
        <Field label="Internal notes (visible to HR)">
          <textarea
            rows={3}
            value={form.notes}
            onChange={set("notes")}
            className={`${inputCls} resize-none`}
            placeholder="Optional — certifications, prior employer, anything HR should know"
          />
        </Field>

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
            {isNew ? "Add staff" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function SectionHeading({ children }) {
  return (
    <div className="mt-5 mb-2 text-[10px] uppercase tracking-wider text-white/45">
      {children}
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[11px] uppercase tracking-wider text-white/55">
        {label}
      </span>
      {children}
    </label>
  );
}

function DeleteConfirmModal({ staff, onCancel, onConfirm }) {
  const [working, setWorking] = useState(false);
  return (
    <Modal onClose={onCancel}>
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-500/20 text-rose-300">
          <Trash2 size={18} />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold">Remove staff?</h2>
          <p className="text-sm text-white/55">{staff.name} · {staff.employeeCode || staff.id}</p>
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-xs text-rose-100">
        Removes the directory entry. Payroll, transport assignments and any
        other modules referencing this person by name will need separate
        cleanup.
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
          Remove
        </button>
      </div>
    </Modal>
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
        className={`max-h-[90vh] w-full ${wide ? "max-w-2xl" : "max-w-lg"} overflow-y-auto rounded-2xl border border-white/15 bg-[#0d0f24] p-6 shadow-2xl`}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
