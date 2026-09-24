const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { similarity, isNearDuplicate } = require("../src/services/dedupe");
const { buildContentHash, normalizeText } = require("../src/utils/hash");

describe("dedupe + hash", () => {
  it("normalizeText collapses whitespace and case", () => {
    assert.equal(normalizeText("  React  Developer "), "react developer");
  });

  it("buildContentHash is stable for same title/company/location", () => {
    const a = buildContentHash({
      title: "Software Engineer",
      company: "Infosys",
      location: "Bengaluru",
    });
    const b = buildContentHash({
      title: " software engineer ",
      company: "INFOSYS",
      location: "Bengaluru",
    });
    assert.equal(a, b);
    assert.equal(a.length, 64);
  });

  it("buildContentHash differs when company changes", () => {
    const a = buildContentHash({ title: "SDE", company: "TCS", location: "Pune" });
    const b = buildContentHash({ title: "SDE", company: "Wipro", location: "Pune" });
    assert.notEqual(a, b);
  });

  it("similarity scores exact and partial titles", () => {
    assert.equal(similarity("React Developer", "React Developer"), 1);
    assert.ok(similarity("React Developer", "React Frontend Developer") >= 0.5);
    assert.ok(similarity("React Developer", "Java Backend") < 0.5);
  });

  it("isNearDuplicate detects same role at same company/location", () => {
    const left = {
      title: "Full Stack Developer",
      company: "TechVista Solutions",
      location: "Bengaluru",
    };
    const right = {
      title: "Full Stack Developer (Duplicate Test)",
      company: "TechVista Solutions",
      location: "Bengaluru",
    };
    assert.equal(isNearDuplicate(left, right), true);

    const different = {
      title: "Data Analyst",
      company: "TechVista Solutions",
      location: "Bengaluru",
    };
    assert.equal(isNearDuplicate(left, different), false);
  });
});
