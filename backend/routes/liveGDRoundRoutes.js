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
  "Netflix",
  "Adobe",
  "Oracle",
  "IBM",
  "Intel",
  "NVIDIA",
  "Goldman Sachs",
  "JP Morgan",
  "Deloitte",
  "Accenture",
  "Capgemini",
  "Infosys",
  "TCS",
  "Wipro",
  "Cognizant",
  "HCL",
  "Tech Mahindra",
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
  {
    name: "Priya",
    role: "AI Participant",
    personality: "Analytical",
    style:
      "balanced, structured, calm, gives logical points and supports with examples"
  },
  {
    name: "Rahul",
    role: "AI Participant",
    personality: "Technical",
    style:
      "confident, practical, industry-focused, sometimes challenges weak arguments"
  },
  {
    name: "Aarav",
    role: "AI Participant",
    personality: "Leader",
    style:
      "takes initiative, summarizes, connects points and encourages group flow"
  },
  {
    name: "Neha",
    role: "AI Participant",
    personality: "Critical Thinker",
    style:
      "questions assumptions, gives counterpoints, highlights risks and ethics"
  }
]

const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

const getActiveAiParticipants = (humanCount = 1) => {
  const needed = Math.max(0, 5 - Number(humanCount || 0))

  return AI_PARTICIPANTS.slice(0, needed).map((item) => ({
    name: item.name,
    role: item.role,
    personality: item.personality,
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

const clampScore = (value) => {
  const num = Number(value) || 0
  return Math.min(100, Math.max(0, Math.round(num)))
}

const extractJSON = (text = "") => {
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)

    if (!match) return null

    try {
      return JSON.parse(match[0])
    } catch {
      return null
    }
  }
}

const createTranscript = (messages = []) => {
  return messages
    .map((item) => `${item.name || "Speaker"}: ${item.message || ""}`)
    .join("\n")
}

const openingMessages = (topic, humanCount = 1) => {
  const activeAi = getActiveAiParticipants(humanCount)

  const base = [
    {
      speaker: "ai",
      name: "Moderator",
      role: "Moderator",
      personality: "Moderator",
      message: `Welcome everyone. Today's group discussion topic is: ${topic}. Please speak clearly, support your points with examples, respond to others, and try to conclude with a balanced view.`
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
    base.push({
      speaker: "ai",
      name: ai.name,
      role: "AI Participant",
      personality: ai.personality,
      message: introMap[ai.name] || "I am ready to contribute to the discussion."
    })
  })

  return base
}

const fallbackAiReplies = (topic, activeAi = []) => {
  if (!activeAi.length) {
    return [
      {
        speaker: "ai",
        name: "Moderator",
        role: "Moderator",
        personality: "Moderator",
        message:
          "Thank you for the point. Please add one example and also respond to another participant's view to make your argument stronger."
      }
    ]
  }

  const fallbackMap = {
    Priya: `That's a valid point. I would add that for ${topic}, we should compare both short-term and long-term impact.`,
    Rahul:
      "I partially agree, but this point becomes stronger if we support it with a real example or data.",
    Aarav:
      "Let me connect this with the group flow. We can divide the discussion into opportunities, risks and solutions.",
    Neha:
      "I would like to challenge one part of that. We should also discuss who may be negatively affected."
  }

  return activeAi.slice(0, 3).map((ai) => ({
    speaker: "ai",
    name: ai.name,
    role: "AI Participant",
    personality: ai.personality,
    message:
      fallbackMap[ai.name] ||
      `I agree partly. For ${topic}, we should keep the answer balanced with examples.`
  }))
}

const fallbackUserEvaluation = () => ({
  communicationScore: 65,
  contentScore: 65,
  leadershipScore: 60,
  confidenceScore: 65,
  relevanceScore: 65,
  feedback:
    "Good participation. Try to add examples, respond to other speakers directly and structure your point more clearly."
})

const fallbackEvaluation = (messages = []) => {
  const userText = messages
    .filter((item) => item.speaker === "user")
    .map((item) => item.message || "")
    .join(" ")

  const words = userText.split(/\s+/).filter(Boolean).length

  let score = 45

  if (words > 20) score += 10
  if (words > 50) score += 10
  if (words > 90) score += 10
  if (userText.toLowerCase().includes("example")) score += 8
  if (userText.toLowerCase().includes("solution")) score += 7
  if (userText.toLowerCase().includes("agree")) score += 5

  const finalScore = clampScore(score)

  return {
    communicationScore: finalScore,
    contentScore: clampScore(finalScore + 3),
    leadershipScore: clampScore(finalScore - 2),
    confidenceScore: finalScore,
    criticalThinkingScore: clampScore(finalScore - 1),
    teamworkScore: clampScore(finalScore + 2),
    argumentStrengthScore: clampScore(finalScore),
    overallScore: finalScore,
    recruiterVerdict:
      finalScore >= 80
        ? "Likely Selected"
        : finalScore >= 65
        ? "Borderline Select"
        : "Needs Improvement",
    feedback:
      words === 0
        ? "You did not participate enough in the discussion. Try to share at least two structured points with examples."
        : "Good attempt. Try to speak in a more structured way, acknowledge others' points, add examples, and conclude with a balanced view.",
    strengths:
      words === 0
        ? ["Started the GD round"]
        : ["Participated in the discussion", "Shared your viewpoint"],
    weaknesses:
      words === 0
        ? ["No meaningful response given", "Needs active participation"]
        : ["Needs stronger structure", "Needs more examples"],
    improvedResponse:
      "I agree with the previous point, and I would like to add a balanced perspective. This topic has both opportunities and risks. For example, technology can improve productivity, but people also need reskilling. So, the best solution is responsible adoption with proper training."
  }
}

router.get("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Live GD round route working"
  })
})

router.get("/companies", (req, res) => {
  res.status(200).json({
    success: true,
    companies: companyOptions
  })
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

    res.status(200).json({
      success: true,
      text: transcription.text || ""
    })
  } catch (error) {
    console.log("Live GD transcription error:", error)

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

    const inviteCode = generateInviteCode()
    const meetingCode = inviteCode
    const inviteLink = `${FRONTEND_URL}/live-gd-round?invite=${inviteCode}`

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
        cameraReady: false
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
      inviteCode,
      meetingCode,
      inviteLink,
      meetingStatus: "live",
      requiresApproval: true,
      isMultiplayer: true,
      maxParticipants: 5,
      participants,
      pendingParticipants: [],
      aiParticipants,
      messages,
      transcript: createTranscript(messages),
      startedAt: new Date(),
      completed: false
    })

    res.status(201).json({
      success: true,
      roundId: round._id,
      inviteCode: round.inviteCode,
      meetingCode: round.meetingCode,
      inviteLink: round.inviteLink,
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

router.post("/join-room", async (req, res) => {
  try {
    const { inviteCode, userId, name = "Participant", email = "" } =
      req.body || {}

    if (!inviteCode) {
      return res.status(400).json({
        success: false,
        message: "Meeting code is required"
      })
    }

    const cleanCode = inviteCode.trim().toUpperCase()

    const round = await LiveGDRound.findOne({
      $or: [{ inviteCode: cleanCode }, { meetingCode: cleanCode }]
    })

    if (!round) {
      return res.status(404).json({
        success: false,
        message: "GD meeting not found"
      })
    }

    if (round.completed || round.meetingStatus === "ended") {
      return res.status(400).json({
        success: false,
        message: "This GD meeting is already completed"
      })
    }

    const alreadyParticipant = round.participants.some((participant) => {
      if (userId && participant.userId) {
        return participant.userId.toString() === userId
      }

      return participant.email && participant.email === email
    })

    if (alreadyParticipant) {
      return res.status(200).json({
        success: true,
        admitted: true,
        waiting: false,
        round
      })
    }

    if (round.participants.length >= round.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: "GD meeting is full. Maximum 5 human members can join."
      })
    }

    const alreadyPending = round.pendingParticipants.some((participant) => {
      if (userId && participant.userId) {
        return participant.userId.toString() === userId
      }

      return participant.email && participant.email === email
    })

    if (!alreadyPending) {
      round.pendingParticipants.push({
        userId:
          userId && mongoose.Types.ObjectId.isValid(userId)
            ? new mongoose.Types.ObjectId(userId)
            : null,
        name,
        email,
        role: "Participant"
      })

      await round.save()
    }

    res.status(200).json({
      success: true,
      admitted: false,
      waiting: true,
      message: "Join request sent. Waiting for host approval.",
      round
    })
  } catch (error) {
    console.log("Join Live GD room error:", error)

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

    if (round.participants.length >= round.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: "Room already has 5 human members"
      })
    }

    const pending = round.pendingParticipants.find((participant) => {
      if (userId && participant.userId) {
        return participant.userId.toString() === userId
      }

      return email && participant.email === email
    })

    if (!pending) {
      return res.status(404).json({
        success: false,
        message: "Pending user not found"
      })
    }

    round.pendingParticipants = round.pendingParticipants.filter(
      (participant) => {
        if (userId && participant.userId) {
          return participant.userId.toString() !== userId
        }

        return participant.email !== email
      }
    )

    round.participants.push({
      userId: pending.userId || null,
      name: pending.name,
      email: pending.email,
      role: "Participant",
      isHost: false,
      micReady: false,
      cameraReady: false
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

    round.pendingParticipants = round.pendingParticipants.filter(
      (participant) => {
        if (userId && participant.userId) {
          return participant.userId.toString() !== userId
        }

        return participant.email !== email
      }
    )

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

router.post("/speak", async (req, res) => {
  try {
    const {
      roundId,
      message,
      name = "You",
      role = "Candidate",
      userId = null
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

    const round = await LiveGDRound.findById(roundId)

    if (!round) {
      return res.status(404).json({
        success: false,
        message: "Live GD round not found"
      })
    }

    if (round.completed || round.meetingStatus === "ended") {
      return res.status(400).json({
        success: false,
        message: "This GD round is already completed"
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

    const groq = getGroqClient()
    let aiReplies = fallbackAiReplies(round.topic, activeAi)
    let userEvaluation = fallbackUserEvaluation()

    if (groq) {
      try {
        const aiListForPrompt =
          activeAi.length > 0
            ? activeAi
                .map((p) => {
                  const full = AI_PARTICIPANTS.find((x) => x.name === p.name)
                  return `- ${p.name}: ${p.personality}, style: ${
                    full?.style || "balanced GD participant"
                  }`
                })
                .join("\n")
            : "- Moderator only: ask follow-up questions and keep the GD structured."

        const prompt = `
You are running a realistic campus placement group discussion.

Topic: ${round.topic}
Difficulty: ${round.difficulty}
Company: ${round.company}

Active AI Members:
${aiListForPrompt}

Conversation so far:
${createTranscript(round.messages)}

Candidate ${name} said:
${message}

Generate realistic GD reactions.
If active AI members are available, generate replies from 1 to 3 AI participants.
If no active AI members are available, generate one Moderator reply only.
Also evaluate the candidate's latest answer.

Return ONLY valid JSON:
{
  "aiReplies": [
    {
      "speaker": "ai",
      "name": "Priya",
      "role": "AI Participant",
      "personality": "Analytical",
      "message": ""
    }
  ],
  "userEvaluation": {
    "communicationScore": 0,
    "contentScore": 0,
    "leadershipScore": 0,
    "confidenceScore": 0,
    "relevanceScore": 0,
    "feedback": ""
  }
}

Rules:
- Use only active AI members listed above.
- If no active AI members are listed, use only Moderator.
- AI replies should feel like a normal GD.
- At least one reply should agree, expand, challenge, or ask for clarity.
- Keep every reply under 55 words.
- Do not overpraise.
- Scores must be 0 to 100.
`

        const response = await Promise.race([
          groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.55
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("GD AI timeout")), 18000)
          )
        ])

        const parsed = extractJSON(response.choices?.[0]?.message?.content)

        if (parsed?.aiReplies && Array.isArray(parsed.aiReplies)) {
          const allowedNames =
            activeAi.length > 0
              ? activeAi.map((item) => item.name)
              : ["Moderator"]

          aiReplies = parsed.aiReplies
            .filter((reply) => reply?.message)
            .filter((reply) => allowedNames.includes(reply.name || "Moderator"))
            .slice(0, activeAi.length > 0 ? 3 : 1)
            .map((reply) => ({
              speaker: "ai",
              name: reply.name || (activeAi.length ? "Priya" : "Moderator"),
              role:
                reply.name === "Moderator"
                  ? "Moderator"
                  : reply.role || "AI Participant",
              personality:
                reply.name === "Moderator"
                  ? "Moderator"
                  : reply.personality || "Balanced",
              message: reply.message
            }))
        }

        if (parsed?.userEvaluation) {
          userEvaluation = {
            communicationScore: clampScore(
              parsed.userEvaluation.communicationScore
            ),
            contentScore: clampScore(parsed.userEvaluation.contentScore),
            leadershipScore: clampScore(parsed.userEvaluation.leadershipScore),
            confidenceScore: clampScore(parsed.userEvaluation.confidenceScore),
            relevanceScore: clampScore(parsed.userEvaluation.relevanceScore),
            feedback:
              parsed.userEvaluation.feedback || userEvaluation.feedback
          }
        }
      } catch (error) {
        console.log("Live GD AI multi-reply fallback:", error.message)
      }
    }

    round.messages.push(...aiReplies)
    round.transcript = createTranscript(round.messages)

    await round.save()

    res.status(200).json({
      success: true,
      messages: round.messages,
      userMessage,
      aiReplies,
      userEvaluation,
      aiParticipants: round.aiParticipants
    })
  } catch (error) {
    console.log("Live GD speak error:", error)

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

    const groq = getGroqClient()
    let result = fallbackEvaluation(round.messages)

    if (groq) {
      try {
        const prompt = `
You are a campus placement GD evaluator.

Topic:
${round.topic}

Difficulty:
${round.difficulty}

Company:
${round.company}

Discussion:
${createTranscript(round.messages)}

Evaluate the main candidate/host and overall GD performance.

Return ONLY valid JSON:
{
  "communicationScore": 0,
  "contentScore": 0,
  "leadershipScore": 0,
  "confidenceScore": 0,
  "criticalThinkingScore": 0,
  "teamworkScore": 0,
  "argumentStrengthScore": 0,
  "overallScore": 0,
  "recruiterVerdict": "",
  "feedback": "",
  "strengths": [],
  "weaknesses": [],
  "improvedResponse": ""
}

Rules:
- Scores must be 0 to 100.
- Be realistic.
- Evaluate structure, clarity, content, examples, leadership, listening, teamwork, critical thinking and confidence.
- Mention one specific improvement.
`

        const response = await Promise.race([
          groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.35
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("GD evaluation timeout")), 18000)
          )
        ])

        const parsed = extractJSON(response.choices?.[0]?.message?.content)

        if (parsed) {
          const overall = clampScore(parsed.overallScore)

          result = {
            communicationScore: clampScore(parsed.communicationScore),
            contentScore: clampScore(parsed.contentScore),
            leadershipScore: clampScore(parsed.leadershipScore),
            confidenceScore: clampScore(parsed.confidenceScore),
            criticalThinkingScore: clampScore(parsed.criticalThinkingScore),
            teamworkScore: clampScore(parsed.teamworkScore),
            argumentStrengthScore: clampScore(parsed.argumentStrengthScore),
            overallScore: overall,
            recruiterVerdict:
              parsed.recruiterVerdict ||
              (overall >= 80
                ? "Likely Selected"
                : overall >= 65
                ? "Borderline Select"
                : "Needs Improvement"),
            feedback: parsed.feedback || result.feedback,
            strengths: Array.isArray(parsed.strengths)
              ? parsed.strengths
              : result.strengths,
            weaknesses: Array.isArray(parsed.weaknesses)
              ? parsed.weaknesses
              : result.weaknesses,
            improvedResponse: parsed.improvedResponse || result.improvedResponse
          }
        }
      } catch (error) {
        console.log("Live GD evaluation fallback:", error.message)
      }
    }

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
    round.meetingStatus = "ended"
    round.endedAt = new Date()

    await round.save()

    const responseRound = {
      ...round.toObject(),
      criticalThinkingScore: result.criticalThinkingScore,
      teamworkScore: result.teamworkScore,
      argumentStrengthScore: result.argumentStrengthScore,
      recruiterVerdict: result.recruiterVerdict
    }

    res.status(200).json({
      success: true,
      round: responseRound
    })
  } catch (error) {
    console.log("Live GD finish error:", error)

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
      return res.status(200).json({
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

    res.status(200).json({
      success: true,
      rounds
    })
  } catch (error) {
    console.log("Live GD history error:", error.message)

    res.status(200).json({
      success: true,
      rounds: []
    })
  }
})

export default router