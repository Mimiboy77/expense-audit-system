// Takes any number of allowed roles as arguments e.g restrictTo("manager", "finance")
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // req.user is already set by the protect middleware before this runs
    if (!roles.includes(req.user.role)) {
      return res.status(403).render("dashboard", {
        error: "You do not have permission to perform this action"
      });
    }

    next(); // Role is allowed — continue to the controller
  };
};

module.exports = { restrictTo };