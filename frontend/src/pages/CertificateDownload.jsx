import { useEffect, useState } from "react"
import axios from "axios"
import CertificateTemplate from "../components/CertificateTemplate.jsx"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000"

function CertificateDownload() {
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const userId = user?._id || user?.id

  const [certificate, setCertificate] = useState(null)

  useEffect(() => {
    async function fetchCertificate() {
      try {
        if (!userId) return
        const res = await axios.get(`${API_BASE}/api/certificate/${userId}`)
        setCertificate(res.data.certificate)

        setTimeout(() => {
          window.print()
        }, 800)
      } catch {
        setCertificate(null)
      }
    }

    fetchCertificate()
  }, [userId])

  return (
    <div className="certificate-download-page min-h-screen bg-white">
      <style>{`
        html,
        body {
          margin: 0;
          padding: 0;
          background: white;
        }

        .certificate-download-page {
          width: 100%;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          overflow: hidden;
        }

        .certificate-paper {
          width: 1400px;
          height: 990px;
        }

        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }

          html,
          body {
            width: 100%;
            height: 100%;
            overflow: hidden !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden !important;
          }

          .certificate-download-page,
          .certificate-download-page * {
            visibility: visible !important;
          }

          .certificate-download-page {
            position: fixed !important;
            inset: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: white !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }

          .certificate-paper {
            width: 1400px !important;
            height: 990px !important;
            transform: scale(0.73);
            transform-origin: center center;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {certificate ? (
        <CertificateTemplate certificate={certificate} />
      ) : (
        <div className="text-xl font-bold text-slate-800">
          Loading Certificate...
        </div>
      )}
    </div>
  )
}

export default CertificateDownload