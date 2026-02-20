const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Signs a JWT and sends it as an HttpOnly cookie
const sendTokenCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

// POST /login — verifies credentials and sets JWT cookie
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).render("auth/login", {
        error: "Invalid email or password"
      });
    }

    // Compare password using model method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).render("auth/login", {
        error: "Invalid email or password"
      });
    }

    // Set JWT cookie and redirect to dashboard
    sendTokenCookie(res, user._id);
    res.redirect("/dashboard");
  } catch (error) {
    next(error);
  }
};

// GET /logout — clears JWT cookie
const logout = (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
};

// GET /profile — render profile edit form
const getProfile = async (req, res, next) => {
  try {
    res.render("profile", {
      user: req.user,
      success: null,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

// POST /profile — update name email or password
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const user = await User.findById(req.user._id);

    // Update name if provided
    if (name) user.name = name;

    // Update email only if it changed and is not taken
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.render("profile", {
          user: req.user,
          success: null,
          error: "That email is already in use by another account"
        });
      }
      user.email = email;
    }

    // Update password only if a new one was entered
    if (password && password.trim() !== "") {
      user.password = password; // pre-save hook hashes it automatically
    }

    await user.save();

    res.render("profile", {
      user,
      success: "Profile updated successfully",
      error: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout,
  getProfile,
  updateProfile
};
