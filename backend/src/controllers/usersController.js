const { toPublicUser } = require("../utils/user");
const { extractSkillsFromResume } = require("../services/resumeParser");

function parseList(value) {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

async function updateMe(req, res) {
  try {
    const user = req.user;
    const {
      name,
      skills,
      experienceYears,
      preferredLocations,
      preferredRoles,
      resumeText,
    } = req.body;

    if (name !== undefined) user.name = String(name).trim();
    if (experienceYears !== undefined) user.experienceYears = Number(experienceYears) || 0;
    if (resumeText !== undefined) user.resumeText = String(resumeText);

    const nextSkills = parseList(skills);
    if (nextSkills !== undefined) user.skills = nextSkills;

    const nextLocations = parseList(preferredLocations);
    if (nextLocations !== undefined) user.preferredLocations = nextLocations;

    const nextRoles = parseList(preferredRoles);
    if (nextRoles !== undefined) user.preferredRoles = nextRoles;

    await user.save();
    res.json({ message: "Profile updated", user: toPublicUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
}

async function extractResumeSkills(req, res) {
  try {
    const text = req.body?.resumeText ?? req.user.resumeText ?? "";
    const skills = extractSkillsFromResume(text);
    return res.json({
      skills,
      count: skills.length,
      message: skills.length
        ? `Extracted ${skills.length} skill(s) from resume text`
        : "No known skills found — paste more of your resume or add skills manually",
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to extract skills", error: err.message });
  }
}

module.exports = { updateMe, extractResumeSkills };
