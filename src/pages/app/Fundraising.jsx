import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  HeartHandshake,
  Sprout,
  Building,
  Megaphone,
  Trophy,
  Gift,
  HandCoins,
  Users2,
  CalendarDays,
  Flag,
  ArrowUp,
  Rocket,
  IndianRupee,
  Plus,
  Search,
  Filter,
  X,
  Check,
  Trash2,
  Clock,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const CATEGORY_ICONS = {
  Infrastructure: Building,
  Scholarships: HeartHandshake,
  Sports: Trophy,
  "Arts & Culture": Sprout,
  Library: Megaphone,
  Technology: Rocket,
  Welfare: HandCoins,
  "Alumni Initiative": Gift,
  Other: Flag,
};

const STATUS_TONES = {
  Active: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Closed: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  Draft: "bg-white/5 text-white/65 ring-white/15",
};

const COVER_PALETTES = [
  "from-brand-500/30 to-accent-violet/20",
  "from-emerald-500/30 to-teal-500/20",
  "from-amber-500/30 to-orange-500/20",
  "from-accent-pink/30 to-rose-500/20",
  "from-accent-violet/30 to-accent-pink/20",
];

export default function Fundraising() {
  const { user } = useAuth();
  const canManage = ["admin", "principal"].includes(user?.role);

  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [creating, setCreating] = useState(false);
  const [openCampaign, setOpenCampaign] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const params = useMemo(
    () => ({ q: debounced, status, category }),
    [debounced, status, category]
  );

  const { data, loading, error, refetch } = useApi(
    () => endpoints.campaigns(params),
    [params]
  );

  useRealtime("fundraising.changed", () => refetch());

  const items = data?.items || [];
  const summary = data?.summary;
  const categories = data?.categories || [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Community"
        title="Donations & Fundraising"
        subtitle={
          summary
            ? `${summary.activeCampaigns} active · ₹${Number(
                summary.totalRaised
              ).toLocaleString("en-IN")} raised from ${summary.distinctDonors} donors`
            : "Loading…"
        }
      />

      {error && <ErrorState error={error} onRetry={refetch} />}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          icon={Target}
          label="Active campaigns"
          value={summary ? summary.activeCampaigns : "—"}
          tint="from-brand-500/30"
        />
        <StatTile
          icon={IndianRupee}
          label="Total raised"
          value={
            summary
              ? "₹" + Number(summary.totalRaised).toLocaleString("en-IN")
              : "—"
          }
          tint="from-emerald-500/30"
          accent="text-emerald-300"
        />
        <StatTile
          icon={Users2}
          label="Distinct donors"
          value={summary ? summary.distinctDonors : "—"}
          tint="from-accent-violet/30"
          accent="text-purple-300"
        />
        <StatTile
          icon={Clock}
          label="Closing in ≤14 days"
          value={summary ? summary.closingSoon : "—"}
          tint="from-amber-500/30"
          accent="text-amber-300"
          pulse={(summary?.closingSoon || 0) > 0}
        />
      </div>

      {/* Filters */}
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={14} className="text-white/55" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search campaigns…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-white/55" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">All statuses</option>
            <option value="Active">Active</option>
            <option value="Closed">Closed</option>
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          {canManage && (
            <button
              onClick={() => setCreating(true)}
              className="btn-primary px-3 py-2 text-sm"
            >
              <Plus size={14} /> New campaign
            </button>
          )}
        </div>
      </div>

      {/* Campaigns grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center text-white/55">
          <Target className="mx-auto mb-2 text-white/30" size={20} />
          No campaigns match the current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((c, i) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              idx={i}
              onOpen={() => setOpenCampaign(c)}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {creating && (
          <NewCampaignModal
            categories={categories}
            onClose={() => setCreating(false)}
            onCreated={() => {
              setCreating(false);
              refetch();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openCampaign && (
          <CampaignDetail
            campaignId={openCampaign.id}
            canManage={canManage}
            paymentModes={data?.paymentModes || []}
            onClose={() => setOpenCampaign(null)}
            onChanged={refetch}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- Stat tile ----------

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

// ---------- Campaign card ----------

function CampaignCard({ campaign, idx, onOpen }) {
  const c = campaign;
  const Icon = CATEGORY_ICONS[c.category] || Flag;
  const cover = c.coverColor || COVER_PALETTES[idx % COVER_PALETTES.length];
  const isClosed = c.status === "Closed";
  const isFunded = c.progressPct >= 100;

  return (
    <motion.button
      onClick={onOpen}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.25) }}
      className="card group relative overflow-hidden text-left transition-all hover:-translate-y-0.5 hover:shadow-glow"
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${cover} opacity-50`}
      />
      <div className="absolute -right-8 -top-8 opacity-15">
        <Icon size={120} className="text-white" />
      </div>
      <div className="relative">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] ring-1 ring-white/15">
              <Icon size={9} />
              {c.category}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ring-1 ${
                STATUS_TONES[c.status]
              }`}
            >
              {c.status}
            </span>
            {isFunded && c.status === "Active" && (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200 ring-1 ring-emerald-400/30">
                <Check size={9} className="-mt-0.5 mr-0.5 inline" />
                Goal met
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-white/45">{c.id}</span>
        </div>

        <div className="mt-3 line-clamp-2 font-display text-base font-semibold">
          {c.title}
        </div>
        {c.story && (
          <div className="mt-1 line-clamp-3 text-[11px] text-white/65">
            {c.story}
          </div>
        )}

        {/* Goal bar */}
        <div className="mt-3 space-y-1">
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="font-display text-xl font-bold">
                ₹{Number(c.raised).toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] text-white/55">
                of ₹{Number(c.goal).toLocaleString("en-IN")} goal
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-base font-bold text-emerald-300">
                {c.progressPct}%
              </div>
              <div className="text-[10px] text-white/55">funded</div>
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black/30">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(2, c.progressPct)}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-500 to-brand-500"
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-white/65">
          <div className="flex items-center gap-1">
            <Users2 size={11} /> {c.donorCount} donor
            {c.donorCount === 1 ? "" : "s"}
          </div>
          <div className="flex items-center gap-1">
            {isClosed ? (
              <span className="text-rose-300">closed</span>
            ) : c.daysLeft <= 0 ? (
              <span className="text-amber-300">ends today</span>
            ) : (
              <>
                <CalendarDays size={11} />
                <span>{c.daysLeft}d left</span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// ---------- Campaign detail panel ----------

function CampaignDetail({ campaignId, canManage, paymentModes, onClose, onChanged }) {
  const { data, loading, refetch } = useApi(
    () => endpoints.campaign(campaignId),
    [campaignId]
  );
  useRealtime("fundraising.changed", () => refetch());

  const [tab, setTab] = useState("donate");
  const [busy, setBusy] = useState(false);

  if (loading || !data) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <Skeleton className="h-96 w-full max-w-2xl" />
      </motion.div>
    );
  }

  const c = data.campaign;
  const donations = data.donations || [];
  const topDonors = data.topDonors || [];
  const Icon = CATEGORY_ICONS[c.category] || Flag;

  async function close() {
    if (!confirm("Close this campaign? Donations will be blocked.")) return;
    setBusy(true);
    try {
      await endpoints.campaignClose(c.id);
      refetch();
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!confirm("Delete this campaign permanently?")) return;
    setBusy(true);
    try {
      await endpoints.campaignDelete(c.id);
      onChanged?.();
      onClose();
    } catch (e) {
      alert(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
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
        initial={{ x: 560 }}
        animate={{ x: 0 }}
        exit={{ x: 560 }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        className="flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-[#0a0a1f] ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover */}
        <div className={`relative overflow-hidden bg-gradient-to-br ${c.coverColor} p-6`}>
          <div className="absolute -right-8 -top-8 opacity-20">
            <Icon size={160} className="text-white" />
          </div>
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] ring-1 ring-white/15">
                    <Icon size={10} />
                    {c.category}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ring-1 ${
                      STATUS_TONES[c.status]
                    }`}
                  >
                    {c.status}
                  </span>
                  {c.taxBenefit && (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200 ring-1 ring-emerald-400/30">
                      80G eligible
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-white/45">
                    {c.id}
                  </span>
                </div>
                <div className="mt-2 font-display text-2xl font-semibold">
                  {c.title}
                </div>
                <div className="text-xs text-white/65">
                  Beneficiary: {c.beneficiary} · by {c.createdBy}
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-white/65 hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-xl border border-white/10 bg-black/30 p-2">
                <div className="text-[10px] uppercase tracking-wider text-white/55">
                  Raised
                </div>
                <div className="mt-0.5 font-display text-lg font-bold text-emerald-300">
                  ₹{Number(c.raised).toLocaleString("en-IN")}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-2">
                <div className="text-[10px] uppercase tracking-wider text-white/55">
                  Goal
                </div>
                <div className="mt-0.5 font-display text-lg font-bold">
                  ₹{Number(c.goal).toLocaleString("en-IN")}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-2">
                <div className="text-[10px] uppercase tracking-wider text-white/55">
                  Donors
                </div>
                <div className="mt-0.5 font-display text-lg font-bold">
                  {c.donorCount}
                </div>
              </div>
            </div>
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider">
                <span className="text-white/55">Progress</span>
                <span className="text-emerald-200">
                  {c.progressPct}% · avg donation ₹
                  {Number(c.averageDonation).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-black/40">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(2, c.progressPct)}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-brand-500"
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-white/55">
                <span>
                  Started {formatDate(c.startDate)}
                </span>
                <span
                  className={
                    c.expired
                      ? "text-rose-300"
                      : c.daysLeft <= 7
                      ? "text-amber-300"
                      : ""
                  }
                >
                  {c.expired
                    ? `Ended ${formatDate(c.deadline)}`
                    : c.daysLeft <= 0
                    ? "Ends today"
                    : `Ends in ${c.daysLeft}d · ${formatDate(c.deadline)}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 p-6">
          {/* Story */}
          {c.story && (
            <div className="card whitespace-pre-wrap text-sm leading-relaxed text-white/85">
              {c.story}
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
            <TabBtn
              active={tab === "donate"}
              onClick={() => setTab("donate")}
              icon={HandCoins}
              disabled={c.status !== "Active"}
            >
              Donate
            </TabBtn>
            <TabBtn
              active={tab === "donors"}
              onClick={() => setTab("donors")}
              icon={Users2}
            >
              Donors ({donations.length})
            </TabBtn>
            <TabBtn active={tab === "top"} onClick={() => setTab("top")} icon={Trophy}>
              Top donors
            </TabBtn>
          </div>

          {tab === "donate" ? (
            c.status === "Active" ? (
              <DonateForm
                campaign={c}
                paymentModes={paymentModes}
                onDonated={() => {
                  refetch();
                  onChanged?.();
                  setTab("donors");
                }}
              />
            ) : (
              <div className="card text-sm text-white/55">
                This campaign is {c.status.toLowerCase()} and not accepting
                donations.
              </div>
            )
          ) : tab === "donors" ? (
            <DonorList
              donations={donations}
              canManage={canManage}
              onChanged={() => {
                refetch();
                onChanged?.();
              }}
            />
          ) : (
            <TopDonorList donors={topDonors} />
          )}

          {/* Admin actions */}
          {canManage && (
            <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
              {c.status === "Active" && (
                <button
                  onClick={close}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 disabled:opacity-50"
                >
                  Close campaign
                </button>
              )}
              <button
                onClick={del}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 hover:bg-rose-500/20 disabled:opacity-50"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function TabBtn({ active, onClick, icon: Icon, disabled, children }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-brand-500/25 text-brand-100 ring-1 ring-brand-400/30"
          : "text-white/55 hover:bg-white/5"
      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      <Icon size={12} />
      {children}
    </button>
  );
}

// ---------- Donor list ----------

function DonorList({ donations, canManage, onChanged }) {
  if (donations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-white/45">
        No donations yet — be the first to contribute.
      </div>
    );
  }

  async function cancel(d) {
    if (!confirm(`Cancel ${d.donorLabel}'s ₹${d.amount} donation?`)) return;
    await endpoints.donationCancel(d.id);
    onChanged?.();
  }

  return (
    <div className="space-y-2">
      {donations.map((d) => (
        <div
          key={d.id}
          className={`flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3 text-xs ${
            d.status === "Cancelled" ? "opacity-50 line-through" : ""
          }`}
        >
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold ${
              d.isAlumni
                ? "bg-gradient-to-br from-accent-violet to-accent-pink"
                : d.anonymous
                ? "bg-white/10"
                : "bg-gradient-to-br from-brand-500 to-accent-violet"
            }`}
          >
            {d.anonymous ? "?" : (d.donorLabel || "A")[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <div className="truncate font-medium">{d.donorLabel}</div>
              {d.isAlumni && (
                <span className="rounded-full bg-accent-violet/20 px-1.5 py-0.5 text-[9px] text-purple-200 ring-1 ring-accent-violet/30">
                  Alumnus
                </span>
              )}
              {d.anonymous && (
                <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] text-white/55 ring-1 ring-white/15">
                  Anonymous
                </span>
              )}
            </div>
            {d.donorSublabel && (
              <div className="truncate text-[10px] text-white/45">
                {d.donorSublabel}
              </div>
            )}
            {d.message && (
              <div className="mt-1 truncate text-[11px] italic text-white/65">
                "{d.message}"
              </div>
            )}
            <div className="mt-0.5 text-[10px] text-white/45">
              {d.paymentMode} · {d.txnRef} · {formatRelative(d.donatedAt)}
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-base font-bold text-emerald-300">
              ₹{Number(d.amount).toLocaleString("en-IN")}
            </div>
            {canManage && d.status === "Confirmed" && (
              <button
                onClick={() => cancel(d)}
                className="mt-1 rounded p-1 text-white/40 hover:bg-rose-500/15 hover:text-rose-200"
                title="Cancel donation"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function TopDonorList({ donors }) {
  if (donors.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-white/45">
        No identified top donors yet.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {donors.map((d, i) => (
        <div
          key={d.key}
          className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3 text-xs"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/30 text-amber-100">
            <Trophy size={13} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <div className="truncate font-medium">{d.donorLabel}</div>
              {d.isAlumni && (
                <span className="rounded-full bg-accent-violet/20 px-1.5 py-0.5 text-[9px] text-purple-200 ring-1 ring-accent-violet/30">
                  Alumnus
                </span>
              )}
            </div>
            {d.donorSublabel && (
              <div className="truncate text-[10px] text-white/45">
                {d.donorSublabel}
              </div>
            )}
            <div className="text-[10px] text-white/55">
              {d.count} donation{d.count === 1 ? "" : "s"}
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-base font-bold text-amber-300">
              ₹{Number(d.total).toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] text-white/55">#{i + 1}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Donate form ----------

function DonateForm({ campaign, paymentModes, onDonated }) {
  const [amount, setAmount] = useState(5000);
  const [donorName, setDonorName] = useState("");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [panNo, setPanNo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  // Alumnus picker
  const [alumQuery, setAlumQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [alumOptions, setAlumOptions] = useState([]);
  const [selectedAlumnus, setSelectedAlumnus] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(alumQuery), 250);
    return () => clearTimeout(t);
  }, [alumQuery]);

  useEffect(() => {
    if (!debounced || debounced.length < 2) {
      setAlumOptions([]);
      return;
    }
    let cancelled = false;
    endpoints
      .alumni({ q: debounced })
      .then((r) => {
        if (cancelled) return;
        setAlumOptions(r.items || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  async function submit(e) {
    e.preventDefault();
    if (!(Number(amount) > 0)) {
      setErr("Amount must be positive");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      await endpoints.donate({
        campaignId: campaign.id,
        amount: Number(amount),
        donorName: anonymous ? null : donorName || selectedAlumnus?.name || null,
        alumnusId: anonymous ? null : selectedAlumnus?.id || null,
        anonymous,
        message: message || null,
        paymentMode,
        panNo: panNo || null,
      });
      onDonated();
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const input =
    "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10";

  const QUICK_AMOUNTS = [1000, 5000, 10000, 25000, 50000, 100000];

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-wider text-emerald-200">
            Contribution amount
          </div>
          {campaign.taxBenefit && (
            <span className="text-[9px] text-emerald-300">
              80G tax deduction eligible
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <IndianRupee size={20} className="text-emerald-300" />
          <input
            type="number"
            required
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-transparent font-display text-3xl font-bold outline-none"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {QUICK_AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAmount(a)}
              className={`rounded-full px-3 py-1 text-[11px] ring-1 transition-colors ${
                Number(amount) === a
                  ? "bg-emerald-500/30 text-emerald-100 ring-emerald-400/40"
                  : "bg-white/5 text-white/65 ring-white/10 hover:bg-white/10"
              }`}
            >
              ₹{a.toLocaleString("en-IN")}
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-white/55">
          <span>Donor</span>
          <button
            type="button"
            onClick={() => {
              setAnonymous(!anonymous);
              if (!anonymous) {
                setDonorName("");
                setSelectedAlumnus(null);
                setAlumQuery("");
              }
            }}
            className={`rounded-full px-2 py-0.5 text-[10px] ring-1 ${
              anonymous
                ? "bg-accent-violet/20 text-purple-200 ring-accent-violet/30"
                : "bg-white/5 text-white/55 ring-white/10"
            }`}
          >
            {anonymous ? "Anonymous" : "Show my name"}
          </button>
        </div>
        {anonymous ? (
          <div className="rounded-xl border border-dashed border-white/10 p-3 text-center text-[11px] text-white/45">
            Your donation will be listed as anonymous.
          </div>
        ) : (
          <>
            <div className="mb-2">
              <input
                value={alumQuery}
                onChange={(e) => {
                  setAlumQuery(e.target.value);
                  if (selectedAlumnus) setSelectedAlumnus(null);
                }}
                placeholder="Are you an alumnus? Type your name to link…"
                className={input}
              />
              {selectedAlumnus ? (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-accent-violet/30 bg-accent-violet/10 p-2 text-xs">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-accent-violet to-accent-pink text-[10px] font-bold">
                    {selectedAlumnus.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">
                      {selectedAlumnus.name}
                    </div>
                    <div className="truncate text-[10px] text-white/55">
                      Class of {selectedAlumnus.gradYear} · {selectedAlumnus.city}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAlumnus(null);
                      setAlumQuery("");
                    }}
                    className="rounded p-1 text-white/55 hover:bg-white/10"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : alumOptions.length > 0 ? (
                <div className="mt-2 max-h-36 overflow-y-auto rounded-lg border border-white/10 bg-black/30">
                  {alumOptions.slice(0, 8).map((a) => (
                    <button
                      type="button"
                      key={a.id}
                      onClick={() => {
                        setSelectedAlumnus(a);
                        setDonorName(a.name);
                        setAlumQuery("");
                      }}
                      className="flex w-full items-center gap-2 border-b border-white/5 px-2 py-1.5 text-left text-xs last:border-0 hover:bg-white/5"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-accent-violet to-accent-pink text-[9px] font-bold">
                        {a.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{a.name}</div>
                        <div className="truncate text-[10px] text-white/55">
                          Class of {a.gradYear} · {a.city}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            {!selectedAlumnus && (
              <input
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="Or just type your name here"
                className={input}
              />
            )}
          </>
        )}
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
            Payment mode
          </div>
          <select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            className={input}
          >
            {paymentModes.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
            PAN (for receipt)
          </div>
          <input
            value={panNo}
            onChange={(e) => setPanNo(e.target.value.toUpperCase())}
            placeholder="ABCDE1234F"
            maxLength={10}
            disabled={anonymous}
            className={`${input} font-mono`}
          />
        </label>
      </div>

      <label className="block">
        <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
          Message (optional, 280 chars)
        </div>
        <textarea
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={280}
          placeholder="Why you're contributing…"
          className={`${input} resize-y`}
        />
      </label>

      {err && (
        <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {err}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full justify-center py-3 text-sm disabled:opacity-50"
      >
        {submitting ? "Processing…" : (
          <>
            <ArrowUp size={14} />
            Contribute ₹{Number(amount).toLocaleString("en-IN")}
          </>
        )}
      </button>
    </form>
  );
}

// ---------- New campaign modal ----------

function NewCampaignModal({ categories, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    story: "",
    category: categories[0] || "Other",
    goal: 500000,
    deadline: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
    beneficiary: "Lumina School",
    taxBenefit: false,
    coverColor: "from-brand-500/30 to-accent-violet/20",
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setErr("Title required");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      await endpoints.campaignAdd({
        ...form,
        goal: Number(form.goal),
      });
      onCreated();
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const input =
    "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10";

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
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0a0a1f] p-5 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="font-display text-base font-semibold">
            New fundraising campaign
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/55 hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Title
            </div>
            <input
              autoFocus
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className={input}
              placeholder="e.g. Robotics lab upgrade"
            />
          </label>

          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Story
            </div>
            <textarea
              rows={4}
              value={form.story}
              onChange={(e) => set("story", e.target.value)}
              className={`${input} resize-y`}
              placeholder="Tell donors why this matters."
            />
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Category
              </div>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className={input}
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Goal (₹)
              </div>
              <input
                type="number"
                required
                min="1"
                value={form.goal}
                onChange={(e) => set("goal", e.target.value)}
                className={input}
              />
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Deadline
              </div>
              <input
                type="date"
                required
                value={form.deadline}
                onChange={(e) => set("deadline", e.target.value)}
                className={input}
              />
            </label>
          </div>

          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Beneficiary
            </div>
            <input
              value={form.beneficiary}
              onChange={(e) => set("beneficiary", e.target.value)}
              className={input}
            />
          </label>

          <button
            type="button"
            onClick={() => set("taxBenefit", !form.taxBenefit)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ring-1 ${
              form.taxBenefit
                ? "bg-emerald-500/20 text-emerald-200 ring-emerald-400/30"
                : "bg-white/5 text-white/60 ring-white/10 hover:bg-white/10"
            }`}
          >
            {form.taxBenefit ? <Check size={12} /> : <X size={12} />}
            80G tax-benefit eligible
          </button>
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
            {submitting ? "Creating…" : "Launch campaign"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

// ---------- utils ----------

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRelative(iso) {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}
