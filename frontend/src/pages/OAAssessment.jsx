import { useEffect, useState } from "react"
import axios from "axios"
import MainLayout from "../layouts/MainLayout.jsx"

import {
  Brain,
  Trophy,
  Clock,
  Send,
  AlertTriangle,
  Lightbulb,
  Building2,
  Star,
  RotateCw,
  Sparkles,
  CheckCircle,
  Target,
  BarChart3
} from "lucide-react"
const API = "http://localhost:5000/api/oa-assessment"

const COMPANIES = [
  "General",
  "TCS",
  "Infosys",
  "Wipro",
  "Accenture",
  "Cognizant",
  "Capgemini"
]

function OAAssessment() {
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const userId = user?._id || user?.id || ""

  const [company, setCompany] = useState("General")
  const [difficulty, setDifficulty] = useState("Beginner")

  const [assessmentId, setAssessmentId] = useState("")
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState([])

  const [durationMinutes, setDurationMinutes] = useState(30)
  const [timeLeft, setTimeLeft] = useState(0)

  const [started, setStarted] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [result, setResult] = useState(null)

  const currentQuestion = questions[currentIndex] || {}

  const handleMouseMove = (e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    card.style.setProperty("--x", `${e.clientX - rect.left}px`)
    card.style.setProperty("--y", `${e.clientY - rect.top}px`)
  }

  useEffect(() => {
    if (!started || completed) return

    if (timeLeft <= 0) {
      finishAssessment(true)
      return
    }

    const timer = setTimeout(() => {
      setTimeLeft((oldTime) => oldTime - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [timeLeft, started, completed])

  async function finishAssessment(autoFinish = false) {
    if (!assessmentId) {
      if (!autoFinish) alert("Assessment not found. Please restart.")
      return
    }

    if (!autoFinish && answers.length === 0) {
      const confirmFinish = window.confirm(
        "You have not answered anything. Finish assessment?"
      )

      if (!confirmFinish) return
    }

    try {
      setFinishing(true)

      const res = await axios.post(`${API}/submit`, {
        assessmentId,
        answers
      })

      setResult(res.data.assessment || null)
      setStarted(false)
      setCompleted(true)
    } catch (error) {
      console.log("OA finish error:", error)
      alert(error.response?.data?.message || "Failed to finish assessment")
    } finally {
      setFinishing(false)
    }
  }

  const startAssessment = async () => {
    try {
      setLoading(true)
      setCompleted(false)
      setResult(null)

      const res = await axios.post(`${API}/start`, {
        userId,
        company,
        difficulty
      })

      const questionList = Array.isArray(res.data.questions)
        ? res.data.questions
        : []

      const minutes = Number(res.data.durationMinutes) || 30

      setAssessmentId(res.data.assessmentId || "")
      setQuestions(questionList)
      setCurrentIndex(0)
      setAnswers([])
      setDurationMinutes(minutes)
      setTimeLeft(minutes * 60)
      setStarted(true)
    } catch (error) {
      console.log("OA start error:", error)
      alert(error.response?.data?.message || "Failed to start assessment")
    } finally {
      setLoading(false)
    }
  }

  const chooseAnswer = (selectedAnswer) => {
    const questionId = currentQuestion.id

    setAnswers((oldAnswers) => {
      const alreadyAnswered = oldAnswers.find((item) => item.id === questionId)

      if (alreadyAnswered) {
        return oldAnswers.map((item) =>
          item.id === questionId ? { ...item, selectedAnswer } : item
        )
      }

      return [
        ...oldAnswers,
        {
          id: questionId,
          question: currentQuestion.question,
          section: currentQuestion.section,
          selectedAnswer
        }
      ]
    })
  }

  const selectedAnswer = () => {
    const found = answers.find((item) => item.id === currentQuestion.id)
    return found?.selectedAnswer || ""
  }

  const formatTime = (seconds) => {
    const safeSeconds = Math.max(Number(seconds) || 0, 0)
    const mins = Math.floor(safeSeconds / 60)
    const secs = safeSeconds % 60

    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const previousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const resetAssessment = () => {
    setAssessmentId("")
    setQuestions([])
    setCurrentIndex(0)
    setAnswers([])
    setTimeLeft(0)
    setStarted(false)
    setCompleted(false)
    setResult(null)
  }

  const sectionLabel = (section) => {
    if (section === "aptitude") return "Aptitude"
    if (section === "technical") return "Technical MCQ"
    if (section === "coding") return "Coding Logic"
    return "Question"
  }

  const sectionStyle = (section) => {
    if (section === "aptitude") {
      return "bg-yellow-500/10 border-yellow-400/20 text-yellow-300"
    }

    if (section === "technical") {
      return "bg-cyan-500/10 border-cyan-400/20 text-cyan-300"
    }

    return "bg-purple-500/10 border-purple-400/20 text-purple-300"
  }

  const progress =
    questions.length > 0 ? Math.round((answers.length / questions.length) * 100) : 0

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8 page-fade">
        <section
          onMouseMove={handleMouseMove}
          className="glow-card relative overflow-hidden rounded-[3rem] border border-cyan-400/20 bg-slate-950/90 p-8 shadow-[0_0_120px_rgba(34,211,238,0.12)]"
        >
          <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-orange-500/20 blur-[140px]" />
          <div className="absolute -bottom-40 -left-40 w-[520px] h-[520px] rounded-full bg-cyan-600/20 blur-[140px]" />
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(34,211,238,0.16),transparent_35%)]" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-700 flex items-center justify-center shadow-[0_0_45px_rgba(249,115,22,0.35)]">
                <Brain size={34} className="text-white" />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 text-cyan-300 mb-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20">
                  <Sparkles size={16} />
                  <span className="text-sm">Company OA Simulation</span>
                </div>

                <h1 className="text-4xl lg:text-5xl font-black text-white text-glow">
                  Online Assessment Simulator
                </h1>

                <p className="text-slate-400 mt-3 leading-7 max-w-4xl">
                  Practice company-style aptitude, technical MCQ and coding
                  logic rounds with timer, question navigator and AI scoring.
                </p>
              </div>
            </div>

            {started && (
              <div className="px-7 py-5 rounded-[2rem] bg-red-500/10 border border-red-400/20 text-red-300 flex items-center gap-3 shadow-[0_0_45px_rgba(239,68,68,0.16)]">
                <Clock size={24} />
                <span className="text-4xl font-black">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
        </section>

        {!started && !completed && (
          <section
            onMouseMove={handleMouseMove}
            className="glow-card relative overflow-hidden rounded-[2.3rem] p-8 border border-cyan-400/10 hover:border-cyan-300/30"
          >
            <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(34,211,238,0.14),transparent_38%)]" />

            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-6">
                Start Company OA
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <select
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-cyan-400"
                >
                  {COMPANIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-cyan-400"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>

                <button
                  type="button"
                  onClick={startAssessment}
                  disabled={loading}
                  className="glow-button rounded-2xl bg-gradient-to-r from-orange-500 to-red-700 text-white font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <RotateCw size={18} className={loading ? "animate-spin" : ""} />
                  {loading ? "Starting..." : "Start Assessment"}
                </button>
              </div>
            </div>
          </section>
        )}

        {started && !completed && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section
              onMouseMove={handleMouseMove}
              className="xl:col-span-2 glow-card relative overflow-hidden rounded-[2.3rem] p-8 border border-cyan-400/10 hover:border-cyan-300/30"
            >
              <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(34,211,238,0.12),transparent_35%)]" />

              <div className="relative z-10">
                <div className="flex flex-wrap items-center gap-3 mb-5">
                  <Badge icon={Building2} text={company} tone="purple" />
                  <Badge text={difficulty} />
                  <span
                    className={`px-4 py-2 rounded-xl border ${sectionStyle(
                      currentQuestion.section
                    )}`}
                  >
                    {sectionLabel(currentQuestion.section)}
                  </span>
                  <Badge text={`Marks: ${currentQuestion.marks || 1}`} />
                </div>

                <p className="text-cyan-300 font-semibold mb-3">
                  Question {currentIndex + 1} / {questions.length}
                </p>

                <h2 className="text-2xl lg:text-3xl font-bold text-white leading-10 mb-8">
                  {currentQuestion.question || "No question found."}
                </h2>

                <div className="space-y-4">
                  {(currentQuestion.options || []).map((option, index) => {
                    const active = selectedAnswer() === option

                    return (
                      <button
                        key={`${option}-${index}`}
                        type="button"
                        onClick={() => chooseAnswer(option)}
                        className={`w-full text-left px-5 py-4 rounded-2xl border transition-all duration-300 ${
                          active
                            ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-400 text-white shadow-[0_0_28px_rgba(34,211,238,0.18)]"
                            : "bg-slate-950/70 border-white/10 text-slate-300 hover:border-cyan-400/30 hover:bg-cyan-500/5"
                        }`}
                      >
                        <span className="font-semibold mr-3">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        {option}
                      </button>
                    )
                  })}
                </div>

                <div className="flex flex-wrap justify-between gap-3 mt-8">
                  <button
                    type="button"
                    onClick={previousQuestion}
                    disabled={currentIndex === 0}
                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <div className="flex flex-wrap gap-3">
                    {currentIndex < questions.length - 1 ? (
                      <button
                        type="button"
                        onClick={nextQuestion}
                        className="glow-button px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => finishAssessment(false)}
                        disabled={finishing}
                        className="glow-button px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-2 disabled:opacity-60"
                      >
                        <Send size={18} />
                        {finishing ? "Finishing..." : "Finish Assessment"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <aside
              onMouseMove={handleMouseMove}
              className="glow-card relative overflow-hidden rounded-[2.3rem] p-6 border border-cyan-400/10 hover:border-cyan-300/30"
            >
              <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(34,211,238,0.10),transparent_35%)]" />

              <div className="relative z-10">
                <h2 className="text-2xl font-bold text-white mb-5">
                  Question Navigator
                </h2>

                <div className="mb-6">
                  <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-3">
                  {questions.map((question, index) => {
                    const answered = answers.some((item) => item.id === question.id)
                    const active = currentIndex === index

                    return (
                      <button
                        key={question.id}
                        type="button"
                        onClick={() => setCurrentIndex(index)}
                        className={`h-12 rounded-xl border font-semibold transition-all ${
                          active
                            ? "bg-cyan-500 border-cyan-300 text-white shadow-[0_0_25px_rgba(34,211,238,0.25)]"
                            : answered
                            ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-300"
                            : "bg-white/5 border-white/10 text-slate-400"
                        }`}
                      >
                        {index + 1}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-6 space-y-3 text-slate-300">
                  <NavigatorLine icon={Target} label="Total" value={questions.length} />
                  <NavigatorLine icon={CheckCircle} label="Answered" value={answers.length} />
                  <NavigatorLine icon={Clock} label="Duration" value={`${durationMinutes} min`} />
                </div>

                <button
                  type="button"
                  onClick={() => finishAssessment(false)}
                  disabled={finishing}
                  className="w-full mt-6 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold disabled:opacity-60"
                >
                  Finish Now
                </button>
              </div>
            </aside>
          </div>
        )}

        {completed && result && (
          <>
            <section
              onMouseMove={handleMouseMove}
              className="glow-card relative overflow-hidden rounded-[3rem] p-10 text-center border border-emerald-400/20 bg-emerald-500/10"
            >
              <div className="absolute -top-28 -right-28 w-[420px] h-[420px] rounded-full bg-emerald-400/20 blur-[120px]" />
              <div className="absolute -bottom-28 -left-28 w-[420px] h-[420px] rounded-full bg-cyan-500/20 blur-[120px]" />

              <div className="relative z-10">
                <Star size={76} className="mx-auto text-emerald-400 mb-5" />

                <h2 className="text-5xl font-black text-white mb-3">
                  Assessment Completed
                </h2>

                <p className="text-slate-400 mb-6">
                  {result.verdict || "Your online assessment report is ready."}
                </p>

                <p className="text-8xl font-black bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent">
                  {result.percentage || 0}%
                </p>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <StatCard title="Selection Chance" value={`${result.selectionChance || 0}%`} icon={Trophy} onMouseMove={handleMouseMove} />
              <StatCard title="Aptitude" value={`${result.aptitudeScore || 0}%`} icon={Brain} onMouseMove={handleMouseMove} />
              <StatCard title="Technical" value={`${result.technicalScore || 0}%`} icon={BarChart3} onMouseMove={handleMouseMove} />
              <StatCard title="Coding" value={`${result.codingScore || 0}%`} icon={Star} onMouseMove={handleMouseMove} />
            </div>

            <section
              onMouseMove={handleMouseMove}
              className="glow-card rounded-[2.3rem] p-8 border border-cyan-400/10 hover:border-cyan-300/30"
            >
              <h2 className="text-3xl font-bold text-white mb-5">
                Score Summary
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <InfoBox label="Total Questions" value={result.totalQuestions} />
                <InfoBox label="Attempted" value={result.attemptedQuestions} />
                <InfoBox label="Correct" value={result.correctAnswers} />
                <InfoBox label="Marks" value={`${result.obtainedMarks}/${result.totalMarks}`} />
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <ListCard title="Strengths" icon={Star} items={result.strengths || []} color="emerald" />
              <ListCard title="Weaknesses" icon={AlertTriangle} items={result.weaknesses || []} color="red" />
              <ListCard title="Recommendations" icon={Lightbulb} items={result.recommendations || []} color="blue" />
            </div>

            <button
              type="button"
              onClick={resetAssessment}
              className="glow-button px-6 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-700 text-white font-semibold"
            >
              Start New Assessment
            </button>
          </>
        )}
      </div>
    </MainLayout>
  )
}

function Badge({ text, icon: Icon, tone = "cyan" }) {
  const tones = {
    cyan: "bg-cyan-500/10 border-cyan-400/20 text-cyan-300",
    purple: "bg-purple-500/10 border-purple-400/20 text-purple-300"
  }

  return (
    <span className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${tones[tone] || tones.cyan}`}>
      {Icon && <Icon size={16} />}
      {text}
    </span>
  )
}

function NavigatorLine({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3">
      <span className="flex items-center gap-2 text-slate-400">
        <Icon size={16} />
        {label}
      </span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, onMouseMove }) {
  return (
    <div
      onMouseMove={onMouseMove}
      className="glow-card rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-6 hover:border-cyan-300/30"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <h2 className="text-3xl font-bold text-white mt-2">{value}</h2>
        </div>

        <Icon className="text-cyan-300" size={34} />
      </div>
    </div>
  )
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
      <p className="text-slate-400 text-sm mb-2">{label}</p>
      <p className="text-white text-2xl font-bold">{value || 0}</p>
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

export default OAAssessment