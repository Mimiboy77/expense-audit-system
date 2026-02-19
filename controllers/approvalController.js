const Approval = require("../models/Approval");
const Expense = require("../models/Expense");
const AuditLog = require("../models/AuditLog");
const User = require("../models/User");
const { sendMail } = require("../utils/mailer");

// POST /approvals — manager or finance submits a decision
const createApproval = async (req, res, next) => {
  try {
    const { expenseId, decision, comments } = req.body;

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).render("error", {
        message: "Expense not found",
        statusCode: 404
      });
    }

    // Finance can only approve expenses >= ₦50,000
    if (req.user.role === "finance" && expense.amount < 50000) {
      return res.status(403).render("error", {
        message: "Finance approval is only required for expenses above ₦50,000",
        statusCode: 403
      });
    }

    // Create the approval record
    await Approval.create({
      expenseId,
      approverId: req.user._id,
      decision,
      comments
    });

    // Update expense status to match the decision
    expense.status = decision;
    await expense.save();

    // Log the action
    await AuditLog.create({
      expenseId: expense._id,
      performedBy: req.user._id,
      action: decision
    });

    // Notify the employee of the decision
    const employee = await User.findById(expense.userId);
    if (employee) {
      await sendMail(
        employee.email,
        `Your Expense Has Been ${decision.charAt(0).toUpperCase() + decision.slice(1)}`,
        `<p>Hi ${employee.name},</p>
         <p>Your expense of <strong>₦${expense.amount.toLocaleString()}</strong>
         in the <strong>${expense.category}</strong> category
         has been <strong>${decision}</strong>.</p>
         <p>Log in to view the full details and any comments.</p>`
      );
    }

    res.redirect("/approvals");
  } catch (error) {
    next(error);
  }
};

// GET /approvals — shows pending expenses AND past decisions
const getApprovals = async (req, res, next) => {
  try {
    let pendingExpenses = [];

    if (req.user.role === "manager") {
      // Manager sees all submitted expenses under ₦50,000 in their department
      pendingExpenses = await Expense.find({
        status: "submitted",
        amount: { $lt: 50000 },
        departmentId: req.user.department
      })
        .populate("userId", "name email")
        .populate("departmentId", "name")
        .sort({ createdAt: -1 });
    }

    if (req.user.role === "finance") {
      // Finance sees all submitted expenses >= ₦50,000 across all departments
      // AND all submitted expenses that need finance sign-off
      pendingExpenses = await Expense.find({
        status: "submitted",
        amount: { $gte: 50000 }
      })
        .populate("userId", "name email")
        .populate("departmentId", "name")
        .sort({ createdAt: -1 });
    }

    // Past decisions this user has already made
    const pastDecisions = await Approval.find({
      approverId: req.user._id
    })
      .populate("expenseId")
      .sort({ createdAt: -1 });

    res.render("approvals/approvals", {
      pendingExpenses,
      pastDecisions,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

// PUT /approvals/:id — update an existing approval decision
const updateApproval = async (req, res, next) => {
  try {
    const { decision, comments } = req.body;

    const approval = await Approval.findById(req.params.id);
    if (!approval) {
      return res.status(404).render("error", {
        message: "Approval not found",
        statusCode: 404
      });
    }

    // Only the original approver can update their decision
    if (approval.approverId.toString() !== req.user._id.toString()) {
      return res.status(403).render("error", {
        message: "You can only update your own approval decisions",
        statusCode: 403
      });
    }

    approval.decision = decision;
    approval.comments = comments;
    await approval.save();

    // Keep expense status in sync
    await Expense.findByIdAndUpdate(approval.expenseId, { status: decision });

    // Log the update
    await AuditLog.create({
      expenseId: approval.expenseId,
      performedBy: req.user._id,
      action: "updated"
    });

    res.redirect("/approvals");
  } catch (error) {
    next(error);
  }
};

module.exports = { createApproval, getApprovals, updateApproval };