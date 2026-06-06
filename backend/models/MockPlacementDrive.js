import mongoose from "mongoose"

const roundScoreSchema = new mongoose.Schema(
  {
    round: {
      type: String,
      default: ""
    },

    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    completed: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
)

const mockPlacementDriveSchema = new mongoose.Schema(
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

    aptitudeScore: {
      type: Number,
      default: 0
    },

    codingScore: {
      type: Number,
      default: 0
    },

    technicalScore: {
      type: Number,
      default: 0
    },

    systemDesignScore: {
      type: Number,
      default: 0
    },

    hrScore: {
      type: Number,
      default: 0
    },

    overallScore: {
      type: Number,
      default: 0
    },

    placementChance: {
      type: Number,
      default: 0
    },

    verdict: {
      type: String,
      default: ""
    },

    salaryPrediction: {
      type: String,
      default: ""
    },

    roundProgress: {
      type: [roundScoreSchema],
      default: []
    },

    completed: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)

export default mongoose.model(
  "MockPlacementDrive",
  mockPlacementDriveSchema
)