require("dotenv").config();
const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const { runScrapers } = require("../services/scrapeRunner");
const { Job } = require("../models");

async function main() {
  const db = await connectDB();
  if (!db.connected) throw new Error(db.error || "MongoDB not connected");

  const out = await runScrapers([
    "naukri",
    "indeed",
    "linkedin",
    "apna",
    "private-company",
  ]);

  console.log("summary", out.summary);
  for (const r of out.results) {
    console.log(`${r.source}: ${r.status} found=${r.jobsFound} saved=${r.jobsSaved}`);
  }

  const bySource = await Job.aggregate([
    { $group: { _id: "$source", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  console.log("bySource", bySource);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch (_) {
    /* ignore */
  }
  process.exit(1);
});
