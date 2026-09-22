const DEFAULT_HEADERS = {
  "User-Agent":
    "IntelligentJobAggregation/1.0 (academic project; contact: local-dev)",
  Accept: "application/json, text/html;q=0.9,*/*;q=0.8",
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(fn, { retries = 2, waitMs = 800 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) await delay(waitMs * (attempt + 1));
    }
  }
  throw lastError;
}

function makeRawJob(partial) {
  return {
    title: partial.title || "",
    company: partial.company || "",
    location: partial.location || "Remote",
    description: partial.description || "",
    skills: partial.skills || [],
    experienceMin: partial.experienceMin ?? null,
    experienceMax: partial.experienceMax ?? null,
    salaryMin: partial.salaryMin ?? null,
    salaryMax: partial.salaryMax ?? null,
    salaryCurrency: partial.salaryCurrency || "USD",
    employmentType: partial.employmentType || "full-time",
    source: partial.source || "unknown",
    sourceUrl: partial.sourceUrl || "",
    applyUrl: partial.applyUrl || partial.sourceUrl || "",
    postedAt: partial.postedAt || new Date(),
  };
}

module.exports = {
  DEFAULT_HEADERS,
  delay,
  withRetry,
  makeRawJob,
};
