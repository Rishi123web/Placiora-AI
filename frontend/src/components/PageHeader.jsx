import { Sparkles } from "lucide-react"

function PageHeader({
  icon: Icon,
  eyebrow = "Prep AI",
  title,
  description,
  gradient = "from-cyan-500 to-blue-700"
}) {
  const handleMouseMove = (e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()

    card.style.setProperty("--x", `${e.clientX - rect.left}px`)
    card.style.setProperty("--y", `${e.clientY - rect.top}px`)
  }

  return (
    <section
      onMouseMove={handleMouseMove}
      className="glow-card relative overflow-hidden rounded-[2.5rem] p-8 shadow-2xl shadow-cyan-500/10 group"
    >
      <div className="absolute -top-28 -right-28 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />

      <div className="relative z-10 flex items-center gap-5">
        <div
          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.28)]`}
        >
          {Icon && <Icon className="text-white" size={32} />}
        </div>

        <div>
          <div className="flex items-center gap-2 text-cyan-300 mb-1">
            <Sparkles size={16} />
            <span className="text-sm">{eyebrow}</span>
          </div>

          <h1 className="text-4xl font-bold text-white">{title}</h1>

          {description && (
            <p className="text-slate-400 mt-2 max-w-3xl">{description}</p>
          )}
        </div>
      </div>
    </section>
  )
}

export default PageHeader