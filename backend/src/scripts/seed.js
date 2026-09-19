require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const { Job, ScrapeLog } = require("../models");
const { buildContentHash } = require("../utils/hash");

async function seed() {
  const db = await connectDB();
  if (!db.connected) {
    throw new Error(db.error || "MongoDB connection failed");
  }

  const filePath = path.join(__dirname, "..", "..", "sample-data", "jobs.json");
  const rawJobs = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const jobs = rawJobs.map((job) => ({
    ...job,
    contentHash: buildContentHash(job),
    scrapedAt: new Date(),
    isActive: true,
  }));

  // Remove previous seed data so re-running is safe
  await Job.deleteMany({ source: { $in: ["seed", "seed-alt"] } });

  const inserted = await Job.insertMany(jobs, { ordered: false });

  await ScrapeLog.create({
    source: "seed",
    startedAt: new Date(),
    finishedAt: new Date(),
    jobsFound: rawJobs.length,
    jobsSaved: inserted.length,
    status: "success",
  });

  console.log(`Seeded ${inserted.length} jobs into MongoDB`);
  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error("Seed failed:", err.message);
  try {
    await mongoose.disconnect();
  } catch (_) {
    /* ignore */
  }
  process.exit(1);
});
