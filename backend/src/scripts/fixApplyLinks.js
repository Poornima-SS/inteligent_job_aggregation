/**
 * Rewrite seed apply/source URLs away from example.com
 * and patch existing MongoDB seed documents.
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const { Job } = require("../models");

function buildUrls(job) {
  const slug = String(job.title || "jobs")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const q = encodeURIComponent(`${job.title} ${job.company}`);
  const loc = encodeURIComponent(job.location || "India");

  // Point seed listings to a live Naukri/Indeed search so "Open apply link" is useful in demos
  return {
    sourceUrl: `https://www.naukri.com/${slug}-jobs`,
    applyUrl: `https://in.indeed.com/jobs?q=${q}&l=${loc}`,
  };
}

async function main() {
  const filePath = path.join(__dirname, "..", "..", "sample-data", "jobs.json");
  const jobs = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const updated = jobs.map((job) => ({
    ...job,
    ...buildUrls(job),
  }));
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
  console.log(`Updated ${updated.length} jobs in jobs.json`);

  const db = await connectDB();
  if (!db.connected) throw new Error(db.error || "MongoDB not connected");

  const seedJobs = await Job.find({
    $or: [
      { source: { $in: ["seed", "seed-alt"] } },
      { applyUrl: /example\.com/i },
      { sourceUrl: /example\.com/i },
    ],
  });

  let patched = 0;
  for (const job of seedJobs) {
    const urls = buildUrls(job);
    job.applyUrl = urls.applyUrl;
    job.sourceUrl = urls.sourceUrl;
    await job.save();
    patched += 1;
  }

  console.log(`Patched ${patched} MongoDB jobs with live search apply links`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
