import express from "express"
import MockPlacementDrive from "../models/MockPlacementDrive.js"

const router = express.Router()

router.post("/generate", async (req, res) => {
  try {
    const {
      userId,
      company,
      aptitudeScore = 0,
      codingScore = 0,
      technicalScore = 0,
      systemDesignScore = 0,
      hrScore = 0
    } = req.body

    const overallScore = Math.round(
      (
        aptitudeScore +
        codingScore +
        technicalScore +
        systemDesignScore +
        hrScore
      ) / 5
    )

    let verdict = "Rejected"
    let placementChance = overallScore

    if (overallScore >= 80) {
      verdict = "Selected"
    } else if (overallScore >= 65) {
      verdict = "Waitlisted"
    }

    let salaryPrediction = "3-5 LPA"

    if (overallScore >= 90) {
      salaryPrediction = "12+ LPA"
    } else if (overallScore >= 80) {
      salaryPrediction = "8-12 LPA"
    } else if (overallScore >= 70) {
      salaryPrediction = "6-8 LPA"
    }

    const drive = await MockPlacementDrive.create({
      userId,
      company,
      aptitudeScore,
      codingScore,
      technicalScore,
      systemDesignScore,
      hrScore,
      overallScore,
      placementChance,
      verdict,
      salaryPrediction,
      completed: true,
      roundProgress: [
        {
          round: "Aptitude",
          score: aptitudeScore,
          completed: true
        },
        {
          round: "Coding",
          score: codingScore,
          completed: true
        },
        {
          round: "Technical",
          score: technicalScore,
          completed: true
        },
        {
          round: "System Design",
          score: systemDesignScore,
          completed: true
        },
        {
          round: "HR",
          score: hrScore,
          completed: true
        }
      ]
    })

    res.json({
      success: true,
      drive
    })
  } catch (error) {
    console.log(error)

    res.status(500).json({
      success: false,
      message: "Failed to generate placement report"
    })
  }
})

router.get("/:userId", async (req, res) => {
  try {
    const drives = await MockPlacementDrive.find({
      userId: req.params.userId
    }).sort({ createdAt: -1 })

    res.json({
      success: true,
      drives
    })
  } catch (error) {
    res.status(500).json({
      success: false
    })
  }
})

export default router