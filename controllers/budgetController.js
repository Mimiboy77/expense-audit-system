const Budget = require("../models/Budget");
const Expense = require("../models/Expense");
const Department = require("../models/Department");
const mongoose = require("mongoose");

// GET /budget — manager sees their department budget
// Finance sees all departments
const getDepartmentBudget = async (req, res, next) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Finance sees all departments — manager sees only theirs
    if (req.user.role === "finance") {
      const departments = await Department.find().sort({ name: 1 });

      // Build a summary for every department
      const summaries = await Promise.all(
        departments.map(async (dept) => {
          const budget = await Budget.findOne({
            departmentId: dept._id,
            month,
            year
          });

          const spent = await Expense.aggregate([
            {
              $match: {
                departmentId: new mongoose.Types.ObjectId(dept._id),
                month,
                year,
                status: { $in: ["approved", "paid"] }
              }
            },
            { $group: { _id: null, total: { $sum: "$amount" } } }
          ]);

          const totalSpent = spent[0]?.total || 0;
          const budgetAmount = budget ? budget.amount : 0;
          const remaining = budgetAmount - totalSpent;
          const percentageUsed = budgetAmount > 0
            ? Math.min(Math.round((totalSpent / budgetAmount) * 100), 100)
            : 0;

          return {
            department: dept,
            budget,
            budgetAmount,
            totalSpent,
            remaining,
            percentageUsed,
            exceeded: remaining < 0
          };
        })
      );

      return res.render("budget/department-budget", {
        role: "finance",
        summaries,
        month,
        year,
        user: req.user
      });
    }

    // Manager flow — only their department
    const departmentId = req.user.department._id
      ? req.user.department._id
      : req.user.department;

    const department = await Department.findById(departmentId);

    if (!department) {
      return res.render("budget/department-budget", {
        role: "manager",
        budget: null,
        expenses: [],
        totalSpent: 0,
        totalPending: 0,
        remaining: 0,
        percentageUsed: 0,
        budgetAmount: 0,
        month,
        year,
        user: req.user,
        departmentName: "Unknown",
        budgetError: "Your account is not linked to a valid department."
      });
    }

    const deptObjectId = new mongoose.Types.ObjectId(departmentId);

    const budget = await Budget.findOne({
      departmentId: deptObjectId,
      month,
      year
    });

    const expenses = await Expense.find({
      departmentId: deptObjectId,
      month,
      year
    })
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    const approvedExpenses = expenses.filter(
      e => e.status === "approved" || e.status === "paid"
    );

    const totalSpent = approvedExpenses.reduce(
      (sum, e) => sum + e.amount, 0
    );

    const pendingExpenses = expenses.filter(
      e => e.status === "submitted"
    );

    const totalPending = pendingExpenses.reduce(
      (sum, e) => sum + e.amount, 0
    );

    const budgetAmount = budget ? budget.amount : 0;
    const remaining = budgetAmount - totalSpent;
    const percentageUsed = budgetAmount > 0
      ? Math.min(Math.round((totalSpent / budgetAmount) * 100), 100)
      : 0;

    res.render("budget/department-budget", {
      role: "manager",
      budget,
      expenses,
      totalSpent,
      totalPending,
      remaining,
      percentageUsed,
      budgetAmount,
      month,
      year,
      user: req.user,
      departmentName: department.name,
      budgetError: !budget
        ? `No budget set for ${department.name} this month.`
        : null
    });
  } catch (error) {
    next(error);
  }
};

// GET /budget/edit/:departmentId — finance opens edit form
const getEditBudget = async (req, res, next) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const department = await Department.findById(req.params.departmentId);
    if (!department) {
      return res.status(404).render("error", {
        message: "Department not found",
        statusCode: 404
      });
    }

    // Find existing budget for this month
    const budget = await Budget.findOne({
      departmentId: department._id,
      month,
      year
    });

    res.render("budget/edit-budget", {
      department,
      budget,
      month,
      year,
      user: req.user,
      error: null,
      success: null
    });
  } catch (error) {
    next(error);
  }
};

// POST /budget/edit/:departmentId — finance saves updated budget
const updateBudget = async (req, res, next) => {
  try {
    const { amount, month, year } = req.body;
    const { departmentId } = req.params;

    if (!amount || Number(amount) <= 0) {
      const department = await Department.findById(departmentId);
      const budget = await Budget.findOne({ departmentId, month, year });
      return res.render("budget/edit-budget", {
        department,
        budget,
        month,
        year,
        user: req.user,
        error: "Please enter a valid budget amount greater than zero",
        success: null
      });
    }

    // Update existing budget or create one if it does not exist
    const budget = await Budget.findOneAndUpdate(
      {
        departmentId,
        month: Number(month),
        year: Number(year)
      },
      { amount: Number(amount) },
      {
        new: true,        // Return the updated document
        upsert: true      // Create it if it does not exist
      }
    );

    // Also update the default budget on the Department model
    // so cron job uses correct amount next month
    await Department.findByIdAndUpdate(departmentId, {
      budget: Number(amount)
    });

    const department = await Department.findById(departmentId);

    res.render("budget/edit-budget", {
      department,
      budget,
      month: Number(month),
      year: Number(year),
      user: req.user,
      error: null,
      success: `Budget for ${department.name} updated to ₦${Number(amount).toLocaleString()} successfully`
    });
  } catch (error) {
    next(error);
  }
};

// POST /budget/reset — finance manually resets all budgets for a new month
const resetBudgets = async (req, res, next) => {
  try {
    const { month, year } = req.body;

    const departments = await Department.find();

    let created = 0;
    let skipped = 0;

    for (const dept of departments) {
      // Check if budget already exists for this period
      const existing = await Budget.findOne({
        departmentId: dept._id,
        month: Number(month),
        year: Number(year)
      });

      if (!existing) {
        await Budget.create({
          departmentId: dept._id,
          month: Number(month),
          year: Number(year),
          amount: dept.budget
        });
        created++;
      } else {
        skipped++;
      }
    }

    res.redirect(
      `/budget?success=Budgets reset for ${month}/${year}. Created: ${created} Skipped: ${skipped}`
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartmentBudget,
  getEditBudget,
  updateBudget,
  resetBudgets
};