import { useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import MainLayout from "../layouts/MainLayout.jsx"

import {
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Brain,
  Sparkles,
  ArrowRight,
  Target,
  TrendingUp,
  Lightbulb,
  FolderGit2,
  SearchCheck,
  ClipboardList
} from "lucide-react"

function ResumeAnalyzer() {
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const userId = user?._id || user?.id

  const [file, setFile] = useState(null)
  const [resumeId, setResumeId] = useState("")
  const [analysis, setAnalysis] = useState(null)

  const [jobDescription, setJobDescription] = useState("")
  const [jdMatch, setJdMatch] = useState(null)

  const [loading, setLoading] = useState(false)
  const [matching, setMatching] = useState(false)
  const [startingInterview, setStartingInterview] = useState(false)
  const [error, setError] = useState("")

  const handleMouseMove = (e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()

    card.style.setProperty("--x", `${e.clientX - rect.left}px`)
    card.style.setProperty("--y", `${e.clientY - rect.top}px`)
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]

    if (!selectedFile) return

    if (selectedFile.type !== "application/pdf") {
      setError("Please upload a PDF resume only.")
      setFile(null)
      return
    }

    setError("")
    setFile(selectedFile)
    setAnalysis(null)
    setResumeId("")
    setJdMatch(null)
  }

  const analyzeResume = async () => {
    if (!file) {
      setError("Please select a resume PDF first.")
      return
    }

    try {
      setLoading(true)
      setError("")

      const formData = new FormData()
      formData.append("resume", file)
      formData.append("userId", userId || "")

      const res = await axios.post(
        "http://localhost:5000/api/resume/analyze",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      )

      setResumeId(res.data.resumeId || "")
      setAnalysis(res.data.analysis || null)
    } catch (error) {
      setError(error.response?.data?.message || "Resume analysis failed.")
    } finally {
      setLoading(false)
    }
  }

  const matchWithJD = async () => {
    if (!resumeId) {
      setError("Analyze your resume first.")
      return
    }

    if (!jobDescription.trim()) {
      setError("Please paste a job description.")
      return
    }

    try {
      setMatching(true)
      setError("")

      const res = await axios.post(
        "http://localhost:5000/api/resume/match-jd",
        {
          resumeId,
          jobDescription
        }
      )

      setJdMatch(res.data.match || null)
    } catch (error) {
      setError(error.response?.data?.message || "JD match failed.")
    } finally {
      setMatching(false)
    }
  }

  const startResumeInterview = async () => {
    try {
      setStartingInterview(true)
      setError("")

      const res = await axios.post(
        "http://localhost:5000/api/interview/generate-from-resume",
        {
          userId,
          resumeId,
          difficulty: "Beginner",
          type: "Technical"
        }
      )

      localStorage.setItem("resumeInterviewSessionId", res.data.sessionId)
      localStorage.setItem(
        "resumeInterviewQuestions",
        JSON.stringify(res.data.questions || [])
      )

      navigate("/interview?mode=resume")
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to start resume based interview."
      )
    } finally {
      setStartingInterview(false)
    }
  }

  const startJDInterview = async () => {
    if (!jobDescription.trim()) {
      setError("Please paste a job description first.")
      return
    }

    navigate("/interview")
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8 page-fade">
        <section
          onMouseMove={handleMouseMove}
          className="glow-card relative overflow-hidden rounded-[3rem] border border-cyan-400/20 bg-slate-950/90 p-8 shadow-[0_0_120px_rgba(34,211,238,0.12)] group"
        >
          <div className="absolute -top-28 -right-28 w-[460px] h-[460px] bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[460px] h-[460px] bg-cyan-600/20 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-700 flex items-center justify-center shadow-[0_0_45px_rgba(168,85,247,0.35)]">
                <FileText className="text-white" size={32} />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 text-cyan-300 mb-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20">
                  <Sparkles size={16} />
                  <span className="text-sm">
                    Resume + JD Match Intelligence
                  </span>
                </div>

                <h1 className="text-4xl lg:text-5xl font-black text-white text-glow">
                  Resume Analyzer
                </h1>

                <p className="text-slate-400 mt-3 max-w-3xl leading-7">
                  Upload your resume, analyze ATS score, compare it with job
                  descriptions and prepare for targeted interviews.
                </p>
              </div>
            </div>

            <div className="hidden xl:block relative w-32 h-32 rounded-full border border-cyan-400/20 bg-cyan-500/10 shadow-[0_0_70px_rgba(34,211,238,0.2)]">
              <div className="absolute inset-4 rounded-full border border-purple-400/20 animate-orbit-ring" />
              <div className="absolute inset-8 rounded-full bg-gradient-to-br from-cyan-400/30 to-purple-500/30 blur-xl" />
            </div>
          </div>
        </section>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-400/20 text-red-300 flex items-start gap-3 shadow-[0_0_40px_rgba(239,68,68,0.08)]">
            <AlertCircle size={20} className="mt-1" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section
            onMouseMove={handleMouseMove}
            className="glow-card relative overflow-hidden rounded-[2.3rem] border border-cyan-400/10 bg-white/[0.04] backdrop-blur-2xl p-6 shadow-2xl shadow-black/30 group hover:border-cyan-300/30"
          >
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-5">
                Upload Resume
              </h2>

              <label className="group/upload block border-2 border-dashed border-slate-700 hover:border-cyan-400 rounded-[2rem] p-10 text-center cursor-pointer transition-all bg-slate-900/50 hover:bg-cyan-500/5">
                <div className="mx-auto mb-5 w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center shadow-[0_0_45px_rgba(34,211,238,0.12)] group-hover/upload:scale-105 transition-all">
                  <Upload className="text-cyan-400" size={44} />
                </div>

                <p className="text-white font-semibold mb-2 text-lg">
                  Click to upload PDF resume
                </p>

                <p className="text-slate-400 text-sm">
                  Only PDF files are supported
                </p>

                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {file && (
                <div className="mt-5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 flex items-center gap-3">
                  <CheckCircle size={20} />
                  <span className="truncate">{file.name}</span>
                </div>
              )}

              <button
                onClick={analyzeResume}
                disabled={loading || !file}
                className="glow-button w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Brain size={20} />
                {loading ? "Analyzing Resume..." : "Analyze Resume"}
              </button>
            </div>
          </section>

          <section
            onMouseMove={handleMouseMove}
            className="glow-card relative overflow-hidden rounded-[2.3rem] border border-cyan-400/10 bg-white/[0.04] backdrop-blur-2xl p-6 shadow-2xl shadow-black/30 group hover:border-cyan-300/30"
          >
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-5">
                Resume Score
              </h2>

              {!analysis ? (
                <div className="min-h-[340px] rounded-[2rem] border border-white/10 bg-slate-950/50 flex items-center justify-center text-center text-slate-400 p-8">
                  <div>
                    <div className="mx-auto mb-5 w-20 h-20 rounded-3xl bg-slate-900 border border-white/10 flex items-center justify-center">
                      <Target className="text-slate-500" size={54} />
                    </div>

                    <p>
                      Upload and analyze your resume to see ATS score, skills,
                      projects and improvement suggestions.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-6 rounded-[2rem] border border-cyan-400/15 bg-cyan-500/10 p-6">
                    <p className="text-slate-400 mb-2">ATS Score</p>

                    <div className="flex items-end gap-2">
                      <h3 className="text-7xl font-black text-white">
                        {analysis.atsScore}
                      </h3>
                      <span className="text-slate-400 mb-3">/100</span>
                    </div>

                    <div className="h-4 bg-slate-800 rounded-full overflow-hidden mt-5">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                        style={{ width: `${analysis.atsScore || 0}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-slate-300 leading-7">
                    {analysis.summary}
                  </p>

                  <button
                    onClick={startResumeInterview}
                    disabled={startingInterview || !resumeId}
                    className="glow-button w-full mt-6 bg-gradient-to-r from-emerald-500 to-green-700 hover:from-emerald-400 hover:to-green-600 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {startingInterview
                      ? "Starting Interview..."
                      : "Start Interview From Resume"}
                    <ArrowRight size={20} />
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {analysis && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <InfoCard
                title="Extracted Skills"
                icon={TrendingUp}
                items={analysis.skills}
                onMouseMove={handleMouseMove}
              />

              <InfoCard
                title="Projects Found"
                icon={FolderGit2}
                items={analysis.projects}
                onMouseMove={handleMouseMove}
              />

              <InfoCard
                title="Improvements"
                icon={Lightbulb}
                items={analysis.improvements}
                onMouseMove={handleMouseMove}
              />
            </div>

            <section
              onMouseMove={handleMouseMove}
              className="glow-card relative overflow-hidden rounded-[2.3rem] border border-cyan-400/10 bg-white/[0.04] backdrop-blur-2xl p-6 shadow-2xl shadow-black/30 group hover:border-cyan-300/30"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
                    <ClipboardList className="text-cyan-300" size={26} />
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Resume vs Job Description Match
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                      Paste a JD to detect matched skills, missing skills and
                      improvement suggestions.
                    </p>
                  </div>
                </div>

                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste job description here..."
                  className="w-full min-h-[190px] bg-slate-900/80 border border-white/10 rounded-[1.5rem] p-5 text-white outline-none focus:border-cyan-400 resize-none"
                />

                <div className="flex flex-wrap gap-4 mt-5">
                  <button
                    onClick={matchWithJD}
                    disabled={matching}
                    className="glow-button px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50"
                  >
                    <SearchCheck size={18} />
                    {matching ? "Matching..." : "Check JD Match"}
                  </button>

                  <button
                    onClick={startJDInterview}
                    className="glow-button px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold flex items-center gap-2"
                  >
                    Start JD Interview
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </section>

            {jdMatch && (
              <section
                onMouseMove={handleMouseMove}
                className="glow-card relative overflow-hidden rounded-[2.3rem] border border-cyan-400/25 bg-cyan-500/10 p-6 shadow-2xl shadow-cyan-500/10 group"
              >
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold text-white mb-5">
                    JD Match Result
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-slate-950/70 rounded-[1.5rem] p-6 border border-cyan-400/15">
                      <p className="text-slate-400 mb-2">Match Score</p>
                      <h3 className="text-7xl font-black text-cyan-300">
                        {jdMatch.matchScore}%
                      </h3>
                      <p className="text-slate-300 mt-4 leading-7">
                        {jdMatch.summary}
                      </p>
                    </div>

                    <MiniList
                      title="Matched Skills"
                      items={jdMatch.matchedSkills}
                    />

                    <MiniList
                      title="Missing Skills"
                      items={jdMatch.missingSkills}
                    />
                  </div>

                  <div className="mt-6">
                    <MiniList
                      title="Improvement Suggestions"
                      items={jdMatch.suggestions}
                    />
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </MainLayout>
  )
}

function InfoCard({ title, icon: Icon, items, onMouseMove }) {
  return (
    <section
      onMouseMove={onMouseMove}
      className="glow-card relative overflow-hidden rounded-[2.3rem] border border-cyan-400/10 bg-white/[0.04] backdrop-blur-2xl p-6 shadow-2xl shadow-black/30 group hover:border-cyan-300/30"
    >
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/20 flex items-center justify-center">
            <Icon className="text-cyan-300" size={22} />
          </div>

          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>

        {items && items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-xl bg-slate-900/70 border border-white/10 text-slate-300 leading-6 hover:border-cyan-400/20 transition-all"
              >
                {item}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500">No data found.</p>
        )}
      </div>
    </section>
  )
}

function MiniList({ title, items }) {
  return (
    <div className="bg-slate-950/70 rounded-[1.5rem] p-6 border border-white/10 hover:border-cyan-400/20 transition-all">
      <h3 className="text-white font-bold mb-4">{title}</h3>

      {items && items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300"
            >
              {item}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500">No items found.</p>
      )}
    </div>
  )
}

export default ResumeAnalyzer