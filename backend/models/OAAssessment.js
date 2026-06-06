import mongoose from "mongoose"

const oaQuestionSchema = new mongoose.Schema(
  {
    section: {
      type: String,
      enum: ["aptitude", "technical", "coding"],
      default: "aptitude"
    },

    question: {
      type: String,
      required: true
    },

    options: {
      type: [String],
      default: []
    },

    correctAnswer: {
      type: String,
      default: ""
    },

    explanation: {
      type: String,
      default: ""
    },

    marks: {
      type: Number,
      default: 1
    }
  },
  { _id: false }
)

const oaAnswerSchema = new mongoose.Schema(
  {
    section: {
      type: String,
      enum: ["aptitude", "technical", "coding"],
      default: "aptitude"
    },

    question: {
      type: String,
      default: ""
    },

    selectedAnswer: {
      type: String,
      default: ""
    },

    correctAnswer: {
      type: String,
      default: ""
    },

    isCorrect: {
      type: Boolean,
      default: false
    },

    marksObtained: {
      type: Number,
      default: 0
    },

    explanation: {
      type: String,
      default: ""
    }
  },
  { _id: false }
)

const oaAssessmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    company: {
      type: String,
      default: "General"
    },

    difficulty: {
      type: String,
      default: "Beginner"
    },

    durationMinutes: {
      type: Number,
      default: 30
    },

    questions: {
      type: [oaQuestionSchema],
      default: []
    },

    answers: {
      type: [oaAnswerSchema],
      default: []
    },

    totalQuestions: {
      type: Number,
      default: 0
    },

    attemptedQuestions: {
      type: Number,
      default: 0
    },

    correctAnswers: {
      type: Number,
      default: 0
    },

    totalMarks: {
      type: Number,
      default: 0
    },

    obtainedMarks: {
      type: Number,
      default: 0
    },

    percentage: {
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

    technicalScore: {
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

    selectionChance: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    level: {
      type: String,
      default: ""
    },

    verdict: {
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

    recommendations: {
      type: [String],
      default: []
    },

    completed: {
      type: Boolean,
      default: false
    },

    startedAt: {
      type: Date,
      default: Date.now
    },

    submittedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
)

const OAAssessment =
  mongoose.models.OAAssessment ||
  mongoose.model("OAAssessment", oaAssessmentSchema)

export default OAAssessment