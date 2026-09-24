/**
 * Viva / offline demo fallback.
 * Loads sample-data/jobs.json into MongoDB so the UI works even if live scrape APIs fail.
 *
 * Usage:
 *   npm run demo:fallback
 *   npm run demo:fallback -- --replace-all
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const { Job, ScrapeLog } = require("../models");
const { buildContentHash } = require("../utils/hash");

const replaceAll = process.argv.includes("--replace-all");

async function main() {
  const db = await connectDB();
  if (!db.connected) throw new Error(db.error || "MongoDB not connected");

  const before = await Job.countDocuments({ isActive: true });
  console.log(`Active jobs before fallback: ${before}`);

  if (replaceAll) {
    const wiped = await Job.deleteMany({});
    console.log(`Cleared ${wiped.deletedCount} jobs (--replace-all)`);
  }

  const filePath = path.join(__dirname, "..", "..", "sample-data", "jobs.json");
  const rawJobs = JSON.parse(fs.readFileSync(filePath, "utf8"));

  let saved = 0;
  let skipped = 0;
  for (const row of rawJobs) {
    const contentHash = buildContentHash(row);
    const existing = await Job.findOne({ contentHash });
    if (existing) {
      skipped += 1;
      continue;
    }
    await Job.create({
      ...row,
      contentHash,
      scrapedAt: new Date(),
      isActive: true,
      applyUrl: row.applyUrl || row.sourceUrl || "",
      sourceUrl: row.sourceUrl || row.applyUrl || "",
    });
    saved += 1;
  }

  await ScrapeLog.create({
    source: "demo-fallback",
    startedAt: new Date(),
    finishedAt: new Date(),
    jobsFound: rawJobs.length,
    jobsSaved: saved,
    status: "success",
    error: skipped ? `Skipped ${skipped} existing hashes` : "",
  });

  const after = await Job.countDocuments({ isActive: true });
  const bySource = await Job.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: "$source", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  console.log(`Fallback inserted ${saved} jobs (skipped ${skipped})`);
  console.log(`Active jobs now: ${after}`);
  console.log("By source:", bySource);
  console.log("Open http://localhost:5173/jobs to verify.");

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
