const express = require("express");
const {
  getSources,
  runScrape,
  getLogs,
  getSchedule,
  runScheduleNow,
} = require("../controllers/scrapeController");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.get("/sources", authRequired, getSources);
router.get("/logs", authRequired, getLogs);
router.get("/schedule", authRequired, getSchedule);
router.post("/schedule/run-now", authRequired, runScheduleNow);
router.post("/run", authRequired, runScrape);

module.exports = router;
