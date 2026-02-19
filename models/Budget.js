const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema({
  // Which department this budget belongs to
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: true
  },

  month: { type: Number, required: true },  // 1 = January, 12 = December
  year: { type: Number, required: true },
  amount: { type: Number, required: true }  // Budget limit for this period
}, { timestamps: true });

module.exports = mongoose.model("Budget", budgetSchema);