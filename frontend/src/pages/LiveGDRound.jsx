import { useEffect, useRef, useState } from "react"
import { io } from "socket.io-client"

import MainLayout from "../layouts/MainLayout.jsx"

import {
  MessageCircle,
  Send,
  Users,
  Trophy,
  CheckCircle,
  XCircle,
  RotateCcw,
  Mic,
  Square,
  Volume2,
  Check,
  RefreshCw,
  Camera,
  Monitor,
  Clipboard,
  UserPlus,
  Sparkles,
  Activity,
  Brain,
  Target,
  ShieldCheck
} from "lucide-react"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000"
const API_URL = `${API_BASE}/api/live-gd-round`
const SOCKET_URL = API_BASE

const DEFAULT_COMPANIES = [
  "General",
  "Google",
  "Microsoft",
  "Amazon",
  "Meta",
  "Apple",
  "Adobe",
  "Oracle",
  "IBM",
  "Deloitte",
  "Accenture",
  "Capgemini",
  "Infosys",
  "TCS",
  "Wipro",
  "Cognizant",
  "HCL",
  "Flipkart",
  "Swiggy",
  "Zomato",
  "Paytm",
  "PhonePe",
  "Meesho",
  "Zoho",
  "Freshworks"
]

function LiveGDRound() {
  const [topic, setTopic] = useState("Impact of AI on Jobs")
  const [difficulty, setDifficulty] = useState("Beginner")
  const [company, setCompany] = useState("General")
  const [companies, setCompanies] = useState(DEFAULT_COMPANIES)

  const [roundId, setRoundId] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [inviteInput, setInviteInput] = useState("")
  const [inviteLink, setInviteLink] = useState("")
  const [isHost, setIsHost] = useState(false)
  const [hasInviteFromUrl, setHasInviteFromUrl] = useState(false)

  const [messages, setMessages] = useState([])
  const [participants, setParticipants] = useState([])
  const [userMessage, setUserMessage] = useState("")
  const [result, setResult] = useState(null)
  const [liveEvaluation, setLiveEvaluation] = useState(null)

  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const [roomReady, setRoomReady] = useState(false)
  const [error, setError] = useState("")

  const [audioDevices, setAudioDevices] = useState([])
  const [videoDevices, setVideoDevices] = useState([])
  const [selectedMic, setSelectedMic] = useState("")
  const [selectedCamera, setSelectedCamera] = useState("")
  const [deviceReady, setDeviceReady] = useState(false)
  const [cameraStatus, setCameraStatus] = useState("Not started")
  const [micLevel, setMicLevel] = useState(0)

  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)

  const videoRef = useRef(null)
  const socketRef = useRef(null)
  const previewStreamRef = useRef(null)
  const audioContextRef = useRef(null)
  const animationRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordingStreamRef = useRef(null)
  const chunksRef = useRef([])

  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const userId = user?._id || user?.id || ""
  const userName = user?.name || "Participant"
  const userEmail = user?.email || ""

  const handleMouseMove = (e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()

    card.style.setProperty("--x", `${e.clientX - rect.left}px`)
    card.style.setProperty("--y", `${e.clientY - rect.top}px`)
  }

  const stopStreams = () => {
    if (previewStreamRef.current) {
      previewStreamRef.current.getTracks().forEach((track) => track.stop())
      previewStreamRef.current = null
    }

    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach((track) => track.stop())
      recordingStreamRef.current = null
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const attachStreamToVideo = () => {
    if (videoRef.current && previewStreamRef.current) {
      videoRef.current.srcObject = previewStreamRef.current
    }
  }

  const emitDeviceReady = (room = roundId) => {
    if (socketRef.current && room) {
      socketRef.current.emit("live-gd-device-ready", {
        roomId: room,
        micReady: true,
        cameraReady: true
      })
    }
  }

  const speakText = (text, speakerName = "") => {
    if (!text || !window.speechSynthesis) return

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.volume = 1

    if (speakerName === "Priya") {
      utterance.rate = 0.95
      utterance.pitch = 1.25
    } else if (speakerName === "Rahul") {
      utterance.rate = 0.92
      utterance.pitch = 0.85
    } else if (speakerName === "Aarav") {
      utterance.rate = 0.9
      utterance.pitch = 0.78
    } else if (speakerName === "Neha") {
      utterance.rate = 0.9
      utterance.pitch = 1.08
    } else if (speakerName === "Moderator") {
      utterance.rate = 0.88
      utterance.pitch = 0.95
    } else {
      utterance.rate = 0.95
      utterance.pitch = 1.05
    }

    const voices = window.speechSynthesis.getVoices()
    const lowerName = speakerName.toLowerCase()

    const preferredVoice =
      lowerName.includes("rahul") || lowerName.includes("aarav")
        ? voices.find((voice) => voice.name.toLowerCase().includes("david")) ||
          voices.find((voice) => voice.name.toLowerCase().includes("mark")) ||
          voices.find((voice) => voice.lang?.toLowerCase().startsWith("en"))
        : voices.find((voice) => voice.name.toLowerCase().includes("zira")) ||
          voices.find((voice) => voice.name.toLowerCase().includes("aria")) ||
          voices.find((voice) =>
            voice.name.toLowerCase().includes("samantha")
          ) ||
          voices.find((voice) => voice.lang?.toLowerCase().startsWith("en"))

    if (preferredVoice) utterance.voice = preferredVoice

    window.speechSynthesis.speak(utterance)
  }

  const connectSocket = (room, hostStatus = false) => {
    if (!room) return

    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        withCredentials: true
      })
    }

    socketRef.current.emit("live-gd-join-room", {
      roomId: room,
      userId,
      name: userName,
      email: userEmail,
      role: hostStatus ? "Host" : "Participant"
    })

    socketRef.current.off("live-gd-users-updated")
    socketRef.current.off("live-gd-new-message")
    socketRef.current.off("live-gd-system-message")
    socketRef.current.off("live-gd-ended")
    socketRef.current.off("live-gd-started")
    socketRef.current.off("live-gd-room-full")

    socketRef.current.on("live-gd-users-updated", (users) => {
      setParticipants(Array.isArray(users) ? users : [])
    })

    socketRef.current.on("live-gd-new-message", (messageData) => {
      setMessages((prev) => {
        const exists = prev.some(
          (item) =>
            item.message === messageData.message &&
            item.name === messageData.name &&
            item.role === messageData.role
        )

        return exists ? prev : [...prev, messageData]
      })

      if (messageData?.speaker === "ai") {
        speakText(
          `${messageData.name || "AI"} says. ${messageData.message}`,
          messageData.name || "AI"
        )
      }
    })

    socketRef.current.on("live-gd-system-message", (messageData) => {
      setMessages((prev) => [
        ...prev,
        {
          speaker: "system",
          name: messageData.name || "System",
          role: "System",
          message: messageData.message || ""
        }
      ])
    })

    socketRef.current.on("live-gd-started", () => {
      setStarted(true)
      setTimeout(attachStreamToVideo, 300)
      speakText("The live group discussion has started.", "Moderator")
    })

    socketRef.current.on("live-gd-ended", () => {
      setStarted(false)
    })

    socketRef.current.on("live-gd-room-full", (payload) => {
      setError(payload?.message || "This GD room is full.")
    })
  }

  const initializeDevices = async () => {
    try {
      setError("")

      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera and microphone are not supported in this browser.")
        return
      }

      const permissionStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      })

      permissionStream.getTracks().forEach((track) => track.stop())

      const devices = await navigator.mediaDevices.enumerateDevices()
      const mics = devices.filter((device) => device.kind === "audioinput")
      const cameras = devices.filter((device) => device.kind === "videoinput")

      setAudioDevices(mics)
      setVideoDevices(cameras)

      if (mics.length > 0) setSelectedMic(mics[0].deviceId)
      if (cameras.length > 0) setSelectedCamera(cameras[0].deviceId)
    } catch {
      setError("Device permission failed. Please allow camera and microphone.")
    }
  }

  const loadDevices = async () => {
    await initializeDevices()
  }

  const loadCompanies = async () => {
    try {
      const res = await fetch(`${API_URL}/companies`)
      const data = await res.json()

      if (data.success && Array.isArray(data.companies)) {
        setCompanies(data.companies)
      }
    } catch {
      setCompanies(DEFAULT_COMPANIES)
    }
  }

  const testDevices = async () => {
    try {
      setError("")
      stopStreams()
      setMicLevel(0)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true,
        audio: selectedMic
          ? {
              deviceId: { exact: selectedMic },
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          : {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
      })

      previewStreamRef.current = stream
      attachStreamToVideo()

      setCameraStatus("Working")
      setDeviceReady(true)

      const AudioContext = window.AudioContext || window.webkitAudioContext
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)

      analyser.fftSize = 256
      source.connect(analyser)
      audioContextRef.current = audioContext

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const updateMicLevel = () => {
        analyser.getByteFrequencyData(dataArray)

        const average =
          dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length

        setMicLevel(Math.min(100, Math.round(average * 2)))

        animationRef.current = requestAnimationFrame(updateMicLevel)
      }

      updateMicLevel()

      setTimeout(() => emitDeviceReady(), 300)
    } catch {
      setDeviceReady(false)
      setCameraStatus("Failed")
      setError("Device test failed. Please check camera and mic permission.")
    }
  }

  useEffect(() => {
    const initializePage = async () => {
      await initializeDevices()
      await loadCompanies()

      const params = new URLSearchParams(window.location.search)
      const code = params.get("invite")

      if (code) {
        setInviteInput(code.toUpperCase())
        setHasInviteFromUrl(true)
      }
    }

    initializePage()

    return () => {
      stopStreams()
      socketRef.current?.disconnect()
      window.speechSynthesis?.cancel()
    }
  }, [])

  useEffect(() => {
    attachStreamToVideo()
  }, [roomReady, started])

  const speakOpeningMessages = (items = []) => {
    items
      .filter((item) => item.speaker === "ai")
      .forEach((item, index) => {
        setTimeout(() => {
          speakText(`${item.name || "AI"} says. ${item.message}`, item.name)
        }, index * 3000)
      })
  }

  const createRoom = async () => {
    if (!deviceReady) {
      setError("Please test your camera and microphone before starting GD.")
      return
    }

    try {
      setLoading(true)
      setError("")
      setResult(null)
      setLiveEvaluation(null)

      const res = await fetch(`${API_URL}/create-room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId,
          name: userName,
          email: userEmail,
          topic,
          difficulty,
          company
        })
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.message || "Room creation failed")
      }

      const newRoundId = data.roundId || data.round?._id
      const newInviteCode = data.inviteCode || data.round?.inviteCode || ""
      const newInviteLink =
        data.inviteLink ||
        data.round?.inviteLink ||
        `${window.location.origin}/live-gd-round?invite=${newInviteCode}`

      setRoundId(newRoundId)
      setInviteCode(newInviteCode)
      setInviteLink(newInviteLink)
      setMessages(data.round?.messages || [])
      setParticipants(data.round?.participants || [])
      setRoomReady(true)
      setStarted(true)
      setIsHost(true)

      connectSocket(newRoundId, true)

      setTimeout(() => {
        attachStreamToVideo()

        socketRef.current?.emit("live-gd-device-ready", {
          roomId: newRoundId,
          micReady: true,
          cameraReady: true
        })

        socketRef.current?.emit("live-gd-started", {
          roomId: newRoundId
        })
      }, 500)

      speakOpeningMessages(data.round?.messages || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const joinRoom = async () => {
    if (!deviceReady) {
      setError("Please test your camera and microphone before joining GD.")
      return
    }

    try {
      setLoading(true)
      setError("")
      setResult(null)
      setLiveEvaluation(null)

      const cleanCode = inviteInput.trim().toUpperCase()

      if (!cleanCode) {
        throw new Error("Invite code is required")
      }

      const res = await fetch(`${API_URL}/join-room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inviteCode: cleanCode,
          userId,
          name: userName,
          email: userEmail
        })
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.message || "Join room failed")
      }

      const room = data.round

      setRoundId(room._id)
      setInviteCode(room.inviteCode)
      setInviteLink(
        room.inviteLink ||
          `${window.location.origin}/live-gd-round?invite=${room.inviteCode}`
      )
      setTopic(room.topic)
      setDifficulty(room.difficulty)
      setCompany(room.company)
      setMessages(room.messages || [])
      setParticipants(room.participants || [])
      setRoomReady(true)
      setStarted(true)
      setIsHost(false)

      connectSocket(room._id, false)

      setTimeout(() => {
        attachStreamToVideo()

        socketRef.current?.emit("live-gd-device-ready", {
          roomId: room._id,
          micReady: true,
          cameraReady: true
        })
      }, 500)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyInviteLink = async () => {
    const linkToCopy =
      inviteLink || `${window.location.origin}/live-gd-round?invite=${inviteCode}`

    try {
      await navigator.clipboard.writeText(linkToCopy)
      speakText("Meeting link copied.", "Moderator")
    } catch {
      setError("Could not copy meeting link.")
    }
  }

  const startRecording = async () => {
    try {
      setError("")
      chunksRef.current = []

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedMic
          ? {
              deviceId: { exact: selectedMic },
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          : {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
      })

      recordingStreamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm"

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        try {
          setTranscribing(true)

          const audioBlob = new Blob(chunksRef.current, {
            type: mimeType
          })

          const formData = new FormData()
          formData.append("audio", audioBlob, "live-gd-answer.webm")

          const res = await fetch(`${API_URL}/transcribe`, {
            method: "POST",
            body: formData
          })

          const data = await res.json()

          if (!data.success) {
            throw new Error(data.message || "Transcription failed")
          }

          setUserMessage((prev) => (prev ? `${prev} ${data.text}` : data.text))
        } catch (err) {
          setError(err.message)
        } finally {
          setTranscribing(false)

          if (recordingStreamRef.current) {
            recordingStreamRef.current
              .getTracks()
              .forEach((track) => track.stop())
            recordingStreamRef.current = null
          }
        }
      }

      recorder.start()
      setRecording(true)
    } catch {
      setError("Microphone recording failed. Please allow mic access.")
      setRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  const sendMessage = async () => {
    if (!userMessage.trim()) return

    if (!roundId) {
      setError("Room missing. Please create or join again.")
      return
    }

    try {
      setLoading(true)
      setError("")

      const currentMessage = userMessage.trim()
      setUserMessage("")

      const res = await fetch(`${API_URL}/speak`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          roundId,
          message: currentMessage,
          name: userName,
          role: isHost ? "Host" : "Participant",
          userId
        })
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.message || "Message failed")
      }

      setMessages(data.messages || [])

      if (data.userEvaluation) {
        setLiveEvaluation(data.userEvaluation)
      }

      socketRef.current?.emit("live-gd-send-message", {
        roomId: roundId,
        message: currentMessage,
        name: userName,
        userId,
        role: isHost ? "Host" : "Participant"
      })

      if (Array.isArray(data.aiReplies) && data.aiReplies.length > 0) {
        data.aiReplies.forEach((reply, index) => {
          setTimeout(() => {
            socketRef.current?.emit("live-gd-ai-message", {
              roomId: roundId,
              name: reply.name || "AI",
              role: reply.role || "AI Participant",
              personality: reply.personality || "Balanced",
              message: reply.message
            })

            speakText(
              `${reply.name || "AI"} says. ${reply.message}`,
              reply.name || "AI"
            )
          }, index * 3500)
        })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const finishGD = async () => {
    if (!roundId) {
      setError("Round ID missing.")
      return
    }

    try {
      setLoading(true)
      setError("")

      const res = await fetch(`${API_URL}/finish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ roundId })
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.message || "GD evaluation failed")
      }

      setResult(data.round)
      setStarted(false)

      socketRef.current?.emit("live-gd-round-ended", {
        roomId: roundId
      })

      speakText(
        "Your group discussion has been evaluated. Please check your score, recruiter verdict and feedback.",
        "Moderator"
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetGD = () => {
    window.speechSynthesis?.cancel()
    stopStreams()

    socketRef.current?.disconnect()
    socketRef.current = null

    setRoundId("")
    setInviteCode("")
    setInviteLink("")
    setInviteInput("")
    setMessages([])
    setParticipants([])
    setUserMessage("")
    setStarted(false)
    setRoomReady(false)
    setIsHost(false)
    setHasInviteFromUrl(false)
    setResult(null)
    setLiveEvaluation(null)
    setError("")
    setRecording(false)
    setTranscribing(false)
    setDeviceReady(false)
    setCameraStatus("Not started")
    setMicLevel(0)
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8 page-fade">
        <section
          onMouseMove={handleMouseMove}
          className="glow-card relative overflow-hidden rounded-[3rem] border border-cyan-400/20 bg-slate-950/90 p-8 shadow-[0_0_120px_rgba(34,211,238,0.12)]"
        >
          <div className="absolute -top-28 -right-28 w-[460px] h-[460px] bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[460px] h-[460px] bg-cyan-600/20 rounded-full blur-3xl" />

          <div className="relative z-10 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-700 flex items-center justify-center shadow-[0_0_45px_rgba(34,211,238,0.35)]">
              <Users size={34} className="text-white" />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 text-cyan-300 mb-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20">
                <Sparkles size={16} />
                <span className="text-sm">
                  Live GD Meeting + Multi-AI Moderator
                </span>
              </div>

              <h1 className="text-4xl lg:text-5xl font-black text-white text-glow">
                Multiplayer Live Group Discussion
              </h1>

              <p className="text-slate-400 mt-3 leading-7 max-w-4xl">
                Practice with real participants, AI candidates, different AI
                voices, live answer evaluation, recruiter-style observation and
                final GD performance report.
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        {!roomReady && !result && (
          <>
            <DeviceSection
              videoRef={videoRef}
              audioDevices={audioDevices}
              videoDevices={videoDevices}
              selectedMic={selectedMic}
              selectedCamera={selectedCamera}
              setSelectedMic={setSelectedMic}
              setSelectedCamera={setSelectedCamera}
              deviceReady={deviceReady}
              cameraStatus={cameraStatus}
              micLevel={micLevel}
              loadDevices={loadDevices}
              testDevices={testDevices}
              speakText={speakText}
              onMouseMove={handleMouseMove}
            />

            {!hasInviteFromUrl && (
              <section
                onMouseMove={handleMouseMove}
                className="glow-card rounded-[2.3rem] p-6 border border-cyan-400/10 hover:border-cyan-300/30"
              >
                <h2 className="text-2xl font-bold text-white mb-5">
                  Host Setup: Start GD & Generate Meeting Link
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="GD Topic"
                    className="rounded-2xl bg-slate-900/80 border border-white/10 px-4 py-4 outline-none text-white focus:border-cyan-400"
                  />

                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="rounded-2xl bg-slate-900/80 border border-white/10 px-4 py-4 outline-none text-white focus:border-cyan-400"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>

                  <select
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="rounded-2xl bg-slate-900/80 border border-white/10 px-4 py-4 outline-none text-white focus:border-cyan-400"
                  >
                    {companies.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={createRoom}
                    disabled={loading || !deviceReady}
                    className="glow-button rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 py-4 font-semibold disabled:opacity-50 text-white"
                  >
                    {loading
                      ? "Starting..."
                      : deviceReady
                      ? "Start GD & Generate Link"
                      : "Test Devices First"}
                  </button>
                </div>
              </section>
            )}

            <section
              onMouseMove={handleMouseMove}
              className="glow-card rounded-[2.3rem] p-6 border border-cyan-400/10 hover:border-cyan-300/30"
            >
              <h2 className="text-2xl font-bold text-white mb-5">
                Join Existing GD Meeting
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
                <input
                  value={inviteInput}
                  onChange={(e) => setInviteInput(e.target.value)}
                  placeholder="Enter invite code"
                  className="rounded-2xl bg-slate-900/80 border border-white/10 px-4 py-4 outline-none uppercase text-white focus:border-cyan-400"
                />

                <button
                  type="button"
                  onClick={joinRoom}
                  disabled={loading || !deviceReady}
                  className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-8 py-4 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 text-white"
                >
                  <UserPlus size={18} />
                  {deviceReady ? "Join GD Meeting" : "Test Devices First"}
                </button>
              </div>
            </section>
          </>
        )}

        {roomReady && started && (
          <>
            <section
              onMouseMove={handleMouseMove}
              className="glow-card rounded-[2.3rem] p-6 border border-cyan-400/10 hover:border-cyan-300/30"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    GD Meeting Room
                  </h2>

                  <p className="text-slate-400">
                    Invite Code:{" "}
                    <span className="text-cyan-300 font-bold">
                      {inviteCode || "Generating..."}
                    </span>
                  </p>
                </div>

                {isHost && (
                  <button
                    type="button"
                    onClick={copyInviteLink}
                    className="rounded-2xl bg-white/10 hover:bg-white/15 px-5 py-3 font-semibold flex items-center gap-2 text-white"
                  >
                    <Clipboard size={18} />
                    Copy Meeting Link
                  </button>
                )}
              </div>
            </section>

            {liveEvaluation && <LiveEvaluationPanel data={liveEvaluation} />}

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div
                onMouseMove={handleMouseMove}
                className="glow-card rounded-[2.3rem] p-6 border border-cyan-400/10 hover:border-cyan-300/30"
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-2xl font-bold text-white">
                    Camera & Members
                  </h2>

                  {isHost && (
                    <button
                      type="button"
                      onClick={finishGD}
                      disabled={loading}
                      className="px-5 py-3 rounded-xl bg-red-500 hover:bg-red-600 font-semibold text-white disabled:opacity-50"
                    >
                      End & Evaluate
                    </button>
                  )}
                </div>

                <div className="rounded-2xl overflow-hidden bg-black h-[360px] border border-white/10">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {participants.map((participant, index) => (
                    <ParticipantCard
                      key={participant.socketId || participant.email || index}
                      participant={participant}
                    />
                  ))}
                </div>
              </div>

              <div
                onMouseMove={handleMouseMove}
                className="glow-card rounded-[2.3rem] p-6 border border-cyan-400/10 hover:border-cyan-300/30"
              >
                <div className="flex items-center gap-3 mb-5">
                  <MessageCircle className="text-cyan-300" />

                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Live GD Discussion
                    </h2>

                    <p className="text-slate-400">
                      Human participants + Moderator + Priya, Rahul, Aarav and
                      Neha.
                    </p>
                  </div>
                </div>

                <div className="h-[280px] overflow-y-auto rounded-2xl bg-slate-950/70 border border-white/10 p-4 space-y-4 mb-5">
                  {messages.map((msg, index) => (
                    <div
                      key={`${msg.name || "message"}-${index}`}
                      className={`flex ${
                        msg.name === userName ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 border ${
                          msg.name === userName
                            ? "bg-cyan-500/20 border-cyan-400/30"
                            : msg.name === "Moderator"
                            ? "bg-yellow-500/10 border-yellow-400/30"
                            : "bg-purple-500/20 border-purple-400/30"
                        }`}
                      >
                        <p className="font-semibold text-sm text-white">
                          {msg.name || "Participant"}{" "}
                          <span className="text-slate-400">
                            {msg.role || ""}
                          </span>
                        </p>

                        <p className="text-slate-200 mt-1 leading-7">
                          {msg.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 mb-4 min-h-[120px]">
                  <p className="text-slate-400 text-sm mb-2">
                    Groq Whisper Speech-to-Text Output
                  </p>

                  <textarea
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    placeholder="Click Start Speaking, speak, then Stop."
                    className="w-full h-24 bg-transparent outline-none text-white resize-none"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={recording ? stopRecording : startRecording}
                    disabled={loading || transcribing}
                    className={`px-5 py-3 rounded-xl font-semibold flex items-center gap-2 text-white disabled:opacity-50 ${
                      recording
                        ? "bg-red-500/80 hover:bg-red-600"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {recording ? <Square size={18} /> : <Mic size={18} />}
                    {recording
                      ? "Stop"
                      : transcribing
                      ? "Transcribing..."
                      : "Start Speaking"}
                  </button>

                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={loading || transcribing || !userMessage.trim()}
                    className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold flex items-center gap-2 disabled:opacity-50 text-white"
                  >
                    <Send size={18} />
                    Submit
                  </button>

                  <button
                    type="button"
                    onClick={resetGD}
                    className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-semibold flex items-center gap-2 text-white"
                  >
                    <RotateCcw size={18} />
                    Reset
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {result && <ResultSection result={result} />}
      </div>
    </MainLayout>
  )
}

function LiveEvaluationPanel({ data }) {
  return (
    <section className="glow-card rounded-[2.3rem] border border-emerald-400/20 bg-emerald-500/10 p-6">
      <div className="flex items-center gap-3 mb-5">
        <Activity className="text-emerald-300" size={28} />

        <div>
          <h2 className="text-2xl font-bold text-white">
            Live Recruiter Observation
          </h2>
          <p className="text-slate-400">
            Updated after your latest contribution.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MiniScore title="Communication" score={data.communicationScore} />
        <MiniScore title="Content" score={data.contentScore} />
        <MiniScore title="Leadership" score={data.leadershipScore} />
        <MiniScore title="Confidence" score={data.confidenceScore} />
        <MiniScore title="Relevance" score={data.relevanceScore} />
      </div>

      <p className="text-emerald-200 mt-5 leading-7">
        {data.feedback || "Keep contributing with examples and structure."}
      </p>
    </section>
  )
}

function MiniScore({ title, score }) {
  const safeScore = Math.min(Number(score) || 0, 100)

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <p className="text-slate-400 text-sm">{title}</p>
      <h3 className="text-2xl font-black text-white mt-1">{safeScore}</h3>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden mt-3">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400"
          style={{ width: `${safeScore}%` }}
        />
      </div>
    </div>
  )
}

function DeviceSection({
  videoRef,
  audioDevices,
  videoDevices,
  selectedMic,
  selectedCamera,
  setSelectedMic,
  setSelectedCamera,
  deviceReady,
  cameraStatus,
  micLevel,
  loadDevices,
  testDevices,
  speakText,
  onMouseMove
}) {
  return (
    <section
      onMouseMove={onMouseMove}
      className="glow-card rounded-[2.3rem] p-6 border border-cyan-400/10 hover:border-cyan-300/30"
    >
      <h2 className="text-2xl font-bold text-white mb-5">
        Camera & Microphone Setup
      </h2>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <div className="rounded-2xl overflow-hidden bg-black h-[330px] border border-white/10">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>

          <div className="mt-4 space-y-3 text-slate-300">
            <p className="flex items-center gap-2">
              <Camera size={18} />
              Camera:{" "}
              <span
                className={
                  cameraStatus === "Working"
                    ? "text-emerald-300"
                    : "text-slate-400"
                }
              >
                {cameraStatus}
              </span>
            </p>

            <div>
              <p className="flex items-center gap-2 mb-2">
                <Mic size={18} />
                Microphone Level:{" "}
                <span className="text-cyan-300">{micLevel}%</span>
              </p>

              <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-600"
                  style={{ width: `${micLevel}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={loadDevices}
            className="w-full rounded-2xl bg-white/10 hover:bg-white/15 py-4 font-semibold flex items-center justify-center gap-2 text-white"
          >
            <RefreshCw size={18} />
            Load / Refresh Devices
          </button>

          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="w-full rounded-2xl bg-slate-900/80 border border-white/10 px-4 py-4 outline-none text-white focus:border-cyan-400"
          >
            <option value="">Default Camera</option>

            {videoDevices.map((device, index) => (
              <option key={device.deviceId || index} value={device.deviceId}>
                {device.label || `Camera ${index + 1}`}
              </option>
            ))}
          </select>

          <select
            value={selectedMic}
            onChange={(e) => setSelectedMic(e.target.value)}
            className="w-full rounded-2xl bg-slate-900/80 border border-white/10 px-4 py-4 outline-none text-white focus:border-cyan-400"
          >
            <option value="">Default Microphone</option>

            {audioDevices.map((device, index) => (
              <option key={device.deviceId || index} value={device.deviceId}>
                {device.label || `Microphone ${index + 1}`}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={testDevices}
            className="w-full rounded-2xl bg-emerald-600/80 hover:bg-emerald-600 py-4 font-semibold flex items-center justify-center gap-2 text-white"
          >
            {deviceReady ? <Check size={18} /> : <Monitor size={18} />}
            {deviceReady
              ? "Camera & Mic Ready"
              : "Test Selected Camera & Mic"}
          </button>

          <button
            type="button"
            onClick={() =>
              speakText(
                "This is Priya speaking. Rahul, Aarav, Neha and the moderator will use different voice styles in the live GD.",
                "Priya"
              )
            }
            className="w-full rounded-2xl border border-cyan-400/20 bg-cyan-500/10 py-4 font-semibold text-cyan-200 hover:bg-cyan-500/20 transition flex items-center justify-center gap-2"
          >
            <Volume2 size={18} />
            Test AI Candidate Voice
          </button>
        </div>
      </div>
    </section>
  )
}

function ParticipantCard({ participant }) {
  return (
    <div className="rounded-xl bg-slate-950/70 border border-white/10 p-3">
      <p className="font-semibold text-white">{participant.name}</p>

      <p className="text-xs text-slate-400">{participant.role}</p>

      <p className="text-xs mt-2">
        <span
          className={
            participant.micReady ? "text-emerald-300" : "text-red-300"
          }
        >
          Mic {participant.micReady ? "Ready" : "Not Ready"}
        </span>{" "}
        ·{" "}
        <span
          className={
            participant.cameraReady ? "text-emerald-300" : "text-red-300"
          }
        >
          Camera {participant.cameraReady ? "Ready" : "Not Ready"}
        </span>
      </p>
    </div>
  )
}

function ScoreCard({ title, score, icon: Icon }) {
  const safeScore = Math.min(Number(score) || 0, 100)

  return (
    <div className="rounded-3xl bg-slate-950/70 border border-white/10 p-4 text-center">
      {Icon && <Icon className="mx-auto text-cyan-300 mb-2" size={22} />}

      <p className="text-sm text-slate-400 mb-2">{title}</p>

      <h3 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
        {safeScore}
      </h3>

      <p className="text-xs text-slate-500 mt-1">/100</p>
    </div>
  )
}

function ResultBox({ title, text }) {
  return (
    <div className="rounded-3xl bg-slate-950/70 border border-white/10 p-5">
      <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>

      <p className="text-slate-300 leading-relaxed">
        {text || "No data available."}
      </p>
    </div>
  )
}

function ResultSection({ result }) {
  return (
    <section className="glow-card rounded-[2.3rem] border border-cyan-400/10 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="text-yellow-300" size={32} />

        <div>
          <h2 className="text-2xl font-bold text-white">
            GD Evaluation Result
          </h2>

          <p className="text-slate-400">Your performance summary</p>
        </div>
      </div>

      <div className="rounded-[2rem] border border-cyan-400/20 bg-cyan-500/10 p-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="text-cyan-300" size={26} />
          <h3 className="text-2xl font-bold text-white">
            Recruiter Verdict
          </h3>
        </div>

        <p className="text-cyan-300 text-3xl font-black">
          {result.recruiterVerdict || "Not Available"}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <ScoreCard title="Overall" score={result.overallScore} icon={Target} />
        <ScoreCard
          title="Communication"
          score={result.communicationScore}
          icon={MessageCircle}
        />
        <ScoreCard title="Content" score={result.contentScore} icon={Brain} />
        <ScoreCard
          title="Leadership"
          score={result.leadershipScore}
          icon={Users}
        />
        <ScoreCard
          title="Confidence"
          score={result.confidenceScore}
          icon={Activity}
        />
        <ScoreCard
          title="Critical Thinking"
          score={result.criticalThinkingScore}
          icon={Brain}
        />
        <ScoreCard
          title="Teamwork"
          score={result.teamworkScore}
          icon={Users}
        />
        <ScoreCard
          title="Arguments"
          score={result.argumentStrengthScore}
          icon={Target}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResultBox title="Feedback" text={result.feedback} />
        <ResultBox title="Improved Response" text={result.improvedResponse} />

        <div className="rounded-3xl bg-green-500/10 border border-green-400/20 p-5">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <CheckCircle className="text-green-300" size={20} />
            Strengths
          </h3>

          <ul className="space-y-2 text-slate-300">
            {(result.strengths || []).map((item, index) => (
              <li key={`strength-${index}`}>• {item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl bg-red-500/10 border border-red-400/20 p-5">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <XCircle className="text-red-300" size={20} />
            Weaknesses
          </h3>

          <ul className="space-y-2 text-slate-300">
            {(result.weaknesses || []).map((item, index) => (
              <li key={`weakness-${index}`}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default LiveGDRound