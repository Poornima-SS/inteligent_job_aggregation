const bcrypt = require("bcryptjs");
const { User } = require("../models");
const { isDBConnected } = require("../config/db");
const { signToken } = require("../middleware/auth");
const { toPublicUser } = require("../utils/user");

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

    const { name, email, password, skills, experienceYears, preferredLocations, preferredRoles } =
      req.body;

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

module.exports = { register, login, me };
