import mongoose from "mongoose"

const roadmapSchema = new mongoose.Schema(
  {
    day: { type: String, default: "" },
    title: { type: String, default: "" },
    tasks: { type: [String], default: [] }
  },
  { _id: false }
)

const companyReadinessSchema = new mongoose.Schema(
  {
    company: { type: String, default: "" },
    score: { type: Number, default: 0, min: 0, max: 100 },
    verdict: { type: String, default: "" }
  },
  { _id: false }
)

const placementReadinessSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    readinessScore: { type: Number, default: 0, min: 0, max: 100 },

    resumeScore: { type: Number, default: 0, min: 0, max: 100 },
    interviewScore: { type: Number, default: 0, min: 0, max: 100 },
    communicationScore: { type: Number, default: 0, min: 0, max: 100 },
    codingScore: { type: Number, default: 0, min: 0, max: 100 },
    aptitudeScore: { type: Number, default: 0, min: 0, max: 100 },
    consistencyScore: { type: Number, default: 0, min: 0, max: 100 },

    level: { type: String, default: "Beginner" },
    verdict: { type: String, default: "" },

    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    priorityActions: { type: [String], default: [] },

    roadmap: { type: [roadmapSchema], default: [] },
    companyReadiness: { type: [companyReadinessSchema], default: [] }
  },
  { timestamps: true }
)

export default mongoose.model("PlacementReadiness", placementReadinessSchema)