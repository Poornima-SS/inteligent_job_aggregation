const path = require("path");
const { pathToFileURL } = require("url");
const { delay } = require("./baseScraper");
const { parseCareerHtml, getCareersHtmlPath } = require("./companyCheerioScraper");

async function scrapeCompanyPuppeteer() {
  let browser;
  try {
    // Lazy-load so server still boots if Chromium download failed
    const puppeteer = require("puppeteer");
    const filePath = getCareersHtmlPath();
    const fileUrl = pathToFileURL(path.resolve(filePath)).href;

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(fileUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
    await delay(200);
    const html = await page.content();
    return parseCareerHtml(html, "company-puppeteer");
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { scrapeCompanyPuppeteer };
