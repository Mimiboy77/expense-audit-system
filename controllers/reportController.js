const Expense = require("../models/Expense");
const Department = require("../models/Department");
const PDFDocument = require("pdfkit");

// GET /reports — render the reports page
const getReports = async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.render("reports", { departments, user: req.user });
  } catch (error) {
    next(error);
  }
};

// GET /reports/csv — download expenses as CSV
const generateCSV = async (req, res, next) => {
  try {
    const { month, year, department } = req.query;
    let filter = {};

    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);
    if (department) filter.departmentId = department;

    const expenses = await Expense.find(filter)
      .populate("userId", "name email")
      .populate("departmentId", "name")
      .sort({ createdAt: -1 });

    const rows = [
      [
        "Date", "Employee", "Email",
        "Department", "Category",
        "Amount (₦)", "Status", "Month", "Year"
      ],
      ...expenses.map(e => [
        new Date(e.createdAt).toLocaleDateString(),
        e.userId?.name || "Unknown",
        e.userId?.email || "Unknown",
        e.departmentId?.name || "Unknown",
        e.category,
        e.amount,
        e.status,
        e.month,
        e.year
      ])
    ];

    const csv = rows
      .map(row => row.map(v => `"${v}"`).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="expenses-${month || "all"}-${year || "all"}.csv"`
    );
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

// GET /reports/pdf — download expenses as PDF
const generatePDF = async (req, res, next) => {
  try {
    const { month, year, department } = req.query;
    let filter = {};

    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);
    if (department) filter.departmentId = department;

    const expenses = await Expense.find(filter)
      .populate("userId", "name email")
      .populate("departmentId", "name")
      .sort({ createdAt: -1 });

    // Calculate summary totals
    const totalAmount = expenses.reduce(
      (sum, e) => sum + e.amount, 0
    );
    const totalApproved = expenses
      .filter(e =>
        e.status === "approved" || e.status === "paid"
      )
      .reduce((sum, e) => sum + e.amount, 0);
    const totalPending = expenses
      .filter(e => e.status === "submitted")
      .reduce((sum, e) => sum + e.amount, 0);

    // Create PDF document
    const doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="expense-report-${month || "all"}-${year || "all"}.pdf"`
    );

    doc.pipe(res);

    // --- HEADER ---
    doc
      .fontSize(20)
      .fillColor("#1a1a2e")
      .text("ExpenseAudit System", { align: "center" });

    doc
      .fontSize(13)
      .fillColor("#555")
      .text("Expense Report", { align: "center" });

    doc
      .fontSize(10)
      .fillColor("#999")
      .text(
        `Period: ${month ? `Month ${month}` : "All Months"} / ${year || "All Years"}`,
        { align: "center" }
      );

    doc.moveDown();
    doc
      .moveTo(40, doc.y)
      .lineTo(555, doc.y)
      .strokeColor("#e0e0e0")
      .stroke();
    doc.moveDown();

    // --- SUMMARY ---
    doc
      .fontSize(11)
      .fillColor("#333")
      .text("Summary", { underline: true });

    doc.moveDown(0.4);
    doc.fontSize(10).fillColor("#333");
    doc.text(`Total Expenses:       ${expenses.length}`);
    doc.text(`Total Amount:         \u20a6${totalAmount.toLocaleString()}`);
    doc.text(`Approved + Paid:      \u20a6${totalApproved.toLocaleString()}`);
    doc.text(`Pending:              \u20a6${totalPending.toLocaleString()}`);
    doc.moveDown();

    doc
      .moveTo(40, doc.y)
      .lineTo(555, doc.y)
      .strokeColor("#e0e0e0")
      .stroke();
    doc.moveDown();

    // --- TABLE HEADER ---
    const tableTop = doc.y;
    const col = {
      date: 40,
      employee: 110,
      department: 220,
      category: 310,
      amount: 390,
      status: 475
    };

    doc
      .rect(40, tableTop - 4, 515, 18)
      .fillColor("#1a1a2e")
      .fill();

    doc.fontSize(9).fillColor("#fff");
    doc.text("Date", col.date, tableTop);
    doc.text("Employee", col.employee, tableTop);
    doc.text("Department", col.department, tableTop);
    doc.text("Category", col.category, tableTop);
    doc.text("Amount", col.amount, tableTop);
    doc.text("Status", col.status, tableTop);

    doc.moveDown(0.8);

    // --- TABLE ROWS ---
    expenses.forEach((expense, index) => {
      // Add new page if near bottom
      if (doc.y > 740) {
        doc.addPage();
        doc.moveDown();
      }

      const rowY = doc.y;

      // Alternating row background
      if (index % 2 === 0) {
        doc
          .rect(40, rowY - 2, 515, 16)
          .fillColor("#f9f9f9")
          .fill();
      }

      doc.fontSize(8.5).fillColor("#333");

      doc.text(
        new Date(expense.createdAt).toLocaleDateString(),
        col.date, rowY, { width: 65 }
      );
      doc.text(
        expense.userId?.name || "Unknown",
        col.employee, rowY, { width: 105 }
      );
      doc.text(
        expense.departmentId?.name || "N/A",
        col.department, rowY, { width: 85 }
      );
      doc.text(
        expense.category,
        col.category, rowY, { width: 75 }
      );
      doc.text(
        `\u20a6${expense.amount.toLocaleString()}`,
        col.amount, rowY, { width: 80 }
      );
      doc.text(
        expense.status.toUpperCase(),
        col.status, rowY, { width: 65 }
      );

      doc.moveDown(0.7);
    });

    // --- FOOTER ---
    doc.moveDown();
    doc
      .moveTo(40, doc.y)
      .lineTo(555, doc.y)
      .strokeColor("#e0e0e0")
      .stroke();
    doc.moveDown(0.5);

    doc
      .fontSize(8)
      .fillColor("#aaa")
      .text(
        `Generated on ${new Date().toLocaleString()} — ExpenseAudit System`,
        { align: "center" }
      );

    doc.end();
  } catch (error) {
    next(error);
  }
};

module.exports = { getReports, generateCSV, generatePDF };