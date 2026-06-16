import { NavLink } from "react-router-dom"

import {
  LayoutDashboard,
  Brain,
  FileText,
  History,
  Monitor,
  Code2,
  BrainCircuit,
  LogOut,
  Wand2,
  Star,
  GitBranch,
  Users,
  Lightbulb,
  Building2,
  ClipboardCheck,
  Trophy,
  Briefcase,
  MessageSquare,
  MessagesSquare,
  Sparkles,
  Settings,
  HelpCircle,
  Info,
  Award,
  X
} from "lucide-react"

function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  const sections = [
    {
      title: "Overview",
      items: [
        { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { name: "History", path: "/history", icon: History }
      ]
    },
    {
      title: "Interview Suite",
      items: [
        { name: "AI Interview", path: "/interview", icon: Brain },
        { name: "Live Interview", path: "/live-interview", icon: Monitor },
        { name: "HR Round", path: "/hr-round", icon: Users },
        { name: "GD Round", path: "/gd-round", icon: MessageSquare },
        { name: "Live GD Round", path: "/live-gd-round", icon: MessagesSquare },
        { name: "System Design", path: "/system-design", icon: GitBranch }
      ]
    },
    {
      title: "Assessment",
      items: [
        { name: "Coding Round", path: "/coding-round", icon: Code2 },
        { name: "Aptitude Round", path: "/aptitude", icon: BrainCircuit },
        { name: "OA Simulator", path: "/oa-assessment", icon: ClipboardCheck },
        { name: "Mock Placement", path: "/mock-placement", icon: Trophy }
      ]
    },
    {
      title: "Resume",
      items: [
        { name: "Resume Analyzer", path: "/resume", icon: FileText },
        { name: "Resume Builder", path: "/resume-builder", icon: Wand2 }
      ]
    },
    {
      title: "Career Intelligence",
      items: [
        { name: "Placement Readiness", path: "/placement-readiness", icon: Star },
        { name: "Skill Roadmap", path: "/skill-roadmap", icon: Lightbulb },
        { name: "Placement Predictor", path: "/placement-predictor", icon: Building2 },
        { name: "Recruiter Dashboard", path: "/recruiter-dashboard", icon: Briefcase },
        { name: "Certificate", path: "/certificate", icon: Award }
      ]
    },
    {
      title: "Platform",
      items: [
        { name: "Help Center", path: "/help", icon: HelpCircle },
        { name: "About Placiora AI", path: "/about", icon: Info }
      ]
    }
  ]

  const logout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    window.location.href = "/login"
  }

  const handleMouseMove = (e) => {
    const item = e.currentTarget
    const rect = item.getBoundingClientRect()

    item.style.setProperty("--x", `${e.clientX - rect.left}px`)
    item.style.setProperty("--y", `${e.clientY - rect.top}px`)
  }

  const handleNavClick = () => {
    if (window.innerWidth < 1024) onClose()
  }

  return (
    <aside
      className={`fixed lg:sticky top-0 left-0 z-[80] w-[86vw] max-w-[320px] lg:w-[292px] lg:max-w-none h-dvh lg:h-screen bg-[#020617]/95 border-r border-cyan-400/10 flex flex-col overflow-hidden transition-transform duration-300 ease-out ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
    >
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/3 -right-36 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-10 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl" />

      <div className="relative z-10 p-4 sm:p-5 border-b border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-cyan-400/30 blur-2xl" />

              <img
                src="/prep-logo.png"
                alt="Placiora AI"
                className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border border-cyan-400/30 shadow-[0_0_45px_rgba(34,211,238,0.35)]"
              />
            </div>

            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                Placiora AI
              </h1>

              <div className="flex items-center gap-1 text-cyan-300 text-[10px] sm:text-xs tracking-wide uppercase">
                <Sparkles size={12} />
                <span>Powered by Sifra</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="lg:hidden w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 flex items-center justify-center text-white"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-5 sidebar-scroll">
        <nav className="space-y-5 sm:space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="px-3 mb-2 sm:mb-3 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                {section.title}
              </p>

              <div className="space-y-2">
                {section.items.map((item) => {
                  const Icon = item.icon

                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      onClick={handleNavClick}
                      onMouseMove={handleMouseMove}
                      className={({ isActive }) =>
                        `group relative overflow-hidden flex items-center gap-3 px-3 py-2.5 sm:py-3 rounded-2xl border transition-all duration-300 ${
                          isActive
                            ? "bg-gradient-to-r from-cyan-500/20 via-blue-600/15 to-purple-600/10 border-cyan-400/30 text-white shadow-[0_0_35px_rgba(34,211,238,0.22)]"
                            : "bg-white/[0.025] border-white/5 text-slate-400 hover:text-white hover:border-cyan-400/20 hover:bg-white/[0.055]"
                        }`
                      }
                    >
                      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(34,211,238,0.20),transparent_35%)]" />

                      <div className="relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-950/60 border border-white/10 flex items-center justify-center group-hover:border-cyan-300/30 group-hover:text-cyan-300 transition-all shrink-0">
                        <Icon size={18} />
                      </div>

                      <span className="relative z-10 font-medium text-[13px] sm:text-[14px] leading-tight truncate">
                        {item.name}
                      </span>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="relative z-10 p-3 sm:p-4 border-t border-white/10">
        <div
          onMouseMove={handleMouseMove}
          className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-3 sm:p-4"
        >
          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(34,211,238,0.18),transparent_40%)]" />

          <div className="relative z-10 flex items-center gap-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-[0_0_40px_rgba(34,211,238,0.35)] shrink-0">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-white font-semibold truncate">
                {user?.name || "User"}
              </p>

              <p className="text-slate-500 text-xs truncate">
                {user?.email || "user@example.com"}
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-1.5 sm:space-y-2">
            <NavLink to="/about" onClick={handleNavClick} className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-300 transition text-sm">
              <Info size={16} />
              About
            </NavLink>

            <NavLink to="/help" onClick={handleNavClick} className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-300 transition text-sm">
              <HelpCircle size={16} />
              Help Center
            </NavLink>

            <NavLink to="/settings" onClick={handleNavClick} className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-300 transition text-sm">
              <Settings size={16} />
              Settings
            </NavLink>

            <button
              type="button"
              onClick={logout}
              className="w-full mt-2 px-4 py-3 rounded-2xl bg-red-500/10 text-red-300 border border-red-400/20 hover:bg-red-500/20 hover:shadow-[0_0_30px_rgba(239,68,68,0.15)] transition-all flex items-center justify-center gap-2 text-sm"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
