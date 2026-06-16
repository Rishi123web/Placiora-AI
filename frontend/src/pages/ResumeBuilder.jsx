import { useState } from "react"
import axios from "axios"
import MainLayout from "../layouts/MainLayout.jsx"
import API_BASE from "../config/api"

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
  Trophy,
  Mail,
  Phone,
  MapPin,
  Github,
  Linkedin,
  Globe,
  Star,
  ShieldCheck,
  Palette
} from "lucide-react"

const templates = [
  { id: "linkedin", name: "LinkedIn Pro", accent: "from-blue-500 to-cyan-500" },
  { id: "premium", name: "Premium Sidebar", accent: "from-emerald-500 to-cyan-600" },
  { id: "placiora", name: "Placiora Signature", accent: "from-purple-500 to-cyan-500" }
]

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
    achievements: "",
    template: "linkedin"
  })

  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const selectedTemplate =
    templates.find((item) => item.id === form.template) || templates[0]

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

      const res = await axios.post(`${API_BASE}/api/resume-builder/generate`, {
        userId,
        ...form
      })

      setResume(res.data.resume || null)
      setSuccess("Premium AI resume generated successfully.")
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

    window.open(`${API_BASE}/api/resume-builder/download/${resume._id}`, "_blank")
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

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-700 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.35)]">
                <FileText className="text-white" size={32} />
              </div>

              <div>
                <div className="flex items-center gap-2 text-cyan-300 mb-1">
                  <Sparkles size={16} />
                  <span className="text-sm">Premium AI Resume Studio</span>
                </div>

                <h1 className="text-4xl font-black text-white">
                  Resume Builder
                </h1>

                <p className="text-slate-400 mt-2 max-w-3xl">
                  Generate recruiter-ready resumes with premium templates, ATS score,
                  skill tags, polished summaries and professional PDF export.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-4">
              <p className="text-xs text-slate-400">Current Template</p>
              <p className="text-cyan-300 font-bold">{selectedTemplate.name}</p>
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

        <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-6">
          <section
            onMouseMove={handleMouseMove}
            className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-6 shadow-2xl shadow-black/20 group"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(34,211,238,0.18),transparent_40%)]" />

            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-6">
                Candidate Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                {templates.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, template: item.id }))
                    }
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      form.template === item.id
                        ? "border-cyan-400 bg-cyan-500/10"
                        : "border-white/10 bg-slate-900/50 hover:bg-white/5"
                    }`}
                  >
                    <Palette size={16} className="text-cyan-300 mb-2" />
                    <p className="text-white font-semibold text-sm">{item.name}</p>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input icon={User} label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} />
                <Input icon={Mail} label="Email" name="email" value={form.email} onChange={handleChange} />
                <Input icon={Phone} label="Phone" name="phone" value={form.phone} onChange={handleChange} />
                <Input icon={MapPin} label="Location" name="location" value={form.location} onChange={handleChange} />
                <Input icon={Briefcase} label="Target Role" name="targetRole" value={form.targetRole} onChange={handleChange} />
                <Input icon={Linkedin} label="LinkedIn URL" name="linkedin" value={form.linkedin} onChange={handleChange} />
                <Input icon={Github} label="GitHub URL" name="github" value={form.github} onChange={handleChange} />
                <Input icon={Globe} label="Portfolio URL" name="portfolio" value={form.portfolio} onChange={handleChange} />
              </div>

              <div className="mt-5 space-y-4">
                <Textarea icon={GraduationCap} label="Education" name="education" value={form.education} onChange={handleChange} placeholder="Example: B.Tech CSE/IoT, IEM Kolkata, 2026" />
                <Textarea icon={Code2} label="Skills" name="skills" value={form.skills} onChange={handleChange} placeholder="Example: React, Node.js, Express, MongoDB, Tailwind, JavaScript" />
                <Textarea icon={FolderGit2} label="Projects" name="projects" value={form.projects} onChange={handleChange} placeholder="Example: Placiora AI - AI interview platform with resume analyzer, coding round and live interview" />
                <Textarea icon={Briefcase} label="Experience / Internship" name="experience" value={form.experience} onChange={handleChange} placeholder="Mention internships, freelance work, leadership or project work" />
                <Textarea icon={Trophy} label="Achievements" name="achievements" value={form.achievements} onChange={handleChange} placeholder="Mention achievements line by line" />
              </div>

              <button
                type="button"
                onClick={generateResume}
                disabled={loading}
                className="mt-6 w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-700 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_35px_rgba(16,185,129,0.22)]"
              >
                <Wand2 size={20} />
                {loading ? "Generating Premium Resume..." : "Generate Premium Resume"}
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
                    Premium recruiter-style resume preview.
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
                <EmptyPreview />
              ) : (
                <PremiumResumePreview resume={resume} template={form.template} />
              )}
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  )
}

function EmptyPreview() {
  return (
    <div className="min-h-[640px] flex items-center justify-center text-center text-slate-400 border border-dashed border-white/10 rounded-3xl bg-slate-950/40">
      <div>
        <FileText className="mx-auto mb-4 text-slate-600" size={70} />

        <h3 className="text-2xl font-bold text-white mb-2">
          No resume generated yet
        </h3>

        <p>Fill your details and click Generate Premium Resume.</p>
      </div>
    </div>
  )
}

function PremiumResumePreview({ resume, template }) {
  const skills = resume.generatedSkills || []
  const accent =
    template === "placiora"
      ? "from-purple-700 to-cyan-600"
      : template === "premium"
      ? "from-emerald-700 to-cyan-700"
      : "from-blue-700 to-cyan-600"

  return (
    <div className="bg-white text-slate-900 rounded-3xl overflow-hidden max-h-[960px] overflow-y-auto shadow-2xl">
      <div className={`bg-gradient-to-r ${accent} text-white p-8`}>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight">
              {resume.fullName}
            </h1>
            <p className="text-cyan-100 mt-2 text-lg font-semibold">
              {resume.generatedHeadline || resume.targetRole}
            </p>
          </div>

          <div className="rounded-2xl bg-white/15 border border-white/20 px-5 py-4 text-center">
            <p className="text-xs text-cyan-100">ATS Score</p>
            <p className="text-3xl font-black">{resume.atsScore || 88}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-cyan-50 mt-6">
          <Contact icon={Mail} text={resume.email} />
          <Contact icon={Phone} text={resume.phone} />
          <Contact icon={MapPin} text={resume.location} />
          <Contact icon={Linkedin} text={resume.linkedin} />
          <Contact icon={Github} text={resume.github} />
          <Contact icon={Globe} text={resume.portfolio} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px]">
        <main className="p-8">
          <ResumeSection title="Professional Summary">
            <p>{resume.generatedSummary}</p>
          </ResumeSection>

          <ResumeSection title="Projects">
            <BulletList items={resume.generatedProjects} />
          </ResumeSection>

          <ResumeSection title="Experience">
            <BulletList items={resume.generatedExperience} />
          </ResumeSection>
        </main>

        <aside className="bg-slate-50 border-l border-slate-200 p-8">
          <ResumeSection title="Core Skills">
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="rounded-full bg-cyan-100 text-cyan-800 px-3 py-1 text-xs font-semibold"
                >
                  {skill}
                </span>
              ))}
            </div>
          </ResumeSection>

          <ResumeSection title="Education">
            <p>{resume.education}</p>
          </ResumeSection>

          <ResumeSection title="Achievements">
            <BulletList items={resume.generatedAchievements} />
          </ResumeSection>

          <div className="mt-8 rounded-2xl bg-slate-900 text-white p-5">
            <ShieldCheck className="text-cyan-300 mb-3" size={24} />
            <p className="font-bold">Recruiter Ready</p>
            <p className="text-xs text-slate-300 mt-1">
              Optimized by Placiora AI for ATS readability and hiring manager review.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Contact({ icon: Icon, text }) {
  if (!text) return null

  return (
    <p className="flex items-center gap-2 break-all">
      <Icon size={14} />
      {text}
    </p>
  )
}

function BulletList({ items = [] }) {
  return (
    <ul className="list-none space-y-2">
      {(items || []).map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-2">
          <Star size={14} className="text-cyan-600 mt-1 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
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
    <section className="mb-7">
      <h2 className="text-sm font-black border-b-2 border-cyan-500 pb-2 mb-3 uppercase tracking-[0.15em] text-slate-900">
        {title}
      </h2>

      <div className="text-sm leading-7 text-slate-700">{children}</div>
    </section>
  )
}

export default ResumeBuilder
