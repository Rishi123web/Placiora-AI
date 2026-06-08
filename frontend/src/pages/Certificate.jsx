import { useEffect, useRef, useState } from "react"
import axios from "axios"
import MainLayout from "../layouts/MainLayout.jsx"
import { Award, Download, Sparkles, ShieldCheck } from "lucide-react"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000"

function Certificate() {
  const certRef = useRef(null)
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const userId = user?._id || user?.id

  const [certificate, setCertificate] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleGlowMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`)
  }

  useEffect(() => {
    async function fetchCertificate() {
      if (!userId) return

      const res = await axios.get(`${API_BASE}/api/certificate/${userId}`)
      setCertificate(res.data.certificate)
    }

    fetchCertificate()
  }, [userId])

  const generateCertificate = async () => {
    try {
      setLoading(true)

      const res = await axios.post(`${API_BASE}/api/certificate/generate`, {
        userId,
        userName: user?.name || "Placiora Learner",
        userEmail: user?.email || "",
        score: 85
      })

      setCertificate(res.data.certificate)
    } catch (error) {
      alert(error.response?.data?.message || "Certificate failed")
    } finally {
      setLoading(false)
    }
  }

  const downloadCertificate = () => {
    window.print()
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8 page-fade">
        <section
          onMouseMove={handleGlowMove}
          className="glow-card relative overflow-hidden rounded-[3rem] border border-cyan-400/20 bg-slate-950/90 p-8"
        >
          <div className="absolute -top-32 -right-32 w-[520px] h-[520px] bg-cyan-500/20 rounded-full blur-[140px]" />
          <div className="absolute -bottom-40 -left-40 w-[520px] h-[520px] bg-purple-600/20 rounded-full blur-[140px]" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 text-cyan-300 mb-4 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20">
              <Sparkles size={16} />
              Placiora AI Achievement
            </div>

            <h1 className="text-5xl font-black text-white text-glow">
              Certificate
            </h1>

            <p className="text-slate-400 mt-3">
              Generate your Placiora AI placement preparation certificate.
            </p>
          </div>
        </section>

        {!certificate ? (
          <div
            onMouseMove={handleGlowMove}
            className="glow-card rounded-[2.5rem] border border-cyan-400/20 bg-white/[0.04] p-8 text-center"
          >
            <Award className="mx-auto text-cyan-300 mb-5" size={70} />

            <h2 className="text-3xl font-bold text-white">
              Certificate Not Generated Yet
            </h2>

            <p className="text-slate-400 mt-3">
              Click below to generate your achievement certificate.
            </p>

            <button
              onClick={generateCertificate}
              disabled={loading}
              className="glow-button mt-7 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-700 text-white font-semibold disabled:opacity-60"
            >
              {loading ? "Generating..." : "Generate Certificate"}
            </button>
          </div>
        ) : (
          <>
            <div
              ref={certRef}
              className="relative overflow-hidden rounded-[2.5rem] border border-cyan-400/30 bg-slate-950 p-10 text-center shadow-[0_0_120px_rgba(34,211,238,0.20)] print:bg-white print:text-black"
            >
              <div className="absolute -top-40 -right-40 w-[520px] h-[520px] bg-cyan-500/20 rounded-full blur-[140px] print:hidden" />
              <div className="absolute -bottom-40 -left-40 w-[520px] h-[520px] bg-purple-600/20 rounded-full blur-[140px] print:hidden" />

              <div className="relative z-10 border border-cyan-400/20 rounded-[2rem] p-10">
                <Award className="mx-auto text-cyan-300 mb-5" size={80} />

                <p className="text-cyan-300 uppercase tracking-[0.4em] text-sm">
                  Certificate of Achievement
                </p>

                <h1 className="text-5xl font-black text-white mt-5 print:text-black">
                  Placiora AI
                </h1>

                <p className="text-slate-400 mt-2 print:text-gray-700">
                  Your Personal Placement Copilot
                </p>

                <p className="text-slate-300 mt-10 print:text-gray-700">
                  This certificate is proudly presented to
                </p>

                <h2 className="text-5xl font-black text-cyan-300 mt-4">
                  {certificate.userName}
                </h2>

                <p className="text-slate-300 mt-8 max-w-3xl mx-auto leading-8 print:text-gray-700">
                  for successfully completing placement preparation activities
                  and demonstrating dedication toward interviews, coding rounds,
                  resume improvement and career readiness.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
                  <Info title="Score" value={`${certificate.score}%`} />
                  <Info title="Level" value={certificate.level} />
                  <Info
                    title="Issued"
                    value={new Date(certificate.issuedAt).toLocaleDateString()}
                  />
                </div>

                <div className="mt-10 flex items-center justify-center gap-2 text-slate-400 print:text-gray-700">
                  <ShieldCheck size={18} />
                  Certificate ID: {certificate.certificateId}
                </div>
              </div>
            </div>

            <button
              onClick={downloadCertificate}
              className="glow-button px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-700 text-white font-semibold flex items-center gap-2"
            >
              <Download size={18} />
              Download / Print Certificate
            </button>
          </>
        )}
      </div>
    </MainLayout>
  )
}

function Info({ title, value }) {
  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-5">
      <p className="text-slate-400 text-sm">{title}</p>
      <h3 className="text-2xl font-bold text-white print:text-black">
        {value}
      </h3>
    </div>
  )
}

export default Certificate
