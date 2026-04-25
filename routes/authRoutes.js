const express = require("express");
const router = express.Router();

const {
  login,
  me,
  logout,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

// LOGIN
router.post("/login", login);

// 🔐 CHECK AUTH
router.get("/me", protect, me);

// 🔓 LOGOUT
router.post("/logout", logout);

module.exports = router;