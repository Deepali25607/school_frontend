import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Vote,
  BarChart3,
  ListChecks,
  Radio,
  Star,
  MessageSquare,
  TrendingUp,
  ClipboardList,
  Ban,
  PlayCircle,
  StopCircle,
  EyeOff,
  Plus,
  Search,
  Filter,
  X,
  Check,
  Trash2,
  Users2,
  Clock,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const STATUS_TONES = {
  active: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  draft: "bg-white/5 text-white/55 ring-white/15",
  closed: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

const TYPE_ICONS = {
  single: Radio,
  multi: ListChecks,
  rating: Star,
  text: MessageSquare,
};

const AUDIENCE_LABELS = {
  all: "Everyone",
  students: "Students",
  parents: "Parents",
  teachers: "Teachers",
  staff: "Staff",
};

export default function Polls() {
  const { user } = useAuth();
  const canCreate = ["admin", "principal", "teacher", "hr"].includes(user?.role);
  const canDelete = ["admin", "principal"].includes(user?.role);

  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("all");
  const [audience, setAudience] = useState("all");
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
      status,
      audience,
      mine: mineOnly ? "true" : undefined,
    }),
    [debounced, status, audience, mineOnly]
  );

  const { data, loading, error, refetch } = useApi(
    () => endpoints.polls(params),
    [params]
  );

  useRealtime("polls.changed", () => refetch());

  const items = data?.items || [];
  const summary = data?.summary;
  const audiences = data?.audiences || [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Voice"
        title="Polls & Surveys"
        subtitle={
          summary
            ? `${summary.active} active · ${summary.totalResponses} total responses · ${summary.needMyResponse} waiting on you`
            : "Loading…"
        }
      />

      {error && <ErrorState error={error} onRetry={refetch} />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          icon={Vote}
          label="Active"
          value={summary ? summary.active : "—"}
          tint="from-emerald-500/30"
          accent="text-emerald-300"
        />
        <StatTile
          icon={StopCircle}
          label="Closed"
          value={summary ? summary.closed : "—"}
          tint="from-rose-500/30"
          accent="text-rose-300"
        />
        <StatTile
          icon={TrendingUp}
          label="Total responses"
          value={summary ? summary.totalResponses : "—"}
          tint="from-brand-500/30"
        />
        <StatTile
          icon={ClipboardList}
          label="Waiting on you"
          value={summary ? summary.needMyResponse : "—"}
          tint="from-accent-pink/30"
          accent="text-pink-300"
          pulse={(summary?.needMyResponse || 0) > 0}
        />
      </div>

      {/* Filters */}
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={14} className="text-white/55" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search polls…"
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
            <option value="all">Any status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
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
          <Toggle on={mineOnly} onClick={() => setMineOnly((v) => !v)} icon={Users2}>
            For me
          </Toggle>
          {canCreate && (
            <button
              onClick={() => setCreating(true)}
              className="btn-primary px-3 py-2 text-sm"
            >
              <Plus size={14} /> New poll
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center text-white/55">
          <Vote className="mx-auto mb-2 text-white/30" size={20} />
          No polls match the current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {items.map((p, i) => (
            <PollCard key={p.id} poll={p} idx={i} onOpen={() => setOpened(p)} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {creating && (
          <NewPollModal
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
          <PollDetail
            pollId={opened.id}
            canManage={canCreate}
            canDelete={canDelete}
            onClose={() => setOpened(null)}
            onChanged={() => refetch()}
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

function PollCard({ poll, idx, onOpen }) {
  const p = poll;
  const typeBreakdown = useMemo(() => {
    const t = { single: 0, multi: 0, rating: 0, text: 0 };
    for (const q of p.questions || []) t[q.type]++;
    return t;
  }, [p.questions]);

  return (
    <motion.button
      onClick={onOpen}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.2) }}
      className={`card group relative overflow-hidden text-left transition-all hover:-translate-y-0.5 hover:border-brand-500/30 hover:shadow-glow ${
        p.status === "closed" ? "opacity-80" : ""
      }`}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-brand-500/15 to-accent-violet/10 blur-3xl" />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ring-1 ${
              STATUS_TONES[p.status]
            }`}
          >
            {p.status === "active" ? (
              <PlayCircle size={9} />
            ) : p.status === "closed" ? (
              <StopCircle size={9} />
            ) : (
              <Ban size={9} />
            )}
            {p.status}
          </span>
          {p.anonymous && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-violet/15 px-2 py-0.5 text-[10px] text-purple-200 ring-1 ring-accent-violet/30">
              <EyeOff size={9} /> Anonymous
            </span>
          )}
          {p.respondedByMe && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-200 ring-1 ring-emerald-400/30">
              <Check size={9} /> Responded
            </span>
          )}
        </div>
        <div className="mt-2 line-clamp-2 font-display text-base font-semibold">
          {p.title}
        </div>
        {p.description && (
          <div className="mt-1 line-clamp-2 text-xs text-white/55">
            {p.description}
          </div>
        )}

        <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-white/65">
          <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2">
            <div className="text-[9px] uppercase tracking-wider text-white/45">
              Questions
            </div>
            <div className="mt-0.5 font-display text-base font-bold">
              {p.questionCount}
            </div>
          </div>
          <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2">
            <div className="text-[9px] uppercase tracking-wider text-white/45">
              Responses
            </div>
            <div className="mt-0.5 font-display text-base font-bold">
              {p.totalResponses}
            </div>
          </div>
          <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2">
            <div className="text-[9px] uppercase tracking-wider text-white/45">
              {p.status === "closed" ? "Closed" : "Days left"}
            </div>
            <div className="mt-0.5 font-display text-base font-bold">
              {p.status === "closed"
                ? "—"
                : p.daysLeft == null
                ? "∞"
                : p.daysLeft <= 0
                ? "ends today"
                : `${p.daysLeft}d`}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[10px] text-white/55">
          <div className="flex items-center gap-2">
            <Users2 size={11} /> {AUDIENCE_LABELS[p.audience] || p.audience}
            <span>·</span>
            <span>by {p.createdBy}</span>
          </div>
          <div className="flex items-center gap-1">
            {Object.entries(typeBreakdown)
              .filter(([, n]) => n > 0)
              .map(([t, n]) => {
                const Icon = TYPE_ICONS[t];
                return (
                  <span
                    key={t}
                    className="inline-flex items-center gap-0.5 rounded bg-white/5 px-1 py-0.5"
                  >
                    <Icon size={9} />
                    {n}
                  </span>
                );
              })}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// ---------- Detail panel ----------

function PollDetail({ pollId, canManage, canDelete, onClose, onChanged }) {
  const [tab, setTab] = useState("respond"); // respond | results
  const { data: poll, refetch } = useApi(() => endpoints.poll(pollId), [pollId]);
  useRealtime("polls.changed", () => refetch());

  useEffect(() => {
    if (poll?.respondedByMe || poll?.status !== "active") setTab("results");
    else setTab("respond");
  }, [poll?.id]);

  if (!poll) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <Skeleton className="h-96 w-full max-w-xl" />
      </motion.div>
    );
  }

  const isActive = poll.status === "active";

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
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ring-1 ${
                  STATUS_TONES[poll.status]
                }`}
              >
                {poll.status}
              </span>
              {poll.anonymous && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-violet/15 px-2 py-0.5 text-[10px] text-purple-200 ring-1 ring-accent-violet/30">
                  <EyeOff size={9} /> Anonymous
                </span>
              )}
              <span className="text-[11px] text-white/45">{poll.id}</span>
            </div>
            <div className="mt-2 font-display text-xl font-semibold">
              {poll.title}
            </div>
            {poll.description && (
              <div className="mt-1 text-xs text-white/65">
                {poll.description}
              </div>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/55">
              <span className="inline-flex items-center gap-1">
                <Users2 size={11} /> {AUDIENCE_LABELS[poll.audience]}
              </span>
              <span>·</span>
              <span>by {poll.createdBy}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Clock size={11} /> {poll.totalResponses} responses
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/55 hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-3 flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
          <TabBtn
            active={tab === "respond"}
            onClick={() => setTab("respond")}
            disabled={!isActive}
            icon={Vote}
          >
            {poll.respondedByMe ? "Your response" : "Respond"}
          </TabBtn>
          <TabBtn
            active={tab === "results"}
            onClick={() => setTab("results")}
            icon={BarChart3}
          >
            Live results
          </TabBtn>
        </div>

        {tab === "respond" ? (
          <RespondForm
            poll={poll}
            onSubmitted={() => {
              refetch();
              onChanged?.();
              setTab("results");
            }}
          />
        ) : (
          <Results poll={poll} />
        )}

        {/* Admin actions */}
        {(canManage || canDelete) && (
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
            {canManage && poll.status === "active" && (
              <button
                onClick={async () => {
                  await endpoints.pollClose(poll.id);
                  refetch();
                  onChanged?.();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
              >
                <StopCircle size={12} /> Close poll
              </button>
            )}
            {canManage && poll.status === "closed" && (
              <button
                onClick={async () => {
                  await endpoints.pollReopen(poll.id);
                  refetch();
                  onChanged?.();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
              >
                <PlayCircle size={12} /> Reopen
              </button>
            )}
            {canDelete && (
              <button
                onClick={async () => {
                  if (!confirm("Delete this poll and all responses?")) return;
                  await endpoints.pollDelete(poll.id);
                  onChanged?.();
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 hover:bg-rose-500/20"
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

// ---------- Respond form ----------

function RespondForm({ poll, onSubmitted }) {
  const [answers, setAnswers] = useState(() => {
    if (poll.myResponse) return poll.myResponse.answers || {};
    return {};
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  function set(qId, val) {
    setAnswers((a) => ({ ...a, [qId]: val }));
  }
  function toggleMulti(qId, opt) {
    setAnswers((a) => {
      const cur = a[qId] || [];
      return {
        ...a,
        [qId]: cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt],
      };
    });
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    try {
      await endpoints.pollRespond(poll.id, answers);
      onSubmitted();
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function withdraw() {
    if (!confirm("Withdraw your response?")) return;
    setSubmitting(true);
    try {
      await endpoints.pollWithdraw(poll.id);
      onSubmitted();
    } finally {
      setSubmitting(false);
    }
  }

  const input =
    "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10";

  if (poll.status !== "active") {
    return (
      <div className="card text-sm text-white/55">
        This poll is no longer accepting responses.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {poll.questions.map((q, i) => (
        <div
          key={q.id}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
        >
          <div className="mb-2 flex items-center gap-2">
            <span className="font-display text-xs font-semibold text-white/65">
              Q{i + 1}
            </span>
            <span className="text-sm font-medium">{q.text}</span>
            {q.required && (
              <span className="text-[10px] font-bold text-rose-300">*</span>
            )}
          </div>

          {q.type === "single" && (
            <div className="space-y-1.5">
              {q.options.map((opt) => {
                const on = answers[q.id] === opt;
                return (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => set(q.id, opt)}
                    className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                      on
                        ? "border-brand-400/50 bg-brand-500/15 text-brand-100"
                        : "border-white/10 bg-white/[0.03] text-white/75 hover:border-white/20 hover:bg-white/[0.06]"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full ring-2 ${
                        on ? "bg-brand-500 ring-brand-400" : "ring-white/20"
                      }`}
                    >
                      {on && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {q.type === "multi" && (
            <div className="space-y-1.5">
              {q.options.map((opt) => {
                const on = (answers[q.id] || []).includes(opt);
                return (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => toggleMulti(q.id, opt)}
                    className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                      on
                        ? "border-brand-400/50 bg-brand-500/15 text-brand-100"
                        : "border-white/10 bg-white/[0.03] text-white/75 hover:border-white/20 hover:bg-white/[0.06]"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded ring-2 ${
                        on ? "bg-brand-500 ring-brand-400" : "ring-white/20"
                      }`}
                    >
                      {on && <Check size={10} />}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {q.type === "rating" && (
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => {
                const on = Number(answers[q.id]) >= n;
                return (
                  <button
                    type="button"
                    key={n}
                    onClick={() => set(q.id, n)}
                    className={`group rounded-lg p-1 transition-colors ${
                      on
                        ? "text-amber-300"
                        : "text-white/30 hover:text-amber-200"
                    }`}
                  >
                    <Star
                      size={22}
                      fill={on ? "currentColor" : "none"}
                      strokeWidth={1.5}
                    />
                  </button>
                );
              })}
              {answers[q.id] && (
                <span className="ml-2 text-xs text-white/65">
                  {answers[q.id]}/5
                </span>
              )}
            </div>
          )}

          {q.type === "text" && (
            <textarea
              rows={3}
              value={answers[q.id] || ""}
              onChange={(e) => set(q.id, e.target.value)}
              maxLength={500}
              placeholder="Type your answer (max 500 chars)…"
              className={`${input} resize-y`}
            />
          )}
        </div>
      ))}

      {err && (
        <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {err}
        </div>
      )}

      <div className="flex items-center justify-between">
        {poll.respondedByMe && !poll.anonymous ? (
          <button
            type="button"
            onClick={withdraw}
            disabled={submitting}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/65 hover:bg-white/10 disabled:opacity-50"
          >
            Withdraw response
          </button>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
        >
          {submitting
            ? "Submitting…"
            : poll.respondedByMe
            ? "Update response"
            : "Submit response"}
        </button>
      </div>
    </form>
  );
}

// ---------- Results visualization ----------

function Results({ poll }) {
  const results = poll.results;
  if (!results || results.total === 0) {
    return (
      <div className="card text-center text-sm text-white/55">
        <BarChart3 className="mx-auto mb-2 text-white/30" size={20} />
        No responses yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-3 text-xs">
        <span className="text-emerald-200">
          <TrendingUp size={11} className="mr-1 inline" />
          {results.total} response{results.total === 1 ? "" : "s"}
        </span>
        <span className="ml-2 text-white/55">
          {poll.anonymous
            ? "All responses anonymous"
            : "Identified responses (admins only)"}
        </span>
      </div>

      {poll.questions.map((q, i) => (
        <QuestionResult
          key={q.id}
          q={q}
          idx={i}
          agg={results.byQuestion[q.id]}
        />
      ))}
    </div>
  );
}

function QuestionResult({ q, idx, agg }) {
  if (!agg) return null;
  const Icon = TYPE_ICONS[q.type];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display text-xs font-semibold text-white/65">
              Q{idx + 1}
            </span>
            <Icon size={12} className="text-white/45" />
            <span className="text-[10px] uppercase tracking-wider text-white/45">
              {q.type}
            </span>
          </div>
          <div className="mt-1 text-sm font-medium">{q.text}</div>
        </div>
        <div className="text-[11px] text-white/55">{agg.total} answered</div>
      </div>

      {q.type === "single" && (
        <div className="space-y-2">
          {Object.entries(agg.counts)
            .sort((a, b) => b[1] - a[1])
            .map(([opt, count]) => {
              const pct = agg.total > 0 ? (count / agg.total) * 100 : 0;
              return <Bar key={opt} label={opt} count={count} pct={pct} />;
            })}
        </div>
      )}

      {q.type === "multi" && (
        <div className="space-y-2">
          {agg.sorted.map(({ option, count }) => {
            const pct = agg.total > 0 ? (count / agg.total) * 100 : 0;
            return (
              <Bar key={option} label={option} count={count} pct={pct} />
            );
          })}
        </div>
      )}

      {q.type === "rating" && (
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="font-display text-3xl font-bold text-amber-300">
              {agg.average ?? "—"}
            </div>
            <div className="mt-1 flex items-center justify-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={12}
                  className={
                    n <= Math.round(agg.average || 0)
                      ? "text-amber-300"
                      : "text-white/15"
                  }
                  fill={
                    n <= Math.round(agg.average || 0)
                      ? "currentColor"
                      : "none"
                  }
                />
              ))}
            </div>
            <div className="mt-1 text-[10px] text-white/55">average</div>
          </div>
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((n) => {
              const count = agg.buckets[n] || 0;
              const pct = agg.total > 0 ? (count / agg.total) * 100 : 0;
              return (
                <div
                  key={n}
                  className="flex items-center gap-2 text-[10px]"
                >
                  <span className="flex w-10 items-center gap-0.5 text-white/55">
                    {n}
                    <Star size={9} className="text-amber-300" fill="currentColor" />
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-white/55">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {q.type === "text" && (
        <div className="space-y-1.5">
          {agg.samples.length === 0 ? (
            <div className="text-xs text-white/45">No text answers yet.</div>
          ) : (
            agg.samples.map((s, j) => (
              <div
                key={j}
                className="rounded-lg border border-white/5 bg-white/[0.02] p-2 text-xs text-white/75"
              >
                <span className="text-white/30">"</span>
                {s}
                <span className="text-white/30">"</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Bar({ label, count, pct }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="truncate text-white/75">{label}</span>
        <span className="text-white/55">
          {count} · {pct.toFixed(0)}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(2, pct)}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-brand-500 to-accent-violet"
        />
      </div>
    </div>
  );
}

// ---------- New poll modal ----------

function NewPollModal({ audiences, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    audience: "all",
    anonymous: false,
    durationDays: 14,
    questions: [
      { id: "Q1", type: "single", text: "", options: ["", ""], required: true },
    ],
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function setQ(i, patch) {
    setForm((f) => {
      const next = f.questions.slice();
      next[i] = { ...next[i], ...patch };
      return { ...f, questions: next };
    });
  }
  function setOpt(i, optIdx, val) {
    setForm((f) => {
      const next = f.questions.slice();
      const opts = (next[i].options || []).slice();
      opts[optIdx] = val;
      next[i] = { ...next[i], options: opts };
      return { ...f, questions: next };
    });
  }
  function addOpt(i) {
    setForm((f) => {
      const next = f.questions.slice();
      next[i] = { ...next[i], options: [...(next[i].options || []), ""] };
      return { ...f, questions: next };
    });
  }
  function removeOpt(i, optIdx) {
    setForm((f) => {
      const next = f.questions.slice();
      next[i] = {
        ...next[i],
        options: (next[i].options || []).filter((_, k) => k !== optIdx),
      };
      return { ...f, questions: next };
    });
  }
  function addQuestion() {
    setForm((f) => ({
      ...f,
      questions: [
        ...f.questions,
        {
          id: `Q${f.questions.length + 1}`,
          type: "single",
          text: "",
          options: ["", ""],
          required: true,
        },
      ],
    }));
  }
  function removeQuestion(i) {
    setForm((f) => ({
      ...f,
      questions: f.questions.filter((_, k) => k !== i),
    }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setErr("Title required");
      return;
    }
    // Strip empty options
    const cleaned = form.questions.map((q) => {
      if (q.type === "single" || q.type === "multi") {
        return { ...q, options: (q.options || []).map((o) => o.trim()).filter(Boolean) };
      }
      return q;
    });
    setSubmitting(true);
    setErr(null);
    try {
      await endpoints.pollAdd({
        ...form,
        questions: cleaned,
        durationDays: Number(form.durationDays),
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
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0a0a1f] p-5 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="font-display text-base font-semibold">
            New poll / survey
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
              placeholder="e.g. Cafeteria menu feedback"
            />
          </label>

          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Description (optional)
            </div>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={`${input} resize-y`}
            />
          </label>

          <div className="grid grid-cols-3 gap-3">
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
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Duration (days)
              </div>
              <input
                type="number"
                min="1"
                max="180"
                value={form.durationDays}
                onChange={(e) => set("durationDays", e.target.value)}
                className={input}
              />
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
                {form.anonymous ? "Anonymous" : "Identified"}
              </button>
            </div>
          </div>

          {/* Questions */}
          <div className="mt-2">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-wider text-white/55">
                Questions ({form.questions.length})
              </div>
              <button
                type="button"
                onClick={addQuestion}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] hover:bg-white/10"
              >
                <Plus size={10} /> Add question
              </button>
            </div>

            <div className="space-y-3">
              {form.questions.map((q, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-display text-[10px] font-bold text-white/65">
                      Q{i + 1}
                    </span>
                    <select
                      value={q.type}
                      onChange={(e) =>
                        setQ(i, {
                          type: e.target.value,
                          options:
                            e.target.value === "single" ||
                            e.target.value === "multi"
                              ? q.options || ["", ""]
                              : undefined,
                        })
                      }
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs outline-none"
                    >
                      <option value="single">Single choice</option>
                      <option value="multi">Multi choice</option>
                      <option value="rating">Rating (1-5)</option>
                      <option value="text">Free text</option>
                    </select>
                    <label className="ml-2 inline-flex items-center gap-1 text-[10px] text-white/55">
                      <input
                        type="checkbox"
                        checked={q.required !== false}
                        onChange={(e) => setQ(i, { required: e.target.checked })}
                        className="rounded"
                      />
                      Required
                    </label>
                    <span className="ml-auto">
                      {form.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(i)}
                          className="rounded p-1 text-white/55 hover:bg-rose-500/15 hover:text-rose-200"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </span>
                  </div>

                  <input
                    value={q.text}
                    onChange={(e) => setQ(i, { text: e.target.value })}
                    placeholder="Question text"
                    className={`${input} mb-2`}
                  />

                  {(q.type === "single" || q.type === "multi") && (
                    <div className="space-y-1">
                      {(q.options || []).map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-1">
                          <input
                            value={opt}
                            onChange={(e) =>
                              setOpt(i, optIdx, e.target.value)
                            }
                            placeholder={`Option ${optIdx + 1}`}
                            className={input}
                          />
                          {(q.options || []).length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOpt(i, optIdx)}
                              className="rounded p-1 text-white/55 hover:bg-rose-500/15 hover:text-rose-200"
                            >
                              <X size={11} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOpt(i)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] hover:bg-white/10"
                      >
                        <Plus size={10} /> Option
                      </button>
                    </div>
                  )}
                </div>
              ))}
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
            {submitting ? "Publishing…" : "Publish poll"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
