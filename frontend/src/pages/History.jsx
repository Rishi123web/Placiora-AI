import { useEffect, useState } from "react"
import MainLayout from "../layouts/MainLayout.jsx"
import PageHeader from "../components/PageHeader.jsx"
import FluidCard from "../components/FluidCard.jsx"
import GlowButton from "../components/GlowButton.jsx"

import {
  Calendar,
  History as HistoryIcon,
  Trophy,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Brain,
  Mic,
  Target,
  MessageCircle,
  Building2,
  MessagesSquare,
  Download,
  Video,
  FileText
} from "lucide-react"

const API_URL = "http://localhost:5000"

function History() {
  const [sessions, setSessions] = useState([])
  const [gdRounds, setGdRounds] = useState([])
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState("")
  const [expandedInterview, setExpandedInterview] = useState("")
  const [expandedGD, setExpandedGD] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true

    async function loadHistory() {
      try {
        setLoading(true)
        setNotice("")

        const user = JSON.parse(localStorage.getItem("user") || "{}")
        const userId = user?._id || user?.id

        if (!userId) {
          if (active) {
            setSessions([])
            setGdRounds([])
            setNotice("User not found. Please login again.")
          }
          return
        }

        let interviewList = []
        let gdList = []

        try {
          const res = await fetch(
            `${API_URL}/api/live-interview/history/${userId}`
          )

          if (res.ok) {
            const data = await res.json()
            interviewList = Array.isArray(data.sessions) ? data.sessions : []
          }
        } catch {
          interviewList = []
        }

        try {
          const res = await fetch(
            `${API_URL}/api/live-gd-round/history/${userId}`
          )

          if (res.ok) {
            const data = await res.json()
            gdList = Array.isArray(data.rounds) ? data.rounds : []
          }
        } catch {
          gdList = []
        }

        if (active) {
          setSessions(interviewList)
          setGdRounds(gdList)

          if (interviewList.length === 0 && gdList.length === 0) {
            setNotice("No history found yet.")
          }
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadHistory()

    return () => {
      active = false
    }
  }, [refreshKey])

  const formatDate = (date) => {
    if (!date) return "No date"
    const d = new Date(date)
    return Number.isNaN(d.getTime()) ? "No date" : d.toLocaleString()
  }

  const downloadInterviewReport = (session) => {
    if (!session?._id) return

    window.open(
      `${API_URL}/api/report/interview/live/${session._id}`,
      "_blank"
    )
  }

  const openRecording = (url) => {
    if (!url) return
    window.open(url, "_blank")
  }

  const averageScore =
    sessions.length > 0
      ? Math.round(
          sessions.reduce(
            (sum, item) => sum + (Number(item.totalScore) || 0),
            0
          ) / sessions.length
        )
      : 0

  const averageHiring =
    sessions.length > 0
      ? Math.round(
          sessions.reduce(
            (sum, item) => sum + (Number(item.hiringProbability) || 0),
            0
          ) / sessions.length
        )
      : 0

  const averageCommunication =
    sessions.length > 0
      ? Math.round(
          sessions.reduce(
            (sum, item) =>
              sum + (Number(item.averageCommunicationAnalysisScore) || 0),
            0
          ) / sessions.length
        )
      : 0

  const completedCount =
    sessions.filter((item) => item.completed).length +
    gdRounds.filter((item) => item.completed).length

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <PageHeader
          icon={HistoryIcon}
          eyebrow="Performance Timeline"
          title="History & Reports"
          description="View interview history, GD transcripts, scores, AI feedback, downloadable PDF reports and saved recordings."
          gradient="from-cyan-500 to-blue-700"
        />

        <div className="flex justify-end">
          <GlowButton
            onClick={() => setRefreshKey((prev) => prev + 1)}
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Refresh
          </GlowButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
          <StatCard title="Total Sessions" value={sessions.length + gdRounds.length} icon={Brain} />
          <StatCard title="Average Score" value={`${averageScore}%`} icon={Trophy} />
          <StatCard title="Hiring Chance" value={`${averageHiring}%`} icon={Target} />
          <StatCard title="Communication" value={`${averageCommunication}%`} icon={MessageCircle} />
          <StatCard title="Completed" value={completedCount} icon={CheckCircle} />
          <StatCard title="Live GD" value={gdRounds.length} icon={MessagesSquare} />
        </div>

        {loading && (
          <FluidCard className="text-center">
            <RefreshCw className="animate-spin text-cyan-300 mx-auto mb-4" />
            <p className="text-slate-300">Loading history...</p>
          </FluidCard>
        )}

        {!loading && notice && (
          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-5 text-yellow-300">
            {notice}
          </div>
        )}

        {!loading && sessions.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-3xl font-bold text-white">
              Live Interview History
            </h2>

            {sessions.map((session, index) => {
              const sessionId = session._id || `interview-${index}`
              const open = expandedInterview === sessionId

              return (
                <FluidCard key={sessionId}>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        {session.role || "Live Interview"}
                      </h3>

                      <div className="flex flex-wrap gap-3 mt-3 text-slate-400">
                        <span className="flex items-center gap-2">
                          <Building2 size={16} />
                          {session.company || "General"}
                        </span>

                        <span className="flex items-center gap-2">
                          <Calendar size={16} />
                          {formatDate(session.createdAt)}
                        </span>

                        <span className="flex items-center gap-2">
                          <Mic size={16} />
                          {Array.isArray(session.answers)
                            ? session.answers.length
                            : 0}{" "}
                          Answered
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Badge icon={Trophy} text={`${session.totalScore || 0}%`} />
                      <Badge icon={Target} text={`${session.hiringProbability || 0}% Hire`} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-5">
                    <MetricBox label="Technical" value={session.technicalAverage || 0} />
                    <MetricBox label="Communication" value={session.communicationAverage || 0} />
                    <MetricBox label="Confidence" value={session.confidenceAverage || 0} />
                    <MetricBox label="Clarity" value={session.clarityAverage || 0} />
                    <MetricBox label="Problem Solving" value={session.problemSolvingAverage || 0} />
                  </div>

                  <div className="flex flex-wrap gap-3 mt-5">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedInterview(open ? "" : sessionId)
                      }
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold"
                    >
                      {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      {open ? "Hide Details" : "View Details"}
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadInterviewReport(session)}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 hover:bg-cyan-500/20 font-semibold"
                    >
                      <FileText size={18} />
                      Download Report
                    </button>

                    {session.recordingUrl && (
                      <button
                        type="button"
                        onClick={() => openRecording(session.recordingUrl)}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-500/10 border border-purple-400/20 text-purple-300 hover:bg-purple-500/20 font-semibold"
                      >
                        <Video size={18} />
                        View Recording
                      </button>
                    )}

                    {session.recordingUrl && (
                      <a
                        href={session.recordingUrl}
                        download
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 hover:bg-emerald-500/20 font-semibold"
                      >
                        <Download size={18} />
                        Download Video
                      </a>
                    )}
                  </div>

                  {open && (
                    <div className="mt-6 space-y-4">
                      {Array.isArray(session.answers) &&
                      session.answers.length > 0 ? (
                        session.answers.map((answer, ansIndex) => (
                          <AnswerCard
                            key={`${sessionId}-${ansIndex}`}
                            answer={answer}
                            index={ansIndex}
                          />
                        ))
                      ) : (
                        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-5 text-yellow-300">
                          No answers saved for this session.
                        </div>
                      )}
                    </div>
                  )}
                </FluidCard>
              )
            })}
          </section>
        )}

        {!loading && gdRounds.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-3xl font-bold text-white">
              Live GD Round History
            </h2>

            {gdRounds.map((round, index) => {
              const roundId = round._id || `gd-${index}`
              const open = expandedGD === roundId

              return (
                <FluidCard key={roundId}>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        {round.topic || "Live GD Round"}
                      </h3>

                      <div className="flex flex-wrap gap-3 mt-3 text-slate-400">
                        <span>{round.company || "General"}</span>
                        <span>{round.difficulty || "Beginner"}</span>
                        <span>{formatDate(round.createdAt)}</span>
                      </div>
                    </div>

                    <Badge icon={Trophy} text={`${round.overallScore || 0}%`} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-5">
                    <MetricBox label="Communication" value={round.communicationScore || 0} />
                    <MetricBox label="Content" value={round.contentScore || 0} />
                    <MetricBox label="Leadership" value={round.leadershipScore || 0} />
                    <MetricBox label="Confidence" value={round.confidenceScore || 0} />
                    <MetricBox label="Overall" value={round.overallScore || 0} />
                  </div>

                  {round.feedback && (
                    <div className="mt-5 rounded-2xl bg-slate-950/60 border border-white/10 p-4">
                      <p className="text-cyan-300 font-semibold mb-2">
                        Feedback
                      </p>
                      <p className="text-slate-300 leading-7">
                        {round.feedback}
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setExpandedGD(open ? "" : roundId)}
                    className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold"
                  >
                    {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    {open ? "Hide Transcript" : "View Transcript"}
                  </button>

                  {open && (
                    <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                      <p className="text-fuchsia-300 font-semibold mb-4">
                        GD Transcript
                      </p>

                      {Array.isArray(round.messages) &&
                      round.messages.length > 0 ? (
                        <div className="space-y-4">
                          {round.messages.map((msg, msgIndex) => (
                            <div
                              key={`${roundId}-${msgIndex}`}
                              className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"
                            >
                              <p className="text-cyan-300 font-semibold">
                                {msg.name || "Participant"}
                              </p>
                              <p className="text-slate-300 mt-2 leading-7">
                                {msg.message || ""}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400">No transcript saved.</p>
                      )}
                    </div>
                  )}
                </FluidCard>
              )
            })}
          </section>
        )}
      </div>
    </MainLayout>
  )
}

function StatCard({ title, value, icon: Icon }) {
  return (
    <FluidCard className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <h2 className="text-4xl font-bold text-white mt-2">{value}</h2>
        </div>
        <Icon className="text-cyan-300" size={34} />
      </div>
    </FluidCard>
  )
}

function Badge({ icon: Icon, text }) {
  return (
    <div className="px-5 py-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 flex items-center gap-2">
      <Icon size={18} />
      <span>{text}</span>
    </div>
  )
}

function MetricBox({ label, value }) {
  const safeValue = Math.min(Number(value) || 0, 100)

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-slate-300 text-sm">{label}</p>
        <p className="text-white font-bold">{safeValue}%</p>
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

function AnswerCard({ answer, index }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
      <p className="text-cyan-300 font-semibold mb-3">
        Q{index + 1}. {answer.question || "Question"}
      </p>

      <p className="text-slate-400 text-sm mb-1">Your Answer</p>
      <p className="text-slate-300 leading-7 mb-4">
        {answer.transcript || answer.answer || "No transcript available."}
      </p>

      <p className="text-slate-400 text-sm mb-1">AI Feedback</p>
      <p className="text-slate-300 leading-7">
        {answer.feedback || "No feedback available."}
      </p>
    </div>
  )
}

export default History