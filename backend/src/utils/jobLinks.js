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
  reliance: "https://careers.ril.com/",
  "reliance retail": "https://careers.ril.com/",
};

function isPlaceholderUrl(url = "") {
  const value = String(url || "").trim().toLowerCase();
  if (!value) return true;
  if (value.startsWith("local://")) return true;
  if (value.includes("localhost") || value.includes("127.0.0.1")) return true;
  if (value.includes("/demo")) return true;
  if (value.includes("example.com") || value.includes("example.org")) return true;
  if (/google\.[^/]+\/search/i.test(value)) return true;
  return false;
}

function companyCareersUrl(company = "") {
  const key = String(company).toLowerCase();
  for (const [name, url] of Object.entries(COMPANY_CAREERS)) {
    if (key.includes(name)) return url;
  }
  return "";
}

function searchUrlForSource(job) {
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
      return `https://www.naukri.com/jobs-in-india?k=${titleOnly}`;
    case "indeed":
    case "seed":
    case "seed-alt":
      return `https://in.indeed.com/jobs?q=${titleOnly}&l=${loc}`;
    case "linkedin":
      return `https://www.linkedin.com/jobs/search/?keywords=${titleOnly}`;
    case "apna":
      return `https://apna.co/jobs`;
    case "remotive":
      return `https://remotive.com/remote-jobs?search=${titleOnly}`;
    case "remoteok":
      return `https://remoteok.com/remote-dev-jobs`;
    case "private-company":
    case "company-cheerio":
    case "company-puppeteer":
      return companyCareersUrl(job.company) || `https://www.google.com/search?q=${encodeURIComponent(`${job.company || ""} careers ${job.title || ""}`)}`;
    default:
      return `https://www.google.com/search?q=${encodeURIComponent(`${job.title || ""} ${job.company || ""} jobs`)}`;
  }
}

/**
 * Best public https URL for email "View job" (must work on phone — never localhost).
 */
function resolveJobViewUrl(job = {}) {
  const candidates = [job.applyUrl, job.sourceUrl, job.url].filter(Boolean);
  for (const url of candidates) {
    if (!isPlaceholderUrl(url) && /^https?:\/\//i.test(url)) {
      return url;
    }
  }

  const careers = companyCareersUrl(job.company);
  if (careers) return careers;

  return searchUrlForSource(job);
}

function getSourceLabel(source = "") {
  const key = String(source || "").toLowerCase();
  return SOURCE_LABELS[key] || source || "job board";
}

module.exports = {
  resolveJobViewUrl,
  getSourceLabel,
  isPlaceholderUrl,
};
