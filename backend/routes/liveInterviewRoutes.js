import express from "express"
import mongoose from "mongoose"
import multer from "multer"
import OpenAI from "openai"
import { toFile } from "openai/uploads"
import { createRequire } from "module"

import cloudinary from "../config/cloudinary.js"
import streamifier from "streamifier"
import mammoth from "mammoth"

import LiveInterview from "../models/LiveInterview.js"

const require = createRequire(import.meta.url)
const pdfParse = require("pdf-parse")

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024
  }
})

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY?.trim()

  if (!apiKey) return null

  return new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1"
  })
}

const clampScore = (value) => {
  const num = Number(value) || 0
  return Math.min(100, Math.max(0, Math.round(num)))
}

const extractJSON = (text = "") => {
  try {
    return JSON.parse(text)
  } catch {
    const arrayMatch = text.match(/\[[\s\S]*\]/)
    const objectMatch = text.match(/\{[\s\S]*\}/)

    try {
      if (arrayMatch) return JSON.parse(arrayMatch[0])
      if (objectMatch) return JSON.parse(objectMatch[0])
    } catch {
      return null
    }

    return null
  }
}

const getCompanyFocus = (company = "General") => {
  const focusMap = {
    Google: [
      "Problem Solving",
      "Scalability",
      "System Thinking",
      "Clean Code",
      "Optimization"
    ],
    Amazon: [
      "Leadership Principles",
      "Ownership",
      "Customer Obsession",
      "Problem Solving",
      "Behavioral Depth"
    ],
    Microsoft: [
      "Collaboration",
      "Product Thinking",
      "Debugging",
      "Cloud Basics",
      "Technical Fundamentals"
    ],
    TCS: [
      "Communication",
      "OOP",
      "DBMS",
      "Basic Programming",
      "Project Explanation"
    ],
    Infosys: [
      "SDLC",
      "OOP",
      "SQL",
      "Communication",
      "Aptitude Basics"
    ],
    Wipro: [
      "Project Explanation",
      "Cloud Basics",
      "DBMS",
      "Communication",
      "Technical Basics"
    ],
    Accenture: [
      "Scenario Handling",
      "Communication",
      "Project Explanation",
      "REST APIs",
      "Team Collaboration"
    ],
    Cognizant: [
      "Frontend Backend Basics",
      "Database Schema",
      "Technical Skills",
      "Communication",
      "Project Explanation"
    ],
    Capgemini: [
      "OOP",
      "API Integration",
      "Teamwork",
      "Communication",
      "Project Explanation"
    ],
    General: [
      "Technical Skills",
      "Project Explanation",
      "Communication",
      "Problem Solving",
      "Confidence"
    ]
  }

  return focusMap[company] || focusMap.General
}

const fallbackQuestions = (role = "Frontend Developer", company = "General") => {
  const companyQuestions = {
    Google: [
      `Tell me about yourself for a ${role} role.`,
      "Explain a complex technical problem you solved and how you optimized it.",
      "How would you design a scalable web application used by millions of users?",
      "Describe a project where you made an important technical trade-off.",
      "Why Google?"
    ],
    Amazon: [
      "Tell me about a time you showed ownership in a project.",
      "Describe a difficult technical problem you solved.",
      "Tell me about a time you disagreed with teammates and how you handled it.",
      `Explain your strongest ${role} project with impact.`,
      "Why Amazon?"
    ],
    Microsoft: [
      `Tell me about yourself for a ${role} role.`,
      "Describe a project where collaboration was critical.",
      "How do you debug production or live application issues?",
      "Explain a technical challenge and how you solved it.",
      "Why Microsoft?"
    ],
    TCS: [
      "Introduce yourself.",
      "Explain your major project.",
      "What are OOP concepts?",
      "What is DBMS?",
      "Why do you want to join TCS?"
    ],
    Infosys: [
      "Tell me about yourself.",
      "Explain SDLC.",
      "What are your strengths and weaknesses?",
      "What is the difference between SQL and NoSQL?",
      "Why Infosys?"
    ],
    Wipro: [
      "Introduce yourself.",
      "Explain your best project.",
      "What is cloud computing?",
      "What is normalization?",
      "Why Wipro?"
    ],
    Accenture: [
      "Tell me about yourself.",
      "Describe a project challenge you solved.",
      "How do you handle deadlines?",
      "Explain REST API.",
      "Why Accenture?"
    ],
    Cognizant: [
      "Tell me about yourself.",
      "Explain your technical skills.",
      "What is the difference between frontend and backend?",
      "What is a database schema?",
      "Why Cognizant?"
    ],
    Capgemini: [
      "Tell me about yourself.",
      "Explain OOP principles.",
      "Describe a teamwork experience.",
      "What is API integration?",
      "Why Capgemini?"
    ],
    General: [
      `Tell me about yourself for a ${role} role.`,
      `Explain your best project related to ${role}.`,
      "What are your strongest technical skills?",
      "Describe a challenge you solved in a project.",
      `Why should we hire you for this ${role} role?`
    ]
  }

  return companyQuestions[company] || companyQuestions.General
}

const extractResumeText = async (file) => {
  if (!file) return ""

  const mime = file.mimetype || ""
  const name = file.originalname?.toLowerCase() || ""

  try {
    if (mime.includes("pdf") || name.endsWith(".pdf")) {
      const data = await pdfParse(file.buffer)
      return data.text || ""
    }

    if (
      mime.includes("word") ||
      name.endsWith(".docx") ||
      name.endsWith(".doc")
    ) {
      const data = await mammoth.extractRawText({
        buffer: file.buffer
      })

      return data.value || ""
    }

    return file.buffer.toString("utf-8")
  } catch (error) {
    console.log("Resume text extraction error:", error.message)
    return ""
  }
}

const generateResumeQuestions = async ({
  resumeText,
  role = "Frontend Developer",
  difficulty = "Beginner",
  company = "General"
}) => {
  const groq = getGroqClient()

  if (!groq || !resumeText.trim()) {
    return fallbackQuestions(role, company)
  }

  const companyFocus = getCompanyFocus(company)

  const prompt = `
You are an AI technical interviewer.

Role: ${role}
Difficulty: ${difficulty}
Company: ${company}
Company focus areas: ${companyFocus.join(", ")}

Resume text:
${resumeText.slice(0, 6000)}

Generate exactly 5 interview questions based on:
- Candidate's resume projects
- Candidate's skills
- Target company style
- Role and difficulty

Return ONLY JSON array:
[
  "question 1",
  "question 2",
  "question 3",
  "question 4",
  "question 5"
]
`

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4
    })

    const parsed = extractJSON(response.choices[0].message.content)

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, 5).map((item) => String(item))
    }

    return fallbackQuestions(role, company)
  } catch (error) {
    console.log("Resume question generation error:", error.message)
    return fallbackQuestions(role, company)
  }
}

const analyzeCommunication = (transcript = "") => {
  const text = transcript.toLowerCase()
  const words = text.match(/\b[a-zA-Z]+\b/g) || []
  const wordCount = words.length

  const fillerList = [
    "um",
    "uh",
    "like",
    "actually",
    "basically",
    "literally",
    "maybe",
    "probably",
    "kind",
    "sort"
  ]

  const fillerWords = []

  fillerList.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi")
    const matches = transcript.match(regex)

    if (matches) {
      matches.forEach(() => fillerWords.push(word))
    }
  })

  const fillerWordCount = fillerWords.length
  const estimatedMinutes = Math.max(wordCount / 135, 0.5)
  const speakingSpeed = Math.round(wordCount / estimatedMinutes)

  let speakingSpeedStatus = "Good"

  if (speakingSpeed < 100) {
    speakingSpeedStatus = "Too Slow"
  } else if (speakingSpeed <= 160) {
    speakingSpeedStatus = "Ideal"
  } else if (speakingSpeed <= 190) {
    speakingSpeedStatus = "Slightly Fast"
  } else {
    speakingSpeedStatus = "Too Fast"
  }

  const professionalTerms = [
    "api",
    "database",
    "mongodb",
    "react",
    "node",
    "express",
    "javascript",
    "authentication",
    "deployment",
    "optimization",
    "performance",
    "scalability",
    "architecture",
    "component",
    "backend",
    "frontend",
    "fullstack",
    "algorithm",
    "security",
    "cloud",
    "server",
    "client",
    "routing",
    "middleware",
    "schema",
    "testing",
    "debugging",
    "validation",
    "responsive",
    "rest",
    "jwt"
  ]

  const matchedProfessionalTerms = professionalTerms.filter((term) =>
    text.includes(term)
  )

  const professionalVocabularyScore = clampScore(
    Math.min(matchedProfessionalTerms.length * 10, 100)
  )

  const starKeywords = {
    situation: ["situation", "problem", "context", "project", "scenario"],
    task: ["task", "goal", "responsibility", "requirement", "needed"],
    action: ["action", "implemented", "created", "built", "developed", "solved"],
    result: ["result", "outcome", "improved", "reduced", "increased", "learned"]
  }

  let starStructureScore = 0

  Object.values(starKeywords).forEach((keywords) => {
    const found = keywords.some((keyword) => text.includes(keyword))
    if (found) starStructureScore += 25
  })

  const fillerPenalty = Math.min(fillerWordCount * 4, 35)

  const speedScore =
    speakingSpeedStatus === "Ideal"
      ? 100
      : speakingSpeedStatus === "Good"
      ? 85
      : speakingSpeedStatus === "Slightly Fast"
      ? 70
      : 55

  const lengthScore =
    wordCount >= 60 ? 100 : wordCount >= 35 ? 80 : wordCount >= 20 ? 60 : 40

  const communicationAnalysisScore = clampScore(
    speedScore * 0.3 +
      lengthScore * 0.25 +
      professionalVocabularyScore * 0.25 +
      starStructureScore * 0.2 -
      fillerPenalty
  )

  return {
    fillerWordCount,
    fillerWords,
    wordCount,
    speakingSpeed,
    speakingSpeedStatus,
    professionalVocabularyScore,
    starStructureScore,
    communicationAnalysisScore
  }
}

const calculateAverages = (answers = []) => {
  if (!answers.length) {
    return {
      totalScore: 0,
      technicalAverage: 0,
      communicationAverage: 0,
      confidenceAverage: 0,
      clarityAverage: 0,
      problemSolvingAverage: 0,
      averageCommunicationAnalysisScore: 0,
      averageProfessionalVocabularyScore: 0,
      averageStarStructureScore: 0
    }
  }

  const avg = (key) =>
    Math.round(
      answers.reduce((sum, item) => sum + (Number(item[key]) || 0), 0) /
        answers.length
    )

  return {
    totalScore: avg("score"),
    technicalAverage: avg("technicalScore"),
    communicationAverage: avg("communicationScore"),
    confidenceAverage: avg("confidenceScore"),
    clarityAverage: avg("clarityScore"),
    problemSolvingAverage: avg("problemSolvingScore"),
    averageCommunicationAnalysisScore: avg("communicationAnalysisScore"),
    averageProfessionalVocabularyScore: avg("professionalVocabularyScore"),
    averageStarStructureScore: avg("starStructureScore")
  }
}

const calculateHiringReport = ({
  technicalAverage = 0,
  communicationAverage = 0,
  confidenceAverage = 0,
  clarityAverage = 0,
  problemSolvingAverage = 0,
  totalScore = 0
}) => {
  const technical = clampScore(technicalAverage)
  const communication = clampScore(communicationAverage)
  const confidence = clampScore(confidenceAverage)
  const clarity = clampScore(clarityAverage)
  const problemSolving = clampScore(problemSolvingAverage)
  const overall = clampScore(totalScore)

  const hiringProbability = clampScore(
    technical * 0.35 +
      communication * 0.22 +
      confidence * 0.18 +
      clarity * 0.1 +
      problemSolving * 0.15
  )

  let selectionLevel = "Needs Improvement"
  let recruiterVerdict =
    "Candidate needs more preparation before appearing for interviews."

  if (hiringProbability >= 85) {
    selectionLevel = "Excellent"
    recruiterVerdict =
      "Strong candidate. High chance of clearing technical and HR rounds."
  } else if (hiringProbability >= 70) {
    selectionLevel = "Good"
    recruiterVerdict =
      "Good candidate. Likely to clear initial rounds with minor improvements."
  } else if (hiringProbability >= 50) {
    selectionLevel = "Moderate"
    recruiterVerdict =
      "Average candidate. Needs more practice before final placement rounds."
  }

  const blockers = []
  const recommendations = []

  if (technical < 60) {
    blockers.push("Weak technical depth")
    recommendations.push("Revise core concepts and explain projects technically.")
  }

  if (communication < 60) {
    blockers.push("Communication needs improvement")
    recommendations.push("Practice structured answers using STAR method.")
  }

  if (confidence < 60) {
    blockers.push("Low confidence in answers")
    recommendations.push("Take more mock interviews and speak with clarity.")
  }

  if (clarity < 60) {
    blockers.push("Answers are not clear enough")
    recommendations.push("Use shorter sentences and explain step by step.")
  }

  if (problemSolving < 60) {
    blockers.push("Weak problem-solving explanation")
    recommendations.push("Explain approach, trade-offs, and final result clearly.")
  }

  if (!blockers.length) blockers.push("No major blocker detected")
  if (!recommendations.length) {
    recommendations.push("Keep practicing company-specific mock interviews.")
  }

  return {
    hiringProbability,
    technicalReadiness: technical,
    communicationReadiness: communication,
    confidenceReadiness: confidence,
    clarityReadiness: clarity,
    problemSolvingReadiness: problemSolving,
    overallReadiness: overall,
    selectionLevel,
    recruiterVerdict,
    blockers,
    recommendations
  }
}

const uploadBufferToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "prep-ai/live-interviews",
        resource_type: "video"
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    )

    streamifier.createReadStream(buffer).pipe(stream)
  })
}

router.post("/start", async (req, res) => {
  try {
    const {
      userId,
      role = "Frontend Developer",
      difficulty = "Beginner",
      company = "General",
      micEnabled,
      cameraEnabled
    } = req.body

    const companyFocus = getCompanyFocus(company)
    const questions = fallbackQuestions(role, company)

    const session = await LiveInterview.create({
      userId: userId && mongoose.Types.ObjectId.isValid(userId) ? userId : null,
      role,
      difficulty,
      company,
      companyFocus,
      questions,
      answers: [],
      micEnabled: !!micEnabled,
      cameraEnabled: !!cameraEnabled,
      completed: false
    })

    res.status(201).json({
      success: true,
      sessionId: session._id,
      company: session.company,
      companyFocus: session.companyFocus,
      questions,
      firstQuestion: questions[0]
    })
  } catch (error) {
    console.log("Live interview start error:", error)

    res.status(500).json({
      success: false,
      message: error.message || "Live interview start failed"
    })
  }
})

router.post("/start-resume", upload.single("resume"), async (req, res) => {
  try {
    const {
      userId,
      role = "Frontend Developer",
      difficulty = "Beginner",
      company = "General",
      micEnabled,
      cameraEnabled
    } = req.body

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Resume file is required"
      })
    }

    let resumeText = await extractResumeText(req.file)

    if (!resumeText.trim()) {
      resumeText = `
Resume file uploaded: ${req.file.originalname}
Role: ${role}
Company: ${company}
Difficulty: ${difficulty}
`
    }

    const companyFocus = getCompanyFocus(company)

    const questions = await generateResumeQuestions({
      resumeText,
      role,
      difficulty,
      company
    })

    const session = await LiveInterview.create({
      userId: userId && mongoose.Types.ObjectId.isValid(userId) ? userId : null,
      role,
      difficulty,
      company,
      companyFocus,
      questions,
      answers: [],
      micEnabled: !!micEnabled,
      cameraEnabled: !!cameraEnabled,
      completed: false
    })

    res.status(201).json({
      success: true,
      resumeBased: true,
      sessionId: session._id,
      company: session.company,
      companyFocus: session.companyFocus,
      questions,
      firstQuestion: questions[0]
    })
  } catch (error) {
    console.log("Resume based interview error:", error)

    res.status(500).json({
      success: false,
      message: error.message || "Resume based interview start failed"
    })
  }
})

router.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    const groq = getGroqClient()

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Audio file is required"
      })
    }

    if (!groq) {
      return res.status(500).json({
        success: false,
        message: "GROQ_API_KEY missing in backend .env"
      })
    }

    const audioFile = await toFile(req.file.buffer, "answer.webm", {
      type: req.file.mimetype || "audio/webm"
    })

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3"
    })

    res.status(200).json({
      success: true,
      transcript: transcription.text || ""
    })
  } catch (error) {
    console.log("Groq Whisper error:", error)

    res.status(500).json({
      success: false,
      message: error.message || "Groq Whisper transcription failed"
    })
  }
})

router.post("/answer", async (req, res) => {
  try {
    const groq = getGroqClient()
    const { sessionId, question, transcript } = req.body

    if (!sessionId || !question || !transcript) {
      return res.status(400).json({
        success: false,
        message: "Session, question and transcript are required"
      })
    }

    const session = await LiveInterview.findById(sessionId)

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Live interview session not found"
      })
    }

    const communicationAnalysis = analyzeCommunication(transcript)

    let result = {
      technicalScore: 60,
      communicationScore: 60,
      confidenceScore: 60,
      clarityScore: 60,
      problemSolvingScore: 60,
      overallScore: 60,
      feedback: "Good attempt. Add more structure, confidence and real examples.",
      strengths: ["You attempted the answer"],
      weaknesses: ["Needs more technical depth and clearer explanation"],
      improvedAnswer:
        "A stronger answer should use a clear structure, mention a real project example, explain your role, technologies used, challenge faced and result.",
      followUpQuestion:
        "Can you explain your answer with one real project example?"
    }

    if (groq) {
      const prompt = `
You are a strict but supportive AI technical interviewer.

Target Company: ${session.company || "General"}
Company Focus Areas: ${(session.companyFocus || []).join(", ")}

Question:
${question}

Candidate spoken answer:
${transcript}

Return ONLY valid JSON:
{
  "technicalScore": 0,
  "communicationScore": 0,
  "confidenceScore": 0,
  "clarityScore": 0,
  "problemSolvingScore": 0,
  "overallScore": 0,
  "feedback": "",
  "strengths": [],
  "weaknesses": [],
  "improvedAnswer": "",
  "followUpQuestion": ""
}
`

      try {
        const aiResponse = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.35
        })

        const parsed = extractJSON(aiResponse.choices[0].message.content)

        if (parsed && !Array.isArray(parsed)) {
          result = {
            technicalScore: parsed.technicalScore ?? result.technicalScore,
            communicationScore:
              parsed.communicationScore ?? result.communicationScore,
            confidenceScore: parsed.confidenceScore ?? result.confidenceScore,
            clarityScore: parsed.clarityScore ?? result.clarityScore,
            problemSolvingScore:
              parsed.problemSolvingScore ?? result.problemSolvingScore,
            overallScore: parsed.overallScore ?? result.overallScore,
            feedback: parsed.feedback || result.feedback,
            strengths: Array.isArray(parsed.strengths)
              ? parsed.strengths
              : result.strengths,
            weaknesses: Array.isArray(parsed.weaknesses)
              ? parsed.weaknesses
              : result.weaknesses,
            improvedAnswer: parsed.improvedAnswer || result.improvedAnswer,
            followUpQuestion: parsed.followUpQuestion || result.followUpQuestion
          }
        }
      } catch (error) {
        console.log("Groq evaluation fallback used:", error.message)
      }
    }

    const technicalScore = clampScore(result.technicalScore)
    const communicationScore = clampScore(result.communicationScore)
    const confidenceScore = clampScore(result.confidenceScore)
    const clarityScore = clampScore(result.clarityScore)
    const problemSolvingScore = clampScore(result.problemSolvingScore)

    const overallScore = clampScore(
      result.overallScore ||
        (technicalScore +
          communicationScore +
          confidenceScore +
          clarityScore +
          problemSolvingScore) /
          5
    )

    session.answers.push({
      question,
      transcript,
      score: overallScore,
      technicalScore,
      communicationScore,
      confidenceScore,
      clarityScore,
      problemSolvingScore,
      fillerWordCount: communicationAnalysis.fillerWordCount,
      fillerWords: communicationAnalysis.fillerWords,
      wordCount: communicationAnalysis.wordCount,
      speakingSpeed: communicationAnalysis.speakingSpeed,
      speakingSpeedStatus: communicationAnalysis.speakingSpeedStatus,
      professionalVocabularyScore:
        communicationAnalysis.professionalVocabularyScore,
      starStructureScore: communicationAnalysis.starStructureScore,
      communicationAnalysisScore:
        communicationAnalysis.communicationAnalysisScore,
      feedback: result.feedback || "",
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      improvedAnswer: result.improvedAnswer || "",
      followUpQuestion: result.followUpQuestion || ""
    })

    const averages = calculateAverages(session.answers)

    session.totalScore = averages.totalScore
    session.technicalAverage = averages.technicalAverage
    session.communicationAverage = averages.communicationAverage
    session.confidenceAverage = averages.confidenceAverage
    session.clarityAverage = averages.clarityAverage
    session.problemSolvingAverage = averages.problemSolvingAverage
    session.averageCommunicationAnalysisScore =
      averages.averageCommunicationAnalysisScore
    session.averageProfessionalVocabularyScore =
      averages.averageProfessionalVocabularyScore
    session.averageStarStructureScore = averages.averageStarStructureScore

    const hiringReport = calculateHiringReport({
      technicalAverage: session.technicalAverage,
      communicationAverage: session.communicationAverage,
      confidenceAverage: session.confidenceAverage,
      clarityAverage: session.clarityAverage,
      problemSolvingAverage: session.problemSolvingAverage,
      totalScore: session.totalScore
    })

    session.hiringProbability = hiringReport.hiringProbability
    session.technicalReadiness = hiringReport.technicalReadiness
    session.communicationReadiness = hiringReport.communicationReadiness
    session.confidenceReadiness = hiringReport.confidenceReadiness
    session.clarityReadiness = hiringReport.clarityReadiness
    session.problemSolvingReadiness = hiringReport.problemSolvingReadiness
    session.overallReadiness = hiringReport.overallReadiness
    session.selectionLevel = hiringReport.selectionLevel
    session.recruiterVerdict = hiringReport.recruiterVerdict
    session.blockers = hiringReport.blockers
    session.recommendations = hiringReport.recommendations

    if (session.answers.length >= session.questions.length) {
      session.completed = true
    }

    await session.save()

    res.status(200).json({
      success: true,
      company: session.company,
      companyFocus: session.companyFocus,
      score: overallScore,
      technicalScore,
      communicationScore,
      confidenceScore,
      clarityScore,
      problemSolvingScore,
      ...communicationAnalysis,
      feedback: result.feedback || "",
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      improvedAnswer: result.improvedAnswer || "",
      followUpQuestion: result.followUpQuestion || "",
      totalScore: session.totalScore,
      technicalAverage: session.technicalAverage,
      communicationAverage: session.communicationAverage,
      confidenceAverage: session.confidenceAverage,
      clarityAverage: session.clarityAverage,
      problemSolvingAverage: session.problemSolvingAverage,
      averageCommunicationAnalysisScore:
        session.averageCommunicationAnalysisScore,
      averageProfessionalVocabularyScore:
        session.averageProfessionalVocabularyScore,
      averageStarStructureScore: session.averageStarStructureScore,
      hiringProbability: session.hiringProbability,
      technicalReadiness: session.technicalReadiness,
      communicationReadiness: session.communicationReadiness,
      confidenceReadiness: session.confidenceReadiness,
      clarityReadiness: session.clarityReadiness,
      problemSolvingReadiness: session.problemSolvingReadiness,
      overallReadiness: session.overallReadiness,
      selectionLevel: session.selectionLevel,
      recruiterVerdict: session.recruiterVerdict,
      blockers: session.blockers,
      recommendations: session.recommendations,
      completed: session.completed
    })
  } catch (error) {
    console.log("Live answer evaluation error:", error)

    res.status(500).json({
      success: false,
      message: error.message || "Live answer evaluation failed"
    })
  }
})

router.post("/upload-recording", upload.single("video"), async (req, res) => {
  try {
    const { sessionId } = req.body

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required"
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Video file is required"
      })
    }

    const result = await uploadBufferToCloudinary(req.file.buffer)

    await LiveInterview.findByIdAndUpdate(sessionId, {
      recordingUrl: result.secure_url,
      recordingPublicId: result.public_id
    })

    res.status(200).json({
      success: true,
      recordingUrl: result.secure_url,
      recordingPublicId: result.public_id
    })
  } catch (error) {
    console.log("Recording upload error:", error)

    res.status(500).json({
      success: false,
      message: error.message || "Recording upload failed"
    })
  }
})

router.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(200).json({
        success: true,
        sessions: []
      })
    }

    const sessions = await LiveInterview.find({
      userId: new mongoose.Types.ObjectId(userId)
    }).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      sessions
    })
  } catch (error) {
    console.log("Live interview history error:", error)

    res.status(200).json({
      success: true,
      sessions: []
    })
  }
})

export default router