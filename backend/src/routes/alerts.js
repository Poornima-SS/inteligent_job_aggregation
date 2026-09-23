const express = require("express");
const { authRequired } = require("../middleware/auth");
const {
  listAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  previewAlert,
  runAlertsNow,
  listNotifications,
  unreadCount,
  markRead,
  markAllRead,
} = require("../controllers/alertsController");

const router = express.Router();

router.use(authRequired);

router.get("/", listAlerts);
router.post("/", createAlert);
router.post("/preview", previewAlert);
router.post("/run-now", runAlertsNow);

router.get("/notifications", listNotifications);
router.get("/notifications/unread-count", unreadCount);
router.post("/notifications/read-all", markAllRead);
router.post("/notifications/:id/read", markRead);

router.put("/:id", updateAlert);
router.delete("/:id", deleteAlert);

module.exports = router;
