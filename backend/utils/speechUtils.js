export function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function createSpeechRecognizer({
  onTranscript,
  onError,
  language = "en-US"
}) {
  const SpeechRecognition = getSpeechRecognition()

  if (!SpeechRecognition) {
    if (onError) onError("Speech recognition is not supported in this browser.")
    return null
  }

  const recognition = new SpeechRecognition()

  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = language

  recognition.onresult = (event) => {
    let transcript = ""

    for (let i = 0; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript + " "
    }

    if (onTranscript) onTranscript(transcript.trim())
  }

  recognition.onerror = (event) => {
    const ignoredErrors = ["no-speech", "aborted", "audio-capture"]

    if (ignoredErrors.includes(event.error)) {
      console.log("Ignored speech recognition event:", event.error)
      return
    }

    if (onError) {
      onError(`Speech recognition error: ${event.error}`)
    }
  }

  return recognition
}

export function stopSpeechRecognizer(recognitionRef) {
  try {
    if (recognitionRef?.current) {
      recognitionRef.current.onresult = null
      recognitionRef.current.onerror = null
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
  } catch (error) {
    console.log("Stop speech recognition error:", error)
  }
}

export function speakAIText({ text, onStart, onEnd, rate = 0.95 }) {
  if (!text || !window.speechSynthesis) return

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  const voices = window.speechSynthesis.getVoices()

  const voice =
    voices.find((v) => v.name.toLowerCase().includes("zira")) ||
    voices.find((v) => v.name.toLowerCase().includes("female")) ||
    voices.find((v) => v.lang.toLowerCase().includes("en")) ||
    voices[0]

  if (voice) utterance.voice = voice

  utterance.rate = rate
  utterance.pitch = 1
  utterance.volume = 1

  utterance.onstart = () => onStart && onStart()
  utterance.onend = () => onEnd && onEnd()
  utterance.onerror = () => onEnd && onEnd()

  window.speechSynthesis.speak(utterance)
}

export function stopAISpeech() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}

export function countFillerWords(text = "") {
  const lower = text.toLowerCase()
  const fillers = ["um", "uh", "like", "actually", "basically", "hmm", "so"]

  let count = 0

  fillers.forEach((word) => {
    const matches = lower.match(new RegExp(`\\b${word}\\b`, "g"))
    if (matches) count += matches.length
  })

  return count
}

export function calculateSpeakingConfidence(text = "") {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const fillers = countFillerWords(text)

  let score = 30

  if (words.length > 10) score += 20
  if (words.length > 25) score += 25
  if (fillers <= 2) score += 15
  if (fillers === 0) score += 10

  return Math.min(score, 100)
}