import mongoose from "mongoose"

const companyChanceSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      default: ""
    },

    probability: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    reason: {
      type: String,
      default: ""
    }
  },
  { _id: false }
)

const companyPredictionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    placementProbability: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    currentLevel: {
      type: String,
      default: ""
    },

    bestFitType: {
      type: String,
      default: ""
    },

    readyNow: {
      type: [companyChanceSchema],
      default: []
    },

    needPractice: {
      type: [companyChanceSchema],
      default: []
    },

    stretchCompanies: {
      type: [companyChanceSchema],
      default: []
    },

    blockers: {
      type: [String],
      default: []
    },

    recommendations: {
      type: [String],
      default: []
    },

    finalVerdict: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
)

export default mongoose.model("CompanyPrediction", companyPredictionSchema)