const axios = require("axios");
const { DEFAULT_HEADERS, withRetry, makeRawJob, delay } = require("./baseScraper");

async function scrapeRemoteOK({ limit = 40 } = {}) {
  const data = await withRetry(async () => {
    const res = await axios.get("https://remoteok.com/api", {
      headers: {
        ...DEFAULT_HEADERS,
        Accept: "application/json",
      },
      timeout: 20000,
    });
    return res.data;
  });

  await delay(300);
  const rows = Array.isArray(data) ? data.slice(1) : []; // first item is metadata

  return rows.slice(0, limit).map((job) =>
    makeRawJob({
      title: job.position || job.title,
      company: job.company,
      location: job.location || "Remote",
      description: job.description || "",
      skills: job.tags || [],
      employmentType: "remote",
      source: "remoteok",
      sourceUrl: job.url || (job.id ? `https://remoteok.com/remote-jobs/${job.id}` : ""),
      applyUrl: job.apply_url || job.url || "",
      postedAt: job.date || (job.epoch ? new Date(job.epoch * 1000) : new Date()),
      salaryMin: job.salary_min || null,
      salaryMax: job.salary_max || null,
      salaryCurrency: "USD",
      salaryText: job.salary || "",
    })
  );
}

module.exports = { scrapeRemoteOK };
