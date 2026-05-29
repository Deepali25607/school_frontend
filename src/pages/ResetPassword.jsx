import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Sparkles as SparklesIcon,
  KeyRound,
} from "lucide-react";
import Sparkles from "../components/fx/Sparkles.jsx";
import Aurora from "../components/fx/Aurora.jsx";
import LogoOrb3D from "../components/fx/LogoOrb3D.jsx";
import { endpoints } from "../lib/api.js";

export default function ResetPassword() {
  const params = useParams();
  const navigate = useNavigate();

  const [token, setToken] = useState(params.token || "");
  const [checking, setChecking] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [tokenError, setTokenError] = useState(null);

  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(false);

  // Validate the token when one is provided in the URL so the form can show
  // "valid for X" or "expired" before the user types a new password.
  useEffect(() => {
    if (!params.token) return;
    setChecking(true);
    setTokenError(null);
    endpoints
      .resetPasswordCheck(params.token)
      .then((res) => setTokenInfo(res))
      .catch((e) =>
        setTokenError(
          e?.response?.data?.error ||
            "This reset link is invalid or has expired."
        )
      )
      .finally(() => setChecking(false));
  }, [params.token]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    if (next !== confirm) {
      setErr("Passwords don't match");
      return;
    }
    if (next.length < 6) {
      setErr("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    try {
      await endpoints.resetPassword(token.trim(), next);
      setDone(true);
      setTimeout(() => navigate("/login"), 3500);
    } catch (e) {
      setErr(e?.response?.data?.error || e.message || "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06061a] text-white">
      <Aurora />
      <Sparkles count={28} />

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
        <Link to="/login" className="btn-ghost px-4 py-2 text-sm">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </header>

      <div className="relative z-10 mx-auto grid max-w-3xl place-items-center px-6 pb-16 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-card relative w-full overflow-hidden p-8"
        >
          <Sparkles count={8} />
          <div className="relative z-10">
            <div className="chip mb-4">
              <SparklesIcon size={14} className="text-accent-gold" />
              Set a new password
            </div>

            <AnimatePresence mode="wait">
              {done ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="text-center"
                >
                  <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/30">
                    <CheckCircle2 size={26} className="text-emerald-300" />
                  </div>
                  <h2 className="font-display text-2xl font-bold">
                    Password updated
                  </h2>
                  <p className="mt-2 text-white/65">
                    You can now sign in with your new password.
                  </p>
                  <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <Link to="/login" className="btn-primary px-5">
                      Sign in <ArrowRight size={16} />
                    </Link>
                  </div>
                  <div className="mt-3 text-xs text-white/45">
                    Redirecting in a few seconds…
                  </div>
                </motion.div>
              ) : tokenError ? (
                <motion.div
                  key="expired"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="text-center"
                >
                  <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-rose-500/20 ring-1 ring-rose-400/30">
                    <AlertTriangle size={26} className="text-rose-300" />
                  </div>
                  <h2 className="font-display text-2xl font-bold">
                    Link no longer valid
                  </h2>
                  <p className="mt-2 text-white/65">{tokenError}</p>
                  <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <Link to="/forgot-password" className="btn-primary px-5">
                      Request a new link <ArrowRight size={16} />
                    </Link>
                    <Link to="/login" className="btn-ghost px-5">
                      Back to sign in
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <h1 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
                    Choose a <span className="glow-text">new password</span>
                  </h1>
                  <p className="mt-2 max-w-md text-white/65">
                    {tokenInfo?.email ? (
                      <>
                        Resetting access for{" "}
                        <span className="text-white">{tokenInfo.email}</span>.
                      </>
                    ) : (
                      <>Paste the reset token from your email below.</>
                    )}
                  </p>

                  <form onSubmit={onSubmit} className="mt-6 space-y-4">
                    {!params.token && (
                      <label className="block">
                        <div className="mb-1 text-xs uppercase tracking-[0.18em] text-white/55">
                          Reset token
                        </div>
                        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-colors focus-within:border-brand-400/60 focus-within:bg-white/10">
                          <KeyRound size={16} className="text-white/60" />
                          <input
                            type="text"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            required
                            placeholder="Paste the token here"
                            className="w-full bg-transparent font-mono text-sm text-white outline-none placeholder:text-white/40"
                          />
                        </div>
                      </label>
                    )}

                    <label className="block">
                      <div className="mb-1 text-xs uppercase tracking-[0.18em] text-white/55">
                        New password
                      </div>
                      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-colors focus-within:border-brand-400/60 focus-within:bg-white/10">
                        <Lock size={16} className="text-white/60" />
                        <input
                          type={showPw ? "text" : "password"}
                          value={next}
                          onChange={(e) => setNext(e.target.value)}
                          required
                          minLength={6}
                          autoComplete="new-password"
                          autoFocus={!!params.token}
                          className="w-full bg-transparent text-white outline-none placeholder:text-white/40"
                          placeholder="At least 6 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((v) => !v)}
                          className="text-white/45 hover:text-white"
                        >
                          {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </label>

                    <label className="block">
                      <div className="mb-1 text-xs uppercase tracking-[0.18em] text-white/55">
                        Confirm password
                      </div>
                      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-colors focus-within:border-brand-400/60 focus-within:bg-white/10">
                        <Lock size={16} className="text-white/60" />
                        <input
                          type={showPw ? "text" : "password"}
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                          required
                          minLength={6}
                          autoComplete="new-password"
                          className="w-full bg-transparent text-white outline-none placeholder:text-white/40"
                          placeholder="Re-enter new password"
                        />
                      </div>
                    </label>

                    {err && (
                      <div className="flex items-start gap-2 rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-400/30">
                        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                        <span>{err}</span>
                      </div>
                    )}

                    {checking && (
                      <div className="text-center text-xs text-white/45">
                        Verifying token…
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={busy || checking}
                      className="btn-primary w-full disabled:opacity-60"
                    >
                      {busy ? "Updating…" : "Update password"}{" "}
                      {!busy && <ArrowRight size={18} />}
                    </button>

                    <div className="text-center text-xs text-white/50">
                      Reset tokens can only be used once and expire after 30
                      minutes.
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
