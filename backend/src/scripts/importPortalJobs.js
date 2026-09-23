/**
 * Import Naukri / Indeed / LinkedIn / Apna / private-company portal jobs
 * alongside existing Remotive + RemoteOK listings.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const { Job } = require("../models");
const { runScrapers } = require("../services/scrapeRunner");

const PORTALS = ["naukri", "indeed", "linkedin", "apna", "private-company"];

async function main() {
  const db = await connectDB();
  if (!db.connected) throw new Error(db.error || "MongoDB not connected");

  // Drop previous portal rows so links refresh to live search URLs
  const deleted = await Job.deleteMany({ source: { $in: PORTALS } });
  console.log(`Cleared ${deleted.deletedCount} old portal jobs`);

  console.log("Scraping portals:", PORTALS.join(", "));
  const outcome = await runScrapers(PORTALS, { limit: 50 });

  for (const r of outcome.results) {
    console.log(
      `${r.source}: ${r.status} found=${r.jobsFound} saved=${r.jobsSaved}${r.error ? " — " + r.error : ""}`
    );
  }

  const bySource = await Job.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: "$source", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const samples = await Job.find({ source: { $in: PORTALS } })
    .sort({ scrapedAt: -1 })
    .limit(5)
    .select("title company source applyUrl");

  console.log("Active by source:", bySource);
  console.log("Sample portal links:");
  samples.forEach((j) => console.log(` - [${j.source}] ${j.title} @ ${j.company} => ${j.applyUrl}`));

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
