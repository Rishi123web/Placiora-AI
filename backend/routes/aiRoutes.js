import express from "express"
import axios from "axios"

const router = express.Router()

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "AI route working"
  })
})

router.post("/generate-questions", async (req, res) => {
  try {
    const { role, level } = req.body

    if (!role || !level) {
      return res.status(400).json({
        success: false,
        message: "Role and level are required"
      })
    }

    const prompt = `
Generate 10 interview questions for a ${level} level ${role} role.

Include:
- technical questions
- project-based questions
- practical questions

Give only numbered questions.
`

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat",
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    )

    res.status(200).json({
      success: true,
      questions: response.data?.choices?.[0]?.message?.content || ""
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "AI generation failed",
      error: error.response?.data || error.message
    })
  }
})

export default router