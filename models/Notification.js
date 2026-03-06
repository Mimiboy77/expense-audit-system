const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  // Who this notification belongs to
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // The expense this notification is about
  expenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Expense",
    required: true
  },

  // The message shown to the user
  message: {
    type: String,
    required: true
  },

  // Type helps us color code the notification
  type: {
    type: String,
    enum: ["submitted", "approved", "rejected", "paid", "reminder"],
    required: true
  },

  // Whether the user has read this notification
  read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);