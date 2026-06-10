import { useEffect, useState } from "react"
import axios from "axios"
import MainLayout from "../layouts/MainLayout.jsx"
import CertificateTemplate from "../components/CertificateTemplate.jsx"
import { Award, Download, Sparkles } from "lucide-react"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000"

function Certificate() {
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
      try {
        if (!userId) return
        const res = await axios.get(`${API_BASE}/api/certificate/${userId}`)
        setCertificate(res.data.certificate)
      } catch {
        setCertificate(null)
      }
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
    window.open("/certificate/download", "_blank")
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-8 page-fade">
        <section
          onMouseMove={handleGlowMove}
          className="glow-card relative overflow-hidden rounded-[3rem] border border-cyan-400/20 bg-slate-950/90 p-8"
        >
          <div className="absolute -top-32 -right-32 h-[520px] w-[520px] rounded-full bg-cyan-500/20 blur-[140px]" />
          <div className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-purple-600/20 blur-[140px]" />

          <div className="relative z-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-cyan-300">
              <Sparkles size={16} />
              Placiora AI Achievement
            </div>

            <h1 className="text-5xl font-black text-white text-glow">
              Certificate
            </h1>

            <p className="mt-3 text-slate-400">
              Generate your professional placement preparation certificate.
            </p>
          </div>
        </section>

        {!certificate ? (
          <div
            onMouseMove={handleGlowMove}
            className="glow-card rounded-[2.5rem] border border-cyan-400/20 bg-white/[0.04] p-8 text-center"
          >
            <Award className="mx-auto mb-5 text-cyan-300" size={70} />

            <h2 className="text-3xl font-bold text-white">
              Certificate Not Generated Yet
            </h2>

            <p className="mt-3 text-slate-400">
              Click below to generate your achievement certificate.
            </p>

            <button
              onClick={generateCertificate}
              disabled={loading}
              className="glow-button mt-7 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-700 px-8 py-4 font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Generating..." : "Generate Certificate"}
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-center overflow-x-auto pb-4">
              <CertificateTemplate certificate={certificate} />
            </div>

            <button
              onClick={downloadCertificate}
              className="glow-button flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-700 px-8 py-4 font-semibold text-white"
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

export default Certificate