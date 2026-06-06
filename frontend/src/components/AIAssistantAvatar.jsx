import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import {
  Bot,
  Mic,
  MicOff,
  Send,
  X,
  Minimize2,
  Maximize2,
  Sparkles,
  Volume2,
  Square,
  Code2,
  Bug,
  FileText,
  Brain,
  Wand2,
  Copy,
  CheckCircle
} from "lucide-react"

import Avatar3D from "./Avatar3D.jsx"

const API_URL = "http://localhost:5000/api/avatar-assistant"
const MEMORY_KEY = "placiora_ai_avatar_memory"
const COPILOT_CONTEXT_KEY = "placiora_ai_copilot_context"

function AIAssistantAvatar() {
  const navigate = useNavigate()
  const location = useLocation()

  const startupMessages = useMemo(
    () => [
      "Welcome to Placiora AI — Your Personal Placement Copilot.",
      "I can help with interviews, coding rounds, resumes, aptitude and placements.",
      "Need help preparing for your dream company?",
      "Let's boost your placement readiness today."
    ],
    []
  )

  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [agentMode, setAgentMode] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState(null)

  const [messages, setMessages] = useState(() => [
    {
      role: "assistant",
      content:
        startupMessages[Math.floor(Math.random() * startupMessages.length)]
    }
  ])

  const recognitionRef = useRef(null)
  const messagesEndRef = useRef(null)
  const transcriptRef = useRef("")
  const finalTranscriptRef = useRef("")

  const pageMode = useMemo(
    () => getPageMode(location.pathname),
    [location.pathname]
  )

  const pageQuickActions = useMemo(
    () => getQuickActionsForPage(location.pathname),
    [location.pathname]
  )

  const currentVoice = localStorage.getItem("aiVoice") || "female"

  const voiceLabel =
    currentVoice === "female"
      ? "Female Assistant"
      : currentVoice === "calm"
      ? "Calm Mentor"
      : "Robotic Assistant"

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}")
    } catch {
      return {}
    }
  }

  function getLocalMemory() {
    try {
      return JSON.parse(localStorage.getItem(MEMORY_KEY) || "[]")
    } catch {
      return []
    }
  }

  function getPageContext() {
    try {
      return JSON.parse(localStorage.getItem(COPILOT_CONTEXT_KEY) || "{}")
    } catch {
      return {}
    }
  }

  function saveLocalMemory(text) {
    const current = getLocalMemory()

    const updated = [
      {
        text,
        createdAt: new Date().toISOString()
      },
      ...current
    ].slice(0, 20)

    localStorage.setItem(MEMORY_KEY, JSON.stringify(updated))
  }

  function stopSpeaking() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    setSpeaking(false)
  }

  function getPreferredVoice(voices, selectedVoice) {
    if (!voices || voices.length === 0) return null

    if (selectedVoice === "female") {
      return (
        voices.find((v) => v.name.toLowerCase().includes("aria")) ||
        voices.find((v) => v.name.toLowerCase().includes("zira")) ||
        voices.find((v) => v.name.toLowerCase().includes("female")) ||
        voices.find((v) => v.name.toLowerCase().includes("samantha")) ||
        voices.find((v) => v.lang?.toLowerCase().startsWith("en"))
      )
    }

    if (selectedVoice === "calm") {
      return (
        voices.find((v) => v.name.toLowerCase().includes("samantha")) ||
        voices.find((v) => v.name.toLowerCase().includes("aria")) ||
        voices.find((v) => v.name.toLowerCase().includes("natural")) ||
        voices.find((v) => v.lang?.toLowerCase().startsWith("en"))
      )
    }

    if (selectedVoice === "robotic") {
      return (
        voices.find((v) => v.name.toLowerCase().includes("david")) ||
        voices.find((v) => v.name.toLowerCase().includes("mark")) ||
        voices.find((v) => v.name.toLowerCase().includes("microsoft")) ||
        voices.find((v) => v.lang?.toLowerCase().startsWith("en"))
      )
    }

    return voices[0]
  }

  function speak(text) {
    if (!text || !window.speechSynthesis) return

    stopSpeaking()

    const cleanText = String(text)
      .replace(/```[\s\S]*?```/g, "I have provided code you can copy.")
      .replace(/[*#`_]/g, "")
      .replace(/\s+/g, " ")
      .slice(0, 750)
      .trim()

    if (!cleanText) return

    const selectedVoice = localStorage.getItem("aiVoice") || "female"

    const utterance = new SpeechSynthesisUtterance(cleanText)

    if (selectedVoice === "female") {
      utterance.rate = 0.95
      utterance.pitch = 1.15
    } else if (selectedVoice === "calm") {
      utterance.rate = 0.82
      utterance.pitch = 0.95
    } else if (selectedVoice === "robotic") {
      utterance.rate = 0.75
      utterance.pitch = 0.7
    } else {
      utterance.rate = 0.92
      utterance.pitch = 1.08
    }

    utterance.volume = 1

    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    const voices = window.speechSynthesis.getVoices()
    const voice = getPreferredVoice(voices, selectedVoice)

    if (voice || voices[0]) {
      utterance.voice = voice || voices[0]
    }

    window.speechSynthesis.speak(utterance)
  }

  function addAssistantReply(reply, shouldSpeak = true) {
    const finalReply =
      reply || "Sorry, I couldn't process that request right now."

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: finalReply
      }
    ])

    if (shouldSpeak) speak(finalReply)
  }

  function executeCommand(message) {
    const text = message.toLowerCase()

    const routes = [
      ["live gd", "/live-gd-round", "Opening Live GD Round."],
      ["gd", "/gd-round", "Opening GD Round."],
      ["live interview", "/live-interview", "Opening Live Interview."],
      ["hr", "/hr-round", "Opening HR Round."],
      ["system design", "/system-design", "Opening System Design."],
      ["resume builder", "/resume-builder", "Opening Resume Builder."],
      ["resume", "/resume", "Opening Resume Analyzer."],
      ["coding", "/coding-round", "Opening Coding Round."],
      ["aptitude", "/aptitude", "Opening Aptitude Round."],
      ["oa", "/oa-assessment", "Opening OA Simulator."],
      [
        "placement readiness",
        "/placement-readiness",
        "Opening Placement Readiness."
      ],
      ["roadmap", "/skill-roadmap", "Opening Skill Roadmap."],
      ["predictor", "/placement-predictor", "Opening Placement Predictor."],
      ["mock placement", "/mock-placement", "Opening Mock Placement."],
      ["recruiter", "/recruiter-dashboard", "Opening Recruiter Dashboard."],
      ["history", "/history", "Opening History."],
      ["dashboard", "/dashboard", "Opening Dashboard."],
      ["interview", "/interview", "Opening AI Interview."]
    ]

    const found = routes.find(([keyword]) => text.includes(keyword))

    if (!found) return null

    navigate(found[1])
    return found[2]
  }

  async function sendMessage(overrideMessage = "") {
    const userMessage = (overrideMessage || input).trim()

    if (!userMessage || loading) return

    const conversationSnapshot = messages.slice(-8)
    const currentPageContext = getPageContext()

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage
      }
    ])

    setInput("")
    transcriptRef.current = ""
    finalTranscriptRef.current = ""

    const lowerMessage = userMessage.toLowerCase()

    if (
      lowerMessage.startsWith("remember") ||
      lowerMessage.startsWith("note that")
    ) {
      saveLocalMemory(userMessage)
    }

    const commandReply = executeCommand(userMessage)

    if (commandReply) {
      addAssistantReply(commandReply)
      return
    }

    try {
      setLoading(true)

      const user = getUser()

      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userMessage,
          conversation: conversationSnapshot,
          context: {
            userId: user?._id || user?.id || "",
            userName: user?.name || "User",
            userEmail: user?.email || "",
            currentPath: window.location.pathname,
            pageMode,
            localMemory: getLocalMemory(),
            pageContext: currentPageContext,
            assistantName: "Sifra - Placiora AI",
            platformName: "Placiora AI",
            platformTagline: "Your Personal Placement Copilot",
            selectedVoice: localStorage.getItem("aiVoice") || "female",
            agentMode
          }
        })
      })

      const data = await res.json()

      addAssistantReply(
        data.reply || "I couldn't process that request right now."
      )
    } catch {
      addAssistantReply("I am currently offline. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function toggleVoice() {
    stopSpeaking()

    if (!recognitionRef.current) {
      addAssistantReply(
        "Voice input is not supported in this browser. You can type instead."
      )
      return
    }

    if (listening) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore stop error
      }

      setListening(false)

      const finalText = transcriptRef.current || input

      if (finalText.trim()) {
        setTimeout(() => {
          sendMessage(finalText.trim())
        }, 150)
      }

      return
    }

    try {
      setInput("")
      transcriptRef.current = ""
      finalTranscriptRef.current = ""
      setListening(true)
      recognitionRef.current.start()
    } catch {
      setListening(false)
    }
  }

  function closeAssistant() {
    try {
      recognitionRef.current?.stop()
    } catch {
      // ignore stop error
    }

    stopSpeaking()
    setListening(false)
    setOpen(false)
  }

  async function copyCodeFromMessage(content, index) {
    const match = String(content).match(/```(?:\w+)?\n([\s\S]*?)```/)
    const textToCopy = match ? match[1].trim() : content

    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 1400)
    } catch {
      // ignore clipboard error
    }
  }

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event) => {
      let interimTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript

        if (event.results[i].isFinal) {
          finalTranscriptRef.current += `${transcript} `
        } else {
          interimTranscript += `${transcript} `
        }
      }

      const fullTranscript = (
        finalTranscriptRef.current + interimTranscript
      ).trim()

      transcriptRef.current = fullTranscript
      setInput(fullTranscript)
    }

    recognition.onerror = () => {
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      try {
        recognition.stop()
      } catch {
        // ignore stop error
      }

      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  useEffect(() => {
    if (!window.speechSynthesis) return

    const loadVoices = () => {
      window.speechSynthesis.getVoices()
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  useEffect(() => {
    if (!agentMode || !open) return

    const timer = setTimeout(() => {
      const context = getPageContext()

      if (!context?.code && location.pathname.includes("coding")) {
        addAssistantReply(
          "Agent mode is active. I can debug your code automatically when CodingRound saves editor context. Ask me: fix my code, explain this error, or generate corrected code.",
          false
        )
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [agentMode, open, location.pathname])

  const quickActions = [
    "open dashboard",
    "open interview",
    "open live interview",
    "open resume",
    "open coding",
    "open recruiter"
  ]

  const assistantTitle =
    pageMode === "coding"
      ? "Sifra Coding Copilot"
      : pageMode === "live-interview"
      ? "Sifra Interview Coach"
      : pageMode === "resume"
      ? "Sifra Resume Mentor"
      : "Sifra"

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[9999] w-44 h-44 rounded-[2.2rem] bg-slate-950/90 border border-cyan-400/40 shadow-[0_0_130px_rgba(34,211,238,0.62)] flex items-center justify-center avatar-entry overflow-hidden group hover:scale-105 active:scale-95 transition-all duration-500"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.22),rgba(59,130,246,0.08),transparent_70%)]" />
          <div className="absolute inset-2 rounded-[1.9rem] border border-white/10 group-hover:border-cyan-300/50 transition-all" />
          <div className="absolute -inset-10 bg-cyan-500/10 blur-3xl" />

          <div className="absolute inset-0">
            <Avatar3D
              speaking={speaking}
              listening={listening}
              thinking={loading}
              agentMode={agentMode}
            />
          </div>
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-[9999] w-[640px] max-w-[95vw] rounded-[2rem] overflow-hidden border border-cyan-400/30 bg-slate-950/95 backdrop-blur-2xl shadow-[0_0_120px_rgba(34,211,238,0.35)] avatar-entry">
          <div className="relative p-4 border-b border-white/10 flex items-center justify-between overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-purple-500/10" />

            <div className="relative z-10 flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-950/80 border border-cyan-400/30 flex items-center justify-center shadow-[0_0_35px_rgba(34,211,238,0.25)]">
                <Avatar3D
                  speaking={speaking}
                  listening={listening}
                  thinking={loading}
                  agentMode={agentMode}
                  compact
                />
              </div>

              <div>
                <h3 className="text-white font-bold">{assistantTitle}</h3>

                <p className="text-[11px] text-cyan-300">
                  Voice: {voiceLabel}
                </p>

                <p className="text-xs text-cyan-300">
                  {listening
                    ? "Listening... press mic again to stop"
                    : speaking
                    ? "Speaking..."
                    : loading
                    ? "Thinking..."
                    : pageMode === "coding"
                    ? "Ready to debug and generate copy-paste code"
                    : "Placiora AI copilot ready"}
                </p>
              </div>
            </div>

            <div className="relative z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAgentMode((prev) => !prev)}
                className={`h-9 px-3 rounded-xl border text-xs flex items-center gap-2 ${
                  agentMode
                    ? "bg-purple-500/20 border-purple-400/30 text-purple-200"
                    : "bg-white/10 border-white/10 text-slate-300"
                }`}
              >
                <Brain size={14} />
                Agent
              </button>

              {speaking && (
                <button
                  type="button"
                  onClick={stopSpeaking}
                  className="w-9 h-9 rounded-xl bg-red-500/10 text-red-300 border border-red-400/20 flex items-center justify-center"
                >
                  <Square size={15} />
                </button>
              )}

              <button
                type="button"
                onClick={() => setMinimized((prev) => !prev)}
                className="w-9 h-9 rounded-xl bg-white/10 text-slate-300 hover:text-white flex items-center justify-center"
              >
                {minimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>

              <button
                type="button"
                onClick={closeAssistant}
                className="w-9 h-9 rounded-xl bg-white/10 text-slate-300 hover:text-white flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              <div className="px-5 pt-4 bg-slate-950/90 border-b border-white/5">
                <div className="flex flex-wrap items-center gap-2 pb-4">
                  <PageBadge pageMode={pageMode} />

                  {pageQuickActions.map((action) => {
                    const Icon = action.icon

                    return (
                      <button
                        key={action.prompt}
                        type="button"
                        onClick={() => sendMessage(action.prompt)}
                        className="px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-slate-300 hover:text-cyan-300 hover:border-cyan-400/30 transition-all flex items-center gap-2"
                      >
                        <Icon size={13} />
                        {action.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="h-[430px] overflow-y-auto p-5 space-y-4 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.10),transparent_35%)]">
                {messages.map((msg, index) => {
                  const hasCode = /```[\s\S]*?```/.test(msg.content)

                  return (
                    <div
                      key={`${msg.role}-${index}`}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`relative max-w-[86%] rounded-2xl px-4 py-3 border leading-7 ${
                          msg.role === "user"
                            ? "bg-cyan-500/15 border-cyan-400/25 text-white"
                            : "bg-white/[0.045] border-white/10 text-slate-200"
                        }`}
                      >
                        {hasCode && msg.role === "assistant" && (
                          <button
                            type="button"
                            onClick={() =>
                              copyCodeFromMessage(msg.content, index)
                            }
                            className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 text-[11px] flex items-center gap-1"
                          >
                            {copiedIndex === index ? (
                              <>
                                <CheckCircle size={12} />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                Copy
                              </>
                            )}
                          </button>
                        )}

                        <MessageContent content={msg.content} />
                      </div>
                    </div>
                  )
                })}

                {loading && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl px-4 py-3 bg-white/[0.045] border border-white/10 text-cyan-300 flex items-center gap-2">
                      <Bot size={17} />
                      Thinking...
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="px-5 pb-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {quickActions.map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => sendMessage(action)}
                      className="px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-slate-300 hover:text-cyan-300 hover:border-cyan-400/30 transition-all"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-white/10 bg-slate-950/90">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={toggleVoice}
                    disabled={loading}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-white transition ${
                      listening
                        ? "bg-red-500 shadow-[0_0_35px_rgba(239,68,68,0.55)] animate-pulse"
                        : "bg-slate-800 hover:bg-slate-700"
                    } disabled:opacity-50`}
                  >
                    {listening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>

                  <input
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value)
                      transcriptRef.current = e.target.value
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendMessage()
                    }}
                    placeholder={
                      pageMode === "coding"
                        ? "Ask Sifra to fix, explain, optimize, or generate code..."
                        : "Ask Sifra about placements, coding, interviews, resumes..."
                    }
                    className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 text-white outline-none focus:border-cyan-400/40"
                  />

                  <button
                    type="button"
                    onClick={() => sendMessage()}
                    disabled={loading || !input.trim()}
                    className="w-12 h-12 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 flex items-center justify-center text-white"
                  >
                    {loading ? <Bot size={18} /> : <Send size={18} />}
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 mt-3 flex items-center gap-1">
                  <Volume2 size={12} />
                  Press mic once to start. Speak freely. Press again to stop and
                  send.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}

function PageBadge({ pageMode }) {
  const map = {
    coding: {
      text: "Coding Copilot Mode",
      icon: Code2,
      className: "bg-cyan-500/10 border-cyan-400/20 text-cyan-300"
    },
    "live-interview": {
      text: "Interview Coach Mode",
      icon: Brain,
      className: "bg-purple-500/10 border-purple-400/20 text-purple-300"
    },
    resume: {
      text: "Resume Mentor Mode",
      icon: FileText,
      className: "bg-emerald-500/10 border-emerald-400/20 text-emerald-300"
    },
    default: {
      text: "Placiora AI Copilot",
      icon: Sparkles,
      className: "bg-white/[0.05] border-white/10 text-slate-300"
    }
  }

  const item = map[pageMode] || map.default
  const Icon = item.icon

  return (
    <span
      className={`px-3 py-2 rounded-xl border text-xs flex items-center gap-2 ${item.className}`}
    >
      <Icon size={13} />
      {item.text}
    </span>
  )
}

function MessageContent({ content }) {
  const parts = String(content).split(/(```[\s\S]*?```)/g)

  return (
    <div className="space-y-3">
      {parts.map((part, index) => {
        if (part.startsWith("```")) {
          const cleaned = part
            .replace(/^```[\w-]*\n?/, "")
            .replace(/```$/, "")
            .trim()

          return (
            <pre
              key={index}
              className="mt-4 overflow-x-auto rounded-xl bg-slate-950 border border-cyan-400/20 p-4 text-xs leading-6 text-cyan-100"
            >
              <code>{cleaned}</code>
            </pre>
          )
        }

        return (
          <p key={index} className="whitespace-pre-wrap pr-10">
            {part}
          </p>
        )
      })}
    </div>
  )
}

function getPageMode(pathname = "") {
  if (pathname.includes("coding")) return "coding"
  if (pathname.includes("live-interview")) return "live-interview"
  if (pathname.includes("resume")) return "resume"
  if (pathname.includes("recruiter")) return "recruiter"
  if (pathname.includes("placement")) return "placement"
  return "default"
}

function getQuickActionsForPage(pathname = "") {
  if (pathname.includes("coding")) {
    return [
      {
        label: "Fix Error",
        prompt:
          "Fix the error in my current code and give corrected copy-paste code.",
        icon: Bug
      },
      {
        label: "Explain",
        prompt: "Explain my current code step by step.",
        icon: Code2
      },
      {
        label: "Optimize",
        prompt: "Optimize my current code and explain time complexity.",
        icon: Wand2
      },
      {
        label: "Tests",
        prompt: "Generate test cases for my current code.",
        icon: FileText
      }
    ]
  }

  if (pathname.includes("live-interview")) {
    return [
      {
        label: "Improve Answer",
        prompt: "Improve my last interview answer using STAR method.",
        icon: Brain
      },
      {
        label: "Tips",
        prompt: "Give me quick live interview tips for this page.",
        icon: Sparkles
      }
    ]
  }

  if (pathname.includes("resume")) {
    return [
      {
        label: "ATS Fix",
        prompt: "Give ATS improvements for my resume.",
        icon: FileText
      },
      {
        label: "Projects",
        prompt: "Improve my resume project descriptions.",
        icon: Wand2
      }
    ]
  }

  return [
    {
      label: "Next Step",
      prompt: "What should I build next in this project?",
      icon: Sparkles
    },
    {
      label: "Debug",
      prompt: "Help me debug the current issue.",
      icon: Bug
    }
  ]
}

export default AIAssistantAvatar