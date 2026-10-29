require("dotenv").config();
const { connectDB } = require("../config/db");
const { User, Notification } = require("../models");
const { emailUserDigest } = require("../services/notifier");
const { resolveJobViewUrl } = require("../utils/jobLinks");

async function main() {
  await connectDB();
  const note = await Notification.findOne().sort({ createdAt: -1 }).populate("jobId").lean();
  if (!note) {
    console.error("No notifications in DB");
    process.exit(1);
  }
  const user = await User.findById(note.userId);
  console.log("Sending to user:", user?.email);
  if (note.jobId) {
    console.log("Sample View job URL:", resolveJobViewUrl(note.jobId));
  }
  const result = await emailUserDigest(user, { limit: 5 });
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.sent ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
