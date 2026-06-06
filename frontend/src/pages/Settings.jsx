import { useEffect, useReducer, useState } from "react"
import MainLayout from "../layouts/MainLayout.jsx"

import {
  Moon,
  Sun,
  Bell,
  BellOff,
  Volume2,
  Sparkles,
  SlidersHorizontal,
  CheckCircle,
  AlertTriangle
} from "lucide-react"

const initialState = {
  theme: "dark",
  voice: "female",
  notifications: true
}

function settingsReducer(state, action) {
  if (action.type === "LOAD") return { ...state, ...action.payload }
  if (action.type === "THEME") return { ...state, theme: action.payload }
  if (action.type === "VOICE") return { ...state, voice: action.payload }
  if (action.type === "NOTIFICATIONS") {
    return { ...state, notifications: action.payload }
  }

  return state
}

function Settings() {
  const [settings, dispatch] = useReducer(settingsReducer, initialState)
  const [status, setStatus] = useState(null)

  const showStatus = (type, text) => {
    setStatus({ type, text })
    setTimeout(() => setStatus(null), 2200)
  }

  const handleGlowMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`)
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark"
    const savedVoice = localStorage.getItem("aiVoice") || "female"
    const savedNotifications = localStorage.getItem("notifications") !== "off"

    dispatch({
      type: "LOAD",
      payload: {
        theme: savedTheme,
        voice: savedVoice,
        notifications: savedNotifications
      }
    })

    document.documentElement.classList.toggle(
      "light-mode",
      savedTheme === "light"
    )
  }, [])

  const changeTheme = (mode) => {
    localStorage.setItem("theme", mode)

    dispatch({
      type: "THEME",
      payload: mode
    })

    document.documentElement.classList.toggle("light-mode", mode === "light")

    showStatus(
      "success",
      `${mode === "light" ? "Soft-glass light" : "Premium dark"} theme applied.`
    )
  }

  const changeVoice = (value) => {
    localStorage.setItem("aiVoice", value)

    dispatch({
      type: "VOICE",
      payload: value
    })

    const voiceLabel =
      value === "female"
        ? "Female Voice"
        : value === "calm"
        ? "Calm Mentor"
        : "Robotic Assistant"

    showStatus("success", `Sifra voice changed to ${voiceLabel}.`)

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(
        `Hi, I am Sifra from Placiora AI. ${voiceLabel} is now active.`
      )

      utterance.rate = value === "robotic" ? 0.82 : value === "calm" ? 0.88 : 0.94
      utterance.pitch = value === "robotic" ? 0.78 : value === "calm" ? 0.95 : 1.08
      utterance.volume = 1

      const voices = window.speechSynthesis.getVoices()

      const selectedVoice =
        value === "female"
          ? voices.find((v) => v.name.toLowerCase().includes("zira")) ||
            voices.find((v) => v.name.toLowerCase().includes("aria")) ||
            voices.find((v) => v.name.toLowerCase().includes("female"))
          : value === "calm"
          ? voices.find((v) => v.lang?.toLowerCase().startsWith("en"))
          : voices.find((v) => v.name.toLowerCase().includes("david")) ||
            voices.find((v) => v.lang?.toLowerCase().startsWith("en"))

      if (selectedVoice) utterance.voice = selectedVoice

      window.speechSynthesis.speak(utterance)
    }
  }

  const toggleNotifications = async () => {
    const nextValue = !settings.notifications

    localStorage.setItem("notifications", nextValue ? "on" : "off")

    dispatch({
      type: "NOTIFICATIONS",
      payload: nextValue
    })

    if (nextValue && "Notification" in window) {
      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission()

        if (permission !== "granted") {
          showStatus(
            "error",
            "Browser notification permission was not allowed."
          )
          return
        }
      }

      if (Notification.permission === "granted") {
        new Notification("Placiora AI", {
          body: "Preparation reminders are now enabled."
        })
      }
    }

    showStatus(
      "success",
      nextValue
        ? "Notifications enabled successfully."
        : "Notifications disabled successfully."
    )
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
              Preferences
            </div>

            <h1 className="text-5xl font-black text-white text-glow">
              Settings
            </h1>

            <p className="text-slate-400 mt-3">
              Manage theme, Sifra voice, notifications and Placiora AI
              experience.
            </p>
          </div>
        </section>

        {status && (
          <div
            onMouseMove={handleGlowMove}
            className={`glow-card rounded-2xl px-5 py-4 border flex items-center gap-3 ${
              status.type === "success"
                ? "bg-emerald-500/10 border-emerald-400/20 text-emerald-300"
                : "bg-red-500/10 border-red-400/20 text-red-300"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle size={18} />
            ) : (
              <AlertTriangle size={18} />
            )}
            {status.text}
          </div>
        )}

        <SettingCard
          onMouseMove={handleGlowMove}
          icon={settings.theme === "dark" ? Moon : Sun}
          title="Theme Mode"
          text="Switch between premium dark mode and soft-glass light mode."
        >
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => changeTheme("dark")}
              className={`px-5 py-3 rounded-2xl border font-semibold flex items-center gap-2 transition-all ${
                settings.theme === "dark"
                  ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.18)]"
                  : "bg-white/[0.04] border-white/10 text-slate-300 hover:border-cyan-400/30"
              }`}
            >
              <Moon size={18} />
              Dark
            </button>

            <button
              type="button"
              onClick={() => changeTheme("light")}
              className={`px-5 py-3 rounded-2xl border font-semibold flex items-center gap-2 transition-all ${
                settings.theme === "light"
                  ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.18)]"
                  : "bg-white/[0.04] border-white/10 text-slate-300 hover:border-cyan-400/30"
              }`}
            >
              <Sun size={18} />
              Light
            </button>
          </div>
        </SettingCard>

        <SettingCard
          onMouseMove={handleGlowMove}
          icon={SlidersHorizontal}
          title="Theme Preview"
          text="Current interface style used across your Placiora AI dashboard."
        >
          <div
            onMouseMove={handleGlowMove}
            className={`glow-card w-full md:w-[340px] rounded-[2rem] border p-4 overflow-hidden relative ${
              settings.theme === "light"
                ? "border-cyan-400/30 bg-gradient-to-br from-cyan-50 via-sky-100 to-indigo-100 shadow-[0_0_45px_rgba(14,165,233,0.18)]"
                : "border-cyan-400/20 bg-gradient-to-br from-slate-950 via-cyan-950/30 to-purple-950/30"
            }`}
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-cyan-400/30 blur-3xl" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-purple-400/20 blur-3xl" />

            <div
              className={`relative z-10 h-3 w-24 rounded-full mb-3 ${
                settings.theme === "light"
                  ? "bg-cyan-500/70"
                  : "bg-cyan-400/60"
              }`}
            />

            <div
              className={`relative z-10 h-3 w-40 rounded-full mb-3 ${
                settings.theme === "light"
                  ? "bg-slate-700/20"
                  : "bg-white/20"
              }`}
            />

            <div
              className={`relative z-10 h-20 rounded-2xl border ${
                settings.theme === "light"
                  ? "bg-white/60 border-cyan-500/20 shadow-inner"
                  : "bg-white/[0.04] border-white/10"
              }`}
            />
          </div>
        </SettingCard>

        <SettingCard
          onMouseMove={handleGlowMove}
          icon={Volume2}
          title="AI Voice"
          text="Choose Sifra assistant voice style. A preview voice will play after selection."
        >
          <select
            value={settings.voice}
            onChange={(e) => changeVoice(e.target.value)}
            className="bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-3 text-white outline-none focus:border-cyan-400"
          >
            <option value="female">Female Voice</option>
            <option value="calm">Calm Mentor</option>
            <option value="robotic">Robotic Assistant</option>
          </select>
        </SettingCard>

        <SettingCard
          onMouseMove={handleGlowMove}
          icon={settings.notifications ? Bell : BellOff}
          title="Notifications"
          text="Enable or disable browser reminders for preparation."
        >
          <button
            type="button"
            onClick={toggleNotifications}
            className={`px-6 py-3 rounded-2xl font-semibold border transition-all ${
              settings.notifications
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/20"
                : "bg-red-500/20 text-red-300 border-red-400/20"
            }`}
          >
            {settings.notifications ? "Notifications On" : "Notifications Off"}
          </button>
        </SettingCard>
      </div>
    </MainLayout>
  )
}

function SettingCard({ icon: Icon, title, text, children, onMouseMove }) {
  return (
    <div
      onMouseMove={onMouseMove}
      className="glow-card rounded-[2.5rem] border border-cyan-400/10 bg-white/[0.04] p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5"
    >
      <div className="flex items-start gap-4">
        <Icon className="text-cyan-300 mt-1 shrink-0" size={32} />

        <div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <p className="text-slate-400 mt-2">{text}</p>
        </div>
      </div>

      <div>{children}</div>
    </div>
  )
}

export default Settings