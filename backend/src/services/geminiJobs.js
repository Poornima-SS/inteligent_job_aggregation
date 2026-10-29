const { generateJson, generateText, isGeminiConfigured } = require("./gemini");
const { parseResume: parseResumeLocal } = require("./resumeParser");

function asStringArray(value) {
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

function mergeProfile(local, ai) {
  const experience =
    Number.isFinite(Number(ai?.experienceYears)) && Number(ai.experienceYears) >= 0
      ? Number(ai.experienceYears)
      : local.experienceYears;

  return {
    name: String(ai?.name || local.name || "").trim() || local.name,
    email: String(ai?.email || local.email || "").trim().toLowerCase() || local.email,
    skills: asStringArray(ai?.skills).length ? asStringArray(ai.skills).slice(0, 20) : local.skills,
    experienceYears: experience,
    preferredLocations: asStringArray(ai?.preferredLocations).length
      ? asStringArray(ai.preferredLocations).slice(0, 8)
      : local.preferredLocations,
    preferredRoles: asStringArray(ai?.preferredRoles).length
      ? asStringArray(ai.preferredRoles).slice(0, 5)
      : local.preferredRoles,
    resumeText: local.resumeText,
    aiUsed: true,
  };
}

/**
 * Parse resume with Gemini when configured; fall back to local rules.
 */
async function parseResumeSmart(text = "", fileName = "") {
  const local = parseResumeLocal(text, fileName);
  if (!isGeminiConfigured()) {
    return { ...local, aiUsed: false };
  }

  const snippet = String(text || "").slice(0, 12000);
  const prompt = `Extract structured profile fields from this resume text.
Filename hint: ${fileName || "unknown"}

Resume:
"""
${snippet}
"""

JSON shape:
{
  "name": "full name or empty string",
  "email": "email or empty string",
  "skills": ["skill1", "skill2"],
  "experienceYears": 0,
  "preferredLocations": ["city1"],
  "preferredRoles": ["role1"]
}

Rules:
- skills should be real technologies/tools only
- experienceYears is total professional years as a number (0 if fresher/student)
- preferredRoles are job titles the person seeks or recently held
- preferredLocations are cities/regions mentioned
- do not invent fake companies or skills not in the text`;

  const result = await generateJson(prompt, { temperature: 0.1, maxOutputTokens: 800 });
  if (!result.ok) {
    return { ...local, aiUsed: false, aiError: result.reason };
  }
  return mergeProfile(local, result.json);
}

/**
 * Short reason why a job matches a user profile.
 */
async function explainJobMatch(user, job) {
  if (!isGeminiConfigured()) return null;

  const prompt = `Explain in one short sentence why this job matches the candidate.
Candidate skills: ${(user.skills || []).join(", ") || "none"}
Preferred locations: ${(user.preferredLocations || []).join(", ") || "any"}
Preferred roles: ${(user.preferredRoles || []).join(", ") || "any"}
Experience: ${user.experienceYears || 0} years

Job: ${job.title} at ${job.company}
Location: ${job.location}
Skills: ${(job.skills || []).join(", ") || "not listed"}
Type: ${job.employmentType || "full-time"}

Reply with only the sentence, max 25 words.`;

  const result = await generateText(prompt, { temperature: 0.3, maxOutputTokens: 80 });
  if (!result.ok) return null;
  return result.text.replace(/^["']|["']$/g, "").trim();
}

/**
 * Add AI match reasons to the top N ranked jobs.
 */
async function attachMatchReasons(user, rankedJobs = [], limit = 5) {
  if (!isGeminiConfigured() || !rankedJobs.length) {
    return rankedJobs.map((job) => ({ ...job, matchReason: null, aiUsed: false }));
  }

  const top = rankedJobs.slice(0, limit);
  const rest = rankedJobs.slice(limit);
  const reasons = await Promise.all(top.map((job) => explainJobMatch(user, job)));
  const enriched = top.map((job, i) => ({
    ...job,
    matchReason: reasons[i],
    aiUsed: Boolean(reasons[i]),
  }));

  return [...enriched, ...rest.map((job) => ({ ...job, matchReason: null, aiUsed: false }))];
}

module.exports = {
  parseResumeSmart,
  explainJobMatch,
  attachMatchReasons,
};
