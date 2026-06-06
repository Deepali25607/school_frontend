import { useRef, useState } from "react";
import {
  FileText,
  Upload,
  Check,
  Trash2,
  Plus,
  FileCheck2,
  FileX2,
} from "lucide-react";
import { endpoints } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

// Mirrors data/doc-records.js SUGGESTED so quick-add chips work without an extra
// fetch. An explicit `suggested` prop (e.g. from the GET endpoint) overrides it.
const DEFAULT_SUGGESTED = {
  student: [
    "Birth Certificate",
    "Previous Marksheet",
    "Transfer Certificate",
    "Aadhaar",
    "Passport Photo",
    "Medical Certificate",
    "Address Proof",
  ],
  teacher: [
    "Resume / CV",
    "Degree Certificate",
    "Aadhaar",
    "PAN Card",
    "Experience Letter",
    "Address Proof",
    "Passport Photo",
    "Police Verification",
  ],
};

// Reusable "document file" manager for any profile (student or teacher).
// Shows every personal document on record with an uploaded / verified state,
// and — for admin/principal — lets staff upload, verify, add and remove docs.
//
// Props:
//   ownerType  "student" | "teacher"
//   ownerId    the person's id (e.g. STU1062 / T007)
//   records    array of { id, name, uploaded, verified, fileName, note, updatedOn }
//   summary    { total, uploaded, verified, missing } (optional, derived if absent)
//   suggested  string[] of suggested document names for quick-add (optional)
//   onChange   called after any successful mutation so the parent can refetch
export default function DocumentRecords({
  ownerType,
  ownerId,
  records = [],
  summary,
  suggested = [],
  onChange,
}) {
  const { user } = useAuth();
  const canEdit = ["admin", "principal"].includes(user?.role);

  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const sum = summary || {
    total: records.length,
    uploaded: records.filter((r) => r.uploaded).length,
    verified: records.filter((r) => r.verified).length,
    missing: records.filter((r) => !r.uploaded).length,
  };

  const run = async (fn) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
      onChange?.();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const addDoc = (name) => {
    const clean = String(name || "").trim();
    if (!clean) return;
    return run(async () => {
      await endpoints.docRecordAdd({ ownerType, ownerId, name: clean });
      setNewName("");
    });
  };

  // Suggested names not already on file.
  const suggestList = suggested.length ? suggested : DEFAULT_SUGGESTED[ownerType] || [];
  const existingLower = new Set(records.map((r) => r.name.toLowerCase()));
  const quickAdd = suggestList.filter((s) => !existingLower.has(s.toLowerCase()));

  return (
    <div className="card relative overflow-hidden">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-brand-500/20 to-transparent blur-2xl" />
      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-white/65">
            <FileText size={12} /> Document records
          </div>
          <div className="text-[11px] text-white/55">
            {sum.uploaded}/{sum.total} uploaded · {sum.verified} verified
          </div>
        </div>

        {error && (
          <div className="mb-2 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-[11px] text-rose-200">
            {error}
          </div>
        )}

        {records.length === 0 ? (
          <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-6 text-center text-xs text-white/40">
            No documents on file yet.
            {canEdit && " Add one below to start maintaining records."}
          </div>
        ) : (
          <ul className="space-y-1.5">
            {records.map((d) => (
              <DocRow
                key={d.id}
                doc={d}
                canEdit={canEdit}
                busy={busy}
                run={run}
              />
            ))}
          </ul>
        )}

        {canEdit && (
          <div className="mt-4 border-t border-white/5 pt-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addDoc(newName);
              }}
              className="flex items-center gap-2"
            >
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Add a document (e.g. Aadhaar)"
                className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/90 placeholder:text-white/35 focus:border-brand-400/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy || !newName.trim()}
                className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-brand-500 to-accent-violet px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
              >
                <Plus size={14} /> Add
              </button>
            </form>

            {quickAdd.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-white/40">
                  Quick add:
                </span>
                {quickAdd.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={busy}
                    onClick={() => addDoc(s)}
                    className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DocRow({ doc, canEdit, busy, run }) {
  const inputRef = useRef(null);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (file)
      run(() =>
        endpoints.docRecordUpdate(doc.id, { uploaded: true, fileName: file.name })
      );
  };

  return (
    <li className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-white/85">{doc.name}</div>
        <div className="truncate text-[10px] text-white/40">
          {doc.fileName ? doc.fileName : "No file attached"}
          {doc.updatedOn ? ` · updated ${doc.updatedOn}` : ""}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {doc.verified ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300">
            <FileCheck2 size={12} /> Verified
          </span>
        ) : doc.uploaded ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-amber-300">
            <FileCheck2 size={12} /> Uploaded
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-white/40">
            <FileX2 size={12} /> Missing
          </span>
        )}

        {canEdit && (
          <>
            <input ref={inputRef} type="file" className="hidden" onChange={onFile} />
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              title={doc.uploaded ? "Replace document" : "Upload document"}
              className="rounded-md p-1 text-white/55 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
            >
              <Upload size={13} />
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => endpoints.docRecordUpdate(doc.id, { verified: !doc.verified }))}
              title={doc.verified ? "Mark not verified" : "Mark verified"}
              aria-pressed={doc.verified}
              className={`flex h-5 w-5 items-center justify-center rounded-md ring-1 transition-all disabled:opacity-40 ${
                doc.verified
                  ? "bg-emerald-500/25 text-emerald-300 ring-emerald-400/40"
                  : "bg-white/5 text-transparent ring-white/15 hover:ring-white/30"
              }`}
            >
              <Check size={12} />
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => endpoints.docRecordDelete(doc.id))}
              title="Remove document"
              className="rounded-md p-1 text-white/45 transition-colors hover:bg-rose-500/15 hover:text-rose-300 disabled:opacity-40"
            >
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>
    </li>
  );
}
