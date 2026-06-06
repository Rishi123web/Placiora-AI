import { useEffect, useRef, useState } from "react"

import {
  Camera,
  Mic,
  CheckCircle,
  AlertCircle,
  RefreshCcw,
  Play,
  X,
  Volume2
} from "lucide-react"

function DeviceSetupModal({ open = false, isOpen = false, onClose, onReady }) {
  const modalOpen = open || isOpen

  const previewRef = useRef(null)
  const streamRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const animationRef = useRef(null)

  const [cameras, setCameras] = useState([])
  const [microphones, setMicrophones] = useState([])

  const [selectedCamera, setSelectedCamera] = useState("")
  const [selectedMic, setSelectedMic] = useState("")

  const [cameraReady, setCameraReady] = useState(false)
  const [micReady, setMicReady] = useState(false)

  const [micLevel, setMicLevel] = useState(0)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState("")

  function stopTest() {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }

    analyserRef.current = null

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (previewRef.current) {
      previewRef.current.srcObject = null
    }

    setTesting(false)
    setMicLevel(0)
  }

  useEffect(() => {
    async function initializeDevices() {
      if (!modalOpen) return

      try {
        setError("")

        if (!navigator.mediaDevices) {
          setError("Media devices are not supported in this browser.")
          return
        }

        if (!navigator.mediaDevices.enumerateDevices) {
          setError("Device detection is not supported in this browser.")
          return
        }

        let devices = await navigator.mediaDevices.enumerateDevices()

        let foundCameras = devices.filter(
          (device) => device.kind === "videoinput"
        )

        let foundMics = devices.filter(
          (device) => device.kind === "audioinput"
        )

        if (foundCameras.length === 0 && foundMics.length === 0) {
          try {
            const permissionStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true
            })

            permissionStream.getTracks().forEach((track) => track.stop())

            devices = await navigator.mediaDevices.enumerateDevices()

            foundCameras = devices.filter(
              (device) => device.kind === "videoinput"
            )

            foundMics = devices.filter(
              (device) => device.kind === "audioinput"
            )
          } catch (permissionError) {
            console.log("Permission request error:", permissionError)
          }
        }

        setCameras(foundCameras)
        setMicrophones(foundMics)

        if (foundCameras.length > 0) {
          setSelectedCamera((prev) => prev || foundCameras[0].deviceId)
        }

        if (foundMics.length > 0) {
          setSelectedMic((prev) => prev || foundMics[0].deviceId)
        }
      } catch (err) {
        console.log("Load devices error:", err)
        setError("Unable to load camera and microphone devices.")
      }
    }

    initializeDevices()

    return () => {
      stopTest()
    }
  }, [modalOpen])

  function setupMicMeter(stream) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext

      if (!AudioContext) return

      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)

      analyser.fftSize = 256
      source.connect(analyser)

      audioContextRef.current = audioContext
      analyserRef.current = analyser

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      function updateLevel() {
        if (!analyserRef.current) return

        analyserRef.current.getByteFrequencyData(dataArray)

        const average =
          dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length

        const level = Math.min(Math.round((average / 128) * 100), 100)

        setMicLevel(level)

        if (level > 3) {
          setMicReady(true)
        }

        animationRef.current = requestAnimationFrame(updateLevel)
      }

      updateLevel()
    } catch (err) {
      console.log("Mic meter error:", err)
    }
  }

  async function startTest() {
    try {
      setError("")
      stopTest()

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Camera and microphone are not supported in this browser.")
        return
      }

      const constraints = {
        video: selectedCamera
          ? {
              deviceId: {
                exact: selectedCamera
              }
            }
          : true,

        audio: selectedMic
          ? {
              deviceId: {
                exact: selectedMic
              }
            }
          : true
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      streamRef.current = stream

      if (previewRef.current) {
        previewRef.current.srcObject = stream
      }

      const hasVideo = stream.getVideoTracks().length > 0
      const hasAudio = stream.getAudioTracks().length > 0

      setCameraReady(hasVideo)
      setMicReady(hasAudio)
      setTesting(true)

      if (hasAudio) {
        setupMicMeter(stream)
      }
    } catch (err) {
      console.log("Start test error:", err)

      setCameraReady(false)
      setMicReady(false)

      if (err.name === "NotAllowedError") {
        setError("Camera or microphone permission was denied.")
      } else if (err.name === "NotFoundError") {
        setError("No camera or microphone was found.")
      } else {
        setError("Device test failed. Please check camera/mic permissions.")
      }
    }
  }

  function handleContinue() {
    if (!cameraReady || !micReady) {
      setError("Please test your camera and microphone before starting.")
      return
    }

    if (onReady) {
      onReady({
        stream: streamRef.current,
        selectedCamera,
        selectedMic
      })
    }

    if (previewRef.current) {
      previewRef.current.srcObject = null
    }

    streamRef.current = null
    setTesting(false)
  }

  function handleClose() {
    stopTest()

    if (onClose) {
      onClose()
    }
  }

  if (!modalOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="relative w-full max-w-5xl rounded-[2.5rem] border border-cyan-400/20 bg-[#020617] p-6 shadow-[0_0_120px_rgba(34,211,238,0.18)] overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-cyan-300 mb-2">
                <RefreshCcw size={16} />
                <span className="text-sm">Device Permission & Test</span>
              </div>

              <h2 className="text-4xl font-black text-white">
                Camera & Microphone Setup
              </h2>

              <p className="text-slate-400 mt-2">
                Select your devices, test camera and mic, then start your live
                AI interview.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/15 text-white flex items-center justify-center transition"
            >
              <X size={22} />
            </button>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-red-300 flex items-start gap-3">
              <AlertCircle size={20} className="mt-1" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
              <div className="relative h-[360px] rounded-[1.5rem] overflow-hidden bg-black border border-cyan-400/20">
                <video
                  ref={previewRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />

                {!testing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                    <Camera size={64} className="mb-4" />
                    <p>Camera preview will appear after test.</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                <StatusCard
                  icon={Camera}
                  title="Camera"
                  ready={cameraReady}
                  label={cameraReady ? "Ready" : "Not tested"}
                />

                <StatusCard
                  icon={Mic}
                  title="Microphone"
                  ready={micReady}
                  label={micReady ? "Ready" : "Not tested"}
                />
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 space-y-5">
              <div>
                <label className="text-slate-300 text-sm mb-2 block">
                  Select Camera
                </label>

                <select
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-cyan-400/40"
                >
                  {cameras.length === 0 && (
                    <option value="">Default Camera</option>
                  )}

                  {cameras.map((camera, index) => (
                    <option
                      key={camera.deviceId || index}
                      value={camera.deviceId}
                    >
                      {camera.label || `Camera ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 text-sm mb-2 block">
                  Select Microphone
                </label>

                <select
                  value={selectedMic}
                  onChange={(e) => setSelectedMic(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-cyan-400/40"
                >
                  {microphones.length === 0 && (
                    <option value="">Default Microphone</option>
                  )}

                  {microphones.map((mic, index) => (
                    <option key={mic.deviceId || index} value={mic.deviceId}>
                      {mic.label || `Microphone ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Volume2 size={18} />
                    <span>Mic Level</span>
                  </div>

                  <span className="text-cyan-300 font-semibold">
                    {micLevel}%
                  </span>
                </div>

                <div className="w-full h-4 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 transition-all"
                    style={{
                      width: `${micLevel}%`
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={startTest}
                  className="px-6 py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center justify-center gap-3 transition"
                >
                  <Play size={20} />
                  Test Devices
                </button>

                <button
                  type="button"
                  onClick={stopTest}
                  className="px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold flex items-center justify-center gap-3 transition"
                >
                  <RefreshCcw size={20} />
                  Stop Test
                </button>
              </div>

              <button
                type="button"
                onClick={handleContinue}
                className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-700 text-white font-bold text-lg shadow-[0_0_35px_rgba(16,185,129,0.2)] hover:scale-[1.01] transition"
              >
                Continue to Live Interview
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusCard({ icon: Icon, title, ready, label }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>

          <h3 className="text-white font-bold text-xl mt-1">{label}</h3>
        </div>

        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            ready
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-red-500/20 text-red-300"
          }`}
        >
          {ready ? <CheckCircle size={22} /> : <Icon size={22} />}
        </div>
      </div>
    </div>
  )
}

export default DeviceSetupModal