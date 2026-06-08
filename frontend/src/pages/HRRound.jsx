import { useState } from "react"
import axios from "axios"
import API_BASE from "../config/api"
import MainLayout from "../layouts/MainLayout.jsx"

import {
  Users,
  Building2,
  Send,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  RefreshCcw
} from "lucide-react"

const API = `${API_BASE}/api/hr-interview`

const ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Software Engineer",
  "Data Analyst",
  "Business Analyst",
  "UI UX Designer",
  "Product Manager",
  "Project Manager",
  "Operations Manager",
  "HR Executive",
  "Talent Acquisition Specialist",
  "Digital Marketing Executive",
  "SEO Specialist",
  "Sales Executive",
  "Business Development Executive",
  "Customer Success Executive",
  "Financial Analyst",
  "Accountant",
  "Management Consultant",
  "Strategy Analyst",
  "Graduate Trainee",
  "Management Trainee",
  "Operations Executive",
  "General Placement Interview"
]

const COMPANIES = [
  "General",
  "Google",
  "Amazon",
  "Microsoft",
  "Meta",
  "Apple",
  "Adobe",
  "Uber",
  "Flipkart",
  "TCS",
  "Infosys",
  "Wipro",
  "Accenture",
  "Cognizant",
  "Capgemini",
  "HCL",
  "Tech Mahindra",
  "Deloitte",
  "PwC",
  "EY",
  "KPMG",
  "Goldman Sachs",
  "JPMorgan",
  "Startup Interview"
]

function HRRound() {
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const userId = user?._id || user?.id || ""

  const [role, setRole] = useState("Frontend Developer")
  const [company, setCompany] = useState("General")
  const [difficulty, setDifficulty] = useState("Beginner")

  const [sessionId, setSessionId] = useState("")
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState("")
  const [started, setStarted] = useState(false)
  const [completed, setCompleted] = useState(false)

  const [evaluation, setEvaluation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [listening, setListening] = useState(false)

  const currentQuestion = questions[currentIndex] || ""

  const handleMouseMove = (e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    card.style.setProperty("--x", `${e.clientX - rect.left}px`)
    card.style.setProperty("--y", `${e.clientY - rect.top}px`)
  }

  const resetEvaluation = () => {
    setEvaluation(null)
  }

  const speak = (text) => {
    if (!window.speechSynthesis || !text) return

    window.speechSynthesis.cancel()

    const selectedVoice = localStorage.getItem("aiVoice") || "female"
    const utterance = new SpeechSynthesisUtterance(text)

    if (selectedVoice === "female") {
      utterance.rate = 0.95
      utterance.pitch = 1.12
    } else if (selectedVoice === "calm") {
      utterance.rate = 0.82
      utterance.pitch = 0.95
    } else {
      utterance.rate = 0.75
      utterance.pitch = 0.72
    }

    const voices = window.speechSynthesis.getVoices()
    utterance.voice =
      voices.find((v) => v.name.toLowerCase().includes("zira")) ||
      voices.find((v) => v.name.toLowerCase().includes("aria")) ||
      voices.find((v) => v.lang?.toLowerCase().startsWith("en")) ||
      voices[0]

    window.speechSynthesis.speak(utterance)
  }

  const startVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.interimResults = true
    recognition.continuous = true

    let finalText = answer

    recognition.onstart = () => setListening(true)

    recognition.onresult = (event) => {
      let interim = ""

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript

        if (event.results[i].isFinal) {
          finalText += ` ${transcript}`
        } else {
          interim += transcript
        }
      }

      setAnswer(`${finalText} ${interim}`.trim())
    }

    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognition.start()

    window.hrRecognition = recognition
  }

  const stopVoiceInput = () => {
    try {
      window.hrRecognition?.stop()
    } catch {
      // ignore
    }

    setListening(false)
  }

  const startInterview = async () => {
    try {
      setLoading(true)
      setCompleted(false)
      resetEvaluation()

      const res = await axios.post(
        `${API}/start`,
        {
          userId,
          role,
          company,
          difficulty
        },
        { timeout: 20000 }
      )

      setSessionId(res.data.sessionId || "")
      setQuestions(Array.isArray(res.data.questions) ? res.data.questions : [])
      setCurrentIndex(0)
      setAnswer("")
      setStarted(true)

      if (res.data.firstQuestion) {
        speak(res.data.firstQuestion)
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to start HR interview")
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (!answer.trim()) {
      alert("Please enter your answer")
      return
    }

    if (!sessionId) {
      alert("Session not found. Please restart HR interview.")
      return
    }

    try {
      setSubmitting(true)

      const res = await axios.post(
        `${API}/answer`,
        {
          sessionId,
          question: currentQuestion,
          answer
        },
        { timeout: 25000 }
      )

      setEvaluation(res.data)

      const voiceFeedback = `Your answer score is ${res.data.score} percent. ${res.data.feedback}`
      speak(voiceFeedback)

      if (res.data.completed) {
        setCompleted(true)
      }
    } catch (error) {
      alert(
        error.code === "ECONNABORTED"
          ? "Evaluation took too long. Please try again."
          : error.response?.data?.message || "Failed to evaluate answer"
      )
    } finally {
      setSubmitting(false)
    }
  }

  const nextQuestion = () => {
    if (currentIndex >= questions.length - 1) {
      setCompleted(true)
      return
    }

    const nextIndex = currentIndex + 1
    setCurrentIndex(nextIndex)
    setAnswer("")
    resetEvaluation()

    setTimeout(() => {
      speak(questions[nextIndex])
    }, 300)
  }

  const restartInterview = () => {
    setSessionId("")
    setQuestions([])
    setCurrentIndex(0)
    setAnswer("")
    setStarted(false)
    setCompleted(false)
    setEvaluation(null)
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8 page-fade">
        <section
          onMouseMove={handleMouseMove}
          className="glow-card relative overflow-hidden rounded-[3rem] border border-cyan-400/20 bg-slate-950/90 p-8 shadow-[0_0_120px_rgba(34,211,238,0.12)]"
        >
          <div className="absolute -top-28 -right-28 w-[460px] h-[460px] bg-pink-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[460px] h-[460px] bg-purple-600/20 rounded-full blur-3xl" />

          <div className="relative z-10 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-700 flex items-center justify-center shadow-[0_0_45px_rgba(168,85,247,0.35)]">
              <Users size={32} className="text-white" />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 text-cyan-300 mb-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20">
                <Sparkles size={16} />
                <span className="text-sm">AI Recruiter Simulation</span>
              </div>

              <h1 className="text-4xl lg:text-5xl font-black text-white text-glow">
                AI HR Interview Round
              </h1>

              <p className="text-slate-400 mt-3 leading-7 max-w-4xl">
                Practice HR answers with recruiter voice, speech input,
                STAR-method evaluation, follow-up questions and selection
                probability.
              </p>
            </div>
          </div>
        </section>

        {!started && (
          <section
            onMouseMove={handleMouseMove}
            className="glow-card rounded-[2.3rem] p-8 border border-cyan-400/10 hover:border-cyan-300/30"
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              Start HR Interview
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Select value={role} onChange={setRole} items={ROLES} />
              <Select value={company} onChange={setCompany} items={COMPANIES} />
              <Select
                value={difficulty}
                onChange={setDifficulty}
                items={["Beginner", "Intermediate", "Advanced"]}
              />
            </div>

            <button
              type="button"
              onClick={startInterview}
              disabled={loading}
              className="glow-button mt-6 px-7 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold disabled:opacity-60"
            >
              {loading ? "Starting..." : "Start HR Interview"}
            </button>
          </section>
        )}

        {started && (
          <>
            <section
              onMouseMove={handleMouseMove}
              className="glow-card rounded-[2.3rem] p-8 border border-cyan-400/10 hover:border-cyan-300/30"
            >
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <Badge icon={Building2} text={company} tone="purple" />
                <Badge text={role} tone="cyan" />
                <Badge text={difficulty} tone="yellow" />
              </div>

              <p className="text-pink-300 font-semibold mb-3">
                Question {currentIndex + 1} / {questions.length}
              </p>

              <h2 className="text-2xl font-bold text-white leading-8">
                {currentQuestion || "No question found"}
              </h2>

              <button
                type="button"
                onClick={() => speak(currentQuestion)}
                className="mt-4 px-4 py-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 flex items-center gap-2"
              >
                <Volume2 size={18} />
                Speak Question
              </button>

              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={8}
                placeholder="Type your HR answer or use mic..."
                className="w-full mt-6 bg-slate-900/80 border border-white/10 rounded-2xl p-5 text-white outline-none focus:border-cyan-400 resize-none"
              />

              <div className="flex flex-wrap gap-3 mt-5">
                <button
                  type="button"
                  onClick={listening ? stopVoiceInput : startVoiceInput}
                  className={`px-6 py-4 rounded-2xl flex items-center gap-2 border ${
                    listening
                      ? "bg-red-500/20 text-red-300 border-red-400/20"
                      : "bg-white/10 text-white border-white/10"
                  }`}
                >
                  {listening ? <MicOff size={18} /> : <Mic size={18} />}
                  {listening ? "Stop Mic" : "Use Mic"}
                </button>

                <button
                  type="button"
                  onClick={submitAnswer}
                  disabled={submitting || completed}
                  className="glow-button px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center gap-2 disabled:opacity-60"
                >
                  <Send size={18} />
                  {submitting ? "Evaluating..." : "Submit Answer"}
                </button>

                {!completed && evaluation && currentIndex < questions.length - 1 && (
                  <button
                    type="button"
                    onClick={nextQuestion}
                    className="px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold border border-white/10"
                  >
                    Next Question
                  </button>
                )}

                {!completed && evaluation && currentIndex >= questions.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setCompleted(true)}
                    className="px-6 py-4 rounded-2xl bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-400/20"
                  >
                    Finish Interview
                  </button>
                )}

                <button
                  type="button"
                  onClick={restartInterview}
                  className="px-6 py-4 rounded-2xl bg-red-500/10 text-red-300 font-semibold border border-red-400/20 flex items-center gap-2"
                >
                  <RefreshCcw size={18} />
                  Restart
                </button>
              </div>
            </section>

            {evaluation && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
                  <MetricCard title="Overall" value={evaluation.score} />
                  <MetricCard
                    title="Confidence"
                    value={evaluation.confidenceScore}
                  />
                  <MetricCard
                    title="Communication"
                    value={evaluation.communicationScore}
                  />
                  <MetricCard
                    title="Professional"
                    value={evaluation.professionalismScore}
                  />
                  <MetricCard
                    title="STAR"
                    value={evaluation.starStructureScore}
                  />
                  <MetricCard title="Relevance" value={evaluation.relevanceScore} />
                </div>

                <section
                  onMouseMove={handleMouseMove}
                  className="glow-card rounded-[2.3rem] p-8 border border-purple-400/20 bg-purple-500/10"
                >
                  <h2 className="text-3xl font-bold text-white mb-3">
                    HR Selection Probability
                  </h2>

                  <div className="text-6xl font-black text-cyan-300">
                    {evaluation.hrSelectionProbability || 0}%
                  </div>

                  <p className="text-yellow-300 mt-4">
                    {evaluation.selectionLevel || "Not calculated"}
                  </p>

                  <p className="text-slate-300 mt-5 leading-7">
                    {evaluation.recruiterVerdict || "No recruiter verdict yet."}
                  </p>
                </section>

                <InfoBox title="AI Feedback" value={evaluation.feedback} />

                <InfoBox
                  title="Improved Answer"
                  value={evaluation.improvedAnswer}
                  tone="blue"
                />

                <InfoBox
                  title="Recruiter Follow-up Question"
                  value={evaluation.followUpQuestion}
                  tone="purple"
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <ListPanel
                    title="Strengths"
                    items={evaluation.strengths}
                    tone="green"
                    emptyText="No strengths found."
                  />

                  <ListPanel
                    title="Weaknesses"
                    items={evaluation.weaknesses}
                    tone="red"
                    emptyText="No weaknesses found."
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <ListPanel
                    title="Blockers"
                    items={evaluation.blockers}
                    tone="red"
                    emptyText="No blockers found."
                  />

                  <ListPanel
                    title="Recommendations"
                    items={evaluation.recommendations}
                    tone="green"
                    emptyText="Keep practicing HR interview answers."
                  />
                </div>
              </>
            )}

            {completed && (
              <section
                onMouseMove={handleMouseMove}
                className="glow-card rounded-[3rem] p-10 text-center border border-cyan-400/20"
              >
                <CheckCircle
                  className="mx-auto text-emerald-400 mb-5"
                  size={72}
                />

                <h2 className="text-5xl font-bold text-white mb-3">
                  HR Interview Completed
                </h2>

                <p className="text-slate-400 text-lg mb-6">
                  Your recruiter verdict and selection probability are ready.
                </p>

                <p className="text-6xl font-bold text-cyan-300">
                  {evaluation?.hrSelectionProbability || 0}%
                </p>
              </section>
            )}
          </>
        )}
      </div>
    </MainLayout>
  )
}

function Select({ value, onChange, items }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-4 text-white"
    >
      {items.map((item) => (
        <option key={item}>{item}</option>
      ))}
    </select>
  )
}

function Badge({ icon: Icon, text, tone = "cyan" }) {
  const tones = {
    cyan: "bg-cyan-500/10 border-cyan-400/20 text-cyan-300",
    purple: "bg-purple-500/10 border-purple-400/20 text-purple-300",
    yellow: "bg-yellow-500/10 border-yellow-400/20 text-yellow-300"
  }

  return (
    <span
      className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${
        tones[tone] || tones.cyan
      }`}
    >
      {Icon && <Icon size={16} />}
      {text}
    </span>
  )
}

function MetricCard({ title, value }) {
  const safeValue = Math.min(Number(value) || 0, 100)

  return (
    <div className="glow-card rounded-[2rem] p-5 border border-cyan-400/10 min-w-0">
      <p className="text-slate-400 mb-2">{title}</p>
      <h3 className="text-3xl font-black text-white">{safeValue}%</h3>

      <div className="h-3 rounded-full bg-slate-800 overflow-hidden mt-4">
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
      : tone === "purple"
      ? "bg-purple-500/10 border-purple-400/20 text-purple-200"
      : "bg-slate-950/60 border-white/10 text-slate-300"

  return (
    <section className={`rounded-[2rem] border p-6 ${toneClass}`}>
      <h3 className="text-white font-bold text-2xl mb-3">{title}</h3>
      <p className="whitespace-pre-line leading-7">
        {value || "No data yet."}
      </p>
    </section>
  )
}

function ListPanel({ title, items = [], tone = "slate", emptyText }) {
  const toneClass =
    tone === "red"
      ? "bg-red-500/10 border-red-400/20 text-red-200"
      : tone === "green"
      ? "bg-emerald-500/10 border-emerald-400/20 text-emerald-200"
      : "bg-slate-950/60 border-white/10 text-slate-300"

  return (
    <section className={`rounded-[2rem] border p-6 ${toneClass}`}>
      <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
        <AlertTriangle size={18} />
        {title}
      </h3>

      {items?.length > 0 ? (
        <div className="space-y-2">
          {items.map((item, index) => (
            <p key={index} className="leading-7">
              • {item}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-slate-400">{emptyText || "No data available."}</p>
      )}
    </section>
  )
}

export default HRRound
