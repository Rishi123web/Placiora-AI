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

    console.log("LIVE GD ROOM SAVED RAW:", {
      id: inserted.insertedId.toString(),
      meetingCode,
      inviteCode,
      inviteLink
    })

    res.status(201).json({
      success: true,
      roundId: inserted.insertedId.toString(),
      meetingCode,
      inviteCode,
      inviteLink,
      round
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

    const userMessage = {
      speaker: "user",
      userId,
      name,
      role,
      message: message.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const activeAi =
      (round.aiParticipants || []).filter((item) => item.active) ||
      getActiveAiParticipants((round.participants || []).length)

    const aiReplies = activeAi.slice(0, 3).map((ai) => ({
      speaker: "ai",
      name: ai.name,
      role: ai.role,
      personality: ai.personality,
      message: `That's a valid point. For ${round.topic}, we should keep the discussion balanced with examples and solutions.`,
      createdAt: new Date(),
      updatedAt: new Date()
    }))

    const updatedMessages = [...(round.messages || []), userMessage, ...aiReplies]

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
      aiParticipants: round.aiParticipants || []
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
        _id: round._id.toString()
      }))
    })
  } catch {
    res.json({
      success: true,
      rounds: []
    })
  }
})

export default router