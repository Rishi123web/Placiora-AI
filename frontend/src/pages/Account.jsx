import MainLayout from "../layouts/MainLayout.jsx"
import API_BASE from "../config/api"

import {
  User,
  Mail,
  Shield,
  Settings,
  LogOut,
  HelpCircle,
  Sparkles
} from "lucide-react"

function Account() {
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  const logout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    window.location.href = "/login"
  }

  const loginWithGoogle = () => {
    window.location.href = `${API_BASE}/api/oauth/google`
  }

  const loginWithEmail = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    window.location.href = "/login"
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8 page-fade">
        <section className="glow-card relative overflow-hidden rounded-[3rem] border border-cyan-400/20 bg-slate-950/90 p-8">
          <div className="absolute -top-32 -right-32 w-[520px] h-[520px] bg-cyan-500/20 rounded-full blur-[140px]" />
          <div className="absolute -bottom-40 -left-40 w-[520px] h-[520px] bg-purple-600/20 rounded-full blur-[140px]" />

          <div className="relative z-10 flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black shadow-[0_0_60px_rgba(34,211,238,0.35)]">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>

            <div>
              <div className="inline-flex items-center gap-2 text-cyan-300 mb-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20">
                <Sparkles size={16} />
                Account Center
              </div>

              <h1 className="text-5xl font-black text-white text-glow">
                Manage Account
              </h1>

              <p className="text-slate-400 mt-3">
                View your profile, login details, security and support options.
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <AccountCard
            icon={User}
            title="Name"
            value={user?.name || "User"}
          />

          <AccountCard
            icon={Mail}
            title="Email"
            value={user?.email || "No email found"}
          />

          <AccountCard
            icon={Shield}
            title="Security"
            value="Email / Google login available"
          />

          <AccountCard
            icon={Settings}
            title="Preferences"
            value="Theme and assistant settings enabled"
          />
        </div>

        <section className="glow-card rounded-[2.5rem] border border-cyan-400/10 bg-slate-950/70 p-8">
          <h2 className="text-3xl font-bold text-white mb-5">
            Login Options
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={loginWithGoogle}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-white hover:border-cyan-400/30 hover:bg-cyan-500/10 transition"
            >
              Continue with Google
            </button>

            <button
              type="button"
              onClick={loginWithEmail}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-white hover:border-cyan-400/30 hover:bg-cyan-500/10 transition"
            >
              Continue with Email / Password
            </button>
          </div>

          <p className="text-slate-500 text-sm mt-5">
            Google login is enabled. Facebook, LinkedIn and Instagram login are
            removed for a cleaner and stable login flow.
          </p>
        </section>

        <section className="glow-card rounded-[2.5rem] border border-purple-400/20 bg-purple-500/10 p-8">
          <h2 className="text-3xl font-bold text-white mb-5">
            Support
          </h2>

          <p className="text-slate-300 flex items-center gap-3 mb-4">
            <HelpCircle className="text-cyan-300" />
            For account issues, contact: arquad400@gmail.com
          </p>

          <button
            onClick={logout}
            className="px-6 py-4 rounded-2xl bg-red-500/10 text-red-300 border border-red-400/20 hover:bg-red-500/20 flex items-center gap-2"
          >
            <LogOut size={18} />
            Logout from this account
          </button>
        </section>
      </div>
    </MainLayout>
  )
}

function AccountCard({ icon: Icon, title, value }) {
  return (
    <div className="glow-card rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-6">
      <Icon size={30} className="text-cyan-300 mb-4" />

      <p className="text-slate-400">
        {title}
      </p>

      <h3 className="text-white text-xl font-bold mt-2 break-words">
        {value}
      </h3>
    </div>
  )
}

export default Account
