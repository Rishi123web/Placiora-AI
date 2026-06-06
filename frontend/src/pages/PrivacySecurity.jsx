import MainLayout from "../layouts/MainLayout.jsx"

import {
  Shield,
  Lock,
  UserCheck,
  Mail,
  Sparkles
} from "lucide-react"

function PrivacySecurity() {
  const handleGlowMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()

    e.currentTarget.style.setProperty(
      "--x",
      `${e.clientX - rect.left}px`
    )

    e.currentTarget.style.setProperty(
      "--y",
      `${e.clientY - rect.top}px`
    )
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8 page-fade">
        <section
          onMouseMove={handleGlowMove}
          className="glow-card relative overflow-hidden rounded-[3rem] border border-cyan-400/20 bg-slate-950/90 p-8 shadow-[0_0_120px_rgba(34,211,238,0.12)]"
        >
          <div className="absolute -top-32 -right-32 w-[520px] h-[520px] bg-cyan-500/20 rounded-full blur-[140px]" />

          <div className="absolute -bottom-40 -left-40 w-[520px] h-[520px] bg-purple-600/20 rounded-full blur-[140px]" />

          <div className="absolute top-1/3 left-1/2 w-[260px] h-[260px] bg-blue-500/10 rounded-full blur-[100px]" />

          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(34,211,238,0.16),transparent_35%)]" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 text-cyan-300 mb-4 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20">
              <Sparkles size={16} />
              Placiora AI Security Center
            </div>

            <h1 className="text-5xl font-black text-white text-glow">
              Privacy & Security
            </h1>

            <p className="text-slate-400 mt-4 max-w-3xl leading-8">
              Your interview data, coding submissions, resumes,
              placement analytics and account information remain
              protected inside Placiora AI.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card
            icon={Shield}
            title="Data Safety"
            text="Placiora AI stores only the information necessary for interview history, coding analytics, resume reports and placement preparation progress."
            onMouseMove={handleGlowMove}
          />

          <Card
            icon={Lock}
            title="Login Security"
            text="Your account is protected using authentication tokens and encrypted passwords. Never share your credentials with anyone."
            onMouseMove={handleGlowMove}
          />

          <Card
            icon={UserCheck}
            title="Account Control"
            text="You can manage your profile, logout anytime and control preferences through the account settings dashboard."
            onMouseMove={handleGlowMove}
          />

          <Card
            icon={Mail}
            title="Privacy Contact"
            text="For privacy concerns, account recovery or security issues contact: placiora.support@gmail.com"
            onMouseMove={handleGlowMove}
          />
        </div>

        <section
          onMouseMove={handleGlowMove}
          className="glow-card relative overflow-hidden rounded-[2.5rem] border border-purple-400/20 bg-purple-500/10 p-8"
        >
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-500/15 rounded-full blur-[120px]" />

          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-[120px]" />

          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-5">
              Security Recommendations
            </h2>

            <div className="space-y-4 text-slate-300 leading-8">
              <p>
                • Use a strong password containing letters, numbers and symbols.
              </p>

              <p>
                • Never share your login credentials with anyone.
              </p>

              <p>
                • Logout from shared computers after use.
              </p>

              <p>
                • Verify support emails come from official Placiora AI channels.
              </p>

              <p>
                • Report suspicious activity immediately to
                {" "}
                <span className="text-cyan-300">
                  placiora.support@gmail.com
                </span>
              </p>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  )
}

function Card({
  icon: Icon,
  title,
  text,
  onMouseMove
}) {
  return (
    <div
      onMouseMove={onMouseMove}
      className="glow-card relative overflow-hidden rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-6 hover:border-cyan-300/30"
    >
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-cyan-500/10 blur-[80px]" />

      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(34,211,238,0.14),transparent_40%)]" />

      <div className="relative z-10">
        <Icon
          className="text-cyan-300 mb-4"
          size={34}
        />

        <h2 className="text-2xl font-bold text-white">
          {title}
        </h2>

        <p className="text-slate-400 mt-3 leading-7">
          {text}
        </p>
      </div>
    </div>
  )
}

export default PrivacySecurity