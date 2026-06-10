import express from "express"
import Certificate from "../models/Certificate.js"

const router = express.Router()

const FRONTEND_URL =
  process.env.CLIENT_URL || "https://placiora-ai-h2oh.vercel.app"

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

    const finalScore = Math.min(Math.max(Number(score) || 85, 0), 100)

    const level =
      finalScore >= 90
        ? "Outstanding"
        : finalScore >= 80
        ? "Excellent"
        : finalScore >= 70
        ? "Advanced"
        : finalScore >= 60
        ? "Intermediate"
        : "Beginner"

    const certificateId = `PLACIORA-${Date.now()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`

    const certificate = await Certificate.create({
      userId,
      userName,
      userEmail,
      score: finalScore,
      level,
      certificateId,
      issuer: "Placiora AI",
      program: "Placement Preparation Program",
      duration: "40 Learning Hours",
      credentialUrl: `${FRONTEND_URL}/verify/${certificateId}`,
      skills: [
        "Technical Interviews",
        "Coding Assessments",
        "Resume Optimization",
        "HR Interview Preparation",
        "Career Readiness"
      ]
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
      message: "Failed to fetch certificate",
      error: error.message
    })
  }
})

router.get("/verify/:certificateId", async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      certificateId: req.params.certificateId
    })

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found"
      })
    }

    res.json({
      success: true,
      certificate
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Verification failed",
      error: error.message
    })
  }
})

export default router