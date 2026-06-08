import { useState } from "react"
import axios from "axios"
import MainLayout from "../layouts/MainLayout.jsx"
import API_BASE from "../config/api"

import {
  Target,
  Trophy,
  Brain,
  Code2,
  FileText,
  MessageCircle,
  Building2,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Sparkles
} from "lucide-react"

const API = `${API_BASE}/api/placement-readiness`

function PlacementReadiness() {
  const [resumeScore, setResumeScore] = useState(0)
  const [codingScore, setCodingScore] = useState(0)
  const [aptitudeScore, setAptitudeScore] = useState(0)

  const [report, setReport] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")

  const getSavedUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      return user?._id || user?.id || ""
    } catch {
      return ""
    }
  }

  const handleMouseMove = (e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()

    card.style.setProperty("--x", `${e.clientX - rect.left}px`)
    card.style.setProperty("--y", `${e.clientY - rect.top}px`)
  }

  const generateReport = async () => {
    const savedUserId = getSavedUserId()

    if (!savedUserId) {
      setError("Please login again.")
      return
    }

    try {
      setGenerating(true)
      setError("")

      const res = await axios.post(`${API}/generate`, {
        userId: savedUserId,
        resumeScore: Number(resumeScore) || 0,
        codingScore: Number(codingScore) || 0,
        aptitudeScore: Number(aptitudeScore) || 0
      })

      setReport(res.data.report || null)
    } catch (error) {
      setError(error.response?.data?.message || "Failed to generate report")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8 page-fade">
        <section
          onMouseMove={handleMouseMove}
          className="glow-card relative overflow-hidden rounded-[3rem] border border-cyan-400/20 bg-slate-950/90 p-8 shadow-[0_0_120px_rgba(34,211,238,0.12)]"
        >
          <div className="absolute -top-28 -right-28 w-[480px] h-[480px] bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[480px] h-[480px] bg-cyan-600/20 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(34,211,238,0.16),transparent_35%)]" />

          <div className="relative z-10 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-700 flex items-center justify-center shadow-[0_0_45px_rgba(168,85,247,0.35)]">
              <Target className="text-white" size={34} />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 text-cyan-300 mb-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20">
                <Sparkles size={16} />
                <span className="text-sm">
                  AI Placement Readiness Engine
                </span>
              </div>

              <h1 className="text-4xl lg:text-5xl font-black text-white text-glow">
                Placement Readiness
              </h1>

              <p className="text-slate-400 mt-3 leading-7 max-w-4xl">
                Combine resume, interview, communication, coding, aptitude and
                consistency into one AI placement readiness score.
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        <section
          onMouseMove={handleMouseMove}
          className="glow-card relative overflow-hidden rounded-[2.3rem] p-6 border border-cyan-400/10 hover:border-cyan-300/30 bg-white/[0.04] backdrop-blur-2xl"
        >
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(34,211,238,0.14),transparent_38%)]" />

          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-5">
              Generate Readiness Report
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <InputScore
                label="Resume Score"
                value={resumeScore}
                setValue={setResumeScore}
              />

              <InputScore
                label="Coding Score"
                value={codingScore}
                setValue={setCodingScore}
              />

              <InputScore
                label="Aptitude Score"
                value={aptitudeScore}
                setValue={setAptitudeScore}
              />

              <button
                type="button"
                onClick={generateReport}
                disabled={generating}
                className="glow-button rounded-2xl bg-gradient-to-r from-purple-500 to-pink-700 text-white font-semibold disabled:opacity-60 py-4"
              >
                {generating ? "Generating..." : "Generate Report"}
              </button>
            </div>
          </div>
        </section>

        {!report && (
          <section
            onMouseMove={handleMouseMove}
            className="glow-card rounded-[3rem] p-10 text-center border border-cyan-400/10 hover:border-cyan-300/30"
          >
            <Target className="mx-auto text-slate-500 mb-5" size={70} />

            <h2 className="text-3xl font-bold text-white">
              No Placement Report Yet
            </h2>

            <p className="text-slate-400 mt-2">
              Enter your latest resume, coding and aptitude scores to generate
              your AI readiness report.
            </p>
          </section>
        )}

        {report && (
          <>
            <section
              onMouseMove={handleMouseMove}
              className="glow-card relative overflow-hidden rounded-[3rem] p-10 text-center border border-cyan-400/20 bg-cyan-500/10"
            >
              <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(34,211,238,0.16),transparent_38%)]" />

              <div className="relative z-10">
                <Trophy className="mx-auto text-yellow-300 mb-5" size={76} />

                <p className="text-purple-300 font-semibold mb-2">
                  Placement Readiness Score
                </p>

                <h2 className="text-7xl font-black text-white mb-4 text-glow">
                  {report.readinessScore || 0}%
                </h2>

                <p className="text-cyan-300 text-2xl font-semibold mb-3">
                  {report.level || "Not calculated"}
                </p>

                <p className="text-slate-300 max-w-3xl mx-auto leading-7">
                  {report.verdict || "Generate a report to see your verdict."}
                </p>
              </div>
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <MetricCard
                label="Resume"
                value={report.resumeScore}
                icon={FileText}
                onMouseMove={handleMouseMove}
              />

              <MetricCard
                label="Interview"
                value={report.interviewScore}
                icon={Brain}
                onMouseMove={handleMouseMove}
              />

              <MetricCard
                label="Communication"
                value={report.communicationScore}
                icon={MessageCircle}
                onMouseMove={handleMouseMove}
              />

              <MetricCard
                label="Coding"
                value={report.codingScore}
                icon={Code2}
                onMouseMove={handleMouseMove}
              />

              <MetricCard
                label="Aptitude"
                value={report.aptitudeScore}
                icon={Target}
                onMouseMove={handleMouseMove}
              />

              <MetricCard
                label="Consistency"
                value={report.consistencyScore}
                icon={CheckCircle}
                onMouseMove={handleMouseMove}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ListCard
                title="Strengths"
                icon={CheckCircle}
                items={report.strengths || []}
                color="emerald"
                onMouseMove={handleMouseMove}
              />

              <ListCard
                title="Weaknesses"
                icon={AlertTriangle}
                items={report.weaknesses || []}
                color="red"
                onMouseMove={handleMouseMove}
              />

              <ListCard
                title="Priority Actions"
                icon={Lightbulb}
                items={report.priorityActions || []}
                color="blue"
                onMouseMove={handleMouseMove}
              />
            </div>

            <section
              onMouseMove={handleMouseMove}
              className="glow-card rounded-[2.3rem] p-6 border border-cyan-400/10 hover:border-cyan-300/30"
            >
              <h2 className="text-3xl font-bold text-white mb-6">
                Company Readiness
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {(report.companyReadiness || []).map((item, index) => (
                  <CompanyCard
                    key={`${item.company || "company"}-${index}`}
                    item={item}
                    onMouseMove={handleMouseMove}
                  />
                ))}
              </div>
            </section>

            <section
              onMouseMove={handleMouseMove}
              className="glow-card rounded-[2.3rem] p-6 border border-cyan-400/10 hover:border-cyan-300/30"
            >
              <h2 className="text-3xl font-bold text-white mb-6">
                7-Day AI Roadmap
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {(report.roadmap || []).map((day, index) => (
                  <RoadmapCard
                    key={`${day.day || "day"}-${index}`}
                    day={day}
                    index={index}
                    onMouseMove={handleMouseMove}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </MainLayout>
  )
}

function InputScore({ label, value, setValue }) {
  return (
    <div>
      <label className="text-slate-300 text-sm block mb-2">{label}</label>

      <input
        type="number"
        min="0"
        max="100"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-cyan-400"
      />
    </div>
  )
}

function MetricCard({ label, value, icon: Icon, onMouseMove }) {
  const safeValue = Math.min(Number(value) || 0, 100)

  return (
    <div
      onMouseMove={onMouseMove}
      className="glow-card rounded-[2rem] p-5 border border-cyan-400/10 hover:border-cyan-300/30 min-w-0"
    >
      <div className="relative z-10">
        <Icon className="text-cyan-300 mb-4" size={30} />

        <p className="text-slate-400 text-sm">{label}</p>

        <h3 className="text-4xl font-bold text-white mt-2">{safeValue}%</h3>

        <div className="h-3 rounded-full bg-slate-800 overflow-hidden mt-4">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600"
            style={{ width: `${safeValue}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function ListCard({ title, icon: Icon, items = [], color, onMouseMove }) {
  const styleMap = {
    emerald: "bg-emerald-500/10 border-emerald-400/20 text-emerald-300",
    red: "bg-red-500/10 border-red-400/20 text-red-300",
    blue: "bg-blue-500/10 border-blue-400/20 text-blue-300"
  }

  return (
    <div
      onMouseMove={onMouseMove}
      className={`rounded-[2rem] border p-6 ${
        styleMap[color] || styleMap.blue
      }`}
    >
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Icon size={20} />
        {title}
      </h3>

      <div className="space-y-2">
        {items.length > 0 ? (
          items.map((item, index) => (
            <p key={`${title}-${index}`} className="leading-7">
              • {item}
            </p>
          ))
        ) : (
          <p>No data available.</p>
        )}
      </div>
    </div>
  )
}

function CompanyCard({ item, onMouseMove }) {
  const score = Math.min(Number(item.score) || 0, 100)

  return (
    <div
      onMouseMove={onMouseMove}
      className="glow-card rounded-[2rem] border border-purple-400/20 bg-purple-500/10 p-5 hover:border-purple-300/40"
    >
      <div className="flex items-center gap-3 mb-4">
        <Building2 className="text-purple-300" />

        <h3 className="text-xl font-bold text-white">
          {item.company || "Company"}
        </h3>
      </div>

      <p className="text-4xl font-bold text-cyan-300 mb-3">{score}%</p>

      <div className="h-3 rounded-full bg-slate-800 overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-400 to-cyan-500"
          style={{ width: `${score}%` }}
        />
      </div>

      <p className="text-slate-300 leading-7">
        {item.verdict || "No verdict available."}
      </p>
    </div>
  )
}

function RoadmapCard({ day, index, onMouseMove }) {
  return (
    <div
      onMouseMove={onMouseMove}
      className="glow-card rounded-[2rem] border border-white/10 bg-slate-950/60 p-5 hover:border-cyan-300/30"
    >
      <p className="text-cyan-300 font-semibold mb-2">
        {day.day || `Day ${index + 1}`}
      </p>

      <h3 className="text-xl font-bold text-white mb-4">
        {day.title || "Preparation Task"}
      </h3>

      <div className="space-y-2">
        {(day.tasks || []).map((task, taskIndex) => (
          <p key={`${index}-${taskIndex}`} className="text-slate-300 leading-7">
            • {task}
          </p>
        ))}
      </div>
    </div>
  )
}

export default PlacementReadiness
