require("dotenv").config();
const mongoose = require("mongoose");
const Department = require("./models/Department");
const Budget = require("./models/Budget");
const connectDB = require("./config/db");

const departments = [
  { name: "Engineering", budget: 500000 },
  { name: "Finance", budget: 300000 },
  { name: "Human Resources", budget: 200000 },
  { name: "Marketing", budget: 250000 },
  { name: "Operations", budget: 400000 }
];

const seedDepartments = async () => {
  try {
    await connectDB();

    // Clear existing departments and budgets
    await Department.deleteMany();
    await Budget.deleteMany();

    // Insert fresh departments
    const created = await Department.insertMany(departments);

    // Create a budget for each department for the current month
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    for (const dept of created) {
      await Budget.create({
        departmentId: dept._id,
        month,
        year,
        amount: dept.budget
      });
    }

    console.log("Departments and budgets seeded successfully");
    console.log("--- Copy one of these Department IDs into your register form ---");

    // Print each department with its ID so you can copy it
    created.forEach(dept => {
      console.log(`${dept.name}: ${dept._id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
};

seedDepartments();