const express = require("express");
const router = express.Router();

// Controller function
const { addComment } = require("../controllers/commentController");

// Middleware
const { protect } = require("../middlewares/auth");

// POST /comments — any logged-in user can comment on an expense
router.post("/", protect, addComment);

module.exports = router;