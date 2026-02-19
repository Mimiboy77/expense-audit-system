const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  // Employee who submitted the expense
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // Department the expense belongs to
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: true
  },

  amount: { type: Number, required: true },
  category: { type: String, required: true, trim: true },

  // File path saved by multer after upload
  receipt: { type: String, default: null },

  // Tracks where the expense is in the workflow
  status: {
    type: String,
    enum: ["submitted", "approved", "rejected", "paid"],
    default: "submitted"
  },

  month: { type: Number, required: true },  // Month of the expense
  year: { type: Number, required: true }    // Year of the expense
}, { timestamps: true });

module.exports = mongoose.model("Expense", expenseSchema);