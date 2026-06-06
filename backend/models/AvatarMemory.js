import mongoose from "mongoose"

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
      default: ""
    },
    memories: {
      type: [
        {
          text: String,
          type: {
            type: String,
            default: "general"
          },
          createdAt: {
            type: Date,
            default: Date.now
          }
        }
      ],
      default: []
    }
  },
  { timestamps: true }
)

const AvatarMemory =
  mongoose.models.AvatarMemory ||
  mongoose.model("AvatarMemory", avatarMemorySchema)

export default AvatarMemory