import express from "express"
import multer from "multer"
import Groq from "groq-sdk"
import { toFile } from "groq-sdk/uploads"

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024
  }
})

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Sifra Assistant Online",
    groqLoaded: Boolean(process.env.GROQ_API_KEY)
  })
})

router.post("/chat", async (req, res) => {
  try {
    const { message, conversation = [], context = {} } = req.body

    if (!message) {
      return res.status(400).json({
        success: false,
        reply: "No message received."
      })
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        success: false,
        reply: "Groq API key is missing on backend."
      })
    }

    const history = conversation.slice(-8).map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content || ""
    }))

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.65,
      messages: [
        {
          role: "system",
          content: `
You are Sifra, the intelligent AI assistant of Placiora AI.

Platform: Placiora AI
Tagline: Your Personal Placement Copilot

You help with coding, debugging, interviews, resumes, aptitude, placements, project building and website navigation.

Rules:
- Do not repeatedly introduce yourself.
- Continue naturally like a modern AI copilot.
- Be helpful, friendly and professional.
- For code requests, give copy-paste ready code.
- For debugging, explain the issue and give corrected code.
- Current page: ${context.currentPath || "unknown"}
- Page mode: ${context.pageMode || "default"}
- User name: ${context.userName || "User"}
`
        },
        ...history,
        {
          role: "user",
          content: message
        }
      ]
    })

    const reply =
      completion?.choices?.[0]?.message?.content ||
      "Sorry, I could not generate a response."

    res.json({
      success: true,
      reply
    })
  } catch (error) {
    console.log("Sifra Chat Error:", error)

    res.status(500).json({
      success: false,
      reply: "I am having trouble connecting right now. Please try again.",
      error: error.message
    })
  }
})

router.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        success: false,
        text: "",
        message: "Groq API key missing"
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        text: "",
        message: "No audio uploaded"
      })
    }

    console.log("Sifra audio received:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    })

    const audioFile = await toFile(
      req.file.buffer,
      req.file.originalname || "voice.webm",
      {
        type: req.file.mimetype || "audio/webm"
      }
    )

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3",
      response_format: "json",
      language: "en"
    })

    res.json({
      success: true,
      text: transcription.text || ""
    })
  } catch (error) {
    console.log("Sifra Whisper Error:", error)

    res.status(500).json({
      success: false,
      text: "",
      message: "Voice transcription failed",
      error: error.message
    })
  }
})

export default router