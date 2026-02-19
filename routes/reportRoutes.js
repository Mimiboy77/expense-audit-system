const express = require("express");
const router = express.Router();

// Controller function
const { generateReport } = require("../controllers/reportController");

// Middleware
const { protect } = require("../middlewares/auth");
const { restrictTo } = require("../middlewares/role");

// GET /reports — renders form if no query params
// GET /reports?month=1&year=2025 — triggers CSV download
router.get(
  "/",
  protect,
  restrictTo("finance"),
  generateReport
);

module.exports = router;