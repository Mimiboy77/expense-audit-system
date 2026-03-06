const mongoose = require("mongoose");
const Expense = require("../models/Expense");
const AuditLog = require("../models/AuditLog");
const Budget = require("../models/Budget");
const Comment = require("../models/Comment");
const Approval = require("../models/Approval");
const Department = require("../models/Department");
const User = require("../models/User");
const { sendMail } = require("../utils/mailer");
const logger = require("../utils/logger");
const Notification = require("../models/Notification");

// POST /expenses — employee submits a new expense
const createExpense = async (req, res, next) => {
  try {
    const { amount, category, month, year } = req.body;

    // Confirm department exists on the user object
    if (!req.user.department) {
      return res.status(400).render("expenses/submit-expense", {
        error: "Your account has no department assigned. Contact your admin.",
        user: req.user,
        budgetAmount: 0,
        totalSpent: 0,
        remaining: 0
      });
    }

    // Safely extract department ObjectId
    const departmentId = req.user.department._id
      ? req.user.department._id
      : req.user.department;

    const deptObjectId = new mongoose.Types.ObjectId(departmentId);

    // Check budget exists for this department this month
    const budget = await Budget.findOne({
      departmentId: deptObjectId,
      month: Number(month),
      year: Number(year)
    });

    // Calculate total already spent this month
    const spent = await Expense.aggregate([
      {
        $match: {
          departmentId: deptObjectId,
          month: Number(month),
          year: Number(year),
          status: { $in: ["approved", "paid"] }
        }
      },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const totalSpent = spent[0]?.total || 0;

    // Block if expense would exceed budget
    if (budget && totalSpent + Number(amount) > budget.amount) {
      return res.status(400).render("expenses/submit-expense", {
        error: `This expense of ₦${Number(amount).toLocaleString()} exceeds your department budget. Total spent: ₦${totalSpent.toLocaleString()} of ₦${budget.amount.toLocaleString()}`,
        user: req.user,
        budgetAmount: budget.amount,
        totalSpent,
        remaining: budget.amount - totalSpent
      });
    }

    // Save receipt URL from Cloudinary or null
    const receipt = req.file ? req.file.path : null;

    // Create the expense record first — this must always succeed
    const expense = await Expense.create({
      userId: req.user._id,
      departmentId: deptObjectId,
      amount: Number(amount),
      category,
      receipt,
      month: Number(month),
      year: Number(year)
    });

    // Write audit log
    await AuditLog.create({
      expenseId: expense._id,
      performedBy: req.user._id,
      action: "created"
    });
    // Notify all managers in the department
const managers = await User.find({
  department: deptObjectId,
  role: "manager"
});

for (const manager of managers) {
  await Notification.create({
    userId: manager._id,
    expenseId: expense._id,
    message: `New expense of ₦${Number(amount).toLocaleString()} submitted by ${req.user.name} requires your approval`,
    type: "submitted"
  });
}

    // Send email notifications asynchronously
    // This runs AFTER the response so it never blocks submission
    setImmediate(async () => {
      try {
        const managers = await User.find({
          department: deptObjectId,
          role: "manager"
        });

        for (const manager of managers) {
          await sendMail(
            manager.email,
            "New Expense Submitted for Approval",
            `<p>Hi ${manager.name},</p>
             <p>A new expense of <strong>₦${Number(amount).toLocaleString()}</strong>
             in the <strong>${category}</strong> category
             has been submitted and requires your approval.</p>
             <p>Please log in to review it.</p>`
          );
        }
      } catch (emailError) {
        logger.error(`Expense email failed: ${emailError.message}`);
      }
    });

    // Redirect immediately — do not wait for email
    res.redirect("/expenses");
  } catch (error) {
    next(error);
  }
};

// GET /expenses — returns all expenses for logged-in user
const getExpenses = async (req, res, next) => {
  try {
    const expenses = await Expense.find({ userId: req.user._id })
      .populate("departmentId", "name")
      .sort({ createdAt: -1 });

    res.render("expenses/expenses", { expenses, user: req.user });
  } catch (error) {
    next(error);
  }
};

// GET /expenses/:id — single expense with comments and approvals
// GET /expenses/:id — single expense with comments and approvals
const getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate("userId", "name email")
      .populate("departmentId", "name budget"); // Added budget to populate

    if (!expense) {
      return res.status(404).render("error", {
        message: "Expense not found",
        statusCode: 404
      });
    }

    // Debug — temporarily log what department looks like
    console.log("Expense department:", expense.departmentId);

    const comments = await Comment.find({ expenseId: expense._id })
      .populate("userId", "name role");

    const approvals = await Approval.find({ expenseId: expense._id })
      .populate("approverId", "name role");

    res.render("expenses/expense", {
      expense,
      comments,
      approvals,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

// PUT /expenses/:id — manager or finance updates expense status
const updateExpenseStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).render("error", {
        message: "Expense not found",
        statusCode: 404
      });
    }

    expense.status = status;
    await expense.save();

    await AuditLog.create({
      expenseId: expense._id,
      performedBy: req.user._id,
      action: status
    });

    res.redirect(`/expenses/${expense._id}`);
  } catch (error) {
    next(error);
  }
};
// GET /expenses/history — full expense history with filters
const getExpenseHistory = async (req, res, next) => {
  try {
    const { month, year, status, category, department } = req.query;

    // Build filter object based on role and query params
    let filter = {};

    // Employee only sees their own expenses
    if (req.user.role === "employee") {
      filter.userId = req.user._id;
    }

    // Manager only sees their department expenses
    if (req.user.role === "manager") {
      const managerDept = req.user.department._id
        ? req.user.department._id
        : req.user.department;
      filter.departmentId = managerDept;
    }

    // Finance sees all expenses — no department filter

    // Apply optional filters from query string
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);
    if (status) filter.status = status;
    if (category) filter.category = new RegExp(category, "i");
    if (department && req.user.role === "finance") {
      filter.departmentId = department;
    }

    // Pagination setup
    const page = Number(req.query.page) || 1;
    const limit = 10; // 10 expenses per page
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalExpenses = await Expense.countDocuments(filter);
    const totalPages = Math.ceil(totalExpenses / limit);

    // Fetch expenses with pagination
    const expenses = await Expense.find(filter)
      .populate("userId", "name email")
      .populate("departmentId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Fetch departments for filter dropdown — finance only
    const departments = req.user.role === "finance"
      ? await Department.find().sort({ name: 1 })
      : [];

    res.render("expenses/expense-history", {
      expenses,
      departments,
      filters: { month, year, status, category, department },
      pagination: {
        page,
        totalPages,
        totalExpenses,
        limit
      },
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpenseStatus,
  getExpenseHistory
};