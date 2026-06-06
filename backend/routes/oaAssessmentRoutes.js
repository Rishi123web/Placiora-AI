import express from "express"
import mongoose from "mongoose"
import OAAssessment from "../models/OAAssessment.js"

const router = express.Router()

const clampScore = (value) => {
  const num = Number(value) || 0
  return Math.min(100, Math.max(0, Math.round(num)))
}

const getDuration = (company) => {
  const durations = {
    General: 30,
    TCS: 40,
    Infosys: 35,
    Wipro: 35,
    Accenture: 40,
    Cognizant: 35,
    Capgemini: 35
  }

  return durations[company] || 30
}

const baseQuestions = [
  {
    section: "aptitude",
    question:
      "A train 120 meters long crosses a pole in 6 seconds. What is its speed?",
    options: ["60 km/h", "72 km/h", "80 km/h", "90 km/h"],
    correctAnswer: "72 km/h",
    explanation: "Speed = 120/6 = 20 m/s = 72 km/h.",
    marks: 1
  },
  {
    section: "aptitude",
    question:
      "If cost price is ₹800 and profit is 25%, what is selling price?",
    options: ["₹900", "₹950", "₹1000", "₹1100"],
    correctAnswer: "₹1000",
    explanation: "Selling price = 800 + 25% of 800 = ₹1000.",
    marks: 1
  },
  {
    section: "technical",
    question: "Which hook is used to manage state in React?",
    options: ["useEffect", "useState", "useMemo", "useRef"],
    correctAnswer: "useState",
    explanation: "useState manages local component state.",
    marks: 1
  },
  {
    section: "technical",
    question: "Which data structure follows FIFO?",
    options: ["Stack", "Queue", "Tree", "Graph"],
    correctAnswer: "Queue",
    explanation: "Queue follows First In First Out.",
    marks: 1
  },
  {
    section: "technical",
    question: "Which HTTP method is used for partial update?",
    options: ["GET", "POST", "PATCH", "DELETE"],
    correctAnswer: "PATCH",
    explanation: "PATCH updates part of a resource.",
    marks: 1
  },
  {
    section: "coding",
    question: "Time complexity of binary search?",
    options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
    correctAnswer: "O(log n)",
    explanation: "Binary search halves the search space.",
    marks: 2
  },
  {
    section: "coding",
    question: "Best way to detect duplicates in an array efficiently?",
    options: ["Nested loops", "Hash Set", "Recursion", "Linear search"],
    correctAnswer: "Hash Set",
    explanation: "Hash Set detects duplicates in O(n) average time.",
    marks: 2
  },
  {
    section: "aptitude",
    question:
      "Average of 5 numbers is 20. One number removed makes average 18. Removed number?",
    options: ["24", "26", "28", "30"],
    correctAnswer: "28",
    explanation: "Original total = 100. New total = 72. Removed = 28.",
    marks: 1
  }
]

router.post("/start", async (req, res) => {
  try {
    const { userId, company = "General", difficulty = "Beginner" } = req.body

    const totalMarks = baseQuestions.reduce(
      (sum, q) => sum + (Number(q.marks) || 1),
      0
    )

    const assessment = await OAAssessment.create({
      userId:
        userId && mongoose.Types.ObjectId.isValid(userId)
          ? new mongoose.Types.ObjectId(userId)
          : null,
      company,
      difficulty,
      durationMinutes: getDuration(company),
      questions: baseQuestions,
      answers: [],
      totalQuestions: baseQuestions.length,
      attemptedQuestions: 0,
      correctAnswers: 0,
      totalMarks,
      obtainedMarks: 0,
      percentage: 0,
      aptitudeScore: 0,
      technicalScore: 0,
      codingScore: 0,
      selectionChance: 0,
      level: "",
      verdict: "",
      strengths: [],
      weaknesses: [],
      recommendations: [],
      completed: false,
      startedAt: new Date(),
      submittedAt: null
    })

    res.status(201).json({
      success: true,
      assessmentId: assessment._id,
      company: assessment.company,
      difficulty: assessment.difficulty,
      durationMinutes: assessment.durationMinutes,
      questions: assessment.questions.map((q, index) => ({
        id: index,
        section: q.section,
        question: q.question,
        options: q.options,
        marks: q.marks
      }))
    })
  } catch (error) {
    console.log("OA START ERROR:", error)

    res.status(500).json({
      success: false,
      message: error.message || "Failed to start online assessment"
    })
  }
})

router.post("/submit", async (req, res) => {
  try {
    const { assessmentId, answers = [] } = req.body

    if (!assessmentId || !mongoose.Types.ObjectId.isValid(assessmentId)) {
      return res.status(400).json({
        success: false,
        message: "Valid assessmentId is required"
      })
    }

    const assessment = await OAAssessment.findById(assessmentId)

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found"
      })
    }

    const evaluatedAnswers = assessment.questions.map((q, index) => {
      const found = answers.find((a) => Number(a.id) === index)
      const selectedAnswer = found?.selectedAnswer || ""
      const isCorrect = selectedAnswer === q.correctAnswer

      return {
        section: q.section,
        question: q.question,
        selectedAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
        marksObtained: isCorrect ? q.marks : 0,
        explanation: q.explanation
      }
    })

    const attemptedQuestions = evaluatedAnswers.filter(
      (a) => a.selectedAnswer
    ).length

    const correctAnswers = evaluatedAnswers.filter((a) => a.isCorrect).length

    const obtainedMarks = evaluatedAnswers.reduce(
      (sum, a) => sum + (Number(a.marksObtained) || 0),
      0
    )

    const percentage = clampScore(
      assessment.totalMarks > 0
        ? (obtainedMarks / assessment.totalMarks) * 100
        : 0
    )

    const sectionScore = (section) => {
      const sectionQuestions = assessment.questions.filter(
        (q) => q.section === section
      )

      const sectionAnswers = evaluatedAnswers.filter(
        (a) => a.section === section
      )

      const maxMarks = sectionQuestions.reduce(
        (sum, q) => sum + (Number(q.marks) || 1),
        0
      )

      const marks = sectionAnswers.reduce(
        (sum, a) => sum + (Number(a.marksObtained) || 0),
        0
      )

      return clampScore(maxMarks > 0 ? (marks / maxMarks) * 100 : 0)
    }

    const aptitudeScore = sectionScore("aptitude")
    const technicalScore = sectionScore("technical")
    const codingScore = sectionScore("coding")

    const selectionChance = clampScore(
      aptitudeScore * 0.3 + technicalScore * 0.35 + codingScore * 0.35
    )

    let level = "Needs Improvement"
    let verdict = "You need more OA practice before applying."

    if (percentage >= 85) {
      level = "Excellent"
      verdict = "Strong OA performance. High chance of selection."
    } else if (percentage >= 70) {
      level = "Good"
      verdict = "Good OA performance. Revise weak areas."
    } else if (percentage >= 50) {
      level = "Moderate"
      verdict = "Average OA performance. More practice needed."
    }

    assessment.answers = evaluatedAnswers
    assessment.attemptedQuestions = attemptedQuestions
    assessment.correctAnswers = correctAnswers
    assessment.obtainedMarks = obtainedMarks
    assessment.percentage = percentage
    assessment.aptitudeScore = aptitudeScore
    assessment.technicalScore = technicalScore
    assessment.codingScore = codingScore
    assessment.selectionChance = selectionChance
    assessment.level = level
    assessment.verdict = verdict
    assessment.strengths =
      correctAnswers > 0 ? ["Good attempt"] : ["Assessment attempted"]
    assessment.weaknesses = percentage < 70 ? ["Needs more OA practice"] : []
    assessment.recommendations = [
      "Practice aptitude daily.",
      "Revise technical MCQs.",
      "Practice arrays, strings, searching and sorting."
    ]
    assessment.completed = true
    assessment.submittedAt = new Date()

    await assessment.save()

    res.status(200).json({
      success: true,
      assessment
    })
  } catch (error) {
    console.log("OA SUBMIT ERROR:", error)

    res.status(500).json({
      success: false,
      message: error.message || "Failed to submit assessment"
    })
  }
})

router.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(200).json({
        success: true,
        assessments: []
      })
    }

    const assessments = await OAAssessment.find({
      userId: new mongoose.Types.ObjectId(userId)
    }).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      assessments
    })
  } catch (error) {
    console.log("OA HISTORY ERROR:", error)

    res.status(200).json({
      success: true,
      assessments: []
    })
  }
})

export default router