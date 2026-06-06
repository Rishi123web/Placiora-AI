// src/pages/LiveInterview.jsx

import { useEffect, useRef, useState } from "react"
import axios from "axios"
import MainLayout from "../layouts/MainLayout.jsx"

import {
  Mic,
  MicOff,
  Monitor,
  Brain,
  Send,
  CheckCircle,
  Sparkles,
  Clock,
  AlertCircle,
  RefreshCw,
  Upload,
  FileText,
  Building2
} from "lucide-react"

const API = "http://localhost:5000/api/live-interview"

const ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "React Developer",
  "Node.js Developer",
  "Java Developer",
  "Python Developer",
  "Software Engineer",
  "Web Developer",
  "Mobile App Developer",
  "Data Analyst",
  "Business Analyst",
  "Data Scientist",
  "Machine Learning Engineer",
  "AI Engineer",
  "Cloud Engineer",
  "DevOps Engineer",
  "Cyber Security Analyst",
  "QA Engineer",
  "UI UX Designer",
  "Product Manager",
  "Project Manager",
  "Operations Manager",
  "HR Executive",
  "Talent Acquisition Specialist",
  "Recruitment Consultant",
  "Digital Marketing Executive",
  "SEO Specialist",
  "Social Media Manager",
  "Content Writer",
  "Video Editor",
  "Graphic Designer",
  "Sales Executive",
  "Business Development Executive",
  "Customer Success Executive",
  "Financial Analyst",
  "Accountant",
  "Banking Associate",
  "Management Consultant",
  "Strategy Analyst",
  "Supply Chain Analyst",
  "Mechanical Engineer",
  "Electrical Engineer",
  "Civil Engineer",
  "Electronics Engineer",
  "Graduate Trainee",
  "Management Trainee",
  "Operations Executive",
  "General Placement Interview"
]

const COMPANIES = [
  "General",
  "Google",
  "Amazon",
  "Microsoft",
  "Meta",
  "Apple",
  "Adobe",
  "Uber",
  "Flipkart",
  "Meesho",
  "Razorpay",
  "PhonePe",
  "Paytm",
  "Swiggy",
  "Zomato",
  "TCS",
  "Infosys",
  "Wipro",
  "Accenture",
  "Cognizant",
  "Capgemini",
  "HCL",
  "Tech Mahindra",
  "Deloitte",
  "PwC",
  "EY",
  "KPMG",
  "Goldman Sachs",
  "JPMorgan",
  "American Express",
  "Startup Interview"
]

function LiveInterview() {
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const userId = user?._id || user?.id

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recorderRef = useRef(null)
  const recordedChunksRef = useRef([])
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const micAnimationRef = useRef(null)

  const [role, setRole] = useState("Frontend Developer")
  const [difficulty, setDifficulty] = useState("Beginner")
  const [company, setCompany] = useState("General")
  const [activeCompany, setActiveCompany] = useState("General")
  const [companyFocus, setCompanyFocus] = useState([])
  const [mode, setMode] = useState("normal")
  const [resumeFile, setResumeFile] = useState(null)

  const [availableVoices, setAvailableVoices] = useState([])
  const [selectedVoiceName, setSelectedVoiceName] = useState("")

  const [videoDevices, setVideoDevices] = useState([])
  const [audioDevices, setAudioDevices] = useState([])
  const [selectedCamera, setSelectedCamera] = useState("")
  const [selectedMic, setSelectedMic] = useState("")

  const [devicesLoaded, setDevicesLoaded] = useState(false)
  const [devicesTested, setDevicesTested] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [deviceError, setDeviceError] = useState("")

  const [micLevel, setMicLevel] = useState(0)
  const [micWorking, setMicWorking] = useState(false)

  const [sessionStarted, setSessionStarted] = useState(false)
  const [sessionId, setSessionId] = useState("")
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)

  const [transcript, setTranscript] = useState("")
  const [listening, setListening] = useState(false)
  const [transcribing, setTranscribing] = useState(false)

  const [feedback, setFeedback] = useState("")
  const [score, setScore] = useState(null)
  const [technicalScore, setTechnicalScore] = useState(0)
  const [communicationScore, setCommunicationScore] = useState(0)
  const [confidenceScore, setConfidenceScore] = useState(0)
  const [clarityScore, setClarityScore] = useState(0)
  const [problemSolvingScore, setProblemSolvingScore] = useState(0)
  const [strengths, setStrengths] = useState([])
  const [weaknesses, setWeaknesses] = useState([])
  const [improvedAnswer, setImprovedAnswer] = useState("")
  const [followUpQuestion, setFollowUpQuestion] = useState("")

  const [hiringProbability, setHiringProbability] = useState(0)
  const [technicalReadiness, setTechnicalReadiness] = useState(0)
  const [communicationReadiness, setCommunicationReadiness] = useState(0)
  const [confidenceReadiness, setConfidenceReadiness] = useState(0)
  const [clarityReadiness, setClarityReadiness] = useState(0)
  const [problemSolvingReadiness, setProblemSolvingReadiness] = useState(0)
  const [overallReadiness, setOverallReadiness] = useState(0)
  const [selectionLevel, setSelectionLevel] = useState("")
  const [recruiterVerdict, setRecruiterVerdict] = useState("")
  const [blockers, setBlockers] = useState([])
  const [recommendations, setRecommendations] = useState([])

  const [fillerWordCount, setFillerWordCount] = useState(0)
  const [fillerWords, setFillerWords] = useState([])
  const [wordCount, setWordCount] = useState(0)
  const [speakingSpeed, setSpeakingSpeed] = useState(0)
  const [speakingSpeedStatus, setSpeakingSpeedStatus] = useState("")
  const [professionalVocabularyScore, setProfessionalVocabularyScore] =
    useState(0)
  const [starStructureScore, setStarStructureScore] = useState(0)
  const [communicationAnalysisScore, setCommunicationAnalysisScore] =
    useState(0)

  const [totalScore, setTotalScore] = useState(0)
  const [completed, setCompleted] = useState(false)

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [recording, setRecording] = useState(false)
  const [recordedVideoUrl, setRecordedVideoUrl] = useState("")
  const [uploadingRecording, setUploadingRecording] = useState(false)
  const [cloudRecordingUrl, setCloudRecordingUrl] = useState("")

  const handleMouseMove = (e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()

    card.style.setProperty("--x", `${e.clientX - rect.left}px`)
    card.style.setProperty("--y", `${e.clientY - rect.top}px`)
  }

  useEffect(() => {
    const loadVoices = () => {
      if (!window.speechSynthesis) return

      const voices = window.speechSynthesis.getVoices()
      const englishVoices = voices.filter((voice) =>
        voice.lang.toLowerCase().startsWith("en")
      )

      setAvailableVoices(englishVoices)

      const preferred =
        englishVoices.find((voice) =>
          voice.name.toLowerCase().includes("zira")
        ) ||
        englishVoices.find((voice) =>
          voice.name.toLowerCase().includes("samantha")
        ) ||
        englishVoices.find((voice) =>
          voice.name.toLowerCase().includes("female")
        ) ||
        englishVoices[0]

      if (preferred) setSelectedVoiceName(preferred.name)
    }

    loadVoices()

    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }

    return () => {
      window.speechSynthesis?.cancel()

      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null
      }

      if (micAnimationRef.current) {
        cancelAnimationFrame(micAnimationRef.current)
        micAnimationRef.current = null
      }

      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }

      analyserRef.current = null

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop()
      }

      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop()
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [])

  const attachStreamToVideo = async (stream) => {
    if (!videoRef.current || !stream) return

    videoRef.current.srcObject = stream
    videoRef.current.muted = true
    videoRef.current.playsInline = true
    videoRef.current.autoplay = true

    try {
      await videoRef.current.play()
    } catch (error) {
      console.log("Video play error:", error)
    }
  }

  const speak = (text) => {
    if (!window.speechSynthesis || !text) return

    window.speechSynthesis.cancel()

    const voices = window.speechSynthesis.getVoices()

    const selectedVoice =
      voices.find((voice) => voice.name === selectedVoiceName) ||
      voices.find((voice) => voice.name.toLowerCase().includes("zira")) ||
      voices.find((voice) => voice.name.toLowerCase().includes("samantha")) ||
      voices.find((voice) => voice.name.toLowerCase().includes("female")) ||
      voices.find((voice) => voice.lang.toLowerCase().startsWith("en"))

    const utterance = new SpeechSynthesisUtterance(text)

    if (selectedVoice) utterance.voice = selectedVoice

    utterance.rate = 0.88
    utterance.pitch = 1.12
    utterance.volume = 1
    utterance.lang = selectedVoice?.lang || "en-US"

    window.speechSynthesis.speak(utterance)
  }

  const stopMicMeter = () => {
    if (micAnimationRef.current) {
      cancelAnimationFrame(micAnimationRef.current)
      micAnimationRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    analyserRef.current = null
    setMicLevel(0)
    setMicWorking(false)
  }

  const startMicMeter = (stream) => {
    stopMicMeter()

    const audioTrack = stream.getAudioTracks()[0]

    if (!audioTrack) {
      setMicWorking(false)
      return
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext
    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()
    const source = audioContext.createMediaStreamSource(stream)

    analyser.fftSize = 256
    source.connect(analyser)

    audioContextRef.current = audioContext
    analyserRef.current = analyser

    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const updateMicLevel = () => {
      if (!analyserRef.current) return

      analyser.getByteFrequencyData(dataArray)

      const average =
        dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length

      const level = Math.min(100, Math.round((average / 255) * 300))

      setMicLevel(level)
      setMicWorking(level > 3)

      micAnimationRef.current = requestAnimationFrame(updateMicLevel)
    }

    updateMicLevel()
  }

  const loadDevices = async () => {
    try {
      setDeviceError("")

      if (!navigator.mediaDevices?.getUserMedia) {
        setDeviceError("Camera and microphone are not supported in this browser.")
        return
      }

      const tempStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })

      tempStream.getTracks().forEach((track) => track.stop())

      const devices = await navigator.mediaDevices.enumerateDevices()

      const cameras = devices.filter((device) => device.kind === "videoinput")
      const microphones = devices.filter(
        (device) => device.kind === "audioinput"
      )

      setVideoDevices(cameras)
      setAudioDevices(microphones)

      setSelectedCamera(cameras[0]?.deviceId || "")
      setSelectedMic(microphones[0]?.deviceId || "")
      setDevicesLoaded(true)
    } catch (error) {
      setDeviceError(error.message)
    }
  }

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop()
    }

    setRecording(false)
  }

  const stopCamera = () => {
    stopRecording()
    stopMicMeter()

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setCameraOn(false)
    setDevicesTested(false)
  }

  const testDevices = async () => {
    try {
      setDeviceError("")
      setDevicesTested(false)

      stopCamera()

      const stream = await navigator.mediaDevices.getUserMedia({
        video: selectedCamera
          ? {
              deviceId: { exact: selectedCamera },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          : true,
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

      streamRef.current = stream

      await attachStreamToVideo(stream)
      startMicMeter(stream)

      setCameraOn(true)
      setDevicesTested(true)
    } catch (error) {
      setDeviceError(error.message)
    }
  }

  const uploadRecordingToCloudinary = async (blob, activeSessionId) => {
    try {
      if (!activeSessionId) return

      setUploadingRecording(true)

      const formData = new FormData()
      formData.append("video", blob, "live-interview.webm")
      formData.append("sessionId", activeSessionId)

      const res = await axios.post(`${API}/upload-recording`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })

      setCloudRecordingUrl(res.data.recordingUrl || "")
    } catch (error) {
      console.log("Recording upload failed:", error)
    } finally {
      setUploadingRecording(false)
    }
  }

  const startRecording = (activeSessionId = sessionId) => {
    if (!streamRef.current) return

    try {
      recordedChunksRef.current = []

      const recorder = new MediaRecorder(streamRef.current, {
        mimeType: "video/webm"
      })

      recorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data)
      }

      recorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm"
        })

        const localUrl = URL.createObjectURL(blob)
        setRecordedVideoUrl(localUrl)

        await uploadRecordingToCloudinary(blob, activeSessionId)
      }

      recorder.start()
      setRecording(true)
    } catch (error) {
      console.log("Recording error:", error)
    }
  }

  const resetEvaluation = () => {
    setFeedback("")
    setFollowUpQuestion("")
    setScore(null)
    setTechnicalScore(0)
    setCommunicationScore(0)
    setConfidenceScore(0)
    setClarityScore(0)
    setProblemSolvingScore(0)
    setStrengths([])
    setWeaknesses([])
    setImprovedAnswer("")

    setHiringProbability(0)
    setTechnicalReadiness(0)
    setCommunicationReadiness(0)
    setConfidenceReadiness(0)
    setClarityReadiness(0)
    setProblemSolvingReadiness(0)
    setOverallReadiness(0)
    setSelectionLevel("")
    setRecruiterVerdict("")
    setBlockers([])
    setRecommendations([])

    setFillerWordCount(0)
    setFillerWords([])
    setWordCount(0)
    setSpeakingSpeed(0)
    setSpeakingSpeedStatus("")
    setProfessionalVocabularyScore(0)
    setStarStructureScore(0)
    setCommunicationAnalysisScore(0)
  }

  const startInterview = async () => {
    if (!devicesTested || !streamRef.current) {
      alert("Please test camera and microphone first.")
      return
    }

    if (mode === "resume" && !resumeFile) {
      alert("Please upload your resume first.")
      return
    }

    try {
      setLoading(true)

      let res

      if (mode === "resume") {
        const formData = new FormData()
        formData.append("resume", resumeFile)
        formData.append("userId", userId || "")
        formData.append("role", role)
        formData.append("difficulty", difficulty)
        formData.append("company", company)
        formData.append("micEnabled", "true")
        formData.append("cameraEnabled", "true")

        res = await axios.post(`${API}/start-resume`, formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        })
      } else {
        res = await axios.post(`${API}/start`, {
          userId,
          role,
          difficulty,
          company,
          micEnabled: true,
          cameraEnabled: true
        })
      }

      const newSessionId = res.data.sessionId || ""

      setActiveCompany(res.data.company || company || "General")
      setCompanyFocus(
        Array.isArray(res.data.companyFocus) ? res.data.companyFocus : []
      )

      setSessionStarted(true)
      setSessionId(newSessionId)
      setQuestions(res.data.questions || [])
      setCurrentIndex(0)
      setTranscript("")
      resetEvaluation()
      setTotalScore(0)
      setCompleted(false)
      setCloudRecordingUrl("")
      setRecordedVideoUrl("")

      setTimeout(() => {
        attachStreamToVideo(streamRef.current)
        startRecording(newSessionId)
        speak(res.data.firstQuestion || res.data.questions?.[0])
      }, 500)
    } catch (error) {
      alert(error.response?.data?.message || "Failed to start live interview")
    } finally {
      setLoading(false)
    }
  }

  const startListening = async () => {
    try {
      if (!streamRef.current) {
        alert("Please test camera and microphone first.")
        return
      }

      window.speechSynthesis?.cancel()

      audioChunksRef.current = []
      setTranscript("")

      const audioStream = new MediaStream(streamRef.current.getAudioTracks())

      const recorder = new MediaRecorder(audioStream, {
        mimeType: "audio/webm"
      })

      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      recorder.onstop = async () => {
        try {
          setTranscribing(true)

          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm"
          })

          if (audioBlob.size < 1000) {
            alert("No audio detected. Speak louder and try again.")
            return
          }

          const formData = new FormData()
          formData.append("audio", audioBlob, "answer.webm")

          const res = await axios.post(`${API}/transcribe`, formData, {
            headers: {
              "Content-Type": "multipart/form-data"
            }
          })

          setTranscript(res.data.transcript || "")
        } catch (error) {
          alert(
            error.response?.data?.message ||
              error.message ||
              "Transcription failed"
          )
        } finally {
          setListening(false)
          setTranscribing(false)
        }
      }

      recorder.start()
      setListening(true)
    } catch (error) {
      alert("Recording failed: " + error.message)
      setListening(false)
    }
  }

  const stopListening = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop()
    }

    setListening(false)
  }

  const submitAnswer = async () => {
    if (!transcript.trim()) {
      alert("Please speak your answer first.")
      return
    }

    try {
      setSubmitting(true)

      const res = await axios.post(`${API}/answer`, {
        sessionId,
        question: questions[currentIndex] || "",
        transcript
      })

      setScore(res.data.score || 0)
      setTechnicalScore(res.data.technicalScore || 0)
      setCommunicationScore(res.data.communicationScore || 0)
      setConfidenceScore(res.data.confidenceScore || 0)
      setClarityScore(res.data.clarityScore || 0)
      setProblemSolvingScore(res.data.problemSolvingScore || 0)

      setFillerWordCount(res.data.fillerWordCount || 0)
      setFillerWords(res.data.fillerWords || [])
      setWordCount(res.data.wordCount || 0)
      setSpeakingSpeed(res.data.speakingSpeed || 0)
      setSpeakingSpeedStatus(res.data.speakingSpeedStatus || "")
      setProfessionalVocabularyScore(res.data.professionalVocabularyScore || 0)
      setStarStructureScore(res.data.starStructureScore || 0)
      setCommunicationAnalysisScore(res.data.communicationAnalysisScore || 0)

      setFeedback(res.data.feedback || "")
      setStrengths(res.data.strengths || [])
      setWeaknesses(res.data.weaknesses || [])
      setImprovedAnswer(res.data.improvedAnswer || "")
      setFollowUpQuestion(res.data.followUpQuestion || "")

      setHiringProbability(res.data.hiringProbability || 0)
      setTechnicalReadiness(res.data.technicalReadiness || 0)
      setCommunicationReadiness(res.data.communicationReadiness || 0)
      setConfidenceReadiness(res.data.confidenceReadiness || 0)
      setClarityReadiness(res.data.clarityReadiness || 0)
      setProblemSolvingReadiness(res.data.problemSolvingReadiness || 0)
      setOverallReadiness(res.data.overallReadiness || 0)
      setSelectionLevel(res.data.selectionLevel || "")
      setRecruiterVerdict(res.data.recruiterVerdict || "")
      setBlockers(res.data.blockers || [])
      setRecommendations(res.data.recommendations || [])

      setTotalScore(res.data.totalScore || 0)
      setCompleted(res.data.completed || false)

      if (res.data.completed) stopRecording()

      speak(
        `${res.data.feedback || ""} ${
          res.data.recruiterVerdict
            ? "Recruiter verdict: " + res.data.recruiterVerdict
            : ""
        } ${
          res.data.followUpQuestion
            ? "Follow up question: " + res.data.followUpQuestion
            : ""
        }`
      )
    } catch (error) {
      alert(error.response?.data?.message || "Answer evaluation failed")
    } finally {
      setSubmitting(false)
    }
  }

  const nextQuestion = () => {
    const nextIndex = currentIndex + 1

    setCurrentIndex(nextIndex)
    setTranscript("")
    resetEvaluation()

    if (questions[nextIndex]) speak(questions[nextIndex])
  }

  const endInterview = () => {
    stopListening()
    window.speechSynthesis?.cancel()
    stopRecording()
    stopCamera()
    setSessionStarted(false)
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8 page-fade">
        <div
          onMouseMove={handleMouseMove}
          className="glow-card relative overflow-hidden rounded-[3rem] p-8 border border-cyan-400/20 bg-slate-950/90 shadow-[0_0_120px_rgba(34,211,238,0.12)]"
        >
          <div className="absolute -top-32 -right-32 w-[550px] h-[550px] rounded-full bg-cyan-500/15 blur-[140px]" />
          <div className="absolute -bottom-40 -left-40 w-[550px] h-[550px] rounded-full bg-purple-500/15 blur-[140px]" />
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(34,211,238,0.14),transparent_35%)]" />

          <div className="relative z-10 flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.35)]">
              <Brain className="text-white" size={32} />
            </div>

            <div>
              <div className="flex items-center gap-2 text-cyan-300 mb-1">
                <Sparkles size={16} />
                <span className="text-sm">
                  Live AI Interview + Communication Analyzer
                </span>
              </div>

              <h1 className="text-4xl lg:text-5xl font-black text-white text-glow">
                Live AI Interview
              </h1>
            </div>
          </div>

          <p className="relative z-10 text-slate-400 text-lg leading-8 max-w-5xl">
            Practice with camera, microphone, AI voice, Groq Whisper
            transcription, multi-metric feedback, resume questions, recruiter
            verdict, hiring probability, company-specific questions and
            communication analysis.
          </p>
        </div>

        {!sessionStarted && !completed && (
          <>
            <div onMouseMove={handleMouseMove} className="glow-card relative overflow-hidden rounded-[2.3rem] p-6 border border-cyan-400/10 bg-white/[0.04] hover:border-cyan-300/30 transition-all shadow-[0_0_60px_rgba(34,211,238,0.08)]">
              <h2 className="text-2xl font-bold text-white mb-5">
                Step 1: Camera & Microphone Test
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-[350px] bg-black rounded-[2rem] object-cover border border-cyan-400/20 shadow-[0_0_50px_rgba(34,211,238,0.08)]"
                  />

                  <div className="mt-4 flex items-center gap-2 text-slate-300">
                    <Monitor size={18} />
                    <span>Camera: {cameraOn ? "Working" : "Not started"}</span>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 flex items-center gap-2">
                        <Mic size={18} />
                        Microphone:{" "}
                        {micWorking ? "Detecting voice" : "Speak to test mic"}
                      </span>

                      <span className="text-cyan-300 font-semibold">
                        {micLevel}%
                      </span>
                    </div>

                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full"
                        style={{ width: `${micLevel}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={loadDevices}
                    className="glow-button w-full px-5 py-3 bg-white/10 hover:bg-white/15 rounded-xl flex items-center justify-center gap-2 text-white border border-white/10"
                  >
                    <RefreshCw size={16} />
                    Load / Refresh Devices
                  </button>

                  <select
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white"
                  >
                    <option value="">Default Camera</option>
                    {videoDevices.map((device, index) => (
                      <option
                        key={device.deviceId || index}
                        value={device.deviceId}
                      >
                        {device.label || `Camera ${index + 1}`}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedMic}
                    onChange={(e) => setSelectedMic(e.target.value)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white"
                  >
                    <option value="">Default Microphone</option>
                    {audioDevices.map((device, index) => (
                      <option
                        key={device.deviceId || index}
                        value={device.deviceId}
                      >
                        {device.label || `Microphone ${index + 1}`}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedVoiceName}
                    onChange={(e) => setSelectedVoiceName(e.target.value)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white"
                  >
                    <option value="">Auto Female Voice</option>
                    {availableVoices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={testDevices}
                    disabled={!devicesLoaded}
                    className="glow-button w-full px-5 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl disabled:opacity-50 text-white"
                  >
                    Test Selected Camera & Mic
                  </button>

                  {devicesTested && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-400/20 rounded-xl text-emerald-300 flex items-center gap-2">
                      <CheckCircle size={18} />
                      Camera and microphone connected.
                    </div>
                  )}

                  {deviceError && (
                    <div className="p-4 bg-red-500/10 border border-red-400/20 rounded-xl text-red-300 flex items-start gap-2">
                      <AlertCircle size={18} />
                      {deviceError}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div onMouseMove={handleMouseMove} className="glow-card relative overflow-hidden rounded-[2.3rem] p-6 border border-cyan-400/10 bg-white/[0.04] hover:border-cyan-300/30 transition-all shadow-[0_0_60px_rgba(34,211,238,0.08)]">
              <h2 className="text-2xl font-bold text-white mb-5">
                Step 2: Interview Setup
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <ModeCard
                  active={mode === "normal"}
                  icon={Brain}
                  title="Normal Live Interview"
                  description="AI asks general questions based on role and difficulty."
                  onClick={() => setMode("normal")}
                />

                <ModeCard
                  active={mode === "resume"}
                  icon={FileText}
                  title="Resume Based Interview"
                  description="AI asks questions from your real resume projects and skills."
                  onClick={() => setMode("resume")}
                />
              </div>

              {mode === "resume" && (
                <label className="mb-5 flex flex-col items-center justify-center border border-dashed border-cyan-400/40 bg-cyan-500/10 rounded-2xl p-6 cursor-pointer">
                  <Upload className="text-cyan-300 mb-3" />
                  <span className="text-white font-semibold">
                    {resumeFile ? resumeFile.name : "Upload Resume PDF / DOCX"}
                  </span>
                  <span className="text-slate-400 text-sm mt-1">
                    Resume questions will be generated from your uploaded file.
                  </span>

                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-4 text-white"
                >
                  {ROLES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-4 text-white"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>

                <select
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-4 text-white"
                >
                  {COMPANIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={startInterview}
                  disabled={loading || !devicesTested}
                  className="glow-button bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl font-semibold text-white disabled:opacity-50 py-4"
                >
                  {loading ? "Starting..." : "Start Live Interview"}
                </button>
              </div>
            </div>
          </>
        )}

        {sessionStarted && !completed && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.15fr] gap-6 items-start">
            <div onMouseMove={handleMouseMove} className="glow-card relative overflow-hidden rounded-[2.3rem] p-6 border border-cyan-400/10 bg-white/[0.04] hover:border-cyan-300/30 transition-all shadow-[0_0_60px_rgba(34,211,238,0.08)]">
              <div className="flex justify-between mb-5">
                <h2 className="text-2xl font-semibold text-white">
                  Camera Preview
                </h2>

                <button
                  type="button"
                  onClick={endInterview}
                  className="px-4 py-2 bg-red-600 rounded-xl text-white text-sm"
                >
                  End
                </button>
              </div>

              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-[350px] bg-black rounded-[2rem] object-cover border border-cyan-400/20 shadow-[0_0_50px_rgba(34,211,238,0.08)]"
              />

              <p className="mt-4 text-slate-300">
                Recording:{" "}
                <span className={recording ? "text-red-400" : "text-slate-500"}>
                  {recording ? "ON" : "OFF"}
                </span>
              </p>

              {uploadingRecording && (
                <p className="text-yellow-300 mt-3">
                  Uploading recording to Cloudinary...
                </p>
              )}

              {cloudRecordingUrl && (
                <a
                  href={cloudRecordingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-3 px-5 py-3 bg-emerald-600 rounded-xl text-white font-semibold"
                >
                  View Cloud Recording
                </a>
              )}
            </div>

            <div onMouseMove={handleMouseMove} className="glow-card relative overflow-hidden rounded-[2.3rem] p-6 border border-cyan-400/10 bg-white/[0.04] hover:border-cyan-300/30 transition-all shadow-[0_0_60px_rgba(34,211,238,0.08)]">
              <div className="flex justify-between mb-5">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Question {currentIndex + 1} / {questions.length}
                  </h2>

                  <p className="text-slate-400">
                    {mode === "resume"
                      ? "Resume based AI interview"
                      : "AI voice interview session"}
                  </p>

                  {questions.length > 0 && (
                    <div className="mt-4">
                      <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600"
                          style={{
                            width: `${((currentIndex + 1) / questions.length) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-400/20 text-purple-300 text-sm">
                      <Building2 size={15} />
                      {activeCompany}
                    </span>

                    {companyFocus.map((item, index) => (
                      <span
                        key={`${item}-${index}`}
                        className="px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 text-sm"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-cyan-300">
                  <Clock size={18} />
                  <span>{totalScore}%</span>
                </div>
              </div>

              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-6 mb-5">
                <p className="text-xl text-white leading-8">
                  {questions[currentIndex]}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 mb-5">
                <button
                  type="button"
                  onClick={startListening}
                  disabled={listening || transcribing}
                  className="px-5 py-3 bg-emerald-600 rounded-xl flex items-center gap-2 disabled:opacity-60 text-white"
                >
                  <Mic size={18} />
                  {listening ? "Recording..." : "Start Speaking"}
                </button>

                <button
                  type="button"
                  onClick={stopListening}
                  disabled={!listening}
                  className="px-5 py-3 bg-red-600 rounded-xl flex items-center gap-2 disabled:opacity-60 text-white"
                >
                  <MicOff size={18} />
                  Stop
                </button>

                <button
                  type="button"
                  onClick={submitAnswer}
                  disabled={submitting || transcribing || !transcript}
                  className="px-5 py-3 bg-blue-600 rounded-xl flex items-center gap-2 disabled:opacity-60 text-white"
                >
                  <Send size={18} />
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>

              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-5 min-h-[160px]">
                <p className="text-sm text-slate-400 mb-3">
                  Groq Whisper Speech-to-Text Output
                </p>

                <p className="text-white leading-7 whitespace-pre-line">
                  {transcribing
                    ? "Converting your voice to text..."
                    : transcript ||
                      "Click Start Speaking, speak your answer, then Stop."}
                </p>
              </div>

              {score !== null && (
                <div className="mt-6 rounded-[2rem] border border-cyan-400/20 bg-slate-950/70 p-6 shadow-[0_0_70px_rgba(34,211,238,0.12)]">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                      <p className="text-cyan-300 font-semibold mb-2">
                        Advanced AI Evaluation
                      </p>
                      <h3 className="text-4xl font-black text-white">
                        {score}% Overall Score
                      </h3>
                    </div>

                    <div className="px-5 py-4 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 text-center">
                      <p className="text-xs text-slate-400 mb-1">
                        Current Total
                      </p>
                      <p className="text-2xl font-bold">{totalScore}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4 mb-6">
                    <MetricCard label="Technical" value={technicalScore} />
                    <MetricCard
                      label="Communication"
                      value={communicationScore}
                    />
                    <MetricCard label="Confidence" value={confidenceScore} />
                    <MetricCard label="Clarity" value={clarityScore} />
                    <MetricCard
                      label="Problem Solving"
                      value={problemSolvingScore}
                    />
                  </div>

                  <CommunicationAnalyzerCard
                    fillerWordCount={fillerWordCount}
                    fillerWords={fillerWords}
                    wordCount={wordCount}
                    speakingSpeed={speakingSpeed}
                    speakingSpeedStatus={speakingSpeedStatus}
                    professionalVocabularyScore={professionalVocabularyScore}
                    starStructureScore={starStructureScore}
                    communicationAnalysisScore={communicationAnalysisScore}
                  />

                  <HiringProbabilityCard
                    hiringProbability={hiringProbability}
                    selectionLevel={selectionLevel}
                    recruiterVerdict={recruiterVerdict}
                    technicalReadiness={technicalReadiness}
                    communicationReadiness={communicationReadiness}
                    confidenceReadiness={confidenceReadiness}
                    clarityReadiness={clarityReadiness}
                    problemSolvingReadiness={problemSolvingReadiness}
                    overallReadiness={overallReadiness}
                    blockers={blockers}
                    recommendations={recommendations}
                  />

                  <InfoBox title="Feedback" value={feedback} />

                  {strengths.length > 0 && (
                    <ListPanel title="Strengths" items={strengths} tone="green" />
                  )}

                  {weaknesses.length > 0 && (
                    <ListPanel title="Weaknesses" items={weaknesses} tone="red" />
                  )}

                  {improvedAnswer && (
                    <InfoBox
                      title="Improved Answer"
                      value={improvedAnswer}
                      tone="blue"
                    />
                  )}

                  {followUpQuestion && (
                    <InfoBox
                      title="Follow-up Question"
                      value={followUpQuestion}
                      tone="purple"
                    />
                  )}

                  {currentIndex < questions.length - 1 && (
                    <button
                      type="button"
                      onClick={nextQuestion}
                      className="mt-6 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold"
                    >
                      Next Question
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {completed && (
          <div onMouseMove={handleMouseMove} className="glow-card relative overflow-hidden rounded-[3rem] p-10 text-center border border-cyan-400/20 bg-cyan-500/10 shadow-[0_0_90px_rgba(34,211,238,0.12)]">
            <CheckCircle className="mx-auto text-emerald-400 mb-5" size={72} />

            <h2 className="text-5xl font-bold text-white mb-3">
              Interview Completed
            </h2>

            <p className="text-slate-400 text-lg mb-6">
              Transcript, advanced score, hiring probability, communication
              analysis and recording are ready.
            </p>

            <p className="text-6xl font-bold text-cyan-300 mb-8">
              {totalScore}%
            </p>

            <div className="max-w-5xl mx-auto text-left">
              <CommunicationAnalyzerCard
                fillerWordCount={fillerWordCount}
                fillerWords={fillerWords}
                wordCount={wordCount}
                speakingSpeed={speakingSpeed}
                speakingSpeedStatus={speakingSpeedStatus}
                professionalVocabularyScore={professionalVocabularyScore}
                starStructureScore={starStructureScore}
                communicationAnalysisScore={communicationAnalysisScore}
              />

              <HiringProbabilityCard
                hiringProbability={hiringProbability}
                selectionLevel={selectionLevel}
                recruiterVerdict={recruiterVerdict}
                technicalReadiness={technicalReadiness}
                communicationReadiness={communicationReadiness}
                confidenceReadiness={confidenceReadiness}
                clarityReadiness={clarityReadiness}
                problemSolvingReadiness={problemSolvingReadiness}
                overallReadiness={overallReadiness}
                blockers={blockers}
                recommendations={recommendations}
              />
            </div>

            {cloudRecordingUrl && (
              <a
                href={cloudRecordingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-6 px-6 py-3 bg-emerald-600 rounded-xl text-white font-semibold"
              >
                View Cloud Recording
              </a>
            )}
          </div>
        )}

        {recordedVideoUrl && (
          <div onMouseMove={handleMouseMove} className="glow-card relative overflow-hidden rounded-[2.3rem] p-6 mt-8 border border-cyan-400/10 bg-white/[0.04] hover:border-cyan-300/30 transition-all">
            <h2 className="text-2xl font-bold text-white mb-4">
              Local Interview Recording
            </h2>

            <video
              src={recordedVideoUrl}
              controls
              className="w-full rounded-2xl border border-white/10"
            />

            <a
              href={recordedVideoUrl}
              download="live-interview-recording.webm"
              className="inline-block mt-4 px-6 py-3 bg-blue-600 rounded-xl text-white font-semibold"
            >
              Download Local Recording
            </a>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

function ModeCard({ active, icon: Icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-5 rounded-2xl border text-left transition-all ${
        active
          ? "bg-blue-600/20 border-blue-400 text-white shadow-[0_0_40px_rgba(59,130,246,0.15)]"
          : "bg-white/5 border-white/10 text-slate-300 hover:border-cyan-400/25 hover:bg-white/[0.07]"
      }`}
    >
      <Icon className="mb-3 text-cyan-300" />
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-sm text-slate-400">{description}</p>
    </button>
  )
}

function CommunicationAnalyzerCard({
  fillerWordCount,
  fillerWords,
  wordCount,
  speakingSpeed,
  speakingSpeedStatus,
  professionalVocabularyScore,
  starStructureScore,
  communicationAnalysisScore
}) {
  const uniqueFillers = [...new Set(fillerWords || [])]

  return (
    <div className="mt-6 rounded-[2rem] border border-emerald-400/20 bg-emerald-500/10 p-6">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_220px] gap-5 mb-6">
        <div>
          <p className="text-emerald-300 font-semibold mb-2">
            Real-Time Communication Analyzer
          </p>
          <h3 className="text-5xl font-black text-white">
            {communicationAnalysisScore || 0}%
          </h3>
          <p className="text-slate-400 mt-2">Communication Quality Score</p>
        </div>

        <div className="rounded-2xl bg-cyan-500/10 border border-cyan-400/20 p-5 text-center">
          <p className="text-sm text-slate-400 mb-1">Speaking Speed</p>
          <p className="text-3xl font-bold text-cyan-300">
            {speakingSpeed || 0} WPM
          </p>
          <p className="text-sm mt-1 text-cyan-200">
            {speakingSpeedStatus || "Not checked"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 mb-6">
        <SmallInfoCard label="Word Count" value={wordCount || 0} />
        <SmallInfoCard label="Filler Words" value={fillerWordCount || 0} />
        <MetricCard label="Vocabulary" value={professionalVocabularyScore || 0} />
        <MetricCard label="STAR Structure" value={starStructureScore || 0} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ListPanel
          title="Filler Words Detected"
          items={uniqueFillers}
          tone="red"
          emptyText="No filler words detected."
        />

        <div className="rounded-2xl bg-blue-500/10 border border-blue-400/20 p-5">
          <h4 className="text-blue-300 font-semibold mb-3">
            Communication Tips
          </h4>

          <div className="space-y-2 text-slate-300 leading-7">
            <p>• Keep answers structured and concise.</p>
            <p>• Use STAR method for experience-based questions.</p>
            <p>• Reduce filler words like um, uh, actually, basically.</p>
            <p>• Aim for 120–160 words per minute.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function HiringProbabilityCard({
  hiringProbability,
  selectionLevel,
  recruiterVerdict,
  technicalReadiness,
  communicationReadiness,
  confidenceReadiness,
  clarityReadiness,
  problemSolvingReadiness,
  overallReadiness,
  blockers,
  recommendations
}) {
  return (
    <div className="mt-6 rounded-[2rem] border border-purple-400/20 bg-purple-500/10 p-6">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_220px] gap-5 mb-6">
        <div>
          <p className="text-purple-300 font-semibold mb-2">
            AI Hiring Probability Engine
          </p>
          <h3 className="text-5xl font-black text-white">
            {hiringProbability || 0}%
          </h3>
          <p className="text-slate-400 mt-2">
            Selection Level:{" "}
            <span className="text-cyan-300 font-semibold">
              {selectionLevel || "Not calculated"}
            </span>
          </p>
        </div>

        <div className="rounded-2xl bg-cyan-500/10 border border-cyan-400/20 p-5 text-center">
          <p className="text-sm text-slate-400 mb-1">Overall Readiness</p>
          <p className="text-3xl font-bold text-cyan-300">
            {overallReadiness || 0}%
          </p>
        </div>
      </div>

      {recruiterVerdict && (
        <div className="mb-6 rounded-2xl bg-slate-950/60 border border-white/10 p-5">
          <p className="text-slate-400 text-sm mb-2">Recruiter Verdict</p>
          <p className="text-slate-200 leading-7">{recruiterVerdict}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4 mb-6">
        <MetricCard label="Technical Ready" value={technicalReadiness} />
        <MetricCard label="Communication" value={communicationReadiness} />
        <MetricCard label="Confidence" value={confidenceReadiness} />
        <MetricCard label="Clarity" value={clarityReadiness} />
        <MetricCard label="Problem Solving" value={problemSolvingReadiness} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ListPanel title="Selection Blockers" items={blockers} tone="red" />
        <ListPanel
          title="Recommendations"
          items={recommendations}
          tone="green"
        />
      </div>
    </div>
  )
}

function MetricCard({ label, value }) {
  const safeValue = Math.min(Number(value) || 0, 100)

  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-slate-300 text-sm leading-5 break-words">{label}</p>
        <p className="text-white font-bold shrink-0">{safeValue}%</p>
      </div>

      <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  )
}

function SmallInfoCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
      <p className="text-slate-300 text-sm mb-2">{label}</p>
      <p className="text-white font-bold text-2xl">{value}</p>
    </div>
  )
}

function InfoBox({ title, value, tone = "slate" }) {
  const toneClass =
    tone === "blue"
      ? "bg-blue-500/10 border-blue-400/20 text-blue-200"
      : tone === "purple"
      ? "bg-purple-500/10 border-purple-400/20 text-purple-200"
      : "bg-slate-950/60 border-white/10 text-slate-300"

  return (
    <div className={`mt-5 rounded-2xl border p-5 ${toneClass}`}>
      <h4 className="font-semibold mb-3">{title}</h4>
      <p className="leading-7 whitespace-pre-line">
        {value || "No data available."}
      </p>
    </div>
  )
}

function ListPanel({ title, items = [], tone = "slate", emptyText }) {
  const toneClass =
    tone === "red"
      ? "bg-red-500/10 border-red-400/20 text-red-200"
      : tone === "green"
      ? "bg-emerald-500/10 border-emerald-400/20 text-emerald-200"
      : "bg-slate-950/60 border-white/10 text-slate-300"

  return (
    <div className={`mt-5 rounded-2xl border p-5 ${toneClass}`}>
      <h4 className="font-semibold mb-3">{title}</h4>

      {items && items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item, index) => (
            <p key={index} className="leading-7">
              • {item}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-slate-400">{emptyText || "No data available."}</p>
      )}
    </div>
  )
}

export default LiveInterview