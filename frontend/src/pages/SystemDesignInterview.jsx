import { useState } from "react"
import axios from "axios"
import MainLayout from "../layouts/MainLayout.jsx"

import {
  Brain,
  Send,
  CheckCircle,
  Star,
  XCircle,
  Sparkles
} from "lucide-react"

const API = "http://localhost:5000/api/system-design"

function SystemDesignInterview() {
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const userId = user?._id || user?.id || ""

  const [difficulty, setDifficulty] = useState("Beginner")
  const [topic, setTopic] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [problem, setProblem] = useState("")
  const [prompt, setPrompt] = useState("")
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState("")

  const [started, setStarted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [result, setResult] = useState(null)

  const currentQuestion = questions[currentIndex] || {}

  const currentQuestionText =
    typeof currentQuestion === "string"
      ? currentQuestion
      : currentQuestion?.question || ""

  const currentQuestionType =
    typeof currentQuestion === "string"
      ? "System Design"
      : currentQuestion?.type || "System Design"

  const handleMouseMove = (e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()

    card.style.setProperty("--x", `${e.clientX - rect.left}px`)
    card.style.setProperty("--y", `${e.clientY - rect.top}px`)
  }

  const startInterview = async () => {
    try {
      setLoading(true)
      setResult(null)
      setCompleted(false)

      const res = await axios.post(`${API}/start`, {
        userId,
        difficulty,
        topic
      })

      const questionData = res.data.questions || res.data.session?.questions || []

      setSessionId(res.data.sessionId || res.data.session?._id || "")
      setProblem(res.data.problem || res.data.session?.problem || "")
      setPrompt(res.data.prompt || res.data.session?.prompt || "")
      setQuestions(Array.isArray(questionData) ? questionData : [])
      setCurrentIndex(0)
      setAnswer("")
      setStarted(true)
    } catch (error) {
      alert(error.response?.data?.message || "Failed to start system design")
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (!answer.trim()) {
      alert("Please write your answer first.")
      return
    }

    if (!sessionId) {
      alert("Session not found. Please restart the interview.")
      return
    }

    try {
      setSubmitting(true)

      const res = await axios.post(`${API}/answer`, {
        sessionId,
        question: currentQuestionText,
        answer
      })

      setResult(res.data)
      setCompleted(Boolean(res.data.completed))
    } catch (error) {
      alert(error.response?.data?.message || "Answer evaluation failed")
    } finally {
      setSubmitting(false)
    }
  }

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setAnswer("")
      setResult(null)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8 page-fade">
        <section
          onMouseMove={handleMouseMove}
          className="glow-card relative overflow-hidden rounded-[3rem] border border-cyan-400/20 bg-slate-950/90 p-8 shadow-[0_0_120px_rgba(34,211,238,0.12)]"
        >
          <div className="absolute -top-28 -right-28 w-[460px] h-[460px] bg-cyan-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[460px] h-[460px] bg-purple-600/20 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(34,211,238,0.16),transparent_35%)]" />

          <div className="relative z-10 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-[0_0_45px_rgba(34,211,238,0.35)]">
              <Brain className="text-white" size={34} />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 text-cyan-300 mb-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20">
                <Sparkles size={16} />
                <span className="text-sm">AI System Design Interview</span>
              </div>

              <h1 className="text-4xl lg:text-5xl font-black text-white text-glow">
                System Design Mode
              </h1>

              <p className="text-slate-400 mt-3 leading-7 max-w-4xl">
                Practice architecture, scalability, database design, API design,
                bottlenecks and trade-offs with AI evaluation.
              </p>
            </div>
          </div>
        </section>

        {!started && (
          <section
            onMouseMove={handleMouseMove}
            className="glow-card relative overflow-hidden rounded-[2.3rem] p-8 border border-cyan-400/10 hover:border-cyan-300/30 bg-white/[0.04] backdrop-blur-2xl"
          >
            <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(34,211,238,0.14),transparent_38%)]" />

            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-6">
                Start System Design Interview
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-cyan-400"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>

                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Custom topic e.g. WhatsApp, Netflix"
                  className="bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-cyan-400"
                />

                <button
                  type="button"
                  onClick={startInterview}
                  disabled={loading}
                  className="glow-button rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-700 text-white font-semibold disabled:opacity-60 py-4"
                >
                  {loading ? "Starting..." : "Start Interview"}
                </button>
              </div>
            </div>
          </section>
        )}

        {started && questions.length === 0 && !completed && (
          <section
            onMouseMove={handleMouseMove}
            className="glow-card rounded-[3rem] p-10 text-center border border-cyan-400/10 hover:border-cyan-300/30"
          >
            <Brain className="mx-auto text-cyan-300 mb-5" size={70} />

            <h2 className="text-3xl font-bold text-white">
              No Questions Generated
            </h2>

            <p className="text-slate-400 mt-3">
              Please restart the interview or check backend response.
            </p>
          </section>
        )}

        {started && questions.length > 0 && !completed && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <section
              onMouseMove={handleMouseMove}
              className="glow-card rounded-[2.3rem] p-6 border border-cyan-400/10 hover:border-cyan-300/30"
            >
              <h2 className="text-3xl font-bold text-white mb-3">
                {problem || topic || "System Design Problem"}
              </h2>

              <p className="text-slate-300 leading-7 mb-6">
                {prompt ||
                  "Design the system with requirements, APIs, database, scalability, trade-offs and bottlenecks."}
              </p>

              <div className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 p-6 backdrop-blur-xl">
                <p className="text-cyan-300 font-semibold mb-2">
                  Question {currentIndex + 1} / {questions.length}
                </p>

                <p className="text-purple-300 text-sm mb-3">
                  {currentQuestionType}
                </p>

                <p className="text-white text-xl leading-8">
                  {currentQuestionText || "No question found."}
                </p>
              </div>
            </section>

            <section
              onMouseMove={handleMouseMove}
              className="glow-card rounded-[2.3rem] p-6 border border-cyan-400/10 hover:border-cyan-300/30"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                Your Design Answer
              </h2>

              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Explain requirements, architecture, APIs, database schema, scalability, bottlenecks and trade-offs..."
                className="w-full min-h-[350px] bg-slate-950/80 border border-white/10 rounded-[2rem] p-6 text-white outline-none resize-none focus:border-cyan-400 focus:shadow-[0_0_40px_rgba(34,211,238,0.15)] transition-all"
              />

              <button
                type="button"
                onClick={submitAnswer}
                disabled={submitting}
                className="glow-button mt-5 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-2 disabled:opacity-60"
              >
                <Send size={18} />
                {submitting ? "Evaluating..." : "Submit Answer"}
              </button>
            </section>
          </div>
        )}

        {result && (
          <section
            onMouseMove={handleMouseMove}
            className="glow-card rounded-[2.3rem] p-8 border border-cyan-400/10 hover:border-cyan-300/30"
          >
            <h2 className="text-3xl font-bold text-white mb-5">
              AI Evaluation
            </h2>

            <p className="text-6xl font-black bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent mb-6">
              {result.overallScore || result.score || 0}%
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <MetricCard label="Architecture" value={result.architectureScore} />
              <MetricCard label="Scalability" value={result.scalabilityScore} />
              <MetricCard label="Database" value={result.databaseScore} />
              <MetricCard label="API Design" value={result.apiDesignScore} />
              <MetricCard
                label="Communication"
                value={result.communicationScore}
              />
            </div>

            <InfoBox title="Feedback" value={result.feedback} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              <ListCard
                title="Strengths"
                icon={Star}
                items={result.strengths || []}
                color="emerald"
              />

              <ListCard
                title="Weaknesses"
                icon={XCircle}
                items={result.weaknesses || []}
                color="red"
              />
            </div>

            {result.improvedAnswer && (
              <InfoBox
                title="Improved Answer"
                value={result.improvedAnswer}
                tone="blue"
              />
            )}

            {result.followUpQuestion && (
              <div className="rounded-2xl bg-purple-500/10 border border-purple-400/20 p-5 text-purple-300 mb-5">
                <strong>Follow-up Question:</strong>{" "}
                {result.followUpQuestion}
              </div>
            )}

            {!result.completed && currentIndex < questions.length - 1 && (
              <button
                type="button"
                onClick={nextQuestion}
                className="glow-button px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold border border-white/10"
              >
                Next Question
              </button>
            )}
          </section>
        )}

        {completed && (
          <section
            onMouseMove={handleMouseMove}
            className="glow-card rounded-[3rem] p-12 text-center border border-emerald-400/20 bg-emerald-500/10"
          >
            <CheckCircle className="mx-auto text-emerald-400 mb-5" size={76} />

            <h2 className="text-5xl font-bold text-white mb-3">
              System Design Completed
            </h2>

            <p className="text-slate-400 mb-6">
              {result?.verdict || "System design interview completed."}
            </p>

            <p className="text-7xl font-black bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
              {result?.totalScore || result?.overallScore || result?.score || 0}
              %
            </p>
          </section>
        )}
      </div>
    </MainLayout>
  )
}

function MetricCard({ label, value }) {
  const safeValue = Math.min(Number(value) || 0, 100)

  return (
    <div className="glow-card rounded-[2rem] border border-white/10 bg-slate-950/60 p-5 hover:border-cyan-300/30 transition-all">
      <div className="flex justify-between mb-3 gap-3">
        <p className="text-slate-300 text-sm break-words">{label}</p>
        <p className="text-white font-bold shrink-0">{safeValue}%</p>
      </div>

      <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  )
}

function InfoBox({ title, value, tone = "slate" }) {
  const toneClass =
    tone === "blue"
      ? "bg-blue-500/10 border-blue-400/20 text-blue-200"
      : "bg-slate-950/60 border-white/10 text-slate-300"

  return (
    <div className={`rounded-2xl border p-5 mb-5 ${toneClass}`}>
      <p className="text-cyan-300 font-semibold mb-2">{title}</p>

      <p className="leading-7 whitespace-pre-line">
        {value || "No data available."}
      </p>
    </div>
  )
}

function ListCard({ title, icon: Icon, items = [], color }) {
  const colorClass =
    color === "red"
      ? "bg-red-500/10 border-red-400/20 text-red-300"
      : "bg-emerald-500/10 border-emerald-400/20 text-emerald-300"

  return (
    <div className={`rounded-2xl border p-5 ${colorClass}`}>
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Icon size={18} />
        {title}
      </h3>

      <div className="space-y-2">
        {items.length > 0 ? (
          items.map((item, index) => <p key={`${title}-${index}`}>• {item}</p>)
        ) : (
          <p>No data available.</p>
        )}
      </div>
    </div>
  )
}

export default SystemDesignInterview