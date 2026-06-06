import express from "express"
import mongoose from "mongoose"
import OpenAI from "openai"

import HRInterview from "../models/HRInterview.js"

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
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null

    try {
      return JSON.parse(match[0])
    } catch {
      return null
    }
  }
}

const fallbackQuestions = (role = "Frontend Developer", company = "General") => [
  `Tell me about yourself for a ${role} role.`,
  "Why should we hire you?",
  `Why do you want to join ${company}?`,
  "Tell me about your biggest strength and one weakness.",
  "Describe a difficult situation you handled using the STAR method."
]

const calculateAverages = (answers = []) => {
  if (!answers.length) {
    return {
      totalScore: 0,
      confidenceAverage: 0,
      communicationAverage: 0,
      professionalismAverage: 0,
      starStructureAverage: 0,
      relevanceAverage: 0
    }
  }

  const avg = (key) =>
    Math.round(
      answers.reduce((sum, item) => sum + (Number(item[key]) || 0), 0) /
        answers.length
    )

  return {
    totalScore: avg("score"),
    confidenceAverage: avg("confidenceScore"),
    communicationAverage: avg("communicationScore"),
    professionalismAverage: avg("professionalismScore"),
    starStructureAverage: avg("starStructureScore"),
    relevanceAverage: avg("relevanceScore")
  }
}

const calculateHRReport = (averages) => {
  const {
    totalScore,
    confidenceAverage,
    communicationAverage,
    professionalismAverage,
    starStructureAverage,
    relevanceAverage
  } = averages

  const hrSelectionProbability = clampScore(
    confidenceAverage * 0.2 +
      communicationAverage * 0.25 +
      professionalismAverage * 0.2 +
      starStructureAverage * 0.15 +
      relevanceAverage * 0.2
  )

  let selectionLevel = "Needs Improvement"
  let recruiterVerdict =
    "Candidate needs more HR preparation before final interview rounds."

  if (hrSelectionProbability >= 85) {
    selectionLevel = "Excellent"
    recruiterVerdict =
      "Strong HR fit. Candidate sounds confident, structured, relevant and professional."
  } else if (hrSelectionProbability >= 70) {
    selectionLevel = "Good"
    recruiterVerdict =
      "Good HR fit. Candidate has a strong chance with minor improvements."
  } else if (hrSelectionProbability >= 50) {
    selectionLevel = "Moderate"
    recruiterVerdict =
      "Average HR fit. Candidate needs better structure, clarity and confidence."
  }

  const blockers = []
  const recommendations = []

  if (confidenceAverage < 60) {
    blockers.push("Low confidence")
    recommendations.push("Speak with more certainty and avoid unsure phrases.")
  }

  if (communicationAverage < 60) {
    blockers.push("Weak communication clarity")
    recommendations.push("Use shorter, structured and direct answers.")
  }

  if (professionalismAverage < 60) {
    blockers.push("Professional tone needs improvement")
    recommendations.push("Avoid casual language and use polished examples.")
  }

  if (starStructureAverage < 60) {
    blockers.push("Weak STAR structure")
    recommendations.push("Use Situation, Task, Action and Result clearly.")
  }

  if (relevanceAverage < 60) {
    blockers.push("Answer lacks relevance")
    recommendations.push("Connect your answer directly to the role and company.")
  }

  if (!blockers.length) blockers.push("No major HR blocker detected")
  if (!recommendations.length) {
    recommendations.push("Keep practicing company-specific HR answers.")
  }

  return {
    totalScore,
    hrSelectionProbability,
    selectionLevel,
    recruiterVerdict,
    blockers,
    recommendations
  }
}

router.post("/start", async (req, res) => {
  try {
    const {
      userId,
      role = "Frontend Developer",
      company = "General",
      difficulty = "Beginner"
    } = req.body

    const questions = fallbackQuestions(role, company)

    const session = await HRInterview.create({
      userId: userId && mongoose.Types.ObjectId.isValid(userId) ? userId : null,
      role,
      company,
      difficulty,
      questions,
      answers: [],
      completed: false
    })

    res.status(201).json({
      success: true,
      sessionId: session._id,
      questions,
      firstQuestion: questions[0]
    })
  } catch (error) {
    console.log("HR start error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to start HR interview",
      error: error.message
    })
  }
})

router.post("/answer", async (req, res) => {
  try {
    const groq = getGroqClient()
    const { sessionId, question, answer } = req.body

    if (!sessionId || !question || !answer) {
      return res.status(400).json({
        success: false,
        message: "Session, question and answer are required"
      })
    }

    const session = await HRInterview.findById(sessionId)

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "HR session not found"
      })
    }

    let result = {
      score: 60,
      confidenceScore: 60,
      communicationScore: 60,
      professionalismScore: 60,
      starStructureScore: 60,
      relevanceScore: 60,
      feedback:
        "Good attempt. Make your answer more structured, confident and professional.",
      strengths: ["You attempted the answer"],
      weaknesses: ["Needs stronger HR framing"],
      improvedAnswer:
        "A stronger answer should be confident, professional, concise and supported by a real example.",
      followUpQuestion: "Can you support this answer with one real example?"
    }

    if (groq) {
      const prompt = `
You are an expert HR interviewer.

Role: ${session.role}
Company: ${session.company}
Difficulty: ${session.difficulty}

Question:
${question}

Candidate Answer:
${answer}

Evaluate the answer like a real HR recruiter.

Return ONLY valid JSON:
{
  "score": 0,
  "confidenceScore": 0,
  "communicationScore": 0,
  "professionalismScore": 0,
  "starStructureScore": 0,
  "relevanceScore": 0,
  "feedback": "",
  "strengths": [],
  "weaknesses": [],
  "improvedAnswer": "",
  "followUpQuestion": ""
}

Rules:
- Scores must be 0 to 100.
- Give practical feedback.
- Improved answer should sound interview-ready.
- Follow-up question should be relevant to the user's answer.
`

      try {
        const aiResponse = await Promise.race([
          groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.35
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("AI timeout")), 15000)
          )
        ])

        const parsed = extractJSON(aiResponse.choices?.[0]?.message?.content)

        if (parsed && !Array.isArray(parsed)) {
          result = {
            score: parsed.score ?? result.score,
            confidenceScore: parsed.confidenceScore ?? result.confidenceScore,
            communicationScore:
              parsed.communicationScore ?? result.communicationScore,
            professionalismScore:
              parsed.professionalismScore ?? result.professionalismScore,
            starStructureScore:
              parsed.starStructureScore ?? result.starStructureScore,
            relevanceScore: parsed.relevanceScore ?? result.relevanceScore,
            feedback: parsed.feedback || result.feedback,
            strengths: Array.isArray(parsed.strengths)
              ? parsed.strengths
              : result.strengths,
            weaknesses: Array.isArray(parsed.weaknesses)
              ? parsed.weaknesses
              : result.weaknesses,
            improvedAnswer: parsed.improvedAnswer || result.improvedAnswer,
            followUpQuestion: parsed.followUpQuestion || result.followUpQuestion
          }
        }
      } catch (aiError) {
        console.log("HR AI fallback used:", aiError.message)
      }
    }

    session.answers.push({
      question,
      answer,
      score: clampScore(result.score),
      confidenceScore: clampScore(result.confidenceScore),
      communicationScore: clampScore(result.communicationScore),
      professionalismScore: clampScore(result.professionalismScore),
      starStructureScore: clampScore(result.starStructureScore),
      relevanceScore: clampScore(result.relevanceScore),
      feedback: result.feedback,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      improvedAnswer: result.improvedAnswer,
      followUpQuestion: result.followUpQuestion
    })

    const averages = calculateAverages(session.answers)

    session.totalScore = averages.totalScore
    session.confidenceAverage = averages.confidenceAverage
    session.communicationAverage = averages.communicationAverage
    session.professionalismAverage = averages.professionalismAverage
    session.starStructureAverage = averages.starStructureAverage
    session.relevanceAverage = averages.relevanceAverage

    const hrReport = calculateHRReport(averages)

    session.hrSelectionProbability = hrReport.hrSelectionProbability
    session.selectionLevel = hrReport.selectionLevel
    session.recruiterVerdict = hrReport.recruiterVerdict
    session.blockers = hrReport.blockers
    session.recommendations = hrReport.recommendations
    session.completed = session.answers.length >= session.questions.length

    await session.save()

    res.status(200).json({
      success: true,
      score: clampScore(result.score),
      confidenceScore: clampScore(result.confidenceScore),
      communicationScore: clampScore(result.communicationScore),
      professionalismScore: clampScore(result.professionalismScore),
      starStructureScore: clampScore(result.starStructureScore),
      relevanceScore: clampScore(result.relevanceScore),
      feedback: result.feedback,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      improvedAnswer: result.improvedAnswer,
      followUpQuestion: result.followUpQuestion,
      totalScore: session.totalScore,
      confidenceAverage: session.confidenceAverage,
      communicationAverage: session.communicationAverage,
      professionalismAverage: session.professionalismAverage,
      starStructureAverage: session.starStructureAverage,
      relevanceAverage: session.relevanceAverage,
      hrSelectionProbability: session.hrSelectionProbability,
      selectionLevel: session.selectionLevel,
      recruiterVerdict: session.recruiterVerdict,
      blockers: session.blockers,
      recommendations: session.recommendations,
      completed: session.completed
    })
  } catch (error) {
    console.log("HR answer error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to evaluate HR answer",
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
        sessions: []
      })
    }

    const sessions = await HRInterview.find({
      userId: new mongoose.Types.ObjectId(userId)
    }).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      sessions
    })
  } catch (error) {
    console.log("HR history error:", error)

    res.status(200).json({
      success: true,
      sessions: []
    })
  }
})

export default router