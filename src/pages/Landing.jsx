import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles as SparklesIcon,
  GraduationCap,
  BookOpen,
  Wallet,
  Users,
  CalendarCheck,
  Bus,
  Library,
  BellRing,
  ShieldCheck,
  ArrowRight,
  Star,
} from "lucide-react";
import Sparkles from "../components/fx/Sparkles.jsx";
import Aurora from "../components/fx/Aurora.jsx";
import Hero3D from "../components/fx/Hero3D.jsx";
import LogoOrb3D from "../components/fx/LogoOrb3D.jsx";

const FEATURES = [
  { icon: GraduationCap, title: "Admissions & Records", text: "End-to-end student lifecycle from enquiry to alumni." },
  { icon: CalendarCheck, title: "Smart Attendance", text: "Biometric, RFID, and AI face-recognition ready." },
  { icon: Wallet, title: "Fees & Payments", text: "Online payments, receipts, scholarships, and reminders." },
  { icon: BookOpen, title: "Academics", text: "Timetables, exams, results, grading and report cards." },
  { icon: Users, title: "Staff & Payroll", text: "HR, payroll, payslips, leave and performance tracking." },
  { icon: Library, title: "Library", text: "Barcoded inventory, reservations and digital catalog." },
  { icon: Bus, title: "Transport", text: "Routes, GPS tracking and parent pickup notifications." },
  { icon: BellRing, title: "Communication", text: "SMS, email and push notifications across the school." },
  { icon: ShieldCheck, title: "Security", text: "RBAC, audit logs, 2FA and encrypted backups." },
];

const ROLES = [
  { name: "Admin", color: "from-brand-500 to-accent-violet" },
  { name: "Teacher", color: "from-accent-cyan to-brand-400" },
  { name: "Student", color: "from-accent-mint to-accent-cyan" },
  { name: "Parent", color: "from-accent-pink to-accent-violet" },
  { name: "Accountant", color: "from-accent-gold to-accent-pink" },
  { name: "HR", color: "from-accent-violet to-brand-600" },
];

const STATS = [
  { k: "98%", v: "Fee collection rate" },
  { k: "10k+", v: "Active learners" },
  { k: "23", v: "Integrated modules" },
  { k: "99.9%", v: "Uptime SLA" },
];

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06061a] text-white">
      {/* Top Nav */}
      <nav className="relative z-30 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-3">
          <LogoOrb3D size={42} />
          <div className="leading-tight">
            <div className="font-display text-xl font-bold tracking-tight">
              Lumina<span className="text-accent-pink">.</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">
              School Management OS
            </div>
          </div>
        </Link>
        <div className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#roles" className="hover:text-white">For Everyone</a>
          <a href="#modules" className="hover:text-white">Modules</a>
          <a href="#cta" className="hover:text-white">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost px-4 py-2 text-sm">Sign in</Link>
          <Link to="/login" className="btn-primary px-4 py-2 text-sm">
            Launch app <ArrowRight size={16} />
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative">
        <Aurora />
        <div className="absolute inset-0 -z-0 h-[80vh]">
          <Hero3D />
        </div>
        <Sparkles count={28} />

        <div className="relative z-20 mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <div className="chip mb-5">
              <SparklesIcon size={14} className="text-accent-gold" />
              The complete school OS · v1.0
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              Run your school like a{" "}
              <span className="glow-text">galaxy of light.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/70 md:text-xl">
              Lumina unifies admissions, academics, attendance, finance, payroll,
              transport, hostel and communication in one beautifully crafted
              platform — built for administrators, teachers, students and parents.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/login" className="btn-primary">
                Get started free <ArrowRight size={18} />
              </Link>
              <a href="#features" className="btn-ghost">
                Explore features
              </a>
              <div className="ml-2 flex items-center gap-2 text-sm text-white/60">
                <div className="flex">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star
                      key={i}
                      size={14}
                      className="text-accent-gold"
                      fill="currentColor"
                    />
                  ))}
                </div>
                Loved by 400+ schools
              </div>
            </div>

            {/* Stat row */}
            <div className="mt-12 grid grid-cols-2 gap-4 sm:max-w-2xl sm:grid-cols-4">
              {STATS.map((s, i) => (
                <motion.div
                  key={s.v}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.6 }}
                  className="glass-card p-4"
                >
                  <div className="glow-text font-display text-2xl font-bold">
                    {s.k}
                  </div>
                  <div className="text-xs text-white/60">{s.v}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 max-w-2xl">
          <div className="chip mb-4">
            <SparklesIcon size={14} className="text-accent-pink" />
            One platform · 23 modules
          </div>
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Every workflow your school needs,{" "}
            <span className="glow-text">in one place.</span>
          </h2>
          <p className="mt-4 text-white/70">
            From the first admission enquiry to the last alumni letter — Lumina
            tracks it, automates it, and lights it up.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: i * 0.05, duration: 0.55 }}
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden"
            >
              <div className="glass-card relative h-full p-6">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-brand-500/30 to-accent-pink/30 blur-2xl transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/30 to-accent-violet/30 ring-1 ring-white/15">
                    <f.icon size={22} className="text-white" />
                  </div>
                  <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-white/65">{f.text}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="chip mb-4">
              <SparklesIcon size={14} className="text-accent-cyan" />
              Role-based workspaces
            </div>
            <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
              Tailored to <span className="glow-text">every person</span> in
              your school.
            </h2>
          </div>
          <Link to="/login" className="btn-ghost">
            Try any role <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {ROLES.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className="relative overflow-hidden rounded-2xl border border-white/10 p-[1px]"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${r.color} opacity-50`}
              />
              <div className="relative rounded-2xl bg-[#0a0a1a] p-5">
                <div className="font-display text-lg font-semibold">{r.name}</div>
                <div className="mt-1 text-xs text-white/60">Dedicated portal</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-700/40 via-accent-violet/30 to-accent-pink/30 p-10 md:p-16">
          <Sparkles count={20} />
          <div className="relative z-10 grid grid-cols-1 items-center gap-8 md:grid-cols-2">
            <div>
              <h3 className="font-display text-3xl font-bold leading-tight md:text-5xl">
                Bring your school <span className="glow-text">into the light.</span>
              </h3>
              <p className="mt-4 max-w-md text-white/80">
                Launch the demo workspace in seconds. Pick any role to step
                inside the experience.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/login" className="btn-primary">
                  Launch demo <ArrowRight size={18} />
                </Link>
                <a href="#features" className="btn-ghost">
                  Learn more
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {["No setup", "Mobile + Web", "Multi-school", "RBAC"].map((t) => (
                <div key={t} className="glass-card p-4 text-sm">
                  <div className="text-white/60">Included</div>
                  <div className="font-display font-semibold">{t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8 text-center text-sm text-white/50">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 md:flex-row">
          <div>© 2026 Lumina · School Management OS</div>
          <div className="flex gap-5">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
