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

const seed = async () => {
  try {
    await connectDB();

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    console.log(`Seeding for month: ${month}/${year}`);

    // Check if departments already exist
    const existingDepts = await Department.find();

    let deptList = existingDepts;

    // Only create departments if none exist
    if (existingDepts.length === 0) {
      console.log("No departments found — creating fresh ones");
      await Department.deleteMany();
      await Budget.deleteMany();
      deptList = await Department.insertMany(departments);
      console.log("Departments created");
    } else {
      console.log(`Found ${existingDepts.length} existing departments — keeping them`);
    }

    // Create budgets for current month if they do not exist yet
    for (const dept of deptList) {
      const existing = await Budget.findOne({
        departmentId: dept._id,
        month,
        year
      });

      if (!existing) {
        await Budget.create({
          departmentId: dept._id,
          month,
          year,
          amount: dept.budget
        });
        console.log(
          `Budget created: ${dept.name} — ₦${dept.budget.toLocaleString()} for ${month}/${year}`
        );
      } else {
        console.log(
          `Budget already exists: ${dept.name} for ${month}/${year} — skipped`
        );
      }
    }

    console.log("\n--- Department IDs for registration ---");
    deptList.forEach(dept => {
      console.log(`${dept.name}: ${dept._id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
};

seed();