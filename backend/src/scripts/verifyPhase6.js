/**
 * Smoke-test Phase 6 alerts against a logged-in user (or create one).
 */
require("dotenv").config();
const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const { User, Alert, Notification, Job } = require("../models");
const { processAlerts, previewAlertMatches } = require("../services/notifier");
const bcrypt = require("bcryptjs");

async function main() {
  const db = await connectDB();
  if (!db.connected) throw new Error(db.error || "MongoDB not connected");

  let user = await User.findOne({ email: "alerts-demo@example.com" });
  if (!user) {
    user = await User.create({
      name: "Alerts Demo",
      email: "alerts-demo@example.com",
      passwordHash: await bcrypt.hash("demo1234", 10),
      skills: ["React", "Node.js", "JavaScript", "MongoDB"],
      experienceYears: 1,
      preferredLocations: ["Bengaluru", "Remote"],
      preferredRoles: ["Frontend Developer", "Full Stack Developer"],
    });
    console.log("Created demo user alerts-demo@example.com / demo1234");
  }

  await Alert.deleteMany({ userId: user._id });
  await Notification.deleteMany({ userId: user._id });

  const alert = await Alert.create({
    userId: user._id,
    name: "React / Full Stack",
    keywords: "Developer",
    location: "",
    skills: ["React", "Node.js", "JavaScript"],
    minMatchScore: 30,
    enabled: true,
  });

  const preview = await previewAlertMatches(alert.toObject(), user, { limit: 5 });
  console.log("Preview matches:", preview.length);
  preview.forEach((j) => console.log(` - ${j.matchScore}% ${j.title} [${j.source}]`));

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const outcome = await processAlerts({ since });
  console.log("processAlerts:", outcome);

  const notes = await Notification.find({ userId: user._id }).sort({ createdAt: -1 }).limit(5);
  console.log("Notifications created for demo user:", notes.length);
  notes.forEach((n) => console.log(` - ${n.title} (${n.matchScore}%)`));

  const jobCount = await Job.countDocuments({ isActive: true });
  console.log("Active jobs in DB:", jobCount);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
