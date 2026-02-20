const mongoose = require("mongoose");
const Expense = require("../models/Expense");
const AuditLog = require("../models/AuditLog");
const Budget = require("../models/Budget");
const Comment = require("../models/Comment");
const Approval = require("../models/Approval");
const User = require("../models/User");
const { sendMail } = require("../utils/mailer");

// POST /expenses — employee submits a new expense
const createExpense = async (req, res, next) => {
  try {
    const { amount, category, month, year } = req.body;

    // Safely extract department ObjectId whether it is
    // a plain ObjectId or a populated object
    const departmentId = req.user.department._id
      ? req.user.department._id
      : req.user.department;

    // Convert to proper Mongoose ObjectId for reliable querying
    const deptObjectId = new mongoose.Types.ObjectId(departmentId);

    // Check budget exists for this department this month
    const budget = await Budget.findOne({
      departmentId: deptObjectId,
      month: Number(month),
      year: Number(year)
    });

    // If no budget exists still allow submission
    // but warn the user — do not block them entirely
    if (!budget) {
      console.log(
        `No budget found for department ${departmentId} — ${month}/${year}`
      );
    }

    // Calculate total already approved or paid this month
    const spent = await Expense.aggregate([
      {
        $match: {
          departmentId: deptObjectId,
          month: Number(month),
          year: Number(year),
          status: { $in: ["approved", "paid"] }
        }
      },
      {
        $group: { _id: null, total: { $sum: "$amount" } }
      }
    ]);

    const totalSpent = spent[0]?.total || 0;

    // Only block if a budget exists AND this expense exceeds it
    if (budget && totalSpent + Number(amount) > budget.amount) {
      return res.status(400).render("expenses/submit-expense", {
        error: `This expense of ₦${Number(amount).toLocaleString()} exceeds your department budget. Total spent this month: ₦${totalSpent.toLocaleString()} of ₦${budget.amount.toLocaleString()}`,
        user: req.user
      });
    }

    // Save receipt URL from Cloudinary or null if no file
    const receipt = req.file ? req.file.path : null;

    // Create the expense
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

    // Notify ALL managers in this department
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

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpenseStatus
};