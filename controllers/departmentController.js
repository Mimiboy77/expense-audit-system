const Department = require("../models/Department");
const Budget = require("../models/Budget");
const User = require("../models/User");

// GET /admin/departments — list all departments
const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ name: 1 });

    // Count how many users are in each department
    const deptData = await Promise.all(
      departments.map(async dept => {
        const userCount = await User.countDocuments({
          department: dept._id
        });
        return { ...dept.toObject(), userCount };
      })
    );

    res.render("admin/departments", {
      departments: deptData,
      user: req.user,
      error: null,
      success: null
    });
  } catch (error) {
    next(error);
  }
};

// POST /admin/departments — create a new department
const createDepartment = async (req, res, next) => {
  try {
    const { name, budgetAmount } = req.body;

    // Check if department name already exists
    const existing = await Department.findOne({
      name: new RegExp(`^${name}$`, "i")
    });

    if (existing) {
      const departments = await Department.find().sort({ name: 1 });
      const deptData = await Promise.all(
        departments.map(async dept => {
          const userCount = await User.countDocuments({
            department: dept._id
          });
          return { ...dept.toObject(), userCount };
        })
      );
      return res.render("admin/departments", {
        departments: deptData,
        user: req.user,
        error: "A department with that name already exists",
        success: null
      });
    }

    // Create the department
    const dept = await Department.create({ name });

    // Create an initial budget for this month
    const now = new Date();
    await Budget.create({
      departmentId: dept._id,
      amount: Number(budgetAmount) || 0,
      month: now.getMonth() + 1,
      year: now.getFullYear()
    });

    // Reload departments list with updated data
    const departments = await Department.find().sort({ name: 1 });
    const deptData = await Promise.all(
      departments.map(async d => {
        const userCount = await User.countDocuments({
          department: d._id
        });
        return { ...d.toObject(), userCount };
      })
    );

    res.render("admin/departments", {
      departments: deptData,
      user: req.user,
      error: null,
      success: `Department "${name}" created successfully`
    });
  } catch (error) {
    next(error);
  }
};

// POST /admin/departments/:id/delete — delete a department
const deleteDepartment = async (req, res, next) => {
  try {
    // Block deletion if users are still assigned to this department
    const userCount = await User.countDocuments({
      department: req.params.id
    });

    if (userCount > 0) {
      const departments = await Department.find().sort({ name: 1 });
      const deptData = await Promise.all(
        departments.map(async d => {
          const count = await User.countDocuments({
            department: d._id
          });
          return { ...d.toObject(), userCount: count };
        })
      );

      return res.render("admin/departments", {
        departments: deptData,
        user: req.user,
        error: `Cannot delete — ${userCount} user(s) are still assigned to this department`,
        success: null
      });
    }

    // Delete the department and its budgets
    await Department.findByIdAndDelete(req.params.id);
    await Budget.deleteMany({ departmentId: req.params.id });

    res.redirect("/admin/departments");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  deleteDepartment
};