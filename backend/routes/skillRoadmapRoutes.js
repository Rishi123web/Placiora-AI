import express from "express"
import mongoose from "mongoose"

import SkillRoadmap from "../models/SkillRoadmap.js"
import LiveInterview from "../models/LiveInterview.js"
import HRInterview from "../models/HRInterview.js"

const router = express.Router()

const clampScore = (value) => {
  const num = Number(value) || 0
  return Math.min(100, Math.max(0, Math.round(num)))
}

const average = (items = []) => {
  const valid = items.map((item) => Number(item) || 0)

  if (!valid.length) return 0

  return clampScore(
    valid.reduce((sum, value) => sum + value, 0) / valid.length
  )
}

const getPriority = (score) => {
  if (score < 50) return "High"
  if (score < 70) return "Medium"
  return "Low"
}

const getCurrentLevel = (score) => {
  if (score >= 85) return "Placement Ready"
  if (score >= 70) return "Almost Ready"
  if (score >= 50) return "Intermediate"
  return "Needs Strong Preparation"
}

const generateWeakSkills = (scores) => {
  const skillMap = [
    {
      skill: "Technical Knowledge",
      score: scores.technical,
      reason: "Based on technical interview and live interview scores.",
      action: "Revise core concepts, explain projects deeply and practice technical Q&A."
    },
    {
      skill: "Communication",
      score: scores.communication,
      reason: "Based on communication score, clarity and speaking quality.",
      action: "Practice speaking answers aloud using short structured sentences."
    },
    {
      skill: "Confidence",
      score: scores.confidence,
      reason: "Based on confidence score in live and HR interviews.",
      action: "Practice mock interviews daily and answer without hesitation."
    },
    {
      skill: "Problem Solving",
      score: scores.problemSolving,
      reason: "Based on problem-solving and explanation quality.",
      action: "Explain approach, trade-offs and result clearly for every answer."
    },
    {
      skill: "HR Readiness",
      score: scores.hr,
      reason: "Based on HR interview selection probability.",
      action: "Prepare self-introduction, strengths, weakness, why company and STAR stories."
    },
    {
      skill: "STAR Method",
      score: scores.star,
      reason: "Based on behavioral answer structure.",
      action: "Use Situation, Task, Action and Result in every experience-based answer."
    }
  ]

  return skillMap
    .sort((a, b) => a.score - b.score)
    .map((item) => ({
      ...item,
      score: clampScore(item.score),
      priority: getPriority(item.score)
    }))
}

const createSevenDayPlan = (weakSkills) => {
  const top = weakSkills.slice(0, 3)

  return [
    {
      day: "Day 1",
      title: "Fix Weakest Area",
      focusArea: top[0]?.skill || "Technical Knowledge",
      tasks: [
        top[0]?.action || "Revise your weakest topic.",
        "Practice 5 interview questions from this area.",
        "Record yourself answering one question."
      ],
      expectedOutcome: "Understand your biggest weakness and start correcting it."
    },
    {
      day: "Day 2",
      title: "Project Explanation Practice",
      focusArea: "Projects",
      tasks: [
        "Prepare one strong project explanation.",
        "Explain problem, tech stack, your role and result.",
        "Add measurable impact if possible."
      ],
      expectedOutcome: "You can explain your project clearly in interviews."
    },
    {
      day: "Day 3",
      title: "Communication Improvement",
      focusArea: top[1]?.skill || "Communication",
      tasks: [
        top[1]?.action || "Practice speaking clearly.",
        "Use 60-90 second answers.",
        "Remove filler words like um, actually and basically."
      ],
      expectedOutcome: "Your answers become clearer and more professional."
    },
    {
      day: "Day 4",
      title: "HR and Behavioral Answers",
      focusArea: "HR Readiness",
      tasks: [
        "Prepare Tell me about yourself.",
        "Prepare Why should we hire you.",
        "Prepare one STAR story for challenge/conflict."
      ],
      expectedOutcome: "You can handle common HR questions confidently."
    },
    {
      day: "Day 5",
      title: "Problem Solving Practice",
      focusArea: top[2]?.skill || "Problem Solving",
      tasks: [
        top[2]?.action || "Practice explaining problem-solving steps.",
        "Solve 2 coding or logic problems.",
        "Explain brute force and optimized approach."
      ],
      expectedOutcome: "Your reasoning and explanation improve."
    },
    {
      day: "Day 6",
      title: "Mock Interview Day",
      focusArea: "Live Interview",
      tasks: [
        "Complete one live interview session.",
        "Review AI feedback and hiring probability.",
        "Rewrite weak answers using improved answer suggestions."
      ],
      expectedOutcome: "You get a realistic interview performance check."
    },
    {
      day: "Day 7",
      title: "Final Revision and Report",
      focusArea: "Placement Readiness",
      tasks: [
        "Revise all weak areas.",
        "Take one HR round and one technical round.",
        "Generate placement readiness report."
      ],
      expectedOutcome: "You know whether you are ready for company interviews."
    }
  ]
}

const createThirtyDayRoadmap = () => {
  return [
    {
      day: "Week 1",
      title: "Foundation Week",
      focusArea: "Core Skills",
      tasks: [
        "Revise OOP, DBMS, OS and networking basics.",
        "Prepare two strong projects.",
        "Practice daily communication answers."
      ],
      expectedOutcome: "Strong foundation for service-based company interviews."
    },
    {
      day: "Week 2",
      title: "Coding and Aptitude Week",
      focusArea: "Online Assessment",
      tasks: [
        "Solve 15 coding problems.",
        "Practice aptitude daily.",
        "Review wrong answers and weak topics."
      ],
      expectedOutcome: "Better readiness for company online assessments."
    },
    {
      day: "Week 3",
      title: "Interview Performance Week",
      focusArea: "Technical + HR",
      tasks: [
        "Complete 3 AI interviews.",
        "Complete 2 HR rounds.",
        "Improve answers using feedback."
      ],
      expectedOutcome: "Better confidence and interview structure."
    },
    {
      day: "Week 4",
      title: "Company Target Week",
      focusArea: "Company-Specific Preparation",
      tasks: [
        "Practice company-specific interviews.",
        "Generate placement readiness report.",
        "Apply to roles matching your readiness."
      ],
      expectedOutcome: "You are ready to apply for internships and placements."
    }
  ]
}

const getRecommendedModules = (weakSkills) => {
  const skills = weakSkills.slice(0, 4).map((item) => item.skill)

  const modules = []

  if (skills.includes("Technical Knowledge")) modules.push("AI Interview")
  if (skills.includes("Communication")) modules.push("Live Interview")
  if (skills.includes("Confidence")) modules.push("Live Interview")
  if (skills.includes("Problem Solving")) modules.push("Coding Round")
  if (skills.includes("HR Readiness")) modules.push("HR Round")
  if (skills.includes("STAR Method")) modules.push("HR Round")

  modules.push("Placement Readiness")

  return [...new Set(modules)]
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

    const liveLatest = liveSessions[0] || {}
    const hrLatest = hrSessions[0] || {}

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
      star: average([
        ...liveSessions.map((item) => item.averageStarStructureScore),
        ...hrSessions.map((item) => item.starStructureAverage)
      ])
    }

    const overallReadiness = clampScore(
      scores.technical * 0.25 +
        scores.communication * 0.2 +
        scores.confidence * 0.15 +
        scores.problemSolving * 0.15 +
        scores.hr * 0.15 +
        scores.star * 0.1
    )

    const weakestSkills = generateWeakSkills(scores)
    const sevenDayPlan = createSevenDayPlan(weakestSkills)
    const thirtyDayRoadmap = createThirtyDayRoadmap()
    const recommendedModules = getRecommendedModules(weakestSkills)

    const priorityActions = weakestSkills
      .filter((item) => item.priority !== "Low")
      .slice(0, 5)
      .map((item) => item.action)

    const roadmap = await SkillRoadmap.create({
      userId,
      overallReadiness,
      currentLevel: getCurrentLevel(overallReadiness),
      weakestSkills,
      priorityActions,
      sevenDayPlan,
      thirtyDayRoadmap,
      recommendedModules,
      finalAdvice:
        overallReadiness >= 70
          ? "You are close to placement-ready. Focus on weak areas and keep practicing company-specific interviews."
          : "You need consistent preparation. Follow the 7-day plan first, then move to the 30-day roadmap."
    })

    res.status(201).json({
      success: true,
      roadmap,
      latestLiveInterview: liveLatest,
      latestHRInterview: hrLatest
    })
  } catch (error) {
    console.log("Skill roadmap generate error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to generate skill roadmap",
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
        roadmap: null
      })
    }

    const roadmap = await SkillRoadmap.findOne({
      userId: new mongoose.Types.ObjectId(userId)
    }).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      roadmap
    })
  } catch (error) {
    console.log("Skill roadmap fetch error:", error)

    res.status(200).json({
      success: true,
      roadmap: null
    })
  }
})

export default router