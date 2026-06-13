import express from "express"
import { Resend } from "resend"

const router = express.Router()

const resend = new Resend(process.env.RESEND_API_KEY)

const SUPPORT_TO_EMAIL =
  process.env.SUPPORT_TO_EMAIL || "placiora.support@gmail.com"

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Support email route connected",
    resendLoaded: Boolean(process.env.RESEND_API_KEY),
    supportToEmail: SUPPORT_TO_EMAIL
  })
})

router.post("/send", async (req, res) => {
  try {
    const { category, message, userName, userEmail, name, email } = req.body

    const finalName = userName || name || "Unknown User"
    const finalEmail = userEmail || email || "No email found"

    if (!category || !message) {
      return res.status(400).json({
        success: false,
        message: "Category and message are required"
      })
    }

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "RESEND_API_KEY is missing"
      })
    }

    const result = await resend.emails.send({
      from: "Placiora AI Support <onboarding@resend.dev>",
      to: SUPPORT_TO_EMAIL,
      subject: `Placiora AI Support Request - ${category}`,
      replyTo: finalEmail.includes("@") ? finalEmail : undefined,
      html: `
        <h2>New Placiora AI Support Request</h2>
        <p><b>Category:</b> ${category}</p>
        <p><b>Name:</b> ${finalName}</p>
        <p><b>Email:</b> ${finalEmail}</p>
        <hr />
        <p style="white-space:pre-line">${message}</p>
      `
    })

    return res.json({
      success: true,
      message: "Support request sent successfully",
      result
    })
  } catch (error) {
    console.log("RESEND EMAIL ERROR:", error)

    return res.status(500).json({
      success: false,
      message: "Failed to send support request",
      error: error.message
    })
  }
})

export default router