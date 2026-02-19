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

    // Convert department ObjectId to string safely
    const departmentId = req.user.department._id
      ? req.user.department._id
      : req.user.department;

    // Check if a budget exists for this department this month
    const budget = await Budget.findOne({
      departmentId,
      month: Number(month),
      year: Number(year)
    });

    if (!budget) {
      return res.status(400).render("expenses/submit-expense", {
        error: "No budget set for your department this month",
        user: req.user
      });
    }

    // Calculate total already spent by this department this month
    const spent = await Expense.aggregate([
      {
        $match: {
          departmentId: departmentId,
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

    // Block if this expense would push department over budget
    if (totalSpent + Number(amount) > budget.amount) {
      return res.status(400).render("expenses/submit-expense", {
        error: "This expense exceeds your department budget for this month",
        user: req.user
      });
    }

    // Normalize the path to use forward slashes and remove the public/ prefix
// so it works correctly as a browser URL
const receipt = req.file
  ? req.file.path.replace(/\\/g, "/").replace("public/", "")
  : null;

    // Create the expense record
    const expense = await Expense.create({
      userId: req.user._id,
      departmentId,
      amount: Number(amount),
      category,
      receipt,
      month: Number(month),
      year: Number(year)
    });

    // Write an audit log entry for this creation
    await AuditLog.create({
      expenseId: expense._id,
      performedBy: req.user._id,
      action: "created"
    });

    // Find the manager in the same department and notify them
    const manager = await User.findOne({
      department: departmentId,
      role: "manager"
    });

    if (manager) {
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

// GET /expenses — returns all expenses for the logged-in user
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

// GET /expenses/:id — returns one expense with comments and approvals
const getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate("userId", "name email")
      .populate("departmentId", "name");

    if (!expense) {
      return res.status(404).render("error", {
        message: "Expense not found",
        statusCode: 404
      });
    }

    // Fetch related comments and approvals
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

    // Log who changed the status and what it changed to
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