const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Notification = require("../models/Notification");

const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).render("auth/login", {
        error: "You must be logged in to access this page"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).render("auth/login", {
        error: "User no longer exists"
      });
    }

    // Attach unread notification count to every request
    // so the navbar can show the badge on every page
    req.user.unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false
    });

    next();
  } catch (error) {
    return res.status(401).render("auth/login", {
      error: "Session expired please log in again"
    });
  }
};

module.exports = { protect };