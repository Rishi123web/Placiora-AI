import express from "express"
import mongoose from "mongoose"
import OpenAI from "openai"

import GDRound from "../models/GDRound.js"

const router = express.Router()

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
    const objectMatch = text.match(/\{[\s\S]*\}/)

    try {
      if (objectMatch) return JSON.parse(objectMatch[0])
    } catch {
      return null
    }

    return null
  }
}

const getOpeningMessages = (topic) => [
  {
    speaker: "ai",
    name: "Aarav",
    role: "Moderator",
    message: `Welcome everyone. Today's group discussion topic is: "${topic}". Let's begin with clear points and respectful arguments.`
  },
  {
    speaker: "ai",
    name: "Priya",
    role: "Analytical Speaker",
    message: `I believe this topic has both positive and negative sides. We should discuss impact, examples, and long-term consequences.`
  },
  {
    speaker: "ai",
    name: "Rahul",
    role: "Counter Speaker",
    message: `I would like to challenge the common view and focus on risks, practical problems, and real-world limitations.`
  }
]

const fallbackAIReply = (topic, userMessage) => {
  return {
    speaker: "ai",
    name: "Priya",
    role: "AI Participant",
    message: `You made a valid point. To add to that, in the context of "${topic}", we should also consider practical examples, impact on students and industries, and possible solutions.`
  }
}

const fallbackEvaluation = (userMessages) => {
  const text = userMessages.join(" ")
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length

  let baseScore = 50

  if (wordCount > 40) baseScore += 10
  if (wordCount > 80) baseScore += 10
  if (
    text.toLowerCase().includes("example") ||
    text.toLowerCase().includes("because") ||
    text.toLowerCase().includes("solution")
  ) {
    baseScore += 10
  }

  const overallScore = clampScore(baseScore)

  return {
    communicationScore: overallScore,
    contentScore: clampScore(overallScore + 3),
    leadershipScore: clampScore(overallScore - 5),
    confidenceScore: clampScore(overallScore),
    listeningScore: clampScore(overallScore - 2),
    overallScore,
    selectionChance: overallScore,
    feedback:
      "Good attempt. Add more structured arguments, examples, and try to acknowledge other participants before giving your point.",
    strengths: ["You participated in the discussion", "You shared your viewpoint"],
    weaknesses: ["Needs stronger examples", "Needs better structure"],
    improvedResponse:
      "I agree with the previous point, and I would like to add that this issue should be viewed from both social and economic perspectives. For example, students and companies may be affected differently. A balanced solution would be to improve awareness, training, and responsible implementation.",
    finalVerdict:
      overallScore >= 70
        ? "Good GD performance. You can improve further with stronger leadership points."
        : "Needs more GD practice with structured content and confident delivery."
  }
}

const generateAIReply = async ({ topic, messages, userMessage }) => {
  const groq = getGroqClient()

  if (!groq) return fallbackAIReply(topic, userMessage)

  try {
    const prompt = `
You are simulating a placement group discussion.

Topic: ${topic}

Conversation:
${messages
  .map((item) => `${item.name || item.speaker}: ${item.message}`)
  .join("\n")}

Candidate just said:
${userMessage}

Generate ONE realistic AI participant response.

Return ONLY valid JSON:
{
  "speaker": "ai",
  "name": "Priya",
  "role": "AI Participant",
  "message": ""
}

Rules:
- Keep response under 70 words.
- Either support, counter, or add a fresh point.
- Do not evaluate the candidate here.
`

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.45
    })

    const parsed = extractJSON(response.choices[0].message.content)

    if (parsed?.message) {
      return {
        speaker: "ai",
        name: parsed.name || "Priya",
        role: parsed.role || "AI Participant",
        message: parsed.message
      }
    }

    return fallbackAIReply(topic, userMessage)
  } catch (error) {
    console.log("GD AI reply fallback:", error.message)
    return fallbackAIReply(topic, userMessage)
  }
}

const evaluateGD = async ({ topic, messages }) => {
  const userMessages = messages
    .filter((item) => item.speaker === "user")
    .map((item) => item.message)

  const groq = getGroqClient()

  if (!groq) return fallbackEvaluation(userMessages)

  try {
    const prompt = `
You are a group discussion evaluator for campus placements.

Topic:
${topic}

Candidate messages:
${userMessages.join("\n")}

Full discussion:
${messages.map((item) => `${item.name}: ${item.message}`).join("\n")}

Evaluate candidate only.

Return ONLY valid JSON:
{
  "communicationScore": 0,
  "contentScore": 0,
  "leadershipScore": 0,
  "confidenceScore": 0,
  "listeningScore": 0,
  "overallScore": 0,
  "selectionChance": 0,
  "feedback": "",
  "strengths": [],
  "weaknesses": [],
  "improvedResponse": "",
  "finalVerdict": ""
}

Rules:
- Scores must be 0-100.
- Consider clarity, examples, respectful countering, leadership, and listening.
- Do not be too generous.
`

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.35
    })

    const parsed = extractJSON(response.choices[0].message.content)

    if (!parsed) return fallbackEvaluation(userMessages)

    return {
      communicationScore: clampScore(parsed.communicationScore),
      contentScore: clampScore(parsed.contentScore),
      leadershipScore: clampScore(parsed.leadershipScore),
      confidenceScore: clampScore(parsed.confidenceScore),
      listeningScore: clampScore(parsed.listeningScore),
      overallScore: clampScore(parsed.overallScore),
      selectionChance: clampScore(parsed.selectionChance),
      feedback: parsed.feedback || "",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      improvedResponse: parsed.improvedResponse || "",
      finalVerdict: parsed.finalVerdict || ""
    }
  } catch (error) {
    console.log("GD evaluation fallback:", error.message)
    return fallbackEvaluation(userMessages)
  }
}

router.post("/start", async (req, res) => {
  try {
    const {
      userId,
      topic = "Impact of Artificial Intelligence on Jobs",
      difficulty = "Beginner",
      company = "General"
    } = req.body

    const openingMessages = getOpeningMessages(topic)

    const gd = await GDRound.create({
      userId:
        userId && mongoose.Types.ObjectId.isValid(userId)
          ? new mongoose.Types.ObjectId(userId)
          : null,
      topic,
      difficulty,
      company,
      aiParticipants: ["Aarav", "Priya", "Rahul"],
      messages: openingMessages,
      completed: false
    })

    res.status(201).json({
      success: true,
      gdId: gd._id,
      topic: gd.topic,
      difficulty: gd.difficulty,
      company: gd.company,
      messages: gd.messages
    })
  } catch (error) {
    console.log("GD start error:", error)

    res.status(500).json({
      success: false,
      message: "GD round start failed",
      error: error.message
    })
  }
})

router.post("/message", async (req, res) => {
  try {
    const { gdId, message } = req.body

    if (!gdId || !message) {
      return res.status(400).json({
        success: false,
        message: "GD ID and message are required"
      })
    }

    const gd = await GDRound.findById(gdId)

    if (!gd) {
      return res.status(404).json({
        success: false,
        message: "GD round not found"
      })
    }

    const userMessage = {
      speaker: "user",
      name: "You",
      role: "Candidate",
      message
    }

    gd.messages.push(userMessage)

    const aiReply = await generateAIReply({
      topic: gd.topic,
      messages: gd.messages,
      userMessage: message
    })

    gd.messages.push(aiReply)

    await gd.save()

    res.status(200).json({
      success: true,
      messages: gd.messages,
      aiReply
    })
  } catch (error) {
    console.log("GD message error:", error)

    res.status(500).json({
      success: false,
      message: "GD message failed",
      error: error.message
    })
  }
})

router.post("/finish", async (req, res) => {
  try {
    const { gdId } = req.body

    if (!gdId) {
      return res.status(400).json({
        success: false,
        message: "GD ID is required"
      })
    }

    const gd = await GDRound.findById(gdId)

    if (!gd) {
      return res.status(404).json({
        success: false,
        message: "GD round not found"
      })
    }

    const result = await evaluateGD({
      topic: gd.topic,
      messages: gd.messages
    })

    gd.communicationScore = result.communicationScore
    gd.contentScore = result.contentScore
    gd.leadershipScore = result.leadershipScore
    gd.confidenceScore = result.confidenceScore
    gd.listeningScore = result.listeningScore
    gd.overallScore = result.overallScore
    gd.selectionChance = result.selectionChance
    gd.feedback = result.feedback
    gd.strengths = result.strengths
    gd.weaknesses = result.weaknesses
    gd.improvedResponse = result.improvedResponse
    gd.finalVerdict = result.finalVerdict
    gd.completed = true

    await gd.save()

    res.status(200).json({
      success: true,
      gd
    })
  } catch (error) {
    console.log("GD finish error:", error)

    res.status(500).json({
      success: false,
      message: "GD evaluation failed",
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

    const rounds = await GDRound.find({
      userId: new mongoose.Types.ObjectId(userId)
    }).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      rounds
    })
  } catch (error) {
    console.log("GD history error:", error)

    res.status(200).json({
      success: true,
      rounds: []
    })
  }
})

export default router
