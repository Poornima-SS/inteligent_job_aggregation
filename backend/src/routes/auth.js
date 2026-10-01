const express = require("express");
const multer = require("multer");
const { register, login, me, parseResumeUpload } = require("../controllers/authController");
const { authRequired } = require("../middleware/auth");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/register", register);
router.post("/login", login);
router.post("/parse-resume", (req, res, next) => {
  upload.single("resume")(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || "Upload failed" });
    return next();
  });
}, parseResumeUpload);
router.get("/me", authRequired, me);

module.exports = router;
