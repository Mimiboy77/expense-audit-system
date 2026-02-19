# Create all directories
$dirs = @(
  "config",
  "controllers",
  "middlewares",
  "models",
  "routes",
  "utils",
  "views/partials",
  "views/auth",
  "views/expenses",
  "views/approvals",
  "public/css",
  "public/js",
  "public/uploads",
  "logs"
)

foreach ($dir in $dirs) {
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

# Create all files
$files = @(
  "config/db.js",
  "controllers/authController.js",
  "controllers/expenseController.js",
  "controllers/approvalController.js",
  "controllers/auditLogController.js",
  "controllers/reportController.js",
  "controllers/commentController.js",
  "middlewares/auth.js",
  "middlewares/role.js",
  "middlewares/errorHandler.js",
  "middlewares/upload.js",
  "models/User.js",
  "models/Department.js",
  "models/Budget.js",
  "models/Expense.js",
  "models/Approval.js",
  "models/Comment.js",
  "models/AuditLog.js",
  "routes/authRoutes.js",
  "routes/expenseRoutes.js",
  "routes/approvalRoutes.js",
  "routes/auditLogRoutes.js",
  "routes/reportRoutes.js",
  "routes/commentRoutes.js",
  "utils/logger.js",
  "utils/mailer.js",
  "utils/cronJobs.js",
  "views/partials/header.ejs",
  "views/partials/navbar.ejs",
  "views/partials/footer.ejs",
  "views/auth/login.ejs",
  "views/auth/register.ejs",
  "views/expenses/expenses.ejs",
  "views/expenses/expense.ejs",
  "views/expenses/submit-expense.ejs",
  "views/approvals/approvals.ejs",
  "views/approvals/approval-decision.ejs",
  "views/audit-logs.ejs",
  "views/reports.ejs",
  "views/dashboard.ejs",
  "views/error.ejs",
  "public/css/style.css",
  "app.js",
  "server.js",
  ".env",
  ".gitignore",
  "README.md"
)

foreach ($file in $files) {
  New-Item -ItemType File -Force -Path $file | Out-Null
}

Write-Host "All files and folders created successfully" -ForegroundColor Green