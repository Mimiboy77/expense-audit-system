const express = require("express");
const router = express.Router();
const Department = require("../models/Department");

// Pull in the three auth actions from the controller
const { register, login, logout } = require("../controllers/authController");

// --- Page renders (GET) ---

// Render the login form
router.get("/login", (req, res) => {
  res.render("auth/login", { error: null });
});

// Render the registration form
router.get("/register", async (req, res) => {
  try {
    const departments = await Department.find();
    res.render("auth/register", { error: null, departments });
  } catch (error) {
    res.render("auth/register", { error: "Could not load departments", departments: [] });
  }
});

// --- Form submissions (POST) ---

// Handle registration form submission
router.post("/register", register);

// Handle login form submission
router.post("/login", login);

// Clear cookie and redirect to login
router.get("/logout", logout);

module.exports = router;