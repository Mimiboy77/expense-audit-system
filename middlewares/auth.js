const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Runs before any protected route handler
const protect = async (req, res, next) => {
  try {
    // Read token from the HttpOnly cookie set during login
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).render("auth/login", {
        error: "You must be logged in to access this page"
      });
    }

    // Verify the token is valid and not expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the full user object to the request for controllers to use
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).render("auth/login", {
        error: "User no longer exists"
      });
    }

    next(); // User is valid — move to the next middleware or controller
  } catch (error) {
    return res.status(401).render("auth/login", {
      error: "Session expired, please log in again"
    });
  }
};

module.exports = { protect };