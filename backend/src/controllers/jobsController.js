const { Job } = require("../models");
const { isDBConnected } = require("../config/db");

async function listJobs(req, res) {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({ message: "Database not connected" });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const filter = { isActive: true };

    if (req.query.q) {
      filter.$text = { $search: req.query.q };
    }
    if (req.query.location) {
      filter.location = new RegExp(req.query.location, "i");
    }
    if (req.query.source) {
      filter.source = req.query.source;
    }
    if (req.query.skills) {
      const skills = String(req.query.skills)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (skills.length) {
        filter.skills = { $in: skills.map((s) => new RegExp(`^${s}$`, "i")) };
      }
    }

    const [jobs, total] = await Promise.all([
      Job.find(filter).sort({ postedAt: -1, createdAt: -1 }).skip(skip).limit(limit),
      Job.countDocuments(filter),
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      jobs,
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
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch job", error: err.message });
  }
}

async function getJobStats(req, res) {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({ message: "Database not connected" });
    }

    const [total, active, bySource] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ isActive: true }),
      Job.aggregate([{ $group: { _id: "$source", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    ]);

    res.json({ total, active, bySource });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats", error: err.message });
  }
}

module.exports = { listJobs, getJobById, getJobStats };
