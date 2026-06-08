import { useEffect, useState } from "react"
import axios from "axios"
import MainLayout from "../layouts/MainLayout.jsx"
import API_BASE from "../config/api"

import {
  Brain,
  Trophy,
  Star,
  Building2,
  AlertTriangle,
  Lightbulb,
  RotateCw
} from "lucide-react"

const API = `${API_BASE}/api/company-prediction`

function PlacementPredictor() {
  const [prediction, setPrediction] = useState(null)
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
    const loadPrediction = async () => {
      const userId = getUserId()

      if (!userId) {
        setMessage("User not found. Please login again.")
        return
      }

      try {
        setLoading(true)
        setMessage("")

        const res = await axios.get(`${API}/${userId}`)
        setPrediction(res.data.prediction || null)
      } catch (error) {
        console.log("Prediction fetch error:", error)
        setPrediction(null)
        setMessage("No placement prediction found yet.")
      } finally {
        setLoading(false)
      }
    }

    loadPrediction()
  }, [])

  const generatePrediction = async () => {
    const userId = getUserId()

    if (!userId) {
      alert("User not found. Please login again.")
      return
    }

    try {
      setLoading(true)
      setMessage("")

      const res = await axios.post(`${API}/generate`, { userId })
      setPrediction(res.data.prediction || null)
    } catch (error) {
      console.log("Prediction generate error:", error)
      alert(error.response?.data?.message || "Failed to generate prediction")
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
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-700 flex items-center justify-center">
                <Brain className="text-white" size={34} />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 text-cyan-300 mb-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20">
                  <Star size={16} />
                  <span className="text-sm">AI Company Fit Engine</span>
                </div>

                <h1 className="text-4xl lg:text-5xl font-black text-white text-glow">
                  AI Placement Predictor
                </h1>

                <p className="text-slate-400 mt-3 leading-7 max-w-4xl">
                  Predict your company-wise placement chances using interview,
                  HR, coding, aptitude and roadmap scores.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={generatePrediction}
              disabled={loading}
              className="glow-button px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <RotateCw size={18} className={loading ? "animate-spin" : ""} />
              {loading ? "Generating..." : "Generate Prediction"}
            </button>
          </div>
        </section>

        {loading && (
          <section className="glow-card rounded-[3rem] p-8 text-center border border-cyan-400/10">
            <RotateCw className="animate-spin text-cyan-300 mx-auto mb-4" />
            <p className="text-slate-300">Loading placement prediction...</p>
          </section>
        )}

        {message && !loading && (
          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-5 text-yellow-300">
            {message}
          </div>
        )}

        {!prediction && !loading && (
          <section
            onMouseMove={handleMouseMove}
            className="glow-card rounded-[3rem] p-12 text-center border border-cyan-400/10 hover:border-cyan-300/30"
          >
            <Building2 size={76} className="mx-auto text-purple-300 mb-5" />

            <h2 className="text-3xl font-bold text-white">
              No Prediction Generated
            </h2>

            <p className="text-slate-400 mt-3">
              Generate a company-wise placement prediction from your performance
              data.
            </p>
          </section>
        )}

        {prediction && (
          <>
            <section
              onMouseMove={handleMouseMove}
              className="glow-card rounded-[3rem] p-10 text-center border border-cyan-400/20 bg-cyan-500/10"
            >
              <Trophy size={76} className="mx-auto text-yellow-300 mb-5" />

              <p className="text-purple-300 font-semibold mb-2">
                Overall Placement Probability
              </p>

              <h2 className="text-8xl font-black bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent">
                {prediction.placementProbability || 0}%
              </h2>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <StatCard
                title="Placement Probability"
                value={`${prediction.placementProbability || 0}%`}
                icon={Trophy}
                onMouseMove={handleMouseMove}
              />

              <StatCard
                title="Current Level"
                value={prediction.currentLevel || "Not calculated"}
                icon={Star}
                onMouseMove={handleMouseMove}
              />

              <StatCard
                title="Best Fit Type"
                value={prediction.bestFitType || "Not calculated"}
                icon={Building2}
                onMouseMove={handleMouseMove}
              />
            </div>

            <CompanySection
              title="Ready Now"
              description="Companies you can target immediately."
              companies={prediction.readyNow || []}
              color="emerald"
              onMouseMove={handleMouseMove}
            />

            <CompanySection
              title="Need More Practice"
              description="Companies you can target after fixing weak areas."
              companies={prediction.needPractice || []}
              color="yellow"
              onMouseMove={handleMouseMove}
            />

            <CompanySection
              title="Stretch Companies"
              description="Advanced companies that need stronger preparation."
              companies={prediction.stretchCompanies || []}
              color="purple"
              onMouseMove={handleMouseMove}
            />

            <InfoSection
              title="Weak Areas Blocking Selection"
              icon={AlertTriangle}
              items={prediction.blockers || []}
              empty="No major blockers detected."
              color="yellow"
              onMouseMove={handleMouseMove}
            />

            <InfoSection
              title="AI Recommendations"
              icon={Lightbulb}
              items={prediction.recommendations || []}
              empty="Keep practicing using Placiora AI modules."
              color="emerald"
              onMouseMove={handleMouseMove}
            />

            <section
              onMouseMove={handleMouseMove}
              className="glow-card rounded-[2.3rem] p-8 border border-purple-400/20 bg-purple-500/10"
            >
              <div className="flex items-center gap-3 mb-4">
                <Brain size={24} className="text-cyan-300" />
                <h2 className="text-3xl font-bold text-white">
                  Final AI Verdict
                </h2>
              </div>

              <p className="text-slate-300 leading-8">
                {prediction.finalVerdict ||
                  "Generate prediction to see final verdict."}
              </p>
            </section>
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
          <h2 className="text-3xl font-bold text-white mt-2">{value}</h2>
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

function CompanySection({ title, description, companies, color, onMouseMove }) {
  const colorClass =
    color === "emerald"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
      : color === "yellow"
      ? "border-yellow-400/20 bg-yellow-500/10 text-yellow-300"
      : "border-purple-400/20 bg-purple-500/10 text-purple-300"

  return (
    <section
      onMouseMove={onMouseMove}
      className="glow-card rounded-[2.3rem] p-8 border border-cyan-400/10 hover:border-cyan-300/30"
    >
      <div className="flex items-center gap-3 mb-2">
        <Building2 className="text-cyan-300" size={24} />
        <h2 className="text-3xl font-bold text-white">{title}</h2>
      </div>

      <p className="text-slate-400 mb-6">{description}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {companies.length > 0 ? (
          companies.map((company, index) => {
            const probability = Math.min(Number(company.probability) || 0, 100)

            return (
              <div
                key={`${company.company || "company"}-${index}`}
                className={`rounded-[2rem] border p-5 ${colorClass}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Building2 size={22} />
                  <h3 className="text-xl font-bold text-white">
                    {company.company || "Company"}
                  </h3>
                </div>

                <p className="text-4xl font-bold mb-3">{probability}%</p>

                <div className="h-3 rounded-full bg-slate-800 overflow-hidden mb-4">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600"
                    style={{ width: `${probability}%` }}
                  />
                </div>

                <p className="text-slate-300 leading-7">
                  {company.reason || "No reason available."}
                </p>
              </div>
            )
          })
        ) : (
          <p className="text-slate-400">No companies available.</p>
        )}
      </div>
    </section>
  )
}

function InfoSection({ title, icon: Icon, items, empty, color, onMouseMove }) {
  const iconClass = color === "yellow" ? "text-yellow-300" : "text-emerald-300"

  return (
    <section
      onMouseMove={onMouseMove}
      className="glow-card rounded-[2.3rem] p-8 border border-cyan-400/10 hover:border-cyan-300/30"
    >
      <h2 className="text-3xl font-bold text-white mb-6">{title}</h2>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, index) => (
            <p key={`${item}-${index}`} className="text-slate-300 flex gap-3">
              <Icon size={18} className={`${iconClass} mt-1 shrink-0`} />
              {item}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-slate-400">{empty}</p>
      )}
    </section>
  )
}

export default PlacementPredictor
