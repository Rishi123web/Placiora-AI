import { useState } from "react"
import axios from "axios"
import API_BASE from "../config/api"

import MainLayout from "../layouts/MainLayout.jsx"

import {
  Users,
  Send,
  Trophy,
  MessageSquare,
  PlayCircle,
  CheckCircle,
  Sparkles,
  Lightbulb
} from "lucide-react"

const API = `${API_BASE}/api/gd-round`

const TOPIC_SUGGESTIONS = [
  "Impact of Artificial Intelligence on Jobs",
  "Remote Work vs Office Work",
  "Social Media: Boon or Curse",
  "Should College Degrees Be Mandatory",
  "Future of Electric Vehicles",
  "Startup vs Corporate Career",
  "Is AI Replacing Human Creativity",
  "Online Education vs Classroom Learning",
  "Work Life Balance in Modern Companies",
  "Role of Technology in Education"
]

function GDRound() {
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const userId = user?._id || user?.id || ""

  const [topic, setTopic] = useState("Impact of Artificial Intelligence on Jobs")
  const [difficulty, setDifficulty] = useState("Beginner")

  const [gdId, setGdId] = useState("")
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleMouseMove = (e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()

    card.style.setProperty("--x", `${e.clientX - rect.left}px`)
    card.style.setProperty("--y", `${e.clientY - rect.top}px`)
  }

  const startGD = async () => {
    try {
      setLoading(true)

      const res = await axios.post(`${API}/start`, {
        userId,
        topic,
        difficulty
      })

      setGdId(res.data.gdId || "")
      setMessages(res.data.messages || [])
      setResult(null)
      setMessage("")
    } catch (error) {
      console.log("GD start error:", error)
      alert(error.response?.data?.message || "Failed to start GD round")
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!message.trim() || !gdId) return

    try {
      const currentMessage = message.trim()
      setMessage("")

      const res = await axios.post(`${API}/message`, {
        gdId,
        message: currentMessage
      })

      setMessages(res.data.messages || [])
    } catch (error) {
      console.log("GD message error:", error)
      alert(error.response?.data?.message || "Failed to send message")
    }
  }

  const finishGD = async () => {
    if (!gdId) return

    try {
      setLoading(true)

      const res = await axios.post(`${API}/finish`, {
        gdId
      })

      setResult(res.data.gd || null)
    } catch (error) {
      console.log("GD finish error:", error)
      alert(error.response?.data?.message || "Failed to evaluate GD")
    } finally {
      setLoading(false)
    }
  }

  const overallReadiness = result
    ? Math.round(
        ((Number(result.communicationScore) || 0) +
          (Number(result.contentScore) || 0) +
          (Number(result.leadershipScore) || 0) +
          (Number(result.confidenceScore) || 0) +
          (Number(result.listeningScore) || 0)) /
          5
      )
    : 0

  const recruiterVerdict =
    overallReadiness >= 80
      ? "Excellent GD performance. Strong placement readiness with confident communication and clear leadership signals."
      : overallReadiness >= 65
      ? "Good GD performance. You can perform well with more structured points and sharper examples."
      : "Needs more practice. Focus on clear speaking, listening, structured arguments and confidence."

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8 page-fade">
        <section
          onMouseMove={handleMouseMove}
          className="glow-card relative overflow-hidden rounded-[3rem] border border-cyan-400/20 bg-slate-950/90 p-8 shadow-[0_0_120px_rgba(34,211,238,0.12)]"
        >
          <div className="absolute -top-28 -right-28 w-[460px] h-[460px] bg-cyan-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[460px] h-[460px] bg-purple-600/20 rounded-full blur-3xl" />

          <div className="relative z-10 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-700 flex items-center justify-center shadow-[0_0_45px_rgba(34,211,238,0.35)]">
              <Users size={32} className="text-white" />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 text-cyan-300 mb-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20">
                <Sparkles size={16} />
                <span className="text-sm">AI Group Discussion Simulator</span>
              </div>

              <h1 className="text-4xl lg:text-5xl font-black text-white text-glow">
                AI Group Discussion
              </h1>

              <p className="text-slate-400 mt-3 leading-7 max-w-4xl">
                Practice GD rounds with AI participants, structured discussion,
                instant replies and final evaluation on communication, content,
                leadership, confidence and listening.
              </p>
            </div>
          </div>
        </section>

        {!gdId && (
          <section
            onMouseMove={handleMouseMove}
            className="glow-card rounded-[2.3rem] p-8 border border-cyan-400/10 hover:border-cyan-300/30"
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              Start New GD Round
            </h2>

            <div className="space-y-5">
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter GD Topic"
                className="w-full bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-cyan-400"
              />

              <div className="flex flex-wrap gap-3">
                {TOPIC_SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTopic(item)}
                    className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/30 transition-all"
                  >
                    {item}
                  </button>
                ))}
              </div>

              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-cyan-400"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>

              <button
                type="button"
                onClick={startGD}
                disabled={loading}
                className="glow-button px-7 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-700 text-white font-semibold flex items-center gap-2 disabled:opacity-60"
              >
                <PlayCircle size={20} />
                {loading ? "Starting..." : "Start GD"}
              </button>
            </div>
          </section>
        )}

        {gdId && (
          <section
            onMouseMove={handleMouseMove}
            className="glow-card rounded-[2.3rem] p-6 border border-cyan-400/10 hover:border-cyan-300/30"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
                  <MessageSquare size={26} className="text-cyan-300" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Discussion Room
                  </h2>
                  <p className="text-slate-400">{topic}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Badge text={difficulty} tone="purple" />
                <Badge text={`${messages.length} Messages`} tone="cyan" />
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-6">
              <div className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-5">
                <h3 className="text-white font-bold mb-4">Participants</h3>

                <Participant name="You" role="Candidate" active />
                <Participant name="Aisha" role="AI Participant" />
                <Participant name="Rohan" role="AI Participant" />
                <Participant name="Meera" role="AI Participant" />
              </div>

              <div>
                <div className="space-y-4 max-h-[520px] overflow-y-auto mb-6 pr-2">
                  {messages.map((msg, index) => {
                    const isUser = msg.speaker === "user"

                    return (
                      <div
                        key={`${msg.name || "message"}-${index}`}
                        className={`rounded-[1.5rem] border p-4 ${
                          isUser
                            ? "bg-cyan-500/10 border-cyan-400/20"
                            : "bg-slate-950/70 border-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                              isUser
                                ? "bg-cyan-500 text-white"
                                : "bg-purple-500/20 text-purple-300"
                            }`}
                          >
                            {(msg.name || "AI").charAt(0)}
                          </div>

                          <div>
                            <p className="text-cyan-300 font-semibold">
                              {msg.name || "Participant"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {msg.role ||
                                (isUser ? "Candidate" : "AI Participant")}
                            </p>
                          </div>
                        </div>

                        <p className="text-slate-200 leading-7">
                          {msg.message}
                        </p>
                      </div>
                    )
                  })}
                </div>

                {!result && (
                  <>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") sendMessage()
                        }}
                        placeholder="Share your opinion..."
                        className="flex-1 bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-cyan-400"
                      />

                      <button
                        type="button"
                        onClick={sendMessage}
                        className="px-6 py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center"
                      >
                        <Send size={18} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={finishGD}
                      disabled={loading}
                      className="glow-button mt-5 px-6 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-700 text-white font-semibold flex items-center gap-2 disabled:opacity-60"
                    >
                      <CheckCircle size={18} />
                      {loading ? "Evaluating..." : "Finish & Evaluate"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {result && (
          <section
            onMouseMove={handleMouseMove}
            className="glow-card rounded-[3rem] p-8 border border-cyan-400/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <Trophy size={36} className="text-yellow-400" />
              <h2 className="text-3xl font-bold text-white">GD Evaluation</h2>
            </div>

            <div className="rounded-[2rem] border border-cyan-400/20 bg-cyan-500/10 p-6 mb-6">
              <p className="text-slate-400 mb-2">Overall GD Readiness</p>
              <h3 className="text-6xl font-black text-cyan-300">
                {overallReadiness}%
              </h3>
              <p className="text-slate-300 mt-4 leading-7">
                {recruiterVerdict}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
              <ScoreCard
                title="Communication"
                score={result.communicationScore}
              />
              <ScoreCard title="Content" score={result.contentScore} />
              <ScoreCard title="Leadership" score={result.leadershipScore} />
              <ScoreCard title="Confidence" score={result.confidenceScore} />
              <ScoreCard title="Listening" score={result.listeningScore} />
              <ScoreCard title="Overall" score={result.overallScore} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <InfoBlock title="Feedback" value={result.feedback} />
              <InfoBlock title="Final Verdict" value={result.finalVerdict} />
              <ListBlock
                title="Strengths"
                items={result.strengths}
                tone="green"
              />
              <ListBlock
                title="Weaknesses"
                items={result.weaknesses}
                tone="red"
              />
            </div>

            <InfoBlock
              title="Improved Response"
              value={result.improvedResponse}
              tone="blue"
            />
          </section>
        )}
      </div>
    </MainLayout>
  )
}

function Badge({ text, tone = "cyan" }) {
  const tones = {
    cyan: "bg-cyan-500/10 border-cyan-400/20 text-cyan-300",
    purple: "bg-purple-500/10 border-purple-400/20 text-purple-300"
  }

  return (
    <span
      className={`px-4 py-2 rounded-xl border ${tones[tone] || tones.cyan}`}
    >
      {text}
    </span>
  )
}

function Participant({ name, role, active = false }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold ${
          active
            ? "bg-cyan-500 text-white shadow-[0_0_30px_rgba(34,211,238,0.25)]"
            : "bg-purple-500/15 text-purple-300"
        }`}
      >
        {name.charAt(0)}
      </div>

      <div>
        <p className="text-white font-semibold">{name}</p>
        <p className="text-slate-500 text-sm">{role}</p>
      </div>
    </div>
  )
}

function ScoreCard({ title, score }) {
  const safeScore = Math.min(Number(score) || 0, 100)

  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-5">
      <p className="text-slate-400 mb-2">{title}</p>
      <h3 className="text-4xl font-black text-cyan-300">{safeScore}%</h3>

      <div className="h-3 rounded-full bg-slate-800 overflow-hidden mt-4">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600"
          style={{ width: `${safeScore}%` }}
        />
      </div>
    </div>
  )
}

function InfoBlock({ title, value, tone = "slate" }) {
  const toneClass =
    tone === "blue"
      ? "bg-blue-500/10 border-blue-400/20 text-blue-200"
      : "bg-slate-950/70 border-white/10 text-slate-300"

  return (
    <div className={`rounded-[2rem] border p-5 mt-5 ${toneClass}`}>
      <h4 className="text-cyan-300 font-semibold mb-2">{title}</h4>
      <p className="leading-7 whitespace-pre-line">
        {value || "No data available"}
      </p>
    </div>
  )
}

function ListBlock({ title, items = [], tone = "slate" }) {
  const toneClass =
    tone === "red"
      ? "bg-red-500/10 border-red-400/20 text-red-200"
      : tone === "green"
      ? "bg-emerald-500/10 border-emerald-400/20 text-emerald-200"
      : "bg-slate-950/70 border-white/10 text-slate-300"

  return (
    <div className={`rounded-[2rem] border p-5 ${toneClass}`}>
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <Lightbulb size={18} />
        {title}
      </h4>

      {items && items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item, index) => (
            <p key={`${title}-${index}`} className="leading-7">
              • {item}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-slate-400">No data available</p>
      )}
    </div>
  )
}

export default GDRound
