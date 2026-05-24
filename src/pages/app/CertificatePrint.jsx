import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Printer, ArrowLeft, Sparkles as SparklesIcon, ShieldCheck } from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";

// Each certificate type renders a slightly different layout. The shared print
// CSS at the bottom of the file collapses backgrounds/nav so the printed PDF
// looks clean.

export default function CertificatePrint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    endpoints
      .documentRender(id)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e) => {
        if (!cancelled) setError(e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06061a] px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl space-y-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-[600px]" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#06061a] px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl">
          <ErrorState error={error || new Error("Document not found")} />
          <button onClick={() => navigate(-1)} className="btn-ghost mt-4 inline-flex items-center gap-2">
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      </div>
    );
  }

  const { document: doc, student, school } = data;

  if (!student) {
    return (
      <div className="min-h-screen bg-[#06061a] px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl card">
          <div className="text-sm">
            Student record {doc.studentId} not found — cannot render certificate.
          </div>
        </div>
      </div>
    );
  }

  const isIssued = doc.status === "Issued";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#06061a] via-[#0a0a22] to-[#0d0d2e] py-10 print:bg-white print:py-0">
      <PrintStyles />

      {/* Action bar — hidden when printing */}
      <div className="mx-auto mb-6 flex max-w-[820px] items-center justify-between px-6 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 hover:bg-white/10"
        >
          <ArrowLeft size={14} /> Back to documents
        </button>
        <div className="flex items-center gap-2">
          {!isIssued && (
            <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200">
              Preview — not yet issued
            </div>
          )}
          <button
            onClick={() => window.print()}
            className="btn-primary px-3 py-2 text-sm"
          >
            <Printer size={14} /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Certificate canvas */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="cert-canvas mx-auto"
      >
        <div className="cert-frame">
          <SchoolHeader school={school} />
          {doc.type === "TC" && <TransferCertificate doc={doc} student={student} school={school} />}
          {doc.type === "BONAFIDE" && <BonafideCertificate doc={doc} student={student} school={school} />}
          {doc.type === "CHARACTER" && <CharacterCertificate doc={doc} student={student} school={school} />}
          {doc.type === "ID_CARD" && <IDCard doc={doc} student={student} school={school} />}
          {doc.type !== "ID_CARD" && (
            <CertificateFooter doc={doc} school={school} />
          )}
        </div>
        {!isIssued && (
          <div className="cert-watermark" aria-hidden>
            PREVIEW
          </div>
        )}
      </motion.div>
    </div>
  );
}

function SchoolHeader({ school }) {
  return (
    <div className="cert-header">
      <div className="cert-header-left">
        <div className="cert-orb-2d" aria-hidden>
          <SparklesIcon size={26} strokeWidth={2.2} />
        </div>
      </div>
      <div className="cert-header-center">
        <div className="cert-school-name">{school.name}</div>
        <div className="cert-school-tagline">{school.tagline}</div>
        <div className="cert-school-meta">
          {school.address} · {school.phone} · {school.email}
        </div>
        <div className="cert-school-affil">
          {school.affiliation} · Reg. {school.registrationNo}
        </div>
      </div>
      <div className="cert-header-right">
        <div className="cert-seal">
          <SparklesIcon size={18} />
          <div>Authentic</div>
        </div>
      </div>
    </div>
  );
}

function CertificateBadge({ children }) {
  return <div className="cert-badge">{children}</div>;
}

function TransferCertificate({ doc, student, school }) {
  const today = new Date().toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <div className="cert-body">
      <CertificateBadge>Transfer Certificate</CertificateBadge>
      <div className="cert-no">No. {doc.certificateNo || "—"}</div>
      <div className="cert-content">
        <p>
          This is to certify that <strong>{student.name}</strong>{" "}
          (Student ID: <code>{student.id}</code>) son/daughter of{" "}
          <strong>{student.parent || "—"}</strong> was a bonafide student of{" "}
          <strong>{school.name}</strong>, studying in{" "}
          <strong>
            Grade {student.grade} – Section {student.section}
          </strong>{" "}
          ({student.house} House).
        </p>
        <p>
          His/her overall conduct and behaviour during the tenure at this
          institution have been <strong>satisfactory</strong>. Average
          attendance was <strong>{student.attendance}%</strong> with a GPA of{" "}
          <strong>{student.gpa}</strong>.
        </p>
        <p>
          The student is hereby relieved from this institution with effect
          from the date of issue. No dues are pending against the student at
          the time of issue of this certificate.
        </p>
        <p>
          The certificate is issued on the basis of the official request dated{" "}
          <strong>{doc.requestedOn}</strong>
          {doc.purpose && doc.purpose !== "—" && (
            <>
              {" "}
              for the purpose of <strong>{doc.purpose}</strong>
            </>
          )}.
        </p>
      </div>
      <div className="cert-meta-row">
        <div>
          <div className="cert-meta-label">Date of issue</div>
          <div className="cert-meta-value">{doc.issuedOn || today}</div>
        </div>
        <div>
          <div className="cert-meta-label">Place</div>
          <div className="cert-meta-value">New Delhi</div>
        </div>
        <div>
          <div className="cert-meta-label">Roll No.</div>
          <div className="cert-meta-value">{student.id}</div>
        </div>
      </div>
    </div>
  );
}

function BonafideCertificate({ doc, student, school }) {
  const today = new Date().toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const sessionYear = `${new Date().getFullYear()} – ${new Date().getFullYear() + 1}`;
  return (
    <div className="cert-body">
      <CertificateBadge>Bonafide Certificate</CertificateBadge>
      <div className="cert-no">No. {doc.certificateNo || "—"}</div>
      <div className="cert-content">
        <p>
          This is to certify that <strong>{student.name}</strong> (Student ID:{" "}
          <code>{student.id}</code>) son/daughter of{" "}
          <strong>{student.parent || "—"}</strong> is currently a{" "}
          <strong>bonafide student</strong> of <strong>{school.name}</strong>.
        </p>
        <p>
          He/she is presently studying in{" "}
          <strong>
            Grade {student.grade} – Section {student.section}
          </strong>{" "}
          for the academic session <strong>{sessionYear}</strong>, and is
          assigned to <strong>{student.house}</strong> House.
        </p>
        <p>
          This certificate is being issued{" "}
          {doc.purpose && doc.purpose !== "—" ? (
            <>
              for the purpose of <strong>{doc.purpose}</strong> on the
              student's own request.
            </>
          ) : (
            <>on the student's own request.</>
          )}
        </p>
      </div>
      <div className="cert-meta-row">
        <div>
          <div className="cert-meta-label">Date of issue</div>
          <div className="cert-meta-value">{doc.issuedOn || today}</div>
        </div>
        <div>
          <div className="cert-meta-label">Session</div>
          <div className="cert-meta-value">{sessionYear}</div>
        </div>
        <div>
          <div className="cert-meta-label">Attendance</div>
          <div className="cert-meta-value">{student.attendance}%</div>
        </div>
      </div>
    </div>
  );
}

function CharacterCertificate({ doc, student, school }) {
  const today = new Date().toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <div className="cert-body">
      <CertificateBadge>Character Certificate</CertificateBadge>
      <div className="cert-no">No. {doc.certificateNo || "—"}</div>
      <div className="cert-content">
        <p>
          This is to certify that <strong>{student.name}</strong> bearing
          Student ID <code>{student.id}</code> has been a student of{" "}
          <strong>{school.name}</strong> in Grade {student.grade}, Section{" "}
          {student.section}.
        </p>
        <p>
          To the best of our knowledge, the student's conduct and behaviour
          during his/her tenure at this institution have been{" "}
          <strong>excellent</strong>. He/she has been a sincere and
          well-behaved student, having actively participated in academic and
          co-curricular activities of the school. The student has maintained
          an attendance of <strong>{student.attendance}%</strong> with an
          academic GPA of <strong>{student.gpa}</strong>.
        </p>
        <p>
          We wish him/her every success in all future endeavours.
        </p>
      </div>
      <div className="cert-meta-row">
        <div>
          <div className="cert-meta-label">Date of issue</div>
          <div className="cert-meta-value">{doc.issuedOn || today}</div>
        </div>
        <div>
          <div className="cert-meta-label">House</div>
          <div className="cert-meta-value">{student.house}</div>
        </div>
        <div>
          <div className="cert-meta-label">GPA</div>
          <div className="cert-meta-value">{student.gpa}</div>
        </div>
      </div>
    </div>
  );
}

function IDCard({ doc, student, school }) {
  const validUntil = `Mar ${new Date().getFullYear() + 1}`;
  return (
    <div className="cert-body cert-id-body">
      <CertificateBadge>Student Identification Card</CertificateBadge>
      <div className="id-card-grid">
        <div className="id-avatar">
          <div className="id-avatar-orb">{student.avatar || student.name?.slice(0, 1)}</div>
          <div className="id-validity">
            <ShieldCheck size={11} /> Valid till {validUntil}
          </div>
        </div>
        <dl className="id-fields">
          <Field k="Name" v={student.name} />
          <Field k="Student ID" v={student.id} mono />
          <Field k="Grade / Sec" v={`${student.grade} – ${student.section}`} />
          <Field k="House" v={student.house} />
          <Field k="Parent / Guardian" v={student.parent || "—"} />
          <Field k="Contact" v={student.contact || "—"} />
          <Field k="Blood group" v="O+" />
          <Field k="Card no." v={doc.certificateNo || "—"} mono />
        </dl>
      </div>
      <div className="id-card-strip">
        If found, please return to {school.name}, {school.address} · {school.phone}
      </div>
    </div>
  );
}

function Field({ k, v, mono }) {
  return (
    <div className="id-field">
      <dt>{k}</dt>
      <dd className={mono ? "mono" : ""}>{v}</dd>
    </div>
  );
}

function CertificateFooter({ doc, school }) {
  return (
    <div className="cert-footer">
      <div className="cert-sig-block">
        <div className="cert-sig-line" />
        <div className="cert-sig-label">Class Teacher</div>
      </div>
      <div className="cert-sig-block">
        <div className="cert-school-stamp">
          <div className="stamp-ring">
            <div className="stamp-inner">
              <div className="stamp-top">{school.name.toUpperCase()}</div>
              <SparklesIcon size={16} />
              <div className="stamp-bottom">OFFICIAL SEAL</div>
            </div>
          </div>
        </div>
      </div>
      <div className="cert-sig-block">
        <div className="cert-sig-line" />
        <div className="cert-sig-label">{school.principal}</div>
        <div className="cert-sig-sublabel">Principal</div>
      </div>
    </div>
  );
}

function PrintStyles() {
  return (
    <style>{`
      .cert-canvas {
        position: relative;
        width: min(820px, calc(100% - 32px));
        background: #ffffff;
        color: #0a0a1e;
        border-radius: 16px;
        box-shadow: 0 30px 80px rgba(91, 129, 255, 0.25), 0 0 0 1px rgba(255,255,255,0.08);
        overflow: hidden;
      }
      .cert-frame {
        position: relative;
        padding: 36px 44px 28px;
        background:
          linear-gradient(135deg, rgba(91,129,255,0.05), rgba(255,94,196,0.04)),
          repeating-linear-gradient(45deg, rgba(91,129,255,0.025) 0 2px, transparent 2px 14px);
        border: 1px solid rgba(91,129,255,0.18);
        border-radius: 16px;
      }
      .cert-frame::before {
        content: "";
        position: absolute;
        inset: 12px;
        border: 1px solid rgba(91,129,255,0.25);
        border-radius: 10px;
        pointer-events: none;
      }
      .cert-frame::after {
        content: "";
        position: absolute;
        inset: 18px;
        border: 0.5px dashed rgba(155,92,255,0.25);
        border-radius: 6px;
        pointer-events: none;
      }
      .cert-header {
        display: grid;
        grid-template-columns: 70px 1fr 100px;
        gap: 12px;
        align-items: center;
        padding-bottom: 14px;
        border-bottom: 1.5px solid rgba(91,129,255,0.25);
        margin-bottom: 22px;
      }
      .cert-header-center { text-align: center; }
      .cert-school-name {
        font-family: "Sora", system-ui, sans-serif;
        font-weight: 800;
        font-size: 26px;
        letter-spacing: 0.5px;
        background: linear-gradient(120deg, #3853e0, #9b5cff, #ff5ec4);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        line-height: 1.1;
      }
      .cert-school-tagline {
        font-size: 11px;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: #6e7299;
        margin-top: 4px;
      }
      .cert-school-meta {
        font-size: 11px;
        color: #44485e;
        margin-top: 6px;
      }
      .cert-school-affil {
        font-size: 10px;
        color: #6e7299;
        margin-top: 2px;
      }
      .cert-orb-2d {
        width: 60px;
        height: 60px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        color: #fff;
        background:
          radial-gradient(120% 80% at 20% 20%, rgba(255,255,255,0.5), transparent 60%),
          linear-gradient(135deg, #3853e0, #9b5cff 55%, #ff5ec4);
        box-shadow: 0 10px 22px rgba(91,129,255,0.45);
      }
      .cert-seal {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 10px 12px;
        background: linear-gradient(135deg, rgba(255,209,102,0.12), rgba(255,94,196,0.10));
        border: 1px dashed rgba(255,94,196,0.4);
        border-radius: 12px;
        color: #b35a8a;
        font-size: 9px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        font-weight: 600;
      }
      .cert-body { padding: 4px 6px; }
      .cert-id-body { padding: 12px 4px 4px; }
      .cert-badge {
        display: inline-block;
        padding: 6px 14px;
        font-family: "Sora", system-ui, sans-serif;
        font-weight: 700;
        font-size: 13px;
        letter-spacing: 0.4em;
        text-transform: uppercase;
        background: linear-gradient(120deg, #3853e0, #ff5ec4);
        color: #fff;
        border-radius: 999px;
        box-shadow: 0 6px 16px rgba(91,129,255,0.35);
      }
      .cert-no {
        margin-top: 6px;
        font-size: 11px;
        color: #6e7299;
        font-family: "JetBrains Mono", monospace;
      }
      .cert-content {
        margin-top: 16px;
        font-size: 13.5px;
        line-height: 1.85;
        color: #2a2d4a;
      }
      .cert-content p { margin: 0 0 12px; text-align: justify; }
      .cert-content strong { color: #0a0a1e; }
      .cert-content code {
        font-family: "JetBrains Mono", monospace;
        font-size: 12px;
        background: rgba(91,129,255,0.1);
        padding: 1px 6px;
        border-radius: 4px;
      }
      .cert-meta-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-top: 22px;
        padding: 12px 14px;
        background: rgba(91,129,255,0.06);
        border-radius: 10px;
        border-left: 3px solid #5b81ff;
      }
      .cert-meta-label {
        font-size: 9px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: #6e7299;
      }
      .cert-meta-value {
        font-family: "Sora", system-ui, sans-serif;
        font-weight: 700;
        font-size: 13px;
        color: #0a0a1e;
        margin-top: 2px;
      }
      .cert-footer {
        margin-top: 36px;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        align-items: end;
        gap: 24px;
      }
      .cert-sig-block { text-align: center; }
      .cert-sig-line {
        height: 1.5px;
        background: linear-gradient(to right, transparent, #2a2d4a 20%, #2a2d4a 80%, transparent);
        margin-bottom: 4px;
      }
      .cert-sig-label {
        font-size: 11px;
        font-weight: 700;
        color: #2a2d4a;
      }
      .cert-sig-sublabel {
        font-size: 9px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: #6e7299;
      }
      .cert-school-stamp { display: flex; justify-content: center; }
      .stamp-ring {
        width: 92px;
        height: 92px;
        border-radius: 50%;
        border: 2px solid #b35a8a;
        background: rgba(255,94,196,0.06);
        display: grid;
        place-items: center;
        transform: rotate(-8deg);
      }
      .stamp-inner {
        display: grid;
        place-items: center;
        text-align: center;
        color: #b35a8a;
        font-size: 7px;
        font-weight: 700;
        letter-spacing: 0.12em;
        line-height: 1.2;
      }
      .stamp-top, .stamp-bottom { text-transform: uppercase; }
      /* ---- ID card ---- */
      .id-card-grid {
        display: grid;
        grid-template-columns: 200px 1fr;
        gap: 24px;
        margin-top: 22px;
        align-items: start;
      }
      .id-avatar { text-align: center; }
      .id-avatar-orb {
        margin: 0 auto;
        width: 150px;
        height: 150px;
        border-radius: 16px;
        display: grid;
        place-items: center;
        font-family: "Sora", system-ui, sans-serif;
        font-weight: 800;
        font-size: 56px;
        color: #fff;
        background:
          radial-gradient(120% 80% at 20% 20%, rgba(255,255,255,0.45), transparent 60%),
          linear-gradient(135deg, #3853e0, #9b5cff 50%, #ff5ec4);
        box-shadow: 0 12px 30px rgba(91,129,255,0.4);
      }
      .id-validity {
        margin-top: 8px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 10px;
        color: #1e7a4f;
        background: rgba(92,242,196,0.15);
        padding: 4px 8px;
        border-radius: 6px;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .id-fields {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px 18px;
        margin: 0;
      }
      .id-field { margin: 0; }
      .id-field dt {
        font-size: 9px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: #6e7299;
        margin-bottom: 2px;
      }
      .id-field dd {
        font-family: "Sora", system-ui, sans-serif;
        font-weight: 700;
        font-size: 13px;
        color: #0a0a1e;
        margin: 0;
      }
      .id-field dd.mono { font-family: "JetBrains Mono", monospace; font-size: 12px; }
      .id-card-strip {
        margin-top: 22px;
        padding: 8px 14px;
        background: linear-gradient(90deg, rgba(91,129,255,0.1), rgba(255,94,196,0.1));
        border-radius: 8px;
        font-size: 10px;
        text-align: center;
        color: #44485e;
        letter-spacing: 0.05em;
      }
      /* ---- watermark ---- */
      .cert-watermark {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        pointer-events: none;
        font-size: 140px;
        font-family: "Sora", system-ui, sans-serif;
        font-weight: 900;
        letter-spacing: 0.2em;
        color: rgba(255,94,196,0.08);
        transform: rotate(-22deg);
      }
      /* ---- print ---- */
      @media print {
        @page { size: A4; margin: 14mm; }
        body { background: white !important; }
        .cert-canvas {
          box-shadow: none !important;
          width: 100% !important;
          border-radius: 0 !important;
        }
        .cert-frame { border-radius: 0; }
      }
    `}</style>
  );
}
