import { useNavigate } from "react-router-dom"
import {
  ArrowRight,
  Sparkles,
  Brain,
  Code2,
  FileText,
  Users,
  Trophy,
  ShieldCheck,
  PlayCircle
} from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "AI Interviews",
    text: "Practice technical, HR and company-specific interviews with AI feedback."
  },
  {
    icon: Code2,
    title: "Coding Round",
    text: "Solve coding problems, debug errors and improve logic with Sifra."
  },
  {
    icon: FileText,
    title: "Resume Analyzer",
    text: "Improve ATS score, skills, projects and recruiter-readiness."
  },
  {
    icon: Users,
    title: "GD & HR Prep",
    text: "Prepare for group discussions, HR rounds and communication skills."
  },
  {
    icon: Trophy,
    title: "Mock Placement",
    text: "Simulate a complete placement drive from aptitude to interview."
  },
  {
    icon: ShieldCheck,
    title: "Placement Readiness",
    text: "Track your preparation level and weak areas in one dashboard."
  }
]

function LandingPage() {
  const navigate = useNavigate()

  const handleGlowMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`)
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[650px] h-[650px] rounded-full bg-cyan-500/20 blur-[150px]" />
        <div className="absolute -bottom-40 -left-40 w-[650px] h-[650px] rounded-full bg-purple-600/20 blur-[150px]" />
        <div className="absolute top-[35%] left-[35%] w-[420px] h-[420px] rounded-full bg-blue-500/10 blur-[130px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/95 to-black" />
      </div>

      <div className="relative z-10">
        <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/prep-logo.png"
              alt="Placiora AI Logo"
              className="w-14 h-14 rounded-2xl border border-cyan-400/30 shadow-[0_0_45px_rgba(34,211,238,0.35)]"
            />

            <div>
              <h1 className="text-2xl font-black text-white">
                Placiora AI
              </h1>
              <p className="text-xs text-cyan-300 uppercase tracking-[0.2em]">
                Your Personal Placement Copilot
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-3 rounded-2xl border border-white/10 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/30 transition"
            >
              Login
            </button>

            <button
              onClick={() => navigate("/signup")}
              className="glow-button px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-700 text-white font-semibold"
            >
              Get Started
            </button>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-6 pt-14 pb-20">
          <section
            onMouseMove={handleGlowMove}
            className="glow-card relative overflow-hidden rounded-[3.5rem] border border-cyan-400/20 bg-slate-950/90 p-8 md:p-14 shadow-[0_0_130px_rgba(34,211,238,0.14)]"
          >
            <div className="absolute -top-40 -right-40 w-[520px] h-[520px] bg-cyan-500/20 rounded-full blur-[140px]" />
            <div className="absolute -bottom-40 -left-40 w-[520px] h-[520px] bg-purple-600/20 rounded-full blur-[140px]" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 text-cyan-300 mb-6">
                  <Sparkles size={16} />
                  AI-powered placement preparation
                </div>

                <h2 className="text-5xl md:text-7xl font-black leading-tight text-white text-glow">
                  Crack Placements With Your AI Copilot
                </h2>

                <p className="text-slate-400 mt-6 leading-8 text-lg max-w-2xl">
                  Placiora AI helps students prepare for interviews, coding
                  rounds, aptitude tests, resumes, HR rounds, GD rounds and mock
                  placement drives in one futuristic platform.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <button
                    onClick={() => navigate("/signup")}
                    className="glow-button px-7 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-700 text-white font-bold flex items-center gap-2"
                  >
                    Start Preparing
                    <ArrowRight size={18} />
                  </button>

                  <button
                    onClick={() => navigate("/login")}
                    className="px-7 py-4 rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 hover:text-cyan-300 hover:border-cyan-400/30 transition flex items-center gap-2"
                  >
                    <PlayCircle size={18} />
                    Login
                  </button>
                </div>
              </div>

              <div
                onMouseMove={handleGlowMove}
                className="glow-card relative rounded-[3rem] border border-cyan-400/20 bg-white/[0.04] p-6 overflow-hidden"
              >
                <div className="absolute -top-28 -right-28 w-80 h-80 bg-cyan-500/20 rounded-full blur-[110px]" />

                <div className="relative z-10 space-y-4">
                  <DemoRow label="AI Interview Score" value="92%" />
                  <DemoRow label="Resume ATS Score" value="86%" />
                  <DemoRow label="Coding Accuracy" value="78%" />
                  <DemoRow label="Placement Readiness" value="Excellent" />
                </div>
              </div>
            </div>
          </section>

          <section className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-5">
            <Stat number="500+" label="Questions" />
            <Stat number="50+" label="Companies" />
            <Stat number="15+" label="Modes" />
            <Stat number="24/7" label="Sifra AI Coach" />
          </section>

          <section className="mt-16">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-black text-white text-glow">
                Everything You Need For Placements
              </h2>
              <p className="text-slate-400 mt-3">
                One platform. Multiple preparation modes. Smarter progress.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {features.map((feature) => (
                <FeatureCard
                  key={feature.title}
                  {...feature}
                  onMouseMove={handleGlowMove}
                />
              ))}
            </div>
          </section>

          <section
            onMouseMove={handleGlowMove}
            className="glow-card mt-16 rounded-[3rem] border border-purple-400/20 bg-purple-500/10 p-8 md:p-12 text-center"
          >
            <h2 className="text-4xl font-black text-white">
              Ready to become placement-ready?
            </h2>

            <p className="text-slate-400 mt-4 max-w-2xl mx-auto leading-7">
              Start your preparation with Placiora AI and let Sifra guide you
              through interviews, coding, resume improvement and career
              readiness.
            </p>

            <button
              onClick={() => navigate("/signup")}
              className="glow-button mt-8 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-700 text-white font-bold inline-flex items-center gap-2"
            >
              Create Free Account
              <ArrowRight size={18} />
            </button>
          </section>
        </main>
      </div>
    </div>
  )
}

function DemoRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 flex items-center justify-between">
      <span className="text-slate-400">{label}</span>
      <span className="text-cyan-300 font-black">{value}</span>
    </div>
  )
}

function Stat({ number, label }) {
  return (
    <div className="glow-card rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-6 text-center">
      <h3 className="text-4xl font-black text-cyan-300">{number}</h3>
      <p className="text-slate-400 mt-2">{label}</p>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, text, onMouseMove }) {
  return (
    <div
      onMouseMove={onMouseMove}
      className="glow-card relative overflow-hidden rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-6 hover:border-cyan-300/30"
    >
      <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-cyan-500/10 blur-[80px]" />

      <div className="relative z-10">
        <Icon className="text-cyan-300 mb-4" size={34} />
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-slate-400 mt-3 leading-7">{text}</p>
      </div>
    </div>
  )
}

export default LandingPage