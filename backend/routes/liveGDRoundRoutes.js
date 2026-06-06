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

const openingMessages = (topic) => [
  {
    speaker: "ai",
    name: "Moderator",
    role: "Moderator",
    personality: "Moderator",
    message: `Welcome everyone. Today's group discussion topic is: ${topic}. Please speak clearly, support your points with examples, respond to others, and try to conclude with a balanced view.`
  },
  {
    speaker: "ai",
    name: "Priya",
    role: "AI Participant",
    personality: "Analytical",
    message:
      "I think we should first define the topic and then discuss both positive and negative sides."
  },
  {
    speaker: "ai",
    name: "Rahul",
    role: "AI Participant",
    personality: "Technical",
    message:
      "I agree. We should also bring practical industry examples and not keep the discussion theoretical."
  },
  {
    speaker: "ai",
    name: "Neha",
    role: "AI Participant",
    personality: "Critical Thinker",
    message:
      "Along with benefits, we should not ignore risks, ethics and long-term consequences."
  }
]

const fallbackAiReplies = (topic) => [
  {
    speaker: "ai",
    name: "Priya",
    role: "AI Participant",
    personality: "Analytical",
    message: `That's a valid point. I would add that for ${topic}, we should compare both short-term and long-term impact.`
  },
  {
    speaker: "ai",
    name: "Rahul",
    role: "AI Participant",
    personality: "Technical",
    message:
      "I partially agree, but this point becomes stronger if we support it with a real example or data."
  },
  {
    speaker: "ai",
    name: "Neha",
    role: "AI Participant",
    personality: "Critical Thinker",
    message:
      "I would like to challenge one part of that. We should also discuss who may be negatively affected."
  }
]

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
    const inviteLink = `http://localhost:5173/live-gd-round?invite=${inviteCode}`
    const messages = openingMessages(topic)

    const participants = []

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      participants.push({
        userId: new mongoose.Types.ObjectId(userId),
        name,
        email,
        role: "Host",
        micReady: false,
        cameraReady: false
      })
    }

    const round = await LiveGDRound.create({
      userId:
        userId && mongoose.Types.ObjectId.isValid(userId)
          ? new mongoose.Types.ObjectId(userId)
          : null,
      topic,
      difficulty,
      company,
      inviteCode,
      inviteLink,
      isMultiplayer: true,
      maxParticipants: 5,
      participants,
      messages,
      transcript: createTranscript(messages),
      completed: false
    })

    res.status(201).json({
      success: true,
      roundId: round._id,
      inviteCode: round.inviteCode,
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
        message: "Invite code is required"
      })
    }

    const round = await LiveGDRound.findOne({ inviteCode })

    if (!round) {
      return res.status(404).json({
        success: false,
        message: "GD room not found"
      })
    }

    if (round.completed) {
      return res.status(400).json({
        success: false,
        message: "This GD room is already completed"
      })
    }

    const alreadyJoined = round.participants.some((participant) => {
      if (userId && participant.userId) {
        return participant.userId.toString() === userId
      }

      return participant.email && participant.email === email
    })

    if (!alreadyJoined && round.participants.length >= round.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: "GD room is full. Maximum 5 members can join."
      })
    }

    if (!alreadyJoined) {
      round.participants.push({
        userId:
          userId && mongoose.Types.ObjectId.isValid(userId)
            ? new mongoose.Types.ObjectId(userId)
            : null,
        name,
        email,
        role: "Participant",
        micReady: false,
        cameraReady: false
      })

      await round.save()
    }

    res.status(200).json({
      success: true,
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

    if (round.completed) {
      return res.status(400).json({
        success: false,
        message: "This GD round is already completed"
      })
    }

    const userMessage = {
      speaker: "user",
      userId,
      name,
      role,
      message: message.trim()
    }

    round.messages.push(userMessage)

    const groq = getGroqClient()
    let aiReplies = fallbackAiReplies(round.topic)
    let userEvaluation = fallbackUserEvaluation()

    if (groq) {
      try {
        const prompt = `
You are running a realistic campus placement group discussion.

Topic: ${round.topic}
Difficulty: ${round.difficulty}
Company: ${round.company}

AI Participants:
${AI_PARTICIPANTS.map(
  (p) => `- ${p.name}: ${p.personality}, style: ${p.style}`
).join("\n")}

Conversation so far:
${createTranscript(round.messages)}

Candidate ${name} said:
${message}

Generate realistic GD reactions from 2 or 3 AI participants.
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
- AI replies should feel like a normal GD.
- At least one AI should agree or expand.
- At least one AI should challenge, ask for data, or give a counterpoint.
- Keep every AI reply under 55 words.
- Do not overpraise.
- Candidate evaluation scores must be 0 to 100.
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
          aiReplies = parsed.aiReplies
            .filter((reply) => reply?.message)
            .slice(0, 3)
            .map((reply) => ({
              speaker: "ai",
              name: reply.name || "Priya",
              role: reply.role || "AI Participant",
              personality: reply.personality || "Balanced",
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
      userEvaluation
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