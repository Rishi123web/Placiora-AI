import mongoose from "mongoose"

const scoreSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      default: ""
    },

    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    status: {
      type: String,
      default: ""
    }
  },
  { _id: false }
)

const recruiterReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    candidateName: {
      type: String,
      default: ""
    },

    candidateEmail: {
      type: String,
      default: ""
    },

    targetRole: {
      type: String,
      default: "Full Stack Developer"
    },

    resumeScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    aiInterviewScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    liveInterviewScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    hrScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    codingScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    aptitudeScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    systemDesignScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    oaScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    placementProbability: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    overallScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    hiringStatus: {
      type: String,
      enum: ["Strong Hire", "Hire", "Hold", "Reject"],
      default: "Hold"
    },

    recruiterVerdict: {
      type: String,
      default: ""
    },

    strengths: {
      type: [String],
      default: []
    },

    risks: {
      type: [String],
      default: []
    },

    improvementAreas: {
      type: [String],
      default: []
    },

    scoreBreakdown: {
      type: [scoreSchema],
      default: []
    }
  },
  { timestamps: true }
)

const RecruiterReport =
  mongoose.models.RecruiterReport ||
  mongoose.model("RecruiterReport", recruiterReportSchema)

export default RecruiterReport