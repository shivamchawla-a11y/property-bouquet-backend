const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// 🔐 LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 3. Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 🔥 FIXED COOKIE CONFIG
    res.cookie("token", token, {
  httpOnly: true,
  secure: true,         // 🔥 MUST for HTTPS
  sameSite: "None",     // 🔥 MUST for cross-domain
  path: "/",            // 🔥 IMPORTANT
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

    res.status(200).json({
  success: true,
  token, // 🔥 ADD THIS
});

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔐 GET CURRENT USER
exports.me = (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

// 🔓 LOGOUT
exports.logout = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    expires: new Date(0),
    path: "/",
  });

  res.json({ success: true });
};