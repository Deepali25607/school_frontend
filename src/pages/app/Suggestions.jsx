import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb,
  ArrowBigUp,
  MessageCircle,
  Send,
  EyeOff,
  ShieldCheck,
  Sprout,
  Utensils,
  Building,
  Lock,
  Zap,
  Palette,
  Laptop,
  Plus,
  Search,
  Filter,
  X,
  Trash2,
  CheckCircle2,
  XCircle,
  Hourglass,
  Hammer,
  Compass,
  Clock,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const CATEGORY_ICONS = {
  Academic: Sprout,
  Facilities: Building,
  Cafeteria: Utensils,
  Sports: Zap,
  Cultural: Palette,
  Safety: Lock,
  Technology: Laptop,
  Transport: Compass,
  Hostel: Building,
  Other: Lightbulb,
};

const CATEGORY_TONES = {
  Academic: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  Facilities: "bg-accent-violet/15 text-purple-200 ring-accent-violet/30",
  Cafeteria: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
  Sports: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Cultural: "bg-accent-pink/15 text-pink-200 ring-accent-pink/30",
  Safety: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  Technology: "bg-cyan-500/15 text-cyan-300 ring-cyan-400/30",
  Transport: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  Hostel: "bg-white/5 text-white/65 ring-white/15",
  Other: "bg-white/5 text-white/65 ring-white/15",
};

const STATUS_TONES = {
  Submitted: "bg-white/5 text-white/65 ring-white/15",
  "Under Review": "bg-amber-500/15 text-amber-200 ring-amber-400/30",
  Planned: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  "In Progress": "bg-accent-violet/15 text-purple-200 ring-accent-violet/30",
  Implemented: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Rejected: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

const STATUS_ICONS = {
  Submitted: Send,
  "Under Review": Hourglass,
  Planned: ShieldCheck,
  "In Progress": Hammer,
  Implemented: CheckCircle2,
  Rejected: XCircle,
};

export default function Suggestions() {
  const { user } = useAuth();
  const canDecide = ["admin", "principal", "hr"].includes(user?.role);
  const canDelete = ["admin", "principal"].includes(user?.role);

  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("trending");
  const [mineOnly, setMineOnly] = useState(false);
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
      status,
      sort,
      mine: mineOnly ? "true" : undefined,
    }),
    [debounced, category, status, sort, mineOnly]
  );

  const { data, loading, error, refetch } = useApi(
    () => endpoints.suggestions(params),
    [params]
  );

  useRealtime("suggestions.changed", () => refetch());

  const items = data?.items || [];
  const summary = data?.summary;
  const categories = data?.categories || [];
  const statuses = data?.statuses || [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Voice"
        title="Suggestion Box"
        subtitle={
          summary
            ? `${summary.total} ideas · ${summary.totalVotes} upvotes · ${summary.implemented} implemented`
            : "Loading…"
        }
      />

      {error && <ErrorState error={error} onRetry={refetch} />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          icon={Lightbulb}
          label="Total ideas"
          value={summary ? summary.total : "—"}
          tint="from-amber-500/30"
          accent="text-amber-300"
        />
        <StatTile
          icon={ArrowBigUp}
          label="Upvotes"
          value={summary ? summary.totalVotes : "—"}
          tint="from-brand-500/30"
        />
        <button type="button" onClick={() => setStatus(status === "In Progress" ? "all" : "In Progress")} className={`block w-full rounded-2xl text-left transition-all ${status === "In Progress" ? "ring-1 ring-brand-400/50" : ""}`}>
          <StatTile
            icon={Hammer}
            label="In progress"
            value={summary ? summary.inProgress + summary.planned : "—"}
            subValue={
              summary
                ? `${summary.planned} planned · ${summary.inProgress} active`
                : null
            }
            tint="from-accent-violet/30"
            accent="text-purple-300"
          />
        </button>
        <button type="button" onClick={() => setStatus(status === "Implemented" ? "all" : "Implemented")} className={`block w-full rounded-2xl text-left transition-all ${status === "Implemented" ? "ring-1 ring-brand-400/50" : ""}`}>
          <StatTile
            icon={CheckCircle2}
            label="Implemented"
            value={summary ? summary.implemented : "—"}
            tint="from-emerald-500/30"
            accent="text-emerald-300"
            pulse={(summary?.implemented || 0) > 0}
          />
        </button>
      </div>

      {/* Status pipeline + Top idea callout */}
      {summary && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="card lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="font-display text-base font-semibold">
                  Status pipeline
                </div>
                <div className="text-xs text-white/55">
                  How ideas are moving along
                </div>
              </div>
              <Filter size={14} className="text-white/45" />
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {statuses.map((s) => {
                const I = STATUS_ICONS[s] || Send;
                const n = summary.byStatus?.[s] || 0;
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`flex flex-col items-center gap-1 rounded-xl p-2 text-center text-[10px] ring-1 transition-colors ${STATUS_TONES[s]} hover:brightness-110`}
                  >
                    <I size={13} />
                    <div className="font-display text-base font-bold">{n}</div>
                    <div className="text-[9px] opacity-80">{s}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {summary.topIdea && (
            <div className="card relative overflow-hidden">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-amber-500/20 to-accent-pink/20 blur-3xl" />
              <div className="relative">
                <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-amber-300">
                  <ArrowBigUp size={11} fill="currentColor" /> Top idea
                </div>
                <div className="font-display text-sm font-semibold">
                  {summary.topIdea.title}
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-white/55">
                  <span className="font-display text-2xl font-bold text-amber-300">
                    {summary.topIdea.votes}
                  </span>
                  upvotes
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={14} className="text-white/55" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search ideas…"
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
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">All statuses</option>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="trending">Trending</option>
            <option value="most-voted">Most upvoted</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
          <Toggle on={mineOnly} onClick={() => setMineOnly((v) => !v)}>
            Mine
          </Toggle>
          <button
            onClick={() => setCreating(true)}
            className="btn-primary px-3 py-2 text-sm"
          >
            <Plus size={14} /> Post idea
          </button>
        </div>
      </div>

      {/* Ideas feed */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center text-white/55">
          <Lightbulb className="mx-auto mb-2 text-white/30" size={20} />
          No ideas match the current filters — be the first to post one!
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((i, idx) => (
            <IdeaCard
              key={i.id}
              idea={i}
              idx={idx}
              onOpen={() => setOpened(i)}
              onVoted={refetch}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {creating && (
          <NewIdeaModal
            categories={categories}
            onClose={() => setCreating(false)}
            onCreated={() => {
              setCreating(false);
              refetch();
            }}
          />
        )}
        {opened && (
          <IdeaDetail
            ideaId={opened.id}
            canDecide={canDecide}
            canDelete={canDelete}
            statusFlow={data?.statusFlow || {}}
            onClose={() => setOpened(null)}
            onChanged={refetch}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- pieces ----------

function StatTile({ icon: Icon, label, value, subValue, tint, pulse, accent }) {
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
          {subValue && (
            <div className="mt-1 text-[10px] text-white/55">{subValue}</div>
          )}
        </div>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function Toggle({ on, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium ring-1 transition-colors ${
        on
          ? "bg-brand-500/20 text-brand-200 ring-brand-400/30"
          : "bg-white/5 text-white/65 ring-white/10 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function IdeaCard({ idea, idx, onOpen, onVoted }) {
  const i = idea;
  const CatIcon = CATEGORY_ICONS[i.category] || Lightbulb;
  const StatusIcon = STATUS_ICONS[i.status] || Send;
  const [busy, setBusy] = useState(false);

  async function vote(e) {
    e.stopPropagation();
    setBusy(true);
    try {
      if (i.upvotedByMe) await endpoints.suggestionUnvote(i.id);
      else await endpoints.suggestionUpvote(i.id);
      onVoted?.();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.2) }}
      className="card flex items-start gap-3 transition-colors hover:border-brand-500/20"
    >
      {/* Vote button */}
      <button
        onClick={vote}
        disabled={busy}
        className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 ring-1 transition-all disabled:opacity-50 ${
          i.upvotedByMe
            ? "bg-amber-500/20 text-amber-300 ring-amber-400/40"
            : "bg-white/5 text-white/65 ring-white/10 hover:bg-amber-500/15 hover:text-amber-200 hover:ring-amber-400/30"
        }`}
      >
        <ArrowBigUp
          size={20}
          fill={i.upvotedByMe ? "currentColor" : "none"}
        />
        <span className="font-display text-base font-bold">{i.upvotes}</span>
      </button>

      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ring-1 ${
              CATEGORY_TONES[i.category] ||
              "bg-white/5 text-white/65 ring-white/15"
            }`}
          >
            <CatIcon size={9} />
            {i.category}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ring-1 ${
              STATUS_TONES[i.status]
            }`}
          >
            <StatusIcon size={9} />
            {i.status}
          </span>
          {i.anonymous && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-white/5 px-1.5 py-0.5 text-[10px] text-white/55 ring-1 ring-white/15">
              <EyeOff size={9} /> Anonymous
            </span>
          )}
        </div>
        <div className="mt-2 font-display text-base font-semibold">
          {i.title}
        </div>
        <div className="mt-1 line-clamp-2 text-[12px] text-white/65">
          {i.body}
        </div>
        <div className="mt-2 flex items-center gap-3 text-[10px] text-white/45">
          <span>by {i.anonymous ? "Anonymous" : i.submittedBy || "—"}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock size={9} /> {formatRelative(i.createdAt)}
          </span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle size={9} /> {i.commentCount}
          </span>
        </div>
      </button>
    </motion.div>
  );
}

// ---------- Detail panel ----------

function IdeaDetail({
  ideaId,
  canDecide,
  canDelete,
  statusFlow,
  onClose,
  onChanged,
}) {
  const { data, loading, refetch } = useApi(
    () => endpoints.suggestion(ideaId),
    [ideaId]
  );
  useRealtime("suggestions.changed", () => refetch());

  const [transitionNote, setTransitionNote] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentAnon, setCommentAnon] = useState(false);
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

  const i = data;
  const CatIcon = CATEGORY_ICONS[i.category] || Lightbulb;
  const StatusIcon = STATUS_ICONS[i.status] || Send;
  const nextOptions = statusFlow[i.status] || [];

  async function vote() {
    setBusy(true);
    try {
      if (i.upvotedByMe) await endpoints.suggestionUnvote(i.id);
      else await endpoints.suggestionUpvote(i.id);
      refetch();
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  async function transition(nextStatus) {
    setBusy(true);
    try {
      await endpoints.suggestionTransition(i.id, {
        status: nextStatus,
        note: transitionNote || null,
      });
      setTransitionNote("");
      refetch();
      onChanged?.();
    } catch (e) {
      alert(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  }

  async function postComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setBusy(true);
    try {
      await endpoints.suggestionComment(i.id, {
        text: commentText,
        anonymous: commentAnon,
      });
      setCommentText("");
      setCommentAnon(false);
      refetch();
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  async function delIdea() {
    if (!confirm("Delete this idea permanently?")) return;
    setBusy(true);
    try {
      await endpoints.suggestionDelete(i.id);
      onChanged?.();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function delComment(cid) {
    if (!confirm("Delete this comment?")) return;
    setBusy(true);
    try {
      await endpoints.suggestionCommentDelete(i.id, cid);
      refetch();
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
        className="flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-[#0a0a1f] p-6 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ring-1 ${
                  CATEGORY_TONES[i.category]
                }`}
              >
                <CatIcon size={10} />
                {i.category}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ring-1 ${
                  STATUS_TONES[i.status]
                }`}
              >
                <StatusIcon size={10} />
                {i.status}
              </span>
              {i.anonymous && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-white/5 px-1.5 py-0.5 text-[10px] text-white/55 ring-1 ring-white/15">
                  <EyeOff size={9} /> Anonymous
                </span>
              )}
              <span className="text-[10px] font-mono text-white/45">
                {i.id}
              </span>
            </div>
            <div className="mt-2 font-display text-xl font-semibold">
              {i.title}
            </div>
            <div className="mt-1 text-[11px] text-white/55">
              by {i.anonymous ? "Anonymous" : i.submittedBy || "—"} ·{" "}
              {formatDate(i.createdAt)}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/55 hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="card whitespace-pre-wrap text-sm leading-relaxed text-white/85">
          {i.body}
        </div>

        {/* Vote bar */}
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={vote}
            disabled={busy}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 ring-1 transition-all disabled:opacity-50 ${
              i.upvotedByMe
                ? "bg-amber-500/20 text-amber-200 ring-amber-400/40"
                : "bg-white/5 text-white/65 ring-white/10 hover:bg-amber-500/15 hover:text-amber-200 hover:ring-amber-400/30"
            }`}
          >
            <ArrowBigUp
              size={18}
              fill={i.upvotedByMe ? "currentColor" : "none"}
            />
            <span className="font-display text-base font-bold">{i.upvotes}</span>
            <span className="text-xs">
              {i.upvotedByMe ? "you've upvoted" : "Upvote"}
            </span>
          </button>
          <div className="text-xs text-white/55">
            <MessageCircle size={11} className="-mt-0.5 inline" />{" "}
            {i.commentCount} comments
          </div>
        </div>

        {/* Admin: status transitions */}
        {canDecide && nextOptions.length > 0 && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-2 text-[10px] uppercase tracking-wider text-white/55">
              Move status forward
            </div>
            <input
              value={transitionNote}
              onChange={(e) => setTransitionNote(e.target.value)}
              placeholder="Optional note (visible in history)"
              className="mb-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs outline-none focus:border-brand-400/60 focus:bg-white/10"
            />
            <div className="flex flex-wrap gap-1.5">
              {nextOptions.map((next) => {
                const NextI = STATUS_ICONS[next] || Send;
                return (
                  <button
                    key={next}
                    disabled={busy}
                    onClick={() => transition(next)}
                    className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs ring-1 transition-colors disabled:opacity-50 ${STATUS_TONES[next]} hover:brightness-110`}
                  >
                    <NextI size={11} />
                    {next}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* History timeline */}
        {(i.history || []).length > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-[10px] uppercase tracking-wider text-white/55">
              Status history
            </div>
            <div className="space-y-1.5">
              {i.history.map((h, idx) => {
                const HI = STATUS_ICONS[h.status] || Send;
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-2 text-[11px]"
                  >
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-md ring-1 ${
                        STATUS_TONES[h.status]
                      }`}
                    >
                      <HI size={10} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{h.status}</span>
                        <span className="text-white/45">
                          {formatDate(h.at)} · by {h.by}
                        </span>
                      </div>
                      {h.note && (
                        <div className="mt-0.5 italic text-white/65">
                          "{h.note}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Comments thread */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wider text-white/55">
              Comments ({i.commentCount})
            </div>
          </div>
          {(i.comments || []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-white/45">
              No comments yet. Start the conversation.
            </div>
          ) : (
            <div className="space-y-2">
              {i.comments.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="font-semibold">
                        {c.anonymous ? "Anonymous" : c.by || "—"}
                      </span>
                      {c.anonymous && (
                        <EyeOff size={9} className="text-white/45" />
                      )}
                      <span className="text-white/45">·</span>
                      <span className="text-white/45">
                        {formatRelative(c.createdAt)}
                      </span>
                    </div>
                    {canDecide && (
                      <button
                        onClick={() => delComment(c.id)}
                        className="rounded p-1 text-white/40 hover:bg-rose-500/15 hover:text-rose-200"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                  <div className="mt-1 text-white/85">{c.text}</div>
                </div>
              ))}
            </div>
          )}

          {/* New comment form */}
          <form onSubmit={postComment} className="mt-3 space-y-2">
            <textarea
              rows={2}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              maxLength={500}
              placeholder="Add to the conversation…"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs outline-none focus:border-brand-400/60 focus:bg-white/10"
            />
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setCommentAnon((v) => !v)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] ring-1 ${
                  commentAnon
                    ? "bg-accent-violet/20 text-purple-200 ring-accent-violet/30"
                    : "bg-white/5 text-white/55 ring-white/10"
                }`}
              >
                <EyeOff size={9} />
                {commentAnon ? "Anonymous" : "Show my name"}
              </button>
              <button
                type="submit"
                disabled={busy || !commentText.trim()}
                className="btn-primary px-3 py-1.5 text-xs disabled:opacity-50"
              >
                <Send size={11} /> Post
              </button>
            </div>
          </form>
        </div>

        {/* Admin: delete idea */}
        {canDelete && (
          <div className="mt-6 border-t border-white/10 pt-4">
            <button
              onClick={delIdea}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 hover:bg-rose-500/20 disabled:opacity-50"
            >
              <Trash2 size={12} /> Delete idea
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ---------- New idea modal ----------

function NewIdeaModal({ categories, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    body: "",
    category: categories[0] || "Other",
    anonymous: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setErr("Title and body are both required");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      await endpoints.suggestionAdd(form);
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
            Post a new idea
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
              Title (max 140 chars)
            </div>
            <input
              autoFocus
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value.slice(0, 140))}
              className={input}
              placeholder="One-line summary of your idea"
            />
            <div className="mt-0.5 text-right text-[9px] text-white/45">
              {form.title.length}/140
            </div>
          </label>

          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Details (max 2000 chars)
            </div>
            <textarea
              required
              rows={5}
              value={form.body}
              onChange={(e) => set("body", e.target.value.slice(0, 2000))}
              className={`${input} resize-y`}
              placeholder="Describe the idea. Why does it matter? Who benefits? What would it take?"
            />
            <div className="mt-0.5 text-right text-[9px] text-white/45">
              {form.body.length}/2000
            </div>
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
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Visibility
              </div>
              <button
                type="button"
                onClick={() => set("anonymous", !form.anonymous)}
                className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs ring-1 ${
                  form.anonymous
                    ? "bg-accent-violet/20 text-purple-200 ring-accent-violet/30"
                    : "bg-white/5 text-white/65 ring-white/10"
                }`}
              >
                <EyeOff size={12} />
                {form.anonymous ? "Post anonymously" : "Post with my name"}
              </button>
            </div>
          </div>
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
            {submitting ? "Posting…" : "Post idea"}
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
