const cron = require("node-cron");
const { ScrapeLog } = require("../models");
const { runScrapers } = require("../services/scrapeRunner");

const DEFAULT_SOURCES = ["naukri", "indeed", "linkedin", "apna", "private-company"];

let task = null;
let lastRun = null;
let lastResult = null;
let running = false;

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

function startScheduler() {
  const config = getConfig();

  if (task) {
    task.stop();
    task = null;
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
  };
}

module.exports = {
  startScheduler,
  stopScheduler,
  runScheduledScrape,
  getStatus,
  getLatestScrapeLog,
  getConfig,
  DEFAULT_SOURCES,
};
