const express = require("express");
const router = express.Router();
const Department = require("../models/Department");
const {
  register,
  login,
  logout,
  getProfile,
  updateProfile
} = require("../controllers/authController");
const { protect } = require("../middlewares/auth");

// Render login page
router.get("/login", (req, res) => {
  res.render("auth/login", { error: null });
});

// Render register page with departments loaded from database
router.get("/register", async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.render("auth/register", { error: null, departments });
  } catch (error) {
    res.render("auth/register", {
      error: "Could not load departments. Please try again.",
      departments: []
    });
  }
});


// Handle registration form submission
router.post("/register", async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    const { name, email, password, role, department } = req.body;

    // Import User here to check for existing email
    const User = require("../models/User");

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).render("auth/register", {
        error: "Email already registered. Please use a different email.",
        departments
      });
    }

    // Create the new user
    await User.create({ name, email, password, role, department });

    // Redirect to login after successful registration
    res.redirect("/login");
  } catch (error) {
    // If something goes wrong reload the form with departments still visible
    try {
      const departments = await Department.find().sort({ name: 1 });
      res.status(500).render("auth/register", {
        error: "Registration failed. Please try again.",
        departments
      });
    } catch {
      next(error);
    }
  }
});

// Handle login form submission
router.post("/login", login);

// Clear cookie and redirect to login
router.get("/logout", logout);

// Profile routes — any logged in user
router.get("/profile", protect, getProfile);
router.post("/profile", protect, updateProfile);

module.exports = router;