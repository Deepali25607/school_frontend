import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Printer, ArrowLeft, Sparkles as SparklesIcon, CheckCircle2 } from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";

export default function ReceiptPrint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    endpoints
      .feesReceipt(id)
      .then((res) => !cancelled && setData(res))
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

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
          <ErrorState error={error || new Error("Receipt not found")} />
          <button onClick={() => navigate(-1)} className="btn-ghost mt-4 inline-flex items-center gap-2">
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      </div>
    );
  }

  const { payment, student, school } = data;

  if (!student) {
    return (
      <div className="min-h-screen bg-[#06061a] px-6 py-10 text-white">
        <div className="card mx-auto max-w-3xl">
          <div className="text-sm">
            Student record {payment.studentId} not found — cannot render receipt.
          </div>
        </div>
      </div>
    );
  }

  const isVoid = payment.status !== "Success";

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
        <div className="flex items-center gap-2">
          {isVoid && (
            <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200">
              Status: {payment.status} — not a valid receipt
            </div>
          )}
          <button
            onClick={() => window.print()}
            className="btn-primary px-3 py-2 text-sm"
            disabled={isVoid}
          >
            <Printer size={14} /> Print / Save PDF
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rcpt-canvas mx-auto"
      >
        <div className="rcpt-frame">
          {/* Header */}
          <div className="rcpt-header">
            <div className="rcpt-orb-2d" aria-hidden>
              <SparklesIcon size={26} strokeWidth={2.2} />
            </div>
            <div className="rcpt-school">
              <div className="rcpt-school-name">{school.name}</div>
              <div className="rcpt-school-meta">{school.address}</div>
              <div className="rcpt-school-meta">{school.phone} · {school.email}</div>
              <div className="rcpt-school-affil">
                {school.affiliation} · GSTIN: {school.gstin}
              </div>
            </div>
            <div className="rcpt-corner">
              <div className="rcpt-corner-label">Receipt no.</div>
              <div className="rcpt-corner-value">{payment.receiptNo || "—"}</div>
            </div>
          </div>

          <div className="rcpt-title-row">
            <div className="rcpt-badge">FEE RECEIPT</div>
            <div className="rcpt-status-chip">
              <CheckCircle2 size={11} /> {payment.status}
            </div>
          </div>

          {/* Meta grid */}
          <div className="rcpt-meta">
            <div>
              <div className="rcpt-meta-label">Date</div>
              <div className="rcpt-meta-value">
                {new Date(payment.paidOn).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
            <div>
              <div className="rcpt-meta-label">Transaction ID</div>
              <div className="rcpt-meta-value mono">{payment.txnRef}</div>
            </div>
            <div>
              <div className="rcpt-meta-label">Payment mode</div>
              <div className="rcpt-meta-value">{payment.mode}</div>
            </div>
          </div>

          {/* Student details */}
          <div className="rcpt-section">
            <div className="rcpt-section-title">Student details</div>
            <div className="rcpt-student">
              <div>
                <span className="rcpt-label">Name:</span>
                <strong>{student.name}</strong>
              </div>
              <div>
                <span className="rcpt-label">Student ID:</span>
                <code>{student.id}</code>
              </div>
              <div>
                <span className="rcpt-label">Grade / Section:</span>
                <strong>{student.grade} – {student.section}</strong>
              </div>
              <div>
                <span className="rcpt-label">House:</span>
                <strong>{student.house}</strong>
              </div>
              <div>
                <span className="rcpt-label">Paid by:</span>
                <strong>{payment.paidBy}</strong>
              </div>
            </div>
          </div>

          {/* Itemised breakdown */}
          <div className="rcpt-section">
            <div className="rcpt-section-title">Itemised breakdown</div>
            <table className="rcpt-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th className="text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(payment.breakdown || {}).map(([k, v]) => {
                  if (!v) return null;
                  return (
                    <tr key={k}>
                      <td>{k.charAt(0).toUpperCase() + k.slice(1)}</td>
                      <td className="text-right mono">{Number(v).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <th>Total</th>
                  <th className="text-right mono">
                    ₹ {payment.amount.toLocaleString()}
                  </th>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Amount in words */}
          <div className="rcpt-amount-row">
            <div>
              <div className="rcpt-meta-label">Amount in words</div>
              <div className="rcpt-amount-words">
                Rupees {numToWords(payment.amount)} only
              </div>
            </div>
            <div className="rcpt-grand-total">
              <div className="rcpt-meta-label">Grand total</div>
              <div className="rcpt-grand-value">
                ₹ {payment.amount.toLocaleString()}
              </div>
            </div>
          </div>

          {payment.notes && (
            <div className="rcpt-notes">
              <span className="rcpt-label">Notes:</span> {payment.notes}
            </div>
          )}

          {/* Footer */}
          <div className="rcpt-footer">
            <div className="rcpt-sig-block">
              <div className="rcpt-sig-line" />
              <div className="rcpt-sig-label">Cashier signature</div>
            </div>
            <div className="rcpt-stamp">
              <div className="rcpt-stamp-ring">
                <div className="rcpt-stamp-inner">
                  <div>OFFICIAL</div>
                  <SparklesIcon size={14} />
                  <div>STAMP</div>
                </div>
              </div>
            </div>
            <div className="rcpt-sig-block">
              <div className="rcpt-sig-line" />
              <div className="rcpt-sig-label">Authorised signatory</div>
            </div>
          </div>

          <div className="rcpt-foot-note">
            This is a system-generated receipt. For queries contact the accounts office.
          </div>
        </div>

        {isVoid && (
          <div className="rcpt-watermark" aria-hidden>
            {payment.status.toUpperCase()}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// Very lite Indian numbering for the "in words" line — covers practical school fees
function numToWords(n) {
  if (!n) return "Zero";
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function two(x) {
    if (x < 20) return a[x];
    return b[Math.floor(x / 10)] + (x % 10 ? " " + a[x % 10] : "");
  }
  function three(x) {
    return (x >= 100 ? a[Math.floor(x / 100)] + " Hundred " : "") + two(x % 100);
  }
  let num = Math.floor(n);
  let s = "";
  if (num >= 10000000) {
    s += two(Math.floor(num / 10000000)) + " Crore ";
    num %= 10000000;
  }
  if (num >= 100000) {
    s += two(Math.floor(num / 100000)) + " Lakh ";
    num %= 100000;
  }
  if (num >= 1000) {
    s += two(Math.floor(num / 1000)) + " Thousand ";
    num %= 1000;
  }
  s += three(num);
  return s.trim().replace(/\s+/g, " ");
}

function PrintStyles() {
  return (
    <style>{`
      .rcpt-canvas {
        position: relative;
        width: min(820px, calc(100% - 32px));
        background: #ffffff;
        color: #0a0a1e;
        border-radius: 16px;
        box-shadow: 0 30px 80px rgba(91,129,255,0.25), 0 0 0 1px rgba(255,255,255,0.08);
        overflow: hidden;
      }
      .rcpt-frame {
        position: relative;
        padding: 36px 44px 28px;
        background:
          linear-gradient(135deg, rgba(91,129,255,0.04), rgba(155,92,255,0.03)),
          repeating-linear-gradient(45deg, rgba(91,129,255,0.02) 0 2px, transparent 2px 14px);
        border: 1px solid rgba(91,129,255,0.18);
        border-radius: 16px;
      }
      .rcpt-frame::before {
        content: "";
        position: absolute;
        inset: 12px;
        border: 1px solid rgba(91,129,255,0.22);
        border-radius: 10px;
        pointer-events: none;
      }
      .rcpt-header {
        display: grid;
        grid-template-columns: 70px 1fr 160px;
        gap: 12px;
        align-items: center;
        padding-bottom: 14px;
        border-bottom: 1.5px solid rgba(91,129,255,0.25);
        margin-bottom: 18px;
      }
      .rcpt-orb-2d {
        width: 60px; height: 60px;
        display: grid; place-items: center;
        border-radius: 50%;
        color: #fff;
        background:
          radial-gradient(120% 80% at 20% 20%, rgba(255,255,255,0.5), transparent 60%),
          linear-gradient(135deg, #3853e0, #9b5cff 55%, #ff5ec4);
        box-shadow: 0 10px 22px rgba(91,129,255,0.45);
      }
      .rcpt-school-name {
        font-family: "Sora", system-ui, sans-serif;
        font-weight: 800;
        font-size: 24px;
        letter-spacing: 0.4px;
        background: linear-gradient(120deg, #3853e0, #9b5cff, #ff5ec4);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        line-height: 1.1;
      }
      .rcpt-school-meta { font-size: 11px; color: #44485e; margin-top: 4px; }
      .rcpt-school-affil { font-size: 10px; color: #6e7299; margin-top: 2px; }
      .rcpt-corner {
        text-align: right;
        padding: 10px 12px;
        background: linear-gradient(135deg, rgba(255,209,102,0.12), rgba(255,94,196,0.10));
        border: 1px dashed rgba(255,94,196,0.4);
        border-radius: 10px;
      }
      .rcpt-corner-label {
        font-size: 9px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: #6e7299;
      }
      .rcpt-corner-value {
        font-family: "JetBrains Mono", monospace;
        font-weight: 700;
        font-size: 12px;
        color: #b35a8a;
        margin-top: 2px;
      }
      .rcpt-title-row {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: 16px;
      }
      .rcpt-badge {
        display: inline-block;
        padding: 6px 14px;
        font-family: "Sora", system-ui, sans-serif;
        font-weight: 700;
        font-size: 13px;
        letter-spacing: 0.4em;
        background: linear-gradient(120deg, #3853e0, #ff5ec4);
        color: #fff;
        border-radius: 999px;
        box-shadow: 0 6px 16px rgba(91,129,255,0.35);
      }
      .rcpt-status-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        background: rgba(76,175,80,0.12);
        border: 1px solid rgba(76,175,80,0.4);
        color: #2c8a37;
        border-radius: 999px;
      }
      .rcpt-meta {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
        padding: 12px 14px;
        background: rgba(91,129,255,0.05);
        border-radius: 10px;
        border-left: 3px solid #5b81ff;
        margin-bottom: 16px;
      }
      .rcpt-meta-label {
        font-size: 9px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: #6e7299;
      }
      .rcpt-meta-value {
        font-family: "Sora", system-ui, sans-serif;
        font-weight: 700;
        font-size: 13px;
        color: #0a0a1e;
        margin-top: 2px;
      }
      .mono { font-family: "JetBrains Mono", monospace; font-size: 12px; }
      .rcpt-section { margin-bottom: 14px; }
      .rcpt-section-title {
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: #6e7299;
        margin-bottom: 6px;
      }
      .rcpt-student {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px 18px;
        font-size: 13px;
        padding: 10px 14px;
        background: rgba(91,129,255,0.04);
        border-radius: 8px;
      }
      .rcpt-label { color: #6e7299; margin-right: 6px; font-size: 11px; }
      .rcpt-student code {
        font-family: "JetBrains Mono", monospace;
        font-size: 11px;
        background: rgba(91,129,255,0.1);
        padding: 1px 6px;
        border-radius: 4px;
      }
      .rcpt-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }
      .rcpt-table th, .rcpt-table td {
        padding: 8px 12px;
        text-align: left;
      }
      .rcpt-table thead th {
        background: rgba(91,129,255,0.08);
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: #44485e;
        border-bottom: 1px solid rgba(91,129,255,0.2);
      }
      .rcpt-table tbody tr:nth-child(odd) td {
        background: rgba(91,129,255,0.03);
      }
      .rcpt-table tfoot th {
        background: linear-gradient(120deg, rgba(91,129,255,0.12), rgba(155,92,255,0.10));
        font-size: 13px;
        font-weight: 800;
        border-top: 1.5px solid rgba(91,129,255,0.25);
      }
      .text-right { text-align: right; }
      .rcpt-amount-row {
        margin-top: 16px;
        padding: 12px 16px;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 18px;
        align-items: center;
        background: linear-gradient(120deg, rgba(76,175,80,0.08), rgba(91,129,255,0.05));
        border-radius: 10px;
        border-left: 3px solid #4caf50;
      }
      .rcpt-amount-words {
        font-family: "Sora", system-ui, sans-serif;
        font-weight: 700;
        font-size: 14px;
        margin-top: 2px;
        font-style: italic;
      }
      .rcpt-grand-total { text-align: right; }
      .rcpt-grand-value {
        font-family: "Sora", system-ui, sans-serif;
        font-weight: 800;
        font-size: 24px;
        color: #2c8a37;
        margin-top: 2px;
      }
      .rcpt-notes {
        margin-top: 12px;
        padding: 8px 12px;
        font-size: 11px;
        background: rgba(255,209,102,0.08);
        border-radius: 6px;
        border-left: 3px solid #ffd166;
      }
      .rcpt-footer {
        margin-top: 30px;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        align-items: end;
        gap: 24px;
      }
      .rcpt-sig-block { text-align: center; }
      .rcpt-sig-line {
        height: 1.5px;
        background: linear-gradient(to right, transparent, #2a2d4a 20%, #2a2d4a 80%, transparent);
        margin-bottom: 4px;
      }
      .rcpt-sig-label {
        font-size: 11px;
        font-weight: 700;
        color: #2a2d4a;
      }
      .rcpt-stamp { display: flex; justify-content: center; }
      .rcpt-stamp-ring {
        width: 88px; height: 88px;
        border-radius: 50%;
        border: 2px solid #b35a8a;
        background: rgba(255,94,196,0.06);
        display: grid; place-items: center;
        transform: rotate(-8deg);
      }
      .rcpt-stamp-inner {
        display: grid; place-items: center;
        text-align: center;
        color: #b35a8a;
        font-size: 7px;
        font-weight: 700;
        letter-spacing: 0.12em;
        line-height: 1.2;
      }
      .rcpt-foot-note {
        margin-top: 16px;
        text-align: center;
        font-size: 9px;
        color: #6e7299;
      }
      .rcpt-watermark {
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
      @media print {
        @page { size: A4; margin: 14mm; }
        body { background: white !important; }
        .rcpt-canvas {
          box-shadow: none !important;
          width: 100% !important;
          border-radius: 0 !important;
        }
        .rcpt-frame { border-radius: 0; }
      }
    `}</style>
  );
}
