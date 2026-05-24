import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  GraduationCap,
  Users,
  Heart,
  Calculator,
  Briefcase,
  Crown,
  Lock,
  Mail,
  ArrowRight,
  Sparkles as SparklesIcon,
  AlertTriangle,
} from "lucide-react";
import Sparkles from "../components/fx/Sparkles.jsx";
import Aurora from "../components/fx/Aurora.jsx";
import LogoOrb3D from "../components/fx/LogoOrb3D.jsx";
import { useAuth, ROLE_EMAILS, DEMO_PASSWORD } from "../context/AuthContext.jsx";

const ROLE_CARDS = [
  { key: "admin", label: "Super Admin", icon: Shield, color: "from-brand-500 to-accent-violet" },
  { key: "principal", label: "Principal", icon: Crown, color: "from-accent-violet to-accent-pink" },
  { key: "teacher", label: "Teacher", icon: GraduationCap, color: "from-accent-cyan to-brand-500" },
  { key: "student", label: "Student", icon: Users, color: "from-accent-mint to-accent-cyan" },
  { key: "parent", label: "Parent", icon: Heart, color: "from-accent-pink to-accent-violet" },
  { key: "accountant", label: "Accountant", icon: Calculator, color: "from-accent-gold to-accent-pink" },
  { key: "hr", label: "HR Staff", icon: Briefcase, color: "from-brand-400 to-accent-violet" },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState("admin");
  const [email, setEmail] = useState(ROLE_EMAILS.admin);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const pickRole = (r) => {
    setSelectedRole(r);
    setEmail(ROLE_EMAILS[r]);
    setErr(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await login({ email, password });
      navigate("/app");
    } catch (e) {
      setErr(e?.response?.data?.error || e.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06061a] text-white">
      <Aurora />
      <Sparkles count={32} />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-3">
          <LogoOrb3D size={42} />
          <div className="leading-tight">
            <div className="font-display text-lg font-bold tracking-tight">
              Lumina<span className="text-accent-pink">.</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">
              School Management OS
            </div>
          </div>
        </Link>
        <Link to="/" className="btn-ghost px-4 py-2 text-sm">
          ← Back home
        </Link>
      </header>

      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-start gap-10 px-6 pb-16 pt-6 lg:grid-cols-[1.1fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="chip mb-4">
            <SparklesIcon size={14} className="text-accent-gold" />
            Step into your portal
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Choose your <span className="glow-text">role.</span>
          </h1>
          <p className="mt-3 max-w-md text-white/65">
            Each role unlocks a tailored workspace. Pick one to autofill the
            demo account — or sign in with your own credentials.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ROLE_CARDS.map((r) => {
              const Icon = r.icon;
              const active = selectedRole === r.key;
              return (
                <motion.button
                  key={r.key}
                  type="button"
                  onClick={() => pickRole(r.key)}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative overflow-hidden rounded-2xl p-[1px] text-left"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${r.color} transition-opacity ${
                      active ? "opacity-90" : "opacity-30 group-hover:opacity-70"
                    }`}
                  />
                  <div
                    className={`relative rounded-2xl p-4 transition-all ${
                      active
                        ? "bg-[#0c0c22] shadow-glow"
                        : "bg-[#0a0a1a] hover:bg-[#0c0c22]"
                    }`}
                  >
                    <Icon size={22} className={active ? "text-white" : "text-white/70"} />
                    <div className="mt-3 font-display text-sm font-semibold">
                      {r.label}
                    </div>
                    <div className="text-[11px] text-white/50">
                      {ROLE_EMAILS[r.key]}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="glass-card relative overflow-hidden p-8"
        >
          <Sparkles count={10} />
          <div className="relative z-10">
            <div className="mb-1 text-xs uppercase tracking-[0.2em] text-white/50">
              Signing in as
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedRole}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="font-display text-2xl font-bold"
              >
                {ROLE_CARDS.find((r) => r.key === selectedRole)?.label}
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 space-y-4">
              <Field icon={Mail} label="Email" value={email} onChange={setEmail} type="email" />
              <Field icon={Lock} label="Password" value={password} onChange={setPassword} type="password" />

              {err && (
                <div className="flex items-start gap-2 rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-400/30">
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                  <span>{err}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-white/70">
                  <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-white/10" />
                  Remember me
                </label>
                <a href="#" className="text-brand-300 hover:text-white">
                  Forgot password?
                </a>
              </div>

              <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
                {busy ? "Authenticating…" : "Enter workspace"}{" "}
                {!busy && <ArrowRight size={18} />}
              </button>

              <div className="text-center text-xs text-white/50">
                Protected by JWT · audit-logged · role-based access
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-[11px] text-white/55">
                <span className="font-semibold text-white/80">Demo:</span> all
                role accounts use password{" "}
                <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono">
                  {DEMO_PASSWORD}
                </code>
              </div>
            </div>
          </div>
        </motion.form>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs uppercase tracking-[0.18em] text-white/55">
        {label}
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-colors focus-within:border-brand-400/60 focus-within:bg-white/10">
        <Icon size={16} className="text-white/60" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-white outline-none placeholder:text-white/40"
          required
        />
      </div>
    </label>
  );
}
