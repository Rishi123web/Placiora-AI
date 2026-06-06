import { useCallback, useEffect, useState } from "react"
import axios from "axios"

import MainLayout from "../layouts/MainLayout.jsx"

import {
  Brain,
  Sparkles,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  RotateCcw
} from "lucide-react"

function AptitudeRound() {
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const userId = user?._id || user?.id

  const [category, setCategory] = useState("Mixed")
  const [difficulty, setDifficulty] = useState("Beginner")

  const [sessionId, setSessionId] = useState("")
  const [questions, setQuestions] = useState([])
  const [selectedAnswers, setSelectedAnswers] = useState([])

  const [result, setResult] = useState(null)
  const [timeLeft, setTimeLeft] = useState(300)
  const [started, setStarted] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleGlowMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()

    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`)
  }

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60
    return `${min}:${sec < 10 ? "0" : ""}${sec}`
  }

  const selectAnswer = (questionIndex, option) => {
    setSelectedAnswers((prev) => {
      const updated = [...prev]
      updated[questionIndex] = option
      return updated
    })
  }

  const resetRound = () => {
    setSessionId("")
    setQuestions([])
    setSelectedAnswers([])
    setResult(null)
    setStarted(false)
    setTimeLeft(300)
    setError("")
  }

  const submitRound = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      if (!sessionId) {
        setError("Session not found.")
        return
      }

      const response = await axios.post(
        "http://localhost:5000/api/aptitude/submit",
        {
          sessionId,
          answers: selectedAnswers
        }
      )

      setResult(response.data)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Aptitude submit failed."
      )
    } finally {
      setLoading(false)
    }
  }, [sessionId, selectedAnswers])

  useEffect(() => {
    if (!started || result) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          submitRound()
          return 0
        }

        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [started, result, submitRound])

  const startRound = async () => {
    try {
      setLoading(true)
      setError("")
      setResult(null)

      const response = await axios.post(
        "http://localhost:5000/api/aptitude/start",
        {
          userId,
          category,
          difficulty
        }
      )

      const fetchedQuestions = response.data.questions || []

      setSessionId(response.data.sessionId || "")
      setQuestions(fetchedQuestions)
      setSelectedAnswers(new Array(fetchedQuestions.length).fill(""))
      setTimeLeft(300)
      setStarted(true)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to start aptitude round."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8 page-fade">
        <section
          onMouseMove={handleGlowMove}
          className="glow-card relative overflow-hidden rounded-[3rem] border border-cyan-400/20 bg-slate-950/90 p-8"
        >
          <div className="absolute -top-32 -right-32 w-[520px] h-[520px] bg-cyan-500/20 rounded-full blur-[140px]" />
          <div className="absolute -bottom-32 -left-32 w-[420px] h-[420px] bg-purple-500/15 rounded-full blur-[120px]" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5">
            <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-cyan-400 via-blue-600 to-purple-700 flex items-center justify-center shadow-[0_0_55px_rgba(34,211,238,0.35)] border border-cyan-300/30">
              <Brain className="text-white" size={36} />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 text-cyan-300 mb-3 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20">
                <Sparkles size={16} />
                <span className="text-sm">Placement Aptitude Practice</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-white text-glow">
                Aptitude Round
              </h1>

              <p className="text-slate-400 mt-3 leading-7">
                Practice quantitative, reasoning and verbal MCQs with timed
                placement-style evaluation.
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div
            onMouseMove={handleGlowMove}
            className="glow-card p-5 rounded-2xl bg-red-500/10 border border-red-400/30 text-red-300 flex items-center gap-3"
          >
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {!started && (
          <section
            onMouseMove={handleGlowMove}
            className="glow-card rounded-[2.5rem] border border-cyan-400/20 bg-slate-950/80 p-8"
          >
            <h2 className="text-3xl font-bold text-white mb-2">
              Start Aptitude Test
            </h2>

            <p className="text-slate-400 mb-6">
              Select category and difficulty to begin your timed test.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-slate-900/90 border border-cyan-400/20 rounded-2xl px-5 py-4 text-white outline-none focus:border-cyan-400 focus:shadow-[0_0_30px_rgba(34,211,238,0.25)]"
              >
                <option value="Mixed">Mixed</option>
                <option value="Quantitative">Quantitative</option>
                <option value="Reasoning">Reasoning</option>
                <option value="Verbal">Verbal</option>
              </select>

              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="bg-slate-900/90 border border-cyan-400/20 rounded-2xl px-5 py-4 text-white outline-none focus:border-cyan-400 focus:shadow-[0_0_30px_rgba(34,211,238,0.25)]"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>

              <button
                type="button"
                onClick={startRound}
                disabled={loading}
                className="glow-button bg-gradient-to-r from-cyan-500 to-blue-700 rounded-2xl font-semibold text-white disabled:opacity-50 py-4 shadow-[0_0_30px_rgba(34,211,238,0.25)]"
              >
                {loading ? "Starting..." : "Start Round"}
              </button>
            </div>
          </section>
        )}

        {started && !result && (
          <section
            onMouseMove={handleGlowMove}
            className="glow-card rounded-[2.5rem] border border-cyan-400/20 bg-slate-950/80 p-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white">Questions</h2>
                <p className="text-slate-400 mt-2">
                  Choose the best option for each question.
                </p>
              </div>

              <div
                onMouseMove={handleGlowMove}
                className="glow-card px-5 py-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center gap-2 text-cyan-300 font-bold shadow-[0_0_30px_rgba(34,211,238,0.12)]"
              >
                <Clock size={20} />
                {formatTime(timeLeft)}
              </div>
            </div>

            <div className="space-y-6">
              {questions.map((question, index) => (
                <div
                  key={index}
                  onMouseMove={handleGlowMove}
                  className="glow-card p-6 rounded-[2rem] bg-slate-950/80 border border-cyan-400/10"
                >
                  <p className="text-cyan-300 mb-3 font-semibold">
                    Question {index + 1} • {question.category}
                  </p>

                  <h3 className="text-white text-xl font-semibold mb-5 leading-8">
                    {question.question}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {question.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onMouseMove={handleGlowMove}
                        onClick={() => selectAnswer(index, option)}
                        className={`relative overflow-hidden p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
                          selectedAnswers[index] === option
                            ? "bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_25px_rgba(34,211,238,0.25)] scale-[1.02]"
                            : "bg-slate-900/70 border-white/10 text-slate-300 hover:border-cyan-400/30 hover:bg-cyan-500/5 hover:text-white"
                        }`}
                      >
                        <span className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(34,211,238,0.18),transparent_40%)]" />
                        <span className="relative z-10">{option}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={submitRound}
              disabled={loading}
              className="glow-button mt-8 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold flex items-center gap-2 disabled:opacity-60"
            >
              <Send size={18} />
              {loading ? "Submitting..." : "Submit Test"}
            </button>
          </section>
        )}

        {result && (
          <section
            onMouseMove={handleGlowMove}
            className="glow-card rounded-[3rem] border border-cyan-400/20 bg-slate-950/85 p-8"
          >
            <div className="text-center mb-8">
              <div
                onMouseMove={handleGlowMove}
                className="glow-card mx-auto w-24 h-24 rounded-[2rem] bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center shadow-[0_0_45px_rgba(16,185,129,0.18)] mb-5"
              >
                <CheckCircle className="text-emerald-400" size={64} />
              </div>

              <h2 className="text-4xl font-black text-white mb-3 text-glow">
                Test Completed
              </h2>

              <p className="text-7xl font-black text-cyan-300">
                {result.score}%
              </p>

              <p className="text-slate-400 mt-4">
                Correct: {result.correctAnswers}/{result.totalQuestions}
              </p>
            </div>

            <div className="space-y-5">
              {result.answers?.map((answer, index) => (
                <div
                  key={index}
                  onMouseMove={handleGlowMove}
                  className={`glow-card p-6 rounded-[2rem] border ${
                    answer.isCorrect
                      ? "bg-emerald-500/10 border-emerald-400/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                      : "bg-red-500/10 border-red-400/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                  }`}
                >
                  <h3 className="text-white font-semibold mb-4 leading-7">
                    {index + 1}. {answer.question}
                  </h3>

                  <p className="text-slate-300">
                    Your Answer: {answer.selectedOption || "Not answered"}
                  </p>

                  <p className="text-slate-300">
                    Correct Answer: {answer.correctAnswer}
                  </p>

                  <p className="text-cyan-300 mt-3 leading-7">
                    Explanation: {answer.explanation}
                  </p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={resetRound}
              className="glow-button mt-8 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-700 text-white font-semibold inline-flex items-center gap-2"
            >
              <RotateCcw size={18} />
              Start Another Round
            </button>
          </section>
        )}
      </div>
    </MainLayout>
  )
}

export default AptitudeRound