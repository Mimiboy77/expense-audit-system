const User = require("../models/User");
const Department = require("../models/Department");
const Expense = require("../models/Expense");
const Budget = require("../models/Budget");

// GET /admin — admin dashboard with system overview
const getAdminDashboard = async (req, res, next) => {
  try {
    // System wide stats
    const totalUsers = await User.countDocuments();
    const totalExpenses = await Expense.countDocuments();
    const totalDepartments = await Department.countDocuments();

    const pendingExpenses = await Expense.countDocuments({
      status: "submitted"
    });

    const approvedExpenses = await Expense.countDocuments({
      status: "approved"
    });

    const rejectedExpenses = await Expense.countDocuments({
      status: "rejected"
    });

    res.render("admin/dashboard", {
      stats: {
        totalUsers,
        totalExpenses,
        totalDepartments,
        pendingExpenses,
        approvedExpenses,
        rejectedExpenses
      },
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

// GET /admin/users — list all users with pagination
const getUsers = async (req, res, next) => {
  try {
    const { search, role, department } = req.query;

    let filter = {};

    // Search by name or email
    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") }
      ];
    }

    if (role) filter.role = role;
    if (department) filter.department = department;

    // Pagination
    const page = Number(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find(filter)
      .populate("department", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const departments = await Department.find().sort({ name: 1 });

    res.render("admin/users", {
      users,
      departments,
      filters: { search, role, department },
      pagination: { page, totalPages, totalUsers },
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

// GET /admin/users/:id/edit — edit user form
const getEditUser = async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id)
      .populate("department", "name");

    if (!targetUser) {
      return res.status(404).render("error", {
        message: "User not found",
        statusCode: 404
      });
    }

    const departments = await Department.find().sort({ name: 1 });

    res.render("admin/edit-user", {
      targetUser,
      departments,
      user: req.user,
      error: null,
      success: null
    });
  } catch (error) {
    next(error);
  }
};

// POST /admin/users/:id/edit — save user changes
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, department } = req.body;

    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).render("error", {
        message: "User not found",
        statusCode: 404
      });
    }

    // Check email is not taken by another user
    if (email && email !== targetUser.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        const departments = await Department.find();
        return res.render("admin/edit-user", {
          targetUser,
          departments,
          user: req.user,
          error: "That email is already in use",
          success: null
        });
      }
    }

    targetUser.name = name || targetUser.name;
    targetUser.email = email || targetUser.email;
    targetUser.role = role || targetUser.role;
    targetUser.department = department || targetUser.department;

    await targetUser.save();

    res.redirect("/admin/users");
  } catch (error) {
    next(error);
  }
};

// POST /admin/users/:id/delete — delete a user
const deleteUser = async (req, res, next) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.redirect("/admin/users");
    }

    await User.findByIdAndDelete(req.params.id);
    res.redirect("/admin/users");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboard,
  getUsers,
  getEditUser,
  updateUser,
  deleteUser
};