import express from "express"
import mongoose from "mongoose"
import OpenAI from "openai"

import SystemDesignInterview from "../models/SystemDesignInterview.js"

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
    const arrayMatch = text.match(/\[[\s\S]*\]/)

    try {
      if (objectMatch) return JSON.parse(objectMatch[0])
      if (arrayMatch) return JSON.parse(arrayMatch[0])
    } catch {
      return null
    }

    return null
  }
}

const formatQuestions = (questions = []) => {
  return questions.slice(0, 5).map((item, index) => {
    if (typeof item === "object" && item?.question) {
      return {
        id: item.id || index + 1,
        type: item.type || "System Design",
        question: item.question
      }
    }

    return {
      id: index + 1,
      type: "System Design",
      question: String(item)
    }
  })
}

const fallbackProblems = {
  Beginner: {
    problem: "Design a URL Shortener",
    prompt:
      "Design a basic URL shortener like bit.ly. Explain APIs, database schema, redirection flow and scalability basics.",
    questions: [
      "What are the main requirements of a URL shortener?",
      "What APIs would you create?",
      "How would you store short URLs in the database?",
      "How would redirection work?",
      "How would you scale the system?"
    ]
  },
  Intermediate: {
    problem: "Design a Chat Application",
    prompt:
      "Design a real-time chat application like WhatsApp. Explain WebSocket flow, message storage, delivery status and scaling.",
    questions: [
      "What are the functional and non-functional requirements?",
      "How would you design the high-level architecture?",
      "How would real-time messaging work?",
      "How would you store messages and users?",
      "How would you scale to millions of users?"
    ]
  },
  Advanced: {
    problem: "Design YouTube",
    prompt:
      "Design a video streaming platform like YouTube. Explain upload pipeline, encoding, CDN, recommendation basics and scalability.",
    questions: [
      "What are the key functional and non-functional requirements?",
      "How would you design video upload and processing?",
      "How would video streaming and CDN delivery work?",
      "How would you design the database schema?",
      "How would you scale recommendations and search?"
    ]
  }
}

const averageScores = (answers = []) => {
  if (!answers.length) {
    return {
      totalScore: 0
    }
  }

  const total = answers.reduce(
    (sum, item) => sum + (Number(item.score) || 0),
    0
  )

  return {
    totalScore: clampScore(total / answers.length)
  }
}

const verdictFromScore = (score) => {
  if (score >= 85) return "Excellent system design readiness."
  if (score >= 70) return "Good system design foundation with minor gaps."
  if (score >= 55) return "Moderate system design understanding. Needs more structure."
  return "Needs strong improvement in system design fundamentals."
}

router.post("/start", async (req, res) => {
  try {
    const { userId, difficulty = "Beginner", topic = "" } = req.body
    const groq = getGroqClient()

    let problemData = fallbackProblems[difficulty] || fallbackProblems.Beginner

    if (topic && topic.trim()) {
      problemData = {
        problem: `Design ${topic}`,
        prompt: `Design ${topic}. Explain requirements, APIs, database schema, architecture, scaling and trade-offs.`,
        questions: [
          `What are the main requirements for ${topic}?`,
          "What high-level architecture would you design?",
          "What APIs would you create?",
          "What database schema would you use?",
          "How would you scale this system?"
        ]
      }
    }

    if (groq) {
      try {
        const aiPrompt = `
Generate a system design interview.

Difficulty: ${difficulty}
Topic: ${topic || "Auto choose suitable topic"}

Return ONLY valid JSON:
{
  "problem": "",
  "prompt": "",
  "questions": []
}

Rules:
- Generate exactly 5 questions.
- Questions should cover requirements, architecture, API design, database design, scalability and trade-offs.
`

        const response = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: aiPrompt }],
          temperature: 0.4
        })

        const parsed = extractJSON(response.choices[0].message.content)

        if (parsed?.problem && Array.isArray(parsed.questions)) {
          problemData = {
            problem: parsed.problem,
            prompt: parsed.prompt || problemData.prompt,
            questions: parsed.questions.slice(0, 5)
          }
        }
      } catch (error) {
        console.log("System design AI fallback used:", error.message)
      }
    }

    const formattedQuestions = formatQuestions(problemData.questions)

    const session = await SystemDesignInterview.create({
      userId:
        userId && mongoose.Types.ObjectId.isValid(userId)
          ? new mongoose.Types.ObjectId(userId)
          : null,
      topic: problemData.problem,
      difficulty,
      problem: problemData.problem,
      prompt: problemData.prompt,
      questions: formattedQuestions,
      answers: [],
      totalScore: 0,
      completed: false,
      verdict: ""
    })

    res.status(201).json({
      success: true,
      sessionId: session._id,
      topic: session.topic,
      difficulty: session.difficulty,
      problem: session.problem,
      prompt: session.prompt,
      questions: session.questions,
      firstQuestion: session.questions[0]?.question || ""
    })
  } catch (error) {
    console.log("System design start error:", error)

    res.status(500).json({
      success: false,
      message: error.message || "System design interview start failed"
    })
  }
})

router.post("/answer", async (req, res) => {
  try {
    const { sessionId, question, answer } = req.body
    const groq = getGroqClient()

    if (!sessionId || !question || !answer) {
      return res.status(400).json({
        success: false,
        message: "Session, question and answer are required"
      })
    }

    const session = await SystemDesignInterview.findById(sessionId)

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "System design session not found"
      })
    }

    let result = {
      architectureScore: 60,
      scalabilityScore: 60,
      databaseScore: 60,
      apiDesignScore: 60,
      communicationScore: 60,
      overallScore: 60,
      feedback:
        "Good attempt. Add more architecture detail, scaling strategy and trade-offs.",
      strengths: ["You attempted the design"],
      weaknesses: ["Needs deeper scalability and database explanation"],
      improvedAnswer:
        "A stronger answer should explain requirements, high-level architecture, API design, database schema, bottlenecks, scaling strategy and trade-offs.",
      followUpQuestion: "How would you scale this system to one million users?"
    }

    if (groq) {
      try {
        const aiPrompt = `
You are a senior system design interviewer.

System Design Problem:
${session.problem || session.topic}

Question:
${question}

Candidate Answer:
${answer}

Return ONLY valid JSON:
{
  "architectureScore": 0,
  "scalabilityScore": 0,
  "databaseScore": 0,
  "apiDesignScore": 0,
  "communicationScore": 0,
  "overallScore": 0,
  "feedback": "",
  "strengths": [],
  "weaknesses": [],
  "improvedAnswer": "",
  "followUpQuestion": ""
}
`

        const response = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: aiPrompt }],
          temperature: 0.35
        })

        const parsed = extractJSON(response.choices[0].message.content)

        if (parsed && !Array.isArray(parsed)) {
          result = {
            architectureScore:
              parsed.architectureScore ?? result.architectureScore,
            scalabilityScore:
              parsed.scalabilityScore ?? result.scalabilityScore,
            databaseScore: parsed.databaseScore ?? result.databaseScore,
            apiDesignScore: parsed.apiDesignScore ?? result.apiDesignScore,
            communicationScore:
              parsed.communicationScore ?? result.communicationScore,
            overallScore: parsed.overallScore ?? result.overallScore,
            feedback: parsed.feedback || result.feedback,
            strengths: Array.isArray(parsed.strengths)
              ? parsed.strengths
              : result.strengths,
            weaknesses: Array.isArray(parsed.weaknesses)
              ? parsed.weaknesses
              : result.weaknesses,
            improvedAnswer: parsed.improvedAnswer || result.improvedAnswer,
            followUpQuestion:
              parsed.followUpQuestion || result.followUpQuestion
          }
        }
      } catch (error) {
        console.log("System design AI evaluation fallback used:", error.message)
      }
    }

    const architectureScore = clampScore(result.architectureScore)
    const scalabilityScore = clampScore(result.scalabilityScore)
    const databaseScore = clampScore(result.databaseScore)
    const apiDesignScore = clampScore(result.apiDesignScore)
    const communicationScore = clampScore(result.communicationScore)

    const overallScore = clampScore(
      result.overallScore ||
        (architectureScore +
          scalabilityScore +
          databaseScore +
          apiDesignScore +
          communicationScore) /
          5
    )

    session.answers.push({
      question,
      answer,
      score: overallScore,
      architectureScore,
      scalabilityScore,
      databaseScore,
      apiDesignScore,
      communicationScore,
      feedback: result.feedback,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      improvedAnswer: result.improvedAnswer,
      followUpQuestion: result.followUpQuestion
    })

    const averages = averageScores(session.answers)

    session.totalScore = averages.totalScore
    session.verdict = verdictFromScore(session.totalScore)

    if (session.answers.length >= (session.questions?.length || 0)) {
      session.completed = true
    }

    await session.save()

    res.status(200).json({
      success: true,
      architectureScore,
      scalabilityScore,
      databaseScore,
      apiDesignScore,
      communicationScore,
      overallScore,
      score: overallScore,
      feedback: result.feedback,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      improvedAnswer: result.improvedAnswer,
      followUpQuestion: result.followUpQuestion,
      totalScore: session.totalScore,
      verdict: session.verdict,
      completed: session.completed
    })
  } catch (error) {
    console.log("System design answer error:", error)

    res.status(500).json({
      success: false,
      message: error.message || "System design answer evaluation failed"
    })
  }
})

router.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(200).json({
        success: true,
        sessions: []
      })
    }

    const sessions = await SystemDesignInterview.find({
      userId: new mongoose.Types.ObjectId(userId)
    }).sort({
      createdAt: -1
    })

    res.status(200).json({
      success: true,
      sessions
    })
  } catch (error) {
    console.log("System design history error:", error)

    res.status(200).json({
      success: true,
      sessions: []
    })
  }
})

export default router