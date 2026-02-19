const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");

const {
  createApproval,
  getApprovals,
  updateApproval
} = require("../controllers/approvalController");

const { protect } = require("../middlewares/auth");
const { restrictTo } = require("../middlewares/role");

// Render decision form with full expense details loaded
router.get(
  "/decision/:expenseId",
  protect,
  restrictTo("manager", "finance"),
  async (req, res, next) => {
    try {
      const expense = await Expense.findById(req.params.expenseId)
        .populate("userId", "name email")
        .populate("departmentId", "name");

      if (!expense) {
        return res.status(404).render("error", {
          message: "Expense not found",
          statusCode: 404
        });
      }

      res.render("approvals/approval-decision", {
        expense,
        error: null,
        user: req.user
      });
    } catch (error) {
      next(error);
    }
  }
);

// List pending and past approvals
router.get(
  "/",
  protect,
  restrictTo("manager", "finance"),
  getApprovals
);

// Submit a new approval decision
router.post(
  "/",
  protect,
  restrictTo("manager", "finance"),
  createApproval
);

// Update an existing approval decision
router.put(
  "/:id",
  protect,
  restrictTo("manager", "finance"),
  updateApproval
);

module.exports = router;