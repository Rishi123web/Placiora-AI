import mongoose from "mongoose"

const liveGDMessageSchema = new mongoose.Schema(
  {
    speaker: {
      type: String,
      enum: ["user", "ai"],
      default: "user"
    },
    name: {
      type: String,
      default: ""
    },
    message: {
      type: String,
      default: ""
    },
    role: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
)

const liveGDRoundSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    topic: {
      type: String,
      default: "Impact of AI on Jobs",
      trim: true
    },
    difficulty: {
      type: String,
      default: "Beginner",
      trim: true
    },
    company: {
      type: String,
      default: "General",
      trim: true
    },
    messages: {
      type: [liveGDMessageSchema],
      default: []
    },
    transcript: {
      type: String,
      default: ""
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
    overallScore: {
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
    improvedResponse: {
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

const LiveGDRound =
  mongoose.models.LiveGDRound ||
  mongoose.model("LiveGDRound", liveGDRoundSchema)

export default LiveGDRound