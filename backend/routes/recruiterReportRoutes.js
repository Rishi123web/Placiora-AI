import express from "express"
import mongoose from "mongoose"

import User from "../models/User.js"
import RecruiterReport from "../models/RecruiterReport.js"

const router = express.Router()

const clampScore = (value) => {
  const num = Number(value) || 0
  return Math.min(100, Math.max(0, Math.round(num)))
}

const statusFromScore = (score) => {
  if (score >= 80) return "Excellent"
  if (score >= 65) return "Good"
  if (score >= 50) return "Average"
  return "Weak"
}

const hiringStatusFromScore = (score) => {
  if (score >= 85) return "Strong Hire"
  if (score >= 70) return "Hire"
  if (score >= 55) return "Hold"
  return "Reject"
}

const getCollectionAverage = async (collectionName, userId, scoreFields = []) => {
  try {
    const collection = mongoose.connection.collection(collectionName)

    const docs = await collection
      .find({
        userId: new mongoose.Types.ObjectId(userId)
      })
      .sort({ createdAt: -1 })
      .toArray()

    const scores = []

    docs.forEach((doc) => {
      scoreFields.forEach((field) => {
        const value = Number(doc[field]) || 0
        if (value > 0) scores.push(value)
      })
    })

    if (!scores.length) return 0

    const avg =
      scores.reduce((sum, value) => sum + value, 0) / scores.length

    return clampScore(avg)
  } catch (error) {
    console.log(`Average fetch failed for ${collectionName}:`, error.message)
    return 0
  }
}

const getLatestValue = async (collectionName, userId, fields = []) => {
  try {
    const collection = mongoose.connection.collection(collectionName)

    const doc = await collection.findOne(
      {
        userId: new mongoose.Types.ObjectId(userId)
      },
      {
        sort: { createdAt: -1 }
      }
    )

    if (!doc) return 0

    for (const field of fields) {
      const value = Number(doc[field]) || 0
      if (value > 0) return clampScore(value)
    }

    return 0
  } catch (error) {
    console.log(`Latest fetch failed for ${collectionName}:`, error.message)
    return 0
  }
}

const buildVerdict = (status) => {
  if (status === "Strong Hire") {
    return "Candidate is a strong fit with excellent overall preparation and high placement readiness."
  }

  if (status === "Hire") {
    return "Candidate is suitable for hiring with good interview, technical and communication performance."
  }

  if (status === "Hold") {
    return "Candidate has potential but needs improvement in weaker areas before final selection."
  }

  return "Candidate is not yet ready for hiring and should complete more preparation before applying."
}

const buildStrengths = (scores) => {
  const strengths = []

  if (scores.resumeScore >= 70) strengths.push("Resume profile is recruiter friendly.")
  if (scores.aiInterviewScore >= 70) strengths.push("Good AI interview performance.")
  if (scores.liveInterviewScore >= 70) strengths.push("Strong live interview readiness.")
  if (scores.hrScore >= 70) strengths.push("Good HR communication readiness.")
  if (scores.codingScore >= 70) strengths.push("Good coding performance.")
  if (scores.aptitudeScore >= 70) strengths.push("Good aptitude preparation.")
  if (scores.systemDesignScore >= 70) strengths.push("Good system design understanding.")
  if (scores.oaScore >= 70) strengths.push("Good online assessment performance.")
  if (scores.placementProbability >= 70) strengths.push("Strong placement probability.")

  if (!strengths.length) {
    strengths.push("Candidate has started using multiple preparation modules.")
  }

  return strengths
}

const buildRisks = (scores) => {
  const risks = []

  if (scores.resumeScore < 55) risks.push("Resume needs stronger keywords, project impact and clarity.")
  if (scores.aiInterviewScore < 55) risks.push("AI interview answers need more depth.")
  if (scores.liveInterviewScore < 55) risks.push("Live interview confidence and clarity need improvement.")
  if (scores.hrScore < 55) risks.push("HR round readiness is weak.")
  if (scores.codingScore < 55) risks.push("Coding problem-solving needs improvement.")
  if (scores.aptitudeScore < 55) risks.push("Aptitude accuracy is below selection level.")
  if (scores.systemDesignScore < 55) risks.push("System design fundamentals need improvement.")
  if (scores.oaScore < 55) risks.push("Online assessment performance needs improvement.")

  if (!risks.length) risks.push("No major hiring risks detected.")

  return risks
}

const buildImprovementAreas = (scores) => {
  const areas = []

  if (scores.codingScore < 70) areas.push("Practice arrays, strings, hashing and time complexity.")
  if (scores.aptitudeScore < 70) areas.push("Practice aptitude topics like percentage, ratio, average and work-time.")
  if (scores.systemDesignScore < 70) areas.push("Improve architecture, APIs, database design and scalability explanation.")
  if (scores.hrScore < 70) areas.push("Practice HR answers using the STAR method.")
  if (scores.liveInterviewScore < 70) areas.push("Improve confidence, clarity and structured speaking.")
  if (scores.resumeScore < 70) areas.push("Improve resume with measurable project impact and ATS keywords.")

  if (!areas.length) areas.push("Keep practicing company-specific mock rounds.")

  return areas
}

router.post("/generate", async (req, res) => {
  try {
    const { userId, targetRole = "Full Stack Developer" } = req.body

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required"
      })
    }

    const objectUserId = new mongoose.Types.ObjectId(userId)

    const user = await User.findById(objectUserId)

    const resumeScore = await getLatestValue("resumebuilders", userId, [
      "atsScore",
      "resumeScore",
      "score"
    ])

    const fallbackResumeScore = resumeScore || 78

    const aiInterviewScore = await getCollectionAverage(
      "interviewsessions",
      userId,
      ["totalScore", "score", "overallScore"]
    )

    const liveInterviewScore = await getCollectionAverage(
      "liveinterviews",
      userId,
      ["totalScore", "overallReadiness", "hiringProbability"]
    )

    const hrScore = await getCollectionAverage(
      "hrinterviews",
      userId,
      ["hrSelectionProbability", "totalScore", "overallScore"]
    )

    const codingScore = await getCollectionAverage(
      "codingrounds",
      userId,
      ["score", "totalScore", "percentage"]
    )

    const aptitudeScore = await getCollectionAverage(
      "aptituderounds",
      userId,
      ["score", "totalScore", "percentage"]
    )

    const systemDesignScore = await getCollectionAverage(
      "systemdesigninterviews",
      userId,
      ["totalScore", "overallScore", "score"]
    )

    const oaScore = await getCollectionAverage(
      "oaassessments",
      userId,
      ["percentage", "selectionChance", "overallScore"]
    )

    const placementProbability = await getLatestValue(
      "companypredictions",
      userId,
      ["placementProbability", "overallScore", "score"]
    )

    const scores = {
      resumeScore: fallbackResumeScore,
      aiInterviewScore,
      liveInterviewScore,
      hrScore,
      codingScore,
      aptitudeScore,
      systemDesignScore,
      oaScore,
      placementProbability
    }

    const overallScore = clampScore(
      scores.resumeScore * 0.1 +
        scores.aiInterviewScore * 0.15 +
        scores.liveInterviewScore * 0.15 +
        scores.hrScore * 0.12 +
        scores.codingScore * 0.12 +
        scores.aptitudeScore * 0.12 +
        scores.systemDesignScore * 0.12 +
        scores.oaScore * 0.12 +
        scores.placementProbability * 0.1
    )

    const hiringStatus = hiringStatusFromScore(overallScore)

    const scoreBreakdown = [
      {
        label: "Resume",
        score: scores.resumeScore,
        status: statusFromScore(scores.resumeScore)
      },
      {
        label: "AI Interview",
        score: scores.aiInterviewScore,
        status: statusFromScore(scores.aiInterviewScore)
      },
      {
        label: "Live Interview",
        score: scores.liveInterviewScore,
        status: statusFromScore(scores.liveInterviewScore)
      },
      {
        label: "HR Round",
        score: scores.hrScore,
        status: statusFromScore(scores.hrScore)
      },
      {
        label: "Coding",
        score: scores.codingScore,
        status: statusFromScore(scores.codingScore)
      },
      {
        label: "Aptitude",
        score: scores.aptitudeScore,
        status: statusFromScore(scores.aptitudeScore)
      },
      {
        label: "System Design",
        score: scores.systemDesignScore,
        status: statusFromScore(scores.systemDesignScore)
      },
      {
        label: "OA",
        score: scores.oaScore,
        status: statusFromScore(scores.oaScore)
      },
      {
        label: "Placement Probability",
        score: scores.placementProbability,
        status: statusFromScore(scores.placementProbability)
      }
    ]

    const report = await RecruiterReport.create({
      userId: objectUserId,
      candidateName: user?.name || "",
      candidateEmail: user?.email || "",
      targetRole,
      ...scores,
      overallScore,
      hiringStatus,
      recruiterVerdict: buildVerdict(hiringStatus),
      strengths: buildStrengths(scores),
      risks: buildRisks(scores),
      improvementAreas: buildImprovementAreas(scores),
      scoreBreakdown
    })

    return res.status(201).json({
      success: true,
      report
    })
  } catch (error) {
    console.log("Recruiter report generate error:", error)

    return res.status(500).json({
      success: false,
      message: "Recruiter report generation failed",
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
        report: null
      })
    }

    const report = await RecruiterReport.findOne({
      userId: new mongoose.Types.ObjectId(userId)
    }).sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      report
    })
  } catch (error) {
    console.log("Recruiter report fetch error:", error)

    return res.status(200).json({
      success: true,
      report: null
    })
  }
})

export default router