const express = require("express")
const axios = require("axios")

const router = express.Router()

router.post("/generate-questions", async (req, res) => {

    try {

        const { role, level } = req.body

        if (!role || !level) {
            return res.status(400).json({
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

                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            },

            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        )

        const questions =
            response.data.choices[0].message.content

        res.status(200).json({
            success: true,
            questions
        })

    } catch (error) {

        console.log("AI Error:", error.response?.data || error.message)

        res.status(500).json({
            message: "AI generation failed",
            error: error.response?.data || error.message
        })
    }
})

module.exports = router