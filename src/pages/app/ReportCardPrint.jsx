import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Printer,
  ArrowLeft,
  Sparkles as SparklesIcon,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  ShieldAlert,
  CalendarCheck,
  BookOpen,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";

export default function ReportCardPrint() {
  const { id } = useParams();
  const [search, setSearch] = useSearchParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const examId = search.get("examId") || undefined;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    endpoints
      .studentReportCard(id, { examId })
      .then((res) => !cancelled && setData(res))
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, examId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06061a] px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl space-y-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-[700px]" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#06061a] px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl">
          <ErrorState error={error || new Error("Report card not found")} />
          <button
            onClick={() => navigate(-1)}
            className="btn-ghost mt-4 inline-flex items-center gap-2"
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      </div>
    );
  }

  const { school, student, exam, attendance, discipline, achievements, remarks, period, availableExams, generatedAt } = data;
  const grade = exam?.grade || "—";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#06061a] via-[#0a0a22] to-[#0d0d2e] py-10 print:bg-white print:py-0">
      <PrintStyles />

      {/* Toolbar — hidden on print */}
      <div className="mx-auto mb-6 flex max-w-[820px] flex-wrap items-center justify-between gap-3 px-6 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 hover:bg-white/10"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {availableExams && availableExams.length > 0 && (
            <select
              value={exam?.id || ""}
              onChange={(e) => {
                const next = new URLSearchParams(search);
                if (e.target.value) next.set("examId", e.target.value);
                else next.delete("examId");
                setSearch(next);
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
            >
              {availableExams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} · {e.status}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-violet px-4 py-2 text-sm font-semibold text-white shadow shadow-brand-500/20"
          >
            <Printer size={14} /> Print / save as PDF
          </button>
        </div>
      </div>

      {/* The actual report card canvas */}
      <div className="mx-auto flex justify-center">
        <div className="rc-canvas">
          <div className="rc-frame">
            {/* Header */}
            <header className="rc-header">
              <div className="rc-crest">
                <BookOpen size={28} />
              </div>
              <div className="rc-school">
                <div className="rc-title">{school.name}</div>
                <div className="rc-tagline">{school.tagline}</div>
                <div className="rc-meta-line">
                  {school.address} · {school.phone}
                </div>
                <div className="rc-meta-line">{school.affiliation}</div>
              </div>
              <div className="rc-stamp">
                <div>Report Card</div>
                <div className="rc-stamp-small">Grade {grade}</div>
              </div>
            </header>

            {/* Student block */}
            <section className="rc-student">
              <div className="rc-avatar">{student.avatar}</div>
              <div className="rc-student-info">
                <div className="rc-student-name">{student.name}</div>
                <div className="rc-student-meta">
                  <span>
                    <strong>Student ID:</strong> {student.id}
                  </span>
                  <span>
                    <strong>Class:</strong> Grade {student.grade}-{student.section}
                  </span>
                  {student.house && (
                    <span>
                      <strong>House:</strong> {student.house}
                    </span>
                  )}
                  {student.rollNo && (
                    <span>
                      <strong>Roll:</strong> {student.rollNo}
                    </span>
                  )}
                </div>
              </div>
              <div className="rc-period">
                <div className="rc-period-label">Period</div>
                <div className="rc-period-value">
                  {period.from} → {period.to}
                </div>
              </div>
            </section>

            {/* Marks */}
            {exam ? (
              <section className="rc-section">
                <h3 className="rc-section-title">
                  <BookOpen size={14} /> Academic performance · {exam.name}
                </h3>
                <table className="rc-table">
                  <thead>
                    <tr>
                      <th style={{ width: "44%" }}>Subject</th>
                      <th>Marks</th>
                      <th>Out of</th>
                      <th>%</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exam.subjects.map((s) => {
                      const pct =
                        s.marks !== null && s.max
                          ? Math.round((s.marks / s.max) * 100)
                          : null;
                      return (
                        <tr key={s.subject}>
                          <td>{s.subject}</td>
                          <td>{s.marks ?? "—"}</td>
                          <td>{s.max}</td>
                          <td>{pct === null ? "—" : `${pct}%`}</td>
                          <td className="rc-grade">{s.grade || "—"}</td>
                        </tr>
                      );
                    })}
                    <tr className="rc-total">
                      <td>
                        <strong>Total</strong>
                      </td>
                      <td>
                        <strong>{exam.total}</strong>
                      </td>
                      <td>
                        <strong>{exam.max}</strong>
                      </td>
                      <td>
                        <strong>{exam.pct === null ? "—" : `${exam.pct}%`}</strong>
                      </td>
                      <td className="rc-grade">
                        <strong>{exam.grade || "—"}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="rc-exam-meta">
                  Exam type: {exam.type} · Status: {exam.status} · Dates:{" "}
                  {exam.startDate} → {exam.endDate}
                  {exam.rank != null && (
                    <> · Class rank: <strong>{exam.rank}</strong> of {exam.classSize}</>
                  )}
                </div>
              </section>
            ) : (
              <section className="rc-section">
                <div className="rc-empty">
                  No exam selected — pick one from the toolbar above.
                </div>
              </section>
            )}

            {/* Two-up: Attendance & Discipline */}
            <section className="rc-grid-2">
              <div className="rc-card">
                <h3 className="rc-section-title">
                  <CalendarCheck size={14} /> Attendance
                </h3>
                {attendance.total > 0 ? (
                  <>
                    <div className="rc-big-stat">
                      <div className="rc-big-stat-num">
                        {attendance.presentPct}%
                      </div>
                      <div className="rc-big-stat-label">present</div>
                    </div>
                    <div className="rc-stat-row">
                      <Stat label="Days" value={attendance.total} />
                      <Stat label="Present" value={attendance.tally.Present || 0} />
                      <Stat label="Late" value={attendance.tally.Late || 0} />
                      <Stat label="Absent" value={attendance.tally.Absent || 0} />
                    </div>
                  </>
                ) : (
                  <div className="rc-empty">
                    No attendance records in this window.
                  </div>
                )}
              </div>

              <div className="rc-card">
                <h3 className="rc-section-title">
                  <ShieldAlert size={14} /> Conduct
                </h3>
                {discipline.total === 0 ? (
                  <div className="rc-clean">
                    <CheckCircle2 size={18} /> Clean record — no incidents.
                  </div>
                ) : (
                  <>
                    <div className="rc-stat-row">
                      <Stat label="Incidents" value={discipline.total} />
                      <Stat
                        label="Demerits"
                        value={discipline.demerits}
                        tone={discipline.demerits > 0 ? "warn" : ""}
                      />
                    </div>
                    <ul className="rc-list">
                      {discipline.items.slice(0, 4).map((i) => (
                        <li key={i.id}>
                          <span className={`rc-pill rc-pill-${i.severity?.toLowerCase()}`}>
                            {i.severity}
                          </span>
                          <span className="rc-list-main">
                            {i.category} — {i.description}
                          </span>
                          <span className="rc-list-date">{i.reportedOn}</span>
                        </li>
                      ))}
                      {discipline.items.length > 4 && (
                        <li className="rc-list-more">
                          +{discipline.items.length - 4} more incidents
                        </li>
                      )}
                    </ul>
                  </>
                )}
              </div>
            </section>

            {/* Achievements */}
            <section className="rc-section">
              <h3 className="rc-section-title">
                <Trophy size={14} /> Co-curricular highlights
              </h3>
              {achievements.total === 0 ? (
                <div className="rc-empty">
                  No co-curricular activities recorded in this window.
                </div>
              ) : (
                <ul className="rc-list">
                  {achievements.items.slice(0, 6).map((a) => (
                    <li key={a.id}>
                      <span className="rc-pill rc-pill-info">{a.level}</span>
                      <span className="rc-list-main">
                        <strong>{a.title}</strong> · {a.category}
                        {a.position && ` · ${a.position}`}
                      </span>
                      <span className="rc-list-date">{a.date}</span>
                    </li>
                  ))}
                  {achievements.items.length > 6 && (
                    <li className="rc-list-more">
                      +{achievements.items.length - 6} more awards
                    </li>
                  )}
                </ul>
              )}
              {achievements.total > 0 && (
                <div className="rc-exam-meta">
                  Total recognition points: <strong>{achievements.points}</strong>
                </div>
              )}
            </section>

            {/* Remarks */}
            {remarks && remarks.length > 0 && (
              <section className="rc-remarks">
                <h3 className="rc-section-title">
                  <SparklesIcon size={14} /> Class teacher's remarks
                </h3>
                <ul>
                  {remarks.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Footer */}
            <footer className="rc-footer">
              <div className="rc-sig">
                <div className="rc-sig-line" />
                <div className="rc-sig-label">Class Teacher</div>
              </div>
              <div className="rc-sig">
                <div className="rc-sig-line" />
                <div className="rc-sig-label">Parent / Guardian</div>
              </div>
              <div className="rc-sig">
                <div className="rc-sig-line" />
                <div className="rc-sig-label">{school.principal}, Principal</div>
              </div>
            </footer>

            <div className="rc-footnote">
              Generated {new Date(generatedAt).toLocaleString()} · System of
              record: {school.name} · For queries:{" "}
              <span className="rc-mono">{school.email}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "" }) {
  return (
    <div className={`rc-stat rc-stat-${tone}`}>
      <div className="rc-stat-num">{value}</div>
      <div className="rc-stat-label">{label}</div>
    </div>
  );
}

function PrintStyles() {
  return (
    <style>{`
      .rc-canvas {
        position: relative;
        width: min(820px, calc(100% - 32px));
        background: #ffffff;
        color: #0a0a1e;
        border-radius: 16px;
        box-shadow: 0 30px 80px rgba(91,129,255,0.25), 0 0 0 1px rgba(255,255,255,0.08);
        overflow: hidden;
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      }
      .rc-frame {
        position: relative;
        padding: 32px 40px 24px;
        background:
          linear-gradient(135deg, rgba(91,129,255,0.04), rgba(155,92,255,0.03));
        border: 1px solid rgba(91,129,255,0.18);
        border-radius: 16px;
      }
      .rc-frame::before {
        content: "";
        position: absolute;
        inset: 12px;
        border: 1px solid rgba(91,129,255,0.22);
        border-radius: 10px;
        pointer-events: none;
      }

      .rc-header {
        display: grid;
        grid-template-columns: 60px 1fr 130px;
        gap: 14px;
        align-items: center;
        padding-bottom: 14px;
        border-bottom: 1.5px solid rgba(91,129,255,0.25);
        margin-bottom: 16px;
        position: relative;
        z-index: 1;
      }
      .rc-crest {
        width: 56px; height: 56px;
        border-radius: 14px;
        background: linear-gradient(135deg, #5b81ff, #9b5cff);
        color: #fff;
        display: grid; place-items: center;
      }
      .rc-school .rc-title {
        font-size: 20px; font-weight: 800; letter-spacing: -0.02em;
        background: linear-gradient(135deg, #5b81ff, #9b5cff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .rc-school .rc-tagline { font-size: 11px; color: #5b5b7b; margin-top: 1px; }
      .rc-school .rc-meta-line { font-size: 10px; color: #5b5b7b; margin-top: 2px; }
      .rc-stamp {
        text-align: center;
        border: 1.5px dashed rgba(91,129,255,0.45);
        border-radius: 10px;
        padding: 8px 6px;
        font-weight: 700;
        font-size: 13px;
        color: #5b81ff;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .rc-stamp-small {
        font-size: 9px; color: #6b6b85; margin-top: 2px;
        letter-spacing: 0.06em;
      }

      .rc-student {
        display: grid;
        grid-template-columns: 56px 1fr 180px;
        gap: 12px;
        align-items: center;
        background: rgba(91,129,255,0.05);
        border: 1px solid rgba(91,129,255,0.18);
        border-radius: 10px;
        padding: 12px 14px;
        margin-bottom: 14px;
      }
      .rc-avatar {
        width: 48px; height: 48px; border-radius: 12px;
        display: grid; place-items: center;
        background: linear-gradient(135deg, #ff7ab8, #9b5cff);
        color: #fff; font-weight: 800; font-size: 14px;
      }
      .rc-student-name { font-size: 17px; font-weight: 700; }
      .rc-student-meta {
        font-size: 11px; color: #4b4b65;
        display: flex; flex-wrap: wrap; gap: 12px;
        margin-top: 2px;
      }
      .rc-student-meta strong { color: #1f1f3a; font-weight: 600; }
      .rc-period {
        text-align: right;
        background: #fff;
        border: 1px solid rgba(91,129,255,0.2);
        border-radius: 8px;
        padding: 6px 10px;
      }
      .rc-period-label {
        font-size: 9px; color: #6b6b85;
        text-transform: uppercase; letter-spacing: 0.08em;
      }
      .rc-period-value { font-size: 11px; font-weight: 600; }

      .rc-section { margin-bottom: 14px; position: relative; z-index: 1; }
      .rc-section-title {
        display: flex; align-items: center; gap: 6px;
        font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;
        color: #5b81ff; font-weight: 700; margin-bottom: 8px;
      }
      .rc-empty {
        font-size: 11px; color: #6b6b85; font-style: italic;
        padding: 8px 10px;
        background: rgba(0,0,0,0.02);
        border-radius: 6px;
      }
      .rc-clean {
        display: flex; align-items: center; gap: 6px;
        font-size: 12px; color: #1f8a4c;
        background: rgba(31,138,76,0.08);
        border: 1px solid rgba(31,138,76,0.2);
        border-radius: 8px;
        padding: 8px 10px;
      }

      .rc-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }
      .rc-table th {
        text-align: left;
        background: rgba(91,129,255,0.08);
        border-bottom: 1.5px solid rgba(91,129,255,0.3);
        font-weight: 700;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        padding: 8px 10px;
        color: #1f1f3a;
      }
      .rc-table td {
        padding: 7px 10px;
        border-bottom: 1px solid rgba(91,129,255,0.1);
      }
      .rc-table .rc-grade { font-weight: 700; color: #5b81ff; }
      .rc-table tr.rc-total td {
        background: rgba(91,129,255,0.06);
        border-bottom: none;
      }
      .rc-exam-meta {
        font-size: 10px; color: #6b6b85; margin-top: 6px;
      }

      .rc-grid-2 {
        display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
        margin-bottom: 14px;
      }
      .rc-card {
        background: #fff;
        border: 1px solid rgba(91,129,255,0.2);
        border-radius: 10px;
        padding: 12px 14px;
        position: relative;
        z-index: 1;
      }

      .rc-big-stat { display: flex; align-items: baseline; gap: 6px; margin-bottom: 6px; }
      .rc-big-stat-num {
        font-size: 28px; font-weight: 800;
        background: linear-gradient(135deg, #5b81ff, #9b5cff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .rc-big-stat-label {
        font-size: 11px; color: #6b6b85; text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .rc-stat-row {
        display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;
      }
      .rc-stat {
        background: rgba(91,129,255,0.05);
        border-radius: 6px;
        padding: 6px;
        text-align: center;
      }
      .rc-stat-warn { background: rgba(229,93,93,0.08); }
      .rc-stat-num { font-size: 14px; font-weight: 700; }
      .rc-stat-label {
        font-size: 9px; color: #6b6b85;
        text-transform: uppercase; letter-spacing: 0.04em;
      }

      .rc-list {
        list-style: none; padding: 0; margin: 6px 0 0;
        font-size: 11px;
      }
      .rc-list li {
        display: flex; align-items: center; gap: 8px;
        padding: 6px 0; border-bottom: 1px dashed rgba(91,129,255,0.12);
      }
      .rc-list li:last-child { border-bottom: none; }
      .rc-list .rc-list-main { flex: 1; min-width: 0; }
      .rc-list .rc-list-date { color: #6b6b85; font-size: 10px; }
      .rc-list .rc-list-more {
        font-style: italic; color: #6b6b85; justify-content: center;
      }

      .rc-pill {
        display: inline-block;
        padding: 1px 6px;
        border-radius: 4px;
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-weight: 700;
      }
      .rc-pill-minor { background: rgba(91,129,255,0.12); color: #5b81ff; }
      .rc-pill-moderate { background: rgba(245,158,11,0.18); color: #b3680b; }
      .rc-pill-major { background: rgba(229,93,93,0.15); color: #c8324d; }
      .rc-pill-info { background: rgba(31,138,76,0.12); color: #1f8a4c; }

      .rc-remarks {
        background: #fff;
        border: 1px solid rgba(91,129,255,0.2);
        border-radius: 10px;
        padding: 12px 14px;
        margin-bottom: 16px;
        position: relative;
        z-index: 1;
      }
      .rc-remarks ul { list-style: disc; padding-left: 18px; margin: 6px 0 0; font-size: 11px; color: #2b2b48; }
      .rc-remarks li { padding: 2px 0; }

      .rc-footer {
        display: grid; grid-template-columns: 1fr 1fr 1fr;
        gap: 18px;
        margin-top: 26px;
      }
      .rc-sig { text-align: center; }
      .rc-sig-line {
        height: 1.5px;
        background: linear-gradient(90deg, transparent, #1f1f3a, transparent);
        margin-bottom: 4px;
      }
      .rc-sig-label {
        font-size: 10px; color: #4b4b65;
        text-transform: uppercase; letter-spacing: 0.06em;
      }
      .rc-footnote {
        font-size: 9px; color: #8b8ba0; text-align: center;
        margin-top: 14px;
      }
      .rc-mono { font-family: ui-monospace, "SF Mono", monospace; }

      @media print {
        body { background: #fff !important; }
        .rc-canvas {
          box-shadow: none !important;
          border-radius: 0 !important;
          width: 100% !important;
          max-width: none !important;
        }
        .rc-frame { padding: 18px 24px !important; }
      }
    `}</style>
  );
}
