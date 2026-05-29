import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  Pin,
  PinOff,
  Bell,
  AlertTriangle,
  AlertCircle,
  Calendar,
  Search,
  Filter,
  X,
  Plus,
  Check,
  CheckCheck,
  Eye,
  Clock,
  Users2,
  Sparkles as SparklesIcon,
  Paperclip,
  Trash2,
  GraduationCap,
} from "lucide-react";

const ALL_GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const ALL_SECTIONS = ["A", "B", "C", "D"];

function formatGradeTargets(grades, sections) {
  const g = Array.isArray(grades) ? grades : [];
  const s = Array.isArray(sections) ? sections : [];
  if (g.length === 0) return "Whole school";
  const gradeStr =
    g.length <= 3 ? g.map((x) => `Gr ${x}`).join(", ") : `${g.length} grades`;
  return s.length > 0 ? `${gradeStr} · Sec ${s.join("/")}` : gradeStr;
}
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const CATEGORY_TONES = {
  Academic: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  Event: "bg-accent-violet/15 text-purple-200 ring-accent-violet/30",
  Holiday: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  Sports: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Exam: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
  Admin: "bg-white/5 text-white/65 ring-white/15",
  Emergency: "bg-red-500/20 text-red-200 ring-red-400/40",
  PTM: "bg-accent-pink/15 text-pink-200 ring-accent-pink/30",
};

const AUDIENCE_LABELS = {
  all: "Everyone",
  students: "Students",
  parents: "Parents",
  teachers: "Teachers",
  staff: "Staff",
  admins: "Admins",
};

export default function NoticeBoard() {
  const { user } = useAuth();
  const canPost = ["admin", "principal", "teacher", "hr"].includes(user?.role);
  const canPin = ["admin", "principal", "hr"].includes(user?.role);
  const canDelete = ["admin", "principal"].includes(user?.role);

  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState("all");
  const [audience, setAudience] = useState("all");
  const [showExpired, setShowExpired] = useState(false);
  const [mineOnly, setMineOnly] = useState(false);
  const [view, setView] = useState("all"); // KPI-card driven view: all | pinned | expiring | ack
  const [creating, setCreating] = useState(false);
  const [opened, setOpened] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const params = useMemo(
    () => ({
      q: debounced,
      category,
      audience,
      includeExpired: showExpired ? "true" : undefined,
      mine: mineOnly ? "true" : undefined,
    }),
    [debounced, category, audience, showExpired, mineOnly]
  );

  const { data, loading, error, refetch } = useApi(
    () => endpoints.notices(params),
    [params]
  );

  useRealtime("notices.changed", () => refetch());

  const items = data?.items || [];
  const summary = data?.summary;
  const categories = data?.categories || [];
  const audiences = data?.audiences || [];

  const viewItems = items.filter((n) => {
    if (view === "pinned") return n.pinned;
    if (view === "expiring") return !n.expired && n.daysToExpiry <= 3;
    if (view === "ack") return !n.ackedByMe;
    return true;
  });
  const pinned = viewItems.filter((n) => n.pinned);
  const rest = viewItems.filter((n) => !n.pinned);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Announcements"
        title="Notice Board"
        subtitle={
          summary
            ? `${summary.live} live · ${summary.pinned} pinned · ${summary.unackedForMe} need your acknowledgement`
            : "Loading…"
        }
      />

      {error && <ErrorState error={error} onRetry={refetch} />}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <button type="button" onClick={() => setView("all")} className={`block w-full rounded-2xl text-left transition-all ${view === "all" ? "ring-1 ring-brand-400/50" : ""}`}>
          <StatTile
            icon={Megaphone}
            label="Live notices"
            value={summary ? summary.live : "—"}
            tint="from-brand-500/30"
          />
        </button>
        <button type="button" onClick={() => setView(view === "pinned" ? "all" : "pinned")} className={`block w-full rounded-2xl text-left transition-all ${view === "pinned" ? "ring-1 ring-brand-400/50" : ""}`}>
          <StatTile
            icon={Pin}
            label="Pinned"
            value={summary ? summary.pinned : "—"}
            tint="from-amber-500/30"
            accent="text-amber-300"
          />
        </button>
        <button type="button" onClick={() => setView(view === "expiring" ? "all" : "expiring")} className={`block w-full rounded-2xl text-left transition-all ${view === "expiring" ? "ring-1 ring-brand-400/50" : ""}`}>
          <StatTile
            icon={Clock}
            label="Expiring (≤3d)"
            value={summary ? summary.expiringSoon : "—"}
            tint="from-rose-500/30"
            accent="text-rose-300"
            pulse={(summary?.expiringSoon || 0) > 0}
          />
        </button>
        <button type="button" onClick={() => setView(view === "ack" ? "all" : "ack")} className={`block w-full rounded-2xl text-left transition-all ${view === "ack" ? "ring-1 ring-brand-400/50" : ""}`}>
          <StatTile
            icon={Bell}
            label="Need your ack"
            value={summary ? summary.unackedForMe : "—"}
            tint="from-accent-pink/30"
            accent="text-pink-300"
            pulse={(summary?.unackedForMe || 0) > 0}
          />
        </button>
      </div>

      {/* Filters */}
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={14} className="text-white/55" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search notices…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-white/55" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">Any category</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">Any audience</option>
            {audiences.map((a) => (
              <option key={a} value={a}>
                {AUDIENCE_LABELS[a] || a}
              </option>
            ))}
          </select>
          <Toggle
            on={mineOnly}
            onClick={() => setMineOnly((v) => !v)}
            icon={Users2}
          >
            For me
          </Toggle>
          <Toggle
            on={showExpired}
            onClick={() => setShowExpired((v) => !v)}
            icon={Eye}
          >
            Include expired
          </Toggle>
          {canPost && (
            <button
              onClick={() => setCreating(true)}
              className="btn-primary px-3 py-2 text-sm"
            >
              <Plus size={14} /> New notice
            </button>
          )}
        </div>
      </div>

      {/* Pinned strip */}
      {pinned.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-amber-300">
            <Pin size={12} /> Pinned
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {pinned.map((n, i) => (
              <NoticeCard
                key={n.id}
                notice={n}
                idx={i}
                emphasize
                onOpen={() => setOpened(n)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Rest */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : rest.length === 0 && pinned.length === 0 ? (
        <div className="card text-center text-white/55">
          <Megaphone className="mx-auto mb-2 text-white/30" size={20} />
          No notices match the current filters.
        </div>
      ) : rest.length > 0 ? (
        <div>
          {pinned.length > 0 && (
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-white/55">
              <Megaphone size={12} /> Recent
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {rest.map((n, i) => (
              <NoticeCard
                key={n.id}
                notice={n}
                idx={i}
                onOpen={() => setOpened(n)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* By-category breakdown */}
      {summary && (
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="font-display text-base font-semibold">
                Notices by category
              </div>
              <div className="text-xs text-white/55">
                Live only — expired notices excluded
              </div>
            </div>
            <SparklesIcon size={14} className="text-white/45" />
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary.byCategory)
              .filter(([, c]) => c > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, count]) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ring-1 transition-colors ${CATEGORY_TONES[cat] || "bg-white/5 text-white/65 ring-white/15"} hover:brightness-110`}
                >
                  {cat}
                  <span className="rounded-full bg-black/30 px-1.5 text-[10px] font-bold">
                    {count}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {creating && (
          <NewNoticeModal
            user={user}
            categories={categories}
            audiences={audiences}
            onClose={() => setCreating(false)}
            onCreated={() => {
              setCreating(false);
              refetch();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {opened && (
          <NoticeDetail
            notice={opened}
            canPin={canPin}
            canDelete={canDelete}
            onClose={() => setOpened(null)}
            onChanged={() => {
              refetch();
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

function Toggle({ on, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium ring-1 transition-colors ${
        on
          ? "bg-brand-500/20 text-brand-200 ring-brand-400/30"
          : "bg-white/5 text-white/65 ring-white/10 hover:bg-white/10"
      }`}
    >
      <Icon size={12} />
      {children}
    </button>
  );
}

function NoticeCard({ notice, idx, emphasize, onOpen }) {
  const n = notice;
  const isEmergency = n.category === "Emergency";
  return (
    <motion.button
      onClick={onOpen}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(idx * 0.02, 0.25) }}
      className={`card group relative overflow-hidden text-left transition-all hover:-translate-y-0.5 hover:shadow-glow ${
        isEmergency
          ? "border-red-400/30 bg-gradient-to-br from-red-500/10 to-transparent"
          : emphasize
          ? "border-amber-400/30 bg-gradient-to-br from-amber-500/10 to-transparent"
          : "hover:border-brand-500/30"
      } ${n.expired ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ring-1 ${
                CATEGORY_TONES[n.category] ||
                "bg-white/5 text-white/65 ring-white/15"
              }`}
            >
              {isEmergency && (
                <AlertTriangle size={9} className="mr-1" />
              )}
              {n.category}
            </span>
            {n.pinned && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-200 ring-1 ring-amber-400/30">
                <Pin size={9} /> Pinned
              </span>
            )}
            {n.isNew && !n.expired && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-500/20 px-1.5 py-0.5 text-[10px] text-brand-200 ring-1 ring-brand-400/30">
                NEW
              </span>
            )}
            {n.expired && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-white/5 px-1.5 py-0.5 text-[10px] text-white/45 ring-1 ring-white/15">
                Expired
              </span>
            )}
            {n.ackedByMe && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-200 ring-1 ring-emerald-400/30">
                <Check size={9} /> Acked
              </span>
            )}
          </div>
          <div className="mt-2 line-clamp-2 font-display text-base font-semibold">
            {n.title}
          </div>
          <div className="mt-1 line-clamp-2 text-xs text-white/65">
            {n.body}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/55">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <Users2 size={11} /> {AUDIENCE_LABELS[n.audience] || n.audience}
          </span>
          {Array.isArray(n.targetGrades) && n.targetGrades.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-1.5 py-0.5 text-brand-200 ring-1 ring-brand-400/25">
              <GraduationCap size={10} />
              {formatGradeTargets(n.targetGrades, n.targetSections)}
            </span>
          )}
          <span>·</span>
          <span>by {n.postedBy}</span>
        </div>
        <div className="flex items-center gap-2">
          {!n.expired && n.daysToExpiry <= 3 && (
            <span className="inline-flex items-center gap-0.5 text-rose-300">
              <Clock size={10} />
              {n.daysToExpiry <= 0 ? "Today" : `${n.daysToExpiry}d left`}
            </span>
          )}
          <span>{formatDate(n.postedAt)}</span>
        </div>
      </div>
    </motion.button>
  );
}

function NoticeDetail({ notice, canPin, canDelete, onClose, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [n, setN] = useState(notice);

  useEffect(() => setN(notice), [notice?.id]);

  async function ack() {
    setBusy(true);
    try {
      const updated = n.ackedByMe
        ? await endpoints.noticeUnack(n.id)
        : await endpoints.noticeAck(n.id);
      setN(updated);
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  async function togglePin() {
    setBusy(true);
    try {
      const updated = await endpoints.noticePin(n.id);
      setN(updated);
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!confirm("Delete this notice permanently?")) return;
    setBusy(true);
    try {
      await endpoints.noticeDelete(n.id);
      onChanged?.();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  const isEmergency = n.category === "Emergency";

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
        className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-[#0a0a1f] p-6 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {isEmergency && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/15 px-3 py-2 text-sm text-red-200">
            <AlertCircle size={16} />
            <span className="font-semibold">Emergency notice</span>
          </div>
        )}

        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ring-1 ${
                  CATEGORY_TONES[n.category] ||
                  "bg-white/5 text-white/65 ring-white/15"
                }`}
              >
                {n.category}
              </span>
              {n.pinned && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-200 ring-1 ring-amber-400/30">
                  <Pin size={9} /> Pinned
                </span>
              )}
              <span className="text-[11px] text-white/45">{n.id}</span>
            </div>
            <div className="mt-2 font-display text-xl font-semibold">
              {n.title}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/55">
              <span className="inline-flex items-center gap-1">
                <Users2 size={11} /> {AUDIENCE_LABELS[n.audience] || n.audience}
              </span>
              {Array.isArray(n.targetGrades) && n.targetGrades.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-1.5 py-0.5 text-brand-200 ring-1 ring-brand-400/25">
                  <GraduationCap size={11} />
                  {formatGradeTargets(n.targetGrades, n.targetSections)}
                </span>
              )}
              <span>·</span>
              <span>by {n.postedBy}</span>
              <span>·</span>
              <span>{formatDate(n.postedAt)}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/55 hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        <div className="card whitespace-pre-wrap text-sm leading-relaxed text-white/85">
          {n.body}
        </div>

        {n.attachmentUrl && (
          <a
            href={n.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-brand-300 hover:bg-white/10"
          >
            <Paperclip size={12} /> View attachment
          </a>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-[10px] uppercase tracking-wider text-white/55">
              Posted
            </div>
            <div className="mt-0.5 text-sm font-medium">
              {formatDate(n.postedAt)}
            </div>
            <div className="text-[10px] text-white/45">by {n.postedBy}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-[10px] uppercase tracking-wider text-white/55">
              Expires
            </div>
            <div className="mt-0.5 text-sm font-medium">
              {formatDate(n.expiresAt)}
            </div>
            <div
              className={`text-[10px] ${
                n.expired
                  ? "text-rose-300"
                  : n.daysToExpiry <= 3
                  ? "text-amber-300"
                  : "text-white/45"
              }`}
            >
              {n.expired
                ? "Expired"
                : n.daysToExpiry <= 0
                ? "Today"
                : `${n.daysToExpiry} day${n.daysToExpiry === 1 ? "" : "s"} left`}
            </div>
          </div>
        </div>

        {/* Ack section */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display text-sm font-semibold">
                Acknowledgement
              </div>
              <div className="text-xs text-white/55">
                {n.ackCount} {n.ackCount === 1 ? "person has" : "people have"} marked
                this as read
              </div>
            </div>
            <button
              disabled={busy}
              onClick={ack}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium ring-1 transition-colors disabled:opacity-50 ${
                n.ackedByMe
                  ? "bg-emerald-500/20 text-emerald-200 ring-emerald-400/30"
                  : "bg-brand-500/20 text-brand-200 ring-brand-400/30 hover:bg-brand-500/30"
              }`}
            >
              {n.ackedByMe ? (
                <>
                  <CheckCheck size={12} /> You've acknowledged · undo
                </>
              ) : (
                <>
                  <Check size={12} /> Mark as read
                </>
              )}
            </button>
          </div>
        </div>

        {/* Admin actions */}
        {(canPin || canDelete) && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {canPin && (
              <button
                disabled={busy}
                onClick={togglePin}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 disabled:opacity-50"
              >
                {n.pinned ? <PinOff size={12} /> : <Pin size={12} />}
                {n.pinned ? "Unpin" : "Pin"}
              </button>
            )}
            {canDelete && (
              <button
                disabled={busy}
                onClick={del}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 hover:bg-rose-500/20 disabled:opacity-50"
              >
                <Trash2 size={12} /> Delete
              </button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function NewNoticeModal({ user, categories, audiences, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    body: "",
    category: "Admin",
    audience: "all",
    pinned: false,
    expiresInDays: 14,
    attachmentUrl: "",
    targetGrades: [],
    targetSections: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleIn = (key, value) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value)
        ? f[key].filter((v) => v !== value)
        : [...f[key], value],
    }));

  // Teachers can only post grade-specific notices for grades they teach.
  const isTeacher = user?.role === "teacher";
  const teacherGrades = useMemo(() => {
    const cls = user?.scope?.classes || [];
    return [...new Set(cls.map((c) => Number(c.split("-")[0])))].sort((a, b) => a - b);
  }, [user]);
  const gradeChoices = isTeacher && teacherGrades.length ? teacherGrades : ALL_GRADES;

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setErr("Title and body are required");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      await endpoints.noticeAdd({
        ...form,
        expiresInDays: Number(form.expiresInDays),
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
        className="w-full max-w-lg overflow-y-auto rounded-3xl bg-[#0a0a1f] p-5 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="font-display text-base font-semibold">
            Post a new notice
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
              placeholder="e.g. School closed for Buddha Purnima"
            />
          </label>

          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Body
            </div>
            <textarea
              required
              rows={4}
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
              className={`${input} resize-y`}
              placeholder="Full message to display to the audience…"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
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
                Audience
              </div>
              <select
                value={form.audience}
                onChange={(e) => set("audience", e.target.value)}
                className={input}
              >
                {audiences.map((a) => (
                  <option key={a} value={a}>
                    {AUDIENCE_LABELS[a] || a}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Expires in (days)
              </div>
              <input
                type="number"
                min="1"
                max="365"
                value={form.expiresInDays}
                onChange={(e) => set("expiresInDays", e.target.value)}
                className={input}
              />
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Attachment URL (optional)
              </div>
              <input
                value={form.attachmentUrl}
                onChange={(e) => set("attachmentUrl", e.target.value)}
                className={input}
                placeholder="https://…"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/55">
                  Target classes
                </div>
                <div className="mt-0.5 text-[11px] text-white/45">
                  Leave empty to send to everyone in the audience above. Pick
                  grade(s) to limit visibility to those classes only.
                </div>
              </div>
              {form.targetGrades.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    set("targetGrades", []);
                    set("targetSections", []);
                  }}
                  className="text-[11px] text-white/55 underline-offset-2 hover:text-white hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="mt-2">
              <div className="text-[10px] uppercase tracking-wider text-white/55">
                Grades
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {gradeChoices.map((g) => {
                  const on = form.targetGrades.includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleIn("targetGrades", g)}
                      className={`rounded-full px-2.5 py-1 text-[11px] ring-1 transition-colors ${
                        on
                          ? "bg-brand-500/25 text-brand-100 ring-brand-400/40"
                          : "bg-white/5 text-white/60 ring-white/10 hover:bg-white/10"
                      }`}
                    >
                      Grade {g}
                    </button>
                  );
                })}
              </div>
            </div>
            {form.targetGrades.length > 0 && (
              <div className="mt-3">
                <div className="text-[10px] uppercase tracking-wider text-white/55">
                  Sections{" "}
                  <span className="font-normal normal-case text-white/40">
                    (leave empty for all sections)
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {ALL_SECTIONS.map((s) => {
                    const on = form.targetSections.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleIn("targetSections", s)}
                        className={`rounded-full px-2.5 py-1 text-[11px] ring-1 transition-colors ${
                          on
                            ? "bg-emerald-500/25 text-emerald-100 ring-emerald-400/40"
                            : "bg-white/5 text-white/60 ring-white/10 hover:bg-white/10"
                        }`}
                      >
                        Section {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => set("pinned", !form.pinned)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ring-1 transition-colors ${
              form.pinned
                ? "bg-amber-500/20 text-amber-200 ring-amber-400/30"
                : "bg-white/5 text-white/60 ring-white/10 hover:bg-white/10"
            }`}
          >
            {form.pinned ? <Pin size={12} /> : <PinOff size={12} />}
            {form.pinned ? "Pinned to top" : "Not pinned"}
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
            {submitting ? "Posting…" : "Post notice"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
