import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Users,
  Star,
  Plus,
  Search,
  Filter,
  X,
  Briefcase,
  GraduationCap,
  MapPin,
  Heart,
  Sparkles as SparklesIcon,
  Mail,
  Phone,
  ExternalLink,
  BadgeCheck,
  CheckCircle2,
  HandCoins,
  Rocket,
  Globe,
  Building2,
  ArrowUpRight,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const DESTINATION_TONES = {
  College: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  Employed: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Entrepreneur: "bg-accent-pink/15 text-pink-200 ring-accent-pink/30",
  "Higher Studies Abroad":
    "bg-accent-violet/15 text-purple-200 ring-accent-violet/30",
  "Gap Year": "bg-white/5 text-white/65 ring-white/15",
  "Defence Services": "bg-amber-500/15 text-amber-300 ring-amber-400/30",
};

const DESTINATION_ICONS = {
  College: GraduationCap,
  Employed: Briefcase,
  Entrepreneur: Rocket,
  "Higher Studies Abroad": Globe,
  "Gap Year": SparklesIcon,
  "Defence Services": Award,
};

export default function Alumni() {
  const { user } = useAuth();
  const canEdit = ["admin", "principal", "hr"].includes(user?.role);

  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [destination, setDestination] = useState("all");
  const [stream, setStream] = useState("all");
  const [gradYear, setGradYear] = useState("all");
  const [city, setCity] = useState("all");
  const [chip, setChip] = useState("all"); // all|mentor|donor|verified
  const [sort, setSort] = useState("recent");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const params = useMemo(
    () => ({
      q: debounced,
      destination,
      stream,
      gradYear,
      city,
      mentor: chip === "mentor" ? "true" : undefined,
      donor: chip === "donor" ? "true" : undefined,
      verified: chip === "verified" ? "true" : undefined,
      sort,
    }),
    [debounced, destination, stream, gradYear, city, chip, sort]
  );

  const { data, loading, error, refetch } = useApi(
    () => endpoints.alumni(params),
    [params]
  );
  const { data: summary, refetch: refetchSummary } = useApi(
    () => endpoints.alumniSummary(),
    []
  );

  useRealtime("alumni.changed", () => {
    refetch();
    refetchSummary();
  });

  const items = data?.items || [];
  const destinations = data?.destinations || [];
  const streams = data?.streams || [];

  // Build years dropdown from data, capped at last 25
  const years = useMemo(() => {
    const set = new Set(items.map((a) => a.gradYear));
    return Array.from(set).sort((a, b) => b - a);
  }, [items]);

  // Build cities dropdown from data (unique, sorted)
  const cities = useMemo(() => {
    const set = new Set(items.map((a) => a.city));
    return Array.from(set).sort();
  }, [items]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Network"
        title="Alumni Network"
        subtitle={
          summary
            ? `${summary.total} alumni · ${summary.verified} verified · ${summary.mentors} mentors active`
            : "Loading…"
        }
      />

      {error && <ErrorState error={error} onRetry={refetch} />}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          icon={Users}
          label="Total alumni"
          value={summary ? summary.total : "—"}
          tint="from-brand-500/30"
        />
        <StatTile
          icon={BadgeCheck}
          label="Verified"
          value={summary ? summary.verified : "—"}
          tint="from-emerald-500/30"
          accent="text-emerald-300"
        />
        <StatTile
          icon={Heart}
          label="Mentors"
          value={summary ? summary.mentors : "—"}
          tint="from-accent-pink/30"
          accent="text-pink-300"
          pulse={(summary?.mentors || 0) > 0}
        />
        <StatTile
          icon={HandCoins}
          label="Donations"
          value={
            summary
              ? "₹" +
                (summary.donationTotal || 0).toLocaleString("en-IN")
              : "—"
          }
          tint="from-amber-500/30"
          accent="text-amber-300"
        />
      </div>

      {/* Featured mentors strip */}
      {summary?.featuredMentors?.length > 0 && (
        <div className="card relative overflow-hidden">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-accent-pink/20 to-accent-violet/20 blur-3xl" />
          <div className="relative">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="font-display text-lg font-semibold">
                  Featured mentors
                </div>
                <div className="text-xs text-white/55">
                  Verified alumni open to mentoring current students
                </div>
              </div>
              <SparklesIcon size={16} className="text-accent-pink" />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {summary.featuredMentors.slice(0, 3).map((m) => (
                <MentorCard
                  key={m.id}
                  alum={m}
                  onOpen={() => setSelected(m)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={14} className="text-white/55" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, ID, company, city, role…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-white/55" />
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">All destinations</option>
            {destinations.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <select
            value={stream}
            onChange={(e) => setStream(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">Any stream</option>
            {streams.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            value={gradYear}
            onChange={(e) => setGradYear(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">Any year</option>
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">Any city</option>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="recent">Most recent grad</option>
            <option value="oldest">Oldest first</option>
            <option value="name">A → Z</option>
          </select>
          {canEdit && (
            <button
              onClick={() => setCreating(true)}
              className="btn-primary px-3 py-2 text-sm"
            >
              <Plus size={14} /> Add alumnus
            </button>
          )}
        </div>
      </div>

      {/* Engagement chips */}
      <div className="flex flex-wrap items-center gap-2">
        <Chip active={chip === "all"} onClick={() => setChip("all")}>
          Everyone
        </Chip>
        <Chip
          active={chip === "mentor"}
          onClick={() => setChip("mentor")}
          icon={Heart}
          tone="pink"
        >
          Mentors only
        </Chip>
        <Chip
          active={chip === "donor"}
          onClick={() => setChip("donor")}
          icon={HandCoins}
          tone="amber"
        >
          Donors
        </Chip>
        <Chip
          active={chip === "verified"}
          onClick={() => setChip("verified")}
          icon={BadgeCheck}
          tone="emerald"
        >
          Verified
        </Chip>
        <div className="ml-auto text-xs text-white/55">
          {loading ? "Loading…" : `${items.length} results`}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center text-white/55">
          <Users className="mx-auto mb-2 text-white/30" size={20} />
          No alumni match the current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((a, i) => (
            <AlumniCard
              key={a.id}
              alum={a}
              idx={i}
              onClick={() => setSelected(a)}
            />
          ))}
        </div>
      )}

      {/* Top donors + city distribution */}
      {summary && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {summary.topDonors?.length > 0 && (
            <div className="card">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="font-display text-base font-semibold">
                    Top donors
                  </div>
                  <div className="text-xs text-white/55">
                    Lifetime contributions to the school
                  </div>
                </div>
                <HandCoins size={16} className="text-amber-300" />
              </div>
              <div className="space-y-2">
                {summary.topDonors.map((d, i) => (
                  <button
                    key={d.id}
                    onClick={() => setSelected(d)}
                    className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-2 text-left transition-colors hover:border-white/15 hover:bg-white/[0.06]"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-700 text-xs font-bold">
                      {d.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {d.name}
                      </div>
                      <div className="text-[11px] text-white/55">
                        Class of {d.gradYear} · {d.city}
                      </div>
                    </div>
                    <div className="text-sm font-display text-amber-300">
                      ₹{(d.donationTotal || 0).toLocaleString("en-IN")}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {summary.topCities?.length > 0 && (
            <div className="card">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="font-display text-base font-semibold">
                    Where alumni are
                  </div>
                  <div className="text-xs text-white/55">
                    Top cities by alumni count
                  </div>
                </div>
                <MapPin size={16} className="text-brand-300" />
              </div>
              <div className="space-y-2">
                {summary.topCities.map((c) => {
                  const pct =
                    summary.total > 0 ? (c.count / summary.total) * 100 : 0;
                  return (
                    <button
                      key={c.city}
                      onClick={() => setCity(c.city)}
                      className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-2 text-left transition-colors hover:border-white/15 hover:bg-white/[0.06]"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/20 text-brand-300">
                        <MapPin size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">{c.city}</div>
                          <div className="text-xs text-white/55">
                            {c.count} ·{" "}
                            <span className="text-white/40">
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full bg-gradient-to-r from-brand-500 to-accent-violet"
                            style={{ width: `${Math.max(4, pct)}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {creating && (
          <NewAlumniModal
            destinations={destinations}
            streams={streams}
            onClose={() => setCreating(false)}
            onCreated={() => {
              setCreating(false);
              refetch();
              refetchSummary();
            }}
          />
        )}
      </AnimatePresence>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <AlumniDetail
            alum={selected}
            canEdit={canEdit}
            onClose={() => setSelected(null)}
            onUpdated={() => {
              refetch();
              refetchSummary();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- pieces ----------

function StatTile({ icon: Icon, label, value, tint, pulse, accent }) {
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
          <div className={`stat-num glow-text ${accent || ""}`}>{value}</div>
        </div>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function Chip({ active, onClick, children, icon: Icon, tone }) {
  const toneClasses = {
    pink: "bg-accent-pink/20 text-pink-200 ring-accent-pink/30",
    amber: "bg-amber-500/20 text-amber-200 ring-amber-400/30",
    emerald: "bg-emerald-500/20 text-emerald-200 ring-emerald-400/30",
  };
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-all ${
        active
          ? tone
            ? toneClasses[tone]
            : "bg-brand-500/20 text-brand-200 ring-brand-400/30"
          : "bg-white/5 text-white/60 ring-white/10 hover:bg-white/10"
      }`}
    >
      {Icon && <Icon size={11} />}
      {children}
    </button>
  );
}

function MentorCard({ alum, onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="group relative overflow-hidden rounded-2xl border border-accent-pink/20 bg-gradient-to-br from-accent-pink/10 to-accent-violet/10 p-4 text-left transition-all hover:border-accent-pink/40 hover:shadow-glow"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-pink to-accent-violet font-display text-base font-bold text-white shadow-glow">
          {alum.avatar}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <div className="truncate font-display text-sm font-semibold">
              {alum.name}
            </div>
            {alum.verified && (
              <BadgeCheck size={12} className="text-emerald-300" />
            )}
          </div>
          <div className="text-[11px] text-white/60">
            Class of {alum.gradYear} · {alum.city}
          </div>
          {alum.role && (
            <div className="mt-1 text-[11px] text-white/75">
              {alum.role}
              {alum.destinationLabel ? ` · ${alum.destinationLabel}` : ""}
            </div>
          )}
        </div>
        <ArrowUpRight
          size={14}
          className="text-white/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      </div>
      {alum.mentorAreas?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {alum.mentorAreas.map((a) => (
            <span
              key={a}
              className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70"
            >
              {a}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

function AlumniCard({ alum, idx, onClick }) {
  const Icon = DESTINATION_ICONS[alum.destination] || Briefcase;
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(idx * 0.02, 0.3) }}
      className="card group relative overflow-hidden text-left transition-all hover:-translate-y-0.5 hover:border-brand-500/30 hover:shadow-glow"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-violet font-display text-sm font-bold text-white shadow-glow">
          {alum.avatar}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <div className="truncate font-display text-base font-semibold">
              {alum.name}
            </div>
            {alum.verified && (
              <BadgeCheck
                size={13}
                className="flex-shrink-0 text-emerald-300"
              />
            )}
          </div>
          <div className="text-[11px] text-white/55">
            {alum.id} · Class of {alum.gradYear} · {alum.stream}
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-2 text-xs">
          <Icon size={12} className="flex-shrink-0 text-white/55" />
          <div
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ring-1 ${
              DESTINATION_TONES[alum.destination]
            }`}
          >
            {alum.destination}
          </div>
          {alum.destinationLabel && (
            <div className="truncate text-white/75">{alum.destinationLabel}</div>
          )}
        </div>
        {alum.role && (
          <div className="flex items-center gap-2 text-xs text-white/65">
            <Building2 size={12} className="flex-shrink-0 text-white/45" />
            <span className="truncate">{alum.role}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-white/55">
          <MapPin size={12} className="flex-shrink-0 text-white/45" />
          <span className="truncate">{alum.city}</span>
        </div>
      </div>

      {alum.blurb && (
        <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-500/10 p-2 text-[11px] text-amber-200">
          <Star size={10} className="mr-1 inline text-amber-300" />
          {alum.blurb}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {alum.mentor && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-pink/15 px-2 py-0.5 text-[10px] text-pink-200 ring-1 ring-accent-pink/30">
            <Heart size={9} /> Mentor
          </span>
        )}
        {alum.donor && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-200 ring-1 ring-amber-400/30">
            <HandCoins size={9} /> Donor
          </span>
        )}
      </div>
    </motion.button>
  );
}

// ---------- detail side-panel ----------

function AlumniDetail({ alum, canEdit, onClose, onUpdated }) {
  const [contacting, setContacting] = useState(false);
  const [updatedAlum, setUpdatedAlum] = useState(alum);

  useEffect(() => {
    setUpdatedAlum(alum);
  }, [alum?.id]);

  const a = updatedAlum;
  const Icon = DESTINATION_ICONS[a.destination] || Briefcase;

  async function logContact(channel) {
    setContacting(true);
    try {
      const updated = await endpoints.alumniContact(a.id, channel);
      setUpdatedAlum(updated);
      onUpdated?.();
    } catch (e) {
      console.error(e);
    } finally {
      setContacting(false);
    }
  }

  async function toggle(field) {
    try {
      const updated = await endpoints.alumniUpdate(a.id, { [field]: !a[field] });
      setUpdatedAlum(updated);
      onUpdated?.();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: 480 }}
        animate={{ x: 0 }}
        exit={{ x: 480 }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-[#0a0a1f] p-6 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-violet font-display text-base font-bold text-white shadow-glow">
              {a.avatar}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <div className="font-display text-lg font-semibold">
                  {a.name}
                </div>
                {a.verified && (
                  <BadgeCheck size={14} className="text-emerald-300" />
                )}
              </div>
              <div className="text-xs text-white/55">
                {a.id} · Class of {a.gradYear} · {a.stream} · {a.house}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/55 hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        {/* Current life */}
        <div className="card mb-3 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Icon size={14} className="text-brand-300" />
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ring-1 ${
                DESTINATION_TONES[a.destination]
              }`}
            >
              {a.destination}
            </span>
          </div>
          {a.destinationLabel && (
            <div className="text-sm font-medium">{a.destinationLabel}</div>
          )}
          {a.role && (
            <div className="text-xs text-white/65">{a.role}</div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-white/55">
            <MapPin size={11} />
            {a.city}
          </div>
        </div>

        {/* Blurb */}
        {a.blurb && (
          <div className="card mb-3 border-amber-400/20 bg-gradient-to-br from-amber-500/10 to-transparent">
            <div className="mb-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-300">
              <Star size={10} /> Notable
            </div>
            <div className="text-sm text-amber-100">{a.blurb}</div>
          </div>
        )}

        {/* Engagement chips */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Pill on={a.verified} icon={BadgeCheck} label="Verified" tone="emerald" />
          <Pill on={a.mentor} icon={Heart} label="Mentor" tone="pink" />
          <Pill on={a.donor} icon={HandCoins} label="Donor" tone="amber" />
        </div>

        {/* Mentor areas */}
        {a.mentor && a.mentorAreas?.length > 0 && (
          <div className="card mb-3">
            <div className="mb-2 text-[10px] uppercase tracking-wider text-white/55">
              Mentoring areas
            </div>
            <div className="flex flex-wrap gap-1.5">
              {a.mentorAreas.map((m) => (
                <span
                  key={m}
                  className="rounded-full bg-accent-pink/15 px-2 py-0.5 text-[11px] text-pink-200 ring-1 ring-accent-pink/30"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Donations */}
        {a.donor && a.donationTotal > 0 && (
          <div className="card mb-3 border-amber-400/20 bg-gradient-to-br from-amber-500/10 to-transparent">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-amber-300">
              Lifetime contribution
            </div>
            <div className="font-display text-2xl font-bold text-amber-200">
              ₹{a.donationTotal.toLocaleString("en-IN")}
            </div>
          </div>
        )}

        {/* Contact */}
        <div className="card mb-3 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-white/55">
            Contact
          </div>
          <a
            href={`mailto:${a.email}`}
            className="flex items-center gap-2 text-xs text-white/75 hover:text-brand-300"
          >
            <Mail size={12} /> {a.email}
          </a>
          {a.phone && (
            <a
              href={`tel:${a.phone.replace(/\s+/g, "")}`}
              className="flex items-center gap-2 text-xs text-white/75 hover:text-brand-300"
            >
              <Phone size={12} /> {a.phone}
            </a>
          )}
          {a.linkedIn && (
            <a
              href={`https://${a.linkedIn}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-white/75 hover:text-brand-300"
            >
              <ExternalLink size={12} /> {a.linkedIn}
            </a>
          )}
        </div>

        {/* Contact log */}
        <div className="card mb-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wider text-white/55">
              Outreach log
            </div>
            {a.lastContactedAt ? (
              <div className="text-[11px] text-white/65">
                Last: {a.lastContactedAt}
                {a.lastContactBy ? ` · by ${a.lastContactBy}` : ""}
              </div>
            ) : (
              <div className="text-[11px] text-white/45">No contact logged</div>
            )}
          </div>
          {canEdit && (
            <div className="flex flex-wrap gap-2">
              <button
                disabled={contacting}
                onClick={() => logContact("email")}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs hover:bg-white/10 disabled:opacity-50"
              >
                <Mail size={11} /> Logged email
              </button>
              <button
                disabled={contacting}
                onClick={() => logContact("phone")}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs hover:bg-white/10 disabled:opacity-50"
              >
                <Phone size={11} /> Logged call
              </button>
              <button
                disabled={contacting}
                onClick={() => logContact("event")}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs hover:bg-white/10 disabled:opacity-50"
              >
                <SparklesIcon size={11} /> Met at event
              </button>
            </div>
          )}
        </div>

        {/* Admin toggles */}
        {canEdit && (
          <div className="card space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-white/55">
              Admin
            </div>
            <ToggleRow
              icon={BadgeCheck}
              label="Verified contact"
              on={a.verified}
              onClick={() => toggle("verified")}
            />
            <ToggleRow
              icon={Heart}
              label="Open to mentoring"
              on={a.mentor}
              onClick={() => toggle("mentor")}
            />
            <ToggleRow
              icon={HandCoins}
              label="Donor"
              on={a.donor}
              onClick={() => toggle("donor")}
            />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function Pill({ on, icon: Icon, label, tone }) {
  if (!on) return null;
  const tones = {
    pink: "bg-accent-pink/15 text-pink-200 ring-accent-pink/30",
    amber: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
    emerald: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ring-1 ${tones[tone]}`}
    >
      <Icon size={10} /> {label}
    </span>
  );
}

function ToggleRow({ icon: Icon, label, on, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-sm transition-colors hover:border-white/15 hover:bg-white/[0.06]"
    >
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-white/55" />
        <span>{label}</span>
      </div>
      <div
        className={`h-5 w-9 rounded-full p-0.5 transition-colors ${
          on ? "bg-emerald-500/60" : "bg-white/10"
        }`}
      >
        <div
          className={`h-4 w-4 rounded-full bg-white transition-transform ${
            on ? "translate-x-4" : ""
          }`}
        />
      </div>
    </button>
  );
}

// ---------- create modal ----------

function NewAlumniModal({ destinations, streams, onClose, onCreated }) {
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState({
    name: "",
    gradYear: currentYear - 1,
    stream: "Science",
    destination: "Employed",
    destinationLabel: "",
    role: "",
    city: "",
    email: "",
    phone: "",
    linkedIn: "",
    verified: false,
    mentor: false,
    donor: false,
    blurb: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setErr("Name required");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      await endpoints.alumniAdd({
        ...form,
        gradYear: Number(form.gradYear),
        consent: { contact: form.verified, directory: true },
      });
      onCreated();
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.form
        onSubmit={submit}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 320 }}
        className="w-full max-w-lg overflow-y-auto rounded-3xl bg-[#0a0a1f] p-5 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="font-display text-base font-semibold">
            Add alumnus
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/55 hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Full name" colSpan={2}>
            <input
              autoFocus
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
              placeholder="e.g. Riya Sharma"
            />
          </Field>
          <Field label="Grad year">
            <input
              type="number"
              min="1980"
              max={currentYear}
              required
              value={form.gradYear}
              onChange={(e) => set("gradYear", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
            />
          </Field>
          <Field label="Stream">
            <select
              value={form.stream}
              onChange={(e) => set("stream", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
            >
              {streams.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Destination">
            <select
              value={form.destination}
              onChange={(e) => set("destination", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
            >
              {destinations.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>
          <Field label="College / Employer">
            <input
              value={form.destinationLabel}
              onChange={(e) => set("destinationLabel", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
              placeholder="IIT Bombay"
            />
          </Field>
          <Field label="Current role" colSpan={2}>
            <input
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
              placeholder="Software Engineer"
            />
          </Field>
          <Field label="City">
            <input
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
              placeholder="Bengaluru"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
              placeholder="riya@example.com"
            />
          </Field>
          <Field label="Phone">
            <input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
              placeholder="+91 98xxx xxxxx"
            />
          </Field>
          <Field label="LinkedIn">
            <input
              value={form.linkedIn}
              onChange={(e) => set("linkedIn", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
              placeholder="linkedin.com/in/riya"
            />
          </Field>
          <Field label="Notable accomplishment" colSpan={2}>
            <input
              value={form.blurb}
              onChange={(e) => set("blurb", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
              placeholder="e.g. Forbes 30 Under 30"
            />
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <Check
            on={form.verified}
            onClick={() => set("verified", !form.verified)}
            icon={BadgeCheck}
          >
            Verified contact
          </Check>
          <Check
            on={form.mentor}
            onClick={() => set("mentor", !form.mentor)}
            icon={Heart}
          >
            Open to mentoring
          </Check>
          <Check
            on={form.donor}
            onClick={() => set("donor", !form.donor)}
            icon={HandCoins}
          >
            Donor
          </Check>
        </div>

        {err && (
          <div className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {err}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm text-white/65 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save alumnus"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function Field({ label, children, colSpan = 1 }) {
  return (
    <label className={`block ${colSpan === 2 ? "col-span-2" : ""}`}>
      <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
        {label}
      </div>
      {children}
    </label>
  );
}

function Check({ on, onClick, children, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ring-1 transition-colors ${
        on
          ? "bg-brand-500/20 text-brand-200 ring-brand-400/30"
          : "bg-white/5 text-white/60 ring-white/10 hover:bg-white/10"
      }`}
    >
      {on ? <CheckCircle2 size={12} /> : <Icon size={12} />}
      {children}
    </button>
  );
}
