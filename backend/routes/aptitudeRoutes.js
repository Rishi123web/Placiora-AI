import express from "express"
import mongoose from "mongoose"
import AptitudeSession from "../models/AptitudeSession.js"

const router = express.Router()

const questionBank = {
  Quantitative: [
    {
      question: "If a number is increased by 20% and becomes 120, what is the original number?",
      options: ["80", "90", "100", "110"],
      correctAnswer: "100",
      explanation: "Original number = 120 / 1.2 = 100.",
      category: "Quantitative"
    },
    {
      question: "A train covers 180 km in 3 hours. What is its speed?",
      options: ["40 km/h", "50 km/h", "60 km/h", "70 km/h"],
      correctAnswer: "60 km/h",
      explanation: "Speed = Distance / Time = 180 / 3 = 60 km/h.",
      category: "Quantitative"
    }
  ],

  Reasoning: [
    {
      question: "Find the next number: 2, 4, 8, 16, ?",
      options: ["20", "24", "30", "32"],
      correctAnswer: "32",
      explanation: "Each number is multiplied by 2.",
      category: "Reasoning"
    },
    {
      question: "If CAT is coded as DBU, how is DOG coded?",
      options: ["EPH", "EQH", "FPI", "CNG"],
      correctAnswer: "EPH",
      explanation: "Each letter is shifted by +1: D→E, O→P, G→H.",
      category: "Reasoning"
    }
  ],

  Verbal: [
    {
      question: "Choose the correct synonym of 'Rapid'.",
      options: ["Slow", "Fast", "Weak", "Late"],
      correctAnswer: "Fast",
      explanation: "Rapid means fast or quick.",
      category: "Verbal"
    },
    {
      question: "Choose the correct antonym of 'Expand'.",
      options: ["Increase", "Grow", "Contract", "Extend"],
      correctAnswer: "Contract",
      explanation: "Contract is the opposite of expand.",
      category: "Verbal"
    }
  ]
}

const getQuestions = (category) => {
  if (category === "Mixed") {
    return [
      ...questionBank.Quantitative,
      ...questionBank.Reasoning,
      ...questionBank.Verbal
    ]
  }

  return questionBank[category] || questionBank.Quantitative
}

router.post("/start", async (req, res) => {
  try {
    const { userId, category, difficulty } = req.body

    const selectedCategory = category || "Mixed"
    const questions = getQuestions(selectedCategory)

    const session = await AptitudeSession.create({
      userId:
        userId && mongoose.Types.ObjectId.isValid(userId) ? userId : null,
      category: selectedCategory,
      difficulty: difficulty || "Beginner",
      questions,
      totalQuestions: questions.length,
      answers: [],
      score: 0,
      correctAnswers: 0,
      completed: false
    })

    res.status(201).json({
      success: true,
      sessionId: session._id,
      questions: questions.map((q) => ({
        question: q.question,
        options: q.options,
        category: q.category
      }))
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Aptitude round start failed",
      error: error.message
    })
  }
})

router.post("/submit", async (req, res) => {
  try {
    const { sessionId, answers } = req.body

    if (!sessionId || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: "Session ID and answers are required"
      })
    }

    const session = await AptitudeSession.findById(sessionId)

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Aptitude session not found"
      })
    }

    const evaluatedAnswers = session.questions.map((question, index) => {
      const selectedOption = answers[index] || ""

      return {
        question: question.question,
        selectedOption,
        correctAnswer: question.correctAnswer,
        isCorrect: selectedOption === question.correctAnswer,
        explanation: question.explanation,
        category: question.category
      }
    })

    const correctAnswers = evaluatedAnswers.filter((a) => a.isCorrect).length

    const score = Math.round(
      (correctAnswers / session.questions.length) * 100
    )

    session.answers = evaluatedAnswers
    session.correctAnswers = correctAnswers
    session.score = score
    session.completed = true

    await session.save()

    res.json({
      success: true,
      score,
      correctAnswers,
      totalQuestions: session.questions.length,
      answers: evaluatedAnswers
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Aptitude submission failed",
      error: error.message
    })
  }
})

router.get("/history/:userId", async (req, res) => {
  try {
    const sessions = await AptitudeSession.find({
      userId: req.params.userId
    }).sort({ createdAt: -1 })

    res.json({
      success: true,
      sessions
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Aptitude history failed",
      error: error.message
    })
  }
})

export default router