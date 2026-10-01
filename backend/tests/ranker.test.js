const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { extractSkillsFromResume, parseResume } = require("../src/services/resumeParser");
const { scoreJob, skillOverlapScore } = require("../src/services/ranker");

describe("resumeParser", () => {
  it("extracts known skills from resume text", () => {
    const skills = extractSkillsFromResume(
      "Experienced with React, Node.js, MongoDB, Express and Docker. Also JavaScript and Git."
    );
    assert.ok(skills.includes("React"));
    assert.ok(skills.includes("Node.js"));
    assert.ok(skills.includes("MongoDB"));
    assert.ok(skills.length >= 5);
  });

  it("returns empty for blank text", () => {
    assert.deepEqual(extractSkillsFromResume(""), []);
  });

  it("fills name, skills, experience, location, and role from resume text", () => {
    const profile = parseResume(`Poornima S S
MCA | Bengaluru
Frontend Developer
3 years of experience
Skills: React, Node.js, MongoDB, JavaScript`);
    assert.equal(profile.name, "Poornima S S");
    assert.ok(profile.skills.includes("React"));
    assert.equal(profile.experienceYears, 3);
    assert.ok(profile.preferredLocations.includes("Bengaluru"));
    assert.ok(profile.preferredRoles.includes("Frontend Developer"));
  });

  it("reads a name stuck beside contact details and ignores college year span", () => {
    const profile = parseResume(
      `PRAJU K K praju@mail.com 9876543210 Bengaluru
Education 2018 - 2026
Internship project
Full Stack Developer
Skills: React, Node.js`,
      "praju-K-K_resume (2).pdf"
    );
    assert.equal(profile.name, "Praju K K");
    assert.equal(profile.experienceYears, 0);
    assert.ok(profile.preferredRoles.includes("Full Stack Developer"));
    assert.equal(profile.preferredRoles.includes("Intern"), false);
  });

  it("fills the email from the resume and drops Git from the name", () => {
    const profile = parseResume(
      `Praju K K Git
      prajukk@gmail.com | Bengaluru
      Full Stack Developer`,
      "praju-K-K_resume (2).pdf"
    );
    assert.equal(profile.email, "prajukk@gmail.com");
    assert.equal(profile.name, "Praju K K");
  });
});

describe("ranker", () => {
  it("scores higher when skills overlap", () => {
    const user = {
      skills: ["React", "Node.js", "MongoDB"],
      preferredLocations: ["Bengaluru"],
      preferredRoles: ["Frontend Developer"],
      experienceYears: 1,
    };
    const strong = scoreJob(user, {
      title: "Frontend Developer",
      location: "Bengaluru",
      skills: ["React", "JavaScript", "CSS"],
      experienceMin: 0,
      experienceMax: 2,
      postedAt: new Date(),
    });
    const weak = scoreJob(user, {
      title: "Sales Manager",
      location: "Delhi",
      skills: ["Salesforce", "CRM"],
      experienceMin: 5,
      experienceMax: 8,
      postedAt: new Date("2020-01-01"),
    });
    assert.ok(strong.score > weak.score);
    assert.ok(strong.breakdown.skills > 0);
  });

  it("skillOverlapScore is 100 for full match", () => {
    assert.equal(skillOverlapScore(["React", "Node"], ["React", "Node"]), 100);
    assert.equal(skillOverlapScore([], ["React"]), 0);
  });
});
