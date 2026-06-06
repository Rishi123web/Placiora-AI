import mongoose from "mongoose"

const answerSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true
    },

    answer: {
      type: String,
      required: true
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

    score: {
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

    communicationScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    confidenceScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    clarityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    problemSolvingScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    followUpQuestion: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
)

const interviewSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    role: {
      type: String,
      default: ""
    },

    difficulty: {
      type: String,
      default: "Beginner"
    },

    type: {
      type: String,
      default: "Technical"
    },

    company: {
      type: String,
      default: "General"
    },

    mode: {
      type: String,
      enum: ["standard", "jd", "resume"],
      default: "standard"
    },

    jobDescription: {
      type: String,
      default: ""
    },

    extractedSkills: {
      type: [String],
      default: []
    },

    questions: {
      type: [String],
      default: []
    },

    answers: {
      type: [answerSchema],
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

    technicalReadiness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    communicationReadiness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    confidenceReadiness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    hiringProbability: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    selectionLevel: {
      type: String,
      default: ""
    },

    recruiterVerdict: {
      type: String,
      default: ""
    },

    blockers: {
      type: [String],
      default: []
    },

    recommendations: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
)

export default mongoose.model("InterviewSession", interviewSessionSchema)