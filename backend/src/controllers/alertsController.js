const { Alert, Notification } = require("../models");
const { isDBConnected } = require("../config/db");
const { processAlerts, previewAlertMatches, parseSkills } = require("../services/notifier");

function bodyToAlertFields(body = {}) {
  return {
    name: String(body.name || "Job alert").trim() || "Job alert",
    keywords: String(body.keywords || "").trim(),
    location: String(body.location || "").trim(),
    skills: parseSkills(body.skills),
    employmentType: String(body.employmentType || "").trim(),
    source: String(body.source || "").trim(),
    minMatchScore: Math.min(100, Math.max(0, Number(body.minMatchScore) || 40)),
    enabled: body.enabled === undefined ? true : Boolean(body.enabled),
    notifyEmail: Boolean(body.notifyEmail),
  };
}

async function listAlerts(req, res) {
  if (!isDBConnected()) return res.status(503).json({ message: "Database not connected" });
  const alerts = await Alert.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
  return res.json({ alerts, total: alerts.length });
}

async function createAlert(req, res) {
  try {
    if (!isDBConnected()) return res.status(503).json({ message: "Database not connected" });
    const fields = bodyToAlertFields(req.body || {});
    const alert = await Alert.create({ ...fields, userId: req.user._id });
    return res.status(201).json({ alert, message: "Alert created" });
  } catch (err) {
    console.error("[alerts] create failed:", err);
    return res.status(500).json({ message: err.message || "Failed to create alert" });
  }
}

async function previewAlert(req, res) {
  try {
    if (!isDBConnected()) return res.status(503).json({ message: "Database not connected" });
    const fields = bodyToAlertFields(req.body || {});
    const jobs = await previewAlertMatches(fields, req.user, {
      limit: Math.min(50, Number(req.query.limit) || 15),
    });
    return res.json({ total: jobs.length, jobs, message: `Found ${jobs.length} matches` });
  } catch (err) {
    console.error("[alerts] preview failed:", err);
    return res.status(500).json({ message: err.message || "Failed to preview matches" });
  }
}

async function updateAlert(req, res) {
  if (!isDBConnected()) return res.status(503).json({ message: "Database not connected" });
  const alert = await Alert.findOne({ _id: req.params.id, userId: req.user._id });
  if (!alert) return res.status(404).json({ message: "Alert not found" });

  const fields = bodyToAlertFields({ ...alert.toObject(), ...req.body });
  Object.assign(alert, fields);
  await alert.save();
  return res.json({ alert });
}

async function deleteAlert(req, res) {
  if (!isDBConnected()) return res.status(503).json({ message: "Database not connected" });
  const alert = await Alert.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!alert) return res.status(404).json({ message: "Alert not found" });
  await Notification.deleteMany({ alertId: alert._id, userId: req.user._id });
  return res.json({ message: "Alert deleted", id: alert._id });
}

async function runAlertsNow(req, res) {
  if (!isDBConnected()) return res.status(503).json({ message: "Database not connected" });
  const hours = Math.min(168, Math.max(1, Number(req.body?.hours) || 48));
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  // Only evaluate this user's alerts by temporarily scoping in processAlerts
  // via a lightweight inline path: process all, then filter counts for user.
  const before = await Notification.countDocuments({ userId: req.user._id });
  const outcome = await processAlerts({ since });
  const after = await Notification.countDocuments({ userId: req.user._id });

  return res.json({
    status: "ok",
    ...outcome,
    yourNewNotifications: Math.max(0, after - before),
  });
}

async function listNotifications(req, res) {
  if (!isDBConnected()) return res.status(503).json({ message: "Database not connected" });
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
  const unreadOnly = String(req.query.unread || "") === "true";

  const filter = { userId: req.user._id };
  if (unreadOnly) filter.read = false;

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("jobId", "title company location source applyUrl employmentType skills")
      .populate("alertId", "name keywords location")
      .lean(),
    Notification.countDocuments({ userId: req.user._id, read: false }),
  ]);

  return res.json({ notifications, unreadCount, total: notifications.length });
}

async function unreadCount(req, res) {
  if (!isDBConnected()) return res.status(503).json({ message: "Database not connected" });
  const count = await Notification.countDocuments({ userId: req.user._id, read: false });
  return res.json({ unreadCount: count });
}

async function markRead(req, res) {
  if (!isDBConnected()) return res.status(503).json({ message: "Database not connected" });
  const note = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: { read: true } },
    { new: true }
  );
  if (!note) return res.status(404).json({ message: "Notification not found" });
  return res.json({ notification: note });
}

async function markAllRead(req, res) {
  if (!isDBConnected()) return res.status(503).json({ message: "Database not connected" });
  const result = await Notification.updateMany(
    { userId: req.user._id, read: false },
    { $set: { read: true } }
  );
  return res.json({ updated: result.modifiedCount });
}

module.exports = {
  listAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  previewAlert,
  runAlertsNow,
  listNotifications,
  unreadCount,
  markRead,
  markAllRead,
};
