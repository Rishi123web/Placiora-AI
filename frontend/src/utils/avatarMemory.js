import mongoose from "mongoose"

const avatarMemoryItemSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default: "general"
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
)

const avatarMemorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    email: {
      type: String,
      default: "",
      index: true
    },
    memories: {
      type: [avatarMemoryItemSchema],
      default: []
    }
  },
  { timestamps: true }
)

const AvatarMemory =
  mongoose.models.AvatarMemory ||
  mongoose.model("AvatarMemory", avatarMemorySchema)

export default AvatarMemory