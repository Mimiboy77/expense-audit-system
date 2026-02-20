// Core Express setup
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");

const app = express();

// Load environment variables
require("dotenv").config();

// Parse incoming JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Parse cookies (needed for reading JWT from HttpOnly cookie)
app.use(cookieParser());

// Serve static files like CSS, JS, uploaded receipts
app.use(express.static(path.join(__dirname, "public")));

// Set EJS as the templating engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// --- Routes will be mounted here in Phase 5 ---
app.use("/", require("./routes/authRoutes"));           // login, register, logout
app.use("/expenses", require("./routes/expenseRoutes")); // expense CRUD
app.use("/approvals", require("./routes/approvalRoutes")); // approval workflow
app.use("/audit-logs", require("./routes/auditLogRoutes")); // audit trail
app.use("/reports", require("./routes/reportRoutes"));   // CSV reports
app.use("/comments", require("./routes/commentRoutes")); // expense comments
app.use("/budget", require("./routes/budgetRoutes"));

// --- Dashboard redirect after login ---
app.get("/dashboard", require("./middlewares/auth").protect, (req, res) => {
  res.render("dashboard", { user: req.user });
});

// --- 404 handler for unknown routes ---
app.use((req, res) => {
  res.status(404).render("error", {
    message: "Page not found",
    statusCode: 404
  });
});
// --- Global error handler — must stay last ---
app.use(require("./middlewares/errorHandler").errorHandler);

module.exports = app;