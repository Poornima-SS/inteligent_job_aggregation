const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  stripHtml,
  normalizeLocation,
  normalizeSkills,
  parseExperience,
  parseSalary,
  cleanJob,
} = require("../src/services/cleaner");

describe("cleaner", () => {
  it("strips HTML and scripts", () => {
    const out = stripHtml('<p>Hello <b>World</b></p><script>alert(1)</script>');
    assert.equal(out, "Hello World");
  });

  it("normalizes Bangalore to Bengaluru", () => {
    assert.equal(normalizeLocation("Bangalore"), "Bengaluru");
    assert.equal(normalizeLocation("bengaluru, india"), "Bengaluru");
    assert.equal(normalizeLocation("Work from anywhere"), "Remote");
  });

  it("dedupes and trims skills", () => {
    assert.deepEqual(normalizeSkills(["React", "react", " Node.js "]), ["React", "Node.js"]);
    assert.deepEqual(normalizeSkills("Java, Python | SQL"), ["Java", "Python", "SQL"]);
  });

  it("parses experience ranges", () => {
    assert.deepEqual(parseExperience("2-4 years"), { experienceMin: 2, experienceMax: 4 });
    assert.deepEqual(parseExperience("Fresher"), { experienceMin: 0, experienceMax: 1 });
    assert.deepEqual(parseExperience("5+ yrs"), { experienceMin: 5, experienceMax: 5 });
  });

  it("parses Indian lac salary text", () => {
    const a = parseSalary("8-15 LPA", "USD");
    assert.equal(a.salaryCurrency, "INR");
    assert.equal(a.salaryMin, 800000);
    assert.equal(a.salaryMax, 1500000);

    const b = parseSalary("₹ 6 Lacs", "USD");
    assert.equal(b.salaryMin, 600000);
    assert.equal(b.salaryMax, 600000);
  });

  it("cleanJob returns normalized listing", () => {
    const job = cleanJob({
      title: "  <b>Frontend Developer</b> ",
      company: "Acme",
      location: "Bangalore",
      description: "<p>Build UI with React</p>",
      skills: "React, Node.js, React",
      experienceMin: 1,
      experienceMax: 3,
      salaryText: "10-14 LPA",
      employmentType: "full time",
      source: "naukri",
      sourceUrl: "https://www.naukri.com/frontend-developer-jobs-in-bengaluru",
      applyUrl: "https://www.naukri.com/frontend-developer-jobs-in-bengaluru",
    });
    assert.equal(job.title, "Frontend Developer");
    assert.equal(job.location, "Bengaluru");
    assert.deepEqual(job.skills, ["React", "Node.js"]);
    assert.equal(job.salaryCurrency, "INR");
    assert.equal(job.salaryMin, 1000000);
    assert.equal(job.employmentType, "full-time");
    assert.equal(job.isActive, true);
  });
});
