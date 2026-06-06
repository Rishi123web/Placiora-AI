import { useEffect, useState } from "react"
import axios from "axios"
import MainLayout from "../layouts/MainLayout.jsx"

import {
  Building2,
  Trophy,
  User,
  Mail,
  Briefcase,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  RotateCw,
  BarChart3,
  Sparkles,
  Brain,
  TrendingUp
} from "lucide-react"

const API = "http://localhost:5000/api/recruiter-report"

function RecruiterDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const userId = user?._id || user?.id || ""

  const [targetRole, setTargetRole] = useState("Full Stack Developer")
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleMouseMove = (e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()

    card.style.setProperty("--x", `${e.clientX - rect.left}px`)
    card.style.setProperty("--y", `${e.clientY - rect.top}px`)
  }

  useEffect(() => {
    async function loadReport() {
      if (!userId) return

      try {
        setLoading(true)
        setError("")

        const res = await axios.get(`${API}/${userId}`)
        setReport(res.data.report || null)
      } catch (err) {
        console.log("Recruiter report fetch error:", err)
        setReport(null)
      } finally {
        setLoading(false)
      }
    }

    loadReport()
  }, [userId])

  const generateReport = async () => {
    if (!userId) {
      setError("User not found. Please login again.")
      return
    }

    try {
      setLoading(true)
      setMessage("")
      setError("")

      const res = await axios.post(`${API}/generate`, {
        userId,
        targetRole
      })

      setReport(res.data.report || null)
      setMessage("Recruiter report generated successfully.")
    } catch (err) {
      console.log("Recruiter report generate error:", err.response?.data || err)

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Recruiter report generation failed"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8 page-fade">
        <section
          onMouseMove={handleMouseMove}
          className="glow-card relative overflow-hidden rounded-[3rem] border border-cyan-400/20 bg-slate-950/90 p-8 shadow-[0_0_120px_rgba(34,211,238,0.12)]"
        >
          <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-cyan-500/20 blur-[140px]" />
          <div className="absolute -bottom-40 -left-40 w-[520px] h-[520px] rounded-full bg-purple-600/20 blur-[140px]" />
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(34,211,238,0.16),transparent_35%)]" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-[0_0_45px_rgba(34,211,238,0.35)]">
                <Building2 size={34} className="text-white" />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 text-cyan-300 mb-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20">
                  <Sparkles size={16} />
                  <span className="text-sm">AI Recruiter View</span>
                </div>

                <h1 className="text-4xl lg:text-5xl font-black text-white text-glow">
                  Recruiter Dashboard
                </h1>

                <p className="text-slate-400 mt-3 leading-7 max-w-4xl">
                  Generate a recruiter-style candidate report using all Prep AI
                  interview, resume, coding, aptitude and placement data.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <input
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-cyan-400 min-w-[260px]"
                placeholder="Target role"
              />

              <button
                type="button"
                onClick={generateReport}
                disabled={loading}
                className="glow-button px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-700 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <RotateCw size={18} className={loading ? "animate-spin" : ""} />
                {loading ? "Generating..." : "Generate Report"}
              </button>
            </div>
          </div>
        </section>

        {message && (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 p-4">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-red-500/10 border border-red-400/20 text-red-300 p-4">
            {error}
          </div>
        )}

        {loading && (
          <section className="glow-card rounded-[3rem] p-8 text-center border border-cyan-400/10">
            <RotateCw className="animate-spin text-cyan-300 mx-auto mb-4" />
            <p className="text-slate-300">Loading recruiter report...</p>
          </section>
        )}

        {!report && !loading && (
          <section
            onMouseMove={handleMouseMove}
            className="glow-card rounded-[3rem] p-12 text-center border border-cyan-400/10 hover:border-cyan-300/30"
          >
            <Building2 size={76} className="mx-auto text-cyan-300 mb-5" />

            <h2 className="text-3xl font-bold text-white">
              No Recruiter Report Yet
            </h2>

            <p className="text-slate-400 mt-3">
              Generate a report after completing interview, resume, coding,
              aptitude and placement modules.
            </p>
          </section>
        )}

        {report && (
          <>
            <section
              onMouseMove={handleMouseMove}
              className="glow-card relative overflow-hidden rounded-[3rem] p-10 text-center border border-cyan-400/20 bg-cyan-500/10"
            >
              <div className="absolute -top-28 -right-28 w-[420px] h-[420px] rounded-full bg-cyan-400/20 blur-[120px]" />
              <div className="absolute -bottom-28 -left-28 w-[420px] h-[420px] rounded-full bg-purple-500/20 blur-[120px]" />

              <div className="relative z-10">
                <Brain size={76} className="mx-auto text-cyan-300 mb-5" />

                <p className="text-cyan-300 font-semibold mb-3">
                  Recruiter Confidence
                </p>

                <h2 className="text-8xl font-black bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent">
                  {report.placementProbability || 0}%
                </h2>

                <div className="mt-6 max-w-3xl mx-auto">
                  <div className="h-4 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600"
                      style={{
                        width: `${Math.min(
                          Number(report.placementProbability) || 0,
                          100
                        )}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <StatCard
                title="Overall Score"
                value={`${report.overallScore || 0}%`}
                icon={Trophy}
                onMouseMove={handleMouseMove}
              />

              <StatCard
                title="Hiring Status"
                value={report.hiringStatus || "Hold"}
                icon={CheckCircle}
                onMouseMove={handleMouseMove}
              />

              <StatCard
                title="Placement Probability"
                value={`${report.placementProbability || 0}%`}
                icon={BarChart3}
                onMouseMove={handleMouseMove}
              />

              <StatCard
                title="Target Role"
                value={report.targetRole || targetRole}
                icon={Briefcase}
                onMouseMove={handleMouseMove}
              />
            </div>

            <section
              onMouseMove={handleMouseMove}
              className="glow-card rounded-[2.3rem] p-8 border border-cyan-400/10 hover:border-cyan-300/30"
            >
              <div className="flex items-center gap-3 mb-6">
                <User size={26} className="text-cyan-300" />
                <h2 className="text-3xl font-bold text-white">
                  Candidate Profile
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <InfoCard
                  icon={User}
                  label="Candidate"
                  value={report.candidateName || user?.name || "User"}
                />

                <InfoCard
                  icon={Mail}
                  label="Email"
                  value={report.candidateEmail || user?.email || "N/A"}
                />

                <InfoCard
                  icon={Briefcase}
                  label="Role"
                  value={report.targetRole || targetRole}
                />
              </div>
            </section>

            <section
              onMouseMove={handleMouseMove}
              className="glow-card rounded-[2.3rem] p-8 border border-cyan-400/10 hover:border-cyan-300/30"
            >
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp size={26} className="text-cyan-300" />
                <h2 className="text-3xl font-bold text-white">
                  Score Breakdown
                </h2>
              </div>

              <div className="space-y-5">
                {(report.scoreBreakdown || []).length > 0 ? (
                  report.scoreBreakdown.map((item, index) => (
                    <ScoreRow
                      key={`${item.label || "score"}-${index}`}
                      label={item.label}
                      score={item.score}
                      status={item.status}
                    />
                  ))
                ) : (
                  <p className="text-slate-400">No score breakdown available.</p>
                )}
              </div>
            </section>

            <section
              onMouseMove={handleMouseMove}
              className="glow-card rounded-[2.3rem] border border-purple-400/20 bg-purple-500/10 p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <Brain size={26} className="text-cyan-300" />
                <h2 className="text-3xl font-bold text-white">
                  Final Recruiter Verdict
                </h2>
              </div>

              <p className="text-slate-300 leading-8">
                {report.recruiterVerdict ||
                  "Generate a report to see recruiter verdict."}
              </p>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <ListCard
                title="Strengths"
                icon={CheckCircle}
                items={report.strengths || []}
                color="emerald"
              />

              <ListCard
                title="Hiring Risks"
                icon={AlertTriangle}
                items={report.risks || []}
                color="red"
              />

              <ListCard
                title="Improvement Areas"
                icon={Lightbulb}
                items={report.improvementAreas || []}
                color="blue"
              />
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}

function StatCard({ title, value, icon: Icon, onMouseMove }) {
  const numeric = parseInt(value, 10)

  return (
    <div
      onMouseMove={onMouseMove}
      className="glow-card rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-6 hover:border-cyan-300/30"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>

          <h2 className="text-3xl font-bold text-white mt-2 break-words">
            {value}
          </h2>
        </div>

        <Icon className="text-cyan-300 shrink-0" size={34} />
      </div>

      {!Number.isNaN(numeric) && (
        <div className="h-2 rounded-full bg-slate-800 mt-4 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600"
            style={{ width: `${Math.min(numeric, 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[2rem] border border-cyan-400/10 bg-slate-950/60 p-5 hover:border-cyan-300/30 transition-all">
      <div className="flex items-center gap-3 mb-3">
        <Icon size={20} className="text-cyan-300" />
        <p className="text-slate-400">{label}</p>
      </div>

      <p className="text-white text-xl font-semibold break-words">{value}</p>
    </div>
  )
}

function ScoreRow({ label, score, status }) {
  const safeScore = Math.min(Number(score) || 0, 100)

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
      <div className="flex items-center justify-between mb-3 gap-4">
        <div>
          <p className="text-white font-semibold">{label}</p>
          <p className="text-slate-500 text-sm">{status}</p>
        </div>

        <p className="text-cyan-300 font-bold">{safeScore}%</p>
      </div>

      <div className="w-full h-4 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600"
          style={{ width: `${safeScore}%` }}
        />
      </div>
    </div>
  )
}

function ListCard({ title, icon: Icon, items = [], color }) {
  const colorClass =
    color === "red"
      ? "bg-red-500/10 border-red-400/20 text-red-300"
      : color === "blue"
      ? "bg-blue-500/10 border-blue-400/20 text-blue-300"
      : "bg-emerald-500/10 border-emerald-400/20 text-emerald-300"

  return (
    <div className={`rounded-[2rem] border p-6 ${colorClass}`}>
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Icon size={20} />
        {title}
      </h3>

      <div className="space-y-2">
        {items.length > 0 ? (
          items.map((item, index) => <p key={`${item}-${index}`}>• {item}</p>)
        ) : (
          <p>No data available.</p>
        )}
      </div>
    </div>
  )
}

export default RecruiterDashboard