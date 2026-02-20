require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Department = require("./models/Department");

const fixUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const departments = await Department.find();
    const users = await User.find();

    console.log(`Found ${departments.length} departments and ${users.length} users`);

    for (const user of users) {
      // Check if user department ID matches any existing department
      const validDept = departments.find(
        d => d._id.toString() === user.department?.toString()
      );

      if (!validDept) {
        console.log(`User ${user.name} has invalid department — needs reassignment`);

        // Assign to first department by default
        // You can change this logic as needed
        const defaultDept = departments[0];
        user.department = defaultDept._id;
        await user.save();

        console.log(`Fixed: ${user.name} → assigned to ${defaultDept.name}`);
      } else {
        console.log(`User ${user.name} → ${validDept.name} ✓`);
      }
    }

    console.log("\nAll users fixed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Fix failed:", error.message);
    process.exit(1);
  }
};

fixUsers();