import mongoose from "mongoose"

const resumeProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    fileName: {
      type: String,
      default: ""
    },

    resumeText: {
      type: String,
      default: ""
    },

    summary: {
      type: String,
      default: ""
    },

    skills: {
      type: [String],
      default: []
    },

    projects: {
      type: [String],
      default: []
    },

    experience: {
      type: [String],
      default: []
    },

    atsScore: {
      type: Number,
      default: 0
    },

    improvements: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
)

export default mongoose.model("ResumeProfile", resumeProfileSchema)