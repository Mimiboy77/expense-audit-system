const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead
} = require("../controllers/notificationController");
const { protect } = require("../middlewares/auth");

// GET /notifications — view all notifications
router.get("/", protect, getNotifications);

// POST /notifications/read-all — mark all as read
router.post("/read-all", protect, markAllAsRead);

// POST /notifications/read/:id — mark one as read
router.post("/read/:id", protect, markAsRead);

module.exports = router;