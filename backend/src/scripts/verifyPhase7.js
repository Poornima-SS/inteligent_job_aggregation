require("dotenv").config();
const { extractSkillsFromResume } = require("../services/resumeParser");

const sample = `
Poornima S S — MCA
Skills: React, Node.js, MongoDB, Express, JavaScript, HTML, CSS
Internship as Frontend Developer in Bengaluru. Familiar with Git, REST APIs, and Docker.
`;

const skills = extractSkillsFromResume(sample);
console.log("Extracted:", skills);
if (skills.length < 5) {
  console.error("Expected at least 5 skills");
  process.exit(1);
}
console.log("Phase 7 resume parser OK");
