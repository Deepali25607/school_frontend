import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  PlayCircle,
  FileText,
  Clock,
  Eye,
  Search,
  Calendar,
  Tv,
  Radio,
  Plus,
  Trash2,
  X,
  Upload,
  Download,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const PLATFORM_TONES = {
  Zoom: "bg-blue-500/15 text-blue-200 ring-blue-400/30",
  "Google Meet": "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30",
  "MS Teams": "bg-violet-500/15 text-violet-200 ring-violet-400/30",
};

export default function Learning() {
  const { user } = useAuth();
  const canManage = ["admin", "principal", "teacher"].includes(user?.role);

  const [tab, setTab] = useState("live");
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [subject, setSubject] = useState("all");
  const [modal, setModal] = useState(null); // "class" | "recording" | "material"

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const live = useApi(endpoints.liveClasses, [tab === "live"]);
  const recordings = useApi(
    () => endpoints.recordings({ q: debounced, subject }),
    [debounced, subject, tab === "recordings"]
  );
  const materials = useApi(endpoints.materials, [tab === "materials"]);
  const meta = useApi(endpoints.learningMeta, []);

  // Live-refresh every tab when anyone publishes/removes content.
  useRealtime("learning.changed", () => {
    live.refetch();
    recordings.refetch();
    materials.refetch();
  });

  const liveItems = live.data?.items || [];
  const counts = {
    live: liveItems.filter((c) => c.status === "Live").length,
    scheduled: liveItems.filter((c) => c.status === "Scheduled").length,
    ended: liveItems.filter((c) => c.status === "Ended").length,
  };

  const closeModal = () => setModal(null);
  const onCreated = () => {
    closeModal();
    live.refetch();
    recordings.refetch();
    materials.refetch();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Academic"
        title="Online Learning"
        subtitle="Live classes, recorded lectures, study material"
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile icon={Radio} label="Live now" value={live.loading ? "—" : counts.live} tint="from-accent-pink/40" pulse={counts.live > 0} />
        <StatTile icon={Calendar} label="Scheduled" value={live.loading ? "—" : counts.scheduled} tint="from-brand-500/30" />
        <StatTile icon={Tv} label="Recordings" value={recordings.loading && !recordings.data ? "—" : recordings.data?.total || 0} tint="from-accent-violet/30" />
        <StatTile icon={FileText} label="Materials" value={materials.loading && !materials.data ? "—" : materials.data?.total || 0} tint="from-accent-gold/30" />
      </div>

      <div className="card flex flex-wrap items-center gap-2">
        {[
          { k: "live", label: "Live classes", icon: Radio },
          { k: "recordings", label: "Recorded library", icon: Video },
          { k: "materials", label: "Study material", icon: FileText },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm transition-all ${
              tab === t.k
                ? "bg-gradient-to-r from-brand-500/30 to-accent-violet/20 text-white ring-1 ring-white/15"
                : "text-white/65 hover:bg-white/5 hover:text-white"
            }`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "live" && (
        <LiveTab
          loading={live.loading}
          error={live.error}
          refetch={live.refetch}
          items={liveItems}
          canManage={canManage}
          onCreate={() => setModal("class")}
        />
      )}
      {tab === "recordings" && (
        <RecordingsTab
          q={q}
          setQ={setQ}
          subject={subject}
          setSubject={setSubject}
          recordings={recordings}
          canManage={canManage}
          onCreate={() => setModal("recording")}
        />
      )}
      {tab === "materials" && (
        <MaterialsTab
          materials={materials}
          canManage={canManage}
          onCreate={() => setModal("material")}
        />
      )}

      <AnimatePresence>
        {modal === "class" && (
          <ClassModal meta={meta.data} onClose={closeModal} onCreated={onCreated} />
        )}
        {modal === "recording" && (
          <RecordingModal meta={meta.data} onClose={closeModal} onCreated={onCreated} />
        )}
        {modal === "material" && (
          <MaterialModal meta={meta.data} onClose={closeModal} onCreated={onCreated} />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tint, pulse }) {
  return (
    <div className="card relative overflow-hidden">
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${tint} to-transparent blur-2xl ${
          pulse ? "animate-pulse" : ""
        }`}
      />
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

function LiveTab({ loading, error, refetch, items, canManage, onCreate }) {
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const header = canManage && (
    <div className="flex items-center justify-between">
      <div className="text-sm text-white/55">Schedule a virtual class — students see it instantly.</div>
      <button onClick={onCreate} className="btn-primary inline-flex items-center gap-1 text-sm">
        <Plus size={15} /> Create class
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {header}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      </div>
    );
  }
  const order = ["Live", "Scheduled", "Ended"];
  const sorted = [...items].sort(
    (a, b) =>
      order.indexOf(a.status) - order.indexOf(b.status) ||
      new Date(a.startsAt) - new Date(b.startsAt)
  );
  return (
    <div className="space-y-4">
      {header}
      {sorted.length === 0 ? (
        <div className="card text-center text-white/55">
          No live classes scheduled{canManage ? " — create one to get started." : "."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((c, i) => (
            <LiveCard key={c.id} c={c} idx={i} canManage={canManage} onDelete={refetch} />
          ))}
        </div>
      )}
    </div>
  );
}

function LiveCard({ c, idx, canManage, onDelete }) {
  const remove = async () => {
    if (!confirm(`Delete class "${c.title}"?`)) return;
    await endpoints.liveClassDelete(c.id);
    onDelete?.();
  };
  const startsAt = new Date(c.startsAt);
  const endsAt = new Date(c.endsAt);
  const isLive = c.status === "Live";
  const isEnded = c.status === "Ended";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      whileHover={{ y: -4 }}
      className={`card relative overflow-hidden ${isEnded ? "opacity-70" : ""}`}
    >
      {isLive && (
        <div className="pointer-events-none absolute inset-0 animate-pulse rounded-2xl ring-2 ring-accent-pink/40" />
      )}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-brand-500/30 to-accent-pink/30 blur-2xl opacity-50" />
      <div className="relative">
        <div className="flex items-start justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${
              isLive
                ? "bg-accent-pink/15 text-pink-200 ring-accent-pink/40"
                : isEnded
                ? "bg-white/5 text-white/60 ring-white/10"
                : "bg-brand-500/15 text-brand-300 ring-brand-400/30"
            }`}
          >
            {isLive && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-300 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-pink-300" />
              </span>
            )}
            {c.status.toUpperCase()}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-medium ring-1 ${
                PLATFORM_TONES[c.platform] || "bg-white/10 text-white/70 ring-white/15"
              }`}
            >
              {c.platform}
            </span>
            {canManage && (
              <button
                onClick={remove}
                title="Delete class"
                className="rounded-md p-1 text-white/45 transition-colors hover:bg-rose-500/15 hover:text-rose-300"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 font-display text-lg font-semibold leading-tight">
          {c.title}
        </div>
        <div className="text-xs text-white/60">
          {c.teacher.name} · Grade {c.grade}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1 text-white/70">
            <Clock size={11} />
            {startsAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            {" – "}
            {endsAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          <span className="text-white/55">{c.attendees} attendees</span>
        </div>

        <a
          href={c.joinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-4 inline-flex w-full items-center justify-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
            isLive
              ? "btn-primary"
              : isEnded
              ? "cursor-not-allowed border border-white/10 bg-white/5 text-white/40"
              : "border border-white/10 bg-white/5 text-white/85 hover:bg-white/10"
          }`}
          onClick={(e) => isEnded && e.preventDefault()}
        >
          {isLive ? (
            <>
              <Radio size={14} /> Join now
            </>
          ) : isEnded ? (
            "Class ended"
          ) : (
            <>
              <Calendar size={14} /> Add to calendar
            </>
          )}
        </a>
      </div>
    </motion.div>
  );
}

function RecordingsTab({ q, setQ, subject, setSubject, recordings, canManage, onCreate }) {
  const items = recordings.data?.items || [];
  const subjects = recordings.data?.subjects || [];

  return (
    <>
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={16} className="text-white/60" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, subject or teacher…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">All subjects</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {canManage && (
            <button onClick={onCreate} className="btn-primary inline-flex items-center gap-1 whitespace-nowrap text-sm">
              <Plus size={15} /> Add recording
            </button>
          )}
        </div>
      </div>

      {recordings.error && <ErrorState error={recordings.error} onRetry={recordings.refetch} />}

      {recordings.loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center text-white/55">No recordings match.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((r, i) => (
            <RecordingCard key={r.id} r={r} idx={i} canManage={canManage} onChange={recordings.refetch} />
          ))}
        </div>
      )}
    </>
  );
}

function RecordingCard({ r, idx, canManage, onChange }) {
  const remove = async (e) => {
    e.stopPropagation();
    if (!confirm(`Delete recording "${r.title}"?`)) return;
    await endpoints.recordingDelete(r.id);
    onChange?.();
  };
  const watch = async () => {
    try {
      await endpoints.recordingView(r.id);
    } catch {
      /* view count is best-effort */
    }
    if (r.videoUrl) window.open(r.videoUrl, "_blank", "noopener");
    onChange?.();
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.03 }}
      whileHover={{ y: -4 }}
      className="card group relative overflow-hidden"
    >
      {/* thumbnail */}
      <button
        type="button"
        onClick={watch}
        title={r.videoUrl ? "Play recording" : "No video link attached"}
        className="relative -mx-5 -mt-5 mb-3 flex h-28 w-[calc(100%+2.5rem)] items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, hsl(${r.thumbHue} 80% 55% / 0.85), hsl(${(r.thumbHue + 60) % 360} 80% 40% / 0.85))`,
        }}
      >
        <PlayCircle
          size={48}
          className="text-white/90 drop-shadow transition-transform group-hover:scale-110"
        />
        <span className="absolute right-2 top-2 rounded-md bg-black/40 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {r.durationMin}m
        </span>
        <span className="absolute bottom-2 left-2 rounded-md bg-black/40 px-1.5 py-0.5 text-[10px] font-medium text-white/90">
          {r.subject}
        </span>
        {canManage && (
          <span
            role="button"
            tabIndex={0}
            onClick={remove}
            onKeyDown={(e) => e.key === "Enter" && remove(e)}
            title="Delete recording"
            className="absolute left-2 top-2 cursor-pointer rounded-md bg-black/40 p-1 text-white/80 transition-colors hover:bg-rose-500/60 hover:text-white"
          >
            <Trash2 size={13} />
          </span>
        )}
      </button>

      <div className="line-clamp-2 font-display text-sm font-semibold leading-snug">
        {r.title}
      </div>
      <div className="mt-1 text-xs text-white/55">
        {r.teacher.name} · Grade {r.grade}
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-white/55">
        <span className="inline-flex items-center gap-1">
          <Calendar size={11} /> {r.recordedOn}
        </span>
        <span className="inline-flex items-center gap-1">
          <Eye size={11} /> {r.views}
        </span>
      </div>
    </motion.div>
  );
}

function MaterialsTab({ materials, canManage, onCreate }) {
  if (materials.error)
    return <ErrorState error={materials.error} onRetry={materials.refetch} />;

  const header = canManage && (
    <div className="flex items-center justify-between">
      <div className="text-sm text-white/55">Upload study material — it becomes available to students immediately.</div>
      <button onClick={onCreate} className="btn-primary inline-flex items-center gap-1 text-sm">
        <Upload size={15} /> Upload material
      </button>
    </div>
  );

  if (materials.loading) {
    return (
      <div className="space-y-4">
        {header}
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      </div>
    );
  }
  const items = materials.data?.items || [];

  const download = async (m) => {
    try {
      await endpoints.materialDownload(m.id);
    } catch {
      /* count is best-effort */
    }
    if (m.url) window.open(m.url, "_blank", "noopener");
    else
      alert(
        m.fileName
          ? `"${m.fileName}" is on file. (Demo build stores the record, not the bytes.)`
          : "No file or link attached to this material."
      );
    materials.refetch();
  };

  const remove = async (m) => {
    if (!confirm(`Delete material "${m.title}"?`)) return;
    await endpoints.materialDelete(m.id);
    materials.refetch();
  };

  return (
    <div className="space-y-4">
      {header}
      {items.length === 0 ? (
        <div className="card text-center text-white/55">
          No study material yet{canManage ? " — upload some to share with students." : "."}
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03] text-left text-[11px] uppercase tracking-wider text-white/55">
                <tr>
                  <th className="px-5 py-3">Material</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Teacher</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Size</th>
                  <th className="px-5 py-3">Uploaded</th>
                  <th className="px-5 py-3 text-right">Downloads</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((m, i) => (
                  <motion.tr
                    key={m.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.015 }}
                    className="border-t border-white/5 hover:bg-white/[0.025]"
                  >
                    <td className="px-5 py-3 font-medium">
                      {m.title}
                      {m.fileName && (
                        <span className="ml-2 text-[10px] text-white/40">{m.fileName}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-white/70">{m.subject}</td>
                    <td className="px-5 py-3 text-white/70">{m.teacher.name}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] ring-1 ring-white/10">
                        {m.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-white/70">
                      {m.sizeKb < 1024 ? `${m.sizeKb} KB` : `${(m.sizeKb / 1024).toFixed(1)} MB`}
                    </td>
                    <td className="px-5 py-3 text-white/70">{m.uploadedOn}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{m.downloads}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => download(m)}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                        >
                          <Download size={13} /> Download
                        </button>
                        {canManage && (
                          <button
                            onClick={() => remove(m)}
                            title="Delete material"
                            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/55 hover:bg-rose-500/15 hover:text-rose-300"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// =================== CREATE / UPLOAD MODALS ===================
const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/90 placeholder:text-white/35 outline-none focus:border-brand-400/50";

function ModalShell({ title, subtitle, icon: Icon, onClose, children }) {
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
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a0a1e] via-[#0d0d2a] to-[#101044] shadow-glow"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-brand-500/30 to-accent-pink/30 blur-3xl" />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>
        <div className="relative p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-accent-violet to-accent-pink text-white shadow-glow">
              <Icon size={20} />
            </div>
            <div>
              <div className="font-display text-xl font-bold leading-tight">{title}</div>
              {subtitle && <div className="text-xs text-white/55">{subtitle}</div>}
            </div>
          </div>
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children, full }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">{label}</div>
      {children}
    </label>
  );
}

// Shared submit/cancel footer with inline error + busy state.
function useFormSubmit(onCreated) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (fn) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
      onCreated();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Something went wrong");
      setBusy(false);
    }
  };
  return { busy, error, submit };
}

function FormFooter({ busy, error, onClose, submitLabel }) {
  return (
    <>
      {error && (
        <div className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-[11px] text-rose-200">
          {error}
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="btn-ghost text-sm">
          Cancel
        </button>
        <button type="submit" disabled={busy} className="btn-primary text-sm disabled:opacity-50">
          {busy ? "Saving…" : submitLabel}
        </button>
      </div>
    </>
  );
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function nextHourStr() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return `${String(d.getHours()).padStart(2, "0")}:00`;
}

function SubjectSelect({ value, onChange, subjects }) {
  return (
    <select className={inputCls} value={value} onChange={onChange}>
      <option value="">Select subject…</option>
      {(subjects || []).map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}

function TeacherSelect({ value, onChange, teachers }) {
  return (
    <select className={inputCls} value={value} onChange={onChange}>
      <option value="">Select teacher…</option>
      {(teachers || []).map((t) => (
        <option key={t.id} value={t.id}>{t.name} · {t.subject}</option>
      ))}
    </select>
  );
}

function GradeSelect({ value, onChange, allowAll }) {
  return (
    <select className={inputCls} value={value} onChange={onChange}>
      {allowAll && <option value="">All grades</option>}
      {!allowAll && <option value="">Select grade…</option>}
      {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
        <option key={g} value={g}>Grade {g}</option>
      ))}
    </select>
  );
}

function ClassModal({ meta, onClose, onCreated }) {
  const teachers = meta?.teachers || [];
  const [f, setF] = useState({
    subject: "", grade: "", teacherId: "", platform: meta?.platforms?.[0] || "Zoom",
    date: todayStr(), time: nextHourStr(), durationMin: 45, title: "", joinUrl: "",
  });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const setTeacher = (e) => {
    const id = e.target.value;
    const t = teachers.find((x) => x.id === id);
    setF((s) => ({ ...s, teacherId: id, subject: s.subject || t?.subject || "" }));
  };
  const { busy, error, submit } = useFormSubmit(onCreated);

  return (
    <ModalShell title="Create online class" subtitle="Schedule a live virtual session" icon={Radio} onClose={onClose}>
      <form
        onSubmit={(e) => { e.preventDefault(); submit(() => endpoints.liveClassAdd(f)); }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        <Field label="Subject"><SubjectSelect value={f.subject} onChange={set("subject")} subjects={meta?.subjects} /></Field>
        <Field label="Grade"><GradeSelect value={f.grade} onChange={set("grade")} /></Field>
        <Field label="Teacher"><TeacherSelect value={f.teacherId} onChange={setTeacher} teachers={teachers} /></Field>
        <Field label="Platform">
          <select className={inputCls} value={f.platform} onChange={set("platform")}>
            {(meta?.platforms || ["Zoom", "Google Meet", "MS Teams"]).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="Date"><input type="date" className={inputCls} value={f.date} onChange={set("date")} /></Field>
        <Field label="Start time"><input type="time" className={inputCls} value={f.time} onChange={set("time")} /></Field>
        <Field label="Duration (min)"><input type="number" min="5" className={inputCls} value={f.durationMin} onChange={set("durationMin")} /></Field>
        <Field label="Title (optional)"><input className={inputCls} value={f.title} onChange={set("title")} placeholder="Auto-generated if blank" /></Field>
        <Field label="Join link (optional)" full><input className={inputCls} value={f.joinUrl} onChange={set("joinUrl")} placeholder="https://meet…  (auto-generated if blank)" /></Field>
        <div className="sm:col-span-2">
          <FormFooter busy={busy} error={error} onClose={onClose} submitLabel="Create class" />
        </div>
      </form>
    </ModalShell>
  );
}

function RecordingModal({ meta, onClose, onCreated }) {
  const teachers = meta?.teachers || [];
  const [f, setF] = useState({
    title: "", subject: "", grade: "", teacherId: "",
    recordedOn: todayStr(), durationMin: 40, videoUrl: "", tags: "",
  });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const setTeacher = (e) => {
    const id = e.target.value;
    const t = teachers.find((x) => x.id === id);
    setF((s) => ({ ...s, teacherId: id, subject: s.subject || t?.subject || "" }));
  };
  const { busy, error, submit } = useFormSubmit(onCreated);

  return (
    <ModalShell title="Add recorded session" subtitle="Publish a recording to the library" icon={Video} onClose={onClose}>
      <form
        onSubmit={(e) => { e.preventDefault(); submit(() => endpoints.recordingAdd(f)); }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        <Field label="Title" full><input className={inputCls} value={f.title} onChange={set("title")} placeholder="e.g. Thermodynamics — Chapter Recap" /></Field>
        <Field label="Subject"><SubjectSelect value={f.subject} onChange={set("subject")} subjects={meta?.subjects} /></Field>
        <Field label="Grade"><GradeSelect value={f.grade} onChange={set("grade")} /></Field>
        <Field label="Teacher"><TeacherSelect value={f.teacherId} onChange={setTeacher} teachers={teachers} /></Field>
        <Field label="Recorded on"><input type="date" className={inputCls} value={f.recordedOn} onChange={set("recordedOn")} /></Field>
        <Field label="Duration (min)"><input type="number" min="1" className={inputCls} value={f.durationMin} onChange={set("durationMin")} /></Field>
        <Field label="Tags (comma-separated)"><input className={inputCls} value={f.tags} onChange={set("tags")} placeholder="NCERT, Practice" /></Field>
        <Field label="Video link (optional)" full><input className={inputCls} value={f.videoUrl} onChange={set("videoUrl")} placeholder="https://… (YouTube, Drive, etc.)" /></Field>
        <div className="sm:col-span-2">
          <FormFooter busy={busy} error={error} onClose={onClose} submitLabel="Publish recording" />
        </div>
      </form>
    </ModalShell>
  );
}

function MaterialModal({ meta, onClose, onCreated }) {
  const teachers = meta?.teachers || [];
  const types = meta?.materialTypes || ["PDF", "Slide deck", "Worksheet", "Notes", "Video"];
  const [f, setF] = useState({
    title: "", subject: "", grade: "", teacherId: "", type: types[0],
    url: "", fileName: "", sizeKb: 0,
  });
  const fileRef = useRef(null);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const setTeacher = (e) => {
    const id = e.target.value;
    const t = teachers.find((x) => x.id === id);
    setF((s) => ({ ...s, teacherId: id, subject: s.subject || t?.subject || "" }));
  };
  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setF((s) => ({
      ...s,
      fileName: file.name,
      sizeKb: Math.max(1, Math.round(file.size / 1024)),
      title: s.title || file.name.replace(/\.[^.]+$/, ""),
    }));
  };
  const { busy, error, submit } = useFormSubmit(onCreated);

  return (
    <ModalShell title="Upload study material" subtitle="Share notes, slides & worksheets with students" icon={FileText} onClose={onClose}>
      <form
        onSubmit={(e) => { e.preventDefault(); submit(() => endpoints.materialAdd(f)); }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        <Field label="Title" full><input className={inputCls} value={f.title} onChange={set("title")} placeholder="e.g. Algebra Practice Set" /></Field>
        <Field label="Subject"><SubjectSelect value={f.subject} onChange={set("subject")} subjects={meta?.subjects} /></Field>
        <Field label="Teacher"><TeacherSelect value={f.teacherId} onChange={setTeacher} teachers={teachers} /></Field>
        <Field label="Type">
          <select className={inputCls} value={f.type} onChange={set("type")}>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Grade (optional)"><GradeSelect value={f.grade} onChange={set("grade")} allowAll /></Field>
        <Field label="File" full>
          <input ref={fileRef} type="file" className="hidden" onChange={onFile} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-3 py-3 text-sm text-white/70 hover:border-brand-400/50 hover:text-white"
          >
            <Upload size={15} />
            {f.fileName ? `${f.fileName} · ${f.sizeKb} KB` : "Choose a file to upload"}
          </button>
        </Field>
        <Field label="…or external link" full><input className={inputCls} value={f.url} onChange={set("url")} placeholder="https://… (Drive, Dropbox, etc.)" /></Field>
        <div className="sm:col-span-2">
          <FormFooter busy={busy} error={error} onClose={onClose} submitLabel="Upload material" />
        </div>
      </form>
    </ModalShell>
  );
}
