const express = require("express");
const { updateMe } = require("../controllers/usersController");
const { authRequired } = require("../middleware/auth");
const { me } = require("../controllers/authController");

const router = express.Router();

router.get("/me", authRequired, me);
router.put("/me", authRequired, updateMe);

module.exports = router;
