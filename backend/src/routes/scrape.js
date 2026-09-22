const express = require("express");
const { getSources, runScrape, getLogs } = require("../controllers/scrapeController");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.get("/sources", authRequired, getSources);
router.get("/logs", authRequired, getLogs);
router.post("/run", authRequired, runScrape);

module.exports = router;
