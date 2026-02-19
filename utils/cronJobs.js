const cron = require("node-cron");
const Budget = require("../models/Budget");
const Department = require("../models/Department");
const Expense = require("../models/Expense");
const User = require("../models/User");
const { sendMail } = require("./mailer");
const logger = require("./logger");

const startCronJobs = () => {

  // --- JOB 1: Monthly budget reset ---
  // Runs at 00:00 on the 1st of every month
  // Creates a new Budget record for every department using their default budget
  cron.schedule("0 0 1 * *", async () => {
    try {
      logger.info("Cron: Monthly budget reset started");

      const now = new Date();
      const month = now.getMonth() + 1; // getMonth() is 0-indexed
      const year = now.getFullYear();

      // Fetch all departments to create budgets for each one
      const departments = await Department.find();

      for (const dept of departments) {
        // Check if a budget already exists for this month to avoid duplicates
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
            amount: dept.budget // Uses the default budget set on the department
          });

          logger.info(
            `Cron: Budget created for department ${dept.name} — ${month}/${year}`
          );
        }
      }

      logger.info("Cron: Monthly budget reset completed");
    } catch (error) {
      logger.error(`Cron: Monthly budget reset failed — ${error.message}`);
    }
  });

  // --- JOB 2: Weekly pending expense reminder ---
  // Runs every Monday at 08:00 AM
  // Finds all expenses still in "submitted" status and emails managers to action them
  cron.schedule("0 8 * * 1", async () => {
    try {
      logger.info("Cron: Weekly pending expense reminder started");

      // Find all expenses that are still waiting for a decision
      const pendingExpenses = await Expense.find({ status: "submitted" })
        .populate("departmentId", "name");

      if (pendingExpenses.length === 0) {
        logger.info("Cron: No pending expenses found — reminder skipped");
        return;
      }

      // Get all managers so we can email each one
      const managers = await User.find({ role: "manager" });

      for (const manager of managers) {
        // Filter pending expenses that belong to this manager's department
        const deptExpenses = pendingExpenses.filter(
          (e) =>
            e.departmentId?._id.toString() === manager.department.toString()
        );

        if (deptExpenses.length === 0) continue; // Skip if no pending for this dept

        await sendMail(
          manager.email,
          "Reminder: Pending Expenses Awaiting Your Approval",
          `<p>Hi ${manager.name},</p>
           <p>You have <strong>${deptExpenses.length}</strong> 
           expense(s) in your department still awaiting approval.</p>
           <p>Please log in to review and action them at your earliest convenience.</p>`
        );

        logger.info(
          `Cron: Reminder sent to manager ${manager.name} for ${deptExpenses.length} pending expense(s)`
        );
      }

      logger.info("Cron: Weekly pending expense reminder completed");
    } catch (error) {
      logger.error(
        `Cron: Weekly pending expense reminder failed — ${error.message}`
      );
    }
  });
};

module.exports = { startCronJobs };