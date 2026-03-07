const express = require("express");
const router = express.Router();
const {
  getAdminDashboard,
  getUsers,
  getEditUser,
  updateUser,
  deleteUser
} = require("../controllers/adminController");
const {
  getDepartments,
  createDepartment,
  deleteDepartment
} = require("../controllers/departmentController");
const { protect } = require("../middlewares/auth");
const { restrictTo } = require("../middlewares/role");

// All admin routes restricted to finance role
// Finance acts as the system admin in this project

// User management
router.get("/", protect, restrictTo("finance"), getAdminDashboard);
router.get("/users", protect, restrictTo("finance"), getUsers);
router.get("/users/:id/edit", protect, restrictTo("finance"), getEditUser);
router.post("/users/:id/edit", protect, restrictTo("finance"), updateUser);
router.post("/users/:id/delete", protect, restrictTo("finance"), deleteUser);

// Department management
router.get("/departments", protect, restrictTo("finance"), getDepartments);
router.post("/departments", protect, restrictTo("finance"), createDepartment);
router.post("/departments/:id/delete", protect, restrictTo("finance"), deleteDepartment);

module.exports = router;