import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles as SparklesIcon,
} from "lucide-react";
import Sparkles from "../components/fx/Sparkles.jsx";
import Aurora from "../components/fx/Aurora.jsx";
import LogoOrb3D from "../components/fx/LogoOrb3D.jsx";
import { endpoints } from "../lib/api.js";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [sent, setSent] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await endpoints.forgotPassword(email.trim());
      setSent({
        email: email.trim(),
        devToken: res.devToken || null,
        expiresInMinutes: res.expiresInMinutes || 30,
      });
    } catch (e) {
      setErr(e?.response?.data?.error || e.message || "Request failed");
    } finally {
      setBusy(false);
    }
  };

  const goToReset = () => {
    if (sent?.devToken) navigate(`/reset-password/${sent.devToken}`);
    else navigate("/reset-password");
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
              Account recovery
            </div>

            <AnimatePresence mode="wait">
              {!sent ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <h1 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
                    Forgot your <span className="glow-text">password?</span>
                  </h1>
                  <p className="mt-2 max-w-md text-white/65">
                    Enter the email you sign in with and we'll send a reset
                    link. The link is good for 30 minutes.
                  </p>

                  <form onSubmit={onSubmit} className="mt-6 space-y-4">
                    <label className="block">
                      <div className="mb-1 text-xs uppercase tracking-[0.18em] text-white/55">
                        Email
                      </div>
                      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-colors focus-within:border-brand-400/60 focus-within:bg-white/10">
                        <Mail size={16} className="text-white/60" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoFocus
                          placeholder="you@school.edu"
                          className="w-full bg-transparent text-white outline-none placeholder:text-white/40"
                        />
                      </div>
                    </label>

                    {err && (
                      <div className="flex items-start gap-2 rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-400/30">
                        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                        <span>{err}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={busy}
                      className="btn-primary w-full disabled:opacity-60"
                    >
                      {busy ? "Sending…" : "Send reset link"}{" "}
                      {!busy && <ArrowRight size={18} />}
                    </button>

                    <div className="text-center text-xs text-white/50">
                      For security, we'll respond the same whether or not the
                      email is on file.
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="text-center"
                >
                  <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/30">
                    <CheckCircle2 size={26} className="text-emerald-300" />
                  </div>
                  <h2 className="font-display text-2xl font-bold">
                    Check your inbox
                  </h2>
                  <p className="mt-2 text-white/65">
                    If <span className="text-white">{sent.email}</span> matches
                    an account, we've sent a reset link.
                  </p>
                  <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/65">
                    <Clock size={12} /> Link expires in {sent.expiresInMinutes}{" "}
                    minutes
                  </div>

                  {sent.devToken && (
                    <div className="mt-6 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-left text-sm text-amber-100">
                      <div className="mb-1 flex items-center gap-2 font-semibold">
                        <Lock size={14} /> Demo mode
                      </div>
                      <p className="text-xs text-amber-100/85">
                        In a real deployment this link would arrive by email.
                        For local testing the token is:
                      </p>
                      <code className="mt-2 block break-all rounded-md bg-black/40 px-3 py-2 font-mono text-[11px] text-amber-200">
                        {sent.devToken}
                      </code>
                    </div>
                  )}

                  <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <button
                      type="button"
                      onClick={goToReset}
                      className="btn-primary px-5"
                    >
                      Continue to reset <ArrowRight size={16} />
                    </button>
                    <Link to="/login" className="btn-ghost px-5">
                      Back to sign in
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
