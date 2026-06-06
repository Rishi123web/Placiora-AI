import express from "express"
import mongoose from "mongoose"

import InterviewSession from "../models/InterviewSession.js"
import ResumeProfile from "../models/ResumeProfile.js"
import { evaluateInterviewAnswerAI } from "../utils/aiEvaluator.js"

const router = express.Router()

const companyQuestionBank = {
  General: [
    "Tell me about yourself.",
    "Explain your best project.",
    "What are your strongest technical skills?",
    "Describe a challenge you solved.",
    "Why should we hire you?"
  ],
  TCS: [
    "Tell me about yourself.",
    "Explain OOP concepts with examples.",
    "What is DBMS normalization?",
    "Explain your recent project.",
    "Why do you want to join TCS?"
  ],
  Infosys: [
    "Introduce yourself.",
    "Explain SDLC.",
    "What is polymorphism in Java?",
    "Explain SQL joins.",
    "Why Infosys?"
  ],
  Wipro: [
    "Tell me about yourself.",
    "Explain your technical skills.",
    "What is inheritance?",
    "What is REST API?",
    "Why Wipro?"
  ],
  Accenture: [
    "Tell me about yourself.",
    "Explain agile methodology.",
    "Describe a team project.",
    "How do you handle deadlines?",
    "Why Accenture?"
  ],
  Cognizant: [
    "Introduce yourself.",
    "Explain your project architecture.",
    "What is API integration?",
    "Explain database connectivity.",
    "Why Cognizant?"
  ],
  Deloitte: [
    "Tell me about yourself.",
    "Explain a business problem you solved with technology.",
    "Describe teamwork experience.",
    "How do you handle client requirements?",
    "Why Deloitte?"
  ],
  Amazon: [
    "Tell me about yourself.",
    "Describe a time you showed ownership.",
    "Explain a scalable project you built.",
    "How do you handle failure?",
    "Why Amazon?"
  ],
  Google: [
    "Tell me about yourself.",
    "Explain a complex technical problem you solved.",
    "How would you optimize your project?",
    "Explain data structures used in your project.",
    "Why Google?"
  ],
  Startup: [
    "Tell me about yourself.",
    "Can you work independently on full-stack features?",
    "Explain your most production-ready project.",
    "How fast can you learn a new technology?",
    "Why do you want to work in a startup?"
  ]
}

const extractSkillsFromJD = (jd = "") => {
  const skills = [
    "React",
    "JavaScript",
    "TypeScript",
    "Node.js",
    "Express",
    "MongoDB",
    "SQL",
    "REST API",
    "Git",
    "HTML",
    "CSS",
    "Tailwind",
    "Redux",
    "Next.js",
    "AWS",
    "Docker",
    "Python",
    "Java",
    "DSA",
    "OOP",
    "System Design",
    "Authentication",
    "JWT",
    "Cloudinary"
  ]

  const lowerJD = jd.toLowerCase()

  return skills.filter((skill) => lowerJD.includes(skill.toLowerCase()))
}

const generateJDQuestions = ({ jd, role, company }) => {
  const skills = extractSkillsFromJD(jd)

  const firstSkill = skills[0] || "your main technical skill"
  const secondSkill = skills[1] || "backend development"
  const thirdSkill = skills[2] || "problem solving"

  return {
    skills,
    questions: [
      `Tell me about yourself for the ${role} role at ${company}.`,
      `This job description mentions ${firstSkill}. Explain your experience with ${firstSkill}.`,
      `How have you used ${secondSkill} in a real project?`,
      `The JD expects ${thirdSkill}. Describe a project where you demonstrated this.`,
      `Why are you suitable for this ${role} position based on the given job description?`
    ]
  }
}

router.post("/generate", async (req, res) => {
  try {
    const { userId, role, difficulty, type, company } = req.body

    const selectedCompany = company || "General"
    const questions =
      companyQuestionBank[selectedCompany] || companyQuestionBank.General

    const session = await InterviewSession.create({
      userId:
        userId && mongoose.Types.ObjectId.isValid(userId) ? userId : null,
      role: role || "Frontend Developer",
      difficulty: difficulty || "Beginner",
      type: type || "Technical",
      company: selectedCompany,
      mode: "standard",
      questions,
      answers: [],
      totalScore: 0,
      completed: false
    })

    res.status(201).json({
      success: true,
      sessionId: session._id,
      questions,
      company: selectedCompany
    })
  } catch (error) {
    console.log("Interview generate error:", error)

    res.status(500).json({
      success: false,
      message: "Interview generation failed",
      error: error.message
    })
  }
})

router.post("/generate-from-jd", async (req, res) => {
  try {
    const { userId, role, difficulty, type, company, jobDescription } = req.body

    if (!jobDescription || jobDescription.trim().length < 30) {
      return res.status(400).json({
        success: false,
        message: "Please paste a valid job description."
      })
    }

    const selectedRole = role || "Full Stack Developer"
    const selectedCompany = company || "General"

    const result = generateJDQuestions({
      jd: jobDescription,
      role: selectedRole,
      company: selectedCompany
    })

    const session = await InterviewSession.create({
      userId:
        userId && mongoose.Types.ObjectId.isValid(userId) ? userId : null,
      role: selectedRole,
      difficulty: difficulty || "Beginner",
      type: type || "Technical",
      company: selectedCompany,
      mode: "jd",
      jobDescription,
      extractedSkills: result.skills,
      questions: result.questions,
      answers: [],
      totalScore: 0,
      completed: false
    })

    res.status(201).json({
      success: true,
      sessionId: session._id,
      questions: result.questions,
      extractedSkills: result.skills,
      company: selectedCompany,
      mode: "jd"
    })
  } catch (error) {
    console.log("JD interview generate error:", error)

    res.status(500).json({
      success: false,
      message: "JD based interview generation failed",
      error: error.message
    })
  }
})

router.post("/generate-from-resume", async (req, res) => {
  try {
    const { userId, resumeId, difficulty, type, company } = req.body

    if (!resumeId) {
      return res.status(400).json({
        success: false,
        message: "Resume ID is required"
      })
    }

    const resume = await ResumeProfile.findById(resumeId)

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume profile not found"
      })
    }

    const selectedCompany = company || "General"
    const skills = resume.skills || []
    const projects = resume.projects || []

    const questions = [
      `Tell me about yourself for ${selectedCompany}.`,
      skills.length > 0
        ? `Your resume mentions ${skills[0]}. Explain your experience with it.`
        : "Explain your strongest technical skill.",
      projects.length > 0
        ? `Explain this project from your resume: ${projects[0]}`
        : "Explain your best project.",
      "What challenges did you face while building your project?",
      `Why should ${selectedCompany} hire you?`
    ]

    const session = await InterviewSession.create({
      userId:
        userId && mongoose.Types.ObjectId.isValid(userId) ? userId : null,
      role: "Resume Based Role",
      difficulty: difficulty || "Beginner",
      type: type || "Technical",
      company: selectedCompany,
      mode: "resume",
      questions,
      answers: [],
      totalScore: 0,
      completed: false
    })

    res.status(201).json({
      success: true,
      sessionId: session._id,
      questions,
      company: selectedCompany
    })
  } catch (error) {
    console.log("Resume interview generate error:", error)

    res.status(500).json({
      success: false,
      message: "Resume based interview generation failed",
      error: error.message
    })
  }
})

router.post("/answer", async (req, res) => {
  try {
    const { sessionId, question, answer } = req.body

    if (!sessionId || !question || !answer) {
      return res.status(400).json({
        success: false,
        message: "Session, question and answer are required"
      })
    }

    const session = await InterviewSession.findById(sessionId)

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Interview session not found"
      })
    }

    const result = await evaluateInterviewAnswerAI({
      question,
      answer,
      role: session.role,
      difficulty: session.difficulty,
      company: session.company,
      mode: session.mode,
      jobDescription: session.jobDescription,
      extractedSkills: session.extractedSkills
    })

    session.answers.push({
      question,
      answer,
      feedback: result.feedback,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      improvedAnswer: result.improvedAnswer,
      score: result.score
    })

    session.totalScore = Math.round(
      session.answers.reduce((sum, item) => sum + item.score, 0) /
        session.answers.length
    )

    if (session.answers.length >= session.questions.length) {
      session.completed = true
    }

    await session.save()

    res.status(200).json({
      success: true,
      score: result.score,
      feedback: result.feedback,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      improvedAnswer: result.improvedAnswer,
      totalScore: session.totalScore,
      completed: session.completed
    })
  } catch (error) {
    console.log("AI interview evaluation error:", error)

    res.status(500).json({
      success: false,
      message: "AI answer evaluation failed",
      error: error.message
    })
  }
})

router.get("/history/:userId", async (req, res) => {
  try {
    const sessions = await InterviewSession.find({
      userId: req.params.userId
    }).sort({ createdAt: -1 })

    res.json({
      success: true,
      sessions
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Interview history failed",
      error: error.message
    })
  }
})

export default router