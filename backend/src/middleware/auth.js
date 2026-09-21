const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { isDBConnected } = require("../config/db");

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

async function authRequired(req, res, next) {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({ message: "Database not connected" });
    }

    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme === "Bearer" && token && isDBConnected()) {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.userId);
      if (user) req.user = user;
    }
  } catch {
    // ignore invalid token for optional auth
  }
  next();
}

module.exports = { signToken, authRequired, optionalAuth };
