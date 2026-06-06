import Sidebar from "../components/Sidebar.jsx"
import AIAssistantAvatar from "../components/AIAssistantAvatar.jsx"
import AccountDropdown from "../components/AccountDropdown.jsx"
import Footer from "../components/Footer.jsx"

function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#020617] text-white flex relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-18%] right-[-10%] w-[650px] h-[650px] rounded-full bg-cyan-500/10 blur-[130px] animate-pulse-glow" />

        <div
          className="absolute bottom-[-22%] left-[-12%] w-[620px] h-[620px] rounded-full bg-purple-500/10 blur-[130px] animate-pulse-glow"
          style={{ animationDelay: "1.5s" }}
        />

        <div
          className="absolute top-[38%] left-[35%] w-[380px] h-[380px] rounded-full bg-blue-500/10 blur-[120px] animate-pulse-glow"
          style={{ animationDelay: "3s" }}
        />

        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/95 to-black" />
      </div>

      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />

      <div className="relative z-30 shrink-0">
        <Sidebar />
      </div>

      <main className="relative z-10 flex-1 h-screen overflow-y-auto">
        <div className="sticky top-0 z-40 px-6 py-4 lg:px-8 bg-slate-950/65 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-white font-bold text-xl">
                Placiora AI
              </h2>
              <p className="text-slate-500 text-sm">
                Your Personal Placement Copilot
              </p>
            </div>

            <AccountDropdown />
          </div>
        </div>

        <div className="min-h-full px-6 py-8 lg:px-8">
          <div className="page-fade">{children}</div>

          <Footer />
        </div>
      </main>

      <div className="relative z-50">
        <AIAssistantAvatar />
      </div>
    </div>
  )
}

export default MainLayout