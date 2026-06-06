import express from "express"
import mongoose from "mongoose"
import PDFDocument from "pdfkit"
import OpenAI from "openai"

import ResumeBuilder from "../models/ResumeBuilder.js"

const router = express.Router()

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY?.trim()

  if (!apiKey) return null

  return new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1"
  })
}

const safeArray = (value) => {
  if (!Array.isArray(value)) return []

  return value.map((item) => {
    if (typeof item === "string") return item

    if (typeof item === "object" && item !== null) {
      return (
        item.achievementDescription ||
        item.description ||
        item.projectDescription ||
        item.experienceDescription ||
        item.achievement ||
        item.title ||
        JSON.stringify(item)
      )
    }

    return String(item)
  })
}

const extractJSON = (text = "") => {
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)

    try {
      if (match) return JSON.parse(match[0])
    } catch {
      return null
    }

    return null
  }
}

const fallbackResume = (data) => {
  const skills = data.skills
    ? data.skills.split(",").map((item) => item.trim()).filter(Boolean)
    : ["React", "JavaScript", "Node.js", "MongoDB", "REST API"]

  return {
    generatedSummary: `Aspiring ${
      data.targetRole || "Full Stack Developer"
    } with hands-on experience in building responsive web applications, REST APIs, database-driven systems and AI-powered projects.`,
    generatedSkills: skills,
    generatedProjects: [
      `Built ${
        data.projects || "a full-stack AI interview preparation platform"
      } using modern frontend and backend technologies.`,
      "Implemented authentication, dashboard analytics, resume analysis, interview history and AI feedback modules."
    ],
    generatedExperience: data.experience
      ? [data.experience]
      : ["Developed full-stack features using React, Node.js, Express and MongoDB."],
    generatedAchievements: data.achievements
      ? data.achievements.split("\n").filter(Boolean)
      : ["Built multiple portfolio-ready full-stack modules."]
  }
}

const generateResumeAI = async (data) => {
  const groq = getGroqClient()

  if (!groq) return fallbackResume(data)

  try {
    const prompt = `
Return ONLY valid JSON.

{
  "generatedSummary": "string",
  "generatedSkills": ["string"],
  "generatedProjects": ["string"],
  "generatedExperience": ["string"],
  "generatedAchievements": ["string"]
}

Candidate:
Name: ${data.fullName}
Role: ${data.targetRole}
Education: ${data.education}
Skills: ${data.skills}
Projects: ${data.projects}
Experience: ${data.experience}
Achievements: ${data.achievements}

Important:
- Every array item must be a plain string.
- Do not return objects inside arrays.
`

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    })

    const parsed = extractJSON(response.choices[0].message.content)

    if (!parsed) return fallbackResume(data)

    return {
      generatedSummary:
        parsed.generatedSummary || fallbackResume(data).generatedSummary,
      generatedSkills: safeArray(parsed.generatedSkills),
      generatedProjects: safeArray(parsed.generatedProjects),
      generatedExperience: safeArray(parsed.generatedExperience),
      generatedAchievements: safeArray(parsed.generatedAchievements)
    }
  } catch (error) {
    console.log("AI resume fallback used:", error.message)
    return fallbackResume(data)
  }
}

router.post("/generate", async (req, res) => {
  try {
    const data = req.body

    const aiResult = await generateResumeAI(data)

    const resume = await ResumeBuilder.create({
      userId:
        data.userId && mongoose.Types.ObjectId.isValid(data.userId)
          ? new mongoose.Types.ObjectId(data.userId)
          : null,

      fullName: data.fullName || "",
      email: data.email || "",
      phone: data.phone || "",
      location: data.location || "",
      linkedin: data.linkedin || "",
      github: data.github || "",
      portfolio: data.portfolio || "",
      targetRole: data.targetRole || "",
      education: data.education || "",
      skills: data.skills || "",
      projects: data.projects || "",
      experience: data.experience || "",
      achievements: data.achievements || "",

      generatedSummary: aiResult.generatedSummary || "",
      generatedSkills: safeArray(aiResult.generatedSkills),
      generatedProjects: safeArray(aiResult.generatedProjects),
      generatedExperience: safeArray(aiResult.generatedExperience),
      generatedAchievements: safeArray(aiResult.generatedAchievements)
    })

    res.status(201).json({
      success: true,
      resume
    })
  } catch (error) {
    console.log("Resume builder generate error:", error)

    res.status(500).json({
      success: false,
      message: "Resume generation failed",
      error: error.message
    })
  }
})

router.get("/history/:userId", async (req, res) => {
  try {
    const resumes = await ResumeBuilder.find({
      userId: req.params.userId
    }).sort({ createdAt: -1 })

    res.json({
      success: true,
      resumes
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Resume builder history failed",
      error: error.message
    })
  }
})

router.get("/download/:id", async (req, res) => {
  try {
    const resume = await ResumeBuilder.findById(req.params.id)

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found"
      })
    }

    const doc = new PDFDocument({ margin: 50 })
    const fileName = `${resume.fullName || "resume"}-prep-ai-resume.pdf`

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`)

    doc.pipe(res)

    doc.fontSize(24).fillColor("#111827").text(resume.fullName || "Resume", {
      align: "center"
    })

    doc.moveDown(0.4)

    doc
      .fontSize(10)
      .fillColor("#374151")
      .text(`${resume.email || ""} | ${resume.phone || ""} | ${resume.location || ""}`, {
        align: "center"
      })

    doc
      .fontSize(10)
      .fillColor("#374151")
      .text(`${resume.linkedin || ""} | ${resume.github || ""} | ${resume.portfolio || ""}`, {
        align: "center"
      })

    const section = (title) => {
      doc.moveDown(0.8)
      doc.fontSize(14).fillColor("#111827").text(title, { underline: true })
      doc.moveDown(0.3)
    }

    section("Professional Summary")
    doc.fontSize(11).fillColor("#374151").text(resume.generatedSummary || "")

    section("Skills")
    doc.fontSize(11).fillColor("#374151").text((resume.generatedSkills || []).join(", "))

    section("Education")
    doc.fontSize(11).fillColor("#374151").text(resume.education || "")

    section("Projects")
    ;(resume.generatedProjects || []).forEach((item) => {
      doc.fontSize(11).fillColor("#374151").text(`• ${item}`)
    })

    section("Experience")
    ;(resume.generatedExperience || []).forEach((item) => {
      doc.fontSize(11).fillColor("#374151").text(`• ${item}`)
    })

    section("Achievements")
    ;(resume.generatedAchievements || []).forEach((item) => {
      doc.fontSize(11).fillColor("#374151").text(`• ${item}`)
    })

    doc.moveDown(2)

    doc.fontSize(9).fillColor("#6b7280").text("Generated by Prep AI Resume Builder", {
      align: "center"
    })

    doc.end()
  } catch (error) {
    console.log("Resume PDF download error:", error)

    res.status(500).json({
      success: false,
      message: "Resume PDF download failed",
      error: error.message
    })
  }
})

export default router