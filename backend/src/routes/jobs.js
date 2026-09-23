const express = require("express");
const {
  listJobs,
  getJobById,
  getJobStats,
  getRecommendations,
  saveJob,
  unsaveJob,
  getSavedJobs,
} = require("../controllers/jobsController");
const { authRequired, optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", optionalAuth, listJobs);
router.get("/stats", getJobStats);
router.get("/recommendations", authRequired, getRecommendations);
router.get("/saved", authRequired, getSavedJobs);
router.post("/:id/save", authRequired, saveJob);
router.delete("/:id/save", authRequired, unsaveJob);
router.get("/:id", optionalAuth, getJobById);

module.exports = router;
