const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { extractSkillsFromResume } = require("../src/services/resumeParser");
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
