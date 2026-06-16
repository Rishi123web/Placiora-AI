import dotenv from "dotenv"
dotenv.config()

import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import http from "http"
import passport from "passport"
import { Server } from "socket.io"

import logger from "./utils/logger.js"

const { default: authRoutes } = await import("./routes/authRoutes.js")
const { default: oauthRoutes } = await import("./routes/oauthRoutes.js")
const { default: interviewRoutes } = await import("./routes/interviewRoutes.js")
const { default: resumeRoutes } = await import("./routes/resumeRoutes.js")
const { default: historyRoutes } = await import("./routes/historyRoutes.js")
const { default: aiRoutes } = await import("./routes/aiRoutes.js")
const { default: reportRoutes } = await import("./routes/reportRoutes.js")
const { default: codingRoutes } = await import("./routes/codingRoutes.js")
const { default: aptitudeRoutes } = await import("./routes/aptitudeRoutes.js")
const { default: analyticsRoutes } = await import("./routes/analyticsRoutes.js")
const { default: liveInterviewRoutes } = await import("./routes/liveInterviewRoutes.js")
const { default: resumeBuilderRoutes } = await import("./routes/resumeBuilderRoutes.js")
const { default: placementReadinessRoutes } = await import("./routes/placementReadinessRoutes.js")
const { default: systemDesignRoutes } = await import("./routes/systemDesignRoutes.js")
const { default: hrInterviewRoutes } = await import("./routes/hrInterviewRoutes.js")
const { default: skillRoadmapRoutes } = await import("./routes/skillRoadmapRoutes.js")
const { default: companyPredictionRoutes } = await import("./routes/companyPredictionRoutes.js")
const { default: oaAssessmentRoutes } = await import("./routes/oaAssessmentRoutes.js")
const { default: mockPlacementRoutes } = await import("./routes/mockPlacementRoutes.js")
const { default: recruiterReportRoutes } = await import("./routes/recruiterReportRoutes.js")
const { default: gdRoundRoutes } = await import("./routes/gdRoundRoutes.js")
const { default: liveGDRoundRoutes } = await import("./routes/liveGDRoundRoutes.js")
const { default: avatarAssistantRoutes } = await import("./routes/avatarAssistantRoutes.js")
const { default: supportRoutes } = await import("./routes/supportRoutes.js")
const { default: certificateRoutes } = await import("./routes/certificateRoutes.js")
const { default: setupLiveGDSocket } = await import("./sockets/liveGDSocket.js")

const app = express()
const server = http.createServer(app)

const PORT = process.env.PORT || 5000

const CLIENT_URL =
  process.env.CLIENT_URL ||
  process.env.FRONTEND_URL ||
  "http://localhost:5173"

const MONGO_URI = process.env.MONGO_URI?.trim()

const allowedOrigins = [
  CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000"
].filter(Boolean)

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }

    callback(new Error(`CORS blocked origin: ${origin}`))
  },
  credentials: true
}

logger.info("GROQ API:", process.env.GROQ_API_KEY ? "Loaded" : "Missing")
logger.info(
  "PISTON URL:",
  process.env.PISTON_URL || "http://localhost:2000/api/v2/execute"
)
logger.info(
  "Google OAuth:",
  process.env.GOOGLE_CLIENT_ID?.trim() &&
    process.env.GOOGLE_CLIENT_SECRET?.trim()
    ? "Loaded"
    : "Missing"
)
logger.info(
  "Support Email:",
  process.env.SUPPORT_EMAIL && process.env.SUPPORT_EMAIL_PASSWORD
    ? "Loaded"
    : "Missing"
)
logger.info("Mongo URI:", MONGO_URI ? "Loaded" : "Missing")
logger.info("Client URL:", CLIENT_URL)

app.use(cors(corsOptions))
app.use(express.json({ limit: "100mb" }))
app.use(express.urlencoded({ extended: true, limit: "100mb" }))
app.use(passport.initialize())

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
})

setupLiveGDSocket(io)

if (!MONGO_URI) {
  logger.error("MongoDB Error: MONGO_URI is missing in environment variables")
} else {
  mongoose
    .connect(MONGO_URI, {
      serverSelectionTimeoutMS: 15000
    })
    .then(() => {
      logger.info("MongoDB Connected")
    })
    .catch((error) => {
      logger.error("MongoDB Connection Failed", error.message)
    })
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Placiora AI Backend Running",
    mongoUriLoaded: Boolean(MONGO_URI),
    clientUrl: CLIENT_URL
  })
})

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend health check passed",
    mongoState: mongoose.connection.readyState,
    mongoStateText:
      mongoose.connection.readyState === 1
        ? "connected"
        : mongoose.connection.readyState === 2
        ? "connecting"
        : mongoose.connection.readyState === 3
        ? "disconnecting"
        : "disconnected"
  })
})

app.get("/api/oauth/test", (req, res) => {
  res.json({
    success: true,
    message: "Google OAuth route connected from server.js",
    googleLoaded: Boolean(
      process.env.GOOGLE_CLIENT_ID?.trim() &&
        process.env.GOOGLE_CLIENT_SECRET?.trim()
    )
  })
})

app.get("/api/support/test", (req, res) => {
  res.json({
    success: true,
    message: "Support email route connected",
    supportEmailLoaded: Boolean(
      process.env.SUPPORT_EMAIL && process.env.SUPPORT_EMAIL_PASSWORD
    )
  })
})

app.get("/api/live-gd-round/test", (req, res) => {
  res.json({
    success: true,
    message: "Live GD round route working"
  })
})

app.use("/api/auth", authRoutes)
app.use("/api/oauth", oauthRoutes)
app.use("/api/support", supportRoutes)
app.use("/api/certificate", certificateRoutes)

app.use("/api/interview", interviewRoutes)
app.use("/api/resume", resumeRoutes)
app.use("/api/history", historyRoutes)
app.use("/api/ai", aiRoutes)
app.use("/api/report", reportRoutes)
app.use("/api/coding", codingRoutes)
app.use("/api/aptitude", aptitudeRoutes)
app.use("/api/analytics", analyticsRoutes)
app.use("/api/live-interview", liveInterviewRoutes)
app.use("/api/resume-builder", resumeBuilderRoutes)

app.use("/api/placement-readiness", placementReadinessRoutes)
app.use("/api/system-design", systemDesignRoutes)
app.use("/api/hr-interview", hrInterviewRoutes)
app.use("/api/skill-roadmap", skillRoadmapRoutes)
app.use("/api/company-prediction", companyPredictionRoutes)
app.use("/api/oa-assessment", oaAssessmentRoutes)
app.use("/api/mock-placement", mockPlacementRoutes)
app.use("/api/recruiter-report", recruiterReportRoutes)
app.use("/api/gd-round", gdRoundRoutes)
app.use("/api/live-gd-round", liveGDRoundRoutes)
app.use("/api/avatar-assistant", avatarAssistantRoutes)

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl
  })
})

app.use((error, req, res, next) => {
  logger.error("Server Error:", error.message)

  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message
  })
})

server.listen(PORT, "0.0.0.0", () => {
  logger.info(`Placiora AI Backend Running On Port ${PORT}`)
})
