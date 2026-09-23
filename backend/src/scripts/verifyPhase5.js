require("dotenv").config();
const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const { User, Job } = require("../models");
const { scoreJob } = require("../services/ranker");
const { getStatus, startScheduler, stopScheduler } = require("../jobs/cron");

async function main() {
  const db = await connectDB();
  if (!db.connected) throw new Error(db.error || "no db");

  startScheduler();
  console.log("scheduler", getStatus());

  let user = await User.findOne({ email: /poornima|phase|scrape|test/i });
  if (!user) {
    user = {
      skills: ["React", "Node.js", "MongoDB"],
      preferredLocations: ["Bengaluru", "Remote"],
      preferredRoles: ["Developer", "Engineer"],
      experienceYears: 1,
      savedJobs: [],
    };
  }

  const jobs = await Job.find({ isActive: true }).limit(300);
  const ranked = jobs
    .map((job) => ({ title: job.title, company: job.company, ...scoreJob(user, job) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  console.log(
    "profile skills",
    user.skills || user.toObject?.()?.skills
  );
  console.log("top recommendations");
  ranked.forEach((r, i) => console.log(`${i + 1}. ${r.score}% — ${r.title} @ ${r.company}`));

  stopScheduler();
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
