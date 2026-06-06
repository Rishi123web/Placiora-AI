import mongoose from "mongoose"

const answerSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true
    },

    transcript: {
      type: String,
      required: true
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

    fillerWordCount: {
      type: Number,
      default: 0
    },

    fillerWords: {
      type: [String],
      default: []
    },

    wordCount: {
      type: Number,
      default: 0
    },

    speakingSpeed: {
      type: Number,
      default: 0
    },

    speakingSpeedStatus: {
      type: String,
      default: ""
    },

    professionalVocabularyScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    starStructureScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    communicationAnalysisScore: {
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

const liveInterviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    role: {
      type: String,
      default: "Frontend Developer"
    },

    difficulty: {
      type: String,
      default: "Beginner"
    },

    company: {
      type: String,
      default: "General"
    },

    companyFocus: {
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

    technicalAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    communicationAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    confidenceAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    clarityAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    problemSolvingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    averageCommunicationAnalysisScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    averageProfessionalVocabularyScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    averageStarStructureScore: {
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

    clarityReadiness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    problemSolvingReadiness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    overallReadiness: {
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
    },

    micEnabled: {
      type: Boolean,
      default: false
    },

    cameraEnabled: {
      type: Boolean,
      default: false
    },

    recordingUrl: {
      type: String,
      default: ""
    },

    recordingPublicId: {
      type: String,
      default: ""
    },

    completed: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)

export default mongoose.model("LiveInterview", liveInterviewSchema)