import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords,
  Trophy,
  Medal,
  Goal,
  CircleDot,
  CirclePlay,
  Volleyball,
  Dumbbell,
  Disc3,
  Crown,
  Activity,
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  X,
  Trash2,
  MapPin,
  Sparkles as SparklesIcon,
  Flame,
  Waves,
  Leaf,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const HOUSE_PALETTES = {
  Crimson: {
    text: "text-pink-300",
    bg: "from-accent-pink/30 to-rose-500/10",
    ring: "ring-accent-pink/40",
    fill: "from-accent-pink to-rose-500",
    chip: "bg-accent-pink/15 text-pink-200 ring-accent-pink/30",
    icon: Flame,
  },
  Azure: {
    text: "text-brand-300",
    bg: "from-brand-500/30 to-cyan-500/10",
    ring: "ring-brand-400/40",
    fill: "from-brand-500 to-cyan-500",
    chip: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
    icon: Waves,
  },
  Emerald: {
    text: "text-emerald-300",
    bg: "from-emerald-500/30 to-teal-500/10",
    ring: "ring-emerald-400/40",
    fill: "from-emerald-500 to-teal-500",
    chip: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
    icon: Leaf,
  },
  Amber: {
    text: "text-amber-300",
    bg: "from-amber-400/30 to-orange-500/10",
    ring: "ring-amber-400/40",
    fill: "from-amber-400 to-orange-500",
    chip: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
    icon: Crown,
  },
};

const SPORT_ICONS = {
  Football: Goal,
  Cricket: CircleDot,
  Basketball: Disc3,
  Volleyball: Volleyball,
  Athletics: Activity,
  Swimming: Activity,
  Chess: CircleDot,
  "Table Tennis": CircleDot,
  Badminton: Activity,
  Kabaddi: Dumbbell,
};

const STATUS_TONES = {
  Upcoming: "bg-white/5 text-white/65 ring-white/15",
  Ongoing: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Completed: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  Cancelled: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

const MATCH_STATUS_TONES = {
  Scheduled: "bg-white/5 text-white/65 ring-white/15",
  Live: "bg-emerald-500/20 text-emerald-200 ring-emerald-400/40 animate-pulse",
  Completed: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  Cancelled: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

export default function Sports() {
  const { user } = useAuth();
  const canManage = ["admin", "principal", "teacher"].includes(user?.role);

  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("all");
  const [sport, setSport] = useState("all");
  const [creating, setCreating] = useState(false);
  const [openTournamentId, setOpenTournamentId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const params = useMemo(
    () => ({ q: debounced, status, sport }),
    [debounced, status, sport]
  );

  const { data, loading, error, refetch } = useApi(
    () => endpoints.tournaments(params),
    [params]
  );

  useRealtime("sports.changed", () => refetch());

  const items = data?.items || [];
  const summary = data?.summary;
  const sports = data?.sports || [];

  // Auto-select first ongoing tournament
  useEffect(() => {
    if (!openTournamentId && items.length > 0) {
      const ongoing = items.find((t) => t.status === "Ongoing");
      setOpenTournamentId(ongoing?.id || items[0].id);
    }
  }, [items.length, openTournamentId]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Athletics"
        title="Sports Fixtures"
        subtitle={
          summary
            ? `${summary.ongoingTournaments} ongoing tournament${
                summary.ongoingTournaments === 1 ? "" : "s"
              } · ${summary.liveMatches} live · ${summary.upcomingMatches} upcoming match${
                summary.upcomingMatches === 1 ? "" : "es"
              }`
            : "Loading…"
        }
      />

      {error && <ErrorState error={error} onRetry={refetch} />}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          icon={Swords}
          label="Tournaments"
          value={summary ? summary.tournaments : "—"}
          subValue={
            summary
              ? `${summary.ongoingTournaments} ongoing · ${summary.completedTournaments} done`
              : null
          }
          tint="from-brand-500/30"
        />
        <button type="button" onClick={() => setStatus(status === "Ongoing" ? "all" : "Ongoing")} className={`block w-full rounded-2xl text-left transition-all ${status === "Ongoing" ? "ring-1 ring-brand-400/50" : ""}`}>
          <StatTile
            icon={CirclePlay}
            label="Live matches"
            value={summary ? summary.liveMatches : "—"}
            tint="from-emerald-500/30"
            accent="text-emerald-300"
            pulse={(summary?.liveMatches || 0) > 0}
          />
        </button>
        <button type="button" onClick={() => setStatus(status === "Upcoming" ? "all" : "Upcoming")} className={`block w-full rounded-2xl text-left transition-all ${status === "Upcoming" ? "ring-1 ring-brand-400/50" : ""}`}>
          <StatTile
            icon={Calendar}
            label="Upcoming matches"
            value={summary ? summary.upcomingMatches : "—"}
            tint="from-amber-500/30"
            accent="text-amber-300"
          />
        </button>
        <StatTile
          icon={Medal}
          label="MVPs awarded"
          value={summary ? summary.mvps.length : "—"}
          tint="from-accent-pink/30"
          accent="text-pink-300"
        />
      </div>

      {/* Next match callout */}
      {summary?.nextMatch && (
        <NextMatchBanner match={summary.nextMatch} />
      )}

      {/* Filters */}
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={14} className="text-white/55" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tournaments…"
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
            <option value="Ongoing">Ongoing</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Completed">Completed</option>
          </select>
          <select
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">All sports</option>
            {sports.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          {canManage && (
            <button
              onClick={() => setCreating(true)}
              className="btn-primary px-3 py-2 text-sm"
            >
              <Plus size={14} /> New tournament
            </button>
          )}
        </div>
      </div>

      {/* Tournaments grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center text-white/55">
          <Swords className="mx-auto mb-2 text-white/30" size={20} />
          No tournaments match the current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((t, i) => (
            <TournamentCard
              key={t.id}
              tournament={t}
              idx={i}
              active={t.id === openTournamentId}
              onOpen={() => setOpenTournamentId(t.id)}
            />
          ))}
        </div>
      )}

      {/* Selected tournament detail */}
      {openTournamentId && (
        <TournamentDetail
          tournamentId={openTournamentId}
          canManage={canManage}
          houses={data?.houses || []}
          venues={data?.venues || []}
          matchStatuses={data?.matchStatuses || []}
          onChanged={refetch}
        />
      )}

      <AnimatePresence>
        {creating && (
          <NewTournamentModal
            sports={sports}
            formats={data?.formats || []}
            onClose={() => setCreating(false)}
            onCreated={() => {
              setCreating(false);
              refetch();
            }}
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

function NextMatchBanner({ match }) {
  const palA = HOUSE_PALETTES[match.teamA];
  const palB = HOUSE_PALETTES[match.teamB];
  const IconA = palA?.icon || Goal;
  const IconB = palB?.icon || Goal;
  return (
    <div className="card relative overflow-hidden">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-emerald-500/20 to-brand-500/20 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-emerald-300">
          <SparklesIcon size={11} /> Next up
        </div>
        <div className="mt-2 grid grid-cols-3 items-center gap-2">
          <TeamBlock house={match.teamA} icon={IconA} align="right" />
          <div className="text-center">
            <div className="font-display text-3xl font-bold">vs</div>
            <div className="mt-1 text-[10px] text-white/55">
              {formatDateTime(match.date)}
            </div>
            <div className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-white/55">
              <MapPin size={9} /> {match.venue}
            </div>
          </div>
          <TeamBlock house={match.teamB} icon={IconB} align="left" />
        </div>
      </div>
    </div>
  );
}

function TeamBlock({ house, icon: Icon, align }) {
  const pal = HOUSE_PALETTES[house];
  return (
    <div
      className={`flex items-center gap-3 ${
        align === "right" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${pal?.fill} text-white shadow-glow ${
          align === "right" ? "order-2" : ""
        }`}
      >
        <Icon size={20} />
      </div>
      <div className={align === "right" ? "text-right" : "text-left"}>
        <div className={`font-display text-base font-bold ${pal?.text}`}>
          {house}
        </div>
        <div className="text-[10px] text-white/55">House</div>
      </div>
    </div>
  );
}

// ---------- Tournament card ----------

function TournamentCard({ tournament, idx, active, onOpen }) {
  const t = tournament;
  const Icon = SPORT_ICONS[t.sport] || CircleDot;
  const champPal = t.champion ? HOUSE_PALETTES[t.champion] : null;

  return (
    <motion.button
      onClick={onOpen}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.2) }}
      className={`card group relative overflow-hidden text-left transition-all ${
        active
          ? "border-brand-500/40 shadow-glow"
          : "hover:-translate-y-0.5 hover:border-brand-500/20 hover:shadow-glow"
      }`}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-brand-500/15 to-accent-violet/10 blur-3xl" />
      <div className="absolute -right-3 top-3 opacity-10">
        <Icon size={80} />
      </div>
      <div className="relative">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] ring-1 ring-white/15">
            <Icon size={9} />
            {t.sport}
          </span>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/65 ring-1 ring-white/15">
            {t.format}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ring-1 ${
              STATUS_TONES[t.status]
            }`}
          >
            {t.status}
          </span>
          {t.live > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200 ring-1 ring-emerald-400/40">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              LIVE
            </span>
          )}
        </div>
        <div className="mt-2 line-clamp-1 font-display text-base font-semibold">
          {t.name}
        </div>
        <div className="mt-1 line-clamp-2 text-[11px] text-white/65">
          {t.description}
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-white/55">
          <div className="inline-flex items-center gap-1">
            <Calendar size={11} /> {formatDate(t.startDate)} →{" "}
            {formatDate(t.endDate)}
          </div>
          <div>
            {t.completed}/{t.matchesCount} done
          </div>
        </div>

        {t.champion && champPal && (
          <div className={`mt-3 rounded-xl bg-gradient-to-br ${champPal.bg} p-2 ring-1 ${champPal.ring}`}>
            <div className="flex items-center gap-2">
              <Crown
                size={16}
                className={champPal.text}
                fill="currentColor"
              />
              <div className="text-[11px] text-white/75">Champion ·</div>
              <div className={`font-display text-base font-bold ${champPal.text}`}>
                {t.champion}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.button>
  );
}

// ---------- Tournament detail ----------

function TournamentDetail({
  tournamentId,
  canManage,
  houses,
  venues,
  matchStatuses,
  onChanged,
}) {
  const { data, loading, refetch } = useApi(
    () => endpoints.tournament(tournamentId),
    [tournamentId]
  );
  useRealtime("sports.changed", () => refetch());

  const [editMatch, setEditMatch] = useState(null);
  const [addingMatch, setAddingMatch] = useState(false);
  const [tab, setTab] = useState("fixtures");

  if (loading || !data) return <Skeleton className="h-72" />;

  const t = data.tournament;
  const matches = data.matches || [];
  const standings = data.standings || [];
  const Icon = SPORT_ICONS[t.sport] || CircleDot;

  return (
    <div className="card space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Icon size={18} className="text-brand-300" />
            <div className="font-display text-lg font-semibold">{t.name}</div>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ring-1 ${
                STATUS_TONES[t.status]
              }`}
            >
              {t.status}
            </span>
          </div>
          <div className="mt-1 text-xs text-white/65">{t.description}</div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-white/55">
            <span>{t.format}</span>
            <span>·</span>
            <span>
              {formatDate(t.startDate)} → {formatDate(t.endDate)}
            </span>
            <span>·</span>
            <span>by {t.organizer}</span>
            {t.format !== "Knockout" && (
              <>
                <span>·</span>
                <span>
                  W={t.pointsWin} D={t.pointsDraw} L={t.pointsLoss}
                </span>
              </>
            )}
          </div>
        </div>
        {canManage && (
          <button
            onClick={() => setAddingMatch(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
          >
            <Plus size={12} /> Add match
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
        <TabBtn
          active={tab === "fixtures"}
          onClick={() => setTab("fixtures")}
          icon={Calendar}
        >
          Fixtures ({matches.length})
        </TabBtn>
        {t.format !== "Knockout" && (
          <TabBtn
            active={tab === "standings"}
            onClick={() => setTab("standings")}
            icon={Trophy}
          >
            Standings
          </TabBtn>
        )}
        <TabBtn
          active={tab === "mvps"}
          onClick={() => setTab("mvps")}
          icon={Medal}
        >
          MVPs
        </TabBtn>
      </div>

      {tab === "fixtures" && (
        <FixturesList
          matches={matches}
          canManage={canManage}
          onEdit={(m) => setEditMatch(m)}
        />
      )}
      {tab === "standings" && <Standings standings={standings} />}
      {tab === "mvps" && <MVPs matches={matches} />}

      <AnimatePresence>
        {editMatch && (
          <MatchEditorModal
            match={editMatch}
            onClose={() => setEditMatch(null)}
            onSaved={() => {
              setEditMatch(null);
              refetch();
              onChanged?.();
            }}
          />
        )}
        {addingMatch && (
          <AddMatchModal
            tournamentId={t.id}
            houses={houses}
            venues={venues}
            onClose={() => setAddingMatch(false)}
            onAdded={() => {
              setAddingMatch(false);
              refetch();
              onChanged?.();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-brand-500/25 text-brand-100 ring-1 ring-brand-400/30"
          : "text-white/55 hover:bg-white/5"
      }`}
    >
      <Icon size={12} />
      {children}
    </button>
  );
}

// ---------- Fixtures ----------

function FixturesList({ matches, canManage, onEdit }) {
  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-white/45">
        No matches scheduled yet.
      </div>
    );
  }

  // Group by round
  const byRound = matches.reduce((acc, m) => {
    const k = m.round || "Match";
    if (!acc[k]) acc[k] = [];
    acc[k].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(byRound).map(([round, ms]) => (
        <div key={round}>
          <div className="mb-2 text-[10px] uppercase tracking-wider text-white/55">
            {round}
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {ms.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                canManage={canManage}
                onClick={() => canManage && onEdit(m)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MatchCard({ match, canManage, onClick }) {
  const m = match;
  const palA = HOUSE_PALETTES[m.teamA];
  const palB = HOUSE_PALETTES[m.teamB];
  const IconA = palA?.icon || Goal;
  const IconB = palB?.icon || Goal;
  const isFinished = m.status === "Completed";
  const isLive = m.status === "Live";

  return (
    <button
      type="button"
      onClick={canManage ? onClick : undefined}
      className={`group w-full rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition-colors ${
        canManage ? "hover:border-white/20 hover:bg-white/[0.06]" : ""
      } ${isLive ? "ring-1 ring-emerald-400/40" : ""}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] text-white/55">
          <Clock size={11} /> {formatDateTime(m.date)}
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ring-1 ${
            MATCH_STATUS_TONES[m.status]
          }`}
        >
          {isLive && (
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
          )}
          {m.status}
        </span>
      </div>

      <div className="grid grid-cols-7 items-center gap-2">
        {/* Team A */}
        <div className="col-span-3 flex items-center gap-2">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${palA?.fill}`}
          >
            <IconA size={14} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className={`text-sm font-semibold ${palA?.text}`}>
              {m.teamA}
            </div>
            {isFinished && m.winner === m.teamA && (
              <div className="text-[9px] text-amber-300">Winner</div>
            )}
          </div>
        </div>

        {/* Scoreboard */}
        <div className="text-center">
          {isFinished || isLive ? (
            <div className="flex items-center justify-center gap-2 font-display">
              <span className={`text-xl font-bold ${palA?.text}`}>
                {m.scoreA}
              </span>
              <span className="text-white/30">-</span>
              <span className={`text-xl font-bold ${palB?.text}`}>
                {m.scoreB}
              </span>
            </div>
          ) : (
            <div className="font-display text-base text-white/30">vs</div>
          )}
          {isFinished && m.isDraw && (
            <div className="text-[9px] text-white/55">Draw</div>
          )}
        </div>

        {/* Team B */}
        <div className="col-span-3 flex items-center justify-end gap-2">
          <div className="min-w-0 text-right">
            <div className={`text-sm font-semibold ${palB?.text}`}>
              {m.teamB}
            </div>
            {isFinished && m.winner === m.teamB && (
              <div className="text-[9px] text-amber-300">Winner</div>
            )}
          </div>
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${palB?.fill}`}
          >
            <IconB size={14} className="text-white" />
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-white/55">
        <span className="inline-flex items-center gap-1">
          <MapPin size={9} /> {m.venue}
        </span>
        {m.mvp && (
          <span className="inline-flex items-center gap-1 text-amber-300">
            <Medal size={10} /> MVP: {m.mvp.studentName}
          </span>
        )}
      </div>
      {m.moment && (
        <div className="mt-1 truncate text-[11px] italic text-white/65">
          "{m.moment}"
        </div>
      )}
    </button>
  );
}

// ---------- Standings ----------

function Standings({ standings }) {
  if (standings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-white/45">
        Standings will appear once matches are played.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
      <table className="min-w-full text-xs">
        <thead className="bg-white/[0.04] text-white/55">
          <tr>
            <th className="px-2 py-2 text-left font-medium">#</th>
            <th className="px-2 py-2 text-left font-medium">House</th>
            <th className="px-2 py-2 text-right font-medium">P</th>
            <th className="px-2 py-2 text-right font-medium">W</th>
            <th className="px-2 py-2 text-right font-medium">D</th>
            <th className="px-2 py-2 text-right font-medium">L</th>
            <th className="px-2 py-2 text-right font-medium">GF</th>
            <th className="px-2 py-2 text-right font-medium">GA</th>
            <th className="px-2 py-2 text-right font-medium">GD</th>
            <th className="px-2 py-2 text-right font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => {
            const pal = HOUSE_PALETTES[row.team];
            const Icon = pal?.icon || Goal;
            return (
              <motion.tr
                key={row.team}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`border-t border-white/5 ${
                  i === 0 ? "bg-amber-500/5" : ""
                }`}
              >
                <td className="px-2 py-2 font-mono text-white/55">
                  {i === 0 ? (
                    <Crown size={12} className="text-amber-300" fill="currentColor" />
                  ) : (
                    i + 1
                  )}
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br ${pal?.fill}`}
                    >
                      <Icon size={11} className="text-white" />
                    </div>
                    <span className={`font-semibold ${pal?.text}`}>
                      {row.team}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-2 text-right">{row.played}</td>
                <td className="px-2 py-2 text-right">{row.won}</td>
                <td className="px-2 py-2 text-right">{row.drawn}</td>
                <td className="px-2 py-2 text-right">{row.lost}</td>
                <td className="px-2 py-2 text-right">{row.goalsFor}</td>
                <td className="px-2 py-2 text-right">{row.goalsAgainst}</td>
                <td
                  className={`px-2 py-2 text-right ${
                    row.goalDiff > 0
                      ? "text-emerald-300"
                      : row.goalDiff < 0
                      ? "text-rose-300"
                      : "text-white/55"
                  }`}
                >
                  {row.goalDiff > 0 ? "+" : ""}
                  {row.goalDiff}
                </td>
                <td className="px-2 py-2 text-right font-display text-base font-bold">
                  {row.points}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MVPs({ matches }) {
  const mvpMatches = matches.filter((m) => m.mvp);
  if (mvpMatches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-white/45">
        No MVPs awarded yet.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {mvpMatches.map((m) => {
        const winningHouse = m.scoreA > m.scoreB ? m.teamA : m.teamB;
        const pal = HOUSE_PALETTES[winningHouse];
        return (
          <Link
            key={m.id}
            to={`/app/students/${m.mvp.studentId}`}
            className={`flex items-center gap-3 rounded-xl bg-gradient-to-br ${pal?.bg} p-3 ring-1 ${pal?.ring} transition-all hover:scale-[1.02]`}
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${pal?.fill} font-display text-sm font-bold text-white shadow-glow`}
            >
              {m.mvp.studentAvatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className={`truncate font-display text-sm font-semibold ${pal?.text}`}>
                {m.mvp.studentName}
              </div>
              <div className="truncate text-[10px] text-white/55">
                {m.round} · {m.teamA} {m.scoreA}-{m.scoreB} {m.teamB}
              </div>
            </div>
            <Medal size={16} className="text-amber-300" />
          </Link>
        );
      })}
    </div>
  );
}

// ---------- Match editor modal ----------

function MatchEditorModal({ match, onClose, onSaved }) {
  const [m, setM] = useState(match);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  // MVP picker (only relevant for completed matches)
  const [mvpQuery, setMvpQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [mvpOptions, setMvpOptions] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(mvpQuery), 250);
    return () => clearTimeout(t);
  }, [mvpQuery]);

  // Determine the winning house for filtering MVP candidates
  const winningHouse =
    m.status === "Completed" && m.scoreA !== m.scoreB
      ? m.scoreA > m.scoreB
        ? m.teamA
        : m.teamB
      : null;

  useEffect(() => {
    if (!debounced || debounced.length < 2) {
      setMvpOptions([]);
      return;
    }
    let cancelled = false;
    endpoints
      .students({ q: debounced })
      .then((r) => {
        if (cancelled) return;
        const list = (r.items || r || []).filter(
          (s) => !winningHouse || s.house === winningHouse
        );
        setMvpOptions(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [debounced, winningHouse]);

  function set(k, v) {
    setM((cur) => ({ ...cur, [k]: v }));
  }

  async function save() {
    setSubmitting(true);
    setErr(null);
    try {
      await endpoints.matchUpdate(m.id, {
        scoreA: Number(m.scoreA),
        scoreB: Number(m.scoreB),
        status: m.status,
        venue: m.venue,
        moment: m.moment || null,
        mvp: m.mvp ? { studentId: m.mvp.studentId } : null,
      });
      onSaved();
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this match?")) return;
    setSubmitting(true);
    try {
      await endpoints.matchDelete(m.id);
      onSaved();
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const palA = HOUSE_PALETTES[m.teamA];
  const palB = HOUSE_PALETTES[m.teamB];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 320 }}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0a0a1f] p-5 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="font-display text-base font-semibold">
              Update match
            </div>
            <div className="text-xs text-white/55">
              {m.round} · {formatDateTime(m.date)}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/55 hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        {/* Status */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {["Scheduled", "Live", "Completed", "Cancelled"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => set("status", s)}
              className={`rounded-full px-3 py-1 text-xs ring-1 ${
                m.status === s
                  ? "bg-brand-500/25 text-brand-100 ring-brand-400/30"
                  : "bg-white/5 text-white/65 ring-white/10 hover:bg-white/10"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Scoreboard */}
        <div className="grid grid-cols-3 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <ScoreInput
            house={m.teamA}
            value={m.scoreA}
            onChange={(v) => set("scoreA", v)}
            pal={palA}
          />
          <div className="text-center font-display text-2xl font-bold text-white/30">
            vs
          </div>
          <ScoreInput
            house={m.teamB}
            value={m.scoreB}
            onChange={(v) => set("scoreB", v)}
            pal={palB}
          />
        </div>

        {/* Venue & moment */}
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Venue
            </div>
            <input
              value={m.venue || ""}
              onChange={(e) => set("venue", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
            />
          </label>
          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Moment / highlight
            </div>
            <input
              value={m.moment || ""}
              onChange={(e) => set("moment", e.target.value)}
              placeholder="e.g. last-minute winner"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
            />
          </label>
        </div>

        {/* MVP picker (only when winner exists) */}
        {winningHouse && (
          <div className="mt-3">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              MVP · {winningHouse} player
            </div>
            <input
              value={mvpQuery}
              onChange={(e) => {
                setMvpQuery(e.target.value);
                if (m.mvp) set("mvp", null);
              }}
              placeholder="Type a player from the winning house…"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
            />
            {m.mvp ? (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-500/10 p-2 text-xs">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/30 text-amber-100">
                  <Medal size={13} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">
                    {m.mvp.studentName}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => set("mvp", null)}
                  className="rounded p-1 text-white/55 hover:bg-white/10"
                >
                  <X size={12} />
                </button>
              </div>
            ) : mvpOptions.length > 0 ? (
              <div className="mt-2 max-h-36 overflow-y-auto rounded-lg border border-white/10 bg-black/30">
                {mvpOptions.slice(0, 8).map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => {
                      set("mvp", {
                        studentId: s.id,
                        studentName: s.name,
                        studentAvatar: s.avatar,
                      });
                      setMvpQuery("");
                    }}
                    className="flex w-full items-center gap-2 border-b border-white/5 px-2 py-1.5 text-left text-xs last:border-0 hover:bg-white/5"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-accent-violet text-[9px] font-bold">
                      {s.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{s.name}</div>
                      <div className="truncate text-[10px] text-white/55">
                        {s.id} · G{s.grade}-{s.section}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {err && (
          <div className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {err}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={remove}
            disabled={submitting}
            className="inline-flex items-center gap-1 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 hover:bg-rose-500/20 disabled:opacity-50"
          >
            <Trash2 size={12} /> Delete
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm text-white/65 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={submitting}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ScoreInput({ house, value, onChange, pal }) {
  const Icon = pal?.icon || Goal;
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${pal?.fill}`}
      >
        <Icon size={16} className="text-white" />
      </div>
      <div className={`text-xs font-semibold ${pal?.text}`}>{house}</div>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center font-display text-2xl font-bold outline-none focus:border-brand-400/60 focus:bg-white/10"
      />
    </div>
  );
}

// ---------- Add match modal ----------

function AddMatchModal({ tournamentId, houses, venues, onClose, onAdded }) {
  const [form, setForm] = useState({
    round: "Round 1",
    teamA: houses[0] || "Crimson",
    teamB: houses[1] || "Azure",
    date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    venue: venues[0] || "Main Football Ground",
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    if (form.teamA === form.teamB) {
      setErr("Teams must differ");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      await endpoints.matchAdd({
        tournamentId,
        round: form.round,
        teamA: form.teamA,
        teamB: form.teamB,
        date: new Date(form.date).toISOString(),
        venue: form.venue,
      });
      onAdded();
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
        className="w-full max-w-md rounded-3xl bg-[#0a0a1f] p-5 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="font-display text-base font-semibold">
            Add fixture
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
              Round / label
            </div>
            <input
              value={form.round}
              onChange={(e) => set("round", e.target.value)}
              className={input}
              placeholder="e.g. Semi-final"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Team A
              </div>
              <select
                value={form.teamA}
                onChange={(e) => set("teamA", e.target.value)}
                className={input}
              >
                {houses.map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Team B
              </div>
              <select
                value={form.teamB}
                onChange={(e) => set("teamB", e.target.value)}
                className={input}
              >
                {houses.map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Date & time
            </div>
            <input
              type="datetime-local"
              required
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className={input}
            />
          </label>

          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Venue
            </div>
            <select
              value={form.venue}
              onChange={(e) => set("venue", e.target.value)}
              className={input}
            >
              {venues.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
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
            {submitting ? "Adding…" : "Add fixture"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

// ---------- New tournament modal ----------

function NewTournamentModal({ sports, formats, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    sport: sports[0] || "Football",
    format: "League",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    description: "",
    pointsWin: 3,
    pointsDraw: 1,
    pointsLoss: 0,
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
      await endpoints.tournamentAdd({
        ...form,
        pointsWin: Number(form.pointsWin),
        pointsDraw: Number(form.pointsDraw),
        pointsLoss: Number(form.pointsLoss),
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
            New tournament
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
              Tournament name
            </div>
            <input
              autoFocus
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={input}
              placeholder="e.g. Inter-House Football Cup · 2026"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Sport
              </div>
              <select
                value={form.sport}
                onChange={(e) => set("sport", e.target.value)}
                className={input}
              >
                {sports.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Format
              </div>
              <select
                value={form.format}
                onChange={(e) => set("format", e.target.value)}
                className={input}
              >
                {formats.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Start date
              </div>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                className={input}
              />
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                End date
              </div>
              <input
                type="date"
                required
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
                className={input}
              />
            </label>
          </div>

          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Description
            </div>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={`${input} resize-y`}
            />
          </label>

          {form.format !== "Knockout" && (
            <div className="grid grid-cols-3 gap-3">
              <label className="block">
                <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                  Win pts
                </div>
                <input
                  type="number"
                  min="0"
                  value={form.pointsWin}
                  onChange={(e) => set("pointsWin", e.target.value)}
                  className={input}
                />
              </label>
              <label className="block">
                <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                  Draw pts
                </div>
                <input
                  type="number"
                  min="0"
                  value={form.pointsDraw}
                  onChange={(e) => set("pointsDraw", e.target.value)}
                  className={input}
                />
              </label>
              <label className="block">
                <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                  Loss pts
                </div>
                <input
                  type="number"
                  min="0"
                  value={form.pointsLoss}
                  onChange={(e) => set("pointsLoss", e.target.value)}
                  className={input}
                />
              </label>
            </div>
          )}
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
            {submitting ? "Creating…" : "Schedule tournament"}
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
    year: "2-digit",
  });
}

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
