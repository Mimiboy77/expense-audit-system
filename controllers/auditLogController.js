const AuditLog = require("../models/AuditLog");

// GET /audit-logs — finance views the full audit trail
const getAuditLogs = async (req, res, next) => {
  try {
    // Optional filter by expenseId from query string e.g. /audit-logs?expenseId=abc
    const filter = req.query.expenseId
      ? { expenseId: req.query.expenseId }
      : {};

    const logs = await AuditLog.find(filter)
      .populate("expenseId", "amount category status") // Show expense summary
      .populate("performedBy", "name role")            // Show who did it
      .sort({ timestamp: -1 });                        // Most recent first

    res.render("audit-logs", { logs, user: req.user });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAuditLogs };