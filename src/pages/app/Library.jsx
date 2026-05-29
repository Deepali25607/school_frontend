import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Book,
  Search,
  Plus,
  ScanBarcode,
  Undo2,
  AlertTriangle,
  X,
  Sparkles as SparklesIcon,
  Bookmark,
  Clock,
  CheckCircle2,
  Ban,
  Users,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useRealtime } from "../../lib/useRealtime.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "./Students.jsx";

const CATEGORIES = ["all", "Fiction", "Science", "History", "Textbook", "Biography", "Self-help"];

const CATEGORY_TONES = {
  Fiction: "from-accent-pink/30 to-accent-pink/5 ring-accent-pink/30 text-pink-200",
  Science: "from-accent-cyan/30 to-accent-cyan/5 ring-accent-cyan/30 text-cyan-200",
  History: "from-accent-gold/30 to-accent-gold/5 ring-accent-gold/30 text-amber-200",
  Textbook: "from-brand-500/30 to-brand-400/5 ring-brand-400/30 text-brand-200",
  Biography: "from-accent-violet/30 to-accent-violet/5 ring-accent-violet/30 text-purple-200",
  "Self-help": "from-emerald-500/30 to-emerald-400/5 ring-emerald-400/30 text-emerald-200",
};

export default function Library() {
  const { user } = useAuth();
  const isStaff = ["admin", "principal", "hr", "teacher"].includes(user?.role);
  const isParent = user?.role === "parent";
  const isStudent = user?.role === "student";

  // Whichever child the parent picks (single-child parents skip the picker).
  const myStudents = useMemo(() => {
    if (isParent) return user?.scope?.children || [];
    if (isStudent && user?.scope?.studentId) {
      return [
        {
          id: user.scope.studentId,
          name: user.name,
          grade: user.scope.grade,
          section: user.scope.section,
        },
      ];
    }
    return [];
  }, [user, isParent, isStudent]);

  const [activeStudent, setActiveStudent] = useState(myStudents[0]?.id || "");
  useEffect(() => {
    if (!activeStudent && myStudents[0]?.id) setActiveStudent(myStudents[0].id);
  }, [myStudents, activeStudent]);

  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [cat, setCat] = useState("all");
  const [tab, setTab] = useState("catalog");
  const [issueFor, setIssueFor] = useState(null);
  const [reserveFor, setReserveFor] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const books = useApi(
    () => endpoints.libraryBooks({ q: debounced, category: cat }),
    [debounced, cat]
  );
  const issues = useApi(endpoints.libraryIssues, [tab]);
  const reservations = useApi(endpoints.libraryReservations, []);
  useRealtime("library.changed", () => {
    books.refetch();
    issues.refetch();
    reservations.refetch();
  });

  const stats = useMemo(() => {
    const items = books.data?.items || [];
    return {
      titles: items.length,
      totalCopies: items.reduce((a, b) => a + b.copies, 0),
      available: items.reduce((a, b) => a + b.available, 0),
      issued: items.reduce((a, b) => a + b.issued, 0),
    };
  }, [books.data]);

  const activeIssues = (issues.data?.items || []).filter((i) => !i.returnedOn);
  const overdue = activeIssues.filter((i) => i.overdueDays > 0);

  const onReturn = async (issueId) => {
    await endpoints.libraryReturn(issueId);
    issues.refetch();
    books.refetch();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Resources"
        title="Library"
        subtitle="Catalog, issue/return and fines"
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile icon={Book} label="Titles" value={books.loading ? "—" : stats.titles} tint="from-brand-500/30" />
        <StatTile icon={ScanBarcode} label="Total copies" value={books.loading ? "—" : stats.totalCopies} tint="from-accent-violet/30" />
        <StatTile icon={SparklesIcon} label="Available" value={books.loading ? "—" : stats.available} tint="from-emerald-500/30" />
        <StatTile icon={AlertTriangle} label="Overdue" value={issues.loading ? "—" : overdue.length} tint="from-rose-500/30" />
      </div>

      <div className="card flex flex-wrap items-center gap-2">
        {[
          { k: "catalog", label: "Catalog" },
          isStaff && {
            k: "issues",
            label: `Active issues (${activeIssues.length})`,
          },
          isStaff && { k: "overdue", label: `Overdue (${overdue.length})` },
          {
            k: "reservations",
            label: `Reservations (${reservations.data?.total || 0})`,
          },
        ]
          .filter(Boolean)
          .map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`rounded-xl px-3 py-1.5 text-sm transition-all ${
                tab === t.k
                  ? "bg-gradient-to-r from-brand-500/30 to-accent-violet/20 text-white ring-1 ring-white/15"
                  : "text-white/65 hover:bg-white/5 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
      </div>

      {tab === "catalog" && (
        <CatalogTab
          q={q}
          setQ={setQ}
          cat={cat}
          setCat={setCat}
          books={books}
          reservations={reservations.data}
          isStaff={isStaff}
          canReserve={isParent || isStudent}
          activeStudent={activeStudent}
          onIssue={(b) => setIssueFor(b)}
          onReserve={(b) => setReserveFor(b)}
        />
      )}

      {tab === "issues" && isStaff && (
        <IssuesTab
          items={activeIssues}
          loading={issues.loading}
          error={issues.error}
          onReturn={onReturn}
        />
      )}

      {tab === "overdue" && isStaff && (
        <IssuesTab
          items={overdue}
          loading={issues.loading}
          error={issues.error}
          onReturn={onReturn}
          overdueOnly
        />
      )}

      {tab === "reservations" && (
        <ReservationsTab
          data={reservations.data}
          loading={reservations.loading}
          error={reservations.error}
          isStaff={isStaff}
          onCancel={async (id) => {
            try {
              await endpoints.libraryReservationCancel(id);
              reservations.refetch();
              books.refetch();
            } catch (e) {
              alert(e?.response?.data?.error || e.message);
            }
          }}
          onIssueReady={(rec) => {
            if (!isStaff) return;
            const book = books.data?.items?.find((b) => b.id === rec.bookId);
            if (book) setIssueFor({ ...book, _prefillStudentId: rec.studentId });
          }}
        />
      )}

      <AnimatePresence>
        {issueFor && (
          <IssueModal
            book={issueFor}
            onClose={() => setIssueFor(null)}
            onIssued={() => {
              setIssueFor(null);
              books.refetch();
              issues.refetch();
              reservations.refetch();
            }}
          />
        )}
        {reserveFor && (
          <ReserveModal
            book={reserveFor}
            myStudents={myStudents}
            initialStudent={activeStudent}
            onClose={() => setReserveFor(null)}
            onReserved={() => {
              setReserveFor(null);
              reservations.refetch();
              books.refetch();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CatalogTab({
  q,
  setQ,
  cat,
  setCat,
  books,
  reservations,
  isStaff,
  canReserve,
  activeStudent,
  onIssue,
  onReserve,
}) {
  // Build a quick lookup of {bookId → reservation} for the active student so
  // we can show "Already reserved · #N" instead of an unguarded Reserve button.
  const myActiveByBook = useMemo(() => {
    if (!reservations?.items) return {};
    const out = {};
    for (const r of reservations.items) {
      if (
        r.studentId !== activeStudent ||
        (r.status !== "active" && r.status !== "ready")
      ) continue;
      out[r.bookId] = r;
    }
    return out;
  }, [reservations, activeStudent]);

  return (
    <>
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={16} className="text-white/60" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, author, ISBN or barcode…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All categories" : c}
              </option>
            ))}
          </select>
          <button className="btn-primary px-3 py-2 text-sm">
            <Plus size={14} /> Add title
          </button>
        </div>
      </div>

      {books.error && <ErrorState error={books.error} onRetry={books.refetch} />}

      {books.loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(books.data?.items || []).map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ y: -4 }}
              className="card relative overflow-hidden"
            >
              <div
                className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${
                  CATEGORY_TONES[b.category] || "from-white/10 to-transparent"
                } blur-2xl opacity-60`}
              />
              <div className="relative">
                <span
                  className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-br ${
                    CATEGORY_TONES[b.category] || ""
                  } px-2 py-0.5 text-[10px] font-medium ring-1`}
                >
                  {b.category}
                </span>
                <div className="mt-2 line-clamp-2 font-display text-base font-semibold leading-snug">
                  {b.title}
                </div>
                <div className="text-xs text-white/55">{b.author}</div>
                {b.barcode && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 font-mono text-[10px] text-white/60 ring-1 ring-white/10">
                    <ScanBarcode size={11} className="text-white/45" />
                    {b.barcode}
                  </div>
                )}
                <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                  <Meta label="Shelf" value={b.shelf} />
                  <Meta label="Copies" value={b.copies} />
                  <Meta
                    label="Available"
                    value={b.available}
                    tone={
                      b.available === 0
                        ? "text-rose-300"
                        : b.available < 3
                        ? "text-amber-300"
                        : "text-emerald-300"
                    }
                  />
                </div>
                <BookActions
                  book={b}
                  isStaff={isStaff}
                  canReserve={canReserve}
                  myReservation={myActiveByBook[b.id]}
                  onIssue={() => onIssue(b)}
                  onReserve={() => onReserve(b)}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
}

function IssuesTab({ items, loading, error, onReturn, overdueOnly }) {
  if (error) return <ErrorState error={error} />;
  return (
    <div className="glass-card overflow-hidden">
      {loading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-10 text-center text-white/55">
          {overdueOnly ? "Nothing overdue. " : "No active issues. "}
          <SparklesIcon className="inline" size={14} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-left text-[11px] uppercase tracking-wider text-white/55">
              <tr>
                <th className="px-5 py-3">Issue</th>
                <th className="px-5 py-3">Book</th>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Issued</th>
                <th className="px-5 py-3">Due</th>
                <th className="px-5 py-3">Fine</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <motion.tr
                  key={it.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-t border-white/5"
                >
                  <td className="px-5 py-3 font-mono text-xs text-white/70">{it.id}</td>
                  <td className="px-5 py-3">
                    <div className="font-medium">{it.book?.title}</div>
                    <div className="text-[11px] text-white/50">{it.book?.author}</div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-accent-pink font-display text-[10px] font-bold">
                        {it.student?.avatar || "?"}
                      </div>
                      <div>
                        <div className="font-medium">{it.student?.name}</div>
                        <div className="text-[11px] text-white/50">
                          Grade {it.student?.grade}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-white/70">{it.issuedOn}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span>{it.dueOn}</span>
                      {it.overdueDays > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] text-rose-300 ring-1 ring-rose-400/30">
                          <AlertTriangle size={10} /> {it.overdueDays}d late
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 font-display">
                    {it.runningFine > 0 ? (
                      <span className="text-rose-300">
                        ₹{it.runningFine}
                      </span>
                    ) : (
                      <span className="text-white/40">₹0</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => onReturn(it.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                    >
                      <Undo2 size={12} /> Return
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function IssueModal({ book, onClose, onIssued }) {
  const [studentId, setStudentId] = useState(book._prefillStudentId || "STU1001");
  const [days, setDays] = useState(14);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await endpoints.libraryIssue({ bookId: book.id, studentId, days });
      onIssued();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur"
      onClick={onClose}
    >
      <motion.form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        className="glass-card relative w-full max-w-md p-6"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X size={16} />
        </button>
        <div className="mb-1 text-xs uppercase tracking-[0.2em] text-white/55">
          Issue book
        </div>
        <div className="font-display text-xl font-bold leading-snug">
          {book.title}
        </div>
        <div className="text-xs text-white/55">{book.author}</div>

        <div className="mt-5 space-y-3">
          <label className="block">
            <div className="mb-1 text-xs uppercase tracking-wider text-white/55">
              Student ID
            </div>
            <input
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
              placeholder="STU1001"
              required
            />
          </label>
          <label className="block">
            <div className="mb-1 text-xs uppercase tracking-wider text-white/55">
              Loan period (days)
            </div>
            <input
              type="number"
              min={1}
              max={60}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60 focus:bg-white/10"
            />
          </label>
          {err && (
            <div className="rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
              {err}
            </div>
          )}
          <button disabled={busy} className="btn-primary w-full">
            {busy ? "Issuing…" : "Confirm issue"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function StatTile({ icon: Icon, label, value, tint }) {
  return (
    <div className="card relative overflow-hidden">
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${tint} to-transparent blur-2xl`}
      />
      <div className="relative flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-white/55">
            {label}
          </div>
          <div className="stat-num glow-text">{value}</div>
        </div>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value, tone = "" }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2">
      <div className="text-[9px] uppercase tracking-wider text-white/45">
        {label}
      </div>
      <div className={`font-medium ${tone}`}>{value}</div>
    </div>
  );
}

// ============== RESERVATIONS ==============

const RES_STATUS_TONES = {
  active: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
  ready: "bg-emerald-500/20 text-emerald-200 ring-emerald-400/30",
  fulfilled: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  cancelled: "bg-white/5 text-white/45 ring-white/10",
  expired: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

function BookActions({
  book,
  isStaff,
  canReserve,
  myReservation,
  onIssue,
  onReserve,
}) {
  // Staff sees Issue when copies are available, otherwise an indication
  // that the title is fully out (queue is managed in the reservations tab).
  if (isStaff) {
    return (
      <button
        onClick={onIssue}
        disabled={book.available === 0}
        className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium transition-all hover:bg-white/10 disabled:opacity-40"
      >
        {book.available === 0 ? "All copies out" : "Issue book"}
      </button>
    );
  }

  // Owners (parent/student) — show their existing reservation status if any,
  // otherwise a Reserve button when out, or a "Available — visit desk" hint
  // when copies are sitting on the shelf.
  if (!canReserve) {
    return (
      <div className="mt-4 text-center text-[11px] text-white/40">
        Visit the library desk to borrow.
      </div>
    );
  }

  if (myReservation) {
    const label =
      myReservation.status === "ready"
        ? `Hold ready — pick up by ${myReservation.expiresAt}`
        : myReservation.position
        ? `In queue · #${myReservation.position}`
        : "Reserved";
    return (
      <div
        className={`mt-4 inline-flex w-full items-center justify-center gap-1 rounded-xl px-3 py-2 text-[11px] font-medium ring-1 ${
          RES_STATUS_TONES[myReservation.status]
        }`}
      >
        {myReservation.status === "ready" ? (
          <CheckCircle2 size={12} />
        ) : (
          <Clock size={12} />
        )}{" "}
        {label}
      </div>
    );
  }

  if (book.available > 0) {
    return (
      <div className="mt-4 text-center text-[11px] text-emerald-300/85">
        Available — visit the desk to borrow.
      </div>
    );
  }

  return (
    <button
      onClick={onReserve}
      className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-brand-500 to-accent-violet px-3 py-2 text-xs font-semibold text-white shadow shadow-brand-500/20"
    >
      <Bookmark size={12} /> Reserve
    </button>
  );
}

function ReservationsTab({ data, loading, error, isStaff, onCancel, onIssueReady }) {
  if (error) return <ErrorState error={error} />;
  const items = data?.items || [];
  const summary = data?.summary;

  return (
    <div className="space-y-3">
      {summary && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatTile icon={Clock} label="In queue" value={summary.active || 0} tint="from-amber-500/30" />
          <StatTile icon={CheckCircle2} label="Ready to pick up" value={summary.ready || 0} tint="from-emerald-500/30" />
          <StatTile icon={Bookmark} label="Fulfilled" value={summary.fulfilled || 0} tint="from-brand-500/30" />
          <StatTile icon={Ban} label="Cancelled" value={summary.cancelled || 0} tint="from-white/15" />
          <StatTile icon={AlertTriangle} label="Expired" value={summary.expired || 0} tint="from-rose-500/30" />
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center text-white/55">
          <SparklesIcon className="mx-auto mb-2 text-accent-gold" size={20} />
          No reservations yet.{" "}
          {isStaff
            ? "Patrons can request holds from the catalog."
            : "Reserve any out-of-stock title from the catalog above."}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((r, i) => (
            <ReservationRow
              key={r.id}
              r={r}
              idx={i}
              isStaff={isStaff}
              onCancel={() => onCancel(r.id)}
              onIssue={() => onIssueReady(r)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReservationRow({ r, idx, isStaff, onCancel, onIssue }) {
  const canCancel = r.status === "active" || r.status === "ready";
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx, 16) * 0.015 }}
      className={`flex flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3 md:flex-row md:items-center ${
        r.status === "cancelled" || r.status === "expired" ? "opacity-55" : ""
      }`}
    >
      <div className="flex items-center gap-3 md:flex-1">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand-500/30 to-accent-violet/30 ring-1 ring-white/10">
          <Book size={14} className="text-brand-200" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">
            {r.book?.title || r.bookId}
          </div>
          <div className="truncate text-[11px] text-white/55">
            {r.book?.author}
          </div>
        </div>
      </div>

      {isStaff && r.student && (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-accent-pink text-[10px] font-bold">
            {r.student?.avatar || "?"}
          </div>
          <div>
            <div className="text-xs font-medium">{r.student?.name}</div>
            <div className="text-[10px] text-white/45">
              Grade {r.student?.grade}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
        <span
          className={`rounded-md px-2 py-0.5 text-[10px] font-medium ring-1 ${
            RES_STATUS_TONES[r.status]
          }`}
        >
          {r.status}
        </span>
        {r.status === "active" && r.position && (
          <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-white/65 ring-1 ring-white/10">
            #{r.position} in queue
          </span>
        )}
        {r.status === "ready" && r.expiresAt && (
          <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-200 ring-1 ring-emerald-400/30">
            Pick up by {r.expiresAt}
          </span>
        )}
        <span className="text-[10px] text-white/40">
          Reserved {new Date(r.requestedAt).toLocaleDateString()}
        </span>
        {isStaff && r.status === "ready" && (
          <button
            type="button"
            onClick={onIssue}
            className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-200 ring-1 ring-emerald-400/30 hover:bg-emerald-500/30"
          >
            <CheckCircle2 size={11} /> Issue now
          </button>
        )}
        {canCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/65 hover:bg-white/10"
          >
            <Ban size={11} /> Cancel
          </button>
        )}
      </div>
    </motion.div>
  );
}

function ReserveModal({ book, myStudents, initialStudent, onClose, onReserved }) {
  const [studentId, setStudentId] = useState(initialStudent || myStudents[0]?.id || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!studentId) {
      setErr("Pick a student first");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await endpoints.libraryReserve({ bookId: book.id, studentId });
      onReserved();
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur"
    >
      <motion.form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        className="glass-card relative w-full max-w-md p-6"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X size={16} />
        </button>
        <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/55">
          <Bookmark size={12} /> Reserve
        </div>
        <div className="font-display text-xl font-bold leading-snug">
          {book.title}
        </div>
        <div className="text-xs text-white/55">{book.author}</div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/70">
          <div className="flex items-center gap-2">
            <Clock size={12} className="text-brand-300" />
            You'll join the wait list. When a copy is returned, your hold
            becomes <strong>ready</strong> and you have 4 days to pick it up
            from the desk.
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {myStudents.length > 1 ? (
            <label className="block">
              <div className="mb-1 text-xs uppercase tracking-wider text-white/55">
                For student
              </div>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400/60"
              >
                {myStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          ) : myStudents[0] ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80">
              For <strong>{myStudents[0].name}</strong>
            </div>
          ) : (
            <div className="rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
              No student linked to your account.
            </div>
          )}

          {err && (
            <div className="rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !studentId}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-violet px-3 py-2 text-sm font-semibold text-white shadow shadow-brand-500/20 disabled:opacity-50"
          >
            <Bookmark size={14} />
            {busy ? "Reserving…" : "Confirm reservation"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
