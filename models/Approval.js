const mongoose = require("mongoose");

const approvalSchema = new mongoose.Schema({
  // The expense being approved or rejected
  expenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Expense",
    required: true
  },

  // The manager or finance user making the decision
  approverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // Decision made by the approver
  decision: {
    type: String,
    enum: ["approved", "rejected"],
    required: true
  },

  // Optional comment attached to this approval decision
  comments: { type: String, default: "" }

}, { timestamps: true }); // createdAt serves as the approval timestamp

module.exports = mongoose.model("Approval", approvalSchema);