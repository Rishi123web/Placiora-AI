import { Mail, MapPin, Sparkles } from "lucide-react"
import { useNavigate } from "react-router-dom"

function Footer() {
  const navigate = useNavigate()

  return (
    <footer className="mt-12 rounded-[3rem] border border-cyan-400/10 bg-slate-950/80 p-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 text-cyan-300 font-bold text-xl">
            <Sparkles />
            Placiora AI
          </div>

          <p className="text-slate-400 mt-4 leading-7">
            Your Personal Placement Copilot for interviews, coding rounds,
            aptitude tests, resume analysis, group discussions, mock placement
            drives and career growth.
          </p>
        </div>

        <FooterBlock
          title="Products"
          items={[
            { label: "AI Interview", path: "/interview" },
            { label: "Coding Round", path: "/coding-round" },
            { label: "Resume Analyzer", path: "/resume" },
            { label: "Mock Placement", path: "/mock-placement" }
          ]}
          onNavigate={navigate}
        />

        <FooterBlock
          title="Resources"
          items={[
            { label: "Help Center", path: "/help" },
            { label: "Support", path: "/support" },
            { label: "About", path: "/about" },
            { label: "History", path: "/history" }
          ]}
          onNavigate={navigate}
        />

        <div>
          <h3 className="text-white font-bold mb-4">Contact</h3>

          <p className="text-slate-400 flex items-center gap-2 mb-3">
            <Mail size={16} />
            placiora.support@gmail.com
          </p>

          <p className="text-slate-400 flex items-center gap-2">
            <MapPin size={16} />
            Kolkata, India
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 mt-8 pt-5 text-center text-slate-500">
        © 2026 Placiora AI. All Rights Reserved.
      </div>
    </footer>
  )
}

function FooterBlock({ title, items, onNavigate }) {
  return (
    <div>
      <h3 className="text-white font-bold mb-4">{title}</h3>

      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onNavigate(item.path)}
            className="block text-left text-slate-400 hover:text-cyan-300 transition"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default Footer