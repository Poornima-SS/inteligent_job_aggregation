const axios = require("axios");
const { DEFAULT_HEADERS, withRetry, makeRawJob, delay } = require("./baseScraper");

async function scrapeRemotive({ limit = 40 } = {}) {
  const data = await withRetry(async () => {
    const res = await axios.get("https://remotive.com/api/remote-jobs", {
      headers: DEFAULT_HEADERS,
      params: { category: "software-dev", limit },
      timeout: 20000,
    });
    return res.data;
  });

  await delay(300);
  const jobs = Array.isArray(data.jobs) ? data.jobs.slice(0, limit) : [];

  return jobs.map((job) =>
    makeRawJob({
      title: job.title,
      company: job.company_name,
      location: job.candidate_required_location || "Remote",
      description: job.description,
      skills: job.tags || [],
      employmentType: job.job_type || "full-time",
      source: "remotive",
      sourceUrl: job.url,
      applyUrl: job.url,
      postedAt: job.publication_date,
      salaryText: job.salary || "",
      salaryCurrency: "USD",
    })
  );
}

module.exports = { scrapeRemotive };
