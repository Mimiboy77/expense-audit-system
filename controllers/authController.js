const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Signs a JWT and sends it as an HttpOnly cookie
const sendTokenCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });

  // HttpOnly prevents JS from reading the cookie — more secure than localStorage
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  });
};

// POST /register — creates a new user account
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, department } = req.body;

    // Check if email is already taken
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).render("auth/register", {
        error: "Email already registered"
      });
    }

    // Password hashing happens automatically in the User model pre-save hook
    await User.create({ name, email, password, role, department });

    res.redirect("/login"); // Send to login after successful registration
  } catch (error) {
    next(error); // Pass to global error handler
  }
};

// POST /login — verifies credentials and sets JWT cookie
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).render("auth/login", {
        error: "Invalid email or password"
      });
    }

    // Use the comparePassword method we defined in the User model
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).render("auth/login", {
        error: "Invalid email or password"
      });
    }

    // Sign and attach JWT cookie then redirect to dashboard
    sendTokenCookie(res, user._id);
    res.redirect("/dashboard");
  } catch (error) {
    next(error);
  }
};

// GET /logout — clears the JWT cookie and ends the session
const logout = (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
};

module.exports = { register, login, logout };