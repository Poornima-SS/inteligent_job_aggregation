const { Job } = require("../models");
const { buildContentHash, normalizeText } = require("../utils/hash");

function similarity(a, b) {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  const longer = left.length >= right.length ? left : right;
  const shorter = left.length >= right.length ? right : left;
  if (longer.includes(shorter) && shorter.length >= 6) return 0.9;
  let matches = 0;
  const parts = shorter.split(" ");
  for (const p of parts) {
    if (p.length > 2 && longer.includes(p)) matches += 1;
  }
  return parts.length ? matches / parts.length : 0;
}

function isNearDuplicate(a, b) {
  const titleScore = similarity(a.title, b.title);
  const companyScore = similarity(a.company, b.company);
  const locationScore = similarity(a.location, b.location);
  return titleScore >= 0.85 && companyScore >= 0.8 && locationScore >= 0.7;
}

/**
 * Upsert cleaned jobs using contentHash; skip near-duplicates in the same batch.
 */
async function upsertJobs(cleanedJobs = []) {
  let saved = 0;
  let skippedDuplicates = 0;
  const accepted = [];

  for (const job of cleanedJobs) {
    if (!job.title || !job.company) {
      skippedDuplicates += 1;
      continue;
    }

    const contentHash = buildContentHash(job);
    const candidate = { ...job, contentHash };

    const near = accepted.find((item) => isNearDuplicate(item, candidate));
    if (near) {
      skippedDuplicates += 1;
      continue;
    }

    const existing = await Job.findOne({ contentHash });
    if (existing) {
      await Job.updateOne(
        { _id: existing._id },
        {
          $set: {
            ...candidate,
            createdAt: existing.createdAt,
          },
        }
      );
      saved += 1;
      accepted.push(candidate);
      continue;
    }

    // Also skip if same sourceUrl already stored from another hash edge-case
    if (candidate.sourceUrl) {
      const byUrl = await Job.findOne({ source: candidate.source, sourceUrl: candidate.sourceUrl });
      if (byUrl) {
        await Job.updateOne({ _id: byUrl._id }, { $set: candidate });
        saved += 1;
        accepted.push(candidate);
        skippedDuplicates += 1;
        continue;
      }
    }

    await Job.create(candidate);
    saved += 1;
    accepted.push(candidate);
  }

  return { saved, skippedDuplicates, acceptedCount: accepted.length };
}

module.exports = { upsertJobs, isNearDuplicate, similarity };
