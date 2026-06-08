import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import API_BASE from "../config/api"

import MainLayout from "../layouts/MainLayout.jsx"

import {
  Brain,
  FileText,
  History,
  Monitor,
  Code2,
  Award,
  Sparkles,
  ArrowRight,
  BarChart3,
  Gauge,
  Flame,
  BrainCircuit,
  Wand2,
  TrendingUp,
  Target,
  MessageCircle,
  Network,
  Trophy,
  MessageSquare,
  MessagesSquare
} from "lucide-react"

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"

function Dashboard() {
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const userName = user?.name || "User"
  const userId = user?._id || user?.id

  const [analytics, setAnalytics] = useState({
    totalInterviews: 0,
    averageScore: 0,
    bestScore: 0,
    liveInterviews: 0,
    latestScore: 0,
    completedSessions: 0,
    totalCodingRounds: 0,
    totalAptitudeRounds: 0,
    scoreTrend: [],
    activityBreakdown: [],
    skillRadar: [],
    averageHiringProbability: 0,
    bestHiringProbability: 0,
    latestHiringProbability: 0,
    latestSelectionLevel: "Not calculated",
    latestRecruiterVerdict: "",
    averageCommunicationAnalysisScore: 0,
    averageProfessionalVocabularyScore: 0,
    averageStarStructureScore: 0,
    latestCommunicationAnalysisScore: 0,
    latestProfessionalVocabularyScore: 0,
    latestStarStructureScore: 0
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true)

        if (!userId) {
          setLoading(false)
          return
        }

        const [analyticsResult, liveResult] = await Promise.allSettled([
          axios.get(`${API_BASE}/api/analytics/dashboard/${userId}`),
          axios.get(`${API_BASE}/api/live-interview/history/${userId}`)
        ])

        const stats =
          analyticsResult.status === "fulfilled"
            ? analyticsResult.value.data.stats || {}
            : {}

        const liveSessions =
          liveResult.status === "fulfilled" &&
          Array.isArray(liveResult.value.data.sessions)
            ? liveResult.value.data.sessions
            : []

        const hiringScores = liveSessions.map(
          (item) => Number(item.hiringProbability) || 0
        )

        const communicationScores = liveSessions.map(
          (item) => Number(item.averageCommunicationAnalysisScore) || 0
        )

        const vocabularyScores = liveSessions.map(
          (item) => Number(item.averageProfessionalVocabularyScore) || 0
        )

        const starScores = liveSessions.map(
          (item) => Number(item.averageStarStructureScore) || 0
        )

        const getAverage = (arr) =>
          arr.length
            ? Math.round(arr.reduce((sum, value) => sum + value, 0) / arr.length)
            : 0

        const averageHiringProbability = getAverage(hiringScores)
        const bestHiringProbability = hiringScores.length
          ? Math.max(...hiringScores)
          : 0

        const latestLive = liveSessions[0] || {}

        setAnalytics({
          totalInterviews: stats.totalInterviews || 0,
          averageScore: stats.averageScore || 0,
          bestScore: stats.bestScore || 0,
          liveInterviews: stats.liveInterviews || liveSessions.length || 0,
          latestScore: stats.latestScore || 0,
          completedSessions:
            stats.completedSessions ||
            liveSessions.filter((item) => item.completed).length ||
            0,
          totalCodingRounds: stats.totalCodingRounds || 0,
          totalAptitudeRounds: stats.totalAptitudeRounds || 0,
          scoreTrend: stats.scoreTrend || [],
          activityBreakdown: stats.activityBreakdown || [],
          skillRadar: stats.skillRadar || [],
          averageHiringProbability,
          bestHiringProbability,
          latestHiringProbability: latestLive.hiringProbability || 0,
          latestSelectionLevel: latestLive.selectionLevel || "Not calculated",
          latestRecruiterVerdict: latestLive.recruiterVerdict || "",
          averageCommunicationAnalysisScore: getAverage(communicationScores),
          averageProfessionalVocabularyScore: getAverage(vocabularyScores),
          averageStarStructureScore: getAverage(starScores),
          latestCommunicationAnalysisScore:
            latestLive.averageCommunicationAnalysisScore || 0,
          latestProfessionalVocabularyScore:
            latestLive.averageProfessionalVocabularyScore || 0,
          latestStarStructureScore: latestLive.averageStarStructureScore || 0
        })
      } catch (error) {
        console.log("Dashboard analytics error:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [userId])

  const handleMouseMove = (e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()

    card.style.setProperty("--x", `${e.clientX - rect.left}px`)
    card.style.setProperty("--y", `${e.clientY - rect.top}px`)
  }

  const tooltipStyle = {
    background: "#020617",
    border: "1px solid rgba(34,211,238,0.25)",
    borderRadius: "16px",
    color: "#fff",
    boxShadow: "0 0 35px rgba(34,211,238,0.12)"
  }

  const scoreTrend =
    analytics.scoreTrend.length > 0
      ? analytics.scoreTrend
      : [
          { name: "Start", score: 20 },
          { name: "Practice", score: analytics.averageScore || 40 },
          {
            name: "Current",
            score: analytics.latestScore || analytics.averageScore || 60
          }
        ]

  const activityData =
    analytics.activityBreakdown.length > 0
      ? analytics.activityBreakdown
      : [
          { name: "Interviews", value: analytics.totalInterviews },
          { name: "Live", value: analytics.liveInterviews },
          { name: "Coding", value: analytics.totalCodingRounds },
          { name: "Aptitude", value: analytics.totalAptitudeRounds }
        ]

  const radarData =
    analytics.skillRadar.length > 0
      ? analytics.skillRadar
      : [
          { skill: "Interview", value: analytics.averageScore || 40 },
          { skill: "Hiring", value: analytics.averageHiringProbability || 40 },
          {
            skill: "Communication",
            value: analytics.averageCommunicationAnalysisScore || 40
          },
          {
            skill: "Vocabulary",
            value: analytics.averageProfessionalVocabularyScore || 40
          },
          {
            skill: "STAR",
            value: analytics.averageStarStructureScore || 40
          },
          { skill: "Live", value: Math.min(analytics.liveInterviews * 15, 100) },
          {
            skill: "Coding",
            value: Math.min(analytics.totalCodingRounds * 15, 100)
          },
          {
            skill: "Aptitude",
            value: Math.min(analytics.totalAptitudeRounds * 15, 100)
          }
        ]

  const barData = [
    { name: "Interview", count: analytics.totalInterviews },
    { name: "Live", count: analytics.liveInterviews },
    { name: "Coding", count: analytics.totalCodingRounds },
    { name: "Aptitude", count: analytics.totalAptitudeRounds }
  ]

  const cards = [
    {
      title: "AI Interview",
      description: "Practice technical, HR, JD and company-specific interviews.",
      icon: Brain,
      path: "/interview",
      video: "/card-video-1.mp4",
      gradient: "from-cyan-500 to-blue-700"
    },
    {
      title: "Live Interview",
      description:
        "Real-time AI voice interview with mic, camera and AI feedback.",
      icon: Monitor,
      path: "/live-interview",
      video: "/card-video-2.mp4",
      gradient: "from-purple-500 to-pink-700"
    },
    {
      title: "GD Round",
      description:
        "Practice AI-powered group discussions with multiple AI participants and receive communication, leadership and confidence scores.",
      icon: MessageSquare,
      path: "/gd-round",
      video: "/card-video-11.mp4",
      gradient: "from-pink-500 to-purple-700"
    },
    {
      title: "Live GD Round",
      description:
        "Join a real-time AI group discussion with live AI participants, instant replies, GD transcript, scoring and improved response.",
      icon: MessagesSquare,
      path: "/live-gd-round",
      video: "/card-video-11.mp4",
      gradient: "from-fuchsia-500 to-cyan-700"
    },
    {
      title: "System Design",
      description:
        "Practice architecture, scalability, APIs, database design and trade-offs.",
      icon: Network,
      path: "/system-design",
      video: "/card-video-8.mp4",
      gradient: "from-blue-500 to-indigo-800"
    },
    {
      title: "Placement Readiness",
      description:
        "Get your overall placement score, company readiness and 7-day roadmap.",
      icon: Target,
      path: "/placement-readiness",
      video: "/card-video-9.mp4",
      gradient: "from-purple-500 to-pink-700"
    },
    {
      title: "Resume Analyzer",
      description: "Analyze ATS score and compare resume with job descriptions.",
      icon: FileText,
      path: "/resume",
      video: "/card-video-3.mp4",
      gradient: "from-emerald-500 to-green-700"
    },
    {
      title: "Resume Builder",
      description: "Generate ATS-friendly AI resumes with PDF export.",
      icon: Wand2,
      path: "/resume-builder",
      video: "/card-video-5.mp4",
      gradient: "from-teal-500 to-cyan-700"
    },
    {
      title: "Coding Round",
      description: "Solve coding problems with AI code evaluation.",
      icon: Code2,
      path: "/coding-round",
      video: "/card-video-6.mp4",
      gradient: "from-orange-500 to-red-700"
    },
    {
      title: "Aptitude Round",
      description: "Practice quantitative, reasoning and verbal MCQs.",
      icon: BrainCircuit,
      path: "/aptitude",
      video: "/card-video-7.mp4",
      gradient: "from-yellow-500 to-orange-700"
    },
    {
      title: "Mock Placement Drive",
      description:
        "Complete placement simulation with aptitude, coding, HR, system design and final AI recruiter result.",
      icon: Trophy,
      path: "/mock-placement",
      video: "/card-video-10.mp4",
      gradient: "from-yellow-500 to-amber-700"
    },
    {
      title: "Interview History",
      description:
        "Track interviews, hiring probability, scores, feedback and recordings.",
      icon: History,
      path: "/history",
      video: "/card-video-4.mp4",
      gradient: "from-indigo-500 to-blue-800"
    }
  ]

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8 page-fade">
        <section
          onMouseMove={handleMouseMove}
          className="glow-card relative min-h-[430px] overflow-hidden rounded-[3rem] border border-cyan-400/20 bg-slate-950/90 shadow-[0_0_140px_rgba(34,211,238,0.12)] group"
        >
          <video
            src="/dashboard-bg.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-60 transition-all duration-700"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#020617]/85 to-[#020617]/35" />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(34,211,238,0.18),transparent_38%)]" />
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-blue-700/20 rounded-full blur-3xl" />

          <div className="relative z-10 p-10 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 text-cyan-300 mb-4 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20">
                <Sparkles size={18} />
                <span className="text-sm tracking-wide">
                  AI Powered Career Preparation Platform
                </span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-black text-white leading-tight text-glow">
                Welcome back,
                <br />
                <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                  {userName}
                </span>
              </h1>

              <p className="text-slate-300 text-lg lg:text-xl leading-9 mt-6 max-w-2xl">
                Practice AI interviews, coding rounds, aptitude rounds, live
                interviews, AI analytics tracking and resume optimization.
              </p>

              <div className="flex flex-wrap gap-4 mt-10">
                <HeroButton onClick={() => navigate("/interview")} primary>
                  Start Interview
                  <ArrowRight size={22} />
                </HeroButton>

                <HeroButton onClick={() => navigate("/live-interview")}>
                  Live Interview
                </HeroButton>

                <HeroButton onClick={() => navigate("/gd-round")} color="pink">
                  GD Round
                </HeroButton>

                <HeroButton
                  onClick={() => navigate("/live-gd-round")}
                  color="fuchsia"
                >
                  Live GD Round
                </HeroButton>

                <HeroButton
                  onClick={() => navigate("/placement-readiness")}
                  color="purple"
                >
                  Placement Readiness
                </HeroButton>

                <HeroButton
                  onClick={() => navigate("/system-design")}
                  color="blue"
                >
                  System Design
                </HeroButton>
              </div>
            </div>

            <div className="relative shrink-0">
              <div className="absolute inset-0 blur-3xl bg-cyan-500/30 rounded-full pulse-glow" />

              <div className="relative w-72 h-72 rounded-full border border-cyan-400/30 overflow-hidden shadow-[0_0_100px_rgba(34,211,238,0.35)]">
                <video
                  src="/prep-ai-animation.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover scale-110"
                />

                <div className="absolute inset-0 bg-slate-950/10" />
                <div className="absolute inset-0 rounded-full border border-white/10" />
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            title="Total Interviews"
            value={loading ? "..." : analytics.totalInterviews}
            icon={Brain}
            color="from-cyan-500 to-blue-700"
            onMouseMove={handleMouseMove}
          />

          <StatCard
            title="Avg Hiring Chance"
            value={loading ? "..." : `${analytics.averageHiringProbability}%`}
            icon={Target}
            color="from-purple-500 to-pink-700"
            onMouseMove={handleMouseMove}
          />

          <StatCard
            title="Coding Rounds"
            value={loading ? "..." : analytics.totalCodingRounds}
            icon={Code2}
            color="from-orange-500 to-red-700"
            onMouseMove={handleMouseMove}
          />

          <StatCard
            title="Average Score"
            value={loading ? "..." : `${analytics.averageScore}%`}
            icon={Award}
            color="from-emerald-500 to-green-700"
            onMouseMove={handleMouseMove}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          <StatCard
            title="Communication"
            value={loading ? "..." : `${analytics.averageCommunicationAnalysisScore}%`}
            icon={MessageCircle}
            color="from-emerald-500 to-teal-700"
            onMouseMove={handleMouseMove}
          />

          <StatCard
            title="Vocabulary"
            value={loading ? "..." : `${analytics.averageProfessionalVocabularyScore}%`}
            icon={Sparkles}
            color="from-blue-500 to-indigo-700"
            onMouseMove={handleMouseMove}
          />

          <StatCard
            title="STAR Structure"
            value={loading ? "..." : `${analytics.averageStarStructureScore}%`}
            icon={Gauge}
            color="from-yellow-500 to-orange-700"
            onMouseMove={handleMouseMove}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <GraphCard title="Score Progress" icon={TrendingUp} onMouseMove={handleMouseMove}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={scoreTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#22d3ee"
                  strokeWidth={4}
                  dot={{ r: 5, fill: "#22d3ee" }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </GraphCard>

          <GraphCard title="Activity Count" icon={BarChart3} onMouseMove={handleMouseMove}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#38bdf8" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GraphCard>

          <GraphCard title="Skill Radar" icon={Gauge} onMouseMove={handleMouseMove}>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(148,163,184,0.25)" />
                <PolarAngleAxis dataKey="skill" stroke="#cbd5e1" />
                <PolarRadiusAxis stroke="#94a3b8" domain={[0, 100]} />
                <Radar
                  name="Skill"
                  dataKey="value"
                  stroke="#22d3ee"
                  fill="#22d3ee"
                  fillOpacity={0.28}
                />
                <Tooltip contentStyle={tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </GraphCard>

          <GraphCard title="Activity Distribution" icon={Flame} onMouseMove={handleMouseMove}>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={activityData} dataKey="value" nameKey="name" outerRadius={110} label>
                  {activityData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={["#22d3ee", "#a855f7", "#f97316", "#eab308"][index % 4]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </GraphCard>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div
            onMouseMove={handleMouseMove}
            className="glow-card xl:col-span-2 rounded-[2.2rem] p-6 border border-cyan-400/10 hover:border-cyan-300/30"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <TrendingUp className="text-cyan-300" size={30} />
                <h2 className="text-3xl font-bold text-white">
                  Performance Analytics
                </h2>
              </div>

              <div className="space-y-7">
                <PerformanceBar label="Interview Performance" value={analytics.averageScore} color="from-cyan-500 to-blue-700" />
                <PerformanceBar label="Hiring Probability" value={analytics.averageHiringProbability} color="from-purple-500 to-pink-700" />
                <PerformanceBar label="Communication Quality" value={analytics.averageCommunicationAnalysisScore} color="from-emerald-500 to-teal-700" />
                <PerformanceBar label="Professional Vocabulary" value={analytics.averageProfessionalVocabularyScore} color="from-blue-500 to-indigo-700" />
                <PerformanceBar label="STAR Structure" value={analytics.averageStarStructureScore} color="from-yellow-500 to-orange-700" />
                <PerformanceBar label="Coding Skills" value={Math.min(analytics.totalCodingRounds * 12, 100)} color="from-orange-500 to-red-700" />
                <PerformanceBar label="Aptitude Accuracy" value={Math.min(analytics.totalAptitudeRounds * 12, 100)} color="from-yellow-500 to-orange-700" />
                <PerformanceBar
                  label="Overall Preparation"
                  value={Math.min(
                    analytics.averageScore +
                      analytics.averageHiringProbability / 2 +
                      analytics.averageCommunicationAnalysisScore / 2 +
                      analytics.totalCodingRounds * 2 +
                      analytics.totalAptitudeRounds * 2,
                    100
                  )}
                  color="from-emerald-500 to-green-700"
                />
              </div>
            </div>
          </div>

          <div
            onMouseMove={handleMouseMove}
            className="glow-card rounded-[2.2rem] border border-cyan-400/20 bg-cyan-500/10 p-6"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <Sparkles className="text-cyan-300" size={28} />
                <h2 className="text-3xl font-bold text-white">AI Insights</h2>
              </div>

              <div className="space-y-4">
                <InsightCard icon={Target} title="Latest Hiring Chance" value={`${analytics.latestHiringProbability}%`} />
                <InsightCard icon={Gauge} title="Selection Level" value={analytics.latestSelectionLevel} />
                <InsightCard icon={Flame} title="Best Hiring Chance" value={`${analytics.bestHiringProbability}%`} />
                <InsightCard icon={MessageCircle} title="Latest Communication" value={`${analytics.latestCommunicationAnalysisScore}%`} />
                <InsightCard icon={Sparkles} title="Latest Vocabulary" value={`${analytics.latestProfessionalVocabularyScore}%`} />
                <InsightCard icon={Gauge} title="Latest STAR Structure" value={`${analytics.latestStarStructureScore}%`} />

                {analytics.latestRecruiterVerdict && (
                  <div className="p-5 rounded-2xl border border-purple-400/20 bg-purple-500/10">
                    <p className="text-purple-300 font-semibold mb-2">
                      Latest Recruiter Verdict
                    </p>
                    <p className="text-slate-300 leading-7">
                      {analytics.latestRecruiterVerdict}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {cards.map((card) => {
            const Icon = card.icon

            return (
              <div
                key={card.title}
                onMouseMove={handleMouseMove}
                onClick={() => navigate(card.path)}
                className="
                  glow-card
                  group
                  relative
                  min-h-[330px]
                  cursor-pointer
                  rounded-[2.3rem]
                  overflow-hidden
                  border
                  border-cyan-400/15
                  shadow-[0_0_80px_rgba(0,0,0,0.45)]
                  hover:scale-[1.025]
                  hover:border-cyan-300/35
                  hover:shadow-[0_0_100px_rgba(34,211,238,0.25)]
                  transition-all
                  duration-500
                "
              >
                <video
                  src={card.video}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:opacity-80 transition-all duration-700 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/55 to-[#020617]/10" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.16),transparent_55%)]" />

                <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-[0_0_35px_rgba(255,255,255,0.1)]`}
                  >
                    <Icon className="text-white" size={30} />
                  </div>

                  <div>
                    <h3 className="text-3xl font-bold text-white mb-4">
                      {card.title}
                    </h3>

                    <p className="text-slate-300 leading-7 text-lg">
                      {card.description}
                    </p>

                    <div className="flex items-center gap-2 text-cyan-300 mt-6 font-medium">
                      <span>Open Module</span>
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </MainLayout>
  )
}

function HeroButton({ children, onClick, primary = false, color = "cyan" }) {
  const colorMap = {
    cyan: "border-cyan-400/20 bg-cyan-500/10 text-cyan-200",
    pink: "border-pink-400/20 bg-pink-500/10 text-pink-200",
    fuchsia: "border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-200",
    purple: "border-purple-400/20 bg-purple-500/10 text-purple-200",
    blue: "border-blue-400/20 bg-blue-500/10 text-blue-200"
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        primary
          ? "glow-button px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 text-white font-semibold text-lg shadow-[0_0_40px_rgba(34,211,238,0.25)] flex items-center gap-3"
          : `glow-button px-8 py-4 rounded-2xl border ${
              colorMap[color] || colorMap.cyan
            } font-semibold text-lg`
      }
    >
      {children}
    </button>
  )
}

function StatCard({ title, value, icon: Icon, color, onMouseMove }) {
  return (
    <div
      onMouseMove={onMouseMove}
      className="glow-card rounded-[2.2rem] p-6 border border-cyan-400/10 hover:border-cyan-300/30"
    >
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-slate-400 mb-3">{title}</p>
          <h2 className="text-5xl font-black text-white">{value}</h2>
        </div>

        <div
          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.14)]`}
        >
          <Icon className="text-white" size={30} />
        </div>
      </div>
    </div>
  )
}

function GraphCard({ title, icon: Icon, children, onMouseMove }) {
  return (
    <div
      onMouseMove={onMouseMove}
      className="glow-card rounded-[2.2rem] p-6 border border-cyan-400/10 hover:border-cyan-300/30"
    >
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <Icon className="text-cyan-300" size={28} />
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>

        {children}
      </div>
    </div>
  )
}

function PerformanceBar({ label, value, color }) {
  const safeValue = Math.min(Number(value) || 0, 100)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-slate-300">{label}</p>
        <p className="text-white font-semibold">{Math.round(safeValue)}%</p>
      </div>

      <div className="w-full h-4 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  )
}

function InsightCard({ icon: Icon, title, value }) {
  return (
    <div className="p-5 rounded-2xl border border-white/10 bg-slate-950/60 hover:bg-slate-950/80 hover:border-cyan-400/20 transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 flex items-center justify-center">
          <Icon className="text-cyan-300" size={26} />
        </div>

        <div>
          <p className="text-slate-400">{title}</p>
          <h3 className="text-2xl font-bold text-white">{value}</h3>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
