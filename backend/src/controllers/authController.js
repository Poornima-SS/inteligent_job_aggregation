const bcrypt = require("bcryptjs");
const { User } = require("../models");
const { isDBConnected } = require("../config/db");
const { signToken } = require("../middleware/auth");
const { toPublicUser } = require("../utils/user");
const { parseResume } = require("../services/resumeParser");
const { textFromUpload } = require("./usersController");

function parseList(value) {
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

async function register(req, res) {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({ message: "Database not connected" });
    }

    const {
      name,
      email,
      password,
      skills,
      experienceYears,
      preferredLocations,
      preferredRoles,
      resumeText,
      resumeFileName,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await User.create({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      passwordHash,
      skills: parseList(skills),
      experienceYears: Number(experienceYears) || 0,
      preferredLocations: parseList(preferredLocations),
      preferredRoles: parseList(preferredRoles),
      resumeText: String(resumeText || "").slice(0, 20000),
      resumeFileName: String(resumeFileName || "").slice(0, 255),
      resumeUploadedAt: resumeText ? new Date() : null,
    });

    const token = signToken(user._id);
    res.status(201).json({
      message: "Registered successfully",
      token,
      user: toPublicUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
}

async function login(req, res) {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({ message: "Database not connected" });
    }

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken(user._id);
    res.json({
      message: "Login successful",
      token,
      user: toPublicUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
}

async function me(req, res) {
  res.json({ user: toPublicUser(req.user) });
}

async function parseResumeUpload(req, res) {
  try {
    const text = await textFromUpload(req.file);
    if (!String(text).trim()) {
      return res.status(400).json({ message: "No readable text found in that file" });
    }
    const profile = parseResume(text, req.file.originalname || "");
    const filled = [];
    if (profile.email) filled.push("email");
    if (profile.name) filled.push("name");
    if (profile.skills?.length) filled.push("skills");
    if (profile.experienceYears != null) filled.push("experience");
    if (profile.preferredLocations?.length) filled.push("locations");
    if (profile.preferredRoles?.length) filled.push("roles");
    return res.json({
      ...profile,
      resumeFileName: req.file.originalname || "",
      message: filled.length
        ? `Filled ${filled.join(", ")} from your resume. They are saved when you register.`
        : "Could not detect fields. Fill them manually.",
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || "Failed to read resume" });
  }
}

module.exports = { register, login, me, parseResumeUpload };
