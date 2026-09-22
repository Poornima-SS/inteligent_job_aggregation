const { ScrapeLog } = require("../models");
const { cleanJob } = require("./cleaner");
const { upsertJobs } = require("./dedupe");
const { scrapeRemotive } = require("../scrapers/remotiveScraper");
const { scrapeRemoteOK } = require("../scrapers/remoteokScraper");
const { scrapeCompanyCheerio } = require("../scrapers/companyCheerioScraper");
const { scrapeCompanyPuppeteer } = require("../scrapers/companyPuppeteerScraper");
const {
  scrapeNaukri,
  scrapeIndeed,
  scrapeLinkedIn,
  scrapeApna,
  scrapePrivateCompanies,
} = require("../scrapers/portalScrapers");

const SOURCE_META = {
  remotive: {
    label: "Remotive",
    group: "public-api",
    description: "Public Remotive remote jobs API",
  },
  remoteok: {
    label: "RemoteOK",
    group: "public-api",
    description: "Public RemoteOK jobs API",
  },
  naukri: {
    label: "Naukri",
    group: "job-portal",
    description:
      "Naukri-style listing extractor (demo fixture → clean → MongoDB). Live Naukri HTML is blocked/ToS-restricted.",
  },
  indeed: {
    label: "Indeed",
    group: "job-portal",
    description:
      "Indeed-style listing extractor (demo fixture → clean → MongoDB). Live Indeed pages use anti-bot protections.",
  },
  linkedin: {
    label: "LinkedIn",
    group: "job-portal",
    description:
      "LinkedIn-style listing extractor (demo fixture). Live LinkedIn scraping requires login and violates ToS — not used.",
  },
  apna: {
    label: "Apna",
    group: "job-portal",
    description: "Apna-style job card extractor (demo fixture → clean → MongoDB).",
  },
  "private-company": {
    label: "Private companies",
    group: "company-careers",
    description: "Extract openings from private company career pages (Zoho, Freshworks, Razorpay demo boards).",
  },
  "company-cheerio": {
    label: "Company (Cheerio)",
    group: "company-careers",
    description: "Local Nexora careers HTML via Cheerio",
  },
  "company-puppeteer": {
    label: "Company (Puppeteer)",
    group: "company-careers",
    description: "Local careers HTML via Puppeteer (JS rendering demo)",
  },
};

const SOURCE_RUNNERS = {
  remotive: scrapeRemotive,
  remoteok: scrapeRemoteOK,
  naukri: scrapeNaukri,
  indeed: scrapeIndeed,
  linkedin: scrapeLinkedIn,
  apna: scrapeApna,
  "private-company": scrapePrivateCompanies,
  "company-cheerio": scrapeCompanyCheerio,
  "company-puppeteer": scrapeCompanyPuppeteer,
};

function listSources() {
  return Object.keys(SOURCE_RUNNERS);
}

function getSourceCatalog() {
  return listSources().map((id) => ({
    id,
    label: SOURCE_META[id]?.label || id,
    group: SOURCE_META[id]?.group || "other",
    description: SOURCE_META[id]?.description || id,
  }));
}

async function runSource(source, options = {}) {
  const runner = SOURCE_RUNNERS[source];
  if (!runner) {
    throw new Error(`Unknown source: ${source}`);
  }

  const log = await ScrapeLog.create({
    source,
    startedAt: new Date(),
    status: "running",
  });

  try {
    const rawJobs = await runner(options);
    const cleaned = rawJobs.map(cleanJob).filter((j) => j.title && j.company);
    const result = await upsertJobs(cleaned);

    log.finishedAt = new Date();
    log.jobsFound = rawJobs.length;
    log.jobsSaved = result.saved;
    log.status = "success";
    log.error = result.skippedDuplicates
      ? `Skipped ${result.skippedDuplicates} duplicates/invalid rows`
      : "";
    await log.save();

    return {
      source,
      status: log.status,
      jobsFound: log.jobsFound,
      jobsSaved: log.jobsSaved,
      skippedDuplicates: result.skippedDuplicates,
      logId: log._id,
    };
  } catch (err) {
    log.finishedAt = new Date();
    log.status = "failed";
    log.error = err.message || String(err);
    await log.save();
    return {
      source,
      status: "failed",
      jobsFound: 0,
      jobsSaved: 0,
      error: log.error,
      logId: log._id,
    };
  }
}

async function runScrapers(sources = [], options = {}) {
  const selected = (sources.length ? sources : listSources()).filter((s) => SOURCE_RUNNERS[s]);
  const results = [];
  for (const source of selected) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await runSource(source, options));
  }

  const summary = results.reduce(
    (acc, item) => {
      acc.jobsFound += item.jobsFound || 0;
      acc.jobsSaved += item.jobsSaved || 0;
      if (item.status === "failed") acc.failed += 1;
      else acc.succeeded += 1;
      return acc;
    },
    { jobsFound: 0, jobsSaved: 0, succeeded: 0, failed: 0 }
  );

  return { results, summary, sources: selected };
}

module.exports = {
  runScrapers,
  runSource,
  listSources,
  getSourceCatalog,
  SOURCE_RUNNERS,
  SOURCE_META,
};
