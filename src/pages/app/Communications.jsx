import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Mail,
  Bell,
  Send,
  Users,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Sparkles as SparklesIcon,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const CHANNEL_META = {
  SMS: { icon: MessageSquare, tone: "from-brand-500 to-accent-cyan", chip: "bg-brand-500/15 text-brand-300 ring-brand-400/30" },
  Email: { icon: Mail, tone: "from-accent-violet to-accent-pink", chip: "bg-accent-violet/15 text-purple-200 ring-accent-violet/30" },
  Push: { icon: Bell, tone: "from-accent-gold to-accent-pink", chip: "bg-accent-gold/15 text-amber-200 ring-accent-gold/30" },
};

export default function Communications() {
  const audiences = useApi(endpoints.commsAudiences, []);
  const broadcasts = useApi(endpoints.commsBroadcasts, []);
  useRealtime("broadcasts.changed", () => broadcasts.refetch());
  const [draft, setDraft] = useState({
    subject: "",
    body: "",
    channels: ["Email", "Push"],
    audience: "parents",
  });
  const [sending, setSending] = useState(false);
  const [sentToast, setSentToast] = useState(null);
  const [err, setErr] = useState(null);

  const audienceList = audiences.data?.audiences || [];
  const channelList = audiences.data?.channels || ["SMS", "Email", "Push"];
  const selectedAudience = audienceList.find((a) => a.key === draft.audience);

  const toggleChannel = (c) => {
    setDraft((p) => ({
      ...p,
      channels: p.channels.includes(c)
        ? p.channels.filter((x) => x !== c)
        : [...p.channels, c],
    }));
  };

  const send = async (e) => {
    e?.preventDefault?.();
    setSending(true);
    setErr(null);
    try {
      const rec = await endpoints.commsSend(draft);
      setSentToast(rec);
      setTimeout(() => setSentToast(null), 3000);
      setDraft({ subject: "", body: "", channels: ["Email", "Push"], audience: "parents" });
      broadcasts.refetch();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setSending(false);
    }
  };

  const items = broadcasts.data?.items || [];
  const stats = items.reduce(
    (acc, b) => ({
      sent: acc.sent + b.recipients,
      delivered: acc.delivered + b.delivered,
      opened: acc.opened + b.opened,
    }),
    { sent: 0, delivered: 0, opened: 0 }
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Engagement"
        title="Communications"
        subtitle="Broadcast announcements over SMS, Email and Push"
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile icon={Send} label="Broadcasts" value={broadcasts.loading ? "—" : items.length} tint="from-brand-500/30" />
        <StatTile icon={Users} label="Recipients" value={broadcasts.loading ? "—" : stats.sent.toLocaleString()} tint="from-accent-violet/30" />
        <StatTile icon={CheckCircle2} label="Delivered" value={broadcasts.loading ? "—" : stats.delivered.toLocaleString()} tint="from-emerald-500/30" />
        <StatTile icon={Eye} label="Opened" value={broadcasts.loading ? "—" : stats.opened.toLocaleString()} tint="from-accent-gold/30" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
        {/* Composer */}
        <motion.form
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={send}
          className="card relative overflow-hidden"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-brand-500/30 to-accent-pink/30 blur-3xl" />
          <div className="relative">
            <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-white/55">
              New broadcast
            </div>
            <div className="font-display text-xl font-bold">Compose</div>

            <div className="mt-4 space-y-3">
              <Field label="Subject">
                <input
                  value={draft.subject}
                  onChange={(e) => setDraft((p) => ({ ...p, subject: e.target.value }))}
                  placeholder="e.g. Parent-Teacher meeting reminder"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
                  required
                />
              </Field>

              <Field label="Message">
                <textarea
                  value={draft.body}
                  onChange={(e) => setDraft((p) => ({ ...p, body: e.target.value }))}
                  rows={4}
                  placeholder="Write your announcement…"
                  className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
                  required
                />
              </Field>

              <Field label="Channels">
                <div className="flex flex-wrap gap-2">
                  {channelList.map((c) => {
                    const active = draft.channels.includes(c);
                    const meta = CHANNEL_META[c];
                    const Icon = meta?.icon || Bell;
                    return (
                      <button
                        type="button"
                        key={c}
                        onClick={() => toggleChannel(c)}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium transition-all ${
                          active
                            ? `border-white/20 bg-gradient-to-br ${meta?.tone} text-white shadow-glow`
                            : "border-white/10 bg-white/5 text-white/65 hover:bg-white/10"
                        }`}
                      >
                        <Icon size={14} />
                        {c}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Audience">
                {audiences.loading ? (
                  <Skeleton className="h-10" />
                ) : (
                  <select
                    value={draft.audience}
                    onChange={(e) => setDraft((p) => ({ ...p, audience: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                  >
                    {audienceList.map((a) => (
                      <option key={a.key} value={a.key}>
                        {a.label} ({a.count.toLocaleString()})
                      </option>
                    ))}
                  </select>
                )}
              </Field>

              {selectedAudience && (
                <div className="rounded-xl border border-white/10 bg-gradient-to-br from-brand-700/20 via-accent-violet/15 to-accent-pink/15 p-3 text-sm">
                  <div className="flex items-center gap-2 text-white/80">
                    <Users size={14} className="text-accent-pink" />
                    Reaching{" "}
                    <span className="font-display font-bold text-white">
                      {selectedAudience.count.toLocaleString()}
                    </span>{" "}
                    recipients via{" "}
                    <span className="font-semibold">
                      {draft.channels.join(" + ") || "no channels"}
                    </span>
                  </div>
                </div>
              )}

              {err && (
                <div className="flex items-start gap-2 rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-400/30">
                  <AlertTriangle size={14} className="mt-0.5" />
                  <span>{err}</span>
                </div>
              )}

              <button
                disabled={sending || draft.channels.length === 0}
                className="btn-primary w-full disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send broadcast"}
                {!sending && <Send size={16} />}
              </button>
            </div>
          </div>
        </motion.form>

        {/* Preview */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/55">
            Live preview
          </div>
          <PreviewPhone draft={draft} />
        </motion.div>
      </div>

      {/* History */}
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-display text-lg font-semibold">
            Broadcast history
          </div>
          <div className="text-xs text-white/55">
            {items.length} total
          </div>
        </div>
        {broadcasts.loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : broadcasts.error ? (
          <ErrorState error={broadcasts.error} onRetry={broadcasts.refetch} />
        ) : (
          <div className="space-y-3">
            {items.map((b, i) => (
              <BroadcastRow key={b.id} b={b} idx={i} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {sentToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, x: 30 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm shadow-glow backdrop-blur"
          >
            <CheckCircle2 size={18} className="text-emerald-300" />
            <div>
              <div className="font-display font-semibold text-emerald-200">
                Broadcast sent
              </div>
              <div className="text-[11px] text-emerald-200/70">
                {sentToast.recipients.toLocaleString()} recipients · {sentToast.channels.join(" + ")}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tint }) {
  return (
    <div className="card relative overflow-hidden">
      <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${tint} to-transparent blur-2xl`} />
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

function PreviewPhone({ draft }) {
  const subject = draft.subject || "Subject preview";
  const body = draft.body || "Your message will appear here…";
  return (
    <div className="mx-auto w-full max-w-xs">
      <div className="relative overflow-hidden rounded-[36px] border border-white/15 bg-gradient-to-b from-[#0d0d2a] to-[#06061a] p-3 shadow-glow">
        <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-white/20" />
        <div className="space-y-2">
          {draft.channels.includes("Push") && (
            <NotifCard
              channel="Push"
              app="Lumina"
              subject={subject}
              body={body}
            />
          )}
          {draft.channels.includes("SMS") && (
            <NotifCard
              channel="SMS"
              app="+91 90909 09090"
              subject={null}
              body={`${subject} — ${body}`}
            />
          )}
          {draft.channels.includes("Email") && (
            <NotifCard
              channel="Email"
              app="Lumina School"
              subject={subject}
              body={body}
            />
          )}
          {draft.channels.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-[11px] text-white/40">
              Pick a channel to preview
            </div>
          )}
        </div>
        <div className="mt-4 h-1 w-24 mx-auto rounded-full bg-white/10" />
      </div>
    </div>
  );
}

function NotifCard({ channel, app, subject, body }) {
  const meta = CHANNEL_META[channel];
  const Icon = meta?.icon || Bell;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 backdrop-blur"
    >
      <div className="flex items-center justify-between text-[10px] text-white/55">
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br ${meta?.tone}`}>
            <Icon size={10} className="text-white" />
          </span>
          <span className="uppercase tracking-wider">{channel}</span>
        </div>
        <span>now</span>
      </div>
      <div className="mt-1 text-xs font-semibold text-white">{app}</div>
      {subject && (
        <div className="mt-0.5 truncate text-[12px] font-semibold text-white/95">
          {subject}
        </div>
      )}
      <div className="mt-0.5 line-clamp-2 text-[11px] text-white/65">{body}</div>
    </motion.div>
  );
}

function BroadcastRow({ b, idx }) {
  const ago = relTime(b.sentAt);
  const deliveryPct = Math.round((b.delivered / b.recipients) * 100);
  const openPct = Math.round((b.opened / b.recipients) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.03 }}
      className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {b.channels.map((c) => {
              const meta = CHANNEL_META[c];
              const Icon = meta?.icon;
              return (
                <span
                  key={c}
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ${meta?.chip}`}
                >
                  {Icon && <Icon size={10} />}
                  {c}
                </span>
              );
            })}
            <span className="text-[10px] text-white/45">· {b.audienceLabel}</span>
            <span className="text-[10px] text-white/45">· by {b.sentBy}</span>
          </div>
          <div className="mt-1 truncate font-display font-semibold leading-snug">
            {b.subject}
          </div>
          <div className="mt-0.5 line-clamp-1 text-xs text-white/55">{b.body}</div>
        </div>
        <div className="flex-shrink-0 text-right text-[11px] text-white/55">
          {ago}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
        <Metric label="Recipients" value={b.recipients.toLocaleString()} />
        <Metric label="Delivered" value={`${deliveryPct}%`} bar={deliveryPct} tone="from-emerald-400 to-emerald-500" />
        <Metric label="Opened" value={`${openPct}%`} bar={openPct} tone="from-brand-400 to-accent-violet" />
      </div>
    </motion.div>
  );
}

function Metric({ label, value, bar, tone = "from-brand-400 to-accent-violet" }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
      <div className="text-[9px] uppercase tracking-wider text-white/45">{label}</div>
      <div className="font-display font-semibold">{value}</div>
      {bar !== undefined && (
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${bar}%` }}
            transition={{ duration: 0.8 }}
            className={`h-full bg-gradient-to-r ${tone}`}
          />
        </div>
      )}
    </div>
  );
}

function relTime(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
