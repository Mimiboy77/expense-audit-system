const express = require("express");
const router = express.Router();
const {
  getReports,
  generateCSV,
  generatePDF
} = require("../controllers/reportController");
const { protect } = require("../middlewares/auth");
const { restrictTo } = require("../middlewares/role");

// GET /reports — render reports page
router.get("/", protect, restrictTo("finance"), getReports);

// GET /reports/csv — download CSV file
router.get("/csv", protect, restrictTo("finance"), generateCSV);

// GET /reports/pdf — download PDF file
router.get("/pdf", protect, restrictTo("finance"), generatePDF);

module.exports = router;