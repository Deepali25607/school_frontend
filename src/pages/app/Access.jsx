import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader,
  KeyRound,
  CircleAlert,
  Check,
  ShieldCheck,
  AlertTriangle,
  UserPlus,
  GraduationCap,
  Users as UsersIcon,
  UsersRound,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Copy,
  SlidersHorizontal,
  Link2,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useRealtime } from "../../lib/useRealtime.js";
import { Skeleton, ErrorState } from "../../components/ui/Skeleton.jsx";
import Avatar from "../../components/Avatar.jsx";
import { PageHeader } from "./Students.jsx";
import { NAV } from "../../layouts/nav.js";

const ROLE_META = {
  admin:      { label: "Super Admin", tone: "from-rose-500/25 to-rose-600/25",      chip: "bg-rose-500/15 text-rose-200 ring-rose-400/30",       desc: "Full access, including user management" },
  principal:  { label: "Principal",   tone: "from-violet-500/25 to-purple-600/25",  chip: "bg-violet-500/15 text-violet-200 ring-violet-400/30",  desc: "All modules; cannot manage users" },
  teacher:    { label: "Teacher",     tone: "from-brand-500/25 to-cyan-500/25",     chip: "bg-brand-500/15 text-brand-200 ring-brand-400/30",     desc: "Classes, attendance, marks, comms" },
  student:    { label: "Student",     tone: "from-emerald-500/25 to-teal-500/25",   chip: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30", desc: "Own attendance, marks, library" },
  parent:     { label: "Parent",      tone: "from-amber-500/25 to-orange-500/25",   chip: "bg-amber-500/15 text-amber-200 ring-amber-400/30",     desc: "Child's records, fees, PTM" },
  accountant: { label: "Accountant",  tone: "from-emerald-500/25 to-lime-500/25",   chip: "bg-lime-500/15 text-lime-200 ring-lime-400/30",        desc: "Fees, payroll, inventory" },
  hr:         { label: "HR",          tone: "from-pink-500/25 to-fuchsia-500/25",   chip: "bg-pink-500/15 text-pink-200 ring-pink-400/30",        desc: "Staff, teachers, leave, visitors" },
};

const ALL_ROLES = Object.keys(ROLE_META);

export default function Access() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editing, setEditing] = useState(null);    // null | "new" | user
  const [resetting, setResetting] = useState(null); // null | user
  const [deleting, setDeleting] = useState(null);   // null | user
  const [permitting, setPermitting] = useState(null); // null | user
  const [createdToast, setCreatedToast] = useState(null); // { email, password }
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const { data, loading, error: fetchError, refetch } = useApi(
    () => endpoints.users({ role: roleFilter === "all" ? "" : roleFilter, q: debouncedQ }),
    [roleFilter, debouncedQ]
  );

  useRealtime(["users.changed"], () => refetch());

  const users = data?.users || [];

  const countsByRole = useMemo(() => {
    const out = { all: users.length };
    for (const r of ALL_ROLES) out[r] = 0;
    for (const u of users) out[u.role] = (out[u.role] || 0) + 1;
    return out;
  }, [users]);

  if (user?.role !== "admin" && user?.role !== "principal") {
    return (
      <div className="card flex items-start gap-3 text-white/70">
        <ShieldCheck size={20} className="mt-0.5 text-amber-300" />
        <div>
          <div className="font-display text-lg font-semibold text-white">
            Admin-only
          </div>
          <p className="text-sm">
            User and access management is restricted to Super Admin and
            Principal accounts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="System"
        title="Users & Access"
        subtitle={
          data
            ? `${users.length} login account${users.length === 1 ? "" : "s"} • ${isAdmin ? "you can create / edit / delete" : "read-only (admin needed for changes)"}`
            : "Loading…"
        }
      />

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          <CircleAlert size={18} className="mt-0.5 shrink-0" />
          <div className="flex-1">{error}</div>
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <AnimatePresence>
        {createdToast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card flex flex-col gap-3 border-emerald-400/40 bg-emerald-500/10 md:flex-row md:items-center"
          >
            <div className="flex items-start gap-3 text-sm text-emerald-100">
              <Check size={18} className="mt-0.5" />
              <div>
                <div className="font-semibold">Account created.</div>
                <div className="mt-0.5 text-emerald-200/80">
                  Share these credentials with the user — they can change the
                  password from Settings after first sign-in.
                </div>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2 rounded-lg bg-black/30 px-3 py-2 font-mono text-xs text-emerald-100">
              <span>{createdToast.email}</span>
              <span className="text-emerald-300/50">|</span>
              <span>{createdToast.password}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(
                    `${createdToast.email} / ${createdToast.password}`
                  );
                }}
                className="rounded-md p-1 text-emerald-200 hover:bg-white/10"
                title="Copy"
              >
                <Copy size={12} />
              </button>
              <button
                type="button"
                onClick={() => setCreatedToast(null)}
                className="rounded-md p-1 text-emerald-200 hover:bg-white/10"
              >
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={16} className="text-white/60" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="btn-primary px-4 py-2 text-sm"
          >
            <UserPlus size={14} /> Add user
          </button>
        )}
      </div>

      {/* Role filter chips */}
      <div className="card">
        <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-white/50">
          <UsersIcon size={12} /> Filter by category
        </div>
        <div className="flex flex-wrap gap-2">
          <RoleChip
            active={roleFilter === "all"}
            onClick={() => setRoleFilter("all")}
            label="All"
            count={countsByRole.all}
            tone="bg-white/10 text-white ring-white/15"
          />
          {ALL_ROLES.map((r) => (
            <RoleChip
              key={r}
              active={roleFilter === r}
              onClick={() => setRoleFilter(r)}
              label={ROLE_META[r].label}
              count={countsByRole[r] || 0}
              tone={ROLE_META[r].chip}
            />
          ))}
        </div>
      </div>

      {/* User list */}
      {fetchError && <ErrorState error={fetchError} onRetry={refetch} />}

      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {users.map((u) => (
            <UserCard
              key={u.id}
              u={u}
              currentUserId={user?.id}
              isAdmin={isAdmin}
              onEdit={() => setEditing(u)}
              onReset={() => setResetting(u)}
              onDelete={() => setDeleting(u)}
              onPermissions={() => setPermitting(u)}
            />
          ))}
          {users.length === 0 && (
            <div className="card md:col-span-2 xl:col-span-3 text-center text-sm text-white/55">
              No users match these filters.
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {editing === "new" && (
          <UserFormModal
            mode="create"
            onClose={() => setEditing(null)}
            onSaved={(payload) => {
              setEditing(null);
              setCreatedToast(payload);
              refetch();
            }}
            onError={setError}
          />
        )}
        {editing && editing !== "new" && (
          <UserFormModal
            mode="edit"
            initial={editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              refetch();
            }}
            onError={setError}
          />
        )}
        {resetting && (
          <ResetPasswordModal
            user={resetting}
            onClose={() => setResetting(null)}
            onDone={() => setResetting(null)}
            onError={setError}
          />
        )}
        {deleting && (
          <DeleteConfirmModal
            user={deleting}
            onClose={() => setDeleting(null)}
            onDone={() => {
              setDeleting(null);
              refetch();
            }}
            onError={setError}
          />
        )}
        {permitting && (
          <PermissionsModal
            user={permitting}
            onClose={() => setPermitting(null)}
            onSaved={() => {
              setPermitting(null);
              refetch();
            }}
            onError={setError}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============ Role chip ============

function RoleChip({ active, onClick, label, count, tone }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ring-1 transition ${
        active
          ? `${tone} font-semibold`
          : "bg-white/[0.03] text-white/65 ring-white/10 hover:bg-white/5"
      }`}
    >
      <span>{label}</span>
      <span
        className={`rounded-full px-1.5 text-[10px] ${
          active ? "bg-black/30" : "bg-white/5 text-white/55"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

// ============ User card ============

function UserCard({ u, currentUserId, isAdmin, onEdit, onReset, onDelete, onPermissions }) {
  const meta = ROLE_META[u.role] || { label: u.role, chip: "bg-white/10 text-white/70 ring-white/15" };
  const isSeed = u.source === "seed";
  const isSelf = u.id === currentUserId;
  const hiddenCount = u.permissions?.hiddenPaths?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="card relative overflow-hidden"
    >
      <div
        className={`pointer-events-none absolute -right-14 -top-14 h-32 w-32 rounded-full bg-gradient-to-br ${meta.tone} blur-3xl`}
      />
      <div className="relative">
        <div className="flex items-start gap-3">
          <Avatar
            photoUrl={u.photoUrl}
            initials={u.avatar || u.name?.slice(0, 2).toUpperCase()}
            size={48}
            ringClass="ring-1 ring-white/15"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="truncate font-display text-base font-semibold text-white">
                {u.name}
              </div>
              {isSelf && (
                <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/70">
                  you
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/55">
              <Mail size={11} className="shrink-0" />
              <span className="truncate">{u.email}</span>
            </div>
            {u.phone && (
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/45">
                <Phone size={10} /> {u.phone}
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ${meta.chip}`}
          >
            {meta.label}
          </span>
          {isSeed ? (
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/55 ring-1 ring-white/10">
              seed account
            </span>
          ) : (
            <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] text-brand-200 ring-1 ring-brand-400/20">
              admin-created
            </span>
          )}
          {u.sourceType && (
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/55 ring-1 ring-white/10">
              from {u.sourceType} {u.sourceId}
            </span>
          )}
          {hiddenCount > 0 && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-200 ring-1 ring-amber-400/30">
              {hiddenCount} module{hiddenCount === 1 ? "" : "s"} hidden
            </span>
          )}
          {u.scopeStudentId && (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-200 ring-1 ring-emerald-400/30">
              scoped → {u.scopeStudentId}
            </span>
          )}
        </div>

        {isAdmin && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-white/5 pt-3">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/80 hover:bg-white/10"
            >
              <Pencil size={11} /> Edit
            </button>
            <button
              type="button"
              onClick={onPermissions}
              className="inline-flex items-center gap-1 rounded-md border border-brand-400/30 bg-brand-500/10 px-2 py-1 text-[11px] text-brand-200 hover:bg-brand-500/20"
            >
              <SlidersHorizontal size={11} /> Permissions
            </button>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200 hover:bg-amber-500/20"
            >
              <KeyRound size={11} /> Reset password
            </button>
            {!isSeed && !isSelf && (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1 rounded-md border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-200 hover:bg-rose-500/20"
              >
                <Trash2 size={11} /> Delete
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============ Create / Edit form modal ============

function UserFormModal({ mode, initial, onClose, onSaved, onError }) {
  const isCreate = mode === "create";
  const isSeed = initial?.source === "seed";

  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [avatar, setAvatar] = useState(initial?.avatar || "");
  const [role, setRole] = useState(initial?.role || "teacher");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [linkMode, setLinkMode] = useState("none"); // none | student | teacher | staff
  const [linkPicker, setLinkPicker] = useState(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (isCreate) {
        const finalPass = password || "lumina1234";
        await endpoints.userAdd({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          avatar: avatar.trim() || null,
          role,
          password: finalPass,
          sourceType: linkMode === "none" ? null : linkMode,
          sourceId: linkPicker?.id || null,
        });
        onSaved({ email: email.trim(), password: finalPass });
      } else {
        const patch = { name: name.trim(), phone: phone.trim() || null };
        if (avatar.trim()) patch.avatar = avatar.trim();
        if (!isSeed) {
          patch.email = email.trim();
          patch.role = role;
        }
        await endpoints.userUpdate(initial.id, patch);
        onSaved();
      }
    } catch (err) {
      onError(err?.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50";

  return (
    <ModalShell title={isCreate ? "Add user" : `Edit ${initial.name}`} onClose={onClose} width="lg">
      <form onSubmit={onSubmit} className="space-y-4">
        {isCreate && (
          <LinkPicker
            mode={linkMode}
            setMode={setLinkMode}
            picked={linkPicker}
            onPick={(rec) => {
              setLinkPicker(rec);
              if (rec) {
                setName(rec.name);
                if (rec.email) setEmail(rec.email);
                setAvatar(rec.avatar || "");
                if (linkMode === "student") setRole("student");
                else if (linkMode === "teacher") setRole("teacher");
                else if (linkMode === "staff") setRole("hr");
              }
            }}
          />
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Full name *">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              placeholder="e.g. Riya Sharma"
            />
          </Field>
          <Field label="Email *">
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!isCreate && isSeed}
              className={inputCls + (!isCreate && isSeed ? " opacity-50" : "")}
              placeholder="user@school.edu"
            />
          </Field>
          <Field label="Phone">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputCls}
              placeholder="+91 9XXXXXXXXX"
            />
          </Field>
          <Field label="Initials (avatar)">
            <input
              maxLength={3}
              value={avatar}
              onChange={(e) => setAvatar(e.target.value.toUpperCase())}
              className={inputCls}
              placeholder="RS"
            />
          </Field>
          <Field label="Category / role *" className="md:col-span-2">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {ALL_ROLES.map((r) => {
                const meta = ROLE_META[r];
                const active = role === r;
                const locked = !isCreate && isSeed;
                return (
                  <button
                    key={r}
                    type="button"
                    disabled={locked}
                    onClick={() => setRole(r)}
                    className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                      active
                        ? "border-brand-400/50 bg-brand-500/15 text-white shadow shadow-brand-500/20"
                        : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06]"
                    } ${locked ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="font-semibold">{meta.label}</div>
                    <div className="mt-0.5 text-[10px] text-white/45">
                      {meta.desc}
                    </div>
                  </button>
                );
              })}
            </div>
            {!isCreate && isSeed && (
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-300">
                <AlertTriangle size={11} /> Seed accounts (U001–U007) keep their
                role and email so the demo login keeps working.
              </p>
            )}
          </Field>
          {isCreate && (
            <Field label="Initial password" className="md:col-span-2">
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to use the demo password lumina1234"
                  className={inputCls + " pr-9"}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/45 hover:text-white"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-white/45">
                Min 6 characters. The user can change it from Settings after
                they sign in.
              </p>
            </Field>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            {busy ? <Loader size={14} className="animate-spin" /> : <Check size={14} />}
            {isCreate ? "Create account" : "Save changes"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ============ Link from existing Student / Teacher / Staff ============

function LinkPicker({ mode, setMode, picked, onPick }) {
  const tabs = [
    { id: "none",    label: "Blank",    icon: UserPlus },
    { id: "student", label: "Student",  icon: UsersIcon },
    { id: "teacher", label: "Teacher",  icon: GraduationCap },
    { id: "staff",   label: "Staff",    icon: UsersRound },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-xs uppercase tracking-wider text-white/50">
        Create from
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = mode === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setMode(t.id);
                onPick(null);
              }}
              className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs transition ${
                active
                  ? "border-brand-400/50 bg-brand-500/15 text-white"
                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              <Icon size={12} /> {t.label}
            </button>
          );
        })}
      </div>
      {mode !== "none" && (
        <RecordPicker mode={mode} picked={picked} onPick={onPick} />
      )}
    </div>
  );
}

function RecordPicker({ mode, picked, onPick }) {
  const fetcher =
    mode === "student"
      ? () => endpoints.students({ q: "" })
      : mode === "teacher"
      ? () => endpoints.teachers({})
      : () => endpoints.staff({});
  const { data, loading } = useApi(fetcher, [mode]);

  const items =
    mode === "student"
      ? data?.items || []
      : mode === "teacher"
      ? data?.items || []
      : data?.items || [];

  if (loading) {
    return (
      <div className="mt-2 text-xs text-white/55">Loading {mode} records…</div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="mt-2 text-xs text-white/55">
        No {mode} records yet. Add one from the {mode} module first.
      </div>
    );
  }
  return (
    <div className="mt-3">
      <select
        value={picked?.id || ""}
        onChange={(e) => {
          const rec = items.find((r) => r.id === e.target.value);
          onPick(rec || null);
        }}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50"
      >
        <option value="">— pick a {mode} —</option>
        {items.map((r) => (
          <option key={r.id} value={r.id}>
            {r.id} · {r.name}
            {r.email ? ` · ${r.email}` : ""}
          </option>
        ))}
      </select>
      {picked && !picked.email && (
        <p className="mt-1 text-[11px] text-amber-300">
          This record has no email. Fill one in manually below.
        </p>
      )}
    </div>
  );
}

// ============ Reset password ============

function ResetPasswordModal({ user, onClose, onDone, onError }) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await endpoints.userResetPassword(user.id, password || "lumina1234");
      onDone();
    } catch (err) {
      onError(err?.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title={`Reset password — ${user.name}`} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3">
        <p className="text-sm text-white/65">
          Set a new sign-in password for <b>{user.email}</b>. They'll be able
          to use it on next login.
        </p>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to reset to lumina1234"
            minLength={6}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 pr-9 text-sm text-white outline-none focus:border-brand-400/50"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/45 hover:text-white"
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow shadow-amber-500/20 disabled:opacity-50"
          >
            {busy ? <Loader size={14} className="animate-spin" /> : <KeyRound size={14} />}
            Reset password
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ============ Delete ============

function DeleteConfirmModal({ user, onClose, onDone, onError }) {
  const [busy, setBusy] = useState(false);

  const onConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await endpoints.userDelete(user.id);
      onDone();
    } catch (err) {
      onError(err?.response?.data?.error || err.message);
      setBusy(false);
    }
  };

  return (
    <ModalShell title="Delete user" onClose={onClose}>
      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            You're about to permanently remove the login account for{" "}
            <b>{user.name}</b> ({user.email}). They will no longer be able to
            sign in. This does not delete any related student/teacher/staff
            records.
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-2 text-sm font-semibold text-white shadow shadow-rose-500/20 disabled:opacity-50"
          >
            {busy ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Delete account
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ============ Permissions (sidebar + student scope) ============

const ALWAYS_PINNED = new Set(["/app", "/app/settings"]);

function PermissionsModal({ user, onClose, onSaved, onError }) {
  const isStudent = user.role === "student";

  // Role-default NAV items (the universe of things admin can toggle).
  const roleNav = useMemo(
    () => NAV.filter((n) => n.roles === "*" || n.roles.includes(user.role)),
    [user.role]
  );

  const initialHidden = new Set(user.permissions?.hiddenPaths || []);
  const [hidden, setHidden] = useState(initialHidden);
  const [hiddenWidgets, setHiddenWidgets] = useState(
    new Set(user.permissions?.hiddenWidgets || [])
  );
  const [scopeStudentId, setScopeStudentId] = useState(user.scopeStudentId || "");
  const [busy, setBusy] = useState(false);

  // For students, fetch the student list so admin can pin them to a record.
  const { data: studentsData } = useApi(
    () => (isStudent ? endpoints.students({}) : Promise.resolve({ items: [] })),
    [isStudent]
  );
  const studentList = studentsData?.items || [];

  // Widget catalog (id, label, role defaults) so we can show only the
  // widgets this user's role is even eligible to see.
  const { data: widgetsData } = useApi(() => endpoints.dashboardWidgets(), []);
  const roleWidgets = useMemo(() => {
    const all = widgetsData?.widgets || [];
    return all.filter(
      (w) => w.defaultRoles === "*" || w.defaultRoles.includes(user.role)
    );
  }, [widgetsData, user.role]);

  const toggle = (path) => {
    if (ALWAYS_PINNED.has(path)) return;
    const next = new Set(hidden);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setHidden(next);
  };

  const hideAll = () => {
    const next = new Set(hidden);
    for (const n of roleNav) if (!ALWAYS_PINNED.has(n.to)) next.add(n.to);
    setHidden(next);
  };
  const showAll = () => setHidden(new Set());

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await endpoints.userSetPermissions(user.id, {
        hiddenPaths: [...hidden],
        hiddenWidgets: [...hiddenWidgets],
        scopeStudentId: isStudent ? scopeStudentId || null : undefined,
      });
      onSaved();
    } catch (err) {
      onError(err?.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleWidget = (id) => {
    const next = new Set(hiddenWidgets);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setHiddenWidgets(next);
  };

  const hiddenCount = [...hidden].filter((p) => !ALWAYS_PINNED.has(p)).length;
  const hiddenWidgetCount = [...hiddenWidgets].filter((w) =>
    roleWidgets.some((rw) => rw.id === w)
  ).length;

  return (
    <ModalShell
      title={`Permissions — ${user.name}`}
      onClose={onClose}
      width="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/65">
          Hidden modules disappear from this user's sidebar. They can still be
          reached via Cmd+K and direct URL — pair with API role gating for
          hard restrictions. Role default is{" "}
          <span className="rounded-full bg-brand-500/15 px-1.5 py-0.5 text-brand-200">
            {ROLE_META[user.role]?.label || user.role}
          </span>{" "}
          ({roleNav.length} modules).
        </div>

        {isStudent && (
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/[0.06] p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-100">
              <Link2 size={14} /> Linked student record
            </div>
            <p className="mt-1 text-[11px] text-emerald-200/75">
              Scopes Timetable, Exams, Attendance and the Students directory
              to this student's grade and section.
            </p>
            <select
              value={scopeStudentId}
              onChange={(e) => setScopeStudentId(e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50"
            >
              <option value="">— auto (seed link / first student) —</option>
              {studentList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} · Grade {s.grade}-{s.section} · {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Dashboard widget visibility — financial widgets etc. */}
        {roleWidgets.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-white/55">
                Dashboard data
              </div>
              <div className="text-[11px] text-white/45">
                {hiddenWidgetCount > 0
                  ? `${hiddenWidgetCount} of ${roleWidgets.length} hidden`
                  : `${roleWidgets.length} visible by role default`}
              </div>
            </div>
            <p className="mt-1 text-[11px] text-white/50">
              Hide specific dashboard widgets (e.g. financial breakdowns)
              from this user. Widgets not allowed for the role aren't
              shown here at all.
            </p>
            <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {roleWidgets.map((w) => {
                const isHidden = hiddenWidgets.has(w.id);
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => toggleWidget(w.id)}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-xs transition ${
                      isHidden
                        ? "border-white/5 bg-white/[0.02] text-white/45"
                        : "border-emerald-400/20 bg-emerald-500/[0.06] text-white hover:bg-emerald-500/[0.10]"
                    }`}
                  >
                    <span className="flex-1 truncate">{w.label}</span>
                    <span className="font-mono text-[9px] text-white/35">
                      {w.id}
                    </span>
                    <span
                      className={`text-[10px] uppercase tracking-wider ${
                        isHidden ? "text-rose-300/70" : "text-emerald-300/70"
                      }`}
                    >
                      {isHidden ? "hidden" : "visible"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <div className="text-white/55">
            {hiddenCount > 0
              ? `${hiddenCount} of ${roleNav.length - 1} sidebar items hidden`
              : "Sidebar: full role default visible"}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={hideAll}
              className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/75 hover:bg-white/10"
            >
              Hide all
            </button>
            <button
              type="button"
              onClick={showAll}
              className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/75 hover:bg-white/10"
            >
              Show all
            </button>
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-white/5 bg-white/[0.02] p-2">
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {roleNav.map((n) => {
              const Icon = n.icon;
              const isHidden = hidden.has(n.to);
              const pinned = ALWAYS_PINNED.has(n.to);
              return (
                <button
                  key={n.to}
                  type="button"
                  onClick={() => toggle(n.to)}
                  disabled={pinned}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition ${
                    pinned
                      ? "cursor-not-allowed border-white/5 bg-white/[0.02] text-white/40"
                      : isHidden
                      ? "border-white/5 bg-white/[0.02] text-white/45 hover:border-white/15"
                      : "border-brand-400/20 bg-brand-500/[0.06] text-white hover:bg-brand-500/[0.12]"
                  }`}
                >
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${
                      isHidden || pinned
                        ? "bg-white/5 text-white/35"
                        : "bg-brand-500/20 text-brand-200"
                    }`}
                  >
                    <Icon size={12} />
                  </span>
                  <span className="flex-1 truncate">{n.label}</span>
                  {pinned && (
                    <span className="text-[10px] uppercase tracking-wider text-white/35">
                      pinned
                    </span>
                  )}
                  {!pinned && (
                    <span
                      className={`text-[10px] uppercase tracking-wider ${
                        isHidden ? "text-rose-300/70" : "text-emerald-300/70"
                      }`}
                    >
                      {isHidden ? "hidden" : "visible"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            {busy ? <Loader size={14} className="animate-spin" /> : <Check size={14} />}
            Save permissions
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ============ Shared modal shell ============

function ModalShell({ title, onClose, width = "md", children }) {
  const maxW = width === "lg" ? "max-w-2xl" : "max-w-lg";
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.98 }}
        onClick={(e) => e.stopPropagation()}
        className={`mt-12 w-full ${maxW} rounded-2xl border border-white/10 bg-[#0d0f24] p-5 shadow-2xl`}
      >
        <div className="mb-3 flex items-start justify-between">
          <h3 className="font-display text-lg font-semibold text-white">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-white/55 hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs uppercase tracking-wider text-white/55">
        {label}
      </span>
      {children}
    </label>
  );
}
