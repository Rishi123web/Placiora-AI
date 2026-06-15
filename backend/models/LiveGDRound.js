import mongoose from "mongoose"

const participantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    socketId: {
      type: String,
      default: ""
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
    isHost: {
      type: Boolean,
      default: false
    },
    micReady: {
      type: Boolean,
      default: false
    },
    cameraReady: {
      type: Boolean,
      default: false
    },
    approved: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved"
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    requestedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
)

const aiParticipantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: ""
    },
    role: {
      type: String,
      default: "AI Participant"
    },
    personality: {
      type: String,
      default: "Balanced"
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
)

const liveGDMessageSchema = new mongoose.Schema(
  {
    speaker: {
      type: String,
      enum: ["user", "ai", "system"],
      default: "user"
    },
    userId: {
      type: String,
      default: ""
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
    },
    personality: {
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

    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    hostName: {
      type: String,
      default: ""
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
      index: true,
      default: null
    },

    meetingCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      default: null
    },

    inviteLink: {
      type: String,
      default: ""
    },

    isMultiplayer: {
      type: Boolean,
      default: true
    },

    maxParticipants: {
      type: Number,
      default: 5
    },

    status: {
      type: String,
      enum: ["waiting", "active", "completed"],
      default: "waiting"
    },

    meetingStatus: {
      type: String,
      enum: ["waiting", "live", "ended"],
      default: "waiting"
    },

    hostSocketId: {
      type: String,
      default: ""
    },

    participants: {
      type: [participantSchema],
      default: []
    },

    pendingParticipants: {
      type: [participantSchema],
      default: []
    },

    aiParticipants: {
      type: [aiParticipantSchema],
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
    },

    startedAt: {
      type: Date,
      default: null
    },

    endedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
)

const LiveGDRound =
  mongoose.models.LiveGDRound ||
  mongoose.model("LiveGDRound", liveGDRoundSchema)

export default LiveGDRound