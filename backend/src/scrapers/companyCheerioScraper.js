const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const { makeRawJob, delay } = require("./baseScraper");
const { parseExperience, parseSalary } = require("../services/cleaner");

function getCareersHtmlPath() {
  return path.join(__dirname, "..", "..", "sample-data", "company-careers.html");
}

function parseCareerHtml(html, sourceName = "company-cheerio") {
  const $ = cheerio.load(html);
  const jobs = [];

  $(".job-listing").each((_, el) => {
    const node = $(el);
    const title = node.find(".title").text();
    const company = node.find(".company").text();
    const location = node.find(".location").text();
    const employmentType = node.find(".type").text();
    const experienceText = node.find(".experience").text();
    const salaryText = node.find(".salary").text();
    const skills = node.find(".skills").text();
    const description = node.find(".description").text();
    const applyUrl = node.find("a.apply").attr("href") || "";
    const id = node.attr("data-id") || title;
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
        salaryCurrency: sal.salaryCurrency,
        employmentType,
        source: sourceName,
        sourceUrl: `local://company-careers/${id}`,
        applyUrl,
        salaryText,
      })
    );
  });

  return jobs;
}

async function scrapeCompanyCheerio() {
  const filePath = getCareersHtmlPath();
  const html = fs.readFileSync(filePath, "utf8");
  await delay(100);
  return parseCareerHtml(html, "company-cheerio");
}

module.exports = { scrapeCompanyCheerio, parseCareerHtml, getCareersHtmlPath };
