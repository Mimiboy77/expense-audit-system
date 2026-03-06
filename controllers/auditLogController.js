const AuditLog = require("../models/AuditLog");

// GET /audit-logs — paginated audit trail for finance
const getAuditLogs = async (req, res, next) => {
  try {
    const filter = req.query.expenseId
      ? { expenseId: req.query.expenseId }
      : {};

    // Pagination
    const page = Number(req.query.page) || 1;
    const limit = 15;
    const skip = (page - 1) * limit;

    const totalLogs = await AuditLog.countDocuments(filter);
    const totalPages = Math.ceil(totalLogs / limit);

    const logs = await AuditLog.find(filter)
      .populate("expenseId", "amount category status")
      .populate("performedBy", "name role")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    res.render("audit-logs", {
      logs,
      pagination: { page, totalPages, totalLogs },
      filters: { expenseId: req.query.expenseId || "" },
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAuditLogs };