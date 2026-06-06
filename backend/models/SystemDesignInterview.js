import mongoose from "mongoose"

const systemDesignQuestionSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      default: 0
    },

    type: {
      type: String,
      default: ""
    },

    question: {
      type: String,
      default: ""
    }
  },
  { _id: false }
)

const systemDesignAnswerSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      default: ""
    },

    answer: {
      type: String,
      default: ""
    },

    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    architectureScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    scalabilityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    databaseScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    apiDesignScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    communicationScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
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

    improvedAnswer: {
      type: String,
      default: ""
    },

    followUpQuestion: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
)

const systemDesignInterviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    topic: {
      type: String,
      default: "General System Design"
    },

    difficulty: {
      type: String,
      default: "Intermediate"
    },

    problem: {
      type: String,
      default: ""
    },

    prompt: {
      type: String,
      default: ""
    },

    questions: {
      type: [systemDesignQuestionSchema],
      default: []
    },

    answers: {
      type: [systemDesignAnswerSchema],
      default: []
    },

    totalScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    completed: {
      type: Boolean,
      default: false
    },

    verdict: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
)

const SystemDesignInterview =
  mongoose.models.SystemDesignInterview ||
  mongoose.model("SystemDesignInterview", systemDesignInterviewSchema)

export default SystemDesignInterview