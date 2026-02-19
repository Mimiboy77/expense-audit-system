const express = require("express");
const router = express.Router();

// Controller function
const { getAuditLogs } = require("../controllers/auditLogController");

// Middleware
const { protect } = require("../middlewares/auth");
const { restrictTo } = require("../middlewares/role");

// GET /audit-logs or /audit-logs?expenseId=abc
// Finance only — full audit trail view
router.get(
  "/",
  protect,
  restrictTo("finance"),
  getAuditLogs
);

module.exports = router;