import express from "express"
import Certificate from "../models/Certificate.js"

const router = express.Router()

router.post("/generate", async (req, res) => {
  try {
    const { userId, userName, userEmail, score } = req.body

    if (!userId || !userName) {
      return res.status(400).json({
        success: false,
        message: "User details are required"
      })
    }

    const existing = await Certificate.findOne({ userId })

    if (existing) {
      return res.json({
        success: true,
        certificate: existing
      })
    }

    const finalScore = Number(score) || 75

    const level =
      finalScore >= 90
        ? "Outstanding"
        : finalScore >= 75
        ? "Excellent"
        : finalScore >= 60
        ? "Good"
        : "Beginner"

    const certificate = await Certificate.create({
      userId,
      userName,
      userEmail,
      score: finalScore,
      level,
      certificateId: `PLACIORA-${Date.now()}-${Math.floor(
        Math.random() * 9999
      )}`
    })

    res.status(201).json({
      success: true,
      certificate
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Certificate generation failed",
      error: error.message
    })
  }
})

router.get("/:userId", async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      userId: req.params.userId
    })

    res.json({
      success: true,
      certificate
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch certificate"
    })
  }
})

export default router