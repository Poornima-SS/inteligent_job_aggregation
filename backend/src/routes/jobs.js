const express = require("express");
const { listJobs, getJobById, getJobStats } = require("../controllers/jobsController");

const router = express.Router();

router.get("/", listJobs);
router.get("/stats", getJobStats);
router.get("/:id", getJobById);

module.exports = router;
