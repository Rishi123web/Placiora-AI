import mongoose from "mongoose"

const certificateSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true
    },

    userName: {
      type: String,
      required: true
    },

    userEmail: {
      type: String,
      default: ""
    },

    score: {
      type: Number,
      default: 85
    },

    level: {
      type: String,
      default: "Excellent"
    },

    certificateId: {
      type: String,
      required: true,
      unique: true
    },

    issuer: {
      type: String,
      default: "Placiora AI"
    },

    program: {
      type: String,
      default: "Placement Preparation Program"
    },

    credentialUrl: {
      type: String,
      default: ""
    },

    duration: {
      type: String,
      default: "40 Learning Hours"
    },

    skills: {
      type: [String],
      default: [
        "Technical Interviews",
        "Coding Assessments",
        "Resume Optimization",
        "HR Interview Preparation",
        "Career Readiness"
      ]
    },

    issuedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
)

export default mongoose.model("Certificate", certificateSchema)