import express from "express"
import mongoose from "mongoose"
import OpenAI from "openai"
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
    cb(null, `live-gd-${Date.now()}.webm`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }
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
  } catch {}

  return value
    .replace("/live-gd-round?invite=", "")
    .replace("invite=", "")
    .trim()
    .toUpperCase()
}

const getUniqueMeetingCode = async () => {
  for (let i = 0; i < 10; i++) {
    const code = generateMeetingCode()

    const exists = await LiveGDRound.exists({
      $or: [{ inviteCode: code }, { meetingCode: code }]
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

    console.log("LIVE GD CODE GENERATED:", meetingCode)
    console.log("LIVE GD LINK GENERATED:", inviteLink)

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

    const round = await LiveGDRound.create({
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

      completed: false,
      startedAt: null,
      endedAt: null
    })

    console.log("LIVE GD ROOM SAVED:", {
      id: round._id.toString(),
      meetingCode: round.meetingCode,
      inviteCode: round.inviteCode,
      inviteLink: round.inviteLink
    })

    res.status(201).json({
      success: true,
      roundId: round._id.toString(),
      meetingCode: round.meetingCode,
      inviteCode: round.inviteCode,
      inviteLink: round.inviteLink,
      round: {
        ...round.toObject(),
        _id: round._id.toString(),
        meetingCode: round.meetingCode,
        inviteCode: round.inviteCode,
        inviteLink: round.inviteLink
      }
    })
  } catch (error) {
    console.log("Create Live GD room error:", error)

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

    const round = await LiveGDRound.findOne({
      $or: [{ inviteCode: cleanCode }, { meetingCode: cleanCode }]
    })

    if (!round) {
      return res.status(404).json({
        success: false,
        message: `GD meeting not found for code: ${cleanCode}`
      })
    }

    res.json({
      success: true,
      round
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

    const round = await LiveGDRound.findOne({
      $or: [{ inviteCode: cleanCode }, { meetingCode: cleanCode }],
      completed: false,
      meetingStatus: { $ne: "ended" }
    })

    if (!round) {
      return res.status(404).json({
        success: false,
        message: `GD meeting not found for code: ${cleanCode}`
      })
    }

    const alreadyParticipant = round.participants.some((p) => {
      if (userId && p.userId) return p.userId.toString() === userId
      return email && p.email === email
    })

    if (alreadyParticipant) {
      return res.json({
        success: true,
        admitted: true,
        waiting: false,
        round
      })
    }

    const humanParticipants = round.participants.filter(
      (p) => p.role !== "AI Participant"
    ).length

    if (humanParticipants >= round.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: "GD meeting is full"
      })
    }

    const alreadyPending = round.pendingParticipants.some((p) => {
      if (userId && p.userId) return p.userId.toString() === userId
      return email && p.email === email
    })

    if (!alreadyPending) {
      round.pendingParticipants.push({
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
      })

      await round.save()
    }

    res.json({
      success: true,
      admitted: false,
      waiting: true,
      message: "Join request sent. Waiting for host approval.",
      round
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

    const round = await LiveGDRound.findById(roundId)

    if (!round) {
      return res.status(404).json({
        success: false,
        message: "GD room not found"
      })
    }

    res.json({
      success: true,
      round
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

    const round = await LiveGDRound.findById(roundId)

    if (!round) {
      return res.status(404).json({
        success: false,
        message: "GD room not found"
      })
    }

    const humanParticipants = round.participants.filter(
      (p) => p.role !== "AI Participant"
    ).length

    if (humanParticipants >= round.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: "Room already has 5 human members"
      })
    }

    const pending = round.pendingParticipants.find((p) => {
      if (userId && p.userId) return p.userId.toString() === userId
      return email && p.email === email
    })

    if (!pending) {
      return res.status(404).json({
        success: false,
        message: "Pending user not found"
      })
    }

    round.pendingParticipants = round.pendingParticipants.filter((p) => {
      if (userId && p.userId) return p.userId.toString() !== userId
      return p.email !== email
    })

    round.participants.push({
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
    })

    round.aiParticipants = getActiveAiParticipants(round.participants.length)

    await round.save()

    res.json({
      success: true,
      round
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

    const round = await LiveGDRound.findById(roundId)

    if (!round) {
      return res.status(404).json({
        success: false,
        message: "GD room not found"
      })
    }

    round.pendingParticipants = round.pendingParticipants.filter((p) => {
      if (userId && p.userId) return p.userId.toString() !== userId
      return p.email !== email
    })

    await round.save()

    res.json({
      success: true,
      round
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

    const round = await LiveGDRound.findById(roundId)

    if (!round) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      })
    }

    round.meetingStatus = "live"
    round.status = "active"
    round.startedAt = round.startedAt || new Date()

    await round.save()

    res.json({
      success: true,
      round
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

router.post("/speak", async (req, res) => {
  try {
    const { roundId, message, name = "You", role = "Candidate", userId = "" } =
      req.body || {}

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

    const round = await LiveGDRound.findById(roundId)

    if (!round) {
      return res.status(404).json({
        success: false,
        message: "Live GD round not found"
      })
    }

    const activeAi =
      round.aiParticipants?.filter((item) => item.active) ||
      getActiveAiParticipants(round.participants.length)

    const userMessage = {
      speaker: "user",
      userId,
      name,
      role,
      message: message.trim()
    }

    round.messages.push(userMessage)

    const aiReplies = activeAi.slice(0, 3).map((ai) => ({
      speaker: "ai",
      name: ai.name,
      role: ai.role,
      personality: ai.personality,
      message: `That's a valid point. For ${round.topic}, we should keep the discussion balanced with examples and solutions.`
    }))

    round.messages.push(...aiReplies)
    round.transcript = createTranscript(round.messages)

    await round.save()

    res.json({
      success: true,
      messages: round.messages,
      userMessage,
      aiReplies,
      userEvaluation: {
        communicationScore: 65,
        contentScore: 65,
        leadershipScore: 60,
        confidenceScore: 65,
        relevanceScore: 65,
        feedback:
          "Good participation. Try to add examples and respond to other speakers directly."
      },
      aiParticipants: round.aiParticipants
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Live GD speak failed",
      error: error.message
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

    const round = await LiveGDRound.findById(roundId)

    if (!round) {
      return res.status(404).json({
        success: false,
        message: "Live GD round not found"
      })
    }

    const result = fallbackEvaluation(round.messages)

    round.communicationScore = result.communicationScore
    round.contentScore = result.contentScore
    round.leadershipScore = result.leadershipScore
    round.confidenceScore = result.confidenceScore
    round.overallScore = result.overallScore
    round.feedback = result.feedback
    round.strengths = result.strengths
    round.weaknesses = result.weaknesses
    round.improvedResponse = result.improvedResponse
    round.transcript = createTranscript(round.messages)
    round.completed = true
    round.status = "completed"
    round.meetingStatus = "ended"
    round.endedAt = new Date()

    await round.save()

    res.json({
      success: true,
      round: {
        ...round.toObject(),
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

    const rounds = await LiveGDRound.find({
      $or: [{ userId: objectId }, { "participants.userId": objectId }]
    })
      .sort({ createdAt: -1 })
      .lean()

    res.json({
      success: true,
      rounds
    })
  } catch {
    res.json({
      success: true,
      rounds: []
    })
  }
})

export default router