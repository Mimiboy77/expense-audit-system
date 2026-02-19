const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  // The expense this log entry is about
  expenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Expense",
    required: true
  },

  // Who performed the action (employee, manager, or finance)
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // What happened to the expense
  action: {
    type: String,
    enum: ["created", "updated", "approved", "rejected", "paid"],
    required: true
  },

  timestamp: { type: Date, default: Date.now }
});

// Prevent any modification to audit logs after creation
auditLogSchema.set("strict", true);

module.exports = mongoose.model("AuditLog", auditLogSchema);