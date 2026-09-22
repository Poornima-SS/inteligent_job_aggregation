const { ScrapeLog } = require("../models");
const { isDBConnected } = require("../config/db");
const { runScrapers, getSourceCatalog } = require("../services/scrapeRunner");

async function getSources(req, res) {
  res.json({
    sources: getSourceCatalog(),
    note:
      "Naukri / Indeed / LinkedIn / Apna adapters parse portal-style HTML fixtures and store cleaned jobs in MongoDB. Live scraping of those sites is blocked by ToS and anti-bot systems; private-company boards are included as career-page extraction demos.",
  });
}

async function runScrape(req, res) {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({ message: "Database not connected" });
    }

    const sources = Array.isArray(req.body?.sources) ? req.body.sources : [];
    const limit = Math.min(Number(req.body?.limit) || 12, 30);

    const outcome = await runScrapers(sources, { limit });
    const overallStatus =
      outcome.summary.failed === 0
        ? "success"
        : outcome.summary.succeeded === 0
          ? "failed"
          : "partial";

    res.json({
      message: "Scrape finished — cleaned jobs upserted into MongoDB",
      status: overallStatus,
      ...outcome,
    });
  } catch (err) {
    res.status(500).json({ message: "Scrape failed", error: err.message });
  }
}

async function getLogs(req, res) {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({ message: "Database not connected" });
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const logs = await ScrapeLog.find().sort({ startedAt: -1 }).limit(limit);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch scrape logs", error: err.message });
  }
}

module.exports = { getSources, runScrape, getLogs };
