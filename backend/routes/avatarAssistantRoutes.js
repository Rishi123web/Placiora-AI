import express from "express"
import multer from "multer"
import Groq from "groq-sdk"
import { toFile } from "groq-sdk/uploads"

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
})

const getGroq = () => {
  const apiKey = process.env.GROQ_API_KEY?.trim()

  if (!apiKey) return null

  return new Groq({ apiKey })
}

const cleanMessages = (conversation = []) => {
  if (!Array.isArray(conversation)) return []

  return conversation.slice(-10).map((msg) => ({
    role: msg.role === "assistant" ? "assistant" : "user",
    content: String(msg.content || "").slice(0, 3000)
  }))
}

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Sifra Assistant Online",
    groqLoaded: Boolean(process.env.GROQ_API_KEY?.trim())
  })
})

router.post("/chat", async (req, res) => {
  try {
    const groq = getGroq()

    if (!groq) {
      return res.status(500).json({
        success: false,
        reply: "Sifra is offline because GROQ_API_KEY is missing."
      })
    }

    const { message, conversation = [], context = {} } = req.body

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        success: false,
        reply: "Please type or speak something first."
      })
    }

    const userMessage = String(message).trim()

    const systemPrompt = `
You are Sifra, the advanced AI agent of Placiora AI.

Platform: Placiora AI
Tagline: Your Personal Placement Copilot

User:
- Name: ${context.userName || "User"}
- Email: ${context.userEmail || "unknown"}
- Current page: ${context.currentPath || "unknown"}
- Page mode: ${context.pageMode || "default"}
- Agent mode: ${context.agentMode ? "ON" : "OFF"}

Main abilities:
1. Help with coding, debugging, DSA, Piston errors and deployment.
2. Help with AI interview, HR, GD, live interview and resume.
3. Navigate user through Placiora AI pages.
4. Give copy-paste ready code when asked.
5. Explain errors clearly and step-by-step.
6. Never repeat introduction again and again.
7. Be concise unless user asks for full code.
8. If user is angry or stuck, calm them and give exact next commands.
9. If code is requested, provide complete usable file code.
10. If unsure, ask for the exact file/error screenshot.

Tone:
Modern AI copilot, friendly, professional, confident.

Important:
- Do not claim you changed files yourself.
- Do not expose secrets.
- Tell user not to commit .env.
- For Render/Vercel/Git errors, give commands in order.
`

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.45,
      max_tokens: 2200,
      messages: [
        { role: "system", content: systemPrompt },
        ...cleanMessages(conversation),
        { role: "user", content: userMessage }
      ]
    })

    const reply =
      completion?.choices?.[0]?.message?.content ||
      "I could not generate a response right now."

    res.json({
      success: true,
      reply
    })
  } catch (error) {
    console.log("Sifra Chat Error:", error?.response?.data || error.message)

    res.status(500).json({
      success: false,
      reply: "Sifra could not connect right now. Please try again.",
      error: error.message
    })
  }
})

router.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    const groq = getGroq()

    if (!groq) {
      return res.status(500).json({
        success: false,
        text: "",
        message: "GROQ_API_KEY is missing."
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        text: "",
        message: "No audio file received."
      })
    }

    if (req.file.size < 1000) {
      return res.status(400).json({
        success: false,
        text: "",
        message: "Audio is too short. Please speak longer."
      })
    }

    const fileName = req.file.originalname || "sifra-voice.webm"
    const mimeType = req.file.mimetype || "audio/webm"

    const audioFile = await toFile(req.file.buffer, fileName, {
      type: mimeType
    })

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3",
      response_format: "json",
      language: "en",
      temperature: 0
    })

    res.json({
      success: true,
      text: transcription?.text || ""
    })
  } catch (error) {
    console.log("Sifra Whisper Error:", error?.response?.data || error.message)

    res.status(500).json({
      success: false,
      text: "",
      message: "Voice transcription failed.",
      error: error.message
    })
  }
})

export default router