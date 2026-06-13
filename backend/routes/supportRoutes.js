import express from "express"
import nodemailer from "nodemailer"

const router = express.Router()

const SUPPORT_TO_EMAIL = "placiora.support@gmail.com"

const escapeHtml = (value = "") => {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Support route working",
    supportEmailLoaded: Boolean(
      process.env.SUPPORT_EMAIL && process.env.SUPPORT_EMAIL_PASSWORD
    ),
    supportToEmail: SUPPORT_TO_EMAIL
  })
})

router.post("/send", async (req, res) => {
  try {
    const { category, message, userName, userEmail, name, email } = req.body

    const finalName = userName || name || "Unknown User"
    const finalEmail = userEmail || email || ""

    if (!category || !message) {
      return res.status(400).json({
        success: false,
        message: "Category and message are required"
      })
    }

    if (!process.env.SUPPORT_EMAIL || !process.env.SUPPORT_EMAIL_PASSWORD) {
      return res.status(500).json({
        success: false,
        message: "Support email is not configured"
      })
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SUPPORT_EMAIL,
        pass: process.env.SUPPORT_EMAIL_PASSWORD
      }
    })

    await transporter.verify()

    await transporter.sendMail({
      from: `"Placiora AI Support" <${process.env.SUPPORT_EMAIL}>`,
      to: SUPPORT_TO_EMAIL,
      replyTo: finalEmail || process.env.SUPPORT_EMAIL,
      subject: `Placiora AI Support Request - ${escapeHtml(category)}`,
      html: `
        <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;">
          <div style="max-width:640px;margin:auto;background:#ffffff;border-radius:18px;padding:24px;border:1px solid #e2e8f0;">
            <h2 style="color:#0f172a;margin-top:0;">New Placiora AI Support Request</h2>

            <p><b>Category:</b> ${escapeHtml(category)}</p>
            <p><b>User Name:</b> ${escapeHtml(finalName)}</p>
            <p><b>User Email:</b> ${escapeHtml(finalEmail || "No email found")}</p>

            <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />

            <h3 style="color:#0f172a;">Message</h3>
            <p style="white-space:pre-line;color:#334155;line-height:1.7;">${escapeHtml(message)}</p>
          </div>
        </div>
      `
    })

    if (finalEmail && finalEmail.includes("@")) {
      await transporter.sendMail({
        from: `"Placiora AI Support" <${process.env.SUPPORT_EMAIL}>`,
        to: finalEmail,
        subject: "We received your Placiora AI support request",
        html: `
          <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;">
            <div style="max-width:640px;margin:auto;background:#ffffff;border-radius:18px;padding:24px;border:1px solid #e2e8f0;">
              <h2 style="color:#0f172a;margin-top:0;">Support request received</h2>
              <p>Hi ${escapeHtml(finalName)},</p>
              <p>We received your support request. Our team will review it soon.</p>
              <p><b>Category:</b> ${escapeHtml(category)}</p>
              <p><b>Your message:</b></p>
              <p style="white-space:pre-line;color:#334155;line-height:1.7;">${escapeHtml(message)}</p>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />
              <p style="color:#64748b;">Placiora AI Support</p>
            </div>
          </div>
        `
      })
    }

    return res.json({
      success: true,
      message: "Support request sent successfully"
    })
  } catch (error) {
    console.log("Support Email Error:", error)

    return res.status(500).json({
      success: false,
      message: "Failed to send support request",
      error: error.message
    })
  }
})

export default router