const Notification = require("../models/Notification");

// GET /notifications — show all notifications for logged in user
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      userId: req.user._id
    })
      .populate("expenseId", "amount category status")
      .sort({ createdAt: -1 });

    // Count unread notifications
    const unreadCount = notifications.filter(n => !n.read).length;

    res.render("notifications", {
      notifications,
      unreadCount,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

// POST /notifications/read/:id — mark one notification as read
const markAsRead = async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true }
    );

    res.redirect("/notifications");
  } catch (error) {
    next(error);
  }
};

// POST /notifications/read-all — mark all as read
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true }
    );

    res.redirect("/notifications");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};