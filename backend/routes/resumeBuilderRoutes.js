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

const cleanText = (value = "") =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim()

const splitLines = (value = "") =>
  String(value || "")
    .split(/\n|;/)
    .map((item) => cleanText(item))
    .filter(Boolean)

const splitSkills = (value = "") =>
  String(value || "")
    .split(/,|\n|;/)
    .map((item) => cleanText(item))
    .filter(Boolean)

const safeArray = (value) => {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      if (typeof item === "string") return cleanText(item)

      if (typeof item === "object" && item !== null) {
        return cleanText(
          item.achievementDescription ||
            item.description ||
            item.projectDescription ||
            item.experienceDescription ||
            item.achievement ||
            item.title ||
            JSON.stringify(item)
        )
      }

      return cleanText(item)
    })
    .filter(Boolean)
}

const extractJSON = (text = "") => {
  try {
    return JSON.parse(text)
  } catch {
    const match = String(text || "").match(/\{[\s\S]*\}/)

    try {
      if (match) return JSON.parse(match[0])
    } catch {
      return null
    }

    return null
  }
}

const calculateAtsScore = (data = {}, aiResult = {}) => {
  let score = 35

  if (data.fullName) score += 5
  if (data.email) score += 5
  if (data.phone) score += 5
  if (data.linkedin || data.github || data.portfolio) score += 8
  if (data.education) score += 8
  if (splitSkills(data.skills).length >= 6) score += 12
  if (splitLines(data.projects).length >= 1 || safeArray(aiResult.generatedProjects).length >= 1) score += 10
  if (data.experience || safeArray(aiResult.generatedExperience).length >= 1) score += 8
  if (data.achievements || safeArray(aiResult.generatedAchievements).length >= 1) score += 4
  if (aiResult.generatedSummary && aiResult.generatedSummary.length > 100) score += 5

  return Math.min(98, Math.max(45, score))
}

const fallbackResume = (data) => {
  const role = cleanText(data.targetRole || "Full Stack Developer")
  const skills = splitSkills(data.skills).length
    ? splitSkills(data.skills)
    : ["React", "JavaScript", "Node.js", "Express", "MongoDB", "REST APIs"]

  return {
    generatedHeadline: role,
    generatedSummary: `Results-driven ${role} with hands-on experience building responsive web applications, REST APIs, database-driven systems and AI-powered projects. Strong foundation in full-stack development, clean UI implementation, backend integration and product-focused problem solving.`,
    generatedSkills: skills,
    generatedProjects: splitLines(data.projects).length
      ? splitLines(data.projects).map(
          (item) =>
            `${item} — Built production-ready features with modern frontend, backend and database technologies.`
        )
      : [
          "Built a full-stack AI interview preparation platform using React, Node.js, Express and MongoDB with resume analysis, coding rounds and live interview modules.",
          "Implemented authentication, dashboard analytics, AI feedback, interview history and role-based placement preparation workflows."
        ],
    generatedExperience: splitLines(data.experience).length
      ? splitLines(data.experience)
      : [
          "Developed full-stack features using React, Node.js, Express and MongoDB, focusing on reusable components, API integration and user-friendly dashboards."
        ],
    generatedAchievements: splitLines(data.achievements).length
      ? splitLines(data.achievements)
      : ["Built multiple portfolio-ready full-stack modules for placement preparation."]
  }
}

const generateResumeAI = async (data) => {
  const groq = getGroqClient()

  if (!groq) return fallbackResume(data)

  try {
    const prompt = `
Return ONLY valid JSON.

Create premium recruiter-ready resume content.

JSON format:
{
  "generatedHeadline": "short professional headline",
  "generatedSummary": "3-4 line strong professional summary",
  "generatedSkills": ["skill"],
  "generatedProjects": ["impact-focused bullet"],
  "generatedExperience": ["impact-focused bullet"],
  "generatedAchievements": ["achievement bullet"]
}

Candidate:
Name: ${data.fullName}
Role: ${data.targetRole}
Education: ${data.education}
Skills: ${data.skills}
Projects: ${data.projects}
Experience: ${data.experience}
Achievements: ${data.achievements}

Rules:
- Use strong action verbs.
- Make bullets measurable and recruiter friendly.
- Keep it ATS compatible.
- Do not invent fake company names.
- Do not return objects in arrays.
`

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.35
    })

    const parsed = extractJSON(response.choices?.[0]?.message?.content)

    if (!parsed) return fallbackResume(data)

    const fallback = fallbackResume(data)

    return {
      generatedHeadline: cleanText(parsed.generatedHeadline || fallback.generatedHeadline),
      generatedSummary: cleanText(parsed.generatedSummary || fallback.generatedSummary),
      generatedSkills: safeArray(parsed.generatedSkills).length
        ? safeArray(parsed.generatedSkills)
        : fallback.generatedSkills,
      generatedProjects: safeArray(parsed.generatedProjects).length
        ? safeArray(parsed.generatedProjects)
        : fallback.generatedProjects,
      generatedExperience: safeArray(parsed.generatedExperience).length
        ? safeArray(parsed.generatedExperience)
        : fallback.generatedExperience,
      generatedAchievements: safeArray(parsed.generatedAchievements).length
        ? safeArray(parsed.generatedAchievements)
        : fallback.generatedAchievements
    }
  } catch (error) {
    console.log("AI resume fallback used:", error.message)
    return fallbackResume(data)
  }
}

router.post("/generate", async (req, res) => {
  try {
    const data = req.body || {}
    const aiResult = await generateResumeAI(data)
    const atsScore = calculateAtsScore(data, aiResult)

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

    const resumeObject = resume.toObject()

    res.status(201).json({
      success: true,
      resume: {
        ...resumeObject,
        generatedHeadline: aiResult.generatedHeadline || data.targetRole || "",
        atsScore,
        template: data.template || "linkedin"
      }
    })
  } catch (error) {
    console.log("Resume builder generate error:", error)

    res.status(500).json({
      success: false,
      message: "Resume generation failed",
      error: process.env.NODE_ENV === "production" ? undefined : error.message
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
      error: process.env.NODE_ENV === "production" ? undefined : error.message
    })
  }
})

const drawPremiumHeader = (doc, resume) => {
  doc.rect(0, 0, doc.page.width, 118).fill("#0f172a")

  doc
    .fontSize(26)
    .fillColor("#ffffff")
    .text(resume.fullName || "Resume", 50, 34, {
      width: 330
    })

  doc
    .fontSize(12)
    .fillColor("#67e8f9")
    .text(resume.targetRole || "Professional Candidate", 50, 68)

  const contact = [
    resume.email,
    resume.phone,
    resume.location,
    resume.linkedin,
    resume.github,
    resume.portfolio
  ]
    .filter(Boolean)
    .join("  •  ")

  doc
    .fontSize(8.5)
    .fillColor("#cbd5e1")
    .text(contact, 50, 92, {
      width: doc.page.width - 100
    })
}

const sectionTitle = (doc, title, x, y, width) => {
  doc
    .fontSize(11)
    .fillColor("#0f172a")
    .text(title.toUpperCase(), x, y, {
      width
    })

  doc
    .moveTo(x, y + 16)
    .lineTo(x + width, y + 16)
    .strokeColor("#38bdf8")
    .lineWidth(1)
    .stroke()

  return y + 26
}

const bulletList = (doc, items, x, y, width) => {
  safeArray(items).forEach((item) => {
    doc
      .fontSize(9.3)
      .fillColor("#334155")
      .text(`• ${item}`, x, y, {
        width,
        lineGap: 2
      })

    y = doc.y + 6
  })

  return y
}

router.get("/download/:id", async (req, res) => {
  try {
    const resume = await ResumeBuilder.findById(req.params.id)

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found"
      })
    }

    const doc = new PDFDocument({
      margin: 0,
      size: "A4",
      bufferPages: true
    })

    const fileName = `${resume.fullName || "resume"}-placiora-premium-resume.pdf`

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`)

    doc.pipe(res)

    drawPremiumHeader(doc, resume)

    const pageW = doc.page.width
    const leftX = 50
    const rightX = 365
    const leftW = 280
    const rightW = 180

    let yLeft = 145
    let yRight = 145

    yLeft = sectionTitle(doc, "Professional Summary", leftX, yLeft, leftW)
    doc
      .fontSize(9.7)
      .fillColor("#334155")
      .text(resume.generatedSummary || "", leftX, yLeft, {
        width: leftW,
        lineGap: 3
      })
    yLeft = doc.y + 18

    yLeft = sectionTitle(doc, "Projects", leftX, yLeft, leftW)
    yLeft = bulletList(doc, resume.generatedProjects || [], leftX, yLeft, leftW)

    yLeft = sectionTitle(doc, "Experience", leftX, yLeft + 8, leftW)
    yLeft = bulletList(doc, resume.generatedExperience || [], leftX, yLeft, leftW)

    doc
      .rect(rightX - 18, 132, rightW + 36, 590)
      .fill("#f8fafc")

    yRight = sectionTitle(doc, "Skills", rightX, yRight, rightW)
    safeArray(resume.generatedSkills || []).forEach((skill) => {
      doc
        .roundedRect(rightX, yRight, Math.min(rightW, skill.length * 5.6 + 22), 19, 8)
        .fill("#e0f2fe")

      doc
        .fontSize(8.5)
        .fillColor("#075985")
        .text(skill, rightX + 9, yRight + 5, {
          width: rightW - 10
        })

      yRight += 25
    })

    yRight += 10
    yRight = sectionTitle(doc, "Education", rightX, yRight, rightW)
    doc.fontSize(9.2).fillColor("#334155").text(resume.education || "", rightX, yRight, {
      width: rightW,
      lineGap: 2
    })
    yRight = doc.y + 18

    yRight = sectionTitle(doc, "Achievements", rightX, yRight, rightW)
    yRight = bulletList(doc, resume.generatedAchievements || [], rightX, yRight, rightW)

    doc
      .fontSize(8)
      .fillColor("#64748b")
      .text("Generated by Placiora AI Resume Builder", 50, 780, {
        align: "center",
        width: pageW - 100
      })

    doc.end()
  } catch (error) {
    console.log("Resume PDF download error:", error)

    res.status(500).json({
      success: false,
      message: "Resume PDF download failed",
      error: process.env.NODE_ENV === "production" ? undefined : error.message
    })
  }
})

export default router
