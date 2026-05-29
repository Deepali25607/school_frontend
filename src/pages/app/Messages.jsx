import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Search,
  Plus,
  Send,
  X,
  Loader,
  CircleAlert,
  Inbox,
  Check,
  CheckCheck,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useRealtime } from "../../lib/useRealtime.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const ROLE_TONES = {
  admin: "bg-rose-500/15 text-rose-200 ring-rose-400/30",
  principal: "bg-accent-violet/15 text-purple-200 ring-accent-violet/30",
  teacher: "bg-brand-500/15 text-brand-200 ring-brand-400/30",
  student: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30",
  parent: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
  hr: "bg-sky-500/15 text-sky-200 ring-sky-400/30",
  accountant: "bg-fuchsia-500/15 text-fuchsia-200 ring-fuchsia-400/30",
};

function fmtRelative(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function fmtTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Messages() {
  const { user } = useAuth();
  const myId = user?.id;
  const [activeId, setActiveId] = useState(null);
  const [composing, setComposing] = useState(false);
  const [q, setQ] = useState("");
  const [error, setError] = useState(null);

  const { data, loading, refetch } = useApi(() => endpoints.messages(), []);
  useRealtime(["messages.changed"], () => refetch());

  const threads = data?.threads || [];

  const filtered = useMemo(() => {
    if (!q.trim()) return threads;
    const t = q.toLowerCase();
    return threads.filter((th) => {
      const other = th.participants.find((p) => p.id !== myId);
      return (
        other?.name?.toLowerCase().includes(t) ||
        th.subject?.toLowerCase().includes(t) ||
        th.lastMessage?.body?.toLowerCase().includes(t)
      );
    });
  }, [threads, q, myId]);

  // Auto-select first thread on first load
  useEffect(() => {
    if (!activeId && threads.length > 0) setActiveId(threads[0].id);
  }, [threads, activeId]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Communication"
        title="Messages"
        subtitle={
          data?.summary
            ? `${data.summary.threads} conversation${data.summary.threads === 1 ? "" : "s"} · ${data.summary.threadsWithUnread} with new messages`
            : "Loading…"
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

      <div className="card grid h-[68vh] grid-cols-1 overflow-hidden p-0 md:grid-cols-[320px_1fr]">
        {/* ===== Thread list ===== */}
        <div className="flex flex-col border-r border-white/5">
          <div className="flex items-center gap-2 border-b border-white/5 p-3">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">
              <Search size={14} className="text-white/55" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search conversations…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
              />
            </div>
            <button
              type="button"
              onClick={() => setComposing(true)}
              className="btn-primary px-2.5 py-1.5 text-sm"
              title="New message"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center text-sm text-white/55">
                <Inbox className="mb-2 text-white/30" size={28} />
                {q ? "No conversations match." : "No messages yet — start one with the + button."}
              </div>
            ) : (
              <ul>
                {filtered.map((th) => {
                  const other = th.participants.find((p) => p.id !== myId) || th.participants[0];
                  const isActive = th.id === activeId;
                  return (
                    <li key={th.id}>
                      <button
                        type="button"
                        onClick={() => setActiveId(th.id)}
                        className={`flex w-full items-start gap-2.5 border-b border-white/5 px-3 py-3 text-left transition-colors ${
                          isActive
                            ? "bg-brand-500/10"
                            : th.unread > 0
                            ? "bg-white/[0.03] hover:bg-white/[0.05]"
                            : "hover:bg-white/[0.03]"
                        }`}
                      >
                        <Avatar name={other?.name} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <div className="truncate text-sm font-medium text-white">
                              {other?.name || "Unknown"}
                            </div>
                            <span className="shrink-0 text-[10px] text-white/45">
                              {fmtRelative(th.lastMessageAt)}
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span
                              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-wider ring-1 ${
                                ROLE_TONES[other?.role] || "bg-white/5 text-white/55 ring-white/10"
                              }`}
                            >
                              {other?.role}
                            </span>
                            {th.subject && (
                              <span className="truncate text-[11px] text-white/65">
                                {th.subject}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <div
                              className={`truncate text-xs ${
                                th.unread > 0 ? "text-white/90" : "text-white/55"
                              }`}
                            >
                              {th.lastMessage?.body || "—"}
                            </div>
                            {th.unread > 0 && (
                              <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white">
                                {th.unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ===== Active thread ===== */}
        <div className="flex min-h-0 flex-col">
          {activeId ? (
            <ThreadView
              key={activeId}
              threadId={activeId}
              myId={myId}
              onError={setError}
              onChanged={() => refetch()}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-white/45">
              Select a conversation to read it.
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {composing && (
          <ComposeModal
            onClose={() => setComposing(false)}
            onStarted={(threadId) => {
              setComposing(false);
              setActiveId(threadId);
              refetch();
            }}
            onError={setError}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============ Thread view ============

function ThreadView({ threadId, myId, onError, onChanged }) {
  const { data, loading, error, refetch } = useApi(
    () => endpoints.messageThread(threadId),
    [threadId]
  );
  useRealtime(["messages.changed"], () => refetch());
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // Mark as read whenever we view a thread or new messages arrive.
  useEffect(() => {
    if (!data?.thread) return;
    endpoints.messageMarkRead(threadId).then(() => onChanged?.()).catch(() => {});
  }, [data?.messages?.length, threadId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [data?.messages?.length]);

  const onSend = async (e) => {
    e?.preventDefault?.();
    if (sending || !draft.trim()) return;
    setSending(true);
    try {
      await endpoints.messageSend(threadId, { body: draft.trim() });
      setDraft("");
      refetch();
      onChanged?.();
    } catch (err) {
      onError(err?.response?.data?.error || err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="p-6"><Skeleton className="h-full" /></div>;
  if (error) return <div className="p-6"><ErrorState error={error} onRetry={refetch} /></div>;
  if (!data?.thread) return null;

  const other = data.thread.participants.find((p) => p.id !== myId) || data.thread.participants[0];
  const messages = data.messages || [];

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
        <Avatar name={other?.name} size={9} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">{other?.name}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-white/55">
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-wider ring-1 ${
                ROLE_TONES[other?.role] || "bg-white/5 text-white/55 ring-white/10"
              }`}
            >
              {other?.role}
            </span>
            {data.thread.subject && <span>· {data.thread.subject}</span>}
            {data.thread.studentId && <span>· about {data.thread.studentId}</span>}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-white/45">
            No messages yet — say hello.
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((m, i) => {
              const mine = m.fromUserId === myId;
              const showMeta =
                i === 0 ||
                messages[i - 1].fromUserId !== m.fromUserId ||
                new Date(m.createdAt) - new Date(messages[i - 1].createdAt) > 5 * 60 * 1000;
              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[78%] ${mine ? "items-end" : "items-start"}`}>
                    {showMeta && (
                      <div
                        className={`mb-0.5 text-[10px] text-white/45 ${
                          mine ? "text-right" : "text-left"
                        }`}
                      >
                        {fmtTime(m.createdAt)}
                      </div>
                    )}
                    <div
                      className={`whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ring-1 ${
                        mine
                          ? "bg-brand-500/20 text-white ring-brand-400/40"
                          : "bg-white/[0.04] text-white/90 ring-white/10"
                      }`}
                    >
                      {m.body}
                    </div>
                    {mine && (
                      <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-white/45">
                        {m.readBy.length > 1 ? (
                          <>
                            <CheckCheck size={10} className="text-brand-300" /> Read
                          </>
                        ) : (
                          <>
                            <Check size={10} /> Sent
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={onSend}
        className="flex items-end gap-2 border-t border-white/5 px-4 py-3"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          rows={1}
          maxLength={4000}
          placeholder="Type a message…  ⏎ to send"
          className="max-h-32 flex-1 resize-y rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="btn-primary self-stretch px-4 disabled:opacity-50"
        >
          {sending ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </form>
    </>
  );
}

// ============ Compose modal ============

function ComposeModal({ onClose, onStarted, onError }) {
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLoadingContacts(true);
    endpoints
      .messagesContacts()
      .then((r) => setContacts(r.contacts || []))
      .catch((e) => onError(e?.response?.data?.error || e.message))
      .finally(() => setLoadingContacts(false));
  }, [onError]);

  const filtered = useMemo(() => {
    if (!q.trim()) return contacts;
    const t = q.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(t) ||
        c.email.toLowerCase().includes(t) ||
        c.role.toLowerCase().includes(t)
    );
  }, [contacts, q]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy || !picked || !body.trim()) return;
    setBusy(true);
    try {
      const r = await endpoints.messageStart({
        toUserId: picked.id,
        subject: subject.trim() || null,
        body: body.trim(),
      });
      onStarted(r.thread.id);
    } catch (err) {
      onError(err?.response?.data?.error || err.message);
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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
    >
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.98 }}
        onClick={(e) => e.stopPropagation()}
        className="mt-12 w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d0f24] p-5 shadow-2xl"
      >
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="font-display text-lg font-semibold text-white">New message</div>
            <div className="mt-0.5 text-xs text-white/55">
              You can message users you share a class or child with.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-white/55 hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Recipient */}
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">To</div>
            {picked ? (
              <div className="flex items-center gap-2 rounded-lg border border-brand-400/30 bg-brand-500/10 p-2 text-xs">
                <Avatar name={picked.name} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{picked.name}</div>
                  <div className="truncate text-[10px] text-white/55">
                    {picked.role} · {picked.email}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPicked(null)}
                  className="rounded p-1 text-white/55 hover:bg-white/10"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <>
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search name, role or email…"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50"
                />
                <div className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-white/10 bg-black/30">
                  {loadingContacts ? (
                    <div className="px-3 py-2 text-xs text-white/55">Loading…</div>
                  ) : filtered.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-white/45">
                      No contacts available.
                    </div>
                  ) : (
                    filtered.slice(0, 30).map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setPicked(c)}
                        className="flex w-full items-center gap-2 border-b border-white/5 px-2 py-1.5 text-left text-xs last:border-0 hover:bg-white/5"
                      >
                        <Avatar name={c.name} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{c.name}</div>
                          <div className="truncate text-[10px] text-white/55">
                            {c.role} · {c.email}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Subject (optional)
            </div>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50"
              placeholder="e.g. About Aarav's math grade"
            />
          </div>

          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">Message</div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              maxLength={4000}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50"
              placeholder="Type your message…"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 border-t border-white/5 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !picked || !body.trim()}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            {busy ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
            Send
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

// ============ Avatar (initials bubble) ============

function Avatar({ name, size = 8 }) {
  const initials = (name || "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  // Tailwind needs literal class names, so map common sizes explicitly.
  const sizes = { 8: "h-8 w-8 text-[10px]", 9: "h-9 w-9 text-xs" };
  const cls = sizes[size] || sizes[8];
  return (
    <div
      className={`${cls} grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-accent-violet font-bold text-white`}
    >
      {initials}
    </div>
  );
}
