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
  MicOff,
  Square,
  Volume2,
  Check,
  RefreshCw,
  Camera,
  Video,
  VideoOff,
  Monitor,
  Clipboard,
  UserPlus,
  Sparkles,
  Activity,
  Brain,
  Target,
  ShieldCheck,
  UserCheck,
  UserX,
  Clock,
  Link2,
  KeyRound,
  Bot,
  PhoneOff,
  Download,
  FileText
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

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
}

function LiveGDRound() {
  const [topic, setTopic] = useState("Impact of AI on Jobs")
  const [difficulty, setDifficulty] = useState("Beginner")
  const [company, setCompany] = useState("General")
  const [companies, setCompanies] = useState(DEFAULT_COMPANIES)

  const [roundId, setRoundId] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [meetingCode, setMeetingCode] = useState("")
  const [inviteInput, setInviteInput] = useState("")
  const [inviteLink, setInviteLink] = useState("")
  const [isHost, setIsHost] = useState(false)
  const [hasInviteFromUrl, setHasInviteFromUrl] = useState(false)

  const [messages, setMessages] = useState([])
  const [participants, setParticipants] = useState([])
  const [pendingParticipants, setPendingParticipants] = useState([])
  const [aiParticipants, setAiParticipants] = useState([])
  const [roomState, setRoomState] = useState(null)

  const [waitingApproval, setWaitingApproval] = useState(false)
  const [rejected, setRejected] = useState(false)

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

  const [remoteStreams, setRemoteStreams] = useState([])
  const [micOn, setMicOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(true)
  const [lastRoom, setLastRoom] = useState(null)
  const [meetingRecording, setMeetingRecording] = useState(false)
  const [recordingUrl, setRecordingUrl] = useState("")

  const videoRef = useRef(null)
  const socketRef = useRef(null)
  const previewStreamRef = useRef(null)
  const audioContextRef = useRef(null)
  const animationRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordingStreamRef = useRef(null)
  const chunksRef = useRef([])

  const peerConnectionsRef = useRef({})
  const remoteStreamsRef = useRef({})
  const roundIdRef = useRef("")
  const participantsRef = useRef([])
  const meetingRecorderRef = useRef(null)
  const meetingRecordingStreamRef = useRef(null)
  const meetingRecordingChunksRef = useRef([])

  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const userId = user?._id || user?.id || ""
  const userName = user?.name || "Participant"
  const userEmail = user?.email || ""

  const humanCount = participants.length
  const maxMembers = roomState?.maxMembers || 5
  const aiCount =
    typeof roomState?.aiCount === "number"
      ? roomState.aiCount
      : Math.max(0, 5 - humanCount)

  useEffect(() => {
    roundIdRef.current = roundId
  }, [roundId])

  useEffect(() => {
    participantsRef.current = participants
  }, [participants])

  const handleMouseMove = (e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    card.style.setProperty("--x", `${e.clientX - rect.left}px`)
    card.style.setProperty("--y", `${e.clientY - rect.top}px`)
  }

  const closeAllPeers = () => {
    Object.values(peerConnectionsRef.current).forEach((peer) => {
      try {
        peer.close()
      } catch (err) {
        console.log("Peer close error:", err)
      }
    })
    peerConnectionsRef.current = {}
    remoteStreamsRef.current = {}
    setRemoteStreams([])
  }

  const stopStreams = () => {
    previewStreamRef.current?.getTracks().forEach((track) => track.stop())
    recordingStreamRef.current?.getTracks().forEach((track) => track.stop())
    meetingRecordingStreamRef.current?.getTracks().forEach((track) => track.stop())

    previewStreamRef.current = null
    recordingStreamRef.current = null
    meetingRecordingStreamRef.current = null

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

  const emitDeviceReady = (room = roundIdRef.current) => {
    if (socketRef.current && room) {
      socketRef.current.emit("live-gd-device-ready", {
        roomId: room,
        micReady: true,
        cameraReady: true,
        micOn,
        cameraOn
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

  const applyRoundData = (round) => {
    if (!round) return

    const code = round.meetingCode || round.inviteCode || ""
    const id = round._id || round.id || ""

    setRoundId(id)
    roundIdRef.current = id
    setInviteCode(code)
    setMeetingCode(code)

    if (code) {
      setInviteInput(code)
    }

    setInviteLink(
      code
        ? round.inviteLink ||
            `${window.location.origin}/live-gd-round?invite=${code}`
        : ""
    )

    setTopic(round.topic || "Impact of AI on Jobs")
    setDifficulty(round.difficulty || "Beginner")
    setCompany(round.company || "General")
    setMessages(round.messages || [])
    setParticipants(round.participants || [])
    participantsRef.current = round.participants || []
    setPendingParticipants(round.pendingParticipants || [])
    setAiParticipants(round.aiParticipants || [])
    setStarted(round.meetingStatus === "live")
    setRecordingUrl(round.recordingUrl || "")

    if (id && code) {
      const savedRoom = {
        roundId: id,
        meetingCode: code,
        inviteCode: code,
        inviteLink:
          round.inviteLink ||
          `${window.location.origin}/live-gd-round?invite=${code}`,
        topic: round.topic || "Impact of AI on Jobs",
        company: round.company || "General",
        joinedAt: new Date().toISOString()
      }

      localStorage.setItem("placiora_live_gd_last_room", JSON.stringify(savedRoom))
      setLastRoom(savedRoom)
    }
  }

  const loadMeetingFromCode = async (code) => {
    try {
      const cleanCode = String(code || "")
        .replace("/live-gd-round?invite=", "")
        .replace("invite=", "")
        .trim()
        .toUpperCase()

      if (!cleanCode || cleanCode === "UNDEFINED" || cleanCode === "NULL") {
        throw new Error("Valid meeting code is required")
      }

      const res = await fetch(
        `${API_URL}/meeting/${encodeURIComponent(cleanCode)}`
      )
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || "GD meeting not found")
      }

      applyRoundData(data.round)
      return data.round
    } catch (error) {
      setError(error.message)
      return null
    }
  }


  const addRemoteStream = (socketId, stream, userInfo = {}) => {
    remoteStreamsRef.current[socketId] = {
      socketId,
      stream,
      name: userInfo.name || "Participant",
      email: userInfo.email || "",
      micOn: userInfo.micOn !== false,
      cameraOn: userInfo.cameraOn !== false,
      micLevel: 35
    }

    setRemoteStreams(Object.values(remoteStreamsRef.current))
  }

  const removeRemoteStream = (socketId) => {
    delete remoteStreamsRef.current[socketId]
    setRemoteStreams(Object.values(remoteStreamsRef.current))

    if (peerConnectionsRef.current[socketId]) {
      peerConnectionsRef.current[socketId].close()
      delete peerConnectionsRef.current[socketId]
    }
  }

  const createPeerConnection = (targetSocketId, userInfo = {}) => {
    if (!targetSocketId || !socketRef.current) return null

    if (peerConnectionsRef.current[targetSocketId]) {
      return peerConnectionsRef.current[targetSocketId]
    }

    const peer = new RTCPeerConnection(RTC_CONFIG)

    peer.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("live-gd-webrtc-ice-candidate", {
          roomId: roundIdRef.current,
          to: targetSocketId,
          candidate: event.candidate
        })
      }
    }

    peer.ontrack = (event) => {
      const [stream] = event.streams
      if (stream) addRemoteStream(targetSocketId, stream, userInfo)
    }

    if (previewStreamRef.current) {
      previewStreamRef.current.getTracks().forEach((track) => {
        peer.addTrack(track, previewStreamRef.current)
      })
    }

    peerConnectionsRef.current[targetSocketId] = peer
    return peer
  }

  const callPeer = async (targetSocketId, userInfo = {}) => {
    if (!targetSocketId || targetSocketId === socketRef.current?.id) return

    try {
      const peer = createPeerConnection(targetSocketId, userInfo)
      if (!peer) return

      const offer = await peer.createOffer()
      await peer.setLocalDescription(offer)

      socketRef.current?.emit("live-gd-webrtc-offer", {
        roomId: roundIdRef.current,
        to: targetSocketId,
        offer
      })
    } catch (err) {
      console.log("WebRTC offer error:", err)
    }
  }

  const callExistingUsers = (users = []) => {
    users.forEach((item) => {
      if (
        item.socketId &&
        item.socketId !== socketRef.current?.id &&
        item.status === "approved"
      ) {
        callPeer(item.socketId, item)
      }
    })
  }

  const registerSocketListeners = () => {
    if (!socketRef.current) return

    const socket = socketRef.current

    socket.off("live-gd-users-updated")
    socket.off("live-gd-new-message")
    socket.off("live-gd-system-message")
    socket.off("live-gd-ended")
    socket.off("live-gd-started")
    socket.off("live-gd-room-full")
    socket.off("live-gd-room-state")
    socket.off("live-gd-pending-updated")
    socket.off("live-gd-join-request")
    socket.off("live-gd-waiting-room")
    socket.off("live-gd-admitted")
    socket.off("live-gd-rejected")
    socket.off("live-gd-host-transferred")
    socket.off("live-gd-error")
    socket.off("live-gd-existing-users")
    socket.off("live-gd-user-joined")
    socket.off("live-gd-user-left")
    socket.off("live-gd-device-state")
    socket.off("live-gd-webrtc-offer")
    socket.off("live-gd-webrtc-answer")
    socket.off("live-gd-webrtc-ice-candidate")

    socket.on("live-gd-users-updated", (users) => {
      const safeUsers = Array.isArray(users) ? users : []
      setParticipants(safeUsers)
      participantsRef.current = safeUsers
    })

    socket.on("live-gd-room-state", (state) => {
      setRoomState(state)
      const safeUsers = Array.isArray(state?.users) ? state.users : []
      setParticipants(safeUsers)
      participantsRef.current = safeUsers
      setPendingParticipants(Array.isArray(state?.pending) ? state.pending : [])
    })

    socket.on("live-gd-pending-updated", (pending) => {
      setPendingParticipants(Array.isArray(pending) ? pending : [])
    })

    socket.on("live-gd-join-request", (request) => {
      setPendingParticipants((prev) => {
        const exists = prev.some(
          (item) =>
            item.socketId === request.socketId ||
            (request.email && item.email === request.email)
        )
        return exists ? prev : [...prev, request]
      })

      speakText(`${request.name || "A participant"} is waiting to join.`, "Moderator")
    })

    socket.on("live-gd-waiting-room", () => {
      setWaitingApproval(true)
      setRoomReady(false)
      setStarted(false)
    })

    socket.on("live-gd-admitted", async (payload = {}) => {
      const admittedRoomId = payload.roomId || roundIdRef.current
      setWaitingApproval(false)
      setRejected(false)
      setRoomReady(true)

      if (admittedRoomId) {
        try {
          const res = await fetch(`${API_URL}/room/${admittedRoomId}`)
          const data = await res.json()

          if (data.success && data.round) {
            applyRoundData(data.round)
            setStarted(data.round.meetingStatus === "live")
          }
        } catch {
          setStarted(false)
        }
      } else {
        setStarted(false)
      }

      setTimeout(() => {
        attachStreamToVideo()
        emitDeviceReady(admittedRoomId)
        callExistingUsers(payload.users || [])
      }, 900)
    })

    socket.on("live-gd-existing-users", (users = []) => {
      setTimeout(() => callExistingUsers(users), 700)
    })

    socket.on("live-gd-user-joined", (userItem) => {
      if (userItem?.socketId && userItem.socketId !== socket.id) {
        setTimeout(() => callPeer(userItem.socketId, userItem), 800)
      }
    })

    socket.on("live-gd-user-left", ({ socketId }) => {
      removeRemoteStream(socketId)
    })

    socket.on("live-gd-device-state", (payload = {}) => {
      const existing = remoteStreamsRef.current[payload.socketId]

      if (existing) {
        remoteStreamsRef.current[payload.socketId] = {
          ...existing,
          micOn: payload.micOn !== false,
          cameraOn: payload.cameraOn !== false
        }
        setRemoteStreams(Object.values(remoteStreamsRef.current))
      }

      setParticipants((prev) =>
        prev.map((p) =>
          p.socketId === payload.socketId
            ? {
                ...p,
                micOn: payload.micOn !== false,
                cameraOn: payload.cameraOn !== false,
                micReady: payload.micReady,
                cameraReady: payload.cameraReady
              }
            : p
        )
      )
    })

    socket.on("live-gd-webrtc-offer", async ({ from, offer }) => {
      try {
        const userInfo =
          participantsRef.current.find((item) => item.socketId === from) || {}

        const peer = createPeerConnection(from, userInfo)
        if (!peer) return

        await peer.setRemoteDescription(new RTCSessionDescription(offer))

        const answer = await peer.createAnswer()
        await peer.setLocalDescription(answer)

        socket.emit("live-gd-webrtc-answer", {
          roomId: roundIdRef.current,
          to: from,
          answer
        })
      } catch (err) {
        console.log("WebRTC offer receive error:", err)
      }
    })

    socket.on("live-gd-webrtc-answer", async ({ from, answer }) => {
      try {
        const peer = peerConnectionsRef.current[from]
        if (!peer) return
        await peer.setRemoteDescription(new RTCSessionDescription(answer))
      } catch (err) {
        console.log("WebRTC answer error:", err)
      }
    })

    socket.on("live-gd-webrtc-ice-candidate", async ({ from, candidate }) => {
      const peer = peerConnectionsRef.current[from]
      if (!peer || !candidate) return

      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (error) {
        console.log("ICE candidate error:", error)
      }
    })

    socket.on("live-gd-rejected", (payload) => {
      setRejected(true)
      setWaitingApproval(false)
      setRoomReady(false)
      setStarted(false)
      setError(payload?.message || "Host rejected your request.")
    })

    socket.on("live-gd-host-transferred", (payload) => {
      setIsHost(true)
      speakText(payload?.message || "You are now the meeting host.", "Moderator")
    })

    socket.on("live-gd-new-message", (messageData) => {
      setMessages((prev) => {
        const exists = prev.some(
          (item) =>
            item.message === messageData.message &&
            item.name === messageData.name &&
            item.role === messageData.role
        )

        return exists ? prev : [...prev, messageData]
      })

      if (messageData?.speaker === "ai" && started) {
        speakText(
          `${messageData.name || "AI"} says. ${messageData.message}`,
          messageData.name || "AI"
        )
      }
    })

    socket.on("live-gd-system-message", (messageData) => {
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

    socket.on("live-gd-started", () => {
      setStarted(true)
      setTimeout(attachStreamToVideo, 300)
      speakText("The live group discussion has started.", "Moderator")
    })

    socket.on("live-gd-ended", () => {
      setStarted(false)
    })

    socket.on("live-gd-room-full", (payload) => {
      setError(payload?.message || "This GD room is full.")
    })

    socket.on("live-gd-error", (payload) => {
      setError(payload?.message || "Live GD socket error.")
    })
  }

  const connectSocket = (room, hostStatus = false) => {
    if (!room) return

    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        withCredentials: true
      })
    }

    registerSocketListeners()

    if (hostStatus) {
      socketRef.current.emit("live-gd-host-join", {
        roomId: room,
        userId,
        name: userName,
        email: userEmail,
        role: "Host"
      })
    } else {
      socketRef.current.emit("live-gd-request-join", {
        roomId: room,
        userId,
        name: userName,
        email: userEmail,
        role: "Participant"
      })
    }
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
      setMicOn(true)
      setCameraOn(true)

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

      const savedRoom = localStorage.getItem("placiora_live_gd_last_room")
      if (savedRoom) {
        try {
          setLastRoom(JSON.parse(savedRoom))
        } catch {
          localStorage.removeItem("placiora_live_gd_last_room")
        }
      }

      const params = new URLSearchParams(window.location.search)
      const code = params.get("invite")

      if (code && code !== "undefined" && code !== "null") {
        const cleanCode = code.trim().toUpperCase()
        setInviteInput(cleanCode)
        setMeetingCode(cleanCode)
        setInviteCode(cleanCode)
        setHasInviteFromUrl(true)
        await loadMeetingFromCode(cleanCode)
      }
    }

    initializePage()

    return () => {
      stopStreams()
      closeAllPeers()
      socketRef.current?.disconnect()
      window.speechSynthesis?.cancel()
    }
  }, [])

  useEffect(() => {
    attachStreamToVideo()
  }, [roomReady, started, cameraOn])

  useEffect(() => {
    if (!isHost || !roundId || !roomReady) return

      const interval = setInterval(async () => {
    try {
      const res = await fetch(`${API_URL}/room/${roundId}`)
      const data = await res.json()

      if (data.success && data.round) {
        setPendingParticipants(data.round.pendingParticipants || [])
        setParticipants(data.round.participants || [])
        participantsRef.current = data.round.participants || []
        setAiParticipants(data.round.aiParticipants || [])
      }
    } catch (pollError) {
      console.log("Live GD waiting room sync failed:", pollError)
    }
  }, 2500)

  return () => clearInterval(interval)
}, [isHost, roundId, roomReady])

useEffect(() => {
  if (!waitingApproval || !roundId || isHost) return

  const interval = setInterval(async () => {
    try {
      const res = await fetch(`${API_URL}/room/${roundId}`)
      const data = await res.json()

      if (data.success && data.round) {
        const approved = (data.round.participants || []).some((p) => {
          if (userId && p.userId) return String(p.userId) === String(userId)
          return userEmail && p.email === userEmail
        })

        if (approved) {
          applyRoundData(data.round)
          setWaitingApproval(false)
          setRejected(false)
          setRoomReady(true)
          setStarted(data.round.meetingStatus === "live")

          setTimeout(() => {
            attachStreamToVideo()
            emitDeviceReady(data.round._id)
          }, 400)
        }
      }
    } catch (syncError) {
      console.log("Waiting approval sync failed:", syncError)
    }
  }, 2000)

  return () => clearInterval(interval)
}, [waitingApproval, roundId, isHost, userId, userEmail])

const rejoinLastRoom = async () => {
  if (!deviceReady) {
    setError("Please test your camera and microphone before rejoining.")
    return
  }

  try {
    setLoading(true)
    setError("")
    setResult(null)
    setLiveEvaluation(null)

    const saved = JSON.parse(
      localStorage.getItem("placiora_live_gd_last_room") || "{}"
    )

    const code = saved.meetingCode || saved.inviteCode

    if (!code) {
      throw new Error("No previous GD meeting found.")
    }

    const meeting = await loadMeetingFromCode(code)

    if (!meeting?._id) {
      throw new Error("Previous meeting was not found or has ended.")
    }

    const res = await fetch(`${API_URL}/rejoin-room`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        roundId: meeting._id,
        inviteCode: code,
        userId,
        name: userName,
        email: userEmail
      })
    })

    const data = await res.json()

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Could not rejoin meeting.")
    }

    const round = data.round || meeting

    applyRoundData(round)
    setIsHost(Boolean(data.isHost))
    setWaitingApproval(false)
    setRejected(false)
    setRoomReady(true)
    setStarted(round.meetingStatus === "live")

    connectSocket(round._id, Boolean(data.isHost))

    setTimeout(() => {
      attachStreamToVideo()
      emitDeviceReady(round._id)
    }, 700)
  } catch (err) {
    setError(err.message || "Failed to rejoin meeting.")
  } finally {
    setLoading(false)
  }
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
      setWaitingApproval(false)
      setRejected(false)

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
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Room creation failed")
      }

      const room = data.round || {}
      const newRoundId = data.roundId || room._id || room.id

      const code =
        data.meetingCode ||
        data.inviteCode ||
        room.meetingCode ||
        room.inviteCode ||
        ""

      if (!newRoundId || !code) {
        throw new Error("Meeting code was not generated by backend.")
      }

      const link =
        data.inviteLink ||
        room.inviteLink ||
        `${window.location.origin}/live-gd-round?invite=${code}`

      const finalRoom = {
        ...room,
        _id: newRoundId,
        meetingCode: code,
        inviteCode: code,
        inviteLink: link
      }

      applyRoundData(finalRoom)

      setRoomReady(true)
      setStarted(false)
      setIsHost(true)

      connectSocket(newRoundId, true)

      setTimeout(() => {
        attachStreamToVideo()

        socketRef.current?.emit("live-gd-device-ready", {
          roomId: newRoundId,
          micReady: true,
          cameraReady: true,
          micOn,
          cameraOn
        })
      }, 500)

      // Opening messages stay visible. AI voice starts only after Start GD.
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
      setRejected(false)

      const urlCode = new URLSearchParams(window.location.search).get("invite")
      const cleanCode = String(inviteInput || urlCode || "")
        .replace("/live-gd-round?invite=", "")
        .replace("invite=", "")
        .trim()
        .toUpperCase()

      if (!cleanCode || cleanCode === "UNDEFINED" || cleanCode === "NULL") {
        throw new Error("Valid meeting code is required")
      }

      const meeting = await loadMeetingFromCode(cleanCode)

      if (!meeting?._id) {
        throw new Error("GD meeting not found")
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

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to join GD meeting")
      }

      const room = data.round || meeting

      if (!room?._id) {
        throw new Error("Meeting found but room ID missing")
      }

      applyRoundData(room)
      setIsHost(false)

      connectSocket(room._id, false)

      if (data.waiting) {
        setWaitingApproval(true)
        setRoomReady(false)
        setStarted(false)
        speakText(
          "Your request has been sent. Waiting for host approval.",
          "Moderator"
        )
        return
      }

      setWaitingApproval(false)
      setRoomReady(true)
      setStarted(room.meetingStatus === "live")

      setTimeout(() => {
        attachStreamToVideo()

        socketRef.current?.emit("live-gd-device-ready", {
          roomId: room._id,
          micReady: true,
          cameraReady: true,
          micOn,
          cameraOn
        })
      }, 500)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const admitParticipant = async (participant) => {
    if (!isHost || !roundId) return

    try {
      setError("")

      const res = await fetch(`${API_URL}/admit-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          roundId,
          userId: participant.userId || "",
          email: participant.email || ""
        })
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.message || "Admit failed")
      }

      applyRoundData(data.round)

      socketRef.current?.emit("live-gd-admit-user", {
        roomId: roundId,
        socketId: participant.socketId || "",
        userId: participant.userId || "",
        email: participant.email || ""
      })
    } catch (err) {
      setError(err.message)
    }
  }

  const rejectParticipant = async (participant) => {
    if (!isHost || !roundId) return

    try {
      setError("")

      const res = await fetch(`${API_URL}/reject-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          roundId,
          userId: participant.userId || "",
          email: participant.email || ""
        })
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.message || "Reject failed")
      }

      applyRoundData(data.round)

      socketRef.current?.emit("live-gd-reject-user", {
        roomId: roundId,
        socketId: participant.socketId || "",
        userId: participant.userId || "",
        email: participant.email || ""
      })
    } catch (err) {
      setError(err.message)
    }
  }

  const copyInviteLink = async () => {
    const code = meetingCode || inviteCode

    if (!code) {
      setError("Meeting code not generated. Create a new meeting.")
      return
    }

    const linkToCopy =
      inviteLink || `${window.location.origin}/live-gd-round?invite=${code}`

    try {
      await navigator.clipboard.writeText(linkToCopy)
      speakText("Meeting link copied.", "Moderator")
    } catch {
      setError("Could not copy meeting link.")
    }
  }

  const copyMeetingCode = async () => {
    const code = meetingCode || inviteCode

    if (!code) {
      setError("Meeting code not generated. Create a new meeting.")
      return
    }

    try {
      await navigator.clipboard.writeText(code)
      speakText("Meeting code copied.", "Moderator")
    } catch {
      setError("Could not copy meeting code.")
    }
  }


  const toggleMic = () => {
    const next = !micOn
    setMicOn(next)

    previewStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = next
    })

    socketRef.current?.emit("live-gd-device-ready", {
      roomId: roundId,
      micReady: true,
      cameraReady: true,
      micOn: next,
      cameraOn
    })
  }

  const toggleCamera = () => {
    const next = !cameraOn
    setCameraOn(next)

    previewStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = next
    })

    socketRef.current?.emit("live-gd-device-ready", {
      roomId: roundId,
      micReady: true,
      cameraReady: true,
      micOn,
      cameraOn: next
    })
  }

  const startRecording = async () => {
    if (!started) {
      setError("GD has not started yet. Please wait for the host to click Start GD.")
      return
    }

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
          recordingStreamRef.current
            ?.getTracks()
            .forEach((track) => track.stop())
          recordingStreamRef.current = null
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
    if (!started) {
      setError("GD has not started yet. Please wait for the host to click Start GD.")
      return
    }

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

      if (data.aiParticipants) {
        setAiParticipants(data.aiParticipants)
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

  const startMeeting = async () => {
    if (!roundId) {
      setError("Room ID missing.")
      return
    }

    try {
      setLoading(true)
      setError("")

      const res = await fetch(`${API_URL}/start-room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ roundId })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to start GD")
      }

      applyRoundData(data.round)
      setRoomReady(true)
      setStarted(true)

      socketRef.current?.emit("live-gd-started", {
        roomId: roundId
      })

      speakText("The live group discussion has started.", "Moderator")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }


  const uploadMeetingRecording = async (blob) => {
    if (!roundId || !blob || blob.size === 0) return ""

    const formData = new FormData()
    formData.append("video", blob, `live-gd-${roundId}.webm`)
    formData.append("roundId", roundId)

    const res = await fetch(`${API_URL}/upload-recording`, {
      method: "POST",
      body: formData
    })

    const data = await res.json()

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Recording upload failed")
    }

    setRecordingUrl(data.recordingUrl || "")
    return data.recordingUrl || ""
  }

  const startMeetingRecording = async () => {
    if (!started) {
      setError("Start GD first, then recording will capture the live session.")
      return
    }

    try {
      setError("")
      meetingRecordingChunksRef.current = []

      let stream

      if (navigator.mediaDevices?.getDisplayMedia) {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "browser",
            frameRate: 30
          },
          audio: true
        })
      } else if (previewStreamRef.current) {
        stream = previewStreamRef.current
      } else {
        throw new Error("Recording is not supported in this browser.")
      }

      meetingRecordingStreamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm"

      const recorder = new MediaRecorder(stream, { mimeType })
      meetingRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          meetingRecordingChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        try {
          const blob = new Blob(meetingRecordingChunksRef.current, {
            type: mimeType
          })

          if (blob.size > 0) {
            const localUrl = URL.createObjectURL(blob)
            setRecordingUrl(localUrl)
            await uploadMeetingRecording(blob)
          }
        } catch (err) {
          setError(err.message)
        } finally {
          setMeetingRecording(false)
          meetingRecordingStreamRef.current
            ?.getTracks()
            .forEach((track) => track.stop())
          meetingRecordingStreamRef.current = null
        }
      }

      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        stopMeetingRecording()
      })

      recorder.start(1000)
      setMeetingRecording(true)
    } catch (err) {
      setMeetingRecording(false)
      setError(err.message || "Could not start meeting recording.")
    }
  }

  const stopMeetingRecording = () => {
    if (
      meetingRecorderRef.current &&
      meetingRecorderRef.current.state !== "inactive"
    ) {
      meetingRecorderRef.current.stop()
    }

    setMeetingRecording(false)
  }

  const finishGD = async () => {
    if (meetingRecording) {
      stopMeetingRecording()
    }

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
    closeAllPeers()
    socketRef.current?.disconnect()
    socketRef.current = null

    setRoundId("")
    setInviteCode("")
    setMeetingCode("")
    setInviteLink("")
    setInviteInput("")
    setMessages([])
    setParticipants([])
    setPendingParticipants([])
    setAiParticipants([])
    setRoomState(null)
    setWaitingApproval(false)
    setRejected(false)
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
    setMicOn(true)
    setCameraOn(true)
  }


  if (roomReady && !result) {
    return (
      <MeetRoom
        userName={userName}
        isHost={isHost}
        started={started}
        loading={loading}
        finishGD={finishGD}
        resetGD={resetGD}
        videoRef={videoRef}
        remoteStreams={remoteStreams}
        micOn={micOn}
        cameraOn={cameraOn}
        micLevel={micLevel}
        toggleMic={toggleMic}
        toggleCamera={toggleCamera}
        meetingCode={meetingCode || inviteCode}
        inviteLink={inviteLink}
        participants={participants}
        aiParticipants={aiParticipants}
        pendingParticipants={pendingParticipants}
        admitParticipant={admitParticipant}
        rejectParticipant={rejectParticipant}
        startMeeting={startMeeting}
        copyInviteLink={copyInviteLink}
        copyMeetingCode={copyMeetingCode}
        messages={messages}
        userNameForChat={userName}
        userMessage={userMessage}
        setUserMessage={setUserMessage}
        recording={recording}
        transcribing={transcribing}
        startRecording={startRecording}
        stopRecording={stopRecording}
        sendMessage={sendMessage}
        liveEvaluation={liveEvaluation}
        meetingRecording={meetingRecording}
        recordingUrl={recordingUrl}
        startMeetingRecording={startMeetingRecording}
        stopMeetingRecording={stopMeetingRecording}
      />
    )
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
                  Google Meet Style GD + AI Moderator
                </span>
              </div>

              <h1 className="text-4xl lg:text-5xl font-black text-white text-glow">
                Multiplayer Live Group Discussion
              </h1>

              <p className="text-slate-400 mt-3 leading-7 max-w-4xl">
                Create a GD meeting link, admit participants from the waiting
                room, practice with up to 5 human members, and let AI candidates
                fill empty seats automatically.
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        {waitingApproval && (
          <WaitingRoom
            meetingCode={meetingCode || inviteCode}
            topic={topic}
            company={company}
            resetGD={resetGD}
          />
        )}

        {!roomReady && !result && !waitingApproval && (
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


            {lastRoom && !hasInviteFromUrl && !rejected && (
              <section
                onMouseMove={handleMouseMove}
                className="glow-card rounded-[2.3rem] p-6 border border-emerald-400/20 bg-emerald-500/10"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 text-emerald-300 mb-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-xs font-semibold">
                      <Clock size={14} />
                      Saved Session
                    </div>

                    <h2 className="text-2xl font-bold text-white">
                      Rejoin Previous GD Meeting
                    </h2>

                    <p className="text-slate-400 mt-1">
                      {lastRoom.topic} · Code:{" "}
                      <span className="text-emerald-300 font-bold">
                        {lastRoom.meetingCode}
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={rejoinLastRoom}
                    disabled={loading || !deviceReady}
                    className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-8 py-4 font-semibold text-white disabled:opacity-50"
                  >
                    {loading ? "Rejoining..." : "Rejoin Meeting"}
                  </button>
                </div>
              </section>
            )}

            {!hasInviteFromUrl && !rejected && (
              <section
                onMouseMove={handleMouseMove}
                className="glow-card rounded-[2.3rem] p-6 border border-cyan-400/10 hover:border-cyan-300/30"
              >
                <h2 className="text-2xl font-bold text-white mb-5">
                  Host Setup: Create GD Meeting
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
                      ? "Creating..."
                      : deviceReady
                      ? "Create Meeting"
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
                  placeholder="Enter meeting code"
                  className="rounded-2xl bg-slate-900/80 border border-white/10 px-4 py-4 outline-none uppercase text-white focus:border-cyan-400"
                />

                <button
                  type="button"
                  onClick={joinRoom}
                  disabled={loading || !deviceReady}
                  className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-8 py-4 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 text-white"
                >
                  <UserPlus size={18} />
                  {deviceReady ? "Request To Join" : "Test Devices First"}
                </button>
              </div>
            </section>
          </>
        )}

        {roomReady && (
          <>
            <MeetingInfoPanel
              isHost={isHost}
              inviteCode={inviteCode}
              meetingCode={meetingCode}
              inviteLink={inviteLink}
              humanCount={humanCount}
              maxMembers={maxMembers}
              aiCount={aiCount}
              aiParticipants={aiParticipants}
              pendingParticipants={pendingParticipants}
              copyInviteLink={copyInviteLink}
              copyMeetingCode={copyMeetingCode}
              admitParticipant={admitParticipant}
              rejectParticipant={rejectParticipant}
              startMeeting={startMeeting}
              loading={loading}
              onMouseMove={handleMouseMove}
            />

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

                  {isHost && started && (
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

                  {aiParticipants.map((ai, index) => (
                    <AIParticipantCard key={`${ai.name}-${index}`} ai={ai} />
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
                      Human participants + AI Moderator + dynamic AI candidates.
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
                            : msg.speaker === "system"
                            ? "bg-slate-500/10 border-slate-400/20"
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
                    disabled={loading || transcribing || !started}
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
                    disabled={loading || transcribing || !started || !userMessage.trim()}
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

function MeetingInfoPanel({
  isHost,
  inviteCode,
  meetingCode,
  inviteLink,
  humanCount,
  maxMembers,
  aiCount,
  aiParticipants,
  pendingParticipants,
  copyInviteLink,
  copyMeetingCode,
  admitParticipant,
  rejectParticipant,
  startMeeting,
  loading,
  onMouseMove
}) {
  return (
    <section
      onMouseMove={onMouseMove}
      className="glow-card rounded-[2.3rem] p-6 border border-cyan-400/10 hover:border-cyan-300/30"
    >
      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">
            GD Meeting Room
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">
              <p className="text-slate-400 text-sm flex items-center gap-2">
                <KeyRound size={16} />
                Meeting Code
              </p>
              <h3 className="text-3xl font-black text-cyan-300 mt-1">
                {meetingCode || inviteCode || "------"}
              </h3>
            </div>

            <div className="rounded-2xl border border-purple-400/20 bg-purple-500/10 p-4">
              <p className="text-slate-400 text-sm flex items-center gap-2">
                <Users size={16} />
                Seats
              </p>
              <h3 className="text-3xl font-black text-white mt-1">
                {humanCount}/{maxMembers}
              </h3>
              <p className="text-purple-200 text-sm mt-1">
                AI filling empty seats: {aiCount}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={copyInviteLink}
              className="rounded-2xl bg-white/10 hover:bg-white/15 px-5 py-3 font-semibold flex items-center gap-2 text-white"
            >
              <Link2 size={18} />
              Copy Meeting Link
            </button>

            <button
              type="button"
              onClick={copyMeetingCode}
              className="rounded-2xl bg-white/10 hover:bg-white/15 px-5 py-3 font-semibold flex items-center gap-2 text-white"
            >
              <Clipboard size={18} />
              Copy Meeting Code
            </button>

            {isHost && (
              <button
                type="button"
                onClick={startMeeting}
                disabled={loading}
                className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-700 px-5 py-3 font-semibold flex items-center gap-2 text-white disabled:opacity-50"
              >
                <Sparkles size={18} />
                Start GD
              </button>
            )}
          </div>

          {inviteLink && (
            <p className="text-slate-500 text-xs mt-3 break-all">
              {inviteLink}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {aiParticipants.map((ai, index) => (
              <span
                key={`${ai.name}-${index}`}
                className="rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-sm text-purple-200 flex items-center gap-2"
              >
                <Bot size={14} />
                {ai.name}
              </span>
            ))}
          </div>
        </div>

        {isHost && (
          <div className="rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-4">
            <h3 className="text-xl font-bold text-white mb-3">
              Waiting Room
            </h3>

            {pendingParticipants.length === 0 ? (
              <p className="text-slate-400 flex items-center gap-2">
                <Clock size={16} />
                No pending requests.
              </p>
            ) : (
              <div className="space-y-3">
                {pendingParticipants.map((item, index) => (
                  <div
                    key={item.socketId || item.email || index}
                    className="rounded-xl border border-white/10 bg-slate-950/60 p-3"
                  >
                    <p className="font-semibold text-white">
                      {item.name || "Participant"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {item.email || "No email"}
                    </p>

                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => admitParticipant(item)}
                        className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2 text-white font-semibold flex items-center justify-center gap-2"
                      >
                        <UserCheck size={16} />
                        Admit
                      </button>

                      <button
                        type="button"
                        onClick={() => rejectParticipant(item)}
                        className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 py-2 text-white font-semibold flex items-center justify-center gap-2"
                      >
                        <UserX size={16} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}


function MeetRoom({
  userName,
  isHost,
  started,
  loading,
  finishGD,
  resetGD,
  videoRef,
  remoteStreams,
  micOn,
  cameraOn,
  micLevel,
  toggleMic,
  toggleCamera,
  meetingCode,
  inviteLink,
  participants,
  aiParticipants,
  pendingParticipants,
  admitParticipant,
  rejectParticipant,
  startMeeting,
  copyInviteLink,
  copyMeetingCode,
  messages,
  userNameForChat,
  userMessage,
  setUserMessage,
  recording,
  transcribing,
  startRecording,
  stopRecording,
  sendMessage,
  liveEvaluation,
  meetingRecording,
  recordingUrl,
  startMeetingRecording,
  stopMeetingRecording
}) {
  const [sidePanel, setSidePanel] = useState("chat")

  const totalTiles = remoteStreams.length + 1
  const gridClass =
    totalTiles <= 1
      ? "grid-cols-1"
      : totalTiles === 2
      ? "grid-cols-1 md:grid-cols-2"
      : totalTiles <= 4
      ? "grid-cols-1 sm:grid-cols-2"
      : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"

  const startedText = started ? "GD Live" : "Waiting for host to start"
  const startedClass = started ? "text-emerald-300" : "text-yellow-300"

  return (
    <div className="fixed inset-0 z-[9999] bg-[#020617] text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(34,211,238,0.20),transparent_34%),radial-gradient(circle_at_88%_90%,rgba(147,51,234,0.22),transparent_34%)]" />

      <div className="relative h-16 px-3 sm:px-5 flex items-center justify-between border-b border-cyan-400/10 bg-slate-950/85 backdrop-blur-xl">
        <div className="min-w-0">
          <p className="font-black text-base sm:text-lg bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent truncate">
            Placiora Live GD
          </p>
          <p className="text-[11px] sm:text-xs text-slate-400 truncate">
            Code: {meetingCode || "------"} ·{" "}
            <span className={startedClass}>{startedText}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyInviteLink}
            className="hidden md:block px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-sm"
          >
            Copy Link
          </button>

          <button
            type="button"
            onClick={copyMeetingCode}
            className="hidden md:block px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-sm"
          >
            Copy Code
          </button>

          {started && (
            <button
              type="button"
              onClick={meetingRecording ? stopMeetingRecording : startMeetingRecording}
              className={`hidden md:block px-4 py-2 rounded-full text-sm font-semibold ${
                meetingRecording
                  ? "bg-red-500/80 hover:bg-red-600"
                  : "bg-emerald-500/80 hover:bg-emerald-600"
              }`}
            >
              {meetingRecording ? "Stop Recording" : "Record"}
            </button>
          )}

          {recordingUrl && (
            <a
              href={recordingUrl}
              download
              className="hidden md:block px-4 py-2 rounded-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-sm font-semibold"
            >
              Download Video
            </a>
          )}

          {isHost && (
            <button
              type="button"
              onClick={startMeeting}
              disabled={loading || started}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-sm font-semibold disabled:opacity-50"
            >
              {started ? "Started" : "Start GD"}
            </button>
          )}
        </div>
      </div>

      <div className="relative h-[calc(100vh-144px)] grid grid-cols-1 xl:grid-cols-[1fr_400px]">
        <main className="p-2 sm:p-4 overflow-hidden">
          <div className={`grid ${gridClass} gap-3 sm:gap-4 h-full`}>
            <MeetVideoTile
              name={`${userName}${isHost ? " (Host)" : ""}`}
              streamRef={videoRef}
              muted
              micOn={micOn}
              cameraOn={cameraOn}
              micLevel={micLevel}
              isLocal
              isHost={isHost}
            />

            {remoteStreams.map((remote) => (
              <RemoteMeetVideoTile key={remote.socketId} remote={remote} />
            ))}

            {remoteStreams.length === 0 && (
              <div className="rounded-3xl border border-cyan-400/10 bg-slate-900/70 backdrop-blur-xl flex items-center justify-center text-center p-6 sm:p-8">
                <div>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                    <Users size={34} className="text-cyan-300" />
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-white">
                    Waiting for admitted participants
                  </h3>

                  <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                    Every admitted participant gets this same room, video grid,
                    speech transcription, chat, AI replies and people panel.
                  </p>

                  <p className="text-xs text-cyan-300 mt-4 break-all">
                    {inviteLink}
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>

        <aside className="hidden xl:flex flex-col border-l border-cyan-400/10 bg-slate-950/80 backdrop-blur-xl min-h-0">
          <PanelTabs sidePanel={sidePanel} setSidePanel={setSidePanel} />

          {sidePanel === "chat" ? (
            <MeetChatPanel
              messages={messages}
              userName={userNameForChat}
              userMessage={userMessage}
              setUserMessage={setUserMessage}
              recording={recording}
              transcribing={transcribing}
              loading={loading}
              started={started}
              startRecording={startRecording}
              stopRecording={stopRecording}
              sendMessage={sendMessage}
            />
          ) : (
            <MeetPeoplePanel
              isHost={isHost}
              participants={participants}
              aiParticipants={aiParticipants}
              pendingParticipants={pendingParticipants}
              admitParticipant={admitParticipant}
              rejectParticipant={rejectParticipant}
              started={started}
            />
          )}
        </aside>
      </div>

      {!started && (
        <div className="hidden md:block absolute left-5 bottom-24 rounded-2xl bg-yellow-500/10 backdrop-blur-xl border border-yellow-400/20 p-4 max-w-xl">
          <p className="text-yellow-300 font-bold text-sm">
            Waiting for GD Start
          </p>
          <p className="text-xs text-slate-200 mt-1 leading-6">
            AI voice, participant scoring and transcription submission activate
            only after the host clicks Start GD.
          </p>
        </div>
      )}

      {liveEvaluation && started && (
        <div className="hidden md:block absolute left-5 bottom-24 rounded-2xl bg-emerald-500/10 backdrop-blur-xl border border-emerald-400/20 p-4 max-w-xl shadow-[0_0_50px_rgba(16,185,129,0.12)]">
          <p className="text-emerald-300 font-bold text-sm">
            Live Recruiter Feedback
          </p>
          <p className="text-xs text-slate-200 mt-1 leading-6">
            {liveEvaluation.feedback ||
              "Good participation. Add examples and respond to others."}
          </p>
        </div>
      )}

      <div className="relative h-20 px-3 flex items-center justify-center gap-3 sm:gap-4 border-t border-cyan-400/10 bg-slate-950/90 backdrop-blur-xl">
        <button
          type="button"
          onClick={toggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
            micOn ? "bg-white/10 hover:bg-white/15" : "bg-red-600"
          }`}
        >
          {micOn ? <Mic size={22} /> : <MicOff size={22} />}
        </button>

        <button
          type="button"
          onClick={toggleCamera}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
            cameraOn ? "bg-white/10 hover:bg-white/15" : "bg-red-600"
          }`}
        >
          {cameraOn ? <Video size={22} /> : <VideoOff size={22} />}
        </button>

        <button
          type="button"
          onClick={() => setSidePanel(sidePanel === "chat" ? "people" : "chat")}
          className="xl:hidden w-12 h-12 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center"
        >
          {sidePanel === "chat" ? <Users size={22} /> : <MessageCircle size={22} />}
        </button>

        {started && (
          <button
            type="button"
            onClick={meetingRecording ? stopMeetingRecording : startMeetingRecording}
            className={`hidden sm:flex px-4 h-12 rounded-full font-bold items-center gap-2 ${
              meetingRecording ? "bg-red-600" : "bg-emerald-600"
            }`}
          >
            {meetingRecording ? "Stop Rec" : "Record"}
          </button>
        )}

        {recordingUrl && (
          <a
            href={recordingUrl}
            download
            className="hidden sm:flex px-4 h-12 rounded-full bg-purple-600 hover:bg-purple-700 font-bold items-center gap-2"
          >
            <Download size={18} />
            Video
          </a>
        )}

        {isHost && (
          <button
            type="button"
            onClick={finishGD}
            disabled={loading || !started}
            className="px-4 sm:px-6 h-12 rounded-full bg-gradient-to-r from-red-500 to-rose-700 font-bold disabled:opacity-50"
          >
            End
          </button>
        )}

        <button
          type="button"
          onClick={resetGD}
          className="w-12 h-12 rounded-full bg-red-700 hover:bg-red-800 flex items-center justify-center"
        >
          <PhoneOff size={22} />
        </button>
      </div>

      <div className="xl:hidden absolute right-3 top-20 bottom-24 w-[min(430px,calc(100vw-24px))] rounded-3xl border border-cyan-400/10 bg-slate-950/95 backdrop-blur-xl overflow-hidden shadow-2xl">
        <PanelTabs sidePanel={sidePanel} setSidePanel={setSidePanel} />

        {sidePanel === "chat" ? (
          <MeetChatPanel
            messages={messages}
            userName={userNameForChat}
            userMessage={userMessage}
            setUserMessage={setUserMessage}
            recording={recording}
            transcribing={transcribing}
            loading={loading}
            started={started}
            startRecording={startRecording}
            stopRecording={stopRecording}
            sendMessage={sendMessage}
          />
        ) : (
          <MeetPeoplePanel
            isHost={isHost}
            participants={participants}
            aiParticipants={aiParticipants}
            pendingParticipants={pendingParticipants}
            admitParticipant={admitParticipant}
            rejectParticipant={rejectParticipant}
            started={started}
          />
        )}
      </div>
    </div>
  )
}

function PanelTabs({ sidePanel, setSidePanel }) {
  return (
    <div className="grid grid-cols-2 border-b border-white/10">
      <button
        type="button"
        onClick={() => setSidePanel("chat")}
        className={`py-3 sm:py-4 text-sm font-semibold ${
          sidePanel === "chat"
            ? "bg-cyan-500/10 text-cyan-300"
            : "text-slate-400"
        }`}
      >
        Discussion
      </button>

      <button
        type="button"
        onClick={() => setSidePanel("people")}
        className={`py-3 sm:py-4 text-sm font-semibold ${
          sidePanel === "people"
            ? "bg-purple-500/10 text-purple-300"
            : "text-slate-400"
        }`}
      >
        People
      </button>
    </div>
  )
}

function MeetVideoTile({
  name,
  streamRef,
  muted = false,
  micOn = true,
  cameraOn = true,
  micLevel = 0,
  isLocal = false
}) {
  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-[#111] border border-black/40 shadow-lg ${
        micOn && micLevel > 15 ? "ring-4 ring-blue-500" : ""
      }`}
    >
      {cameraOn ? (
        <video
          ref={streamRef}
          autoPlay
          muted={muted}
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full min-h-[240px] flex items-center justify-center bg-[#2b2c2f]">
          <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center text-4xl font-bold">
            {name?.[0] || "U"}
          </div>
        </div>
      )}

      <div className="absolute left-3 bottom-3 bg-black/55 px-3 py-1.5 rounded text-sm">
        {name}
      </div>

      <div className="absolute right-3 top-3 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center">
        {micOn ? (
          <div
            className="rounded-full bg-blue-400 transition-all"
            style={{
              width: `${8 + Math.min(isLocal ? micLevel : 30, 40) / 2}px`,
              height: `${8 + Math.min(isLocal ? micLevel : 30, 40) / 2}px`
            }}
          />
        ) : (
          <MicOff size={18} />
        )}
      </div>
    </div>
  )
}

function RemoteMeetVideoTile({ remote }) {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current && remote.stream) {
      ref.current.srcObject = remote.stream
    }
  }, [remote.stream])

  return (
    <MeetVideoTile
      name={remote.name || "Participant"}
      streamRef={ref}
      muted={false}
      micOn={remote.micOn}
      cameraOn={remote.cameraOn}
      micLevel={remote.micLevel || 30}
    />
  )
}

function MeetChatPanel({
  messages,
  userName,
  userMessage,
  setUserMessage,
  recording,
  transcribing,
  loading,
  started,
  startRecording,
  stopRecording,
  sendMessage
}) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, index) => (
          <div
            key={`${msg.name || "message"}-${index}`}
            className={`rounded-xl p-3 border ${
              msg.name === userName
                ? "bg-cyan-500/20 border-cyan-400/30"
                : msg.speaker === "system"
                ? "bg-slate-500/10 border-slate-400/20"
                : "bg-purple-500/20 border-purple-400/30"
            }`}
          >
            <p className="font-semibold text-sm">
              {msg.name || "Participant"}{" "}
              <span className="text-slate-400">{msg.role || ""}</span>
            </p>
            <p className="text-sm text-slate-200 mt-1 leading-6">
              {msg.message}
            </p>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/10">
        <textarea
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          placeholder={started ? "Speak or type your GD point..." : "Waiting for host to start GD..."}
          className="w-full h-24 rounded-xl bg-[#202124] border border-white/10 p-3 text-sm outline-none resize-none"
        />

        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            disabled={loading || transcribing || !started}
            className={`flex-1 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 ${
              recording ? "bg-red-600" : "bg-emerald-600"
            } disabled:opacity-50`}
          >
            {recording ? <Square size={16} /> : <Mic size={16} />}
            {recording ? "Stop" : transcribing ? "Transcribing..." : started ? "Speak" : "Locked"}
          </button>

          <button
            type="button"
            onClick={sendMessage}
            disabled={loading || transcribing || !started || !userMessage.trim()}
            className="flex-1 rounded-xl py-3 text-sm font-semibold bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send size={16} />
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

function MeetPeoplePanel({
  isHost,
  participants,
  aiParticipants,
  pendingParticipants,
  admitParticipant,
  rejectParticipant
}) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-2">
          Participants
        </h3>

        <div className="space-y-2">
          {participants.map((p, index) => (
            <ParticipantCard
              key={p.socketId || p.email || index}
              participant={p}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-2">
          AI Participants
        </h3>

        <div className="space-y-2">
          {aiParticipants.map((ai, index) => (
            <AIParticipantCard key={`${ai.name}-${index}`} ai={ai} />
          ))}
        </div>
      </div>

      {isHost && (
        <div>
          <h3 className="text-sm font-semibold text-yellow-300 mb-2">
            Waiting Room
          </h3>

          {pendingParticipants.length === 0 ? (
            <p className="text-xs text-slate-400">No pending requests.</p>
          ) : (
            <div className="space-y-2">
              {pendingParticipants.map((item, index) => (
                <div
                  key={item.socketId || item.email || index}
                  className="rounded-xl border border-white/10 bg-slate-950/60 p-3"
                >
                  <p className="font-semibold text-white">
                    {item.name || "Participant"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {item.email || "No email"}
                  </p>

                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => admitParticipant(item)}
                      className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2 text-white font-semibold text-sm flex items-center justify-center gap-2"
                    >
                      <UserCheck size={15} />
                      Admit
                    </button>

                    <button
                      type="button"
                      onClick={() => rejectParticipant(item)}
                      className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 py-2 text-white font-semibold text-sm flex items-center justify-center gap-2"
                    >
                      <UserX size={15} />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}


function WaitingRoom({ meetingCode, topic, company, resetGD }) {
  return (
    <section className="glow-card rounded-[2.5rem] border border-yellow-400/20 bg-yellow-500/10 p-8 text-center">
      <Clock className="mx-auto text-yellow-300 mb-4" size={64} />

      <h2 className="text-3xl font-black text-white">
        Waiting for Host Approval
      </h2>

      <p className="text-slate-300 mt-3">
        Your request has been sent. The meeting host must admit you before you
        can enter.
      </p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <MiniInfo title="Meeting Code" value={meetingCode || "------"} />
        <MiniInfo title="Topic" value={topic} />
        <MiniInfo title="Company" value={company} />
      </div>

      <button
        type="button"
        onClick={resetGD}
        className="mt-7 rounded-2xl bg-white/10 hover:bg-white/20 px-8 py-4 font-semibold text-white"
      >
        Cancel Request
      </button>
    </section>
  )
}

function MiniInfo({ title, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <p className="text-slate-400 text-sm">{title}</p>
      <h3 className="text-white font-bold mt-1">{value}</h3>
    </div>
  )
}

function AIParticipantCard({ ai }) {
  return (
    <div className="rounded-xl bg-purple-500/10 border border-purple-400/20 p-3">
      <p className="font-semibold text-white flex items-center gap-2">
        <Bot size={16} className="text-purple-300" />
        {ai.name}
      </p>

      <p className="text-xs text-purple-200">{ai.role}</p>

      <p className="text-xs mt-2 text-slate-400">
        {ai.personality || "Balanced"} · Auto-filled AI Seat
      </p>
    </div>
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
      <p className="font-semibold text-white">
        {participant.name}{" "}
        {participant.isHost && (
          <span className="text-xs text-yellow-300 ml-1">(Host)</span>
        )}
      </p>

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

      {(result.recordingUrl || result.reportReady) && (
        <div className="rounded-[2rem] border border-purple-400/20 bg-purple-500/10 p-6 mb-8">
          <h3 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="text-purple-300" size={26} />
            Recording & Report
          </h3>

          <p className="text-slate-300 mt-2">
            Your Live GD report is saved in history. Download the meeting video
            if recording was enabled.
          </p>

          {result.recordingUrl && (
            <a
              href={result.recordingUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="inline-flex mt-4 rounded-2xl bg-purple-600 hover:bg-purple-700 px-5 py-3 font-semibold text-white items-center gap-2"
            >
              <Download size={18} />
              Download Recording
            </a>
          )}
        </div>
      )}

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