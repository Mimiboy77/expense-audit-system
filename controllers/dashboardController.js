const Expense = require("../models/Expense");
const Department = require("../models/Department");

// GET /dashboard
const getDashboard = async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Build filter based on role
    let baseFilter = {};

    if (req.user.role === "employee") {
      baseFilter.userId = req.user._id;
    }

    if (req.user.role === "manager") {
      const managerDept = req.user.department._id
        ? req.user.department._id
        : req.user.department;
      baseFilter.departmentId = managerDept;
    }

    // Finance sees everything — no filter

    // --- STATS ---
    const totalExpenses = await Expense.countDocuments(baseFilter);
    const pendingExpenses = await Expense.countDocuments({
      ...baseFilter, status: "submitted"
    });
    const approvedExpenses = await Expense.countDocuments({
      ...baseFilter, status: "approved"
    });
    const rejectedExpenses = await Expense.countDocuments({
      ...baseFilter, status: "rejected"
    });
    const paidExpenses = await Expense.countDocuments({
      ...baseFilter, status: "paid"
    });

    // Total approved/paid amount this month
    const thisMonthResult = await Expense.aggregate([
      {
        $match: {
          ...baseFilter,
          status: { $in: ["approved", "paid"] },
          month: currentMonth,
          year: currentYear
        }
      },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const monthlyTotal = thisMonthResult[0]?.total || 0;

    // --- CHART 1: Monthly spending bar chart ---
    const monthlySpending = await Expense.aggregate([
      {
        $match: {
          ...baseFilter,
          year: currentYear,
          status: { $in: ["approved", "paid"] }
        }
      },
      { $group: { _id: "$month", total: { $sum: "$amount" } } },
      { $sort: { _id: 1 } }
    ]);

    // Fill zeros for months with no data
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const found = monthlySpending.find(m => m._id === i + 1);
      return found ? found.total : 0;
    });

    // --- CHART 2: Spending by department ---
    const deptSpending = await Expense.aggregate([
      {
        $match: {
          ...baseFilter,
          status: { $in: ["approved", "paid"] },
          year: currentYear
        }
      },
      { $group: { _id: "$departmentId", total: { $sum: "$amount" } } },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "department"
        }
      },
      { $unwind: "$department" },
      { $sort: { total: -1 } },
      { $limit: 8 }
    ]);

    const deptLabels = deptSpending.map(d => d.department.name);
    const deptTotals = deptSpending.map(d => d.total);

    // --- CHART 3: Top spending categories ---
    const categorySpending = await Expense.aggregate([
      {
        $match: {
          ...baseFilter,
          status: { $in: ["approved", "paid"] },
          year: currentYear
        }
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 6 }
    ]);

    const categoryLabels = categorySpending.map(c => c._id);
    const categoryTotals = categorySpending.map(c => c.total);

    // --- ACTIVITY FEED ---
    const recentExpenses = await Expense.find(baseFilter)
      .populate("userId", "name")
      .populate("departmentId", "name")
      .sort({ createdAt: -1 })
      .limit(8);

    res.render("dashboard", {
      user: req.user,
      stats: {
        totalExpenses,
        pendingExpenses,
        approvedExpenses,
        rejectedExpenses,
        paidExpenses,
        monthlyTotal
      },
      charts: {
        monthly: { data: monthlyData, year: currentYear },
        departments: { labels: deptLabels, data: deptTotals },
        categories: { labels: categoryLabels, data: categoryTotals }
      },
      recentExpenses,
      currentMonth
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };