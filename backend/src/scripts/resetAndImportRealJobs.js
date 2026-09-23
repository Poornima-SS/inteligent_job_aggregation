/**
 * Delete demo/seed/fixture jobs and import REAL listings from Remotive + RemoteOK.
 * Those APIs provide live apply URLs that open actual job pages.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const { Job, ScrapeLog } = require("../models");
const { runScrapers } = require("../services/scrapeRunner");

const DEMO_SOURCES = [
  "seed",
  "seed-alt",
  "naukri",
  "indeed",
  "linkedin",
  "apna",
  "private-company",
  "company-cheerio",
  "company-puppeteer",
];

async function main() {
  const db = await connectDB();
  if (!db.connected) throw new Error(db.error || "MongoDB not connected");

  const before = await Job.countDocuments();
  const deleted = await Job.deleteMany({
    $or: [
      { source: { $in: DEMO_SOURCES } },
      { applyUrl: /example\.com|\/demo|local:\/\//i },
      { sourceUrl: /example\.com|\/demo|local:\/\//i },
    ],
  });
  console.log(`Removed ${deleted.deletedCount} demo/old jobs (had ${before} total)`);

  // Keep only recent scrape logs for clarity
  await ScrapeLog.deleteMany({ source: { $in: DEMO_SOURCES } });

  console.log("Importing real jobs from Remotive + RemoteOK + portals...");
  const outcome = await runScrapers(
    ["remotive", "remoteok", "naukri", "indeed", "linkedin", "apna", "private-company"],
    { limit: 40 }
  );

  for (const r of outcome.results) {
    console.log(`${r.source}: ${r.status} found=${r.jobsFound} saved=${r.jobsSaved}${r.error ? " — " + r.error : ""}`);
  }

  const after = await Job.countDocuments({ isActive: true });
  const bySource = await Job.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: "$source", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const sample = await Job.find({ source: { $in: ["remotive", "remoteok"] } })
    .sort({ scrapedAt: -1 })
    .limit(3)
    .select("title company applyUrl source");

  console.log("Active jobs now:", after);
  console.log("By source:", bySource);
  console.log("Sample apply links:");
  sample.forEach((j) => console.log(` - [${j.source}] ${j.title} => ${j.applyUrl}`));

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
