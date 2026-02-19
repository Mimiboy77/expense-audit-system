const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },

  // Default monthly budget ceiling for this department
  budget: { type: Number, required: true, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Department", departmentSchema);