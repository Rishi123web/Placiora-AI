import express from "express"
import mongoose from "mongoose"

import PlacementReadiness from "../models/PlacementReadiness.js"
import LiveInterview from "../models/LiveInterview.js"
import InterviewSession from "../models/InterviewSession.js"

const router = express.Router()

const clampScore = (value) => {
  const num = Number(value) || 0
  return Math.min(100, Math.max(0, Math.round(num)))
}

const avg = (items = []) => {
  if (!items.length) return 0

  return clampScore(
    items.reduce((sum, item) => sum + (Number(item) || 0), 0) / items.length
  )
}

const getLevel = (score) => {
  if (score >= 85) return "Placement Ready"
  if (score >= 70) return "Interview Ready"
  if (score >= 55) return "Intermediate"
  return "Beginner"
}

const getVerdict = (score) => {
  if (score >= 85) {
    return "Excellent preparation. You are ready for most placement opportunities."
  }

  if (score >= 70) {
    return "Good preparation. You can apply confidently, but should improve weak areas."
  }

  if (score >= 55) {
    return "Moderate preparation. You need focused practice before top interviews."
  }

  return "You need more preparation before appearing for placement interviews."
}

const buildCompanyReadiness = ({
  resumeScore,
  interviewScore,
  communicationScore,
  codingScore,
  aptitudeScore
}) => {
  return [
    {
      company: "TCS",
      score: clampScore(
        resumeScore * 0.2 +
          interviewScore * 0.25 +
          communicationScore * 0.25 +
          codingScore * 0.15 +
          aptitudeScore * 0.15
      ),
      verdict: "Good fit if basics, communication and aptitude are strong."
    },
    {
      company: "Infosys",
      score: clampScore(
        resumeScore * 0.2 +
          interviewScore * 0.25 +
          communicationScore * 0.2 +
          codingScore * 0.2 +
          aptitudeScore * 0.15
      ),
      verdict: "Focus on coding basics, projects and communication."
    },
    {
      company: "Accenture",
      score: clampScore(
        resumeScore * 0.25 +
          interviewScore * 0.25 +
          communicationScore * 0.25 +
          codingScore * 0.15 +
          aptitudeScore * 0.1
      ),
      verdict: "Strong communication and resume alignment matter here."
    },
    {
      company: "Cognizant",
      score: clampScore(
        resumeScore * 0.2 +
          interviewScore * 0.25 +
          communicationScore * 0.2 +
          codingScore * 0.2 +
          aptitudeScore * 0.15
      ),
      verdict: "Improve coding fundamentals and project explanation."
    },
    {
      company: "Amazon",
      score: clampScore(
        resumeScore * 0.15 +
          interviewScore * 0.2 +
          communicationScore * 0.15 +
          codingScore * 0.4 +
          aptitudeScore * 0.1
      ),
      verdict: "Needs strong DSA, problem solving and behavioral answers."
    },
    {
      company: "Google",
      score: clampScore(
        resumeScore * 0.15 +
          interviewScore * 0.15 +
          communicationScore * 0.1 +
          codingScore * 0.5 +
          aptitudeScore * 0.1
      ),
      verdict: "Needs excellent DSA, problem solving and system thinking."
    }
  ]
}

const buildRoadmap = ({ codingScore, communicationScore, resumeScore }) => {
  const roadmap = []

  roadmap.push({
    day: "Day 1",
    title: "Resume and Profile Cleanup",
    tasks: [
      resumeScore < 70
        ? "Improve resume keywords, project impact and measurable achievements."
        : "Review resume and add latest projects or deployment links.",
      "Update GitHub and LinkedIn links.",
      "Prepare a 60-second self introduction."
    ]
  })

  roadmap.push({
    day: "Day 2",
    title: "Core Technical Revision",
    tasks: [
      "Revise JavaScript, React, Node.js and MongoDB fundamentals.",
      "Prepare explanations for your top 2 projects.",
      "Practice explaining one bug or challenge you solved."
    ]
  })

  roadmap.push({
    day: "Day 3",
    title: "Coding Practice",
    tasks:
      codingScore < 70
        ? [
            "Practice arrays, strings and hash map problems.",
            "Solve at least 5 easy-medium coding questions.",
            "Revise time and space complexity."
          ]
        : [
            "Practice 3 medium coding questions.",
            "Focus on optimization and edge cases.",
            "Explain your approach out loud."
          ]
  })

  roadmap.push({
    day: "Day 4",
    title: "Communication Practice",
    tasks:
      communicationScore < 70
        ? [
            "Practice STAR method for HR answers.",
            "Reduce filler words and speak slowly.",
            "Record one mock answer and review it."
          ]
        : [
            "Practice concise project explanations.",
            "Prepare HR answers for strengths, weakness and teamwork.",
            "Improve answer confidence."
          ]
  })

  roadmap.push({
    day: "Day 5",
    title: "Aptitude and Reasoning",
    tasks: [
      "Practice percentage, ratio, time-work and speed-distance.",
      "Solve 20 reasoning questions.",
      "Review mistakes and formulas."
    ]
  })

  roadmap.push({
    day: "Day 6",
    title: "Mock Interview",
    tasks: [
      "Take one live AI interview.",
      "Review hiring probability and communication score.",
      "Repeat weak answers using improved answer suggestions."
    ]
  })

  roadmap.push({
    day: "Day 7",
    title: "Company-Specific Preparation",
    tasks: [
      "Choose target company.",
      "Revise company-specific questions.",
      "Take one final mock interview and coding round."
    ]
  })

  return roadmap
}

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      })
    }

    const latestReport = await PlacementReadiness.findOne({
      userId
    }).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      report: latestReport
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch placement readiness report",
      error: error.message
    })
  }
})

router.post("/generate", async (req, res) => {
  try {
    const { userId, resumeScore = 0, codingScore = 0, aptitudeScore = 0 } =
      req.body

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      })
    }

    const liveSessions = await LiveInterview.find({ userId }).sort({
      createdAt: -1
    })

    const normalSessions = await InterviewSession.find({ userId }).sort({
      createdAt: -1
    })

    const liveInterviewScores = liveSessions.map(
      (item) => Number(item.totalScore) || 0
    )

    const normalInterviewScores = normalSessions.map(
      (item) => Number(item.totalScore) || 0
    )

    const interviewScore = avg([
      ...liveInterviewScores,
      ...normalInterviewScores
    ])

    const communicationScore = avg(
      liveSessions.map(
        (item) => Number(item.averageCommunicationAnalysisScore) || 0
      )
    )

    const consistencyScore = clampScore(
      Math.min(liveSessions.length + normalSessions.length, 10) * 10
    )

    const finalResumeScore = clampScore(resumeScore)
    const finalCodingScore = clampScore(codingScore)
    const finalAptitudeScore = clampScore(aptitudeScore)

    const readinessScore = clampScore(
      finalResumeScore * 0.2 +
        interviewScore * 0.25 +
        communicationScore * 0.2 +
        finalCodingScore * 0.25 +
        finalAptitudeScore * 0.1
    )

    const strengths = []
    const weaknesses = []
    const priorityActions = []

    if (finalResumeScore >= 75) strengths.push("Strong resume foundation")
    else {
      weaknesses.push("Resume needs stronger keywords and project impact")
      priorityActions.push("Improve resume with measurable achievements.")
    }

    if (interviewScore >= 75) strengths.push("Good interview performance")
    else {
      weaknesses.push("Interview answers need improvement")
      priorityActions.push("Practice live AI interviews with feedback.")
    }

    if (communicationScore >= 75) strengths.push("Good communication quality")
    else {
      weaknesses.push("Communication needs more structure and confidence")
      priorityActions.push("Use STAR method and reduce filler words.")
    }

    if (finalCodingScore >= 75) strengths.push("Good coding readiness")
    else {
      weaknesses.push("Coding problem solving needs practice")
      priorityActions.push("Practice DSA problems daily.")
    }

    if (finalAptitudeScore >= 75) strengths.push("Good aptitude readiness")
    else {
      weaknesses.push("Aptitude score needs improvement")
      priorityActions.push("Practice aptitude formulas and timed quizzes.")
    }

    if (!strengths.length) strengths.push("You have started preparation")
    if (!priorityActions.length) {
      priorityActions.push("Continue mock interviews and company-specific prep.")
    }

    const companyReadiness = buildCompanyReadiness({
      resumeScore: finalResumeScore,
      interviewScore,
      communicationScore,
      codingScore: finalCodingScore,
      aptitudeScore: finalAptitudeScore
    })

    const roadmap = buildRoadmap({
      codingScore: finalCodingScore,
      communicationScore,
      resumeScore: finalResumeScore
    })

    const report = await PlacementReadiness.create({
      userId,
      readinessScore,
      resumeScore: finalResumeScore,
      interviewScore,
      communicationScore,
      codingScore: finalCodingScore,
      aptitudeScore: finalAptitudeScore,
      consistencyScore,
      level: getLevel(readinessScore),
      verdict: getVerdict(readinessScore),
      strengths,
      weaknesses,
      priorityActions,
      roadmap,
      companyReadiness
    })

    res.status(201).json({
      success: true,
      report
    })
  } catch (error) {
    console.log("Placement readiness error:", error)

    res.status(500).json({
      success: false,
      message: "Placement readiness generation failed",
      error: error.message
    })
  }
})

export default router