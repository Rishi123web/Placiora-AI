import { useEffect, useMemo, useState } from "react"
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
  Lightbulb,
  Bot,
  Clock,
  BarChart3,
  Building2,
  Download,
  ShieldCheck,
  Target,
  Activity,
  Brain,
  TimerReset
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

const COMPANIES = [
  "General",
  "Google",
  "Microsoft",
  "Amazon",
  "TCS",
  "Infosys",
  "Wipro",
  "Accenture",
  "Deloitte"
]

const DEFAULT_AI_PARTICIPANTS = [
  {
    name: "Neha",
    role: "Moderator",
    personality: "Structured Moderator"
  },
  {
    name: "Priya",
    role: "Analytical Speaker",
    personality: "Analytical"
  },
  {
    name: "Rahul",
    role: "Counter Speaker",
    personality: "Critical Thinker"
  },
  {
    name: "Aarav",
    role: "Industry Expert",
    personality: "Business Oriented"
  },
  {
    name: "Meera",
    role: "Balanced Thinker",
    personality: "Balanced"
  }
]

function GDRound() {
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const userId = user?._id || user?.id || ""

  const [topic, setTopic] = useState("Impact of Artificial Intelligence on Jobs")
  const [difficulty, setDifficulty] = useState("Beginner")
  const [company, setCompany] = useState("General")

  const [gdId, setGdId] = useState("")
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const [aiParticipants, setAiParticipants] = useState(DEFAULT_AI_PARTICIPANTS)
  const [typingSpeaker, setTypingSpeaker] = useState("")
  const [liveMetrics, setLiveMetrics] = useState(null)
  const [discussionStage, setDiscussionStage] = useState("Setup")
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!gdId || result) return

    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [gdId, result])

  const formattedTime = useMemo(() => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }, [seconds])

  const userMessages = messages.filter((item) => item.speaker === "user")
  const wordCount = userMessages
    .map((item) => item.message || "")
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

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
        difficulty,
        company
      })

      setGdId(res.data.gdId || "")
      setMessages(res.data.messages || [])
      setAiParticipants(res.data.aiParticipants || DEFAULT_AI_PARTICIPANTS)
      setLiveMetrics(res.data.liveMetrics || null)
      setDiscussionStage(res.data.discussionStage || "Opening")
      setResult(null)
      setMessage("")
      setSeconds(0)
    } catch (error) {
      console.log("GD start error:", error)
      alert(error.response?.data?.message || "Failed to start GD round")
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!message.trim() || !gdId || loading) return

    try {
      const currentMessage = message.trim()
      setMessage("")
      setTypingSpeaker("AI panel is thinking...")

      const localUserMessage = {
        speaker: "user",
        name: "You",
        role: "Candidate",
        message: currentMessage
      }

      setMessages((prev) => [...prev, localUserMessage])

      const res = await axios.post(`${API}/message`, {
        gdId,
        message: currentMessage
      })

      const delay = Number(res.data.typingDelay) || 900

      setTimeout(() => {
        setMessages(res.data.messages || [])
        setLiveMetrics(res.data.liveMetrics || null)
        setDiscussionStage(res.data.discussionStage || "Core Discussion")
        setTypingSpeaker("")
      }, delay)
    } catch (error) {
      setTypingSpeaker("")
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
      setLiveMetrics(null)
      setDiscussionStage("Completed")
    } catch (error) {
      console.log("GD finish error:", error)
      alert(error.response?.data?.message || "Failed to evaluate GD")
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = () => {
    if (!gdId) return
    window.open(`${API}/download-report/${gdId}`, "_blank")
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
          className="glow-card relative overflow-hidden rounded-[3rem] border border-cyan-400/20 bg-slate-950/90 p-6 sm:p-8 shadow-[0_0_120px_rgba(34,211,238,0.12)]"
        >
          <div className="absolute -top-28 -right-28 w-[460px] h-[460px] bg-cyan-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[460px] h-[460px] bg-purple-600/20 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-700 flex items-center justify-center shadow-[0_0_45px_rgba(34,211,238,0.35)]">
              <Users size={32} className="text-white" />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 text-cyan-300 mb-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20">
                <Sparkles size={16} />
                <span className="text-sm">AI Group Discussion Simulator</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white text-glow">
                AI Group Discussion
              </h1>

              <p className="text-slate-400 mt-3 leading-7 max-w-4xl">
                Practice GD rounds with AI participants, moderator flow, live
                metrics, company-specific evaluation, final report and improved
                recruiter-ready response.
              </p>
            </div>
          </div>
        </section>

        {!gdId && (
          <section
            onMouseMove={handleMouseMove}
            className="glow-card rounded-[2.3rem] p-6 sm:p-8 border border-cyan-400/10 hover:border-cyan-300/30"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-cyan-400"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>

                <select
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-cyan-400"
                >
                  {COMPANIES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

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
            className="glow-card rounded-[2.3rem] p-4 sm:p-6 border border-cyan-400/10 hover:border-cyan-300/30"
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
                <Badge text={company} tone="cyan" />
                <Badge text={discussionStage} tone="green" />
                <Badge text={formattedTime} tone="yellow" />
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr_290px] gap-6">
              <div className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-5">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Bot size={18} className="text-cyan-300" />
                  Participants
                </h3>

                <Participant name="You" role="Candidate" active />

                {aiParticipants.map((item) => (
                  <Participant
                    key={item.name}
                    name={item.name}
                    role={item.role}
                    personality={item.personality}
                    speaking={typingSpeaker.includes(item.name)}
                  />
                ))}
              </div>

              <div>
                <StageTracker stage={discussionStage} />

                <div className="space-y-4 max-h-[52vh] lg:max-h-[560px] overflow-y-auto mb-6 pr-2 mt-5">
                  {messages.map((msg, index) => {
                    const isUser = msg.speaker === "user"

                    return (
                      <div
                        key={`${msg.name || "message"}-${index}`}
                        className={`rounded-[1.5rem] border p-4 ${
                          isUser
                            ? "bg-cyan-500/10 border-cyan-400/20"
                            : msg.role === "Moderator"
                            ? "bg-yellow-500/10 border-yellow-400/20"
                            : "bg-slate-950/70 border-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                              isUser
                                ? "bg-cyan-500 text-white"
                                : msg.role === "Moderator"
                                ? "bg-yellow-500/20 text-yellow-300"
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

                  {typingSpeaker && (
                    <div className="rounded-[1.5rem] border border-purple-400/20 bg-purple-500/10 p-4">
                      <p className="text-purple-300 font-semibold animate-pulse">
                        {typingSpeaker}
                      </p>
                    </div>
                  )}
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
                        disabled={loading || !message.trim()}
                        className="px-6 py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center disabled:opacity-50"
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

              <LiveMetricsPanel
                metrics={liveMetrics}
                wordCount={wordCount}
                messagesCount={userMessages.length}
                time={formattedTime}
              />
            </div>
          </section>
        )}

        {result && (
          <section
            onMouseMove={handleMouseMove}
            className="glow-card rounded-[3rem] p-6 sm:p-8 border border-cyan-400/20"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Trophy size={36} className="text-yellow-400" />
                <h2 className="text-3xl font-bold text-white">
                  GD Evaluation
                </h2>
              </div>

              <button
                type="button"
                onClick={downloadReport}
                className="px-5 py-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 hover:bg-cyan-500/20 font-semibold flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Download Report
              </button>
            </div>

            <div className="rounded-[2rem] border border-cyan-400/20 bg-cyan-500/10 p-6 mb-6">
              <p className="text-slate-400 mb-2">Overall GD Readiness</p>
              <h3 className="text-5xl sm:text-6xl font-black text-cyan-300">
                {overallReadiness}%
              </h3>
              <p className="text-slate-300 mt-4 leading-7">
                {recruiterVerdict}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
              <ScoreCard title="Communication" score={result.communicationScore} />
              <ScoreCard title="Content" score={result.contentScore} />
              <ScoreCard title="Leadership" score={result.leadershipScore} />
              <ScoreCard title="Confidence" score={result.confidenceScore} />
              <ScoreCard title="Listening" score={result.listeningScore} />
              <ScoreCard title="Critical Thinking" score={result.criticalThinkingScore} />
              <ScoreCard title="Participation" score={result.participationScore} />
              <ScoreCard title="Overall" score={result.overallScore} />
            </div>

            {result.placementReadiness && (
              <div className="rounded-[2rem] border border-purple-400/20 bg-purple-500/10 p-5 mb-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Building2 className="text-purple-300" />
                  Placement Readiness
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {Object.entries(result.placementReadiness).map(
                    ([companyName, score]) => (
                      <MiniMetric
                        key={companyName}
                        title={companyName.toUpperCase()}
                        score={score}
                      />
                    )
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <InfoBlock title="Feedback" value={result.feedback} />
              <InfoBlock title="Final Verdict" value={result.finalVerdict} />
              <ListBlock title="Strengths" items={result.strengths} tone="green" />
              <ListBlock title="Weaknesses" items={result.weaknesses} tone="red" />
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
    purple: "bg-purple-500/10 border-purple-400/20 text-purple-300",
    green: "bg-emerald-500/10 border-emerald-400/20 text-emerald-300",
    yellow: "bg-yellow-500/10 border-yellow-400/20 text-yellow-300"
  }

  return (
    <span className={`px-4 py-2 rounded-xl border ${tones[tone] || tones.cyan}`}>
      {text}
    </span>
  )
}

function Participant({ name, role, personality, active = false, speaking = false }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className={`relative w-11 h-11 rounded-2xl flex items-center justify-center font-bold ${
          active
            ? "bg-cyan-500 text-white shadow-[0_0_30px_rgba(34,211,238,0.25)]"
            : "bg-purple-500/15 text-purple-300"
        }`}
      >
        {speaking && (
          <span className="absolute inset-0 rounded-2xl border border-cyan-300 animate-ping" />
        )}
        {name.charAt(0)}
      </div>

      <div>
        <p className="text-white font-semibold">{name}</p>
        <p className="text-slate-500 text-sm">{role}</p>
        {personality && (
          <p className="text-cyan-400 text-xs">{personality}</p>
        )}
      </div>
    </div>
  )
}

function StageTracker({ stage }) {
  const stages = ["Opening", "Core Discussion", "Counter Arguments", "Conclusion"]
  const activeIndex = Math.max(0, stages.indexOf(stage))

  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-4">
      <p className="text-white font-bold mb-3 flex items-center gap-2">
        <TimerReset size={18} className="text-cyan-300" />
        Discussion Progress
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {stages.map((item, index) => (
          <div
            key={item}
            className={`rounded-xl border p-3 text-sm ${
              index <= activeIndex
                ? "bg-cyan-500/10 border-cyan-400/20 text-cyan-300"
                : "bg-white/[0.03] border-white/10 text-slate-500"
            }`}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

function LiveMetricsPanel({ metrics, wordCount, messagesCount, time }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-5 h-fit">
      <h3 className="text-white font-bold mb-4 flex items-center gap-2">
        <BarChart3 size={18} className="text-cyan-300" />
        Live Metrics
      </h3>

      <div className="grid grid-cols-2 xl:grid-cols-1 gap-3 mb-5">
        <MiniStat icon={Clock} title="Time" value={time} />
        <MiniStat icon={MessageSquare} title="Your Points" value={messagesCount} />
        <MiniStat icon={Activity} title="Words" value={wordCount} />
        <MiniStat icon={ShieldCheck} title="Stage" value={metrics?.stage || "Opening"} />
      </div>

      <MiniMetric title="Communication" score={metrics?.communicationScore || 0} />
      <MiniMetric title="Content" score={metrics?.contentScore || 0} />
      <MiniMetric title="Leadership" score={metrics?.leadershipScore || 0} />
      <MiniMetric title="Confidence" score={metrics?.confidenceScore || 0} />
      <MiniMetric title="Critical Thinking" score={metrics?.criticalThinkingScore || 0} />
    </div>
  )
}

function MiniStat({ icon: Icon, title, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-slate-500 text-xs flex items-center gap-2">
        <Icon size={14} />
        {title}
      </p>
      <p className="text-white font-bold mt-1">{value}</p>
    </div>
  )
}

function MiniMetric({ title, score }) {
  const safeScore = Math.min(Number(score) || 0, 100)

  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-slate-400">{title}</span>
        <span className="text-cyan-300 font-semibold">{safeScore}%</span>
      </div>

      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600"
          style={{ width: `${safeScore}%` }}
        />
      </div>
    </div>
  )
}

function ScoreCard({ title, score }) {
  const safeScore = Math.min(Number(score) || 0, 100)

  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-5">
      <p className="text-slate-400 mb-2 flex items-center gap-2">
        <Target size={16} />
        {title}
      </p>
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
      <h4 className="text-cyan-300 font-semibold mb-2 flex items-center gap-2">
        <Brain size={18} />
        {title}
      </h4>
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