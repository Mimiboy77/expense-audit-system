const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  // The expense this comment is attached to
  expenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Expense",
    required: true
  },

  // The user who wrote the comment
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  text: { type: String, required: true, trim: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Comment", commentSchema);