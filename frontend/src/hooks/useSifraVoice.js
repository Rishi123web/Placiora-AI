import { useRef, useState } from "react"

export default function useSifraVoice() {
  const [speaking, setSpeaking] = useState(false)

  const voiceRef = useRef(null)
  const queueRef = useRef([])
  const indexRef = useRef(0)

  const getFemaleVoice = () => {
    const voices = window.speechSynthesis.getVoices()

    const preferred = [
      "Microsoft Aria",
      "Microsoft Zira",
      "Samantha",
      "Google UK English Female",
      "Victoria"
    ]

    for (const name of preferred) {
      const match = voices.find((v) =>
        v.name.toLowerCase().includes(name.toLowerCase())
      )

      if (match) return match
    }

    return voices[0]
  }

  const stopSpeaking = () => {
    window.speechSynthesis.cancel()
    queueRef.current = []
    indexRef.current = 0
    setSpeaking(false)
  }

  const speakNext = () => {
    const text = queueRef.current[indexRef.current]

    if (!text) {
      setSpeaking(false)
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)

    utterance.voice =
      voiceRef.current || getFemaleVoice()

    utterance.rate = 0.92
    utterance.pitch = 1.08
    utterance.volume = 1

    utterance.onstart = () => {
      setSpeaking(true)
    }

    utterance.onend = () => {
      indexRef.current += 1
      speakNext()
    }

    window.speechSynthesis.speak(utterance)
  }

  const speak = (text) => {
    stopSpeaking()

    voiceRef.current =
      voiceRef.current || getFemaleVoice()

    queueRef.current = text
      .split(/(?<=[.!?])\s+/)
      .filter(Boolean)

    indexRef.current = 0

    speakNext()
  }

  return {
    speaking,
    speak,
    stopSpeaking
  }
}