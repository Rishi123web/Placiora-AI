import mongoose from "mongoose"

const codingSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    title: {
      type: String,
      default: ""
    },

    difficulty: {
      type: String,
      default: "Beginner"
    },

    category: {
      type: String,
      default: "Programming"
    },

    language: {
      type: String,
      default: "javascript"
    },

    description: {
      type: String,
      default: ""
    },

    code: {
      type: String,
      default: ""
    },

    score: {
      type: Number,
      default: 0
    },

    feedback: {
      type: String,
      default: ""
    },

    strengths: {
      type: [String],
      default: []
    },

    weaknesses: {
      type: [String],
      default: []
    },

    improvedApproach: {
      type: String,
      default: ""
    },

    testResults: {
      type: Array,
      default: []
    },

    passedTests: {
      type: Number,
      default: 0
    },

    totalTests: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
)

const CodingSession =
  mongoose.models.CodingSession ||
  mongoose.model("CodingSession", codingSessionSchema)

export default CodingSession