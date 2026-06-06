import { useState } from "react"
import axios from "axios"
import MainLayout from "../layouts/MainLayout.jsx"

import {
  FileText,
  Sparkles,
  Wand2,
  Download,
  AlertCircle,
  CheckCircle,
  User,
  Briefcase,
  GraduationCap,
  Code2,
  FolderGit2,
  Trophy
} from "lucide-react"

function ResumeBuilder() {
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const userId = user?._id || user?.id

  const [form, setForm] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: "",
    targetRole: "Full Stack Developer",
    education: "",
    skills: "",
    projects: "",
    experience: "",
    achievements: ""
  })

  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleMouseMove = (e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()

    card.style.setProperty("--x", `${e.clientX - rect.left}px`)
    card.style.setProperty("--y", `${e.clientY - rect.top}px`)
  }

  const generateResume = async () => {
    try {
      setLoading(true)
      setError("")
      setSuccess("")

      if (!form.fullName.trim() || !form.email.trim()) {
        setError("Full name and email are required.")
        return
      }

      const res = await axios.post(
        "http://localhost:5000/api/resume-builder/generate",
        {
          userId,
          ...form
        }
      )

      setResume(res.data.resume || null)
      setSuccess("AI resume generated successfully.")
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Resume generation failed."
      )
    } finally {
      setLoading(false)
    }
  }

  const downloadResume = () => {
    if (!resume?._id) return

    window.open(
      `http://localhost:5000/api/resume-builder/download/${resume._id}`,
      "_blank"
    )
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <section
          onMouseMove={handleMouseMove}
          className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/90 p-8 shadow-2xl shadow-cyan-500/10 group"
        >
          <div className="absolute -top-32 -right-32 w-[450px] h-[450px] bg-emerald-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[450px] h-[450px] bg-cyan-600/20 rounded-full blur-3xl" />

          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(34,211,238,0.22),transparent_35%)]" />

          <div className="relative z-10 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-700 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.35)]">
              <FileText className="text-white" size={32} />
            </div>

            <div>
              <div className="flex items-center gap-2 text-cyan-300 mb-1">
                <Sparkles size={16} />
                <span className="text-sm">AI ATS Resume Generator</span>
              </div>

              <h1 className="text-4xl font-bold text-white">
                Resume Builder
              </h1>

              <p className="text-slate-400 mt-2 max-w-3xl">
                Enter your details and let AI create an ATS-friendly resume
                with professional summary, skills, projects and achievements.
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-400/20 text-red-300 flex items-start gap-3">
            <AlertCircle size={20} className="mt-1" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 flex items-start gap-3">
            <CheckCircle size={20} className="mt-1" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section
            onMouseMove={handleMouseMove}
            className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-6 shadow-2xl shadow-black/20 group"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(34,211,238,0.18),transparent_40%)]" />

            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-6">
                Candidate Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  icon={User}
                  label="Full Name"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                />

                <Input
                  icon={User}
                  label="Email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                />

                <Input
                  icon={User}
                  label="Phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                />

                <Input
                  icon={User}
                  label="Location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                />

                <Input
                  icon={Briefcase}
                  label="Target Role"
                  name="targetRole"
                  value={form.targetRole}
                  onChange={handleChange}
                />

                <Input
                  icon={Code2}
                  label="LinkedIn URL"
                  name="linkedin"
                  value={form.linkedin}
                  onChange={handleChange}
                />

                <Input
                  icon={Code2}
                  label="GitHub URL"
                  name="github"
                  value={form.github}
                  onChange={handleChange}
                />

                <Input
                  icon={Code2}
                  label="Portfolio URL"
                  name="portfolio"
                  value={form.portfolio}
                  onChange={handleChange}
                />
              </div>

              <div className="mt-5 space-y-4">
                <Textarea
                  icon={GraduationCap}
                  label="Education"
                  name="education"
                  value={form.education}
                  onChange={handleChange}
                  placeholder="Example: B.Tech CSE/IoT, IEM Kolkata, 2026"
                />

                <Textarea
                  icon={Code2}
                  label="Skills"
                  name="skills"
                  value={form.skills}
                  onChange={handleChange}
                  placeholder="Example: React, Node.js, Express, MongoDB, Tailwind, JavaScript"
                />

                <Textarea
                  icon={FolderGit2}
                  label="Projects"
                  name="projects"
                  value={form.projects}
                  onChange={handleChange}
                  placeholder="Example: Prep AI - AI interview preparation platform with resume analyzer, coding round and live interview"
                />

                <Textarea
                  icon={Briefcase}
                  label="Experience / Internship"
                  name="experience"
                  value={form.experience}
                  onChange={handleChange}
                  placeholder="Mention internships, freelance work, leadership or project work"
                />

                <Textarea
                  icon={Trophy}
                  label="Achievements"
                  name="achievements"
                  value={form.achievements}
                  onChange={handleChange}
                  placeholder="Mention achievements line by line"
                />
              </div>

              <button
                type="button"
                onClick={generateResume}
                disabled={loading}
                className="mt-6 w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-700 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_35px_rgba(16,185,129,0.22)]"
              >
                <Wand2 size={20} />
                {loading ? "Generating Resume..." : "Generate AI Resume"}
              </button>
            </div>
          </section>

          <section
            onMouseMove={handleMouseMove}
            className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-6 shadow-2xl shadow-black/20 group"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Resume Preview
                  </h2>

                  <p className="text-slate-400 mt-1">
                    AI generated ATS-friendly resume content.
                  </p>
                </div>

                {resume && (
                  <button
                    type="button"
                    onClick={downloadResume}
                    className="px-5 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold flex items-center gap-2"
                  >
                    <Download size={18} />
                    PDF
                  </button>
                )}
              </div>

              {!resume ? (
                <div className="min-h-[500px] flex items-center justify-center text-center text-slate-400 border border-dashed border-white/10 rounded-3xl bg-slate-950/40">
                  <div>
                    <FileText className="mx-auto mb-4 text-slate-600" size={70} />

                    <h3 className="text-2xl font-bold text-white mb-2">
                      No resume generated yet
                    </h3>

                    <p>
                      Fill your details and click Generate AI Resume.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white text-slate-900 rounded-3xl p-8 max-h-[900px] overflow-y-auto">
                  <div className="text-center border-b pb-5 mb-5">
                    <h1 className="text-3xl font-bold">
                      {resume.fullName}
                    </h1>

                    <p className="text-sm mt-2">
                      {resume.email} | {resume.phone} | {resume.location}
                    </p>

                    <p className="text-sm mt-1">
                      {resume.linkedin} | {resume.github} | {resume.portfolio}
                    </p>
                  </div>

                  <ResumeSection title="Professional Summary">
                    <p>{resume.generatedSummary}</p>
                  </ResumeSection>

                  <ResumeSection title="Skills">
                    <p>{resume.generatedSkills?.join(", ")}</p>
                  </ResumeSection>

                  <ResumeSection title="Education">
                    <p>{resume.education}</p>
                  </ResumeSection>

                  <ResumeSection title="Projects">
                    <ul className="list-disc pl-5 space-y-1">
                      {resume.generatedProjects?.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </ResumeSection>

                  <ResumeSection title="Experience">
                    <ul className="list-disc pl-5 space-y-1">
                      {resume.generatedExperience?.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </ResumeSection>

                  <ResumeSection title="Achievements">
                    <ul className="list-disc pl-5 space-y-1">
                      {resume.generatedAchievements?.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </ResumeSection>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  )
}

function Input({ icon: Icon, label, name, value, onChange }) {
  return (
    <label className="block">
      <span className="text-slate-300 text-sm mb-2 flex items-center gap-2">
        <Icon size={15} />
        {label}
      </span>

      <input
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-slate-900/80 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-cyan-400"
      />
    </label>
  )
}

function Textarea({ icon: Icon, label, name, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="text-slate-300 text-sm mb-2 flex items-center gap-2">
        <Icon size={15} />
        {label}
      </span>

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full min-h-[100px] bg-slate-900/80 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-cyan-400 resize-none"
      />
    </label>
  )
}

function ResumeSection({ title, children }) {
  return (
    <section className="mb-5">
      <h2 className="text-lg font-bold border-b border-slate-300 mb-2 uppercase tracking-wide">
        {title}
      </h2>

      <div className="text-sm leading-6">{children}</div>
    </section>
  )
}

export default ResumeBuilder