import express from "express"
import multer from "multer"
import mongoose from "mongoose"
import ResumeProfile from "../models/ResumeProfile.js"

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
})

const extractSkillsFromText = (text = "") => {
  const skillList = [
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
    "Cloudinary",
    "API Integration",
    "Machine Learning",
    "Data Analysis"
  ]

  const lowerText = text.toLowerCase()

  return skillList.filter((skill) =>
    lowerText.includes(skill.toLowerCase())
  )
}

router.post("/analyze", upload.single("resume"), async (req, res) => {
  try {
    const { userId } = req.body

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Resume file is required"
      })
    }

    const fileName = req.file.originalname || "resume.pdf"

    const demoSkills = [
      "React",
      "JavaScript",
      "Node.js",
      "Express",
      "MongoDB",
      "REST API",
      "Git"
    ]

    const demoProjects = [
      "AI Interview Preparation Platform",
      "Resume Analyzer",
      "Full Stack Dashboard"
    ]

    const analysis = {
      atsScore: 78,
      summary:
        "Your resume has a strong full-stack profile. Add more measurable achievements, project impact, deployment links and keywords from the job description.",
      skills: demoSkills,
      projects: demoProjects,
      improvements: [
        "Add live project links and GitHub links.",
        "Mention measurable impact in projects.",
        "Add keywords from target job descriptions.",
        "Improve technical skills section with role-specific tools."
      ]
    }

    const resumeProfile = await ResumeProfile.create({
      userId:
        userId && mongoose.Types.ObjectId.isValid(userId)
          ? userId
          : null,
      fileName,
      atsScore: analysis.atsScore,
      summary: analysis.summary,
      skills: analysis.skills,
      projects: analysis.projects,
      improvements: analysis.improvements
    })

    res.status(200).json({
      success: true,
      resumeId: resumeProfile._id,
      analysis
    })
  } catch (error) {
    console.log("Resume analysis error:", error)

    res.status(500).json({
      success: false,
      message: "Resume analysis failed",
      error: error.message
    })
  }
})

router.post("/match-jd", async (req, res) => {
  try {
    const { resumeId, jobDescription } = req.body

    if (!resumeId) {
      return res.status(400).json({
        success: false,
        message: "Resume ID is required"
      })
    }

    if (!jobDescription || jobDescription.trim().length < 30) {
      return res.status(400).json({
        success: false,
        message: "Please paste a valid job description"
      })
    }

    const resume = await ResumeProfile.findById(resumeId)

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume profile not found"
      })
    }

    const resumeSkills = resume.skills || []
    const jdSkills = extractSkillsFromText(jobDescription)

    const matchedSkills = jdSkills.filter((skill) =>
      resumeSkills.some(
        (resumeSkill) =>
          resumeSkill.toLowerCase() === skill.toLowerCase()
      )
    )

    const missingSkills = jdSkills.filter(
      (skill) =>
        !resumeSkills.some(
          (resumeSkill) =>
            resumeSkill.toLowerCase() === skill.toLowerCase()
        )
    )

    const matchScore =
      jdSkills.length > 0
        ? Math.round((matchedSkills.length / jdSkills.length) * 100)
        : 50

    const suggestions = []

    if (missingSkills.length > 0) {
      suggestions.push(
        `Add or learn these missing skills: ${missingSkills.join(", ")}.`
      )
    }

    if (matchScore < 60) {
      suggestions.push(
        "Your resume needs stronger alignment with this job description."
      )
    } else if (matchScore < 80) {
      suggestions.push(
        "Good match. Add more JD keywords and project proof for missing areas."
      )
    } else {
      suggestions.push(
        "Strong match. Add measurable project impact to make it more convincing."
      )
    }

    suggestions.push(
      "Add role-specific keywords naturally in skills, projects and summary."
    )

    suggestions.push(
      "Mention deployment links, GitHub links and measurable outcomes."
    )

    res.status(200).json({
      success: true,
      match: {
        matchScore,
        resumeSkills,
        jdSkills,
        matchedSkills,
        missingSkills,
        suggestions,
        summary:
          matchScore >= 80
            ? "Your resume is strongly aligned with this job description."
            : matchScore >= 60
            ? "Your resume is moderately aligned. Improve missing skill coverage."
            : "Your resume has low alignment. Add more relevant skills and projects."
      }
    })
  } catch (error) {
    console.log("Resume JD match error:", error)

    res.status(500).json({
      success: false,
      message: "Resume vs JD match failed",
      error: error.message
    })
  }
})

export default router