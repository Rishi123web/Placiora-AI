import mongoose from "mongoose"

const participantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    name: {
      type: String,
      default: ""
    },
    email: {
      type: String,
      default: ""
    },
    role: {
      type: String,
      default: "Participant"
    },
    micReady: {
      type: Boolean,
      default: false
    },
    cameraReady: {
      type: Boolean,
      default: false
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
)

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
      default: "Impact of AI on Jobs"
    },
    difficulty: {
      type: String,
      default: "Beginner"
    },
    company: {
      type: String,
      default: "General"
    },
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
      default: null
    },
    inviteLink: {
      type: String,
      default: ""
    },
    isMultiplayer: {
      type: Boolean,
      default: false
    },
    maxParticipants: {
      type: Number,
      default: 5
    },
    participants: {
      type: [participantSchema],
      default: []
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