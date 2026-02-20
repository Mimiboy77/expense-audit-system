const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Budget = require("../models/Budget");
const Expense = require("../models/Expense");
const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpenseStatus
} = require("../controllers/expenseController");
const { protect } = require("../middlewares/auth");
const { restrictTo } = require("../middlewares/role");
const { upload } = require("../middlewares/upload");

// GET /expenses/submit — render form with live budget info
router.get("/submit", protect, async (req, res, next) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const departmentId = req.user.department._id
      ? req.user.department._id
      : req.user.department;

    const deptObjectId = new mongoose.Types.ObjectId(departmentId);

    // Fetch current month budget for this department
    const budget = await Budget.findOne({
      departmentId: deptObjectId,
      month,
      year
    });

    // Calculate how much has been spent so far
    const spent = await Expense.aggregate([
      {
        $match: {
          departmentId: deptObjectId,
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

    res.render("expenses/submit-expense", {
      error: null,
      user: req.user,
      budgetAmount,
      totalSpent,
      remaining
    });
  } catch (error) {
    next(error);
  }
});

// GET /expenses — list all expenses for logged in user
router.get("/", protect, getExpenses);

// GET /expenses/:id — view single expense
router.get("/:id", protect, getExpenseById);

// POST /expenses — submit new expense
router.post(
  "/",
  protect,
  upload.single("receipt"),
  createExpense
);

// PUT /expenses/:id — update expense status
router.put(
  "/:id",
  protect,
  restrictTo("manager", "finance"),
  updateExpenseStatus
);

module.exports = router;