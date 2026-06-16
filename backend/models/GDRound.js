import mongoose from "mongoose"

const messageSchema = new mongoose.Schema(
  {
    speaker: {
      type: String,
      enum: ["user", "ai", "system"],
      default: "user"
    },
    name: {
      type: String,
      default: ""
    },
    role: {
      type: String,
      default: ""
    },
    personality: {
      type: String,
      default: ""
    },
    message: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
)

const gdRoundSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    topic: {
      type: String,
      default: "Impact of Artificial Intelligence on Jobs"
    },

    difficulty: {
      type: String,
      default: "Beginner"
    },

    company: {
      type: String,
      default: "General"
    },

    aiParticipants: {
      type: [String],
      default: []
    },

    messages: {
      type: [messageSchema],
      default: []
    },

    communicationScore: {
      type: Number,
      default: 0
    },

    contentScore: {
      type: Number,
      default: 0
    },

    leadershipScore: {
      type: Number,
      default: 0
    },

    confidenceScore: {
      type: Number,
      default: 0
    },

    listeningScore: {
      type: Number,
      default: 0
    },

    criticalThinkingScore: {
      type: Number,
      default: 0
    },

    participationScore: {
      type: Number,
      default: 0
    },

    overallScore: {
      type: Number,
      default: 0
    },

    selectionChance: {
      type: Number,
      default: 0
    },

    placementReadiness: {
      tcs: { type: Number, default: 0 },
      infosys: { type: Number, default: 0 },
      accenture: { type: Number, default: 0 },
      amazon: { type: Number, default: 0 },
      google: { type: Number, default: 0 }
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

    improvedResponse: {
      type: String,
      default: ""
    },

    finalVerdict: {
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

const GDRound =
  mongoose.models.GDRound || mongoose.model("GDRound", gdRoundSchema)

export default GDRound