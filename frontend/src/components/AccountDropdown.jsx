import { useState } from "react"
import { useNavigate } from "react-router-dom"

import {
  User,
  Settings,
  HelpCircle,
  Info,
  LogOut,
  Mail,
  Shield,
  ChevronDown,
  UserPlus
} from "lucide-react"

function AccountDropdown() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const user = JSON.parse(localStorage.getItem("user") || "{}")

  const logout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    navigate("/login")
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-slate-950/80 px-4 py-3 text-white hover:border-cyan-300/40"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center font-bold">
          {(user?.name || "U").charAt(0).toUpperCase()}
        </div>

        <div className="hidden md:block text-left">
          <p className="text-sm font-semibold">{user?.name || "User"}</p>
          <p className="text-xs text-slate-500">{user?.email || "Account"}</p>
        </div>

        <ChevronDown size={16} />
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 rounded-[2rem] border border-cyan-400/20 bg-slate-950/95 backdrop-blur-xl shadow-[0_0_90px_rgba(34,211,238,0.25)] overflow-hidden z-[999]">
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>

              <div>
                <h3 className="text-white font-bold">
                  {user?.name || "User"}
                </h3>

                <p className="text-slate-400 text-sm">
                  {user?.email || "No email found"}
                </p>
              </div>
            </div>
          </div>

          <MenuItem
            icon={User}
            text="Manage Account"
            onClick={() => navigate("/account")}
          />

          <MenuItem
            icon={UserPlus}
            text="Login Into Another Account"
            onClick={() => {
              localStorage.removeItem("user")
              localStorage.removeItem("token")
              navigate("/login")
            }}
          />

          <MenuItem
            icon={Settings}
            text="Settings"
            onClick={() => navigate("/settings")}
          />

          <MenuItem
            icon={HelpCircle}
            text="Help & Support"
            onClick={() => navigate("/help")}
          />

          <MenuItem
            icon={Info}
            text="About Placiora AI"
            onClick={() => navigate("/about")}
          />

          <MenuItem
            icon={Mail}
            text="Contact Support"
            onClick={() => {
              window.location.href = "mailto:placiora.support@gmail.com"
            }}
          />

          <MenuItem
            icon={Shield}
            text="Privacy & Security"
            onClick={() => navigate("/privacy")}
          />

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-3 px-5 py-4 text-red-300 hover:bg-red-500/10 border-t border-white/10"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

function MenuItem({ icon: Icon, text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-4 text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10 transition"
    >
      <Icon size={18} />
      {text}
    </button>
  )
}

export default AccountDropdown