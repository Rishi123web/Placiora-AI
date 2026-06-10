import {
  Award,
  ShieldCheck,
  CheckCircle2,
  BadgeCheck,
  CalendarDays,
  Clock3
} from "lucide-react"

function CertificateTemplate({ certificate }) {
  if (!certificate) return null

  return (
    <div className="certificate-paper relative overflow-hidden rounded-[2.5rem] border border-cyan-400/30 bg-slate-950 p-8 shadow-[0_0_120px_rgba(34,211,238,0.20)]">
      <div className="absolute -top-40 -right-40 h-[560px] w-[560px] rounded-full bg-cyan-500/25 blur-[140px]" />
      <div className="absolute -bottom-40 -left-40 h-[560px] w-[560px] rounded-full bg-purple-600/25 blur-[140px]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(8,13,32,0.96),rgba(3,10,24,0.98),rgba(7,29,42,0.94))]" />

      <div className="relative z-10 h-full rounded-[2rem] border border-cyan-400/25 bg-white/[0.04] p-9 text-center">
        <div className="absolute inset-5 rounded-[1.5rem] border border-cyan-300/20" />

        <div className="relative z-10 flex h-full flex-col">
          <div className="flex items-center justify-between text-left">
            <div>
              <h2 className="text-4xl font-black text-white">Placiora AI</h2>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
                Your Personal Placement Copilot
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-3 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300">
                Verified Certificate
              </p>
              <p className="mt-1 text-sm font-bold text-white">
                {certificate.certificateId}
              </p>
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-500/10 shadow-[0_0_45px_rgba(34,211,238,0.35)]">
              <Award className="text-cyan-300" size={52} />
            </div>

            <p className="text-sm font-black uppercase tracking-[0.55em] text-cyan-300">
              Professional Certificate
            </p>

            <h1 className="mt-5 text-6xl font-black tracking-tight text-white text-glow">
              Placement Preparation Program
            </h1>

            <p className="mt-6 text-slate-300">
              This certificate is awarded to
            </p>

            <h2 className="mt-3 text-7xl font-black tracking-tight text-cyan-300">
              {certificate.userName}
            </h2>

            <p className="mt-7 max-w-5xl text-xl leading-9 text-slate-300">
              for successfully completing the Placiora AI Placement Preparation
              Program and demonstrating proficiency in technical interviews,
              coding assessments, resume building, career readiness and
              professional communication.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {(certificate.skills || []).map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100"
                >
                  <CheckCircle2 size={15} className="text-cyan-300" />
                  {skill}
                </span>
              ))}
            </div>

            <div className="mt-9 grid w-full max-w-5xl grid-cols-4 gap-4">
              <Info title="Final Score" value={`${certificate.score}%`} />
              <Info title="Level" value={certificate.level} />
              <Info
                title="Issued On"
                value={new Date(certificate.issuedAt).toLocaleDateString()}
                icon={<CalendarDays size={18} />}
              />
              <Info
                title="Duration"
                value={certificate.duration || "40 Learning Hours"}
                icon={<Clock3 size={18} />}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 items-end gap-6">
            <div className="text-left">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                Credential ID
              </p>
              <p className="mt-2 text-sm font-bold text-white">
                {certificate.certificateId}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-cyan-300">
              <ShieldCheck size={18} />
              <span className="text-sm font-bold">
                Verified by Placiora AI
              </span>
            </div>

            <div className="text-right">
              <div className="ml-auto w-56 border-t-2 border-cyan-300 pt-3">
                <p className="text-sm font-black text-white">Placiora AI</p>
                <p className="text-xs font-semibold text-slate-400">
                  Authorized Signature
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-5 py-3 text-xs font-semibold text-slate-300">
            <BadgeCheck size={15} className="text-cyan-300" />
            This certificate can be added to LinkedIn Licenses &
            Certifications.
          </div>
        </div>
      </div>
    </div>
  )
}

function Info({ title, value, icon }) {
  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-5 text-center">
      <div className="mb-1 flex items-center justify-center text-cyan-300">
        {icon}
      </div>

      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
        {title}
      </p>

      <h3 className="mt-2 text-2xl font-black text-white">{value}</h3>
    </div>
  )
}

export default CertificateTemplate