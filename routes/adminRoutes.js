const express = require("express");
const router = express.Router();
const {
  getAdminDashboard,
  getUsers,
  getEditUser,
  updateUser,
  deleteUser
} = require("../controllers/adminController");
const { protect } = require("../middlewares/auth");
const { restrictTo } = require("../middlewares/role");

// All admin routes restricted to finance role
// Finance acts as the system admin in this project

router.get("/", protect, restrictTo("finance"), getAdminDashboard);
router.get("/users", protect, restrictTo("finance"), getUsers);
router.get("/users/:id/edit", protect, restrictTo("finance"), getEditUser);
router.post("/users/:id/edit", protect, restrictTo("finance"), updateUser);
router.post("/users/:id/delete", protect, restrictTo("finance"), deleteUser);

module.exports = router;