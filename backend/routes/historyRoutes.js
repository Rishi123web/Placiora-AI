import express from "express"
import mongoose from "mongoose"

import InterviewSession from "../models/InterviewSession.js"
import LiveInterview from "../models/LiveInterview.js"
import LiveGDRound from "../models/LiveGDRound.js"

const router = express.Router()

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params
    const email = String(req.query.email || "").trim()

    const validUserId = userId && mongoose.Types.ObjectId.isValid(userId)
    const objectId = validUserId ? new mongoose.Types.ObjectId(userId) : null

    const normalInterviews = validUserId
      ? await InterviewSession.find({ userId }).sort({ createdAt: -1 })
      : []

    const liveInterviews = validUserId
      ? await LiveInterview.find({ userId }).sort({ createdAt: -1 })
      : []

    const gdQuery = []

    if (objectId) {
      gdQuery.push({ userId: objectId })
      gdQuery.push({ "participants.userId": objectId })
    }

    if (email) {
      gdQuery.push({ "participants.email": email })
    }

    const liveGDRounds = gdQuery.length
      ? await LiveGDRound.find({ $or: gdQuery }).sort({ createdAt: -1 })
      : []

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
      reportUrl: `/api/report/interview/${item._id}`,
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
      reportUrl: `/api/report/interview/live/${item._id}`,
      createdAt: item.createdAt
    }))

    const formattedGD = liveGDRounds.map((item) => ({
      _id: item._id,
      mode: "Live GD Round",
      role: item.topic || "Live GD Round",
      topic: item.topic || "",
      company: item.company || "General",
      difficulty: item.difficulty || "Beginner",
      totalScore: item.overallScore || 0,
      completed: item.completed,
      meetingCode: item.meetingCode || "",
      recruiterVerdict: item.recruiterVerdict || "",
      communicationScore: item.communicationScore || 0,
      contentScore: item.contentScore || 0,
      leadershipScore: item.leadershipScore || 0,
      confidenceScore: item.confidenceScore || 0,
      feedback: item.feedback || "",
      strengths: item.strengths || [],
      weaknesses: item.weaknesses || [],
      improvedResponse: item.improvedResponse || "",
      messages: item.messages || [],
      transcript: item.transcript || "",
      recordingUrl: item.recordingUrl || "",
      reportReady: Boolean(item.reportReady || item.completed),
      reportUrl: `/api/live-gd-round/report/${item._id}`,
      createdAt: item.createdAt
    }))

    const history = [...formattedNormal, ...formattedLive, ...formattedGD].sort(
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
      error: process.env.NODE_ENV === "production" ? undefined : error.message
    })
  }
})

export default router
