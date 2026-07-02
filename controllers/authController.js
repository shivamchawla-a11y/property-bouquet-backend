const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// 🔐 LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔥 IMPORTANT: include password explicitly
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // 🚨 BLOCK IF REVOKED
    if (!user.isActive) {
      return res.status(403).json({
        message: "Access revoked. Contact admin.",
      });
    }

    // 🔐 USE MODEL METHOD
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      token,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Save hashed token
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetUrl =
  `https://propertybouquet.com/reset-password/${resetToken}`;

    await resend.emails.send({
      from: "Property Bouquet <no-reply@propertybouquet.com>",
      to: email,
      subject: "Reset Your Password",
      html: `
      <h2>Password Reset</h2>

      <p>Click below to reset your password.</p>

      <a href="${resetUrl}">
      Reset Password
      </a>

      <p>This link expires in 15 minutes.</p>
      `,
    });

    res.json({
      success: true,
      message: "Reset email sent.",
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: err.message,
    });

  }
};

exports.resetPassword = async (req, res) => {
  try {

    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    user.password = req.body.password;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully.",
    });

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }
};


// 🔐 GET CURRENT USER (FIXED)
exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id); // password already hidden

    res.status(200).json({
      success: true,
      user,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
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



// ✅ CREATE USER (SUPER ADMIN)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields required",
      });
    }

    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // 🔥 NO NEED TO HASH HERE (schema already does it)
    const user = await User.create({
      name,
      email,
      password,
      role: role || "Agent",
    });

    // 🔥 REMOVE PASSWORD FROM RESPONSE
    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({
      success: true,
      data: userObj,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// ✅ GET USERS
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find(); // password already excluded

    res.json({
      success: true,
      data: users,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// ✅ TOGGLE ACCESS (REVOKE / ACTIVATE)
exports.toggleUserAccess = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🚫 Prevent self-disable
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        message: "You cannot disable yourself",
      });
    }

    // 🚫 Prevent disabling SuperAdmin
    if (user.role === "SuperAdmin") {
      return res.status(403).json({
        message: "SuperAdmin cannot be disabled",
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? "activated" : "revoked"}`,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};