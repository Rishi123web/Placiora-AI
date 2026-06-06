import express from "express"
import mongoose from "mongoose"
import OpenAI from "openai"

import AvatarMemory from "../models/AvatarMemory.js"
import LiveGDRound from "../models/LiveGDRound.js"
import InterviewSession from "../models/InterviewSession.js"

const router = express.Router()

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY?.trim()

  if (!apiKey) return null

  return new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1"
  })
}

const isValidObjectId = (id) => {
  return id && mongoose.Types.ObjectId.isValid(id)
}

const getMemoryDoc = async ({ userId = "", email = "" }) => {
  const query = isValidObjectId(userId)
    ? { userId: new mongoose.Types.ObjectId(userId) }
    : { email }

  let doc = await AvatarMemory.findOne(query)

  if (!doc) {
    doc = await AvatarMemory.create(query)
  }

  return doc
}

const getUserPerformanceContext = async (userId = "") => {
  try {
    if (!isValidObjectId(userId)) {
      return {
        latestInterview: null,
        latestLiveGD: null
      }
    }

    const objectId = new mongoose.Types.ObjectId(userId)

    const latestInterview = await InterviewSession.findOne({
      userId: objectId
    })
      .sort({ createdAt: -1 })
      .lean()

    const latestLiveGD = await LiveGDRound.findOne({
      $or: [{ userId: objectId }, { "participants.userId": objectId }]
    })
      .sort({ createdAt: -1 })
      .lean()

    return {
      latestInterview: latestInterview
        ? {
            role: latestInterview.role || "Interview",
            difficulty: latestInterview.difficulty || "",
            type: latestInterview.type || "",
            totalScore: latestInterview.totalScore || 0,
            completed: latestInterview.completed || false,
            createdAt: latestInterview.createdAt
          }
        : null,

      latestLiveGD: latestLiveGD
        ? {
            topic: latestLiveGD.topic || "Live GD Round",
            company: latestLiveGD.company || "General",
            difficulty: latestLiveGD.difficulty || "",
            communicationScore: latestLiveGD.communicationScore || 0,
            contentScore: latestLiveGD.contentScore || 0,
            leadershipScore: latestLiveGD.leadershipScore || 0,
            confidenceScore: latestLiveGD.confidenceScore || 0,
            overallScore: latestLiveGD.overallScore || 0,
            feedback: latestLiveGD.feedback || "",
            completed: latestLiveGD.completed || false,
            createdAt: latestLiveGD.createdAt
          }
        : null
    }
  } catch (error) {
    console.log("Sifra context fetch error:", error.message)

    return {
      latestInterview: null,
      latestLiveGD: null
    }
  }
}

const getPageSpecialistPrompt = ({
  currentPath = "",
  pageMode = "",
  pageContext = {}
}) => {
  const path = String(currentPath || "").toLowerCase()
  const mode = String(pageMode || "").toLowerCase()

  if (path.includes("coding") || mode === "coding") {
    return `
Current Mode: Coding Round / IDE Copilot.

Act like GitHub Copilot + Cursor AI inside the Coding Round page.

Coding Rules:
- Detect the likely error or bug first.
- Explain the cause briefly and clearly.
- Give corrected copy-paste code.
- If the user asks for "full code", provide the complete updated file.
- If pageContext contains code, use that code as the source of truth.
- If pageContext contains language, adapt the answer to that language.
- If pageContext contains problem/title/test cases, use them while debugging.
- Include time complexity and space complexity for algorithmic solutions.
- Do not give vague advice.
- Do not say "check your code" without giving the actual fix.
- Prefer final working code over long theory.

Current Coding Page Context:
${JSON.stringify(pageContext, null, 2)}
`
  }

  if (path.includes("live-interview") || mode === "live-interview") {
    return `
Current Mode: Live Interview Coach.

Act like a recruiter and communication coach.
Help with:
- Better spoken answers
- STAR method
- Confidence improvement
- Clarity improvement
- Role-specific answers
- Company-specific answers
- Follow-up questions
- Hiring probability explanation
`
  }

  if (path.includes("resume") || mode === "resume") {
    return `
Current Mode: Resume and ATS Mentor.

Help with:
- ATS score improvement
- Project bullet rewriting
- Keyword optimization
- Role-specific resume suggestions
- Recruiter-friendly wording
- Resume-based interview preparation
`
  }

  if (path.includes("recruiter") || mode === "recruiter") {
    return `
Current Mode: Recruiter Dashboard.

Act like a hiring manager.
Explain:
- Candidate strengths
- Hiring risks
- Selection chances
- Target role fit
- Improvement roadmap
`
  }

  if (path.includes("placement") || mode === "placement") {
    return `
Current Mode: Placement Mentor.

Give:
- Company-wise preparation strategy
- Practical next steps
- Weak area fixes
- Role and company targeting advice
`
  }

  if (path.includes("gd") || mode === "gd") {
    return `
Current Mode: GD Coach.

Help with:
- Structured points
- Opening statement
- Counterpoints
- Leadership lines
- Summary lines
- Confidence and listening skills
`
  }

  return `
Current Mode: General Prep AI Copilot.

Adapt to the current page and help the user quickly.
`
}

const systemPrompt = `
You are Sifra, the intelligent robotic AI copilot inside Prep AI.

You behave like ChatGPT, GitHub Copilot, Gemini and Cursor AI inside a coding, interview and placement preparation platform.

You help users with:
- Coding
- Debugging
- Full-stack development
- React
- Node.js
- MongoDB
- Express
- Interview preparation
- Resume improvement
- Placement preparation
- GD rounds
- HR rounds
- Aptitude
- System design

Personality:
- Smart
- Friendly
- Fast
- Practical
- Slightly futuristic
- Natural and conversational

Identity Rules:
- Your name is Sifra.
- Only mention your name if the user asks your name.
- Never introduce yourself repeatedly.
- Never start every response with "Hi", "Hello", "I am Sifra", "As Sifra", or similar.
- Continue conversations naturally like ChatGPT.
- Treat the conversation as ongoing.
- Assume the user already knows who you are.

Conversation Style:
- Be conversational.
- Continue from previous context.
- Do not greet the user repeatedly.
- Do not repeat the user's name.
- Do not repeat your own name.
- Avoid unnecessary introductions.
- Answer immediately.
- If the user asks follow-up questions, assume they refer to the previous discussion unless specified otherwise.

General Rules:
- Keep normal answers short and useful.
- Use memory and performance context when available.
- If user asks what to improve, give direct next steps.
- If user asks about score/performance, refer to available context.
- If no score exists, say they should complete that module first.
- If user asks to open a page/module, reply naturally like "Opening Live Interview for you."
- Do not pretend to actually navigate. Frontend handles navigation.

Coding Answer Rules:
- If the user asks for code, always provide properly formatted markdown code blocks.
- Use this structure for coding answers when suitable:
  1. Cause
  2. Fix
  3. Full Corrected Code
  4. Time Complexity
  5. Space Complexity
  6. Interview Tip
- Do not give messy or broken code.
- If the user asks for "full code", give the full updated file.
- If the user asks to fix an error, explain the cause briefly and give corrected code.
- If current page is Coding Round, behave like an IDE copilot.
`

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Sifra avatar assistant route working"
  })
})

router.post("/remember", async (req, res) => {
  try {
    const { userId = "", email = "", text = "", type = "general" } =
      req.body || {}

    if (!text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Memory text is required"
      })
    }

    const doc = await getMemoryDoc({ userId, email })

    doc.memories.unshift({
      text: text.trim(),
      type
    })

    doc.memories = doc.memories.slice(0, 50)

    await doc.save()

    res.json({
      success: true,
      memories: doc.memories
    })
  } catch (error) {
    console.log("Sifra remember error:", error)

    res.status(500).json({
      success: false,
      message: "Memory save failed",
      error: error.message
    })
  }
})

router.post("/clear-memory", async (req, res) => {
  try {
    const { userId = "", email = "" } = req.body || {}
    const doc = await getMemoryDoc({ userId, email })

    doc.memories = []
    await doc.save()

    res.json({
      success: true,
      memories: []
    })
  } catch (error) {
    console.log("Sifra clear memory error:", error)

    res.status(500).json({
      success: false,
      message: "Memory clear failed",
      error: error.message
    })
  }
})

router.post("/memory", async (req, res) => {
  try {
    const { userId = "", email = "" } = req.body || {}
    const doc = await getMemoryDoc({ userId, email })

    res.json({
      success: true,
      memories: doc.memories || []
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Memory fetch failed",
      error: error.message
    })
  }
})

router.post("/chat", async (req, res) => {
  try {
    const { message = "", conversation = [], context = {} } = req.body || {}

    if (!message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required"
      })
    }

    const groq = getGroqClient()

    if (!groq) {
      return res.status(500).json({
        success: false,
        message: "Groq API key missing"
      })
    }

    const memoryDoc = await getMemoryDoc({
      userId: context.userId,
      email: context.userEmail
    })

    const performanceContext = await getUserPerformanceContext(context.userId)

    const pageSpecialistPrompt = getPageSpecialistPrompt({
      currentPath: context.currentPath,
      pageMode: context.pageMode,
      pageContext: context.pageContext
    })

    const cleanConversation = Array.isArray(conversation)
      ? conversation
          .slice(-8)
          .filter((item) => item?.role && item?.content)
          .map((item) => ({
            role: item.role === "user" ? "user" : "assistant",
            content: String(item.content).slice(0, 4000)
          }))
      : []

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: context.pageMode === "coding" ? 0.25 : 0.55,
      messages: [
        {
          role: "system",
          content: `${systemPrompt}

${pageSpecialistPrompt}`
        },
        ...cleanConversation,
        {
          role: "user",
          content: `
User message:
${message}

Current frontend context:
${JSON.stringify(context, null, 2)}

Saved long-term memory:
${JSON.stringify(memoryDoc.memories || [], null, 2)}

Latest performance context from database:
${JSON.stringify(performanceContext, null, 2)}

Answer naturally without repeating your name or greeting.
`
        }
      ]
    })

    const reply =
      response.choices?.[0]?.message?.content ||
      "I could not generate a response right now."

    res.json({
      success: true,
      reply,
      memories: memoryDoc.memories || [],
      performanceContext
    })
  } catch (error) {
    console.log("Sifra assistant error:", error)

    res.status(500).json({
      success: false,
      message: "Sifra assistant failed",
      error: error.message
    })
  }
})

export default router