const express = require("express");
const dashboardRoutes = require("./routes/dashboardRoutes");
const path = require("path");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");

const app = express();

require("dotenv").config();

// Parse incoming JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Parse cookies for JWT reading
app.use(cookieParser());

// Allow PUT and DELETE from HTML forms
app.use(methodOverride("_method"));

// Serve static files from public folder
app.use(express.static(path.join(__dirname, "public")));

// Set EJS as view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// --- Root route ---
// Redirects to dashboard if logged in otherwise goes to login
app.get("/", (req, res) => {
  const token = req.cookies.token;
  if (token) {
    return res.redirect("/dashboard");
  }
  res.redirect("/login");
});

// --- Mount all route files ---
app.use("/", dashboardRoutes);
app.use("/", require("./routes/authRoutes"));
app.use("/expenses", require("./routes/expenseRoutes"));
app.use("/approvals", require("./routes/approvalRoutes"));
app.use("/audit-logs", require("./routes/auditLogRoutes"));
app.use("/reports", require("./routes/reportRoutes"));
app.use("/comments", require("./routes/commentRoutes"));
app.use("/budget", require("./routes/budgetRoutes"));
app.use("/notifications", require("./routes/notificationRoutes"));
app.use("/admin", require("./routes/adminRoutes"));

// --- 404 handler ---
app.use((req, res) => {
  res.status(404).render("error", {
    message: "Page not found",
    statusCode: 404
  });
});

// --- Global error handler — must stay last ---
app.use(require("./middlewares/errorHandler").errorHandler);

module.exports = app;
