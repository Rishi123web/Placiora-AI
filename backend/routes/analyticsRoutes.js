import express from "express"

import InterviewSession from "../models/InterviewSession.js"
import LiveInterview from "../models/LiveInterview.js"
import CodingSession from "../models/CodingSession.js"
import AptitudeSession from "../models/AptitudeSession.js"

const router = express.Router()

router.get("/dashboard/:userId", async (req, res) => {
  try {
    const { userId } = req.params

    const interviews = await InterviewSession.find({ userId }).sort({
      createdAt: 1
    })

    const liveInterviewsList = await LiveInterview.find({ userId }).sort({
      createdAt: 1
    })

    const codingRounds = await CodingSession.find({ userId }).sort({
      createdAt: 1
    })

    const aptitudeRounds = await AptitudeSession.find({ userId }).sort({
      createdAt: 1
    })

    const totalInterviews = interviews.length + liveInterviewsList.length
    const totalCodingRounds = codingRounds.length
    const totalAptitudeRounds = aptitudeRounds.length
    const liveInterviews = liveInterviewsList.length

    const interviewScores = interviews.map((item) => item.totalScore || 0)
    const liveScores = liveInterviewsList.map((item) => item.totalScore || 0)
    const codingScores = codingRounds.map((item) => item.score || 0)
    const aptitudeScores = aptitudeRounds.map((item) => item.score || 0)

    const allScores = [
      ...interviewScores,
      ...liveScores,
      ...codingScores,
      ...aptitudeScores
    ].filter((score) => score > 0)

    const completedSessions =
      interviews.filter((item) => item.completed).length +
      liveInterviewsList.length +
      codingRounds.length +
      aptitudeRounds.length

    const averageScore =
      allScores.length > 0
        ? Math.round(
            allScores.reduce((sum, score) => sum + score, 0) /
              allScores.length
          )
        : 0

    const bestScore = allScores.length > 0 ? Math.max(...allScores) : 0

    const latestScore =
      allScores.length > 0 ? allScores[allScores.length - 1] : 0

    const emotionSessions = liveInterviewsList.filter(
      (item) =>
        item.emotionMetrics &&
        item.emotionMetrics.finalConfidenceScore > 0
    )

    const getAverageEmotionMetric = (metricName) => {
      if (emotionSessions.length === 0) return 0

      const total = emotionSessions.reduce((sum, item) => {
        return sum + (item.emotionMetrics?.[metricName] || 0)
      }, 0)

      return Math.round(total / emotionSessions.length)
    }

    const averageConfidence = getAverageEmotionMetric("finalConfidenceScore")
    const averageEyeContact = getAverageEmotionMetric("eyeContactScore")
    const averageSmile = getAverageEmotionMetric("smileScore")
    const averageSpeakingConfidence =
      getAverageEmotionMetric("speakingConfidence")
    const averageFacePresence = getAverageEmotionMetric("facePresenceScore")

    const totalFillerWords = emotionSessions.reduce((sum, item) => {
      return sum + (item.emotionMetrics?.fillerWords || 0)
    }, 0)

    const totalLookingAway = emotionSessions.reduce((sum, item) => {
      return sum + (item.emotionMetrics?.lookingAwayCount || 0)
    }, 0)

    const scoreTrend = [
      ...interviews.map((item, index) => ({
        name: `I${index + 1}`,
        score: item.totalScore || 0
      })),
      ...liveInterviewsList.map((item, index) => ({
        name: `L${index + 1}`,
        score: item.totalScore || 0
      })),
      ...codingRounds.map((item, index) => ({
        name: `C${index + 1}`,
        score: item.score || 0
      })),
      ...aptitudeRounds.map((item, index) => ({
        name: `A${index + 1}`,
        score: item.score || 0
      }))
    ]

    const activityBreakdown = [
      { name: "Interviews", value: interviews.length },
      { name: "Live", value: liveInterviews },
      { name: "Coding", value: totalCodingRounds },
      { name: "Aptitude", value: totalAptitudeRounds }
    ]

    const skillRadar = [
      { skill: "Interview", value: averageScore },
      { skill: "Live", value: Math.min(liveInterviews * 15, 100) },
      { skill: "Coding", value: Math.min(totalCodingRounds * 15, 100) },
      { skill: "Aptitude", value: Math.min(totalAptitudeRounds * 15, 100) },
      { skill: "Consistency", value: Math.min(completedSessions * 10, 100) }
    ]

    const emotionRadar = [
      { skill: "Eye Contact", value: averageEyeContact },
      { skill: "Smile", value: averageSmile },
      { skill: "Speaking", value: averageSpeakingConfidence },
      { skill: "Face Presence", value: averageFacePresence },
      { skill: "Confidence", value: averageConfidence }
    ]

    const emotionTrend = liveInterviewsList.map((item, index) => ({
      name: `Live ${index + 1}`,
      confidence: item.emotionMetrics?.finalConfidenceScore || 0,
      eyeContact: item.emotionMetrics?.eyeContactScore || 0,
      speaking: item.emotionMetrics?.speakingConfidence || 0,
      smile: item.emotionMetrics?.smileScore || 0
    }))

    res.json({
      success: true,
      stats: {
        totalInterviews,
        totalCodingRounds,
        totalAptitudeRounds,
        liveInterviews,
        completedSessions,
        averageScore,
        bestScore,
        latestScore,

        averageConfidence,
        averageEyeContact,
        averageSmile,
        averageSpeakingConfidence,
        averageFacePresence,
        totalFillerWords,
        totalLookingAway,

        scoreTrend,
        activityBreakdown,
        skillRadar,
        emotionRadar,
        emotionTrend
      }
    })
  } catch (error) {
    console.log("Analytics Route Error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
      error: error.message
    })
  }
})

export default router