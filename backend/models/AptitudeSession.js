import mongoose from "mongoose"

const aptitudeAnswerSchema = new mongoose.Schema(
  {
    question: String,
    selectedOption: String,
    correctAnswer: String,
    isCorrect: Boolean,
    explanation: String,
    category: String
  },
  { timestamps: true }
)

const aptitudeSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    category: {
      type: String,
      default: "Mixed"
    },
    difficulty: {
      type: String,
      default: "Beginner"
    },
    questions: {
      type: Array,
      default: []
    },
    answers: {
      type: [aptitudeAnswerSchema],
      default: []
    },
    score: {
      type: Number,
      default: 0
    },
    totalQuestions: {
      type: Number,
      default: 0
    },
    correctAnswers: {
      type: Number,
      default: 0
    },
    completed: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)

export default mongoose.model("AptitudeSession", aptitudeSessionSchema)