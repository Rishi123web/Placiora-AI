import mongoose from "mongoose"

const roadmapDaySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      default: ""
    },

    title: {
      type: String,
      default: ""
    },

    focusArea: {
      type: String,
      default: ""
    },

    tasks: {
      type: [String],
      default: []
    },

    expectedOutcome: {
      type: String,
      default: ""
    }
  },
  { _id: false }
)

const weakSkillSchema = new mongoose.Schema(
  {
    skill: {
      type: String,
      default: ""
    },

    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium"
    },

    reason: {
      type: String,
      default: ""
    },

    action: {
      type: String,
      default: ""
    }
  },
  { _id: false }
)

const skillRoadmapSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    overallReadiness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    currentLevel: {
      type: String,
      default: ""
    },

    weakestSkills: {
      type: [weakSkillSchema],
      default: []
    },

    priorityActions: {
      type: [String],
      default: []
    },

    sevenDayPlan: {
      type: [roadmapDaySchema],
      default: []
    },

    thirtyDayRoadmap: {
      type: [roadmapDaySchema],
      default: []
    },

    recommendedModules: {
      type: [String],
      default: []
    },

    finalAdvice: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
)

export default mongoose.model("SkillRoadmap", skillRoadmapSchema)