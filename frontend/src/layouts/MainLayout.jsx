import { useState } from "react"
import { Menu } from "lucide-react"

import Sidebar from "../components/Sidebar.jsx"
import AIAssistantAvatar from "../components/AIAssistantAvatar.jsx"
import AccountDropdown from "../components/AccountDropdown.jsx"
import Footer from "../components/Footer.jsx"

function MainLayout({ children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="min-h-dvh bg-[#020617] text-white relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-18%] right-[-10%] w-[420px] sm:w-[650px] h-[420px] sm:h-[650px] rounded-full bg-cyan-500/10 blur-[100px] sm:blur-[130px] animate-pulse-glow" />

        <div
          className="absolute bottom-[-22%] left-[-12%] w-[420px] sm:w-[620px] h-[420px] sm:h-[620px] rounded-full bg-purple-500/10 blur-[100px] sm:blur-[130px] animate-pulse-glow"
          style={{ animationDelay: "1.5s" }}
        />

        <div
          className="absolute top-[38%] left-[35%] w-[280px] sm:w-[380px] h-[280px] sm:h-[380px] rounded-full bg-blue-500/10 blur-[90px] sm:blur-[120px] animate-pulse-glow"
          style={{ animationDelay: "3s" }}
        />

        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/95 to-black" />
      </div>

      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />

      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <main className="relative z-10 min-h-dvh lg:pl-[292px] overflow-x-hidden">
        <div className="sticky top-0 z-40 px-4 py-3 sm:px-6 sm:py-4 lg:px-8 bg-slate-950/75 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-cyan-500/10 hover:border-cyan-400/30 transition"
              >
                <Menu size={22} />
              </button>

              <div className="min-w-0">
                <h2 className="text-white font-bold text-base sm:text-xl truncate">
                  Placiora AI
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm truncate">
                  Your Personal Placement Copilot
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <AccountDropdown />
            </div>
          </div>
        </div>

        <div className="min-h-[calc(100dvh-76px)] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          <div className="page-fade w-full max-w-[1440px] mx-auto">
            {children}
          </div>

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
