const express = require("express");
const router = express.Router();
const {
  getDepartmentBudget,
  getEditBudget,
  updateBudget,
  resetBudgets
} = require("../controllers/budgetController");
const { protect } = require("../middlewares/auth");
const { restrictTo } = require("../middlewares/role");

// GET /budget — manager sees their dept, finance sees all
router.get(
  "/",
  protect,
  restrictTo("manager", "finance"),
  getDepartmentBudget
);

// GET /budget/edit/:departmentId — finance only
router.get(
  "/edit/:departmentId",
  protect,
  restrictTo("finance"),
  getEditBudget
);

// POST /budget/edit/:departmentId — finance saves changes
router.post(
  "/edit/:departmentId",
  protect,
  restrictTo("finance"),
  updateBudget
);

// POST /budget/reset — finance manually resets budgets for a month
router.post(
  "/reset",
  protect,
  restrictTo("finance"),
  resetBudgets
);

module.exports = router;