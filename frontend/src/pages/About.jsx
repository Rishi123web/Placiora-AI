import MainLayout from "../layouts/MainLayout.jsx"

import {
  Sparkles,
  Brain,
  Code2,
  Users,
  Mail,
  ShieldCheck,
  Rocket,
  MapPin,
  Share2,
  HeartHandshake
} from "lucide-react"

function About() {
  const handleMouseMove = (e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()

    card.style.setProperty("--x", `${e.clientX - rect.left}px`)
    card.style.setProperty("--y", `${e.clientY - rect.top}px`)
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8 page-fade">
        <section
          onMouseMove={handleMouseMove}
          className="glow-card relative overflow-hidden rounded-[3rem] border border-cyan-400/20 bg-slate-950/90 p-8 shadow-[0_0_120px_rgba(34,211,238,0.12)]"
        >
          <div className="absolute -top-32 -right-32 w-[520px] h-[520px] bg-cyan-500/20 rounded-full blur-[140px]" />
          <div className="absolute -bottom-40 -left-40 w-[520px] h-[520px] bg-purple-600/20 rounded-full blur-[140px]" />
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(34,211,238,0.16),transparent_35%)]" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 text-cyan-300 mb-4 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20">
              <Sparkles size={16} />
              About Placiora AI
            </div>

            <h1 className="text-4xl lg:text-5xl font-black text-white text-glow">
              Your Personal Placement Copilot
            </h1>

            <p className="text-slate-400 mt-5 leading-8 max-w-5xl">
              Placiora AI is made for students who want one complete place for
              placement preparation — interviews, coding rounds, aptitude,
              resume, GD, HR, system design and company readiness. The goal is
              simple: help every student practice smarter, improve faster and
              feel more confident before real placements.
            </p>

            <p className="text-cyan-300 mt-5 leading-8 max-w-5xl">
              If you find Placiora AI useful, share it with your friends,
              classmates and placement group. Your support and feedback will
              help make this platform better for everyone preparing for
              internships and placements.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <InfoCard
            icon={Brain}
            title="AI Interview"
            text="Practice role-based and company-specific interviews with instant AI feedback."
          />

          <InfoCard
            icon={Code2}
            title="Coding Prep"
            text="Solve coding questions, debug mistakes and improve your logic step by step."
          />

          <InfoCard
            icon={Users}
            title="Placement Ready"
            text="Prepare for GD, HR, aptitude, resume screening and mock placement drives."
          />
        </div>

        <section
          onMouseMove={handleMouseMove}
          className="glow-card rounded-[2.5rem] border border-cyan-400/10 bg-slate-950/70 p-8"
        >
          <h2 className="text-3xl font-bold text-white mb-5">
            What Placiora AI Helps With
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "AI Interview",
              "Live Interview",
              "Coding Round",
              "Aptitude",
              "Resume Analyzer",
              "GD Round",
              "HR Round",
              "Placement Predictor"
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center text-cyan-300"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section
          onMouseMove={handleMouseMove}
          className="glow-card rounded-[2.5rem] border border-purple-400/20 bg-purple-500/10 p-8"
        >
          <h2 className="text-3xl font-bold text-white mb-5">
            Support The Platform
          </h2>

          <div className="space-y-4 text-slate-300">
            <p className="flex items-center gap-3">
              <Share2 className="text-cyan-300" />
              Share Placiora AI with your friends, classmates and college
              placement groups.
            </p>

            <p className="flex items-center gap-3">
              <HeartHandshake className="text-cyan-300" />
              Your feedback and support will help improve features, design and
              AI accuracy.
            </p>

            <p className="flex items-center gap-3">
              <Mail className="text-cyan-300" />
              For issues or suggestions: placiora.support@gmail.com
            </p>

            <p className="flex items-center gap-3">
              <MapPin className="text-cyan-300" />
              Kolkata, India
            </p>

            <p className="flex items-center gap-3">
              <ShieldCheck className="text-cyan-300" />
              Version v2.0 Ultimate
            </p>

            <p className="flex items-center gap-3">
              <Rocket className="text-cyan-300" />
              Built for students, interview preparation and placement success.
            </p>
          </div>
        </section>
      </div>
    </MainLayout>
  )
}

function InfoCard({ icon: Icon, title, text }) {
  return (
    <div className="glow-card rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-6 hover:border-cyan-300/30">
      <Icon size={34} className="text-cyan-300 mb-4" />
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="text-slate-400 mt-3 leading-7">{text}</p>
    </div>
  )
}

export default About
