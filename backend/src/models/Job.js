const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, default: "Remote", trim: true },
    description: { type: String, default: "" },
    skills: [{ type: String, trim: true }],
    experienceMin: { type: Number, default: 0, min: 0 },
    experienceMax: { type: Number, default: null },
    salaryMin: { type: Number, default: null },
    salaryMax: { type: Number, default: null },
    salaryCurrency: { type: String, default: "INR" },
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship", "remote", "other"],
      default: "full-time",
    },
    source: { type: String, required: true, trim: true },
    sourceUrl: { type: String, default: "" },
    applyUrl: { type: String, default: "" },
    postedAt: { type: Date, default: Date.now },
    scrapedAt: { type: Date, default: Date.now },
    contentHash: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

jobSchema.index({ contentHash: 1 }, { unique: true });
jobSchema.index({ source: 1, sourceUrl: 1 });
jobSchema.index({ title: "text", company: "text", description: "text", skills: "text" });
jobSchema.index({ location: 1, isActive: 1 });
jobSchema.index({ scrapedAt: -1 });

module.exports = mongoose.model("Job", jobSchema);
