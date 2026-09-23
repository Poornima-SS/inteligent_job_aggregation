const { Alert, Job, Notification, User } = require("../models");
const { scoreJob } = require("./ranker");
const { normalizeText } = require("../utils/hash");

function parseSkills(value) {
  if (Array.isArray(value)) {
    return value.map((s) => String(s).trim()).filter(Boolean);
  }
  return String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function keywordHit(job, keywords) {
  const q = normalizeText(keywords);
  if (!q) return true;
  const hay = normalizeText(
    `${job.title || ""} ${job.company || ""} ${job.description || ""} ${(job.skills || []).join(" ")}`
  );
  const parts = q.split(" ").filter((p) => p.length > 1);
  if (!parts.length) return true;
  // All significant tokens optional: any token match is enough
  return parts.some((p) => hay.includes(p));
}

function locationHit(jobLocation, alertLocation) {
  const want = normalizeText(alertLocation);
  if (!want) return true;
  const got = normalizeText(jobLocation || "");
  if (!got) return true; // don't reject unknown locations
  if (got.includes(want) || want.includes(got)) return true;
  if (want === "remote" && got.includes("remote")) return true;
  // Bangalore / Bengaluru alias
  if (
    (want.includes("bangalore") || want.includes("bengaluru")) &&
    (got.includes("bangalore") || got.includes("bengaluru"))
  ) {
    return true;
  }
  return false;
}

/**
 * Build a pseudo-user from alert filters + real profile for ranking.
 */
function alertMatchUser(alert, user) {
  const alertSkills = parseSkills(alert.skills);
  const keywordRoles = String(alert.keywords || "")
    .split(/[,/|]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    skills: alertSkills.length ? alertSkills : user.skills || [],
    preferredLocations: alert.location
      ? [alert.location]
      : user.preferredLocations || [],
    preferredRoles: keywordRoles.length
      ? keywordRoles
      : user.preferredRoles || [],
    experienceYears: user.experienceYears || 0,
  };
}

function jobMatchesAlert(job, alert, user) {
  const hasKeywords = String(alert.keywords || "").trim().length > 0;
  const hasSkills = parseSkills(alert.skills).length > 0;

  // Soft filters: if both keywords and skills set, pass if EITHER hits
  if (hasKeywords && hasSkills) {
    const kw = keywordHit(job, alert.keywords);
    const skillScore = scoreJob(
      { skills: parseSkills(alert.skills), preferredLocations: [], preferredRoles: [], experienceYears: 0 },
      job
    ).breakdown.skills;
    if (!kw && skillScore < 20) return null;
  } else if (hasKeywords && !keywordHit(job, alert.keywords)) {
    return null;
  }

  if (!locationHit(job.location, alert.location)) return null;

  if (alert.employmentType) {
    if (normalizeText(job.employmentType) !== normalizeText(alert.employmentType)) return null;
  }
  if (alert.source) {
    if (normalizeText(job.source) !== normalizeText(alert.source)) return null;
  }

  const scored = scoreJob(alertMatchUser(alert, user), job);
  if (scored.score < (alert.minMatchScore ?? 40)) return null;
  return scored;
}

/**
 * Optional email via Nodemailer when SMTP_* env vars are set.
 * Falls back silently to in-app notifications only.
 */
async function maybeSendEmail({ to, subject, text }) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass || !to) {
    return { sent: false, reason: "SMTP not configured" };
  }

  try {
    // Lazy require so missing nodemailer does not break the app
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || "false") === "true",
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || user,
      to,
      subject,
      text,
    });
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err.message || String(err) };
  }
}

/**
 * Evaluate enabled alerts against recent/new jobs and create notifications.
 */
async function processAlerts({ since = null, jobIds = null, limitJobs = 200 } = {}) {
  const alerts = await Alert.find({ enabled: true }).lean();
  if (!alerts.length) {
    return { alertsChecked: 0, matches: 0, notificationsCreated: 0 };
  }

  const jobFilter = { isActive: true };
  if (jobIds?.length) {
    jobFilter._id = { $in: jobIds };
  } else if (since) {
    jobFilter.scrapedAt = { $gte: new Date(since) };
  } else {
    // Default: jobs scraped in the last 24 hours
    jobFilter.scrapedAt = { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) };
  }

  const jobs = await Job.find(jobFilter).sort({ scrapedAt: -1 }).limit(limitJobs).lean();
  if (!jobs.length) {
    return { alertsChecked: alerts.length, matches: 0, notificationsCreated: 0, jobsScanned: 0 };
  }

  const userIds = [...new Set(alerts.map((a) => String(a.userId)))];
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  let matches = 0;
  let notificationsCreated = 0;
  const emails = [];

  for (const alert of alerts) {
    const user = userMap.get(String(alert.userId));
    if (!user) continue;

    const sinceAlert = alert.lastNotifiedAt
      ? new Date(alert.lastNotifiedAt).getTime()
      : 0;

    let alertHits = 0;
    for (const job of jobs) {
      const scraped = job.scrapedAt ? new Date(job.scrapedAt).getTime() : Date.now();
      // Skip jobs older than last notify unless explicitly targeting jobIds
      if (!jobIds?.length && sinceAlert && scraped <= sinceAlert) continue;

      const scored = jobMatchesAlert(job, alert, user);
      if (!scored) continue;

      matches += 1;
      alertHits += 1;

      try {
        const doc = await Notification.create({
          userId: alert.userId,
          alertId: alert._id,
          jobId: job._id,
          title: `${job.title} at ${job.company}`,
          message: `Matched your alert "${alert.name || "Job alert"}" at ${scored.score}% (via ${job.source})`,
          matchScore: scored.score,
          read: false,
        });
        notificationsCreated += 1;

        if (alert.notifyEmail) {
          emails.push({
            to: user.email,
            subject: `[Job alert] ${job.title} — ${scored.score}% match`,
            text: `${doc.message}\n\nOpen: ${process.env.CLIENT_URL || "http://localhost:5173"}/jobs/${job._id}`,
          });
        }
      } catch (err) {
        // Duplicate notification (same user+alert+job) — ignore
        if (err?.code !== 11000) {
          console.warn("[alerts] notify create failed:", err.message);
        }
      }
    }

    if (alertHits > 0) {
      await Alert.updateOne({ _id: alert._id }, { $set: { lastNotifiedAt: new Date() } });
    }
  }

  let emailsSent = 0;
  for (const mail of emails.slice(0, 20)) {
    // eslint-disable-next-line no-await-in-loop
    const result = await maybeSendEmail(mail);
    if (result.sent) emailsSent += 1;
  }

  return {
    alertsChecked: alerts.length,
    jobsScanned: jobs.length,
    matches,
    notificationsCreated,
    emailsSent,
  };
}

/**
 * Preview which current jobs would match an alert (without creating notifications).
 */
async function previewAlertMatches(alertInput, user, { limit = 20 } = {}) {
  const jobs = await Job.find({ isActive: true }).sort({ scrapedAt: -1 }).limit(300).lean();
  const matched = [];
  for (const job of jobs) {
    const scored = jobMatchesAlert(job, alertInput, user);
    if (!scored) continue;
    matched.push({
      ...job,
      matchScore: scored.score,
      matchBreakdown: scored.breakdown,
    });
  }
  matched.sort((a, b) => b.matchScore - a.matchScore);
  return matched.slice(0, limit);
}

module.exports = {
  processAlerts,
  previewAlertMatches,
  jobMatchesAlert,
  parseSkills,
  maybeSendEmail,
};
