const { toPublicUser } = require("../utils/user");
const { parseResume } = require("../services/resumeParser");

function resumePayload(profile) {
  const filled = [];
  if (profile.name) filled.push("name");
  if (profile.skills?.length) filled.push(`${profile.skills.length} skills`);
  if (profile.experienceYears != null) filled.push("experience");
  if (profile.preferredLocations?.length) filled.push("locations");
  if (profile.preferredRoles?.length) filled.push("roles");

  return {
    ...profile,
    count: profile.skills?.length || 0,
    message: filled.length
      ? `Saved ${filled.join(", ")} to MongoDB.`
      : "Could not detect name or skills. Add them manually.",
  };
}

async function saveResumeToUser(user, profile, fileName = "") {
  if (profile.name) user.name = profile.name;
  if (profile.skills?.length) user.skills = profile.skills;
  if (profile.experienceYears != null) user.experienceYears = Number(profile.experienceYears) || 0;
  if (profile.preferredLocations?.length) user.preferredLocations = profile.preferredLocations;
  if (profile.preferredRoles?.length) user.preferredRoles = profile.preferredRoles;
  user.resumeText = String(profile.resumeText || "").slice(0, 20000);
  if (fileName) user.resumeFileName = fileName;
  user.resumeUploadedAt = new Date();
  await user.save();
  return user;
}

async function textFromUpload(file) {
  if (!file) {
    const err = new Error("Choose a resume file");
    err.status = 400;
    throw err;
  }
  const name = String(file.originalname || "").toLowerCase();
  if (name.endsWith(".txt") || file.mimetype === "text/plain") {
    return file.buffer.toString("utf8");
  }
  if (name.endsWith(".pdf") || file.mimetype === "application/pdf") {
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(file.buffer);
    return data.text || "";
  }
  if (
    name.endsWith(".docx") ||
    file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const mammoth = require("mammoth");
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value || "";
  }
  const err = new Error("Upload a PDF, DOCX, or TXT resume");
  err.status = 400;
  throw err;
}

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
    if (!String(text).trim()) {
      return res.status(400).json({ message: "Paste resume text first" });
    }
    const profile = parseResume(text);
    const user = await saveResumeToUser(req.user, profile);
    return res.json({ ...resumePayload(profile), user: toPublicUser(user) });
  } catch (err) {
    return res.status(500).json({ message: "Failed to save resume", error: err.message });
  }
}

async function uploadResume(req, res) {
  try {
    const text = await textFromUpload(req.file);
    if (!String(text).trim()) {
      return res.status(400).json({ message: "No readable text found in that file" });
    }
    const profile = parseResume(text, req.file.originalname || "");
    const user = await saveResumeToUser(req.user, profile, req.file.originalname || "");
    return res.json({ ...resumePayload(profile), user: toPublicUser(user) });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || "Failed to save resume" });
  }
}

module.exports = { updateMe, extractResumeSkills, uploadResume, textFromUpload };
