import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Briefcase,
  Rocket,
  GraduationCap,
  School,
  BookOpen,
  Globe,
  MapPinned,
  Send,
  Plane,
  Palette,
  Code2,
  Stethoscope,
  Scale3d,
  Landmark,
  Plus,
  Search,
  Filter,
  X,
  Trash2,
  CheckCircle2,
  XCircle,
  Hourglass,
  Clock,
  Users2,
  Trophy,
  Calendar,
  Sparkles as SparklesIcon,
  TrendingUp,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useRealtime } from "../../lib/useRealtime.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const TRACK_ICONS = {
  "Engineering / Tech": Code2,
  "Medicine / Healthcare": Stethoscope,
  "Business / Commerce": Briefcase,
  "Liberal Arts": BookOpen,
  "Design / Architecture": Palette,
  Law: Scale3d,
  "Civil Services": Landmark,
  "Performing Arts": Palette,
  "Sciences (Pure)": Rocket,
  "Sports / Athletics": Trophy,
  "Defence Services": School,
  Undecided: Compass,
};

const STATUS_TONES = {
  Planning: "bg-white/5 text-white/65 ring-white/15",
  Applied: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  Admitted: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Rejected: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  Waitlisted: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
  Enrolled: "bg-accent-violet/20 text-purple-200 ring-accent-violet/40",
};

const STATUS_ICONS = {
  Planning: Compass,
  Applied: Send,
  Admitted: CheckCircle2,
  Rejected: XCircle,
  Waitlisted: Hourglass,
  Enrolled: GraduationCap,
};

export default function Careers() {
  const { user } = useAuth();
  const canEdit = ["admin", "principal", "hr", "teacher"].includes(user?.role);

  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [track, setTrack] = useState("all");
  const [counsellor, setCounsellor] = useState("all");
  const [grade, setGrade] = useState("all");
  const [appFilter, setAppFilter] = useState("all"); // KPI-card driven: all | withApps | admitted
  const [openStudentId, setOpenStudentId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const params = useMemo(
    () => ({ q: debounced, track, counsellor, grade }),
    [debounced, track, counsellor, grade]
  );

  const { data, loading, error, refetch } = useApi(
    () => endpoints.careerProfiles(params),
    [params]
  );

  useRealtime("careers.changed", () => refetch());

  const profiles = (data?.items || []).filter((p) => {
    if (appFilter === "admitted") return p.admittedCount > 0;
    if (appFilter === "withApps") return p.applicationsCount > 0;
    return true;
  });
  const summary = data?.summary;
  const tracks = data?.tracks || [];
  const counsellors = data?.counsellors || [];

  // Auto-select first profile
  useEffect(() => {
    if (!openStudentId && profiles.length > 0) {
      setOpenStudentId(profiles[0].studentId);
    }
  }, [profiles.length, openStudentId]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Guidance"
        title="Career Counselling"
        subtitle={
          summary
            ? `${summary.profilesCount} senior profiles · ${summary.applicationsCount} college applications · ${summary.admitted} admitted`
            : "Loading…"
        }
      />

      {error && <ErrorState error={error} onRetry={refetch} />}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <button type="button" onClick={() => setAppFilter("all")} className={`block w-full rounded-2xl text-left transition-all ${appFilter === "all" ? "ring-1 ring-brand-400/50" : ""}`}>
          <StatTile
            icon={Users2}
            label="Senior profiles"
            value={summary ? summary.profilesCount : "—"}
            subValue={
              summary ? `${summary.seniors} students in Grades 11-12` : null
            }
            tint="from-brand-500/30"
          />
        </button>
        <button type="button" onClick={() => setAppFilter(appFilter === "withApps" ? "all" : "withApps")} className={`block w-full rounded-2xl text-left transition-all ${appFilter === "withApps" ? "ring-1 ring-brand-400/50" : ""}`}>
          <StatTile
            icon={Send}
            label="Applications open"
            value={summary ? summary.applied + summary.waitlisted : "—"}
            subValue={
              summary
                ? `${summary.planning} planning · ${summary.waitlisted} waitlisted`
                : null
            }
            tint="from-amber-500/30"
            accent="text-amber-300"
          />
        </button>
        <button type="button" onClick={() => setAppFilter(appFilter === "admitted" ? "all" : "admitted")} className={`block w-full rounded-2xl text-left transition-all ${appFilter === "admitted" ? "ring-1 ring-brand-400/50" : ""}`}>
          <StatTile
            icon={CheckCircle2}
            label="Admitted"
            value={summary ? summary.admitted : "—"}
            subValue={summary ? `${summary.enrolled} enrolled` : null}
            tint="from-emerald-500/30"
            accent="text-emerald-300"
          />
        </button>
        <StatTile
          icon={Calendar}
          label="Follow-ups (14d)"
          value={summary ? summary.upcomingFollowUps : "—"}
          tint="from-accent-pink/30"
          accent="text-pink-300"
          pulse={(summary?.upcomingFollowUps || 0) > 0}
        />
      </div>

      {/* Track distribution + top dream colleges */}
      {summary && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <TrackDistribution
            byTrack={summary.byTrack}
            onPick={(t) => setTrack(t)}
          />
          <TopDreamColleges colleges={summary.topDreamColleges} />
        </div>
      )}

      {/* Filters */}
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={14} className="text-white/55" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search seniors…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-white/55" />
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">All grades</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
          </select>
          <select
            value={track}
            onChange={(e) => setTrack(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">All tracks</option>
            {tracks.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select
            value={counsellor}
            onChange={(e) => setCounsellor(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="all">All counsellors</option>
            {counsellors.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Two-pane layout: list + detail */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="lg:col-span-4">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : profiles.length === 0 ? (
            <div className="card text-center text-white/55">
              <Users2 className="mx-auto mb-2 text-white/30" size={20} />
              No seniors match the current filters.
            </div>
          ) : (
            <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
              {profiles.map((p, i) => (
                <ProfileListItem
                  key={p.studentId}
                  profile={p}
                  idx={i}
                  active={p.studentId === openStudentId}
                  onClick={() => setOpenStudentId(p.studentId)}
                />
              ))}
            </div>
          )}
        </div>
        <div className="lg:col-span-8">
          {openStudentId ? (
            <ProfileDetail
              studentId={openStudentId}
              canEdit={canEdit}
              tracks={tracks}
              streams={data?.streams || []}
              countries={data?.countries || []}
              exams={data?.exams || []}
              counsellors={counsellors}
              indianColleges={data?.indianColleges || []}
              abroadColleges={data?.abroadColleges || []}
              onChanged={refetch}
            />
          ) : (
            <div className="card text-center text-white/55">
              <Compass className="mx-auto mb-2 text-white/30" size={20} />
              Select a senior to view their career profile.
            </div>
          )}
        </div>
      </div>
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

function TrackDistribution({ byTrack, onPick }) {
  const entries = Object.entries(byTrack)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, c]) => c), 1);
  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="font-display text-base font-semibold">
            Career tracks
          </div>
          <div className="text-xs text-white/55">
            What seniors are aiming for
          </div>
        </div>
        <Compass size={14} className="text-white/45" />
      </div>
      <div className="space-y-2">
        {entries.map(([trackName, count]) => {
          const Icon = TRACK_ICONS[trackName] || Compass;
          const pct = (count / max) * 100;
          return (
            <button
              key={trackName}
              onClick={() => onPick(trackName)}
              className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-2 text-left transition-colors hover:border-white/15 hover:bg-white/[0.06]"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500/15 text-brand-300">
                <Icon size={12} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate">{trackName}</span>
                  <span className="text-white/55">{count}</span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-accent-violet"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TopDreamColleges({ colleges }) {
  if (!colleges?.length) return null;
  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="font-display text-base font-semibold">
            Top dream colleges
          </div>
          <div className="text-xs text-white/55">
            Most-cited targets across seniors
          </div>
        </div>
        <TrendingUp size={14} className="text-amber-300" />
      </div>
      <div className="space-y-2">
        {colleges.map((c, i) => {
          const isAbroad = !/india/i.test(c.college) && /university|college|institute|school/i.test(c.college) === false;
          const Icon = isAbroad ? Plane : MapPinned;
          return (
            <div
              key={c.college}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-2 text-xs"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/15 text-amber-300">
                <Icon size={12} />
              </div>
              <div className="min-w-0 flex-1 truncate font-medium">
                {c.college}
              </div>
              <div className="font-display text-base font-bold text-amber-200">
                {c.count}
              </div>
              <div className="text-[10px] text-white/45">#{i + 1}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProfileListItem({ profile, idx, active, onClick }) {
  const p = profile;
  const Icon = TRACK_ICONS[p.track] || Compass;
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.2) }}
      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
        active
          ? "border-brand-400/40 bg-brand-500/10"
          : "border-white/5 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]"
      }`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-violet text-sm font-bold">
        {p.studentAvatar}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <div className="truncate text-sm font-semibold">{p.studentName}</div>
          <span className="rounded-full bg-white/5 px-1.5 py-0 text-[9px] text-white/55 ring-1 ring-white/15">
            G{p.studentGrade}-{p.studentSection}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-white/55">
          <Icon size={9} />
          <span className="truncate">{p.track}</span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-[10px]">
          {p.applicationsCount > 0 ? (
            <span className="text-brand-300">
              {p.applicationsCount} apps
              {p.admittedCount > 0 && (
                <span className="ml-1 text-emerald-300">
                  · {p.admittedCount} admitted
                </span>
              )}
            </span>
          ) : (
            <span className="text-white/30">no apps yet</span>
          )}
          {p.enrolledTo && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-accent-violet/15 px-1.5 py-0 text-[9px] text-purple-200 ring-1 ring-accent-violet/30">
              <GraduationCap size={8} /> enrolled
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// ---------- Profile detail ----------

function ProfileDetail({
  studentId,
  canEdit,
  tracks,
  streams,
  countries,
  exams,
  counsellors,
  indianColleges,
  abroadColleges,
  onChanged,
}) {
  const { data, loading, refetch } = useApi(
    () => endpoints.careerProfile(studentId),
    [studentId]
  );
  useRealtime("careers.changed", () => refetch());

  const [tab, setTab] = useState("overview");
  const [editingProfile, setEditingProfile] = useState(false);
  const [addingSession, setAddingSession] = useState(false);
  const [addingApplication, setAddingApplication] = useState(false);

  if (loading || !data) return <Skeleton className="h-96" />;

  const p = data.profile;
  const sessions = data.sessions || [];
  const applications = data.applications || [];
  const Icon = TRACK_ICONS[p.track] || Compass;

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-violet text-base font-bold shadow-glow">
            {p.studentAvatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Link
                to={`/app/students/${p.studentId}`}
                className="font-display text-lg font-semibold hover:underline"
              >
                {p.studentName}
              </Link>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/55 ring-1 ring-white/15">
                G{p.studentGrade}-{p.studentSection}
              </span>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/55 ring-1 ring-white/15">
                {p.studentHouse}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-white/65">
              <Icon size={11} className="text-brand-300" />
              <span>{p.track}</span>
              <span>·</span>
              <span>{p.stream}</span>
              <span>·</span>
              <span>Counsellor: {p.counsellor}</span>
            </div>
          </div>
        </div>
        {canEdit && (
          <button
            onClick={() => setEditingProfile(true)}
            className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
          >
            Edit profile
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
        <TabBtn
          active={tab === "overview"}
          onClick={() => setTab("overview")}
          icon={Compass}
        >
          Overview
        </TabBtn>
        <TabBtn
          active={tab === "applications"}
          onClick={() => setTab("applications")}
          icon={Send}
        >
          Applications ({applications.length})
        </TabBtn>
        <TabBtn
          active={tab === "sessions"}
          onClick={() => setTab("sessions")}
          icon={BookOpen}
        >
          Sessions ({sessions.length})
        </TabBtn>
      </div>

      {tab === "overview" && (
        <Overview profile={p} applications={applications} sessions={sessions} />
      )}

      {tab === "applications" && (
        <ApplicationsPanel
          applications={applications}
          canEdit={canEdit}
          onAdd={() => setAddingApplication(true)}
          onChanged={() => {
            refetch();
            onChanged?.();
          }}
        />
      )}

      {tab === "sessions" && (
        <SessionsPanel
          sessions={sessions}
          canEdit={canEdit}
          onAdd={() => setAddingSession(true)}
          onChanged={() => {
            refetch();
            onChanged?.();
          }}
        />
      )}

      <AnimatePresence>
        {editingProfile && (
          <EditProfileModal
            profile={p}
            tracks={tracks}
            streams={streams}
            countries={countries}
            exams={exams}
            counsellors={counsellors}
            onClose={() => setEditingProfile(false)}
            onSaved={() => {
              setEditingProfile(false);
              refetch();
              onChanged?.();
            }}
          />
        )}
        {addingSession && (
          <AddSessionModal
            studentId={studentId}
            counsellors={counsellors}
            defaultCounsellor={p.counsellor}
            onClose={() => setAddingSession(false)}
            onAdded={() => {
              setAddingSession(false);
              refetch();
              onChanged?.();
            }}
          />
        )}
        {addingApplication && (
          <AddApplicationModal
            studentId={studentId}
            indianColleges={indianColleges}
            abroadColleges={abroadColleges}
            countries={countries}
            onClose={() => setAddingApplication(false)}
            onAdded={() => {
              setAddingApplication(false);
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

// ---------- Overview ----------

function Overview({ profile, applications, sessions }) {
  const p = profile;
  const latestSession = sessions[0];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Mini
          icon={Globe}
          label="Target countries"
          body={
            <div className="flex flex-wrap gap-1.5">
              {(p.targetCountries || []).length === 0 ? (
                <span className="text-xs text-white/45">Not set</span>
              ) : (
                p.targetCountries.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-brand-500/15 px-2 py-0.5 text-[10px] text-brand-300 ring-1 ring-brand-400/30"
                  >
                    {c}
                  </span>
                ))
              )}
            </div>
          }
        />
        <Mini
          icon={School}
          label="Planned exams"
          body={
            <div className="flex flex-wrap gap-1.5">
              {(p.examsPlanned || []).length === 0 ? (
                <span className="text-xs text-white/45">None planned</span>
              ) : (
                p.examsPlanned.map((e) => (
                  <span
                    key={e}
                    className="rounded-full bg-accent-violet/15 px-2 py-0.5 text-[10px] text-purple-200 ring-1 ring-accent-violet/30"
                  >
                    {e}
                  </span>
                ))
              )}
            </div>
          }
        />
      </div>

      <Mini
        icon={MapPinned}
        label="Dream colleges"
        body={
          (p.dreamColleges || []).length === 0 ? (
            <span className="text-xs text-white/45">No targets yet</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {p.dreamColleges.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-200 ring-1 ring-amber-400/30"
                >
                  {c}
                </span>
              ))}
            </div>
          )
        }
      />

      {(p.strengths || []).length > 0 && (
        <Mini
          icon={SparklesIcon}
          label="Strengths"
          body={
            <ul className="list-disc space-y-1 pl-5 text-xs text-white/75">
              {p.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          }
        />
      )}

      {p.careerNotes && (
        <Mini
          icon={BookOpen}
          label="Counsellor notes"
          body={<div className="whitespace-pre-wrap text-xs text-white/75">{p.careerNotes}</div>}
        />
      )}

      {/* Mini pipeline summary */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <div className="mb-2 text-[10px] uppercase tracking-wider text-white/55">
          Application pipeline
        </div>
        <PipelineBar applications={applications} />
      </div>

      {latestSession && (
        <Mini
          icon={Clock}
          label="Latest session"
          body={
            <div className="text-xs">
              <div className="text-white/75">
                {formatDate(latestSession.date)} · with {latestSession.counsellor}{" "}
                <span className="text-white/45">
                  ({latestSession.durationMin} min)
                </span>
              </div>
              {latestSession.notes && (
                <div className="mt-1 line-clamp-2 italic text-white/65">
                  "{latestSession.notes}"
                </div>
              )}
            </div>
          }
        />
      )}
    </div>
  );
}

function Mini({ icon: Icon, label, body }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/55">
        <Icon size={10} /> {label}
      </div>
      <div>{body}</div>
    </div>
  );
}

function PipelineBar({ applications }) {
  const counts = {};
  for (const s of ["Planning", "Applied", "Admitted", "Waitlisted", "Rejected", "Enrolled"]) {
    counts[s] = 0;
  }
  for (const a of applications) counts[a.status] = (counts[a.status] || 0) + 1;
  return (
    <div className="grid grid-cols-6 gap-1">
      {Object.entries(counts).map(([s, n]) => {
        const I = STATUS_ICONS[s] || Compass;
        return (
          <div
            key={s}
            className={`rounded-lg p-2 text-center text-[10px] ring-1 ${STATUS_TONES[s]}`}
          >
            <I size={11} className="mx-auto" />
            <div className="mt-0.5 font-display text-base font-bold">{n}</div>
            <div className="text-[9px] opacity-80">{s}</div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Applications panel ----------

function ApplicationsPanel({ applications, canEdit, onAdd, onChanged }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-white/55">
          {applications.length} application{applications.length === 1 ? "" : "s"}{" "}
          on file
        </div>
        {canEdit && (
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
          >
            <Plus size={12} /> Add application
          </button>
        )}
      </div>
      {applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-white/45">
          No applications tracked yet.
        </div>
      ) : (
        <div className="space-y-2">
          {applications.map((a) => (
            <ApplicationRow
              key={a.id}
              app={a}
              canEdit={canEdit}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationRow({ app, canEdit, onChanged }) {
  const a = app;
  const Icon = STATUS_ICONS[a.status] || Compass;
  const isAbroad = a.country && a.country !== "India";
  const [busy, setBusy] = useState(false);

  async function transition(newStatus) {
    setBusy(true);
    try {
      await endpoints.careerAppUpdate(a.id, { status: newStatus });
      onChanged?.();
    } catch (e) {
      alert(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!confirm("Delete this application record?")) return;
    setBusy(true);
    try {
      await endpoints.careerAppDelete(a.id);
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  // Valid next states from current
  const transitions = {
    Planning: ["Applied"],
    Applied: ["Admitted", "Waitlisted", "Rejected"],
    Waitlisted: ["Admitted", "Rejected"],
    Admitted: ["Enrolled"],
    Rejected: [],
    Enrolled: [],
  };
  const nextOptions = transitions[a.status] || [];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ring-1 ${
                STATUS_TONES[a.status]
              }`}
            >
              <Icon size={9} />
              {a.status}
            </span>
            {isAbroad ? (
              <Plane size={11} className="text-brand-300" />
            ) : (
              <MapPinned size={11} className="text-amber-300" />
            )}
            <span className="text-[10px] text-white/55">{a.country}</span>
            <span className="text-[10px] font-mono text-white/45">{a.id}</span>
          </div>
          <div className="mt-1 font-display text-sm font-semibold">
            {a.college}
          </div>
          {a.program && (
            <div className="text-[11px] text-white/65">{a.program}</div>
          )}
          {a.notes && (
            <div className="mt-1 line-clamp-2 text-[11px] italic text-white/55">
              "{a.notes}"
            </div>
          )}
          <div className="mt-1 flex items-center gap-3 text-[10px] text-white/45">
            {a.appliedAt && (
              <span>Applied {formatDate(a.appliedAt)}</span>
            )}
            {a.decidedAt && (
              <span>Decided {formatDate(a.decidedAt)}</span>
            )}
            {a.feeAmount != null && (
              <span>
                Fee ₹{Number(a.feeAmount).toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>
        {canEdit && (nextOptions.length > 0 || true) && (
          <div className="flex flex-wrap gap-1">
            {nextOptions.map((next) => {
              const NextI = STATUS_ICONS[next] || Compass;
              return (
                <button
                  key={next}
                  disabled={busy}
                  onClick={() => transition(next)}
                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] ring-1 transition-colors disabled:opacity-50 ${STATUS_TONES[next]} hover:brightness-110`}
                >
                  <NextI size={9} />
                  {next}
                </button>
              );
            })}
            <button
              disabled={busy}
              onClick={del}
              className="rounded-lg p-1 text-white/40 hover:bg-rose-500/15 hover:text-rose-200 disabled:opacity-50"
              title="Delete record"
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Sessions panel ----------

function SessionsPanel({ sessions, canEdit, onAdd, onChanged }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-white/55">
          {sessions.length} session{sessions.length === 1 ? "" : "s"} logged
        </div>
        {canEdit && (
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
          >
            <Plus size={12} /> Log session
          </button>
        )}
      </div>
      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-white/45">
          No counselling sessions logged yet.
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <SessionRow
              key={s.id}
              session={s}
              canEdit={canEdit}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionRow({ session, canEdit, onChanged }) {
  const s = session;
  const [busy, setBusy] = useState(false);

  async function del() {
    if (!confirm("Delete this session record?")) return;
    setBusy(true);
    try {
      await endpoints.careerSessionDelete(s.id);
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] text-white/55">
            <Clock size={11} />
            {formatDate(s.date)}
            <span>·</span>
            <span>{s.counsellor}</span>
            <span>·</span>
            <span>{s.durationMin} min</span>
            {s.followUp && (
              <span className="rounded-full bg-amber-500/15 px-1.5 py-0 text-[9px] text-amber-200 ring-1 ring-amber-400/30">
                Follow-up: {formatDate(s.followUp)}
              </span>
            )}
          </div>
          {(s.topics || []).length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {s.topics.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-brand-500/15 px-2 py-0.5 text-[10px] text-brand-300 ring-1 ring-brand-400/30"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          {s.notes && (
            <div className="mt-2 whitespace-pre-wrap text-xs text-white/85">
              {s.notes}
            </div>
          )}
          {(s.actionItems || []).length > 0 && (
            <div className="mt-2">
              <div className="text-[9px] uppercase tracking-wider text-white/55">
                Action items
              </div>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[11px] text-white/75">
                {s.actionItems.map((ai) => (
                  <li key={ai}>{ai}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {canEdit && (
          <button
            disabled={busy}
            onClick={del}
            className="rounded p-1 text-white/40 hover:bg-rose-500/15 hover:text-rose-200 disabled:opacity-50"
            title="Delete session"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- Edit Profile Modal ----------

function EditProfileModal({
  profile,
  tracks,
  streams,
  countries,
  exams,
  counsellors,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState({
    track: profile.track,
    stream: profile.stream,
    counsellor: profile.counsellor,
    targetCountries: profile.targetCountries || [],
    examsPlanned: profile.examsPlanned || [],
    dreamColleges: (profile.dreamColleges || []).join(", "),
    strengths: (profile.strengths || []).join("\n"),
    careerNotes: profile.careerNotes || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  function toggle(key, item) {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(item)
        ? f[key].filter((x) => x !== item)
        : [...f[key], item],
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    try {
      await endpoints.careerProfileUpdate(profile.studentId, {
        track: form.track,
        stream: form.stream,
        counsellor: form.counsellor,
        targetCountries: form.targetCountries,
        examsPlanned: form.examsPlanned,
        dreamColleges: form.dreamColleges
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        strengths: form.strengths
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        careerNotes: form.careerNotes || null,
      });
      onSaved();
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
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0a0a1f] p-5 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="font-display text-base font-semibold">
            Edit career profile · {profile.studentName}
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
          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Track
              </div>
              <select
                value={form.track}
                onChange={(e) => set("track", e.target.value)}
                className={input}
              >
                {tracks.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Stream
              </div>
              <select
                value={form.stream}
                onChange={(e) => set("stream", e.target.value)}
                className={input}
              >
                {streams.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Counsellor
              </div>
              <select
                value={form.counsellor}
                onChange={(e) => set("counsellor", e.target.value)}
                className={input}
              >
                {counsellors.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Target countries
            </div>
            <div className="flex flex-wrap gap-1.5">
              {countries.map((c) => {
                const on = form.targetCountries.includes(c);
                return (
                  <button
                    type="button"
                    key={c}
                    onClick={() => toggle("targetCountries", c)}
                    className={`rounded-full px-2.5 py-1 text-xs ring-1 transition-colors ${
                      on
                        ? "bg-brand-500/20 text-brand-200 ring-brand-400/30"
                        : "bg-white/5 text-white/60 ring-white/10 hover:bg-white/10"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Planned exams
            </div>
            <div className="flex flex-wrap gap-1.5">
              {exams.map((e) => {
                const on = form.examsPlanned.includes(e);
                return (
                  <button
                    type="button"
                    key={e}
                    onClick={() => toggle("examsPlanned", e)}
                    className={`rounded-full px-2.5 py-1 text-xs ring-1 transition-colors ${
                      on
                        ? "bg-accent-violet/20 text-purple-200 ring-accent-violet/30"
                        : "bg-white/5 text-white/60 ring-white/10 hover:bg-white/10"
                    }`}
                  >
                    {e}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Dream colleges (comma-separated)
            </div>
            <textarea
              rows={2}
              value={form.dreamColleges}
              onChange={(e) => set("dreamColleges", e.target.value)}
              className={`${input} resize-y`}
              placeholder="e.g. IIT Bombay, MIT, Ashoka University"
            />
          </label>

          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Strengths (one per line)
            </div>
            <textarea
              rows={3}
              value={form.strengths}
              onChange={(e) => set("strengths", e.target.value)}
              className={`${input} resize-y`}
            />
          </label>

          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Counsellor notes
            </div>
            <textarea
              rows={3}
              value={form.careerNotes}
              onChange={(e) => set("careerNotes", e.target.value)}
              className={`${input} resize-y`}
              placeholder="Long-form context that all counsellors should see…"
            />
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
            {submitting ? "Saving…" : "Save profile"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

// ---------- Add Session Modal ----------

function AddSessionModal({
  studentId,
  counsellors,
  defaultCounsellor,
  onClose,
  onAdded,
}) {
  const [form, setForm] = useState({
    counsellor: defaultCounsellor || counsellors[0] || "Counsellor",
    date: new Date().toISOString().slice(0, 16),
    durationMin: 30,
    topics: "",
    notes: "",
    actionItems: "",
    followUp: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    try {
      await endpoints.careerSessionAdd({
        studentId,
        counsellor: form.counsellor,
        date: new Date(form.date).toISOString(),
        durationMin: Number(form.durationMin),
        topics: form.topics.split(",").map((t) => t.trim()).filter(Boolean),
        notes: form.notes || null,
        actionItems: form.actionItems
          .split("\n")
          .map((t) => t.trim())
          .filter(Boolean),
        followUp: form.followUp
          ? new Date(form.followUp).toISOString()
          : null,
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
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0a0a1f] p-5 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="font-display text-base font-semibold">
            Log counselling session
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
          <div className="grid grid-cols-3 gap-3">
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
                Duration (min)
              </div>
              <input
                type="number"
                min="5"
                step="5"
                value={form.durationMin}
                onChange={(e) => set("durationMin", e.target.value)}
                className={input}
              />
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Counsellor
              </div>
              <select
                value={form.counsellor}
                onChange={(e) => set("counsellor", e.target.value)}
                className={input}
              >
                {counsellors.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Topics (comma-separated)
            </div>
            <input
              value={form.topics}
              onChange={(e) => set("topics", e.target.value)}
              className={input}
              placeholder="e.g. SAT prep, College shortlist"
            />
          </label>

          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Session notes
            </div>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className={`${input} resize-y`}
            />
          </label>

          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Action items (one per line)
            </div>
            <textarea
              rows={2}
              value={form.actionItems}
              onChange={(e) => set("actionItems", e.target.value)}
              className={`${input} resize-y`}
            />
          </label>

          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Follow-up (optional)
            </div>
            <input
              type="date"
              value={form.followUp}
              onChange={(e) => set("followUp", e.target.value)}
              className={input}
            />
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
            {submitting ? "Saving…" : "Log session"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

// ---------- Add Application Modal ----------

function AddApplicationModal({
  studentId,
  indianColleges,
  abroadColleges,
  countries,
  onClose,
  onAdded,
}) {
  const [form, setForm] = useState({
    college: "",
    country: "India",
    program: "",
    status: "Planning",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const suggestions = form.country === "India" ? indianColleges : abroadColleges;

  async function submit(e) {
    e.preventDefault();
    if (!form.college.trim()) {
      setErr("College required");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      await endpoints.careerAppAdd({
        studentId,
        college: form.college.trim(),
        country: form.country,
        program: form.program || null,
        status: form.status,
        notes: form.notes || null,
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
            Add college application
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
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Country
              </div>
              <select
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
                className={input}
              >
                {countries.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
                Initial status
              </div>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                className={input}
              >
                <option>Planning</option>
                <option>Applied</option>
              </select>
            </label>
          </div>
          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              College
            </div>
            <input
              list="college-suggestions"
              value={form.college}
              onChange={(e) => set("college", e.target.value)}
              className={input}
              placeholder="Type or pick a college…"
              required
            />
            <datalist id="college-suggestions">
              {suggestions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Program / course
            </div>
            <input
              value={form.program}
              onChange={(e) => set("program", e.target.value)}
              className={input}
              placeholder="e.g. B.Tech · Computer Science"
            />
          </label>
          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/55">
              Notes (optional)
            </div>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className={`${input} resize-y`}
            />
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
            {submitting ? "Adding…" : "Add application"}
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
