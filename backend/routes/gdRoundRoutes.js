import express from "express"
import mongoose from "mongoose"
import OpenAI from "openai"
import PDFDocument from "pdfkit"

import GDRound from "../models/GDRound.js"

const router = express.Router()

const AI_PARTICIPANTS = [
  {
    name: "Neha",
    role: "Moderator",
    personality: "Structured Moderator"
  },
  {
    name: "Priya",
    role: "Analytical Speaker",
    personality: "Analytical"
  },
  {
    name: "Rahul",
    role: "Counter Speaker",
    personality: "Critical Thinker"
  },
  {
    name: "Aarav",
    role: "Industry Expert",
    personality: "Business Oriented"
  },
  {
    name: "Meera",
    role: "Balanced Thinker",
    personality: "Balanced"
  }
]

const COMPANY_PROFILES = {
  General: "balanced communication, teamwork and structured thinking",
  Google: "critical thinking, innovation, examples and originality",
  Microsoft: "clarity, collaboration, product thinking and problem solving",
  Amazon: "ownership, customer impact, data-backed thinking and leadership",
  TCS: "communication, teamwork, confidence and basic business awareness",
  Infosys: "clarity, structured points, teamwork and learning mindset",
  Wipro: "professional communication, listening and balanced arguments",
  Accenture: "client focus, leadership, collaboration and practical examples",
  Deloitte: "business awareness, consulting mindset and structured analysis"
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

const safeArray = (value) => {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item || "").trim()).filter(Boolean)
}

const extractJSON = (text = "") => {
  try {
    return JSON.parse(text)
  } catch {
    const match = String(text || "").match(/\{[\s\S]*\}/)

    try {
      if (match) return JSON.parse(match[0])
    } catch {
      return null
    }

    return null
  }
}

const createTranscript = (messages = []) =>
  messages
    .map(
      (item) =>
        `${item.name || item.speaker || "Speaker"} (${item.role || "Participant"}): ${
          item.message || ""
        }`
    )
    .join("\n\n")

const getDiscussionStage = (userCount = 0) => {
  if (userCount <= 1) return "Opening"
  if (userCount <= 3) return "Core Discussion"
  if (userCount <= 5) return "Counter Arguments"
  return "Conclusion"
}

const getOpeningMessages = (topic, company = "General") => [
  {
    speaker: "ai",
    name: "Neha",
    role: "Moderator",
    personality: "Structured Moderator",
    message: `Welcome everyone. Today's group discussion topic is: "${topic}". This GD will focus on ${COMPANY_PROFILES[company] || COMPANY_PROFILES.General}. Candidate, please begin with your opening statement.`
  },
  {
    speaker: "ai",
    name: "Priya",
    role: "Analytical Speaker",
    personality: "Analytical",
    message: "I think we should first define the topic, then discuss benefits, risks, examples and possible solutions."
  },
  {
    speaker: "ai",
    name: "Rahul",
    role: "Counter Speaker",
    personality: "Critical Thinker",
    message: "I would like to keep the discussion practical and also challenge any one-sided view with real limitations."
  }
]

const fallbackAIReplies = ({ topic, userMessage, userCount }) => {
  const stage = getDiscussionStage(userCount)

  return [
    {
      speaker: "ai",
      name: "Priya",
      role: "Analytical Speaker",
      personality: "Analytical",
      message: `That's a valid point. In the context of "${topic}", we should support it with an example and discuss both short-term and long-term impact.`
    },
    {
      speaker: "ai",
      name: "Rahul",
      role: "Counter Speaker",
      personality: "Critical Thinker",
      message: "I partially agree, but we should also consider practical challenges, implementation cost and whether the solution works for everyone."
    },
    {
      speaker: "ai",
      name: "Neha",
      role: "Moderator",
      personality: "Structured Moderator",
      message:
        stage === "Conclusion"
          ? "Good discussion. Now try to conclude with a balanced final view."
          : "Good point. Candidate, try to connect your next answer with a real example and respond to another speaker directly."
    }
  ]
}

const calculateLiveMetrics = (messages = []) => {
  const userMessages = messages.filter((item) => item.speaker === "user")
  const text = userMessages.map((item) => item.message || "").join(" ")
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length

  let base = 48

  if (userMessages.length >= 1) base += 8
  if (userMessages.length >= 3) base += 8
  if (wordCount >= 40) base += 8
  if (wordCount >= 90) base += 8

  const lower = text.toLowerCase()

  if (lower.includes("example")) base += 5
  if (lower.includes("because")) base += 5
  if (lower.includes("solution")) base += 5
  if (lower.includes("i agree") || lower.includes("i disagree")) base += 4

  return {
    communicationScore: clampScore(base + 3),
    contentScore: clampScore(base + 5),
    leadershipScore: clampScore(base - 2),
    confidenceScore: clampScore(base),
    listeningScore: clampScore(base - 1),
    criticalThinkingScore: clampScore(base + 2),
    participationScore: clampScore(base + userMessages.length * 2),
    wordCount,
    userMessageCount: userMessages.length,
    stage: getDiscussionStage(userMessages.length)
  }
}

const fallbackEvaluation = (messages) => {
  const metrics = calculateLiveMetrics(messages)
  const overallScore = clampScore(
    (metrics.communicationScore +
      metrics.contentScore +
      metrics.leadershipScore +
      metrics.confidenceScore +
      metrics.listeningScore +
      metrics.criticalThinkingScore) /
      6
  )

  return {
    ...metrics,
    overallScore,
    selectionChance: overallScore,
    placementReadiness: {
      tcs: clampScore(overallScore + 12),
      infosys: clampScore(overallScore + 10),
      accenture: clampScore(overallScore + 8),
      amazon: clampScore(overallScore - 5),
      google: clampScore(overallScore - 10)
    },
    feedback:
      "Good attempt. Add more structured arguments, use specific examples, acknowledge other participants and conclude with a balanced point.",
    strengths: ["Participated in the discussion", "Shared a clear viewpoint"],
    weaknesses: ["Needs stronger examples", "Needs better structure and stronger counter-points"],
    improvedResponse:
      "I agree with the previous point, and I would like to add that this issue should be viewed from social, economic and technological perspectives. For example, students and companies may be affected differently. A balanced solution would be to improve awareness, training and responsible implementation.",
    finalVerdict:
      overallScore >= 75
        ? "Strong GD performance. Candidate shows good placement readiness."
        : overallScore >= 60
        ? "Good GD performance. Candidate can improve with sharper examples and better leadership."
        : "Needs more GD practice with structured content, examples and confident delivery."
  }
}

const generateAIReplies = async ({ topic, company, difficulty, messages, userMessage }) => {
  const groq = getGroqClient()
  const userCount = messages.filter((item) => item.speaker === "user").length

  if (!groq) {
    return fallbackAIReplies({ topic, userMessage, userCount })
  }

  try {
    const prompt = `
You are simulating a professional placement group discussion for Placiora AI.

Topic: ${topic}
Company focus: ${company}
Difficulty: ${difficulty}
Evaluator focus: ${COMPANY_PROFILES[company] || COMPANY_PROFILES.General}

Conversation:
${messages.map((item) => `${item.name || item.speaker}: ${item.message}`).join("\n")}

Candidate just said:
${userMessage}

Generate 2 to 3 realistic AI participant replies.

Return ONLY valid JSON:
{
  "aiReplies": [
    {
      "speaker": "ai",
      "name": "Priya",
      "role": "Analytical Speaker",
      "personality": "Analytical",
      "message": ""
    }
  ]
}

Rules:
- Use different speakers from: Neha, Priya, Rahul, Aarav, Meera.
- Neha should behave like moderator.
- Priya should be analytical.
- Rahul should give counter argument.
- Aarav should give industry/company perspective.
- Meera should give balanced view.
- Each message under 65 words.
- Do not evaluate the candidate here.
- Avoid repeating same sentence.
`

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5
    })

    const parsed = extractJSON(response.choices?.[0]?.message?.content)

    if (Array.isArray(parsed?.aiReplies) && parsed.aiReplies.length > 0) {
      return parsed.aiReplies.slice(0, 3).map((item) => ({
        speaker: "ai",
        name: item.name || "Priya",
        role: item.role || "AI Participant",
        personality: item.personality || "Balanced",
        message: item.message || "I agree, and we should keep the discussion balanced."
      }))
    }

    return fallbackAIReplies({ topic, userMessage, userCount })
  } catch (error) {
    console.log("GD AI reply fallback:", error.message)
    return fallbackAIReplies({ topic, userMessage, userCount })
  }
}

const evaluateGD = async ({ topic, company, difficulty, messages }) => {
  const userMessages = messages
    .filter((item) => item.speaker === "user")
    .map((item) => item.message)

  const groq = getGroqClient()

  if (!groq) return fallbackEvaluation(messages)

  try {
    const prompt = `
You are a strict group discussion evaluator for campus placements.

Topic:
${topic}

Company:
${company}

Difficulty:
${difficulty}

Company evaluation focus:
${COMPANY_PROFILES[company] || COMPANY_PROFILES.General}

Candidate messages:
${userMessages.join("\n")}

Full discussion:
${messages.map((item) => `${item.name}: ${item.message}`).join("\n")}

Evaluate the candidate only.

Return ONLY valid JSON:
{
  "communicationScore": 0,
  "contentScore": 0,
  "leadershipScore": 0,
  "confidenceScore": 0,
  "listeningScore": 0,
  "criticalThinkingScore": 0,
  "participationScore": 0,
  "overallScore": 0,
  "selectionChance": 0,
  "placementReadiness": {
    "tcs": 0,
    "infosys": 0,
    "accenture": 0,
    "amazon": 0,
    "google": 0
  },
  "feedback": "",
  "strengths": [],
  "weaknesses": [],
  "improvedResponse": "",
  "finalVerdict": ""
}

Rules:
- Scores must be 0-100.
- Do not be too generous.
- Judge clarity, examples, respectful countering, listening, leadership and conclusion ability.
- Give practical recruiter feedback.
`

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.35
    })

    const parsed = extractJSON(response.choices?.[0]?.message?.content)

    if (!parsed) return fallbackEvaluation(messages)

    return {
      communicationScore: clampScore(parsed.communicationScore),
      contentScore: clampScore(parsed.contentScore),
      leadershipScore: clampScore(parsed.leadershipScore),
      confidenceScore: clampScore(parsed.confidenceScore),
      listeningScore: clampScore(parsed.listeningScore),
      criticalThinkingScore: clampScore(parsed.criticalThinkingScore),
      participationScore: clampScore(parsed.participationScore),
      overallScore: clampScore(parsed.overallScore),
      selectionChance: clampScore(parsed.selectionChance),
      placementReadiness: {
        tcs: clampScore(parsed.placementReadiness?.tcs),
        infosys: clampScore(parsed.placementReadiness?.infosys),
        accenture: clampScore(parsed.placementReadiness?.accenture),
        amazon: clampScore(parsed.placementReadiness?.amazon),
        google: clampScore(parsed.placementReadiness?.google)
      },
      feedback: parsed.feedback || "",
      strengths: safeArray(parsed.strengths),
      weaknesses: safeArray(parsed.weaknesses),
      improvedResponse: parsed.improvedResponse || "",
      finalVerdict: parsed.finalVerdict || ""
    }
  } catch (error) {
    console.log("GD evaluation fallback:", error.message)
    return fallbackEvaluation(messages)
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

    const openingMessages = getOpeningMessages(topic, company)

    const gd = await GDRound.create({
      userId:
        userId && mongoose.Types.ObjectId.isValid(userId)
          ? new mongoose.Types.ObjectId(userId)
          : null,
      topic,
      difficulty,
      company,
      aiParticipants: AI_PARTICIPANTS.map((item) => item.name),
      messages: openingMessages,
      completed: false
    })

    res.status(201).json({
      success: true,
      gdId: gd._id,
      topic: gd.topic,
      difficulty: gd.difficulty,
      company: gd.company,
      messages: gd.messages,
      aiParticipants: AI_PARTICIPANTS,
      liveMetrics: calculateLiveMetrics(gd.messages),
      discussionStage: "Opening"
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

    const aiReplies = await generateAIReplies({
      topic: gd.topic,
      company: gd.company || "General",
      difficulty: gd.difficulty || "Beginner",
      messages: gd.messages,
      userMessage: message
    })

    aiReplies.forEach((reply) => gd.messages.push(reply))

    await gd.save()

    const liveMetrics = calculateLiveMetrics(gd.messages)

    res.status(200).json({
      success: true,
      messages: gd.messages,
      aiReplies,
      liveMetrics,
      discussionStage: liveMetrics.stage,
      typingDelay: 900
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
      company: gd.company || "General",
      difficulty: gd.difficulty || "Beginner",
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
      gd: {
        ...gd.toObject(),
        criticalThinkingScore: result.criticalThinkingScore,
        participationScore: result.participationScore,
        placementReadiness: result.placementReadiness,
        transcript: createTranscript(gd.messages)
      }
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

router.get("/download-report/:gdId", async (req, res) => {
  try {
    const { gdId } = req.params

    if (!gdId || !mongoose.Types.ObjectId.isValid(gdId)) {
      return res.status(400).json({
        success: false,
        message: "Valid GD ID is required"
      })
    }

    const gd = await GDRound.findById(gdId)

    if (!gd) {
      return res.status(404).json({
        success: false,
        message: "GD round not found"
      })
    }

    const doc = new PDFDocument({ margin: 0, size: "A4" })

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Placiora-GD-Report-${gd._id}.pdf"`
    )

    doc.pipe(res)

    doc.rect(0, 0, doc.page.width, 120).fill("#020617")
    doc.fontSize(26).fillColor("#ffffff").text("Placiora AI", 44, 32)
    doc
      .fontSize(11)
      .fillColor("#67e8f9")
      .text("Group Discussion Performance Report", 44, 66)

    doc
      .fontSize(9)
      .fillColor("#cbd5e1")
      .text(`Topic: ${gd.topic || "GD Round"}`, 44, 90, { width: 500 })

    let y = 150

    const section = (title) => {
      doc.fontSize(13).fillColor("#0f172a").text(title.toUpperCase(), 44, y)
      doc.moveTo(44, y + 18).lineTo(550, y + 18).strokeColor("#22d3ee").stroke()
      y += 32
    }

    const score = (label, value, x) => {
      doc.roundedRect(x, y, 96, 58, 10).fill("#f8fafc").strokeColor("#dbeafe").stroke()
      doc.fontSize(8).fillColor("#64748b").text(label, x + 10, y + 10)
      doc.fontSize(18).fillColor("#0f172a").text(`${clampScore(value)}%`, x + 10, y + 28)
    }

    section("Scorecard")
    score("Communication", gd.communicationScore, 44)
    score("Content", gd.contentScore, 150)
    score("Leadership", gd.leadershipScore, 256)
    score("Confidence", gd.confidenceScore, 362)
    score("Overall", gd.overallScore, 468)

    y += 86

    section("Recruiter Feedback")
    doc.fontSize(10).fillColor("#334155").text(gd.feedback || "No feedback available.", 44, y, {
      width: 506,
      lineGap: 4
    })
    y = doc.y + 24

    section("Strengths")
    ;(gd.strengths || []).forEach((item) => {
      doc.fontSize(10).fillColor("#166534").text(`• ${item}`, 44, y, { width: 506 })
      y = doc.y + 6
    })

    y += 10
    section("Improvement Areas")
    ;(gd.weaknesses || []).forEach((item) => {
      doc.fontSize(10).fillColor("#991b1b").text(`• ${item}`, 44, y, { width: 506 })
      y = doc.y + 6
    })

    y += 10
    section("Improved Response")
    doc.fontSize(10).fillColor("#334155").text(gd.improvedResponse || "No improved response available.", 44, y, {
      width: 506,
      lineGap: 4
    })

    doc.addPage()
    y = 50
    section("Transcript")
    doc.fontSize(9).fillColor("#334155").text(createTranscript(gd.messages || []), 44, y, {
      width: 506,
      lineGap: 3
    })

    doc.fontSize(8).fillColor("#94a3b8").text(
      "Generated by Placiora AI — Your Personal Placement Copilot",
      44,
      800,
      { align: "center", width: 506 }
    )

    doc.end()
  } catch (error) {
    console.log("GD report error:", error)

    res.status(500).json({
      success: false,
      message: "GD report download failed",
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