const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },

  // Role controls what the user can see and do
  role: {
    type: String,
    enum: ["employee", "manager", "finance"],
    default: "employee"
  },

  // Links user to a department
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: true
  }
}, { timestamps: true });

// Hash password before saving — runs only if password was changed
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compares plain password with hashed one during login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);