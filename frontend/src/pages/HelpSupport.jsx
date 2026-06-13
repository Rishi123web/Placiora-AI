import { useState } from "react"
import axios from "axios"
import API_BASE from "../config/api"
import MainLayout from "../layouts/MainLayout.jsx"

import {
  HelpCircle,
  Search,
  Mail,
  Bug,
  Camera,
  Mic,
  Code2,
  FileText,
  Send,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  User,
  Lock,
  Video,
  Brain,
  Users,
  ClipboardCheck,
  History,
  Settings,
  Wifi,
  Upload,
  RefreshCcw
} from "lucide-react"

const FAQS = [
  {
    icon: Mic,
    title: "Microphone not working",
    keywords: "mic voice speech live interview sifra recording permission",
    text: "Allow microphone permission in browser settings, close apps using the mic, reload the page, then click Load Devices again."
  },
  {
    icon: Camera,
    title: "Camera not opening",
    keywords: "camera webcam video live interview permission black screen",
    text: "Allow camera permission, close Zoom/Meet/Teams, select the correct camera device and reload the Live Interview page."
  },
  {
    icon: Code2,
    title: "Coding round error",
    keywords: "coding round code run compiler execution output testcases error",
    text: "Check selected language, input format, brackets and function name. Make sure Piston/Judge0 runner is live."
  },
  {
    icon: FileText,
    title: "Resume upload issue",
    keywords: "resume analyzer upload pdf docx txt ats parse file",
    text: "Upload PDF, DOCX or TXT only. Avoid scanned image resumes. Keep file size small."
  },
  {
    icon: User,
    title: "Google login not working",
    keywords: "google login oauth route authentication account",
    text: "Check Google Client ID, Client Secret, callback URL and /api/oauth/google route."
  },
  {
    icon: Lock,
    title: "Email/password login failed",
    keywords: "login password signup invalid credentials account auth",
    text: "Check email/password, MongoDB connection and /api/auth/login route."
  },
  {
    icon: Brain,
    title: "AI questions not generating",
    keywords: "ai interview questions groq api generation failed",
    text: "Check GROQ_API_KEY in backend env and restart backend."
  },
  {
    icon: Video,
    title: "Live interview not starting",
    keywords: "live interview start camera mic session speech",
    text: "Allow mic/camera, select devices and confirm backend live-interview route works."
  },
  {
    icon: Users,
    title: "GD Round issue",
    keywords: "gd group discussion socket invite link participants",
    text: "Check socket server, meeting link, participant limit and browser permissions."
  },
  {
    icon: ClipboardCheck,
    title: "OA Simulator not working",
    keywords: "oa assessment simulator test submit questions",
    text: "Check /api/oa-assessment route and selected category/difficulty."
  },
  {
    icon: History,
    title: "History not showing",
    keywords: "history dashboard fetch user id sessions report",
    text: "Make sure user is logged in and token/user exists in localStorage."
  },
  {
    icon: Settings,
    title: "Theme mode not applying",
    keywords: "settings theme light dark mode ui",
    text: "Theme is saved in localStorage. Reload once after changing theme."
  },
  {
    icon: Sparkles,
    title: "Sifra voice not changing",
    keywords: "sifra voice female robotic assistant speech",
    text: "Voice style is saved in localStorage. Refresh once after changing it."
  },
  {
    icon: Mail,
    title: "Support email not sending",
    keywords: "support email nodemailer gmail app password failed send",
    text: "Use Gmail App Password, not normal Gmail password. Check SUPPORT_EMAIL and SUPPORT_EMAIL_PASSWORD."
  },
  {
    icon: Upload,
    title: "File upload failed",
    keywords: "upload multer file resume pdf docx storage",
    text: "Check file type, file size, multer route and backend upload limit."
  },
  {
    icon: Wifi,
    title: "Network error",
    keywords: "network error axios backend cors failed fetch",
    text: "Make sure backend is live, CORS is correct and VITE_API_URL points to Render."
  },
  {
    icon: Bug,
    title: "Found a bug",
    keywords: "bug error issue screenshot problem report",
    text: "Send page name, screenshot, exact error message and what you clicked before the issue happened."
  }
]

function HelpSupport() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("Technical")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(null)

  const searchText = query.trim().toLowerCase()

  const filtered = FAQS.filter((item) => {
    if (!searchText) return true

    return (
      item.title.toLowerCase().includes(searchText) ||
      item.text.toLowerCase().includes(searchText) ||
      item.keywords.toLowerCase().includes(searchText)
    )
  })

  const handleGlowMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`)
  }

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}")
    } catch {
      return {}
    }
  }

  const submitTicket = async () => {
    if (sending) return

    if (!message.trim()) {
      setStatus({
        type: "error",
        text: "Please write your issue first."
      })
      return
    }

    try {
      setSending(true)
      setStatus(null)

      const user = getUser()

      const res = await axios.post(
        `${API_BASE}/api/support/send`,
        {
          category,
          message: message.trim(),
          userName: user?.name || "Unknown User",
          userEmail: user?.email || "No email found"
        },
        {
          timeout: 25000
        }
      )

      if (res.data?.success) {
        setStatus({
          type: "success",
          text: "Support request sent successfully to placiora.support@gmail.com."
        })
        setMessage("")
      } else {
        setStatus({
          type: "error",
          text: res.data?.message || "Failed to send support request."
        })
      }
    } catch (error) {
      console.log("Support frontend error:", error.response?.data || error.message)

      setStatus({
        type: "error",
        text:
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to send support request. Check backend/email configuration."
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8 page-fade">
        <section
          onMouseMove={handleGlowMove}
          className="glow-card relative overflow-hidden rounded-[3rem] border border-cyan-400/20 bg-slate-950/90 p-8 shadow-[0_0_120px_rgba(34,211,238,0.12)]"
        >
          <div className="absolute -top-32 -right-32 w-[520px] h-[520px] bg-cyan-500/20 rounded-full blur-[140px]" />
          <div className="absolute -bottom-40 -left-40 w-[520px] h-[520px] bg-purple-600/20 rounded-full blur-[140px]" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 text-cyan-300 mb-4 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20">
              <HelpCircle size={16} />
              Help Center
            </div>

            <h1 className="text-5xl font-black text-white text-glow">
              Help & Support
            </h1>

            <p className="text-slate-400 mt-4 leading-8 max-w-3xl">
              Search common Placiora AI problems and contact support for login,
              camera, microphone, coding, resume, interviews, GD, settings and
              backend issues.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-cyan-300 flex items-center gap-2">
                <Sparkles size={16} />
                Sifra guided support
              </div>

              <div className="rounded-2xl border border-purple-400/20 bg-purple-500/10 px-4 py-3 text-purple-300 flex items-center gap-2">
                <Mail size={16} />
                placiora.support@gmail.com
              </div>
            </div>
          </div>
        </section>

        <div
          onMouseMove={handleGlowMove}
          className="glow-card relative overflow-hidden rounded-[2rem] border border-cyan-400/10 bg-slate-950/70 p-5 flex items-center gap-3"
        >
          <Search className="relative z-10 text-cyan-300" />

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search: login, mic, camera, coding, resume, support email..."
            className="relative z-10 flex-1 bg-transparent outline-none text-white placeholder:text-slate-500"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="relative z-10 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-slate-300 hover:text-cyan-300"
            >
              <RefreshCcw size={16} />
            </button>
          )}
        </div>

        <p className="text-slate-400">
          Showing{" "}
          <span className="text-cyan-300 font-semibold">{filtered.length}</span>{" "}
          solution{filtered.length === 1 ? "" : "s"}
        </p>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((item) => (
              <HelpCard
                key={item.title}
                {...item}
                onMouseMove={handleGlowMove}
              />
            ))}
          </div>
        ) : (
          <div
            onMouseMove={handleGlowMove}
            className="glow-card rounded-[2.5rem] border border-red-400/20 bg-red-500/10 p-8"
          >
            <AlertTriangle className="text-red-300 mb-4" size={34} />
            <h2 className="text-2xl font-bold text-white">No solution found</h2>
            <p className="text-slate-400 mt-3">
              Try words like login, camera, mic, resume, coding, support email,
              network error or backend.
            </p>
          </div>
        )}

        <section
          onMouseMove={handleGlowMove}
          className="glow-card relative overflow-hidden rounded-[2.5rem] border border-purple-400/20 bg-purple-500/10 p-8 shadow-[0_0_110px_rgba(168,85,247,0.10)]"
        >
          <div className="absolute -top-32 -right-32 w-[430px] h-[430px] bg-purple-500/20 rounded-full blur-[130px]" />
          <div className="absolute -bottom-32 -left-32 w-[430px] h-[430px] bg-cyan-500/15 rounded-full blur-[130px]" />

          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-5">
              Contact Support
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-cyan-400"
              >
                <option>Technical</option>
                <option>Login Issue</option>
                <option>Bug Report</option>
                <option>Feature Request</option>
                <option>Account Issue</option>
              </select>

              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-4 text-cyan-300 flex items-center gap-2">
                <Mail size={18} />
                placiora.support@gmail.com
              </div>
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue..."
              className="mt-5 w-full min-h-[150px] bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-cyan-400"
            />

            {status && (
              <div
                onMouseMove={handleGlowMove}
                className={`glow-card mt-4 rounded-2xl px-5 py-4 flex items-center gap-3 border ${
                  status.type === "success"
                    ? "bg-emerald-500/10 border-emerald-400/20 text-emerald-300"
                    : "bg-red-500/10 border-red-400/20 text-red-300"
                }`}
              >
                {status.type === "success" ? (
                  <CheckCircle size={18} />
                ) : (
                  <AlertTriangle size={18} />
                )}
                <span>{status.text}</span>
              </div>
            )}

            <button
              type="button"
              onClick={submitTicket}
              disabled={sending}
              className="glow-button mt-5 px-7 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-700 text-white font-semibold flex items-center gap-2 disabled:opacity-60"
            >
              <Send size={18} />
              {sending ? "Sending..." : "Submit Support Request"}
            </button>
          </div>
        </section>
      </div>
    </MainLayout>
  )
}

function HelpCard({ icon: Icon, title, text, onMouseMove }) {
  return (
    <div
      onMouseMove={onMouseMove}
      className="glow-card relative overflow-hidden rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-6 hover:border-cyan-300/30"
    >
      <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-cyan-500/10 blur-[80px]" />

      <div className="relative z-10">
        <Icon size={32} className="text-cyan-300 mb-4" />
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-slate-400 mt-3 leading-7">{text}</p>
      </div>
    </div>
  )
}

export default HelpSupport