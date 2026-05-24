import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Search,
  LogOut,
  Settings,
  Sparkles as SparklesIcon,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import LogoOrb3D from "../components/fx/LogoOrb3D.jsx";
import Aurora from "../components/fx/Aurora.jsx";
import Sparkles from "../components/fx/Sparkles.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { cn } from "../lib/cn.js";
import { useRealtimeStatus } from "../lib/useRealtime.js";
import { useNotifications } from "../lib/useNotifications.js";
import { useSidebarPrefs } from "../lib/useSidebarPrefs.js";
import NotificationsPanel from "../components/NotificationsPanel.jsx";
import CommandPalette from "../components/CommandPalette.jsx";
import CustomizeSidebar from "../components/CustomizeSidebar.jsx";
import Avatar from "../components/Avatar.jsx";
import { NAV } from "./nav.js";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteSeed, setPaletteSeed] = useState("");
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const bellRef = useRef(null);
  const rt = useRealtimeStatus();
  const { unreadCount } = useNotifications(30);
  const sidebarPrefs = useSidebarPrefs();

  // Global Cmd+K / Ctrl+K shortcut to open the command palette.
  // Suppressed when typing in another input to avoid hijacking text fields.
  useEffect(() => {
    const onKey = (e) => {
      const isShortcut = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (!isShortcut) return;
      // Only hijack if the user isn't actively editing text elsewhere
      e.preventDefault();
      setPaletteSeed("");
      setPaletteOpen(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Items the user's role grants access to — basis for the Customize modal.
  const roleAllowedNav = NAV.filter(
    (n) => n.roles === "*" || n.roles.includes(user?.role)
  );
  // Items actually rendered in the rail — drops anything the user has hidden.
  const visibleNav = roleAllowedNav.filter((n) => !sidebarPrefs.isHidden(n.to));
  const hiddenCount = roleAllowedNav.length - visibleNav.length;

  const onLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#06061a] text-white">
      <Aurora />

      {/* Sidebar */}
      <motion.aside
        animate={{ width: open ? 270 : 84 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="relative z-20 hidden h-screen flex-col border-r border-white/10 bg-[#08081d]/80 backdrop-blur md:flex"
      >
        <div className="flex items-center gap-3 p-4">
          <LogoOrb3D size={40} />
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="leading-tight"
              >
                <div className="font-display text-lg font-bold">
                  Lumina<span className="text-accent-pink">.</span>
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                  School OS
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="mx-3 mb-3 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 py-1.5 text-white/60 hover:bg-white/10"
          aria-label="Toggle sidebar"
        >
          <ChevronRight
            size={16}
            className={cn("transition-transform", open && "rotate-180")}
          />
        </button>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-3">
          {visibleNav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                  isActive
                    ? "bg-gradient-to-r from-brand-500/30 to-accent-violet/20 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-xl ring-1 ring-white/15"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <n.icon size={18} />
                  <AnimatePresence>
                    {open && (
                      <motion.span
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        className="font-medium"
                      >
                        {n.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={() => setCustomizeOpen(true)}
            className="mb-2 flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-xs text-white/65 transition-all hover:bg-white/10 hover:text-white"
            title="Show or hide modules in the sidebar"
          >
            <SlidersHorizontal size={14} className="shrink-0" />
            <AnimatePresence>
              {open && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  className="flex-1 truncate"
                >
                  Customize sidebar
                </motion.span>
              )}
            </AnimatePresence>
            {open && hiddenCount > 0 && (
              <span className="shrink-0 rounded-full bg-brand-500/20 px-2 py-0.5 text-[10px] font-semibold text-brand-200 ring-1 ring-brand-400/30">
                {hiddenCount} hidden
              </span>
            )}
          </button>
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5">
            <Avatar
              photoUrl={user?.photoUrl}
              initials={user?.avatar || "U"}
              size={36}
              fallbackClass="from-brand-500 to-accent-pink"
            />
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="min-w-0 flex-1"
                >
                  <div className="truncate text-sm font-semibold">
                    {user?.name}
                  </div>
                  <div className="truncate text-[11px] uppercase tracking-wider text-white/50">
                    {user?.role}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={onLogout}
              className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main */}
      <main className="relative z-10 flex h-screen flex-1 flex-col overflow-y-auto">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-white/10 bg-[#06061a]/80 px-5 py-3 backdrop-blur-xl">
          <div className="flex flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setPaletteSeed("");
                setPaletteOpen(true);
              }}
              className="group flex w-full max-w-md items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left transition-all hover:border-white/20 hover:bg-white/10"
              aria-label="Open search"
            >
              <Search size={16} className="text-white/50 group-hover:text-white/70" />
              <span className="flex-1 text-sm text-white/40 group-hover:text-white/55">
                Search students, teachers, documents, books…
              </span>
              <span className="hidden rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/55 md:inline">
                ⌘K
              </span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                ref={bellRef}
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                className={cn(
                  "relative rounded-xl border border-white/10 bg-white/5 p-2 transition-all hover:bg-white/10",
                  notifOpen && "bg-white/10 ring-1 ring-white/20"
                )}
                title="Notifications"
                aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent-pink px-1 text-[9px] font-bold text-white shadow-glow-pink ring-2 ring-[#06061a]"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </motion.span>
                )}
              </button>
              <NotificationsPanel
                open={notifOpen}
                anchorRef={bellRef}
                onClose={() => setNotifOpen(false)}
              />
            </div>
            <Link
              to="/app/settings"
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/85 hover:bg-white/10 hover:text-white"
              title="Settings"
              aria-label="Open settings"
            >
              <Settings size={16} />
            </Link>
            <div
              className={`hidden items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-medium md:flex ${
                rt.connected
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                  : "border-rose-400/30 bg-rose-500/10 text-rose-300"
              }`}
              title={
                rt.connected
                  ? "Realtime stream connected"
                  : "Realtime stream disconnected — reconnecting…"
              }
            >
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    rt.connected ? "animate-ping bg-emerald-300" : "bg-rose-300"
                  }`}
                />
                <span
                  className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                    rt.connected ? "bg-emerald-300" : "bg-rose-300"
                  }`}
                />
              </span>
              {rt.connected ? "LIVE" : "OFFLINE"}
            </div>
            <div className="ml-2 hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 md:flex">
              <SparklesIcon size={14} className="text-accent-gold" />
              <span className="text-xs text-white/70">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Page */}
        <div className="relative px-5 py-6 md:px-8 md:py-8">
          <Sparkles count={8} />
          <Outlet />
        </div>
      </main>

      {/* Cmd+K command palette — mounted at the layout level so every page
          inherits the global search shortcut. */}
      <CommandPalette
        open={paletteOpen}
        initialQuery={paletteSeed}
        onClose={() => setPaletteOpen(false)}
      />

      <AnimatePresence>
        {customizeOpen && (
          <CustomizeSidebar
            navItems={roleAllowedNav}
            isHidden={sidebarPrefs.isHidden}
            isPinned={sidebarPrefs.isPinned}
            toggle={sidebarPrefs.toggle}
            hideAll={sidebarPrefs.hideAll}
            showAll={sidebarPrefs.showAll}
            reset={sidebarPrefs.reset}
            onClose={() => setCustomizeOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
