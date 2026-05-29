import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Printer, ArrowLeft, Sparkles as SparklesIcon } from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";

export default function HallTicketPrint() {
  const { examId, studentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    endpoints
      .hallTicket(examId, studentId)
      .then((res) => !cancelled && setData(res))
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [examId, studentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06061a] px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl space-y-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-[500px]" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#06061a] px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl">
          <ErrorState error={error || new Error("Hall ticket not found")} />
          <button onClick={() => navigate(-1)} className="btn-ghost mt-4 inline-flex items-center gap-2">
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      </div>
    );
  }

  const { exam, student, papers, school, instructions } = data;
  const fmtDate = (d) =>
    new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#06061a] via-[#0a0a22] to-[#0d0d2e] py-10 print:bg-white print:py-0">
      <PrintStyles />

      <div className="mx-auto mb-6 flex max-w-[820px] items-center justify-between px-6 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 hover:bg-white/10"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <button onClick={() => window.print()} className="btn-primary px-3 py-2 text-sm">
          <Printer size={14} /> Print / Save PDF
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="ht-canvas mx-auto"
      >
        <div className="ht-frame">
          <div className="ht-header">
            <div className="ht-orb" aria-hidden>
              <SparklesIcon size={26} strokeWidth={2.2} />
            </div>
            <div>
              <div className="ht-school-name">{school.name}</div>
              <div className="ht-school-meta">{school.address}</div>
              <div className="ht-school-meta">{school.phone} · {school.email}</div>
              <div className="ht-school-affil">{school.affiliation}</div>
            </div>
            <div className="ht-corner">
              <div className="ht-corner-label">Hall ticket</div>
              <div className="ht-corner-value">{data.ticketNo}</div>
            </div>
          </div>

          <div className="ht-title-row">
            <div className="ht-badge">HALL TICKET</div>
            <div className="ht-exam-name">{exam.name}</div>
          </div>

          <div className="ht-meta">
            <Meta label="Candidate" value={student.name} />
            <Meta label="Roll no." value={data.rollNo} mono />
            <Meta label="Class" value={`${student.grade} – ${student.section}`} />
            <Meta label="Seat no." value={data.seatNo} mono />
            <Meta label="Exam type" value={exam.type} />
            <Meta label="Window" value={`${fmtDate(exam.startDate)} – ${fmtDate(exam.endDate)}`} />
          </div>

          <div className="ht-section">
            <div className="ht-section-title">Examination schedule</div>
            <table className="ht-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Subject</th>
                  <th>Timing</th>
                  <th>Room</th>
                  <th className="text-right">Max</th>
                </tr>
              </thead>
              <tbody>
                {papers.map((p) => (
                  <tr key={p.subject}>
                    <td className="mono">{fmtDate(p.date)}</td>
                    <td>{p.day}</td>
                    <td><strong>{p.subject}</strong></td>
                    <td className="mono">{p.startTime}–{p.endTime}</td>
                    <td>{p.room}</td>
                    <td className="text-right mono">{p.maxMarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ht-section">
            <div className="ht-section-title">Instructions</div>
            <ol className="ht-instructions">
              {instructions.map((i, idx) => (
                <li key={idx}>{i}</li>
              ))}
            </ol>
          </div>

          <div className="ht-footer">
            <div className="ht-sig-block">
              <div className="ht-sig-line" />
              <div className="ht-sig-label">Candidate signature</div>
            </div>
            <div className="ht-sig-block">
              <div className="ht-sig-line" />
              <div className="ht-sig-label">Controller of Examinations</div>
            </div>
          </div>

          <div className="ht-foot-note">
            System-generated hall ticket · issued {fmtDate(data.generatedAt)}. Valid only with a school ID card.
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Meta({ label, value, mono }) {
  return (
    <div>
      <div className="ht-meta-label">{label}</div>
      <div className={`ht-meta-value ${mono ? "mono" : ""}`}>{value}</div>
    </div>
  );
}

function PrintStyles() {
  return (
    <style>{`
      .ht-canvas {
        position: relative;
        width: min(820px, calc(100% - 32px));
        background: #ffffff;
        color: #0a0a1e;
        border-radius: 16px;
        box-shadow: 0 30px 80px rgba(91,129,255,0.25), 0 0 0 1px rgba(255,255,255,0.08);
        overflow: hidden;
      }
      .ht-frame {
        position: relative;
        padding: 36px 44px 28px;
        background:
          linear-gradient(135deg, rgba(91,129,255,0.04), rgba(155,92,255,0.03)),
          repeating-linear-gradient(45deg, rgba(91,129,255,0.02) 0 2px, transparent 2px 14px);
        border: 1px solid rgba(91,129,255,0.18);
        border-radius: 16px;
      }
      .ht-frame::before {
        content: "";
        position: absolute;
        inset: 12px;
        border: 1px solid rgba(91,129,255,0.22);
        border-radius: 10px;
        pointer-events: none;
      }
      .ht-header {
        display: grid;
        grid-template-columns: 70px 1fr 170px;
        gap: 12px;
        align-items: center;
        padding-bottom: 14px;
        border-bottom: 1.5px solid rgba(91,129,255,0.25);
        margin-bottom: 18px;
      }
      .ht-orb {
        width: 60px; height: 60px;
        display: grid; place-items: center;
        border-radius: 50%;
        color: #fff;
        background:
          radial-gradient(120% 80% at 20% 20%, rgba(255,255,255,0.5), transparent 60%),
          linear-gradient(135deg, #3853e0, #9b5cff 55%, #ff5ec4);
        box-shadow: 0 10px 22px rgba(91,129,255,0.45);
      }
      .ht-school-name {
        font-family: "Sora", system-ui, sans-serif;
        font-weight: 800;
        font-size: 24px;
        background: linear-gradient(120deg, #3853e0, #9b5cff, #ff5ec4);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        line-height: 1.1;
      }
      .ht-school-meta { font-size: 11px; color: #44485e; margin-top: 4px; }
      .ht-school-affil { font-size: 10px; color: #6e7299; margin-top: 2px; }
      .ht-corner {
        text-align: right;
        padding: 10px 12px;
        background: linear-gradient(135deg, rgba(255,209,102,0.12), rgba(255,94,196,0.10));
        border: 1px dashed rgba(255,94,196,0.4);
        border-radius: 10px;
      }
      .ht-corner-label {
        font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; color: #6e7299;
      }
      .ht-corner-value {
        font-family: "JetBrains Mono", monospace; font-weight: 700; font-size: 11px;
        color: #b35a8a; margin-top: 2px; word-break: break-all;
      }
      .ht-title-row {
        display: flex; align-items: center; justify-content: space-between; gap: 12px;
        margin-bottom: 16px;
      }
      .ht-badge {
        display: inline-block; padding: 6px 14px;
        font-family: "Sora", system-ui, sans-serif; font-weight: 700; font-size: 13px;
        letter-spacing: 0.4em;
        background: linear-gradient(120deg, #3853e0, #ff5ec4); color: #fff;
        border-radius: 999px; box-shadow: 0 6px 16px rgba(91,129,255,0.35);
      }
      .ht-exam-name {
        font-family: "Sora", system-ui, sans-serif; font-weight: 700; font-size: 15px; color: #2a2d4a;
      }
      .ht-meta {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;
        padding: 12px 14px; background: rgba(91,129,255,0.05);
        border-radius: 10px; border-left: 3px solid #5b81ff; margin-bottom: 16px;
      }
      .ht-meta-label { font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; color: #6e7299; }
      .ht-meta-value {
        font-family: "Sora", system-ui, sans-serif; font-weight: 700; font-size: 13px;
        color: #0a0a1e; margin-top: 2px;
      }
      .mono { font-family: "JetBrains Mono", monospace; font-size: 12px; }
      .ht-section { margin-bottom: 14px; }
      .ht-section-title {
        font-size: 9px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase;
        color: #6e7299; margin-bottom: 6px;
      }
      .ht-table { width: 100%; border-collapse: collapse; font-size: 13px; }
      .ht-table th, .ht-table td { padding: 8px 12px; text-align: left; }
      .ht-table thead th {
        background: rgba(91,129,255,0.08); font-size: 10px; font-weight: 700;
        letter-spacing: 0.18em; text-transform: uppercase; color: #44485e;
        border-bottom: 1px solid rgba(91,129,255,0.2);
      }
      .ht-table tbody tr:nth-child(odd) td { background: rgba(91,129,255,0.03); }
      .text-right { text-align: right; }
      .ht-instructions {
        margin: 0; padding-left: 18px; font-size: 12px; color: #2a2d4a; line-height: 1.7;
      }
      .ht-footer {
        margin-top: 36px; display: grid; grid-template-columns: 1fr 1fr; align-items: end; gap: 40px;
      }
      .ht-sig-block { text-align: center; }
      .ht-sig-line {
        height: 1.5px;
        background: linear-gradient(to right, transparent, #2a2d4a 20%, #2a2d4a 80%, transparent);
        margin-bottom: 4px;
      }
      .ht-sig-label { font-size: 11px; font-weight: 700; color: #2a2d4a; }
      .ht-foot-note { margin-top: 16px; text-align: center; font-size: 9px; color: #6e7299; }
      @media print {
        @page { size: A4; margin: 14mm; }
        body { background: white !important; }
        .ht-canvas { box-shadow: none !important; width: 100% !important; border-radius: 0 !important; }
        .ht-frame { border-radius: 0; }
      }
    `}</style>
  );
}
