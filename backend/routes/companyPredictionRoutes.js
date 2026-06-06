import express from "express"
import mongoose from "mongoose"

import CompanyPrediction from "../models/CompanyPrediction.js"
import LiveInterview from "../models/LiveInterview.js"
import HRInterview from "../models/HRInterview.js"
import SkillRoadmap from "../models/SkillRoadmap.js"

const router = express.Router()

const clampScore = (value) => {
  const num = Number(value) || 0
  return Math.min(100, Math.max(0, Math.round(num)))
}

const average = (items = []) => {
  const valid = items.map((item) => Number(item) || 0)

  if (!valid.length) return 0

  return clampScore(valid.reduce((sum, value) => sum + value, 0) / valid.length)
}

const getLevel = (score) => {
  if (score >= 85) return "Top Company Ready"
  if (score >= 70) return "Placement Ready"
  if (score >= 50) return "Service Company Ready"
  return "Needs Preparation"
}

const getBestFitType = (score) => {
  if (score >= 85) return "Product-Based Companies"
  if (score >= 70) return "Mid-Level + Service-Based Companies"
  if (score >= 50) return "Service-Based Companies"
  return "Practice Mode First"
}

const companyList = [
  {
    company: "TCS",
    tier: "service",
    minimum: 50
  },
  {
    company: "Infosys",
    tier: "service",
    minimum: 55
  },
  {
    company: "Wipro",
    tier: "service",
    minimum: 55
  },
  {
    company: "Cognizant",
    tier: "service",
    minimum: 60
  },
  {
    company: "Accenture",
    tier: "service",
    minimum: 62
  },
  {
    company: "Capgemini",
    tier: "service",
    minimum: 60
  },
  {
    company: "Microsoft",
    tier: "product",
    minimum: 82
  },
  {
    company: "Amazon",
    tier: "product",
    minimum: 85
  },
  {
    company: "Google",
    tier: "product",
    minimum: 88
  }
]

const makeCompanyPrediction = (company, placementProbability, scores) => {
  let probability = clampScore(
    placementProbability - Math.max(0, company.minimum - placementProbability)
  )

  if (company.tier === "product") {
    probability = clampScore(
      probability - 8 + scores.technical * 0.08 + scores.problemSolving * 0.08
    )
  }

  if (company.tier === "service") {
    probability = clampScore(
      probability + scores.communication * 0.06 + scores.hr * 0.06
    )
  }

  let reason = "Based on your overall placement readiness."

  if (company.tier === "product") {
    reason =
      "Product companies require stronger technical depth, problem solving and system thinking."
  }

  if (company.tier === "service") {
    reason =
      "Service companies focus strongly on communication, fundamentals, aptitude and HR readiness."
  }

  return {
    company: company.company,
    probability,
    reason
  }
}

const generateBlockers = (scores) => {
  const blockers = []

  if (scores.technical < 60) blockers.push("Technical knowledge is below selection level.")
  if (scores.communication < 60) blockers.push("Communication score needs improvement.")
  if (scores.confidence < 60) blockers.push("Confidence is low in interview answers.")
  if (scores.hr < 60) blockers.push("HR round readiness is weak.")
  if (scores.problemSolving < 60) blockers.push("Problem-solving explanation needs improvement.")

  if (!blockers.length) blockers.push("No major blocker detected.")

  return blockers
}

const generateRecommendations = (scores) => {
  const recommendations = []

  if (scores.technical < 70) {
    recommendations.push("Revise core CS topics and explain projects technically.")
  }

  if (scores.communication < 70) {
    recommendations.push("Practice structured answers daily using short and clear sentences.")
  }

  if (scores.hr < 70) {
    recommendations.push("Practice HR questions like self-introduction, strengths, weakness and why company.")
  }

  if (scores.problemSolving < 70) {
    recommendations.push("Solve coding problems and explain brute force plus optimized approach.")
  }

  recommendations.push("Use Skill Roadmap and Placement Readiness before applying.")

  return recommendations
}

router.post("/generate", async (req, res) => {
  try {
    const { userId } = req.body

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required"
      })
    }

    const liveSessions = await LiveInterview.find({
      userId: new mongoose.Types.ObjectId(userId)
    }).sort({ createdAt: -1 })

    const hrSessions = await HRInterview.find({
      userId: new mongoose.Types.ObjectId(userId)
    }).sort({ createdAt: -1 })

    const skillRoadmap = await SkillRoadmap.findOne({
      userId: new mongoose.Types.ObjectId(userId)
    }).sort({ createdAt: -1 })

    const scores = {
      technical: average(liveSessions.map((item) => item.technicalAverage)),
      communication: average([
        ...liveSessions.map((item) => item.communicationAverage),
        ...hrSessions.map((item) => item.communicationAverage)
      ]),
      confidence: average([
        ...liveSessions.map((item) => item.confidenceAverage),
        ...hrSessions.map((item) => item.confidenceAverage)
      ]),
      problemSolving: average(
        liveSessions.map((item) => item.problemSolvingAverage)
      ),
      hr: average(hrSessions.map((item) => item.hrSelectionProbability)),
      roadmap: skillRoadmap?.overallReadiness || 0
    }

    const placementProbability = clampScore(
      scores.technical * 0.25 +
        scores.communication * 0.2 +
        scores.confidence * 0.15 +
        scores.problemSolving * 0.15 +
        scores.hr * 0.15 +
        scores.roadmap * 0.1
    )

    const companyPredictions = companyList.map((company) =>
      makeCompanyPrediction(company, placementProbability, scores)
    )

    const readyNow = companyPredictions.filter((item) => item.probability >= 70)
    const needPractice = companyPredictions.filter(
      (item) => item.probability >= 45 && item.probability < 70
    )
    const stretchCompanies = companyPredictions.filter(
      (item) => item.probability < 45
    )

    const prediction = await CompanyPrediction.create({
      userId,
      placementProbability,
      currentLevel: getLevel(placementProbability),
      bestFitType: getBestFitType(placementProbability),
      readyNow,
      needPractice,
      stretchCompanies,
      blockers: generateBlockers(scores),
      recommendations: generateRecommendations(scores),
      finalVerdict:
        placementProbability >= 70
          ? "You are ready to apply to suitable companies. Keep improving weak areas and practice company-specific rounds."
          : "You should improve weak areas before applying widely. Follow Skill Roadmap and complete more mock interviews."
    })

    res.status(201).json({
      success: true,
      prediction
    })
  } catch (error) {
    console.log("Company prediction generate error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to generate company prediction",
      error: error.message
    })
  }
})

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(200).json({
        success: true,
        prediction: null
      })
    }

    const prediction = await CompanyPrediction.findOne({
      userId: new mongoose.Types.ObjectId(userId)
    }).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      prediction
    })
  } catch (error) {
    console.log("Company prediction fetch error:", error)

    res.status(200).json({
      success: true,
      prediction: null
    })
  }
})

export default router