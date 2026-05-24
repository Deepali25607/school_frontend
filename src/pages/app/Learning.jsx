import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Video,
  PlayCircle,
  FileText,
  Clock,
  Eye,
  Search,
  Sparkles as SparklesIcon,
  Calendar,
  Tv,
  Radio,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const PLATFORM_TONES = {
  Zoom: "bg-blue-500/15 text-blue-200 ring-blue-400/30",
  "Google Meet": "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30",
  "MS Teams": "bg-violet-500/15 text-violet-200 ring-violet-400/30",
};

export default function Learning() {
  const [tab, setTab] = useState("live");
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [subject, setSubject] = useState("all");

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

  const liveItems = live.data?.items || [];
  const counts = {
    live: liveItems.filter((c) => c.status === "Live").length,
    scheduled: liveItems.filter((c) => c.status === "Scheduled").length,
    ended: liveItems.filter((c) => c.status === "Ended").length,
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
        <LiveTab loading={live.loading} error={live.error} refetch={live.refetch} items={liveItems} />
      )}
      {tab === "recordings" && (
        <RecordingsTab
          q={q}
          setQ={setQ}
          subject={subject}
          setSubject={setSubject}
          recordings={recordings}
        />
      )}
      {tab === "materials" && <MaterialsTab materials={materials} />}
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

function LiveTab({ loading, error, refetch, items }) {
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44" />
        ))}
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((c, i) => (
        <LiveCard key={c.id} c={c} idx={i} />
      ))}
    </div>
  );
}

function LiveCard({ c, idx }) {
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
          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-medium ring-1 ${
              PLATFORM_TONES[c.platform] || "bg-white/10 text-white/70 ring-white/15"
            }`}
          >
            {c.platform}
          </span>
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

function RecordingsTab({ q, setQ, subject, setSubject, recordings }) {
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
            <RecordingCard key={r.id} r={r} idx={i} />
          ))}
        </div>
      )}
    </>
  );
}

function RecordingCard({ r, idx }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.03 }}
      whileHover={{ y: -4 }}
      className="card group relative overflow-hidden"
    >
      {/* thumbnail */}
      <div
        className="relative -mx-5 -mt-5 mb-3 flex h-28 items-center justify-center overflow-hidden"
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
      </div>

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

function MaterialsTab({ materials }) {
  if (materials.error)
    return <ErrorState error={materials.error} onRetry={materials.refetch} />;
  if (materials.loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    );
  }
  const items = materials.data?.items || [];
  return (
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
                <td className="px-5 py-3 font-medium">{m.title}</td>
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
                <td className="px-5 py-3 text-right">
                  <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10">
                    Download
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
