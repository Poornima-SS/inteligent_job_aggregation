const { Alert, Notification } = require("../models");
const { isDBConnected } = require("../config/db");
const {
  processAlerts,
  previewAlertMatches,
  emailUserDigest,
  parseSkills,
} = require("../services/notifier");
const { getMailStatus } = require("../services/mail");

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
    notifyEmail: body.notifyEmail === undefined ? true : Boolean(body.notifyEmail),
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

    // Automatically match + email (no manual button needed)
    let emailResult = null;
    try {
      const since = new Date(Date.now() - 72 * 60 * 60 * 1000);
      emailResult = await processAlerts({
        since,
        force: true,
        userId: req.user._id,
      });
    } catch (err) {
      console.warn("[alerts] auto notify after create failed:", err.message);
      emailResult = { emailError: err.message };
    }

    const mail = getMailStatus();
    const emailed = (emailResult?.emailsSent || 0) > 0;
    let message = "Alert created";
    if (emailed && mail.delivery === "inbox") {
      message = `Alert created — match email sent to ${req.user.email}`;
    } else if (!mail.configured || mail.delivery === "preview") {
      message =
        "Alert created (in-app). To receive Gmail on your phone, set RESEND_API_KEY in backend/.env";
    } else if (emailResult?.emailError) {
      message = `Alert created, but email failed: ${emailResult.emailError}`;
    } else if ((emailResult?.matches || 0) > 0) {
      message = "Alert created — matches found (check email / notifications)";
    }

    return res.status(201).json({
      alert,
      message,
      notify: emailResult,
      emailConfigured: mail.configured,
      emailProvider: mail.provider,
      emailDelivery: mail.delivery,
    });
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

  const before = await Notification.countDocuments({ userId: req.user._id });
  const outcome = await processAlerts({ since, force: true });
  const after = await Notification.countDocuments({ userId: req.user._id });

  // If matching already happened earlier (duplicates), still email this user's digest
  let emailExtra = null;
  if (!outcome.emailsSent && req.user.email) {
    emailExtra = await emailUserDigest(req.user, { limit: 15 });
  }

  const mail = getMailStatus();
  return res.json({
    status: "ok",
    ...outcome,
    yourNewNotifications: Math.max(0, after - before),
    emailTo: req.user.email,
    emailsSent: outcome.emailsSent || (emailExtra?.sent ? 1 : 0),
    emailPreviewUrl: outcome.emailPreviewUrl || emailExtra?.previewUrl,
    emailDelivery: outcome.emailDelivery || mail.delivery || emailExtra?.emailDelivery,
    emailProvider: outcome.emailProvider || mail.provider || emailExtra?.provider,
    emailError:
      outcome.emailError ||
      (emailExtra && !emailExtra.sent ? emailExtra.reason : undefined),
    emailNote: emailExtra?.note || undefined,
  });
}

async function sendEmailNow(req, res) {
  if (!isDBConnected()) return res.status(503).json({ message: "Database not connected" });
  const result = await emailUserDigest(req.user, { limit: 15 });
  if (!result.sent) {
    return res.status(400).json({
      message: result.reason || "Could not send email",
      ...result,
      emailTo: req.user.email,
    });
  }
  return res.json({
    message:
      result.provider === "ethereal"
        ? "Preview email sent — open the preview link (not real Gmail yet)"
        : `Email sent to ${req.user.email}`,
    ...result,
  });
}

async function mailStatus(req, res) {
  return res.json({ ...getMailStatus(), emailTo: req.user?.email || null });
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
  sendEmailNow,
  mailStatus,
  listNotifications,
  unreadCount,
  markRead,
  markAllRead,
};
