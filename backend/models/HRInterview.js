import mongoose from "mongoose"

const hrAnswerSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },

    score: { type: Number, default: 0, min: 0, max: 100 },
    confidenceScore: { type: Number, default: 0, min: 0, max: 100 },
    communicationScore: { type: Number, default: 0, min: 0, max: 100 },
    professionalismScore: { type: Number, default: 0, min: 0, max: 100 },
    starStructureScore: { type: Number, default: 0, min: 0, max: 100 },
    relevanceScore: { type: Number, default: 0, min: 0, max: 100 },

    feedback: { type: String, default: "" },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    improvedAnswer: { type: String, default: "" },
    followUpQuestion: { type: String, default: "" }
  },
  { timestamps: true }
)

const hrInterviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    role: { type: String, default: "Frontend Developer" },
    company: { type: String, default: "General" },
    difficulty: { type: String, default: "Beginner" },

    questions: { type: [String], default: [] },
    answers: { type: [hrAnswerSchema], default: [] },

    totalScore: { type: Number, default: 0, min: 0, max: 100 },
    confidenceAverage: { type: Number, default: 0, min: 0, max: 100 },
    communicationAverage: { type: Number, default: 0, min: 0, max: 100 },
    professionalismAverage: { type: Number, default: 0, min: 0, max: 100 },
    starStructureAverage: { type: Number, default: 0, min: 0, max: 100 },
    relevanceAverage: { type: Number, default: 0, min: 0, max: 100 },

    hrSelectionProbability: { type: Number, default: 0, min: 0, max: 100 },
    selectionLevel: { type: String, default: "" },
    recruiterVerdict: { type: String, default: "" },

    blockers: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },

    completed: { type: Boolean, default: false }
  },
  { timestamps: true }
)

export default mongoose.model("HRInterview", hrInterviewSchema)