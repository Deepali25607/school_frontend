import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Upload,
  Database,
  ShieldCheck,
  Sparkles as SparklesIcon,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  User,
  Key,
  Bell,
  BellOff,
  Palette,
  SlidersHorizontal,
  Loader,
  Save,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Check,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { endpoints } from "../../lib/api.js";
import { PageHeader } from "./Students.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotificationPrefs } from "../../lib/useNotificationPrefs.js";
import { useSidebarPrefs } from "../../lib/useSidebarPrefs.js";
import { useTheme } from "../../lib/useTheme.js";
import CustomizeSidebar from "../../components/CustomizeSidebar.jsx";
import PhotoUploader from "../../components/PhotoUploader.jsx";
import { NAV } from "../../layouts/nav.js";

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="System"
        title="Settings"
        subtitle="Profile, notifications, appearance — and admin tools below"
      />

      {/* Available to every signed-in user */}
      <ProfileCard />
      <PasswordCard />
      <NotificationsCard />
      <AppearanceCard />

      {/* Admin-only system tools */}
      {isAdmin && (
        <>
          <div className="mt-6 flex items-center gap-2 text-xs uppercase tracking-wider text-white/45">
            <ShieldCheck size={12} />
            Admin tools
          </div>
          <BackupCard disabled={!isAdmin} />
          <RestoreCard disabled={!isAdmin} />
          <PlatformCard />
        </>
      )}

      {!isAdmin && (
        <div className="card flex items-start gap-3 text-white/55">
          <ShieldCheck size={18} className="mt-0.5 flex-shrink-0 text-amber-300" />
          <div className="text-sm">
            Backup, restore and platform tools are admin-only. Sign in as the
            Super Admin role to access them.
          </div>
        </div>
      )}
    </div>
  );
}

// ============ PROFILE ============

function ProfileCard() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState(null);

  const dirty =
    name !== user?.name ||
    phone !== (user?.phone || "") ||
    avatar !== user?.avatar ||
    photoUrl !== (user?.photoUrl || null);

  const onSave = async () => {
    setSaving(true);
    setErr(null);
    try {
      await endpoints.updateProfile({ name, phone, avatar, photoUrl });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/50";

  return (
    <SectionCard
      icon={User}
      iconTint="from-brand-500/30 to-accent-violet/30"
      title="Profile"
      subtitle="How your name appears across the app"
    >
      <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <PhotoUploader
          photoUrl={photoUrl}
          initials={avatar || "?"}
          onChange={setPhotoUrl}
          fallbackClass="from-brand-500 to-accent-pink"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[120px_1fr_1fr]">
        <Field label="Initials">
          <input
            maxLength={3}
            value={avatar}
            onChange={(e) => setAvatar(e.target.value.toUpperCase())}
            className={inputCls}
            placeholder="AB"
          />
        </Field>
        <Field label="Display name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Phone">
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-white/45" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9XXXXXXXXX"
              className={inputCls}
            />
          </div>
        </Field>
        <Field label="Email (read-only)" className="md:col-span-3">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/55">
            <Mail size={14} /> {user?.email}
            <span className="ml-auto rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-white/55 ring-1 ring-white/10">
              {user?.role}
            </span>
          </div>
        </Field>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {err && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs text-rose-200 ring-1 ring-rose-400/30">
            <AlertTriangle size={12} /> {err}
          </div>
        )}
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-300 ring-1 ring-emerald-400/30"
            >
              <Check size={12} /> Profile saved
            </motion.div>
          )}
        </AnimatePresence>
        <div className="ml-auto">
          <button
            disabled={!dirty || saving}
            onClick={onSave}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
            Save profile
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

// ============ PASSWORD ============

function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState(null);

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    if (next !== confirm) {
      setErr("New passwords don't match");
      return;
    }
    if (next.length < 6) {
      setErr("New password must be at least 6 characters");
      return;
    }
    setBusy(true);
    try {
      await endpoints.changePassword({
        currentPassword: current,
        newPassword: next,
      });
      setOk(true);
      reset();
      setTimeout(() => setOk(false), 4000);
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 pr-10 text-sm text-white outline-none focus:border-brand-400/50";

  return (
    <SectionCard
      icon={Key}
      iconTint="from-amber-500/30 to-orange-500/30"
      title="Password"
      subtitle="Change your sign-in password"
    >
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Field label="Current password">
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              autoComplete="current-password"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/45 hover:text-white"
            >
              {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </Field>
        <Field label="New password">
          <div className="relative">
            <input
              type={showNext ? "text" : "password"}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => setShowNext((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/45 hover:text-white"
            >
              {showNext ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </Field>
        <Field label="Confirm new password">
          <input
            type={showNext ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className={inputCls}
          />
        </Field>
        <div className="md:col-span-3 flex items-center gap-2">
          {err && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs text-rose-200 ring-1 ring-rose-400/30">
              <AlertTriangle size={12} /> {err}
            </div>
          )}
          <AnimatePresence>
            {ok && (
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-300 ring-1 ring-emerald-400/30"
              >
                <Check size={12} /> Password updated — use it next time you sign in
              </motion.div>
            )}
          </AnimatePresence>
          <button
            type="submit"
            disabled={busy}
            className="ml-auto inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow shadow-amber-500/20 disabled:opacity-50"
          >
            {busy ? <Loader size={14} className="animate-spin" /> : <Key size={14} />}
            Change password
          </button>
        </div>
      </form>
    </SectionCard>
  );
}

// ============ NOTIFICATIONS ============

function NotificationsCard() {
  const prefs = useNotificationPrefs();
  const mutedCount = prefs.muted.size;
  const totalCount = prefs.types.length;

  return (
    <SectionCard
      icon={mutedCount === totalCount ? BellOff : Bell}
      iconTint="from-accent-pink/30 to-accent-violet/30"
      title="Notifications"
      subtitle={`Pick which events show up in your bell. ${mutedCount}/${totalCount} muted.`}
    >
      <div className="mb-3 flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={prefs.unmuteAll}
          className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-white/75 hover:bg-white/10"
        >
          <Bell size={11} /> Subscribe to all
        </button>
        <button
          type="button"
          onClick={prefs.muteAll}
          className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-white/75 hover:bg-white/10"
        >
          <BellOff size={11} /> Mute all
        </button>
        <div className="ml-auto text-[11px] text-white/40">
          Stored on this device — not synced across browsers.
        </div>
      </div>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {prefs.types.map((t) => {
          const muted = prefs.isMuted(t.id);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => prefs.toggle(t.id)}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition ${
                muted
                  ? "border-white/5 bg-white/[0.02] text-white/45 hover:border-white/10"
                  : "border-brand-400/25 bg-brand-500/[0.06] text-white hover:bg-brand-500/15"
              }`}
            >
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${
                  muted ? "bg-white/5 text-white/35" : "bg-brand-500/20 text-brand-200"
                }`}
              >
                {muted ? <BellOff size={12} /> : <Bell size={12} />}
              </span>
              <span className="flex-1 truncate">{t.label}</span>
              <span className="font-mono text-[10px] text-white/35">{t.id}</span>
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ============ APPEARANCE ============

function AppearanceCard() {
  const { user } = useAuth();
  const sidebar = useSidebarPrefs();
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const roleAllowed = NAV.filter(
    (n) => n.roles === "*" || n.roles.includes(user?.role)
  );
  const hiddenCount = roleAllowed.filter((n) => sidebar.isHidden(n.to)).length;

  const themeOptions = [
    { id: "dark", label: "Dark", icon: Moon, hint: "Cosmic, low-glare" },
    { id: "light", label: "Light", icon: Sun, hint: "Bright, daytime" },
    { id: "system", label: "System", icon: Monitor, hint: "Follow OS setting" },
  ];

  return (
    <>
      <SectionCard
        icon={Palette}
        iconTint="from-accent-cyan/30 to-emerald-500/30"
        title="Appearance"
        subtitle="Theme & sidebar customisation"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <SparklesIcon size={14} className="text-accent-gold" />
                Theme
              </div>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/55 ring-1 ring-white/10">
                {theme.resolved}
              </span>
            </div>
            <div className="mt-2 text-xs text-white/55">
              Choose how Lumina looks. System matches your OS — flips automatically
              when day-mode kicks in.
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const active = theme.mode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => theme.setTheme(opt.id)}
                    className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs transition ${
                      active
                        ? "border-brand-400/40 bg-brand-500/15 text-white shadow shadow-brand-500/20"
                        : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06]"
                    }`}
                  >
                    <Icon size={16} className={active ? "text-brand-200" : "text-white/55"} />
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-[10px] text-white/45">{opt.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <SlidersHorizontal size={14} className="text-brand-300" />
                Sidebar
              </div>
              {hiddenCount > 0 && (
                <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-[10px] font-semibold text-brand-200 ring-1 ring-brand-400/30">
                  {hiddenCount} hidden
                </span>
              )}
            </div>
            <div className="mt-2 text-xs text-white/55">
              Hide modules you don't use to declutter the rail. Hidden items
              stay reachable via Ctrl+K and direct URL.
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-500 to-accent-violet px-3 py-1.5 text-xs font-semibold text-white"
            >
              <SlidersHorizontal size={12} /> Customize sidebar
            </button>
          </div>
        </div>
      </SectionCard>

      <AnimatePresence>
        {open && (
          <CustomizeSidebar
            navItems={roleAllowed}
            isHidden={sidebar.isHidden}
            isPinned={sidebar.isPinned}
            toggle={sidebar.toggle}
            hideAll={sidebar.hideAll}
            showAll={sidebar.showAll}
            reset={sidebar.reset}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ============ SHARED PRIMITIVES ============

function SectionCard({ icon: Icon, iconTint, title, subtitle, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="card relative overflow-hidden"
    >
      <div
        className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${iconTint} blur-3xl`}
      />
      <div className="relative">
        <div className="mb-4 flex items-start gap-3">
          <div
            className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${iconTint} ring-1 ring-white/10`}
          >
            <Icon size={18} />
          </div>
          <div>
            <div className="font-display text-lg font-semibold">{title}</div>
            {subtitle && (
              <p className="mt-0.5 text-sm text-white/60">{subtitle}</p>
            )}
          </div>
        </div>
        {children}
      </div>
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

// ============ ADMIN: BACKUP ============

function BackupCard({ disabled }) {
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState(null);
  const [err, setErr] = useState(null);

  const download = async () => {
    if (disabled) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await endpoints.backup();
      const blob =
        res.data instanceof Blob
          ? res.data
          : new Blob([JSON.stringify(res.data)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disp = res.headers?.["content-disposition"] || "";
      const match = disp.match(/filename="([^"]+)"/);
      a.download = match
        ? match[1]
        : `lumina-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setLast(new Date());
      setTimeout(() => setLast(null), 4000);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard
      icon={Download}
      iconTint="from-brand-500/25 to-accent-violet/25"
      title="Download backup"
      subtitle="Export every persisted collection as a single JSON file. Safe to archive."
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-xs text-white/55">
          Includes: students, admissions, exam marks, library, hostel, broadcasts,
          attendance, events, inventory, leave, and more.
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {last && (
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-300 ring-1 ring-emerald-400/30"
              >
                <CheckCircle2 size={14} /> Downloaded
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={download}
            disabled={busy || disabled}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            {busy ? "Preparing…" : "Download"}
            {!busy && <Download size={14} />}
          </button>
        </div>
      </div>
      {err && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-400/30">
          <AlertTriangle size={14} className="mt-0.5" />
          {err}
        </div>
      )}
    </SectionCard>
  );
}

// ============ ADMIN: RESTORE ============

function RestoreCard({ disabled }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);
  const [preview, setPreview] = useState(null);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setResult(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const data = parsed.data || parsed;
      setPreview({
        file: file.name,
        size: file.size,
        collections: Object.keys(data),
      });
    } catch (e) {
      setErr("Invalid JSON file: " + e.message);
      setPreview(null);
    }
  };

  const restore = async () => {
    if (!fileRef.current?.files?.[0] || disabled) return;
    setBusy(true);
    setErr(null);
    setResult(null);
    try {
      const text = await fileRef.current.files[0].text();
      const parsed = JSON.parse(text);
      const res = await endpoints.restore(parsed);
      setResult(res);
      setPreview(null);
      fileRef.current.value = "";
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard
      icon={Upload}
      iconTint="from-accent-pink/25 to-accent-gold/25"
      title="Restore from backup"
      subtitle="Replace every collection with the contents of an uploaded JSON file"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={onFile}
          disabled={disabled}
          className="block w-full max-w-md text-sm text-white/80 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-white/15 disabled:opacity-50"
        />
        <button
          onClick={restore}
          disabled={busy || !preview || disabled}
          className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
        >
          {busy ? "Restoring…" : "Restore"}
          {!busy && <Upload size={14} />}
        </button>
      </div>

      {preview && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm"
        >
          <div className="flex items-center gap-2 text-white/80">
            <FileJson size={14} className="text-accent-gold" />
            <span className="font-semibold">{preview.file}</span>
            <span className="text-xs text-white/55">
              ({(preview.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {preview.collections.map((c) => (
              <span
                key={c}
                className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70"
              >
                {c}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-200"
        >
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 size={14} /> Restored {result.restored} collections
          </div>
          <div className="mt-1 text-xs text-emerald-200/75">{result.hint}</div>
        </motion.div>
      )}

      {err && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-start gap-2 rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-400/30"
        >
          <AlertTriangle size={14} className="mt-0.5" /> {err}
        </motion.div>
      )}
    </SectionCard>
  );
}

// ============ ADMIN: PLATFORM ============

function PlatformCard() {
  const meta = [
    { label: "API base URL", value: import.meta.env.VITE_API_URL || "(same origin)" },
    { label: "Build mode", value: import.meta.env.MODE },
    { label: "Frontend version", value: "Lumina · 1.0" },
  ];
  return (
    <SectionCard
      icon={Database}
      iconTint="from-accent-cyan/20 to-emerald-500/20"
      title="Platform"
      subtitle="Runtime info for this build"
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {meta.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
          >
            <div className="text-[10px] uppercase tracking-wider text-white/55">
              {m.label}
            </div>
            <div className="mt-0.5 font-display text-sm font-semibold">
              {m.value}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
