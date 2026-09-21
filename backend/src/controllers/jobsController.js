const { Job } = require("../models");
const { isDBConnected } = require("../config/db");

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildJobFilter(query) {
  const filter = { isActive: true };

  if (query.q) {
    filter.$text = { $search: String(query.q).trim() };
  }
  if (query.location) {
    filter.location = new RegExp(escapeRegex(query.location.trim()), "i");
  }
  if (query.source) {
    filter.source = String(query.source).trim();
  }
  if (query.employmentType) {
    filter.employmentType = String(query.employmentType).trim();
  }
  if (query.skills) {
    const skills = String(query.skills)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (skills.length) {
      filter.skills = {
        $in: skills.map((s) => new RegExp(`^${escapeRegex(s)}$`, "i")),
      };
    }
  }

  const experienceMax = query.experienceMax !== undefined ? Number(query.experienceMax) : null;
  if (experienceMax !== null && !Number.isNaN(experienceMax)) {
    // jobs that accept someone with this experience (experienceMin <= user years)
    filter.experienceMin = { $lte: experienceMax };
  }

  const experienceMin = query.experienceMin !== undefined ? Number(query.experienceMin) : null;
  if (experienceMin !== null && !Number.isNaN(experienceMin)) {
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [{ experienceMax: null }, { experienceMax: { $gte: experienceMin } }],
    });
  }

  const salaryMin = query.salaryMin !== undefined ? Number(query.salaryMin) : null;
  if (salaryMin !== null && !Number.isNaN(salaryMin)) {
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [{ salaryMax: null }, { salaryMax: { $gte: salaryMin } }],
    });
  }

  const salaryMax = query.salaryMax !== undefined ? Number(query.salaryMax) : null;
  if (salaryMax !== null && !Number.isNaN(salaryMax)) {
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [{ salaryMin: null }, { salaryMin: { $lte: salaryMax } }],
    });
  }

  return filter;
}

function buildSort(query) {
  const sortKey = String(query.sort || "newest").toLowerCase();
  switch (sortKey) {
    case "oldest":
      return { postedAt: 1, createdAt: 1 };
    case "salary_high":
      return { salaryMax: -1, postedAt: -1 };
    case "salary_low":
      return { salaryMin: 1, postedAt: -1 };
    case "title":
      return { title: 1 };
    case "newest":
    default:
      return { postedAt: -1, createdAt: -1 };
  }
}

function withSavedFlag(job, savedSet) {
  const obj = job.toObject ? job.toObject() : { ...job };
  obj.isSaved = savedSet.has(String(obj._id));
  return obj;
}

async function listJobs(req, res) {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({ message: "Database not connected" });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const filter = buildJobFilter(req.query);
    const sort = buildSort(req.query);

    const savedSet = new Set(
      (req.user?.savedJobs || []).map((id) => String(id))
    );

    const [jobs, total] = await Promise.all([
      Job.find(filter).sort(sort).skip(skip).limit(limit),
      Job.countDocuments(filter),
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      filters: {
        q: req.query.q || "",
        location: req.query.location || "",
        skills: req.query.skills || "",
        source: req.query.source || "",
        employmentType: req.query.employmentType || "",
        experienceMin: req.query.experienceMin || "",
        experienceMax: req.query.experienceMax || "",
        salaryMin: req.query.salaryMin || "",
        salaryMax: req.query.salaryMax || "",
        sort: req.query.sort || "newest",
      },
      jobs: jobs.map((job) => withSavedFlag(job, savedSet)),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch jobs", error: err.message });
  }
}

async function getJobById(req, res) {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({ message: "Database not connected" });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const savedSet = new Set((req.user?.savedJobs || []).map((id) => String(id)));
    res.json(withSavedFlag(job, savedSet));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch job", error: err.message });
  }
}

async function getJobStats(req, res) {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({ message: "Database not connected" });
    }

    const [total, active, bySource, byType] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ isActive: true }),
      Job.aggregate([{ $group: { _id: "$source", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Job.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$employmentType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json({ total, active, bySource, byType });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats", error: err.message });
  }
}

async function saveJob(req, res) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job || !job.isActive) {
      return res.status(404).json({ message: "Job not found" });
    }

    const id = job._id;
    const already = req.user.savedJobs.some((j) => String(j) === String(id));
    if (!already) {
      req.user.savedJobs.push(id);
      await req.user.save();
    }

    res.json({
      message: already ? "Job already saved" : "Job saved",
      saved: true,
      savedCount: req.user.savedJobs.length,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to save job", error: err.message });
  }
}

async function unsaveJob(req, res) {
  try {
    const before = req.user.savedJobs.length;
    req.user.savedJobs = req.user.savedJobs.filter(
      (j) => String(j) !== String(req.params.id)
    );
    if (req.user.savedJobs.length !== before) {
      await req.user.save();
    }

    res.json({
      message: "Job removed from saved",
      saved: false,
      savedCount: req.user.savedJobs.length,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to unsave job", error: err.message });
  }
}

async function getSavedJobs(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const ids = req.user.savedJobs || [];

    const [jobs, total] = await Promise.all([
      Job.find({ _id: { $in: ids }, isActive: true })
        .sort({ postedAt: -1 })
        .skip(skip)
        .limit(limit),
      Job.countDocuments({ _id: { $in: ids }, isActive: true }),
    ]);

    const savedSet = new Set(ids.map((id) => String(id)));
    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      jobs: jobs.map((job) => withSavedFlag(job, savedSet)),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch saved jobs", error: err.message });
  }
}

module.exports = {
  listJobs,
  getJobById,
  getJobStats,
  saveJob,
  unsaveJob,
  getSavedJobs,
};
