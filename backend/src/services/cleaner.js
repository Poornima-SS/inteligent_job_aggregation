const { normalizeText } = require("../utils/hash");

const LOCATION_MAP = {
  bangalore: "Bengaluru",
  bengaluru: "Bengaluru",
  mysore: "Mysuru",
  mysuru: "Mysuru",
  "new york": "New York",
  "san francisco": "San Francisco",
};

function stripHtml(value = "") {
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLocation(location = "Remote") {
  const cleaned = stripHtml(location) || "Remote";
  const key = normalizeText(cleaned);
  if (LOCATION_MAP[key]) return LOCATION_MAP[key];
  if (key.includes("remote") || key === "anywhere" || key.includes("work from anywhere")) {
    return "Remote";
  }
  if (key.includes("bangalore") || key.includes("bengaluru")) return "Bengaluru";
  if (key.includes("mysore") || key.includes("mysuru")) return "Mysuru";
  return cleaned.replace(/\s+/g, " ").trim();
}

function normalizeSkills(skills) {
  let list = [];
  if (Array.isArray(skills)) list = skills;
  else if (typeof skills === "string") list = skills.split(/[,|/]/);

  const seen = new Set();
  const out = [];
  for (const skill of list) {
    const cleaned = stripHtml(skill).replace(/^#+/, "").trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned);
  }
  return out.slice(0, 20);
}

function parseExperience(text = "") {
  const raw = stripHtml(text);
  const range = raw.match(/(\d+)\s*[-–to]+\s*(\d+)\s*\+?\s*(?:years?|yrs?)/i);
  if (range) {
    return { experienceMin: Number(range[1]), experienceMax: Number(range[2]) };
  }
  const single = raw.match(/(\d+)\s*\+?\s*(?:years?|yrs?)/i);
  if (single) {
    const n = Number(single[1]);
    return { experienceMin: n, experienceMax: n };
  }
  if (/fresher|entry[-\s]?level|graduate/i.test(raw)) {
    return { experienceMin: 0, experienceMax: 1 };
  }
  return { experienceMin: 0, experienceMax: null };
}

function parseSalary(text = "", fallbackCurrency = "USD") {
  const raw = stripHtml(String(text));
  if (!raw) return { salaryMin: null, salaryMax: null, salaryCurrency: fallbackCurrency };

  let currency = fallbackCurrency;
  if (/₹|inr|lacs?|lpa|rs\.?/i.test(raw)) currency = "INR";
  else if (/\$|usd/i.test(raw)) currency = "USD";
  else if (/€|eur/i.test(raw)) currency = "EUR";

  // Handle Indian "X-Y Lacs/LPA/L" patterns first (including 8L - 15L)
  const lacRange = raw.match(
    /(\d+(?:\.\d+)?)\s*L?\s*[-–to]+\s*(\d+(?:\.\d+)?)\s*(?:lacs?|lpa|lakhs?|l)\b/i
  );
  if (lacRange) {
    return {
      salaryMin: Math.round(parseFloat(lacRange[1]) * 100000),
      salaryMax: Math.round(parseFloat(lacRange[2]) * 100000),
      salaryCurrency: "INR",
    };
  }
  const lacCompact = raw.match(/(\d+(?:\.\d+)?)\s*L\s*[-–]\s*(\d+(?:\.\d+)?)\s*L/i);
  if (lacCompact) {
    return {
      salaryMin: Math.round(parseFloat(lacCompact[1]) * 100000),
      salaryMax: Math.round(parseFloat(lacCompact[2]) * 100000),
      salaryCurrency: "INR",
    };
  }
  const lacSingle = raw.match(/(\d+(?:\.\d+)?)\s*(?:lacs?|lpa|lakhs?|\bl\b)/i);
  if (lacSingle) {
    const n = Math.round(parseFloat(lacSingle[1]) * 100000);
    return { salaryMin: n, salaryMax: n, salaryCurrency: "INR" };
  }

  const normalized = raw.replace(/,/g, "");
  const nums = [...normalized.matchAll(/(\d+(?:\.\d+)?)\s*([kKmM])?/g)].map((m) => {
    let n = parseFloat(m[1]);
    const suffix = (m[2] || "").toLowerCase();
    if (suffix === "k") n *= 1000;
    if (suffix === "m") n *= 1000000;
    return Math.round(n);
  });

  const salaryLike = nums.filter((n) => n >= 1000);
  const use = salaryLike.length ? salaryLike : nums;

  if (!use.length) return { salaryMin: null, salaryMax: null, salaryCurrency: currency };
  if (use.length === 1) return { salaryMin: use[0], salaryMax: use[0], salaryCurrency: currency };
  return {
    salaryMin: Math.min(use[0], use[1]),
    salaryMax: Math.max(use[0], use[1]),
    salaryCurrency: currency,
  };
}

function normalizeEmploymentType(value = "") {
  const v = normalizeText(value);
  if (v.includes("intern")) return "internship";
  if (v.includes("part")) return "part-time";
  if (v.includes("contract") || v.includes("freelance")) return "contract";
  if (v.includes("remote")) return "remote";
  if (v.includes("full")) return "full-time";
  return "full-time";
}

function cleanJob(raw = {}) {
  const description = stripHtml(raw.description || "").slice(0, 4000);
  const expFromText = parseExperience(`${raw.title || ""} ${description}`);
  const salaryFromText = parseSalary(raw.salaryText || description, raw.salaryCurrency || "USD");

  const title = stripHtml(raw.title || "").slice(0, 200);
  const company = stripHtml(raw.company || "Unknown").slice(0, 120);
  const location = normalizeLocation(raw.location || "Remote");

  return {
    title,
    company,
    location,
    description,
    skills: normalizeSkills(raw.skills),
    experienceMin:
      raw.experienceMin != null ? Number(raw.experienceMin) : expFromText.experienceMin,
    experienceMax:
      raw.experienceMax != null ? Number(raw.experienceMax) : expFromText.experienceMax,
    salaryMin: raw.salaryMin != null ? Number(raw.salaryMin) : salaryFromText.salaryMin,
    salaryMax: raw.salaryMax != null ? Number(raw.salaryMax) : salaryFromText.salaryMax,
    salaryCurrency: raw.salaryCurrency || salaryFromText.salaryCurrency || "USD",
    employmentType: normalizeEmploymentType(raw.employmentType || location),
    source: stripHtml(raw.source || "unknown"),
    sourceUrl: String(raw.sourceUrl || "").trim(),
    applyUrl: String(raw.applyUrl || raw.sourceUrl || "").trim(),
    postedAt: raw.postedAt ? new Date(raw.postedAt) : new Date(),
    scrapedAt: new Date(),
    isActive: true,
  };
}

module.exports = {
  stripHtml,
  normalizeLocation,
  normalizeSkills,
  parseExperience,
  parseSalary,
  normalizeEmploymentType,
  cleanJob,
};
