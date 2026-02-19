const Expense = require("../models/Expense");
const { createObjectCsvWriter } = require("csv-writer");
const path = require("path");

// GET /reports — finance generates a CSV report for a selected month and year
const generateReport = async (req, res, next) => {
  try {
    const { month, year } = req.query;

    // If no filters provided just render the report selection form
    if (!month || !year) {
      return res.render("reports", { user: req.user, report: null });
    }

    // Fetch all expenses for the selected period with department info
    const expenses = await Expense.find({
      month: Number(month),
      year: Number(year)
    })
      .populate("departmentId", "name")
      .populate("userId", "name");

    // Define CSV output file path
    const filePath = path.join(
      __dirname,
      `../public/uploads/report-${month}-${year}.csv`
    );

    // Set up the CSV writer with column headers
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: "employee", title: "Employee" },
        { id: "department", title: "Department" },
        { id: "category", title: "Category" },
        { id: "amount", title: "Amount (₦)" },
        { id: "status", title: "Status" },
        { id: "date", title: "Date" }
      ]
    });

    // Shape each expense into a flat row for the CSV
    const records = expenses.map((e) => ({
      employee: e.userId?.name || "N/A",
      department: e.departmentId?.name || "N/A",
      category: e.category,
      amount: e.amount,
      status: e.status,
      date: e.createdAt.toDateString()
    }));

    await csvWriter.writeRecords(records);

    // Send the file as a download to the browser
    res.download(filePath, `report-${month}-${year}.csv`);
  } catch (error) {
    next(error);
  }
};

module.exports = { generateReport };