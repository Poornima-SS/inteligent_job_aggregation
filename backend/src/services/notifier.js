const { Alert, Job, Notification, User } = require("../models");
const { scoreJob } = require("./ranker");
const { normalizeText } = require("../utils/hash");
const { sendEmail, getMailStatus } = require("./mail");
const { resolveJobViewUrl } = require("../utils/jobLinks");

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
  // Mysore / Mysuru alias
  if (
    (want.includes("mysore") || want.includes("mysuru")) &&
    (got.includes("mysore") || got.includes("mysuru"))
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
 * Optional email via Resend / Brevo / SendGrid / SMTP.
 * Falls back silently to in-app notifications only.
 */
async function maybeSendEmail({ to, subject, text, html }) {
  return sendEmail({ to, subject, text, html });
}

function jobViewHref(match) {
  const direct = String(match.viewUrl || "").trim();
  if (direct && /^https?:\/\//i.test(direct) && !/localhost|127\.0\.0\.1/i.test(direct)) {
    return direct;
  }
  return resolveJobViewUrl({
    title: match.title,
    company: match.company,
    location: match.location,
    source: match.source,
    applyUrl: match.applyUrl,
    sourceUrl: match.sourceUrl,
  });
}

function buildDigestEmail(matches, clientUrl, intro = "") {
  const opener =
    String(intro || "").trim() ||
    `You have ${matches.length} new job match${matches.length === 1 ? "" : "es"} from Intelligent Job Aggregation.`;
  const lines = matches.map(
    (m, i) =>
      `${i + 1}. ${m.title} at ${m.company} (${m.score}% match)\n   ${jobViewHref(m)}`
  );
  const text = `${opener}\n\n${lines.join("\n\n")}\n\nOpen your alerts in the app when you are on the same Wi‑Fi as your PC.`;
  const htmlItems = matches
    .map((m) => {
      const href = jobViewHref(m);
      return `<li style="margin:0 0 12px"><strong>${m.title}</strong> at ${m.company}<br><span style="color:#0f766e">${m.score}% match · ${m.alertName}</span><br><a href="${href}" target="_blank" rel="noopener noreferrer">View job</a></li>`;
    })
    .join("");
  const html = `<div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#0f172a"><h2 style="margin:0 0 12px">New job matches</h2><p>${opener}</p><ol style="padding-left:18px">${htmlItems}</ol><p style="color:#64748b;font-size:13px">Tap <strong>View job</strong> to open the live listing on your phone.</p></div>`;
  return { text, html };
}

async function geminiEmailIntro(matches) {
  try {
    const { isGeminiConfigured, generateText } = require("./gemini");
    if (!isGeminiConfigured() || !matches?.length) return "";
    const top = matches
      .slice(0, 5)
      .map((m) => `${m.title} at ${m.company} (${m.score}%)`)
      .join("; ");
    const result = await generateText(
      `Write one friendly sentence (max 28 words) opening a job-alert email. Mentions ${matches.length} matches. Jobs: ${top}. No greeting name. No markdown.`,
      { temperature: 0.4, maxOutputTokens: 60 }
    );
    return result.ok ? result.text.replace(/^["']|["']$/g, "").trim() : "";
  } catch {
    return "";
  }
}

function pushDigest(digests, user, alert, job, score) {
  if (alert.notifyEmail === false || !user?.email) return;
  const key = String(user.email).toLowerCase();
  if (!digests.has(key)) digests.set(key, []);
  digests.get(key).push({
    title: job.title,
    company: job.company,
    location: job.location,
    source: job.source,
    applyUrl: job.applyUrl,
    sourceUrl: job.sourceUrl,
    viewUrl: resolveJobViewUrl(job),
    score,
    jobId: job._id,
    alertName: alert.name || "Job alert",
  });
}

/**
 * Evaluate enabled alerts against recent/new jobs and create notifications.
 */
async function processAlerts({
  since = null,
  jobIds = null,
  limitJobs = 200,
  force = false,
  userId = null,
} = {}) {
  const alertFilter = { enabled: true };
  if (userId) alertFilter.userId = userId;
  const alerts = await Alert.find(alertFilter).lean();
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
  const digests = new Map(); // email -> [{title, company, score, jobId, alertName}]
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  for (const alert of alerts) {
    const user = userMap.get(String(alert.userId));
    if (!user) continue;

    const sinceAlert = alert.lastNotifiedAt
      ? new Date(alert.lastNotifiedAt).getTime()
      : 0;

    let alertHits = 0;
    for (const job of jobs) {
      const scraped = job.scrapedAt ? new Date(job.scrapedAt).getTime() : Date.now();
      // Skip jobs older than last notify unless forced / targeting specific jobs
      if (!force && !jobIds?.length && sinceAlert && scraped <= sinceAlert) continue;

      const scored = jobMatchesAlert(job, alert, user);
      if (!scored) continue;

      matches += 1;
      alertHits += 1;

      let created = false;
      try {
        await Notification.create({
          userId: alert.userId,
          alertId: alert._id,
          jobId: job._id,
          title: `${job.title} at ${job.company}`,
          message: `Matched your alert "${alert.name || "Job alert"}" at ${scored.score}% (via ${job.source})`,
          matchScore: scored.score,
          read: false,
        });
        notificationsCreated += 1;
        created = true;
      } catch (err) {
        // Duplicate notification (same user+alert+job) — ignore create, still email on force
        if (err?.code !== 11000) {
          console.warn("[alerts] notify create failed:", err.message);
        }
      }

      // Always queue email digest for new matches; on force also re-queue duplicates
      if (created || force) {
        pushDigest(digests, user, alert, job, scored.score);
      }
    }

    if (alertHits > 0) {
      await Alert.updateOne({ _id: alert._id }, { $set: { lastNotifiedAt: new Date() } });
    }
  }

  let emailsSent = 0;
  let emailError = "";
  let emailPreviewUrl = "";
  const mailStatus = getMailStatus();
  for (const [to, items] of digests.entries()) {
    const unique = [];
    const seen = new Set();
    for (const item of items) {
      const id = String(item.jobId);
      if (seen.has(id)) continue;
      seen.add(id);
      unique.push(item);
    }
    if (!unique.length) continue;
    const slice = unique.slice(0, 15);
    // eslint-disable-next-line no-await-in-loop
    const intro = await geminiEmailIntro(slice);
    const digest = buildDigestEmail(slice, clientUrl, intro);
    // eslint-disable-next-line no-await-in-loop
    const result = await maybeSendEmail({
      to,
      subject: `[Job alert] ${slice.length} new match${slice.length === 1 ? "" : "es"} for you`,
      text: digest.text,
      html: digest.html,
    });
    if (result.sent) {
      emailsSent += 1;
      if (result.previewUrl && !emailPreviewUrl) emailPreviewUrl = result.previewUrl;
    } else if (!emailError) {
      emailError = result.reason || "Email not sent";
    }
  }

  return {
    alertsChecked: alerts.length,
    jobsScanned: jobs.length,
    matches,
    notificationsCreated,
    emailsSent,
    emailConfigured: mailStatus.configured,
    emailProvider: mailStatus.provider,
    emailDelivery: mailStatus.delivery,
    emailPreviewUrl: emailPreviewUrl || undefined,
    emailError: emailError || undefined,
  };
}

/**
 * Email a digest of recent notifications for one user (e.g. "Send email now").
 */
async function emailUserDigest(user, { limit = 15 } = {}) {
  const mailStatus = getMailStatus();
  if (!user?.email) {
    return { sent: false, reason: "User has no email" };
  }
  if (!mailStatus.configured) {
    return { sent: false, reason: mailStatus.hint || "Email not configured" };
  }

  const notes = await Notification.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("jobId", "title company location source applyUrl sourceUrl")
    .populate("alertId", "name")
    .lean();

  if (!notes.length) {
    return { sent: false, reason: "No notifications to email yet" };
  }

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const matches = notes.map((n) => {
    const job = n.jobId || {};
    return {
      title: job.title || n.title || "Job",
      company: job.company || "",
      location: job.location || "",
      source: job.source || "",
      applyUrl: job.applyUrl || "",
      sourceUrl: job.sourceUrl || "",
      viewUrl: resolveJobViewUrl(job),
      score: n.matchScore || 0,
      jobId: job._id || n.jobId,
      alertName: n.alertId?.name || "Job alert",
    };
  });

  const intro = await geminiEmailIntro(matches);
  const digest = buildDigestEmail(matches, clientUrl, intro);
  const result = await maybeSendEmail({
    to: user.email,
    subject: `[Job alert] ${matches.length} match${matches.length === 1 ? "" : "es"} for you`,
    text: digest.text,
    html: digest.html,
  });

  return {
    ...result,
    emailTo: user.email,
    count: matches.length,
    emailConfigured: mailStatus.configured,
    emailProvider: mailStatus.provider,
    emailDelivery: mailStatus.delivery,
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
  emailUserDigest,
  jobMatchesAlert,
  parseSkills,
  maybeSendEmail,
};
