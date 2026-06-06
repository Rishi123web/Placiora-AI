import express from "express"
import InterviewSession from "../models/InterviewSession.js"
import LiveInterview from "../models/LiveInterview.js"

const router = express.Router()

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params

    const normalInterviews = await InterviewSession.find({ userId }).sort({
      createdAt: -1
    })

    const liveInterviews = await LiveInterview.find({ userId }).sort({
      createdAt: -1
    })

    const formattedNormal = normalInterviews.map((item) => ({
      _id: item._id,
      mode: "AI Interview",
      role: item.role,
      difficulty: item.difficulty,
      totalScore: item.totalScore || 0,
      completed: item.completed,
      questions: item.questions || [],
      answers: item.answers || [],
      recordingUrl: "",
      createdAt: item.createdAt
    }))

    const formattedLive = liveInterviews.map((item) => ({
      _id: item._id,
      mode: "Live Interview",
      role: item.role,
      difficulty: item.difficulty,
      totalScore: item.totalScore || 0,
      completed: item.completed,
      questions: item.questions || [],
      answers: item.answers || [],
      recordingUrl: item.recordingUrl || "",
      createdAt: item.createdAt
    }))

    const history = [...formattedNormal, ...formattedLive].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )

    res.json({
      success: true,
      history
    })
  } catch (error) {
    console.log("Combined history error:", error)

    res.status(500).json({
      success: false,
      message: "Combined history fetch failed",
      error: error.message
    })
  }
})

export default router