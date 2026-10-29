const cron = require("node-cron");
const { ScrapeLog, Alert, User } = require("../models");
const { runScrapers } = require("../services/scrapeRunner");
const { processAlerts, emailUserDigest } = require("../services/notifier");

const DEFAULT_SOURCES = ["linkedin", "naukri", "apna", "indeed", "remotive", "remoteok"];

let task = null;
let alertTask = null;
let lastRun = null;
let lastResult = null;
let lastAlertRun = null;
let running = false;
let alertRunning = false;

function getConfig() {
  const enabled = String(process.env.CRON_ENABLED || "true").toLowerCase() !== "false";
  // Default: every 6 hours
  const expression = process.env.CRON_EXPRESSION || "0 */6 * * *";
  const sources = (process.env.CRON_SOURCES || DEFAULT_SOURCES.join(","))
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return { enabled, expression, sources };
}

async function getLatestScrapeLog() {
  return ScrapeLog.findOne().sort({ startedAt: -1 }).lean();
}

async function runScheduledScrape(trigger = "cron") {
  if (running) {
    return { skipped: true, reason: "A scrape is already running" };
  }

  const { sources } = getConfig();
  running = true;
  lastRun = {
    trigger,
    startedAt: new Date().toISOString(),
  };

  try {
    console.log(`[scheduler] Starting ${trigger} scrape for: ${sources.join(", ")}`);
    const outcome = await runScrapers(sources, { limit: 50 });
    lastResult = {
      trigger,
      finishedAt: new Date().toISOString(),
      status:
        outcome.summary.failed === 0
          ? "success"
          : outcome.summary.succeeded === 0
            ? "failed"
            : "partial",
      summary: outcome.summary,
      sources: outcome.sources,
      results: outcome.results,
    };
    console.log(
      `[scheduler] Finished ${trigger}: found ${outcome.summary.jobsFound}, saved ${outcome.summary.jobsSaved}`
    );
    return lastResult;
  } catch (err) {
    lastResult = {
      trigger,
      finishedAt: new Date().toISOString(),
      status: "failed",
      error: err.message || String(err),
    };
    console.error("[scheduler] Failed:", err.message);
    return lastResult;
  } finally {
    running = false;
  }
}

async function runScheduledAlerts(trigger = "alert-cron") {
  if (alertRunning) {
    return { skipped: true, reason: "Alert check already running" };
  }
  alertRunning = true;
  lastAlertRun = { trigger, startedAt: new Date().toISOString() };
  try {
    // Look back 7 days so recurring digests still find jobs
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let outcome = await processAlerts({ since, force: true, limitJobs: 300 });

    // If nothing new matched, still email each user a digest of recent notifications
    if (!(outcome.emailsSent > 0)) {
      const alerts = await Alert.find({ enabled: true, notifyEmail: true }).lean();
      const userIds = [...new Set(alerts.map((a) => String(a.userId)))];
      const users = await User.find({ _id: { $in: userIds } });
      let emailsSent = 0;
      let emailError = outcome.emailError;
      let emailPreviewUrl = outcome.emailPreviewUrl;
      let emailProvider = outcome.emailProvider;
      for (const user of users) {
        // eslint-disable-next-line no-await-in-loop
        const sent = await emailUserDigest(user, { limit: 10 });
        if (sent.sent) {
          emailsSent += 1;
          emailProvider = sent.provider || emailProvider;
          if (sent.previewUrl && !emailPreviewUrl) emailPreviewUrl = sent.previewUrl;
        } else if (!emailError) {
          emailError = sent.reason;
        }
      }
      outcome = {
        ...outcome,
        emailsSent,
        emailProvider,
        emailPreviewUrl,
        emailError,
        digestFallback: true,
      };
    }

    lastAlertRun = {
      ...lastAlertRun,
      finishedAt: new Date().toISOString(),
      ...outcome,
    };
    console.log(
      `[alerts-cron] matches=${outcome.matches} emails=${outcome.emailsSent || 0} provider=${outcome.emailProvider || "none"}`
    );
    return lastAlertRun;
  } catch (err) {
    lastAlertRun = {
      ...lastAlertRun,
      finishedAt: new Date().toISOString(),
      error: err.message || String(err),
    };
    console.warn("[alerts-cron] failed:", err.message);
    return lastAlertRun;
  } finally {
    alertRunning = false;
  }
}

function startScheduler() {
  const config = getConfig();

  if (task) {
    task.stop();
    task = null;
  }
  if (alertTask) {
    alertTask.stop();
    alertTask = null;
  }

  if (!config.enabled) {
    console.log("[scheduler] Disabled (CRON_ENABLED=false)");
    return getStatus();
  }

  if (!cron.validate(config.expression)) {
    console.warn(`[scheduler] Invalid CRON_EXPRESSION "${config.expression}" — scheduler not started`);
    return getStatus();
  }

  task = cron.schedule(config.expression, () => {
    runScheduledScrape("cron").catch(() => {});
  });

  // Auto-email job matches every 5 minutes (override with ALERT_CRON_EXPRESSION)
  const alertExpr = process.env.ALERT_CRON_EXPRESSION || "*/5 * * * *";
  if (cron.validate(alertExpr)) {
    alertTask = cron.schedule(alertExpr, () => {
      runScheduledAlerts("alert-cron").catch(() => {});
    });
    console.log(`[scheduler] Alert emails every 5 min — "${alertExpr}"`);
  }

  console.log(
    `[scheduler] Enabled — "${config.expression}" sources=[${config.sources.join(", ")}]`
  );
  return getStatus();
}

function stopScheduler() {
  if (task) {
    task.stop();
    task = null;
  }
  if (alertTask) {
    alertTask.stop();
    alertTask = null;
  }
}

function getStatus() {
  const config = getConfig();
  return {
    enabled: config.enabled && !!task,
    expression: config.expression,
    sources: config.sources,
    running,
    lastRun,
    lastResult,
    alertCronEnabled: !!alertTask,
    lastAlertRun,
  };
}

module.exports = {
  startScheduler,
  stopScheduler,
  runScheduledScrape,
  runScheduledAlerts,
  getStatus,
  getLatestScrapeLog,
  getConfig,
  DEFAULT_SOURCES,
};
