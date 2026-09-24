const express = require("express");
const { updateMe, extractResumeSkills } = require("../controllers/usersController");
const { authRequired } = require("../middleware/auth");
const { me } = require("../controllers/authController");

const router = express.Router();

router.get("/me", authRequired, me);
router.put("/me", authRequired, updateMe);
router.post("/me/extract-skills", authRequired, extractResumeSkills);

module.exports = router;
