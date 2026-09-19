const crypto = require("crypto");

function normalizeText(value = "") {
  return String(value).trim().toLowerCase().replace(/\s+/g, " ");
}

function buildContentHash({ title, company, location }) {
  const raw = `${normalizeText(title)}|${normalizeText(company)}|${normalizeText(location)}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

module.exports = { normalizeText, buildContentHash };
