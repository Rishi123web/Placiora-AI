import mongoose from "mongoose"

const resumeBuilderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    fullName: {
      type: String,
      default: ""
    },

    email: {
      type: String,
      default: ""
    },

    phone: {
      type: String,
      default: ""
    },

    location: {
      type: String,
      default: ""
    },

    linkedin: {
      type: String,
      default: ""
    },

    github: {
      type: String,
      default: ""
    },

    portfolio: {
      type: String,
      default: ""
    },

    targetRole: {
      type: String,
      default: ""
    },

    education: {
      type: String,
      default: ""
    },

    skills: {
      type: String,
      default: ""
    },

    projects: {
      type: String,
      default: ""
    },

    experience: {
      type: String,
      default: ""
    },

    achievements: {
      type: String,
      default: ""
    },

    generatedSummary: {
      type: String,
      default: ""
    },

    generatedSkills: {
      type: [String],
      default: []
    },

    generatedProjects: {
      type: [String],
      default: []
    },

    generatedExperience: {
      type: [String],
      default: []
    },

    generatedAchievements: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
)

export default mongoose.model("ResumeBuilder", resumeBuilderSchema)