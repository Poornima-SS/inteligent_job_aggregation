const express = require("express");
const multer = require("multer");
const {
  updateMe,
  extractResumeSkills,
  uploadResume,
} = require("../controllers/usersController");
const { authRequired } = require("../middleware/auth");
const { me } = require("../controllers/authController");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get("/me", authRequired, me);
router.put("/me", authRequired, updateMe);
router.post("/me/extract-skills", authRequired, extractResumeSkills);
router.post("/me/upload-resume", authRequired, (req, res, next) => {
  upload.single("resume")(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || "Upload failed" });
    return next();
  });
}, uploadResume);

module.exports = router;
