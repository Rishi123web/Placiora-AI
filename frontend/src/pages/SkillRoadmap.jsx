import { useEffect, useState } from "react"
import axios from "axios"
import MainLayout from "../layouts/MainLayout.jsx"

import {
  Brain,
  Trophy,
  AlertTriangle,
  Calendar,
  Lightbulb,
  Star,
  RotateCw,
  Sparkles
} from "lucide-react"

const API = "http://localhost:5000/api/skill-roadmap"

function SkillRoadmap() {
  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const getUserId = () => {
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

  useEffect(() => {
    const loadInitialRoadmap = async () => {
      const userId = getUserId()

      if (!userId) {
        setRoadmap(null)
        return
      }

      try {
        setLoading(true)
        setMessage("")

        const res = await axios.get(`${API}/${userId}`)
        setRoadmap(res.data.roadmap || null)
      } catch (error) {
        console.log("Fetch roadmap skipped:", error.response?.data || error.message)
        setRoadmap(null)
        setMessage("")
      } finally {
        setLoading(false)
      }
    }

    loadInitialRoadmap()
  }, [])

  const generateRoadmap = async () => {
    const userId = getUserId()

    if (!userId) {
      setMessage("User not found. Please login again.")
      return
    }

    try {
      setLoading(true)
      setMessage("")

      const res = await axios.post(`${API}/generate`, {
        userId
      })

      setRoadmap(res.data.roadmap || null)
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to generate roadmap")
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
          <div className="absolute -top-28 -right-28 w-[480px] h-[480px] bg-cyan-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[480px] h-[480px] bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(34,211,238,0.16),transparent_35%)]" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-[0_0_45px_rgba(34,211,238,0.35)]">
                <Brain size={34} className="text-white" />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 text-cyan-300 mb-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20">
                  <Sparkles size={16} />
                  <span className="text-sm">AI Personalized Growth Plan</span>
                </div>

                <h1 className="text-4xl lg:text-5xl font-black text-white text-glow">
                  AI Skill Roadmap
                </h1>

                <p className="text-slate-400 mt-3 leading-7 max-w-4xl">
                  Personalized improvement roadmap based on your interview
                  results, weak areas, preparation level and placement goals.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={generateRoadmap}
              disabled={loading}
              className="glow-button px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center justify-center gap-2 disabled:opacity-60 font-semibold"
            >
              <RotateCw size={18} className={loading ? "animate-spin" : ""} />
              {loading ? "Generating..." : "Generate Roadmap"}
            </button>
          </div>
        </section>

        {loading && (
          <section className="glow-card rounded-[3rem] p-8 text-center border border-cyan-400/10">
            <RotateCw className="animate-spin text-cyan-300 mx-auto mb-4" />
            <p className="text-slate-300">Loading roadmap...</p>
          </section>
        )}

        {message && !loading && (
          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-5 text-yellow-300">
            {message}
          </div>
        )}

        {!roadmap && !loading && (
          <section
            onMouseMove={handleMouseMove}
            className="glow-card rounded-[3rem] p-12 text-center border border-cyan-400/10 hover:border-cyan-300/30"
          >
            <Brain size={70} className="mx-auto text-cyan-300 mb-5" />

            <h2 className="text-3xl font-bold text-white">
              No Roadmap Generated
            </h2>

            <p className="text-slate-400 mt-3">
              Generate your AI roadmap from interview performance.
            </p>
          </section>
        )}

        {roadmap && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <StatCard
                title="Overall Readiness"
                value={`${roadmap.overallReadiness || 0}%`}
                icon={Trophy}
                onMouseMove={handleMouseMove}
              />

              <StatCard
                title="Current Level"
                value={roadmap.currentLevel || "Not calculated"}
                icon={Star}
                onMouseMove={handleMouseMove}
              />
            </div>

            <section
              onMouseMove={handleMouseMove}
              className="glow-card rounded-[2.3rem] p-8 border border-cyan-400/10 hover:border-cyan-300/30"
            >
              <h2 className="text-3xl font-bold text-white mb-6">
                Weakest Skills
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {(roadmap.weakestSkills || []).map((skill, index) => (
                  <SkillCard
                    key={`${skill.skill || "skill"}-${index}`}
                    skill={skill}
                    onMouseMove={handleMouseMove}
                  />
                ))}
              </div>
            </section>

            <section
              onMouseMove={handleMouseMove}
              className="glow-card rounded-[2.3rem] p-8 border border-yellow-400/20 bg-yellow-500/10"
            >
              <h2 className="text-3xl font-bold text-white mb-6">
                Priority Actions
              </h2>

              {(roadmap.priorityActions || []).length > 0 ? (
                roadmap.priorityActions.map((item, index) => (
                  <div key={index} className="mb-3 flex gap-3 text-slate-300">
                    <AlertTriangle
                      size={18}
                      className="text-yellow-300 mt-1 shrink-0"
                    />
                    <span>{item}</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-400">No priority actions available.</p>
              )}
            </section>

            <PlanSection
              title="7 Day Plan"
              items={roadmap.sevenDayPlan || []}
              onMouseMove={handleMouseMove}
            />

            <PlanSection
              title="30 Day Roadmap"
              items={roadmap.thirtyDayRoadmap || []}
              onMouseMove={handleMouseMove}
            />

            <section
              onMouseMove={handleMouseMove}
              className="glow-card rounded-[2.3rem] p-8 border border-cyan-400/10 hover:border-cyan-300/30"
            >
              <h2 className="text-3xl font-bold text-white mb-6">
                Recommended Modules
              </h2>

              <div className="flex flex-wrap gap-3">
                {(roadmap.recommendedModules || []).length > 0 ? (
                  roadmap.recommendedModules.map((module, index) => (
                    <div
                      key={`${module}-${index}`}
                      className="px-4 py-3 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 hover:bg-cyan-500/20 transition"
                    >
                      {module}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400">No modules recommended yet.</p>
                )}
              </div>
            </section>

            <section
              onMouseMove={handleMouseMove}
              className="glow-card rounded-[2.3rem] p-8 border border-purple-400/20 bg-purple-500/10"
            >
              <div className="flex items-center gap-3 mb-4">
                <Lightbulb size={24} className="text-yellow-300" />

                <h2 className="text-3xl font-bold text-white">
                  Final AI Advice
                </h2>
              </div>

              <p className="text-slate-300 leading-8">
                {roadmap.finalAdvice || "Keep practicing consistently."}
              </p>
            </section>
          </>
        )}
      </div>
    </MainLayout>
  )
}

function SkillCard({ skill, onMouseMove }) {
  const safeScore = Math.min(Number(skill.score) || 0, 100)

  return (
    <div
      onMouseMove={onMouseMove}
      className="glow-card rounded-[2rem] border border-white/10 bg-slate-950/60 p-5 hover:border-cyan-300/30"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-bold text-white">
          {skill.skill || "Skill"}
        </h3>

        <span className="text-cyan-300 font-bold">{safeScore}%</span>
      </div>

      <div className="h-3 rounded-full bg-slate-800 overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600"
          style={{ width: `${safeScore}%` }}
        />
      </div>

      <p className="text-slate-400 mb-3">
        {skill.reason || "No reason available."}
      </p>

      <div className="text-yellow-300 text-sm mb-2">
        Priority: {skill.priority || "Medium"}
      </div>

      <p className="text-slate-300 leading-7">
        {skill.action || "Practice this skill more."}
      </p>
    </div>
  )
}

function PlanSection({ title, items, onMouseMove }) {
  return (
    <section
      onMouseMove={onMouseMove}
      className="glow-card rounded-[2.3rem] p-8 border border-cyan-400/10 hover:border-cyan-300/30"
    >
      <h2 className="text-3xl font-bold text-white mb-6">{title}</h2>

      <div className="space-y-5">
        {items.length > 0 ? (
          items.map((day, index) => (
            <div
              key={`${day.day || "day"}-${index}`}
              className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 hover:border-cyan-400/20 transition"
            >
              <div className="flex items-center gap-3 mb-3">
                <Calendar size={18} className="text-cyan-300" />

                <h3 className="text-white font-bold">
                  {day.day || `Step ${index + 1}`} -{" "}
                  {day.title || "Preparation Task"}
                </h3>
              </div>

              <p className="text-cyan-300 mb-3">
                {day.focusArea || "General Preparation"}
              </p>

              {(day.tasks || []).map((task, taskIndex) => (
                <p key={`${task}-${taskIndex}`} className="text-slate-300 mb-2">
                  • {task}
                </p>
              ))}

              <p className="text-emerald-300 mt-3">
                Outcome: {day.expectedOutcome || "Improve your readiness."}
              </p>
            </div>
          ))
        ) : (
          <p className="text-slate-400">No roadmap items available.</p>
        )}
      </div>
    </section>
  )
}

function StatCard({ title, value, icon: Icon, onMouseMove }) {
  return (
    <div
      onMouseMove={onMouseMove}
      className="glow-card rounded-[2rem] p-6 border border-cyan-400/10 hover:border-cyan-300/30"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400">{title}</p>

          <h2 className="text-4xl font-bold text-white mt-2">{value}</h2>
        </div>

        <Icon size={32} className="text-cyan-300" />
      </div>
    </div>
  )
}

export default SkillRoadmap