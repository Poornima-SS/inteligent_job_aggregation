const mongoose = require("mongoose");

const scrapeLogSchema = new mongoose.Schema(
  {
    source: { type: String, required: true, trim: true },
    startedAt: { type: Date, required: true, default: Date.now },
    finishedAt: { type: Date, default: null },
    jobsFound: { type: Number, default: 0 },
    jobsSaved: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["running", "success", "failed", "partial"],
      default: "running",
    },
    error: { type: String, default: "" },
  },
  { timestamps: true }
);

scrapeLogSchema.index({ startedAt: -1 });
scrapeLogSchema.index({ source: 1, startedAt: -1 });

module.exports = mongoose.model("ScrapeLog", scrapeLogSchema);
