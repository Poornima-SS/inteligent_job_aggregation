const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, default: "Job alert", trim: true },
    keywords: { type: String, default: "", trim: true },
    location: { type: String, default: "", trim: true },
    skills: [{ type: String, trim: true }],
    employmentType: { type: String, default: "", trim: true },
    source: { type: String, default: "", trim: true },
    minMatchScore: { type: Number, default: 40, min: 0, max: 100 },
    enabled: { type: Boolean, default: true },
    lastNotifiedAt: { type: Date, default: null },
    notifyEmail: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Alert", alertSchema);
