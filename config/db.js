// Brings in mongoose to talk to MongoDB
const mongoose = require("mongoose");

// Connects to the database using the URI from .env
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1); // Stops the app if DB fails
  }
};

module.exports = connectDB;