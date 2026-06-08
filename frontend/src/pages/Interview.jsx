import { useEffect, useState } from "react"
import axios from "axios"
import { useLocation } from "react-router-dom"
import MainLayout from "../layouts/MainLayout.jsx"
import API_BASE from "../config/api"

import {
  Brain,
  Send,
  CheckCircle,
  AlertCircle,
  Trophy,
  RotateCcw,
  Sparkles,
  FileText
} from "lucide-react"

const ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "React Developer",
  "Node.js Developer",
  "Java Developer",
  "Python Developer",
  "Software Engineer",
  "Web Developer",
  "Mobile App Developer",
  "Data Analyst",
  "Business Analyst",
  "Data Scientist",
  "Machine Learning Engineer",
  "AI Engineer",
  "Cloud Engineer",
  "DevOps Engineer",
  "Cyber Security Analyst",
  "QA Engineer",
  "UI UX Designer",
  "Product Manager",
  "Project Manager",
  "Operations Manager",
  "HR Executive",
  "Talent Acquisition Specialist",
  "Recruitment Consultant",
  "Digital Marketing Executive",
  "SEO Specialist",
  "Social Media Manager",
  "Content Writer",
  "Video Editor",
  "Graphic Designer",
  "Sales Executive",
  "Business Development Executive",
  "Customer Success Executive",
  "Financial Analyst",
  "Accountant",
  "Banking Associate",
  "Management Consultant",
  "Strategy Analyst",
  "Supply Chain Analyst",
  "Mechanical Engineer",
  "Electrical Engineer",
  "Civil Engineer",
  "Electronics Engineer",
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
  "Meesho",
  "Razorpay",
  "PhonePe",
  "Paytm",
  "Swiggy",
  "Zomato",
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
  "American Express",
  "Startup Interview"
]

function Interview() {
  const location = useLocation()
  const isResumeMode =
    new URLSearchParams(location.search).get("mode") === "resume"

  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const userId = user.id || user._id || ""

  const [form, setForm] = useState({
    role: "Frontend Developer",
    difficulty: "Beginner",
    type: "Technical",
    company: "General",
    mode: "standard",
    jobDescription: ""
  })

  const [page, setPage] = useState({
    interviewId: "",
    questions: [],
    currentIndex: 0,
    answer: "",
    feedback: null,
    error: "",
    loading: false,
    submitting: false,
    completed: false,
    totalScore: 0,
    extractedSkills: []
  })

  useEffect(() => {
    if (!isResumeMode) return

    const savedId = localStorage.getItem("resumeInterviewSessionId")
    const savedQuestions = JSON.parse(
      localStorage.getItem("resumeInterviewQuestions") || "[]"
    )

    if (savedId && savedQuestions.length > 0) {
      setPage((prev) => ({
        ...prev,
        interviewId: savedId,
        questions: savedQuestions,
        currentIndex: 0,
        answer: "",
        feedback: null,
        error: "",
        completed: false,
        totalScore: 0
      }))
    } else {
      setPage((prev) => ({
        ...prev,
        error: "Resume interview data not found. Please analyze resume again."
      }))
    }
  }, [isResumeMode])

  const handleMouseMove = (e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    card.style.setProperty("--x", `${e.clientX - rect.left}px`)
    card.style.setProperty("--y", `${e.clientY - rect.top}px`)
  }

  const startInterview = async () => {
    try {
      setPage((prev) => ({
        ...prev,
        loading: true,
        error: "",
        feedback: null,
        completed: false
      }))

      const endpoint =
        form.mode === "jd"
          ? `${API_BASE}/api/interview/generate-from-jd`
          : `${API_BASE}/api/interview/generate`

      const body =
        form.mode === "jd"
          ? {
              userId,
              role: form.role,
              difficulty: form.difficulty,
              type: form.type,
              company: form.company,
              jobDescription: form.jobDescription
            }
          : {
              userId,
              role: form.role,
              difficulty: form.difficulty,
              type: form.type,
              company: form.company
            }

      const res = await axios.post(endpoint, body)

      setPage((prev) => ({
        ...prev,
        interviewId: res.data.sessionId || "",
        questions: res.data.questions || [],
        extractedSkills: res.data.extractedSkills || [],
        currentIndex: 0,
        answer: "",
        totalScore: 0
      }))
    } catch (err) {
      setPage((prev) => ({
        ...prev,
        error: err.response?.data?.message || "Interview start failed"
      }))
    } finally {
      setPage((prev) => ({
        ...prev,
        loading: false
      }))
    }
  }

  const submitAnswer = async () => {
    if (!page.answer.trim()) {
      setPage((prev) => ({
        ...prev,
        error: "Please write your answer first."
      }))
      return
    }

    try {
      setPage((prev) => ({
        ...prev,
        submitting: true,
        error: ""
      }))

      const res = await axios.post(`${API_BASE}/api/interview/answer`, {
        sessionId: page.interviewId,
        question: page.questions[page.currentIndex],
        answer: page.answer
      })

      setPage((prev) => ({
        ...prev,
        feedback: {
          score: res.data.score || 0,
          feedback: res.data.feedback || "",
          strengths: res.data.strengths || [],
          weaknesses: res.data.weaknesses || [],
          improvedAnswer: res.data.improvedAnswer || ""
        },
        totalScore: res.data.totalScore || 0,
        completed: res.data.completed || false
      }))
    } catch (err) {
      setPage((prev) => ({
        ...prev,
        error: err.response?.data?.message || "Answer submission failed"
      }))
    } finally {
      setPage((prev) => ({
        ...prev,
        submitting: false
      }))
    }
  }

  const nextQuestion = () => {
    setPage((prev) => ({
      ...prev,
      currentIndex: prev.currentIndex + 1,
      answer: "",
      feedback: null,
      error: ""
    }))
  }

  const restartInterview = () => {
    localStorage.removeItem("resumeInterviewSessionId")
    localStorage.removeItem("resumeInterviewQuestions")

    setPage({
      interviewId: "",
      questions: [],
      currentIndex: 0,
      answer: "",
      feedback: null,
      error: "",
      loading: false,
      submitting: false,
      completed: false,
      totalScore: 0,
      extractedSkills: []
    })
  }

  const hasInterview = page.interviewId && page.questions.length > 0
  const currentQuestion = page.questions[page.currentIndex]

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8 page-fade">
        <section
          onMouseMove={handleMouseMove}
          className="glow-card relative overflow-hidden rounded-[3rem] border border-cyan-400/20 bg-slate-950/90 p-8 shadow-[0_0_120px_rgba(34,211,238,0.12)] group"
        >
          <div className="absolute -top-28 -right-28 w-[460px] h-[460px] bg-cyan-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[460px] h-[460px] bg-blue-600/20 rounded-full blur-3xl" />

          <div className="relative z-10 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-[0_0_45px_rgba(59,130,246,0.35)]">
              <Brain className="text-white" size={32} />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 text-cyan-300 mb-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20">
                <Sparkles size={16} />
                <span className="text-sm">
                  JD Based + Company Specific Interview
                </span>
              </div>

              <h1 className="text-4xl lg:text-5xl font-black text-white text-glow">
                AI Interview
              </h1>

              <p className="text-slate-400 mt-3 leading-7">
                Practice normal, company-specific or job-description based
                interview questions.
              </p>
            </div>
          </div>
        </section>

        {page.error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-400/20 text-red-300 flex gap-3">
            <AlertCircle size={20} />
            {page.error}
          </div>
        )}

        {!hasInterview && !isResumeMode && (
          <section
            onMouseMove={handleMouseMove}
            className="glow-card relative overflow-hidden rounded-[2.3rem] border border-cyan-400/10 bg-white/[0.04] backdrop-blur-2xl p-6 shadow-2xl shadow-black/30 group hover:border-cyan-300/30"
          >
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-5">
                Start New Interview
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                <select
                  value={form.mode}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, mode: e.target.value }))
                  }
                  className="bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-4 text-white"
                >
                  <option value="standard">Standard Interview</option>
                  <option value="jd">JD Based Interview</option>
                </select>

                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, role: e.target.value }))
                  }
                  className="bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-4 text-white"
                >
                  {ROLES.map((role) => (
                    <option key={role}>{role}</option>
                  ))}
                </select>

                <select
                  value={form.company}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, company: e.target.value }))
                  }
                  className="bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-4 text-white"
                >
                  {COMPANIES.map((company) => (
                    <option key={company}>{company}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                <select
                  value={form.difficulty}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      difficulty: e.target.value
                    }))
                  }
                  className="bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-4 text-white"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>

                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, type: e.target.value }))
                  }
                  className="bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-4 text-white"
                >
                  <option>Technical</option>
                  <option>HR</option>
                  <option>Behavioral</option>
                  <option>Project Based</option>
                  <option>Case Study</option>
                  <option>Sales Interview</option>
                  <option>Marketing Interview</option>
                  <option>Operations Interview</option>
                  <option>Finance Interview</option>
                </select>

                <button
                  onClick={startInterview}
                  disabled={page.loading}
                  className="glow-button bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl font-semibold text-white disabled:opacity-50 py-4"
                >
                  {page.loading ? "Starting..." : "Start Interview"}
                </button>
              </div>

              {form.mode === "jd" && (
                <div>
                  <div className="flex items-center gap-2 text-cyan-300 mb-3">
                    <FileText size={18} />
                    <span>Paste Job Description</span>
                  </div>

                  <textarea
                    value={form.jobDescription}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        jobDescription: e.target.value
                      }))
                    }
                    placeholder="Paste job description here..."
                    className="w-full min-h-[220px] bg-slate-900/80 border border-white/10 rounded-2xl p-5 text-white outline-none focus:border-cyan-400 resize-none"
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {hasInterview && page.extractedSkills.length > 0 && (
          <section
            onMouseMove={handleMouseMove}
            className="glow-card relative overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-cyan-500/10 p-5 group"
          >
            <div className="relative z-10">
              <h3 className="text-cyan-300 font-semibold mb-3">
                Skills Extracted From JD
              </h3>

              <div className="flex flex-wrap gap-3">
                {page.extractedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-4 py-2 rounded-full bg-slate-900/80 border border-white/10 text-white"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {hasInterview && !page.completed && (
          <section
            onMouseMove={handleMouseMove}
            className="glow-card relative overflow-hidden rounded-[2.3rem] border border-cyan-400/10 bg-white/[0.04] backdrop-blur-2xl p-8 shadow-2xl shadow-black/30 group hover:border-cyan-300/30"
          >
            <div className="relative z-10">
              <p className="text-cyan-300 mb-2 font-semibold">
                Question {page.currentIndex + 1} of {page.questions.length}
              </p>

              <h2 className="text-2xl font-bold text-white leading-8 mb-6">
                {currentQuestion}
              </h2>

              <textarea
                value={page.answer}
                onChange={(e) =>
                  setPage((prev) => ({ ...prev, answer: e.target.value }))
                }
                placeholder="Write your answer here..."
                className="w-full min-h-[180px] bg-slate-900/80 border border-white/10 rounded-2xl p-5 text-white outline-none focus:border-cyan-400 resize-none"
              />

              <button
                onClick={submitAnswer}
                disabled={page.submitting || !!page.feedback}
                className="glow-button mt-5 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                <Send size={18} />
                {page.submitting ? "Checking..." : "Submit Answer"}
              </button>

              {page.feedback && (
                <div className="mt-8 rounded-[2rem] border border-cyan-400/20 bg-slate-950/70 p-6">
                  <div className="flex items-center gap-2 text-emerald-300 mb-4">
                    <CheckCircle size={22} />
                    <h3 className="text-xl font-bold">AI Feedback</h3>
                  </div>

                  <p className="text-4xl font-black text-white mb-4">
                    Score: {page.feedback.score}%
                  </p>

                  <p className="text-slate-300 leading-7 mb-5">
                    {page.feedback.feedback}
                  </p>

                  {page.feedback.strengths?.length > 0 && (
                    <ListPanel
                      title="Strengths"
                      items={page.feedback.strengths}
                      tone="green"
                    />
                  )}

                  {page.feedback.weaknesses?.length > 0 && (
                    <ListPanel
                      title="Weaknesses"
                      items={page.feedback.weaknesses}
                      tone="red"
                    />
                  )}

                  <div className="mt-5 p-5 rounded-2xl bg-blue-500/10 border border-blue-400/20">
                    <h4 className="text-blue-300 font-semibold mb-2">
                      Improved Answer
                    </h4>

                    <p className="text-slate-300 leading-7">
                      {page.feedback.improvedAnswer}
                    </p>
                  </div>

                  {page.currentIndex < page.questions.length - 1 && (
                    <button
                      onClick={nextQuestion}
                      className="mt-6 px-6 py-3 bg-white/10 hover:bg-white/15 rounded-xl font-semibold"
                    >
                      Next Question
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {page.completed && (
          <section
            onMouseMove={handleMouseMove}
            className="glow-card relative overflow-hidden rounded-[3rem] border border-cyan-400/20 bg-white/[0.04] backdrop-blur-2xl p-10 text-center shadow-2xl shadow-cyan-500/10 group"
          >
            <div className="relative z-10">
              <Trophy className="mx-auto text-yellow-400 mb-5" size={80} />

              <h2 className="text-5xl font-bold text-white mb-3">
                Interview Completed
              </h2>

              <p className="text-slate-400 text-lg mb-6">
                Your interview responses and AI feedback are saved.
              </p>

              <p className="text-6xl font-bold text-cyan-300 mb-8">
                {page.totalScore}%
              </p>

              <button
                onClick={restartInterview}
                className="glow-button px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold inline-flex items-center gap-2"
              >
                <RotateCcw size={18} />
                Start Another Interview
              </button>
            </div>
          </section>
        )}
      </div>
    </MainLayout>
  )
}

function ListPanel({ title, items = [], tone = "slate" }) {
  const toneClass =
    tone === "red"
      ? "bg-red-500/10 border-red-400/20 text-red-200"
      : tone === "green"
      ? "bg-emerald-500/10 border-emerald-400/20 text-emerald-200"
      : "bg-slate-950/60 border-white/10 text-slate-300"

  return (
    <div className={`mt-5 rounded-2xl border p-5 ${toneClass}`}>
      <h4 className="font-semibold mb-3">{title}</h4>

      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item, index) => (
            <p key={index} className="leading-7">
              • {item}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-slate-400">No data available.</p>
      )}
    </div>
  )
}

export default Interview
