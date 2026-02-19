const express = require("express");
const router = express.Router();

// Controller functions
const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpenseStatus
} = require("../controllers/expenseController");

// Middleware
const { protect } = require("../middlewares/auth");
const { restrictTo } = require("../middlewares/role");
const { upload } = require("../middlewares/upload");

// --- Page renders (GET) ---

// Render the submit expense form — any logged-in user
router.get(
  "/submit",
  protect,
  (req, res) => res.render("expenses/submit-expense", {
    error: null,
    user: req.user
  })
);

// List all expenses for the logged-in user
router.get("/", protect, getExpenses);

// View a single expense with comments and approvals
router.get("/:id", protect, getExpenseById);

// --- Form submissions and updates ---

// Submit a new expense — upload runs first to handle receipt file
router.post(
  "/",
  protect,
  upload.single("receipt"), // "receipt" matches the input name in the EJS form
  createExpense
);

// Update expense status — only manager or finance can do this
router.put(
  "/:id",
  protect,
  restrictTo("manager", "finance"),
  updateExpenseStatus
);

module.exports = router;