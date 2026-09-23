const SOURCE_LABELS = {
  naukri: "Naukri",
  indeed: "Indeed",
  linkedin: "LinkedIn",
  apna: "Apna",
  remotive: "Remotive",
  remoteok: "RemoteOK",
  "private-company": "Company careers",
  "company-cheerio": "Company careers",
  "company-puppeteer": "Company careers",
  seed: "Sample data",
  "seed-alt": "Sample data",
};

const COMPANY_CAREERS = {
  freshworks: "https://www.freshworks.com/company/careers/",
  zoho: "https://www.zoho.com/careers/",
  razorpay: "https://razorpay.com/jobs/",
  postman: "https://www.postman.com/company/careers/",
  chargebee: "https://www.chargebee.com/careers/",
  browserstack: "https://www.browserstack.com/careers",
  infosys: "https://www.infosys.com/careers/",
  tcs: "https://www.tcs.com/careers",
  wipro: "https://careers.wipro.com/",
  microsoft: "https://careers.microsoft.com/",
  google: "https://careers.google.com/",
  amazon: "https://www.amazon.jobs/",
  ibm: "https://www.ibm.com/careers",
};

export function getSourceLabel(source = "") {
  const key = String(source || "").toLowerCase();
  return SOURCE_LABELS[key] || source || "Unknown source";
}

export function isPlaceholderUrl(url = "") {
  const value = String(url || "").trim().toLowerCase();
  if (!value) return true;
  if (value.startsWith("local://")) return true;
  if (value.includes("/demo")) return true;
  if (value.includes("example.com") || value.includes("example.org")) return true;
  if (value.includes("careers.example.com")) return true;
  // Fake / non-resolvable fixture deep-links
  if (/job-listings\/(naukri|indeed|linkedin|apna|private)/.test(value)) return true;
  if (/job-listings-.*-demo-/.test(value)) return true;
  if (/linkedin\.com\/jobs\/view\/(demo-|linkedin-)/.test(value)) return true;
  if (/apna\.co\/job\/(demo|apna-)/.test(value)) return true;
  if (/indeed\.com\/viewjob(\/(indeed-|demo)|[?&]jk=demo)/.test(value)) return true;
  return false;
}

function companyCareersUrl(company = "") {
  const key = String(company).toLowerCase();
  for (const [name, url] of Object.entries(COMPANY_CAREERS)) {
    if (key.includes(name)) return url;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(`${company} careers jobs`)}`;
}

function cleanSearchQuery(job) {
  // Drop demo words that make Indeed return zero results
  const title = String(job.title || "")
    .replace(/\(.*?duplicate.*?\)/gi, "")
    .replace(/\bdemo\b/gi, "")
    .replace(/\btest\b/gi, "")
    .trim();
  const company = String(job.company || "").trim();
  return `${title} ${company}`.trim();
}

function searchUrlForSource(job) {
  const q = encodeURIComponent(cleanSearchQuery(job) || "software developer");
  const titleOnly = encodeURIComponent(
    String(job.title || "software developer")
      .replace(/\(.*?duplicate.*?\)/gi, "")
      .replace(/\bdemo\b/gi, "")
      .trim() || "software developer"
  );
  const loc = encodeURIComponent(job.location || "India");
  const source = String(job.source || "").toLowerCase();

  switch (source) {
    case "naukri":
      return `https://www.naukri.com/${titleOnly.toLowerCase().replace(/%20/g, "-")}-jobs`;
    case "indeed":
    case "seed":
    case "seed-alt":
      return `https://in.indeed.com/jobs?q=${titleOnly}&l=${loc}`;
    case "linkedin":
      return `https://www.linkedin.com/jobs/search/?keywords=${titleOnly}`;
    case "apna":
      return `https://apna.co/jobs`;
    case "remotive":
      return job.applyUrl && !isPlaceholderUrl(job.applyUrl)
        ? job.applyUrl
        : `https://remotive.com/remote-jobs?search=${titleOnly}`;
    case "remoteok":
      return job.applyUrl && !isPlaceholderUrl(job.applyUrl)
        ? job.applyUrl
        : `https://remoteok.com/remote-dev-jobs`;
    case "private-company":
    case "company-cheerio":
    case "company-puppeteer":
      return companyCareersUrl(job.company);
    default:
      return `https://www.google.com/search?q=${q}+jobs`;
  }
}

/**
 * Pick the best outbound URL for applying / viewing the original posting.
 */
export function resolveApplyUrl(job = {}) {
  const source = String(job.source || "").toLowerCase();

  // Always prefer verified live careers page for company sources
  if (["private-company", "company-cheerio", "company-puppeteer"].includes(source)) {
    const careers = companyCareersUrl(job.company);
    return {
      url: careers,
      kind: "direct",
      label: `Open ${job.company || "company"} careers`,
      note: null,
    };
  }

  const candidates = [job.applyUrl, job.sourceUrl].filter(Boolean);
  for (const url of candidates) {
    if (!isPlaceholderUrl(url)) {
      return {
        url,
        kind: "direct",
        label: `Open on ${getSourceLabel(job.source)}`,
        note: null,
      };
    }
  }

  return {
    url: searchUrlForSource(job),
    kind: "search",
    label: `Find on ${getSourceLabel(job.source)}`,
    note: "Opens a live jobs page for this role/company on the source platform.",
  };
}
