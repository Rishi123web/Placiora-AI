import mongoose from "mongoose"

const certificateSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, default: "" },
    certificateId: { type: String, required: true, unique: true },
    title: { type: String, default: "Placement Preparation Excellence" },
    score: { type: Number, default: 0 },
    level: { type: String, default: "Beginner" },
    issuedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
)

export default mongoose.model("Certificate", certificateSchema)