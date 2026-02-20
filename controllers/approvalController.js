const Approval = require("../models/Approval");
const Expense = require("../models/Expense");
const AuditLog = require("../models/AuditLog");
const User = require("../models/User");
const mongoose = require("mongoose");
const { sendMail } = require("../utils/mailer");

// POST /approvals — manager or finance submits a decision
const createApproval = async (req, res, next) => {
  try {
    const { expenseId, decision, comments } = req.body;

    const expense = await Expense.findById(expenseId)
      .populate("userId", "name email")
      .populate("departmentId", "name");

    if (!expense) {
      return res.status(404).render("error", {
        message: "Expense not found",
        statusCode: 404
      });
    }

    // --- ROLE ENFORCEMENT ---

    // Manager can only approve expenses under ₦50,000
    if (req.user.role === "manager" && expense.amount >= 50000) {
      return res.status(403).render("error", {
        message: "Expenses of ₦50,000 and above require Finance approval",
        statusCode: 403
      });
    }

    // Finance can only approve expenses >= ₦50,000
    if (req.user.role === "finance" && expense.amount < 50000) {
      return res.status(403).render("error", {
        message: "Expenses below ₦50,000 only require Manager approval",
        statusCode: 403
      });
    }

    // Manager can only approve expenses from their own department
    if (req.user.role === "manager") {
      const managerDept = req.user.department._id
        ? req.user.department._id.toString()
        : req.user.department.toString();

      const expenseDept = expense.departmentId._id
        ? expense.departmentId._id.toString()
        : expense.departmentId.toString();

      if (managerDept !== expenseDept) {
        return res.status(403).render("error", {
          message: "You can only approve expenses from your own department",
          statusCode: 403
        });
      }
    }

    // Check if this approver already made a decision on this expense
    const alreadyDecided = await Approval.findOne({
      expenseId,
      approverId: req.user._id
    });

    if (alreadyDecided) {
      return res.status(400).render("error", {
        message: "You have already made a decision on this expense",
        statusCode: 400
      });
    }

    // Save the approval decision
    await Approval.create({
      expenseId,
      approverId: req.user._id,
      decision,
      comments
    });

    // Update expense status
    expense.status = decision;
    await expense.save();

    // Write audit log
    await AuditLog.create({
      expenseId: expense._id,
      performedBy: req.user._id,
      action: decision
    });

    // Notify the employee who submitted the expense
    const employee = await User.findById(expense.userId);
    if (employee) {
      await sendMail(
        employee.email,
        `Your Expense Has Been ${
          decision.charAt(0).toUpperCase() + decision.slice(1)
        }`,
        `<p>Hi ${employee.name},</p>
         <p>Your expense of <strong>₦${expense.amount.toLocaleString()}</strong>
         in the <strong>${expense.category}</strong> category
         has been <strong>${decision}</strong> by
         ${req.user.name} (${req.user.role}).</p>
         <p>Log in to view the full details.</p>`
      );
    }

    // If manager approved a large expense notify ALL finance users
    if (
      req.user.role === "manager" &&
      expense.amount >= 50000 &&
      decision === "approved"
    ) {
      const financeUsers = await User.find({ role: "finance" });

      for (const finance of financeUsers) {
        await sendMail(
          finance.email,
          "Large Expense Awaiting Your Finance Approval",
          `<p>Hi ${finance.name},</p>
           <p>An expense of <strong>₦${expense.amount.toLocaleString()}</strong>
           in the <strong>${expense.category}</strong> category
           from the <strong>${expense.departmentId?.name}</strong> department
           has been approved by a manager and now requires
           your finance approval.</p>
           <p>Please log in to review it.</p>`
        );
      }
    }

    res.redirect("/approvals");
  } catch (error) {
    next(error);
  }
};

// GET /approvals — pending expenses and past decisions
const getApprovals = async (req, res, next) => {
  try {
    let pendingExpenses = [];

    if (req.user.role === "manager") {
      // Get manager department safely
      const managerDept = req.user.department._id
        ? req.user.department._id
        : req.user.department;

      // Manager sees submitted expenses under ₦50,000
      // in their department only
      pendingExpenses = await Expense.find({
        status: "submitted",
        amount: { $lt: 50000 },
        departmentId: new mongoose.Types.ObjectId(managerDept)
      })
        .populate("userId", "name email")
        .populate("departmentId", "name")
        .sort({ createdAt: -1 });
    }

    if (req.user.role === "finance") {
      // Finance sees all submitted expenses >= ₦50,000
      // across every department
      pendingExpenses = await Expense.find({
        status: "submitted",
        amount: { $gte: 50000 }
      })
        .populate("userId", "name email")
        .populate("departmentId", "name")
        .sort({ createdAt: -1 });
    }

    // Exclude expenses this approver already decided on
    const myDecisions = await Approval.find({
      approverId: req.user._id
    }).select("expenseId");

    const decidedIds = myDecisions.map(a => a.expenseId.toString());

    // Filter out already decided expenses from pending list
    pendingExpenses = pendingExpenses.filter(
      e => !decidedIds.includes(e._id.toString())
    );

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

    // Only the original approver can update their own decision
    if (approval.approverId.toString() !== req.user._id.toString()) {
      return res.status(403).render("error", {
        message: "You can only update your own approval decisions",
        statusCode: 403
      });
    }

    approval.decision = decision;
    approval.comments = comments;
    await approval.save();

    // Keep expense status in sync with updated decision
    await Expense.findByIdAndUpdate(approval.expenseId, {
      status: decision
    });

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
