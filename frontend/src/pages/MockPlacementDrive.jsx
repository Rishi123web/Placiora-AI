import { useState } from "react"
import axios from "axios"
import MainLayout from "../layouts/MainLayout.jsx"

import {
  Trophy,
  Building2,
  Briefcase,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Target,
  Brain,
  Code2,
  Users
} from "lucide-react"

const API = "http://localhost:5000/api/mock-placement"

const COMPANIES = [
  "TCS",
  "Infosys",
  "Wipro",
  "Accenture",
  "Cognizant",
  "Capgemini"
]

function MockPlacementDrive() {
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const userId = user?._id || user?.id || ""

  const [company, setCompany] = useState("TCS")

  const [aptitudeScore, setAptitudeScore] = useState("")
  const [codingScore, setCodingScore] = useState("")
  const [technicalScore, setTechnicalScore] = useState("")
  const [systemDesignScore, setSystemDesignScore] = useState("")
  const [hrScore, setHrScore] = useState("")

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleMouseMove = (e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()

    card.style.setProperty("--x", `${e.clientX - rect.left}px`)
    card.style.setProperty("--y", `${e.clientY - rect.top}px`)
  }

  const safeNumber = (value) => {
    const number = Number(value)
    if (Number.isNaN(number)) return 0
    return Math.min(Math.max(number, 0), 100)
  }

  const generateResult = async () => {
    try {
      setLoading(true)

      const res = await axios.post(`${API}/generate`, {
        userId,
        company,
        aptitudeScore: safeNumber(aptitudeScore),
        codingScore: safeNumber(codingScore),
        technicalScore: safeNumber(technicalScore),
        systemDesignScore: safeNumber(systemDesignScore),
        hrScore: safeNumber(hrScore)
      })

      setResult(res.data.drive || null)
    } catch (error) {
      console.log(error)
      alert("Failed to generate placement result")
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-700 flex items-center justify-center shadow-[0_0_45px_rgba(250,204,21,0.35)]">
                <Trophy className="text-white" size={34} />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 text-cyan-300 mb-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20">
                  <Sparkles size={16} />
                  <span className="text-sm">AI Placement Drive Simulator</span>
                </div>

                <h1 className="text-4xl lg:text-5xl font-black text-white text-glow">
                  Mock Placement Drive
                </h1>

                <p className="text-slate-400 mt-3 leading-7 max-w-4xl">
                  Simulate a complete company placement process using aptitude,
                  coding, technical, system design and HR scores.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <MiniStat icon={Building2} label="Company" value={company} />
              <MiniStat icon={Briefcase} label="Mode" value="Drive" />
              <MiniStat icon={TrendingUp} label="AI Result" value="Ready" />
            </div>
          </div>
        </section>

        <section
          onMouseMove={handleMouseMove}
          className="glow-card relative overflow-hidden rounded-[2.5rem] border border-cyan-400/10 bg-slate-950/70 p-8 hover:border-cyan-300/30"
        >
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(34,211,238,0.14),transparent_38%)]" />

          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-6">
              Placement Stages
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <StageCard icon={Brain} title="Aptitude" />
              <StageCard icon={Code2} title="Coding" />
              <StageCard icon={Target} title="Technical" />
              <StageCard icon={Building2} title="System Design" />
              <StageCard icon={Users} title="HR Round" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <select
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="input bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-cyan-400"
              >
                {COMPANIES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <ScoreInput
                placeholder="Aptitude Score"
                value={aptitudeScore}
                onChange={setAptitudeScore}
              />

              <ScoreInput
                placeholder="Coding Score"
                value={codingScore}
                onChange={setCodingScore}
              />

              <ScoreInput
                placeholder="Technical Score"
                value={technicalScore}
                onChange={setTechnicalScore}
              />

              <ScoreInput
                placeholder="System Design Score"
                value={systemDesignScore}
                onChange={setSystemDesignScore}
              />

              <ScoreInput
                placeholder="HR Score"
                value={hrScore}
                onChange={setHrScore}
              />
            </div>

            <button
              type="button"
              onClick={generateResult}
              disabled={loading}
              className="glow-button mt-6 w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-700 text-white font-bold shadow-[0_0_40px_rgba(34,211,238,0.25)] disabled:opacity-60"
            >
              {loading ? "Generating..." : "Generate Placement Result"}
            </button>
          </div>
        </section>

        {result && (
          <section
            onMouseMove={handleMouseMove}
            className="glow-card relative overflow-hidden rounded-[3rem] border border-emerald-400/20 bg-emerald-500/10 p-10"
          >
            <div className="absolute -top-28 -right-28 w-[420px] h-[420px] rounded-full bg-emerald-400/20 blur-[120px]" />
            <div className="absolute -bottom-28 -left-28 w-[420px] h-[420px] rounded-full bg-cyan-500/20 blur-[120px]" />

            <div className="relative z-10">
              <div className="text-center mb-8">
                <CheckCircle className="mx-auto text-emerald-400 mb-4" size={76} />

                <h2 className="text-4xl lg:text-5xl font-black text-white">
                  {result.verdict || "Placement Result Generated"}
                </h2>

                <p className="text-slate-400 mt-3">Placement Probability</p>

                <h3 className="text-8xl font-black bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent mt-3">
                  {result.placementChance || 0}%
                </h3>

                <div className="mt-6 max-w-3xl mx-auto">
                  <div className="h-4 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600"
                      style={{ width: `${result.placementChance || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <ResultCard
                  icon={Building2}
                  label="Company"
                  value={result.company || company}
                  tone="cyan"
                />

                <ResultCard
                  icon={Trophy}
                  label="Overall Score"
                  value={`${result.overallScore || 0}%`}
                  tone="yellow"
                />

                <ResultCard
                  icon={Briefcase}
                  label="Salary Prediction"
                  value={result.salaryPrediction || "Not available"}
                  tone="green"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-8">
                <ScoreCard title="Aptitude" score={aptitudeScore} />
                <ScoreCard title="Coding" score={codingScore} />
                <ScoreCard title="Technical" score={technicalScore} />
                <ScoreCard title="Design" score={systemDesignScore} />
                <ScoreCard title="HR" score={hrScore} />
              </div>
            </div>
          </section>
        )}
      </div>
    </MainLayout>
  )
}

function ScoreInput({ placeholder, value, onChange }) {
  return (
    <input
      type="number"
      min="0"
      max="100"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-cyan-400"
    />
  )
}

function StageCard({ icon: Icon, title }) {
  return (
    <div className="rounded-2xl border border-cyan-400/10 bg-white/[0.04] p-4 text-center hover:border-cyan-300/30 transition-all">
      <Icon size={26} className="mx-auto text-cyan-300 mb-2" />
      <p className="text-white font-medium">{title}</p>
    </div>
  )
}

function ResultCard({ icon: Icon, label, value, tone = "cyan" }) {
  const toneMap = {
    cyan: "text-cyan-300",
    yellow: "text-yellow-300",
    green: "text-emerald-300"
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-5 hover:border-cyan-300/30 transition-all">
      <Icon className={`${toneMap[tone] || toneMap.cyan} mb-3`} size={30} />
      <p className="text-slate-400">{label}</p>
      <h3 className="text-white text-2xl font-bold mt-1">{value}</h3>
    </div>
  )
}

function ScoreCard({ title, score }) {
  const safe = Math.min(Number(score) || 0, 100)

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
      <p className="text-slate-400 mb-2">{title}</p>

      <h3 className="text-cyan-300 text-3xl font-bold">{safe}%</h3>

      <div className="h-2 rounded-full bg-slate-800 mt-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-blue-600"
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  )
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 min-w-[120px]">
      <div className="flex items-center gap-2 text-cyan-300 mb-1">
        <Icon size={16} />
        <span className="text-xs">{label}</span>
      </div>

      <p className="text-white font-semibold text-sm truncate">{value}</p>
    </div>
  )
}

export default MockPlacementDrive