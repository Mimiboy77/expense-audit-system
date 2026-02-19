const Comment = require("../models/Comment");

// POST /comments — any logged-in user adds a comment to an expense
const addComment = async (req, res, next) => {
  try {
    const { expenseId, text } = req.body;

    // Save the comment linked to both the expense and the commenter
    await Comment.create({
      expenseId,
      userId: req.user._id,
      text
    });

    // Redirect back to the expense detail page after posting
    res.redirect(`/expenses/${expenseId}`);
  } catch (error) {
    next(error);
  }
};

module.exports = { addComment };
