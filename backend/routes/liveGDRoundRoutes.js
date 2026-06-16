import express from "express"
import mongoose from "mongoose"
import OpenAI from "openai"
import PDFDocument from "pdfkit"
import multer from "multer"
import fs from "fs"
import path from "path"

import LiveGDRound from "../models/LiveGDRound.js"

const router = express.Router()

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads")
}

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || ".webm") || ".webm"
    cb(null, `live-gd-${Date.now()}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024
  }
})

const FRONTEND_URL =
  process.env.CLIENT_URL ||
  process.env.FRONTEND_URL ||
  "http://localhost:5173"

const companyOptions = [
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

const AI_PARTICIPANTS = [
  { name: "Priya", role: "AI Participant", personality: "Analytical" },
  { name: "Rahul", role: "AI Participant", personality: "Technical" },
  { name: "Aarav", role: "AI Participant", personality: "Leader" },
  { name: "Neha", role: "AI Participant", personality: "Critical Thinker" }
]

const generateMeetingCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""

  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }

  return code
}

const normalizeMeetingCode = (input = "") => {
  let value = String(input || "").trim()

  try {
    if (value.startsWith("http")) {
      const url = new URL(value)
      value = url.searchParams.get("invite") || ""
    }
  } catch (error) {
    return ""
  }

  return value
    .replace("/live-gd-round?invite=", "")
    .replace("invite=", "")
    .trim()
    .toUpperCase()
}

const getUniqueMeetingCode = async () => {
  for (let i = 0; i < 10; i++) {
    const code = generateMeetingCode()

    const exists = await LiveGDRound.collection.findOne({
      $or: [{ meetingCode: code }, { inviteCode: code }]
    })

    if (!exists) return code
  }

  return `${generateMeetingCode()}${Date.now().toString().slice(-2)}`
}

const getActiveAiParticipants = (humanCount = 1) => {
  const needed = Math.max(0, 5 - Number(humanCount || 0))

  return AI_PARTICIPANTS.slice(0, needed).map((ai) => ({
    ...ai,
    active: true
  }))
}

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY?.trim()

  if (!apiKey) return null

  return new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1"
  })
}

const createTranscript = (messages = []) => {
  return messages
    .map((item) => `${item.name || "Speaker"}: ${item.message || ""}`)
    .join("\n")
}

const clampScore = (value) => {
  const num = Number(value) || 0
  return Math.min(100, Math.max(0, Math.round(num)))
}

const fallbackEvaluation = (messages = []) => {
  const text = messages
    .filter((item) => item.speaker === "user")
    .map((item) => item.message || "")
    .join(" ")

  const words = text.split(/\s+/).filter(Boolean).length
  let score = 45

  if (words > 20) score += 10
  if (words > 50) score += 10
  if (words > 90) score += 10
  if (text.toLowerCase().includes("example")) score += 8
  if (text.toLowerCase().includes("solution")) score += 7

  const finalScore = clampScore(score)

  return {
    communicationScore: finalScore,
    contentScore: clampScore(finalScore + 3),
    leadershipScore: clampScore(finalScore - 2),
    confidenceScore: finalScore,
    criticalThinkingScore: clampScore(finalScore - 1),
    teamworkScore: clampScore(finalScore + 2),
    argumentStrengthScore: finalScore,
    overallScore: finalScore,
    recruiterVerdict:
      finalScore >= 80
        ? "Likely Selected"
        : finalScore >= 65
        ? "Borderline Select"
        : "Needs Improvement",
    feedback:
      "Good attempt. Speak in a structured way, acknowledge others, add examples, and conclude with a balanced view.",
    strengths: ["Participated in the discussion", "Shared viewpoint"],
    weaknesses: ["Needs stronger structure", "Needs more examples"],
    improvedResponse:
      "I agree with the previous point, and I would like to add a balanced perspective. This topic has both opportunities and risks. For example, technology can improve productivity, but people also need reskilling. So, the best solution is responsible adoption with proper training."
  }
}

const openingMessages = (topic, humanCount = 1) => {
  const activeAi = getActiveAiParticipants(humanCount)

  const messages = [
    {
      speaker: "ai",
      name: "Moderator",
      role: "Moderator",
      personality: "Moderator",
      message: `Welcome everyone. Today's group discussion topic is: ${topic}. The host can admit participants and start the GD when ready.`
    }
  ]

  const introMap = {
    Priya:
      "I think we should first define the topic and then discuss both positive and negative sides.",
    Rahul:
      "I agree. We should also bring practical industry examples and not keep the discussion theoretical.",
    Aarav:
      "I can help keep the flow structured. We should discuss causes, impact and possible solutions.",
    Neha:
      "Along with benefits, we should not ignore risks, ethics and long-term consequences."
  }

  activeAi.forEach((ai) => {
    messages.push({
      speaker: "ai",
      name: ai.name,
      role: ai.role,
      personality: ai.personality,
      message: introMap[ai.name] || "I am ready to contribute."
    })
  })

  return messages
}

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Live GD round route working"
  })
})

router.get("/companies", (req, res) => {
  res.json({
    success: true,
    companies: companyOptions
  })
})

router.post("/create-room", async (req, res) => {
  try {
    const {
      userId,
      name = "Host",
      email = "",
      topic = "Impact of AI on Jobs",
      difficulty = "Beginner",
      company = "General"
    } = req.body || {}

    const meetingCode = await getUniqueMeetingCode()
    const inviteCode = meetingCode
    const inviteLink = `${FRONTEND_URL}/live-gd-round?invite=${meetingCode}`

    const hostObjectId =
      userId && mongoose.Types.ObjectId.isValid(userId)
        ? new mongoose.Types.ObjectId(userId)
        : null

    const participants = [
      {
        userId: hostObjectId,
        name,
        email,
        role: "Host",
        isHost: true,
        micReady: false,
        cameraReady: false,
        approved: true,
        status: "approved",
        joinedAt: new Date()
      }
    ]

    const aiParticipants = getActiveAiParticipants(participants.length)
    const messages = openingMessages(topic, participants.length)
    const now = new Date()

    const roomDoc = {
      userId: hostObjectId,
      hostId: hostObjectId,
      hostName: name,

      topic,
      difficulty,
      company,

      meetingCode,
      inviteCode,
      inviteLink,

      isMultiplayer: true,
      maxParticipants: 5,

      status: "waiting",
      meetingStatus: "waiting",

      participants,
      pendingParticipants: [],
      aiParticipants,

      messages,
      transcript: createTranscript(messages),

      communicationScore: 0,
      contentScore: 0,
      leadershipScore: 0,
      confidenceScore: 0,
      overallScore: 0,

      feedback: "",
      strengths: [],
      weaknesses: [],
      improvedResponse: "",

      completed: false,
      startedAt: null,
      endedAt: null,

      createdAt: now,
      updatedAt: now
    }

    const inserted = await LiveGDRound.collection.insertOne(roomDoc)

    const round = {
      ...roomDoc,
      _id: inserted.insertedId.toString()
    }

    res.status(201).json({
      success: true,
      roundId: inserted.insertedId.toString(),
      meetingCode,
      inviteCode,
      inviteLink,
      round
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Create room failed",
      error: error.message
    })
  }
})

router.get("/meeting/:meetingCode", async (req, res) => {
  try {
    const cleanCode = normalizeMeetingCode(req.params.meetingCode)

    if (!cleanCode || cleanCode === "UNDEFINED" || cleanCode === "NULL") {
      return res.status(400).json({
        success: false,
        message: "Valid meeting code is required"
      })
    }

    const round = await LiveGDRound.collection.findOne({
      $or: [{ meetingCode: cleanCode }, { inviteCode: cleanCode }]
    })

    if (!round) {
      return res.status(404).json({
        success: false,
        message: `GD meeting not found for code: ${cleanCode}`
      })
    }

    res.json({
      success: true,
      round: {
        ...round,
        _id: round._id.toString()
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch meeting",
      error: error.message
    })
  }
})

router.post("/join-room", async (req, res) => {
  try {
    const { inviteCode, userId, name = "Participant", email = "" } =
      req.body || {}

    const cleanCode = normalizeMeetingCode(inviteCode)

    if (!cleanCode || cleanCode === "UNDEFINED" || cleanCode === "NULL") {
      return res.status(400).json({
        success: false,
        message: "Valid meeting code is required"
      })
    }

    const round = await LiveGDRound.collection.findOne({
      $or: [{ meetingCode: cleanCode }, { inviteCode: cleanCode }],
      completed: false,
      meetingStatus: { $ne: "ended" }
    })

    if (!round) {
      return res.status(404).json({
        success: false,
        message: `GD meeting not found for code: ${cleanCode}`
      })
    }

    const alreadyParticipant = (round.participants || []).some((p) => {
      if (userId && p.userId) return p.userId.toString() === userId
      return email && p.email === email
    })

    if (alreadyParticipant) {
      return res.json({
        success: true,
        admitted: true,
        waiting: false,
        round: {
          ...round,
          _id: round._id.toString()
        }
      })
    }

    const humanParticipants = (round.participants || []).filter(
      (p) => p.role !== "AI Participant"
    ).length

    if (humanParticipants >= (round.maxParticipants || 5)) {
      return res.status(400).json({
        success: false,
        message: "GD meeting is full"
      })
    }

    const alreadyPending = (round.pendingParticipants || []).some((p) => {
      if (userId && p.userId) return p.userId.toString() === userId
      return email && p.email === email
    })

    if (!alreadyPending) {
      const pendingUser = {
        userId:
          userId && mongoose.Types.ObjectId.isValid(userId)
            ? new mongoose.Types.ObjectId(userId)
            : null,
        name,
        email,
        role: "Participant",
        approved: false,
        status: "pending",
        requestedAt: new Date()
      }

      await LiveGDRound.collection.updateOne(
        { _id: round._id },
        {
          $push: { pendingParticipants: pendingUser },
          $set: { updatedAt: new Date() }
        }
      )

      round.pendingParticipants = [
        ...(round.pendingParticipants || []),
        pendingUser
      ]
    }

    res.json({
      success: true,
      admitted: false,
      waiting: true,
      message: "Join request sent. Waiting for host approval.",
      round: {
        ...round,
        _id: round._id.toString()
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Join room failed",
      error: error.message
    })
  }
})

router.get("/room/:roundId", async (req, res) => {
  try {
    const { roundId } = req.params

    if (!mongoose.Types.ObjectId.isValid(roundId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid room ID"
      })
    }

    const round = await LiveGDRound.collection.findOne({
      _id: new mongoose.Types.ObjectId(roundId)
    })

    if (!round) {
      return res.status(404).json({
        success: false,
        message: "GD room not found"
      })
    }

    res.json({
      success: true,
      round: {
        ...round,
        _id: round._id.toString()
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load room",
      error: error.message
    })
  }
})

router.post("/admit-user", async (req, res) => {
  try {
    const { roundId, userId = "", email = "" } = req.body || {}

    if (!roundId || !mongoose.Types.ObjectId.isValid(roundId)) {
      return res.status(400).json({
        success: false,
        message: "Valid room ID required"
      })
    }

    const objectId = new mongoose.Types.ObjectId(roundId)

    const round = await LiveGDRound.collection.findOne({
      _id: objectId
    })

    if (!round) {
      return res.status(404).json({
        success: false,
        message: "GD room not found"
      })
    }

    const humanParticipants = (round.participants || []).filter(
      (p) => p.role !== "AI Participant"
    ).length

    if (humanParticipants >= (round.maxParticipants || 5)) {
      return res.status(400).json({
        success: false,
        message: "Room already has 5 human members"
      })
    }

    const pending = (round.pendingParticipants || []).find((p) => {
      if (userId && p.userId) return p.userId.toString() === userId
      return email && p.email === email
    })

    if (!pending) {
      return res.status(404).json({
        success: false,
        message: "Pending user not found"
      })
    }

    const participant = {
      userId: pending.userId || null,
      name: pending.name,
      email: pending.email,
      role: "Participant",
      isHost: false,
      approved: true,
      status: "approved",
      micReady: false,
      cameraReady: false,
      joinedAt: new Date()
    }

    const updatedParticipants = [...(round.participants || []), participant]
    const updatedAiParticipants = getActiveAiParticipants(
      updatedParticipants.length
    )

    const updatedPending = (round.pendingParticipants || []).filter((p) => {
      if (userId && p.userId) return p.userId.toString() !== userId
      return p.email !== email
    })

    await LiveGDRound.collection.updateOne(
      { _id: objectId },
      {
        $set: {
          participants: updatedParticipants,
          pendingParticipants: updatedPending,
          aiParticipants: updatedAiParticipants,
          updatedAt: new Date()
        }
      }
    )

    const updatedRound = await LiveGDRound.collection.findOne({
      _id: objectId
    })

    res.json({
      success: true,
      round: {
        ...updatedRound,
        _id: updatedRound._id.toString()
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Admit user failed",
      error: error.message
    })
  }
})

router.post("/reject-user", async (req, res) => {
  try {
    const { roundId, userId = "", email = "" } = req.body || {}

    if (!roundId || !mongoose.Types.ObjectId.isValid(roundId)) {
      return res.status(400).json({
        success: false,
        message: "Valid room ID required"
      })
    }

    const objectId = new mongoose.Types.ObjectId(roundId)

    const round = await LiveGDRound.collection.findOne({
      _id: objectId
    })

    if (!round) {
      return res.status(404).json({
        success: false,
        message: "GD room not found"
      })
    }

    const updatedPending = (round.pendingParticipants || []).filter((p) => {
      if (userId && p.userId) return p.userId.toString() !== userId
      return p.email !== email
    })

    await LiveGDRound.collection.updateOne(
      { _id: objectId },
      {
        $set: {
          pendingParticipants: updatedPending,
          updatedAt: new Date()
        }
      }
    )

    const updatedRound = await LiveGDRound.collection.findOne({
      _id: objectId
    })

    res.json({
      success: true,
      round: {
        ...updatedRound,
        _id: updatedRound._id.toString()
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Reject user failed",
      error: error.message
    })
  }
})

router.post("/start-room", async (req, res) => {
  try {
    const { roundId } = req.body || {}

    if (!roundId || !mongoose.Types.ObjectId.isValid(roundId)) {
      return res.status(400).json({
        success: false,
        message: "Valid room ID required"
      })
    }

    const objectId = new mongoose.Types.ObjectId(roundId)

    await LiveGDRound.collection.updateOne(
      { _id: objectId },
      {
        $set: {
          meetingStatus: "live",
          status: "active",
          startedAt: new Date(),
          updatedAt: new Date()
        }
      }
    )

    const round = await LiveGDRound.collection.findOne({
      _id: objectId
    })

    if (!round) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      })
    }

    res.json({
      success: true,
      round: {
        ...round,
        _id: round._id.toString()
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Start room failed",
      error: error.message
    })
  }
})

router.post("/transcribe", upload.single("audio"), async (req, res) => {
  let filePath = ""

  try {
    const groq = getGroqClient()

    if (!groq) {
      return res.status(500).json({
        success: false,
        message: "Groq API key missing"
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Audio file is required"
      })
    }

    filePath = path.resolve(req.file.path)

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-large-v3",
      language: "en",
      response_format: "json"
    })

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    res.json({
      success: true,
      text: transcription.text || ""
    })
  } catch (error) {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    res.status(500).json({
      success: false,
      message: "Transcription failed",
      error: error.message
    })
  }
})


const safeJsonParse = (text = "") => {
  try {
    const clean = String(text || "")
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim()

    const start = clean.indexOf("{")
    const end = clean.lastIndexOf("}")

    if (start === -1 || end === -1) return null

    return JSON.parse(clean.slice(start, end + 1))
  } catch {
    return null
  }
}

const buildLiveGDAiPrompt = ({ round, message, name, role }) => `
You are Placiora AI, a professional placement group discussion moderator.

Act like a real recruiter-led GD evaluator:
- Keep the discussion structured and natural.
- Encourage balanced participation.
- Avoid repeating the same generic sentence.
- Ask one sharp follow-up when needed.
- Let AI participants respond with different viewpoints.
- Keep messages concise, interview realistic and company-aware.
- Score the user's latest contribution fairly.

Topic: ${round.topic}
Company: ${round.company}
Difficulty: ${round.difficulty}
Speaker: ${name} (${role})
Latest message: "${message}"

Recent transcript:
${createTranscript((round.messages || []).slice(-10))}

Return JSON only:
{
  "moderatorReply": "one short moderator guidance message",
  "aiReplies": [
    {
      "name": "Priya",
      "role": "AI Participant",
      "personality": "Analytical",
      "message": "specific useful point"
    },
    {
      "name": "Rahul",
      "role": "AI Participant",
      "personality": "Technical",
      "message": "specific useful point"
    }
  ],
  "evaluation": {
    "communicationScore": 0,
    "contentScore": 0,
    "leadershipScore": 0,
    "confidenceScore": 0,
    "relevanceScore": 0,
    "feedback": "short recruiter-style feedback"
  }
}
`

const generateLiveGDAiResponse = async ({ round, message, name, role }) => {
  const activeAi =
    (round.aiParticipants || []).filter((item) => item.active) ||
    getActiveAiParticipants((round.participants || []).length)

  const fallback = {
    moderatorReply:
      "Good point. Now try to connect it with a real example and invite another participant to add their view.",
    aiReplies: activeAi.slice(0, 2).map((ai) => ({
      name: ai.name,
      role: ai.role,
      personality: ai.personality,
      message:
        ai.personality === "Technical"
          ? `From a technical angle, ${round.topic} needs practical examples, measurable impact and realistic solutions.`
          : ai.personality === "Critical Thinker"
          ? `We should also consider risks, ethics and long-term consequences before reaching a conclusion.`
          : `This point can be stronger if we balance benefits, challenges and a practical example.`
    })),
    evaluation: {
      communicationScore: 68,
      contentScore: 66,
      leadershipScore: 62,
      confidenceScore: 66,
      relevanceScore: 70,
      feedback:
        "Good participation. Add a concrete example, acknowledge others and keep your answer structured."
    }
  }

  const groq = getGroqClient()

  if (!groq) return fallback

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.45,
      max_tokens: 900,
      messages: [
        {
          role: "system",
          content:
            "You are a strict JSON generator for a placement group discussion AI moderator."
        },
        {
          role: "user",
          content: buildLiveGDAiPrompt({ round, message, name, role })
        }
      ]
    })

    const parsed = safeJsonParse(completion.choices?.[0]?.message?.content)

    if (!parsed) return fallback

    return {
      moderatorReply: parsed.moderatorReply || fallback.moderatorReply,
      aiReplies:
        Array.isArray(parsed.aiReplies) && parsed.aiReplies.length
          ? parsed.aiReplies.slice(0, 3)
          : fallback.aiReplies,
      evaluation: parsed.evaluation || fallback.evaluation
    }
  } catch {
    return fallback
  }
}


router.post("/speak", async (req, res) => {
  try {
    const {
      roundId,
      message,
      name = "You",
      role = "Candidate",
      userId = ""
    } = req.body || {}

    if (!roundId || !mongoose.Types.ObjectId.isValid(roundId)) {
      return res.status(400).json({
        success: false,
        message: "Valid round ID is required"
      })
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required"
      })
    }

    const objectId = new mongoose.Types.ObjectId(roundId)

    const round = await LiveGDRound.collection.findOne({
      _id: objectId
    })

    if (!round) {
      return res.status(404).json({
        success: false,
        message: "Live GD round not found"
      })
    }

    if (round.meetingStatus !== "live") {
      return res.status(400).json({
        success: false,
        message: "GD has not started yet. Please wait for the host to click Start GD."
      })
    }

    const userMessage = {
      speaker: "user",
      userId,
      name,
      role,
      message: message.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const aiResult = await generateLiveGDAiResponse({
      round,
      message: message.trim(),
      name,
      role
    })

    const moderatorMessage = {
      speaker: "ai",
      name: "Moderator",
      role: "Moderator",
      personality: "Professional Moderator",
      message: aiResult.moderatorReply,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const aiReplies = (aiResult.aiReplies || []).map((ai) => ({
      speaker: "ai",
      name: ai.name || "AI Participant",
      role: ai.role || "AI Participant",
      personality: ai.personality || "Balanced",
      message: ai.message || "I agree, and we should keep the discussion balanced.",
      createdAt: new Date(),
      updatedAt: new Date()
    }))

    const updatedMessages = [
      ...(round.messages || []),
      userMessage,
      moderatorMessage,
      ...aiReplies
    ]

    await LiveGDRound.collection.updateOne(
      { _id: objectId },
      {
        $set: {
          messages: updatedMessages,
          transcript: createTranscript(updatedMessages),
          updatedAt: new Date()
        }
      }
    )

    res.json({
      success: true,
      messages: updatedMessages,
      userMessage,
      aiReplies: [moderatorMessage, ...aiReplies],
      userEvaluation: {
        communicationScore: clampScore(aiResult.evaluation?.communicationScore || 65),
        contentScore: clampScore(aiResult.evaluation?.contentScore || 65),
        leadershipScore: clampScore(aiResult.evaluation?.leadershipScore || 60),
        confidenceScore: clampScore(aiResult.evaluation?.confidenceScore || 65),
        relevanceScore: clampScore(aiResult.evaluation?.relevanceScore || 65),
        feedback:
          aiResult.evaluation?.feedback ||
          "Good participation. Try to add examples and respond to other speakers directly."
      },
      aiParticipants: round.aiParticipants || []
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Live GD speak failed",
      error: process.env.NODE_ENV === "production" ? undefined : error.message
    })
  }
})


router.post("/upload-recording", upload.single("video"), async (req, res) => {
  try {
    const { roundId } = req.body || {}

    if (!roundId || !mongoose.Types.ObjectId.isValid(roundId)) {
      return res.status(400).json({
        success: false,
        message: "Valid round ID is required"
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Recording file is required"
      })
    }

    const objectId = new mongoose.Types.ObjectId(roundId)
    const publicUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`

    await LiveGDRound.collection.updateOne(
      { _id: objectId },
      {
        $set: {
          recordingUrl: publicUrl,
          recordingFilename: req.file.filename,
          recordingUploadedAt: new Date(),
          reportReady: true,
          updatedAt: new Date()
        }
      }
    )

    const round = await LiveGDRound.collection.findOne({ _id: objectId })

    return res.json({
      success: true,
      recordingUrl: publicUrl,
      round: {
        ...round,
        _id: round._id.toString()
      }
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Recording upload failed",
      error: process.env.NODE_ENV === "production" ? undefined : error.message
    })
  }
})


router.post("/finish", async (req, res) => {
  try {
    const { roundId } = req.body || {}

    if (!roundId || !mongoose.Types.ObjectId.isValid(roundId)) {
      return res.status(400).json({
        success: false,
        message: "Valid round ID is required"
      })
    }

    const objectId = new mongoose.Types.ObjectId(roundId)

    const round = await LiveGDRound.collection.findOne({
      _id: objectId
    })

    if (!round) {
      return res.status(404).json({
        success: false,
        message: "Live GD round not found"
      })
    }

    const result = fallbackEvaluation(round.messages || [])

    await LiveGDRound.collection.updateOne(
      { _id: objectId },
      {
        $set: {
          communicationScore: result.communicationScore,
          contentScore: result.contentScore,
          leadershipScore: result.leadershipScore,
          confidenceScore: result.confidenceScore,
          overallScore: result.overallScore,
          feedback: result.feedback,
          strengths: result.strengths,
          weaknesses: result.weaknesses,
          improvedResponse: result.improvedResponse,
          transcript: createTranscript(round.messages || []),
          completed: true,
          status: "completed",
          meetingStatus: "ended",
          endedAt: new Date(),
          updatedAt: new Date()
        }
      }
    )

    const updatedRound = await LiveGDRound.collection.findOne({
      _id: objectId
    })

    res.json({
      success: true,
      round: {
        ...updatedRound,
        _id: updatedRound._id.toString(),
        criticalThinkingScore: result.criticalThinkingScore,
        teamworkScore: result.teamworkScore,
        argumentStrengthScore: result.argumentStrengthScore,
        recruiterVerdict: result.recruiterVerdict
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Live GD evaluation failed",
      error: error.message
    })
  }
})


router.post("/rejoin-room", async (req, res) => {
  try {
    const { roundId, inviteCode, userId, name = "Participant", email = "" } =
      req.body || {}

    const cleanCode = normalizeMeetingCode(inviteCode)

    const query = []

    if (roundId && mongoose.Types.ObjectId.isValid(roundId)) {
      query.push({ _id: new mongoose.Types.ObjectId(roundId) })
    }

    if (cleanCode) {
      query.push({ meetingCode: cleanCode }, { inviteCode: cleanCode })
    }

    if (!query.length) {
      return res.status(400).json({
        success: false,
        message: "Previous meeting code or room ID is required"
      })
    }

    const round = await LiveGDRound.collection.findOne({
      $or: query,
      completed: false,
      meetingStatus: { $ne: "ended" }
    })

    if (!round) {
      return res.status(404).json({
        success: false,
        message: "Previous GD meeting was not found or has ended"
      })
    }

    const participantIndex = (round.participants || []).findIndex((p) => {
      if (userId && p.userId) return p.userId.toString() === userId
      return email && p.email === email
    })

    if (participantIndex === -1) {
      return res.status(403).json({
        success: false,
        message: "You were not previously admitted. Please request to join."
      })
    }

    const updatedParticipants = [...(round.participants || [])]
    updatedParticipants[participantIndex] = {
      ...updatedParticipants[participantIndex],
      name: name || updatedParticipants[participantIndex].name,
      email: email || updatedParticipants[participantIndex].email,
      approved: true,
      status: "approved",
      connected: true,
      micReady: true,
      cameraReady: true,
      micOn: true,
      cameraOn: true,
      joinedAt: updatedParticipants[participantIndex].joinedAt || new Date(),
      lastSeenAt: new Date()
    }

    await LiveGDRound.collection.updateOne(
      { _id: round._id },
      {
        $set: {
          participants: updatedParticipants,
          updatedAt: new Date()
        }
      }
    )

    const updatedRound = await LiveGDRound.collection.findOne({
      _id: round._id
    })

    return res.json({
      success: true,
      isHost: Boolean(updatedParticipants[participantIndex].isHost),
      round: {
        ...updatedRound,
        _id: updatedRound._id.toString()
      }
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to rejoin GD meeting",
      error: process.env.NODE_ENV === "production" ? undefined : error.message
    })
  }
})


router.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.json({
        success: true,
        rounds: []
      })
    }

    const objectId = new mongoose.Types.ObjectId(userId)

    const rounds = await LiveGDRound.collection
      .find({
        $or: [{ userId: objectId }, { "participants.userId": objectId }]
      })
      .sort({ createdAt: -1 })
      .toArray()

    res.json({
      success: true,
      rounds: rounds.map((round) => ({
        ...round,
        _id: round._id.toString(),
        recordingUrl: round.recordingUrl || "",
        reportReady: Boolean(round.reportReady || round.completed),
        type: "Live GD Round"
      }))
    })
  } catch {
    res.json({
      success: true,
      rounds: []
    })
  }
})


router.get("/history-user/:userId", async (req, res) => {
  try {
    const { userId } = req.params
    const email = String(req.query.email || "").trim()

    const query = []

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      const objectId = new mongoose.Types.ObjectId(userId)
      query.push({ userId: objectId })
      query.push({ "participants.userId": objectId })
    }

    if (email) {
      query.push({ "participants.email": email })
    }

    if (!query.length) {
      return res.json({
        success: true,
        rounds: []
      })
    }

    const rounds = await LiveGDRound.collection
      .find({ $or: query })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    return res.json({
      success: true,
      rounds: rounds.map((round) => ({
        ...round,
        _id: round._id.toString(),
        recordingUrl: round.recordingUrl || "",
        reportReady: Boolean(round.reportReady || round.completed),
        type: "Live GD Round"
      }))
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load Live GD history",
      error: process.env.NODE_ENV === "production" ? undefined : error.message
    })
  }
})



const drawReportHeader = (doc, round) => {
  const pageWidth = doc.page.width

  doc.rect(0, 0, pageWidth, 128).fill("#020617")

  doc
    .fontSize(25)
    .fillColor("#ffffff")
    .text("Placiora AI", 44, 34)

  doc
    .fontSize(10)
    .fillColor("#67e8f9")
    .text("Live Group Discussion Performance Report", 44, 66)

  doc
    .fontSize(8)
    .fillColor("#cbd5e1")
    .text(`Generated on ${new Date().toLocaleString()}`, 44, 88)

  doc
    .roundedRect(pageWidth - 190, 34, 145, 52, 12)
    .fill("#0f172a")
    .strokeColor("#22d3ee")
    .stroke()

  doc
    .fontSize(8)
    .fillColor("#94a3b8")
    .text("OVERALL SCORE", pageWidth - 170, 47)

  doc
    .fontSize(22)
    .fillColor("#67e8f9")
    .text(`${round.overallScore || 0}%`, pageWidth - 170, 60)

  doc.fillColor("#000000")
}

const drawReportSectionTitle = (doc, title, y) => {
  doc
    .fontSize(13)
    .fillColor("#0f172a")
    .text(title.toUpperCase(), 44, y)

  doc
    .moveTo(44, y + 18)
    .lineTo(550, y + 18)
    .strokeColor("#22d3ee")
    .lineWidth(1)
    .stroke()

  return y + 30
}

const drawScoreCard = (doc, label, score, x, y, width = 96) => {
  const safeScore = clampScore(score)

  doc
    .roundedRect(x, y, width, 62, 12)
    .fill("#f8fafc")
    .strokeColor("#dbeafe")
    .stroke()

  doc
    .fontSize(8)
    .fillColor("#64748b")
    .text(label, x + 10, y + 11, { width: width - 20 })

  doc
    .fontSize(19)
    .fillColor("#0f172a")
    .text(`${safeScore}%`, x + 10, y + 29)

  doc
    .roundedRect(x + 10, y + 51, width - 20, 5, 2)
    .fill("#e2e8f0")

  doc
    .roundedRect(x + 10, y + 51, ((width - 20) * safeScore) / 100, 5, 2)
    .fill("#06b6d4")
}

const drawBulletList = (doc, items = [], x, y, width) => {
  const safeItems = Array.isArray(items) && items.length ? items : ["No data available."]

  safeItems.forEach((item) => {
    doc
      .fontSize(9.5)
      .fillColor("#334155")
      .text(`• ${item}`, x, y, {
        width,
        lineGap: 2
      })

    y = doc.y + 5
  })

  return y
}

router.get("/report/:roundId", async (req, res) => {
  try {
    const { roundId } = req.params

    if (!roundId || !mongoose.Types.ObjectId.isValid(roundId)) {
      return res.status(400).json({
        success: false,
        message: "Valid Live GD round ID is required"
      })
    }

    const round = await LiveGDRound.collection.findOne({
      _id: new mongoose.Types.ObjectId(roundId)
    })

    if (!round) {
      return res.status(404).json({
        success: false,
        message: "Live GD round not found"
      })
    }

    const doc = new PDFDocument({
      margin: 0,
      size: "A4",
      bufferPages: true
    })

    const safeTopic = String(round.topic || "Live-GD")
      .replace(/[^a-z0-9]/gi, "-")
      .slice(0, 60)

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Placiora-Live-GD-Report-${safeTopic}.pdf"`
    )

    doc.pipe(res)

    drawReportHeader(doc, round)

    let y = 155

    doc
      .fontSize(19)
      .fillColor("#0f172a")
      .text(round.topic || "Live Group Discussion", 44, y, {
        width: 360
      })

    doc
      .fontSize(9.5)
      .fillColor("#64748b")
      .text(
        `${round.company || "General"} • ${round.difficulty || "Beginner"} • ${round.meetingCode || "N/A"}`,
        44,
        y + 28
      )

    doc
      .roundedRect(420, y, 130, 44, 10)
      .fill("#ecfeff")
      .strokeColor("#a5f3fc")
      .stroke()

    doc
      .fontSize(8)
      .fillColor("#0891b2")
      .text("RECRUITER VERDICT", 434, y + 10)

    doc
      .fontSize(11)
      .fillColor("#0f172a")
      .text(round.recruiterVerdict || "Not Available", 434, y + 25, {
        width: 102
      })

    y += 78

    y = drawReportSectionTitle(doc, "Performance Scorecard", y)

    drawScoreCard(doc, "Communication", round.communicationScore, 44, y)
    drawScoreCard(doc, "Content", round.contentScore, 150, y)
    drawScoreCard(doc, "Leadership", round.leadershipScore, 256, y)
    drawScoreCard(doc, "Confidence", round.confidenceScore, 362, y)
    drawScoreCard(doc, "Overall", round.overallScore, 468, y)

    y += 92
    y = drawReportSectionTitle(doc, "Recruiter Feedback", y)

    doc
      .fontSize(10.5)
      .fillColor("#334155")
      .text(round.feedback || "No feedback available.", 44, y, {
        width: 506,
        lineGap: 4
      })

    y = doc.y + 24

    y = drawReportSectionTitle(doc, "Strengths & Improvement Areas", y)

    doc
      .roundedRect(44, y, 245, 132, 12)
      .fill("#f0fdf4")
      .strokeColor("#bbf7d0")
      .stroke()

    doc
      .fontSize(11)
      .fillColor("#166534")
      .text("Strengths", 60, y + 14)

    drawBulletList(doc, round.strengths || [], 60, y + 36, 210)

    doc
      .roundedRect(305, y, 245, 132, 12)
      .fill("#fef2f2")
      .strokeColor("#fecaca")
      .stroke()

    doc
      .fontSize(11)
      .fillColor("#991b1b")
      .text("Improvement Areas", 321, y + 14)

    drawBulletList(doc, round.weaknesses || [], 321, y + 36, 210)

    y += 160

    y = drawReportSectionTitle(doc, "Improved GD Response", y)

    doc
      .fontSize(10)
      .fillColor("#334155")
      .text(round.improvedResponse || "No improved response available.", 44, y, {
        width: 506,
        lineGap: 4
      })

    y = doc.y + 24

    y = drawReportSectionTitle(doc, "Session Assets", y)

    doc
      .fontSize(9.5)
      .fillColor("#334155")
      .text(`Recording: ${round.recordingUrl || "Not available"}`, 44, y, {
        width: 506
      })

    doc
      .fontSize(9.5)
      .fillColor("#334155")
      .text(`Participants: ${(round.participants || []).map((p) => p.name).filter(Boolean).join(", ") || "Not available"}`, 44, y + 18, {
        width: 506
      })

    if ((round.messages || []).length > 0) {
      doc.addPage()
      drawReportHeader(doc, round)

      let tY = 155
      tY = drawReportSectionTitle(doc, "Live GD Transcript", tY)

      ;(round.messages || []).slice(0, 45).forEach((msg) => {
        if (tY > 740) {
          doc.addPage()
          drawReportHeader(doc, round)
          tY = 155
        }

        doc
          .fontSize(9.5)
          .fillColor(msg.speaker === "ai" ? "#7c3aed" : "#0f172a")
          .text(`${msg.name || "Speaker"} (${msg.role || msg.speaker || "Participant"})`, 44, tY, {
            width: 506
          })

        doc
          .fontSize(9)
          .fillColor("#334155")
          .text(msg.message || "", 44, tY + 14, {
            width: 506,
            lineGap: 3
          })

        tY = doc.y + 12
      })
    }

    const range = doc.bufferedPageRange()
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i)
      doc
        .fontSize(8)
        .fillColor("#94a3b8")
        .text(
          "Generated by Placiora AI — Your Personal Placement Copilot",
          44,
          810,
          { align: "center", width: 506 }
        )
    }

    doc.end()
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Live GD report download failed",
      error: process.env.NODE_ENV === "production" ? undefined : error.message
    })
  }
})


export default router