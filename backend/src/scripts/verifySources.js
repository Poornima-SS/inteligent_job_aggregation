require("dotenv").config();
const mongoose = require("mongoose");
const { Job } = require("../models");

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/intelligent_job_aggregation");
  const bySource = await Job.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: "$source", n: { $sum: 1 } } },
    { $sort: { n: -1 } },
  ]);
  console.log("bySource", bySource);
  const samples = await Job.find({ source: { $in: ["naukri", "indeed", "linkedin"] } })
    .limit(3)
    .select("title company applyUrl source");
  console.log(samples.map((j) => j.toObject()));
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
