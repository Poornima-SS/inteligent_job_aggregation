const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const { makeRawJob, delay } = require("./baseScraper");
const { parseExperience, parseSalary } = require("../services/cleaner");
const { parseCareerHtml } = require("./companyCheerioScraper");

function portalDir() {
  return path.join(__dirname, "..", "..", "sample-data", "portals");
}

function readJsonJobs(name) {
  const file = path.join(portalDir(), `${name}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readHtml(name) {
  const file = path.join(portalDir(), `${name}.html`);
  if (!fs.existsSync(file)) {
    throw new Error(`Portal fixture missing: ${file}`);
  }
  return fs.readFileSync(file, "utf8");
}

function fromJsonList(rows, source) {
  return rows.map((row) =>
    makeRawJob({
      title: row.title,
      company: row.company,
      location: row.location,
      description: row.description,
      skills: row.skills,
      experienceMin: row.experienceMin,
      experienceMax: row.experienceMax,
      salaryMin: row.salaryMin,
      salaryMax: row.salaryMax,
      salaryCurrency: row.salaryCurrency || "INR",
      employmentType: row.employmentType,
      source,
      sourceUrl: row.applyUrl || `local://${source}/${row.id || row.title}`,
      applyUrl: row.applyUrl || "",
      salaryText: "",
    })
  );
}

function parseNaukri(html) {
  const $ = cheerio.load(html);
  const jobs = [];
  $(".job-tuple").each((_, el) => {
    const node = $(el);
    const titleNode = node.find("a.title");
    const title = titleNode.text().trim();
    const applyUrl = titleNode.attr("href") || "";
    const company = node.find(".company").text().trim();
    const location = node.find(".location").text().trim();
    const experienceText = node.find(".experience").text().trim();
    const salaryText = node.find(".salary").text().trim();
    const skills = node.find(".skills").text().trim();
    const description = node.find(".description").text().trim();
    const exp = parseExperience(experienceText);
    const sal = parseSalary(salaryText, "INR");

    jobs.push(
      makeRawJob({
        title,
        company,
        location,
        description,
        skills,
        experienceMin: exp.experienceMin,
        experienceMax: exp.experienceMax,
        salaryMin: sal.salaryMin,
        salaryMax: sal.salaryMax,
        salaryCurrency: "INR",
        employmentType: "full-time",
        source: "naukri",
        sourceUrl: applyUrl || `local://naukri/${title}`,
        applyUrl,
        salaryText,
      })
    );
  });
  return jobs;
}

function parseIndeed(html) {
  const $ = cheerio.load(html);
  const jobs = [];
  $(".jobCard").each((_, el) => {
    const node = $(el);
    const titleNode = node.find(".jobTitle a");
    const title = titleNode.text().trim();
    const applyUrl = titleNode.attr("href") || "";
    const company = node.find(".companyName").text().trim();
    const location = node.find(".companyLocation").text().trim();
    const salaryText = node.find(".salary-snippet").text().trim();
    const description = node.find(".job-snippet").text().trim();
    const skills = node.find(".skills").text().trim();
    const employmentType = node.find(".metadata").text().trim();
    const exp = parseExperience(description);
    const sal = parseSalary(salaryText, "INR");

    jobs.push(
      makeRawJob({
        title,
        company,
        location,
        description,
        skills,
        experienceMin: exp.experienceMin,
        experienceMax: exp.experienceMax,
        salaryMin: sal.salaryMin,
        salaryMax: sal.salaryMax,
        salaryCurrency: "INR",
        employmentType,
        source: "indeed",
        sourceUrl: applyUrl || `local://indeed/${title}`,
        applyUrl,
        salaryText,
      })
    );
  });
  return jobs;
}

function parseLinkedIn(html) {
  const $ = cheerio.load(html);
  const jobs = [];
  $(".jobs-search-results__list-item").each((_, el) => {
    const node = $(el);
    const title = node.find(".base-search-card__title").text().trim();
    const company = node.find(".base-search-card__subtitle").text().trim();
    const location = node.find(".job-search-card__location").text().trim();
    const description = node.find(".base-search-card__snippet").text().trim();
    const skills = node.find(".skills").text().trim();
    const salaryText = node.find(".salary").text().trim();
    const employmentType = node.find(".employment").text().trim();
    const applyUrl = node.find("a.base-card__full-link").attr("href") || "";
    const exp = parseExperience(description);
    const sal = parseSalary(salaryText, "INR");

    jobs.push(
      makeRawJob({
        title,
        company,
        location,
        description,
        skills,
        experienceMin: exp.experienceMin,
        experienceMax: exp.experienceMax,
        salaryMin: sal.salaryMin,
        salaryMax: sal.salaryMax,
        salaryCurrency: "INR",
        employmentType,
        source: "linkedin",
        sourceUrl: applyUrl || `local://linkedin/${title}`,
        applyUrl,
        salaryText,
      })
    );
  });
  return jobs;
}

function parseApna(html) {
  const $ = cheerio.load(html);
  const jobs = [];
  $(".job-card").each((_, el) => {
    const node = $(el);
    const title = node.find(".job-title").text().trim();
    const company = node.find(".company-name").text().trim();
    const location = node.find(".job-location").text().trim();
    const salaryText = node.find(".job-salary").text().trim();
    const experienceText = node.find(".job-exp").text().trim();
    const employmentType = node.find(".job-type").text().trim();
    const skills = node.find(".job-skills").text().trim();
    const description = node.find(".job-desc").text().trim();
    const applyUrl = node.find("a.apply-btn").attr("href") || "";
    const id = node.attr("data-job-id") || title;
    const exp = parseExperience(experienceText);
    const sal = parseSalary(salaryText, "INR");

    jobs.push(
      makeRawJob({
        title,
        company,
        location,
        description,
        skills,
        experienceMin: exp.experienceMin,
        experienceMax: exp.experienceMax,
        salaryMin: sal.salaryMin,
        salaryMax: sal.salaryMax,
        salaryCurrency: "INR",
        employmentType,
        source: "apna",
        sourceUrl: applyUrl || `local://apna/${id}`,
        applyUrl,
        salaryText,
      })
    );
  });
  return jobs;
}

async function scrapePortal(name, htmlParser) {
  await delay(50);
  const jsonRows = readJsonJobs(name === "private-company" ? "private-company" : name);
  if (jsonRows?.length) {
    return fromJsonList(jsonRows, name);
  }
  if (name === "private-company") {
    const html = readHtml("private-companies");
    return parseCareerHtml(html, "private-company").map((job) => ({
      ...job,
      sourceUrl: job.sourceUrl.replace("local://company-careers/", "local://private-company/"),
    }));
  }
  const html = readHtml(name);
  return htmlParser(html);
}

async function scrapeNaukri() {
  return scrapePortal("naukri", parseNaukri);
}

async function scrapeIndeed() {
  return scrapePortal("indeed", parseIndeed);
}

async function scrapeLinkedIn() {
  return scrapePortal("linkedin", parseLinkedIn);
}

async function scrapeApna() {
  return scrapePortal("apna", parseApna);
}

async function scrapePrivateCompanies() {
  return scrapePortal("private-company", null);
}

module.exports = {
  scrapeNaukri,
  scrapeIndeed,
  scrapeLinkedIn,
  scrapeApna,
  scrapePrivateCompanies,
  parseNaukri,
  parseIndeed,
  parseLinkedIn,
  parseApna,
};
