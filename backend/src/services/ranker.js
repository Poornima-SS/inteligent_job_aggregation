const { normalizeText } = require("../utils/hash");

function tokenizeSkills(list = []) {
  return (list || [])
    .map((s) => normalizeText(String(s)))
    .filter(Boolean);
}

function skillOverlapScore(userSkills, jobSkills) {
  const user = new Set(tokenizeSkills(userSkills));
  const job = tokenizeSkills(jobSkills);
  if (!user.size || !job.length) return 0;

  let matched = 0;
  for (const skill of job) {
    if (user.has(skill)) {
      matched += 1;
      continue;
    }
    // partial token match (e.g. "node" vs "node.js")
    for (const u of user) {
      if (skill.includes(u) || u.includes(skill)) {
        matched += 0.6;
        break;
      }
    }
  }
  return Math.min(100, Math.round((matched / job.length) * 100));
}

function locationScore(preferredLocations = [], jobLocation = "") {
  if (!preferredLocations?.length) return 40;
  const job = normalizeText(jobLocation);
  for (const loc of preferredLocations) {
    const p = normalizeText(loc);
    if (!p) continue;
    if (job.includes(p) || p.includes(job)) return 100;
    if (p === "remote" && job.includes("remote")) return 100;
  }
  return 0;
}

function roleScore(preferredRoles = [], jobTitle = "") {
  if (!preferredRoles?.length) return 40;
  const title = normalizeText(jobTitle);
  for (const role of preferredRoles) {
    const r = normalizeText(role);
    if (!r) continue;
    if (title.includes(r) || r.includes(title)) return 100;
  }
  return 10;
}

function experienceScore(userYears = 0, expMin = 0, expMax = null) {
  const years = Number(userYears) || 0;
  const min = Number(expMin) || 0;
  const max = expMax == null ? null : Number(expMax);

  if (years >= min && (max == null || years <= max + 1)) return 100;
  if (years >= min - 1 && years < min) return 70;
  if (max != null && years > max && years <= max + 2) return 60;
  if (years < min) return Math.max(0, 40 - (min - years) * 10);
  return 35;
}

function recencyScore(postedAt) {
  if (!postedAt) return 40;
  const days = (Date.now() - new Date(postedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 7) return 100;
  if (days <= 30) return 80;
  if (days <= 90) return 55;
  return 30;
}

function scoreJob(user, job) {
  const skills = skillOverlapScore(user.skills, job.skills);
  const location = locationScore(user.preferredLocations, job.location);
  const role = roleScore(user.preferredRoles, job.title);
  const experience = experienceScore(user.experienceYears, job.experienceMin, job.experienceMax);
  const recency = recencyScore(job.postedAt);

  // Weighted total
  const total = Math.round(
    skills * 0.45 + location * 0.2 + role * 0.15 + experience * 0.1 + recency * 0.1
  );

  return {
    score: total,
    breakdown: { skills, location, role, experience, recency },
  };
}

module.exports = {
  scoreJob,
  skillOverlapScore,
  locationScore,
  roleScore,
  experienceScore,
  recencyScore,
};
