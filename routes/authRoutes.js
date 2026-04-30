const express = require("express");
const router = express.Router();

const {
  login,
  me,
  logout,
  createUser,
  getUsers,
  toggleUserAccess,
} = require("../controllers/authController");

const { protect, authorize } = require("../middleware/authMiddleware");

// LOGIN
router.post("/login", login);

// AUTH
router.get("/me", protect, me);
router.post("/logout", logout);

console.log("AUTH ROUTES FILE RUNNING");

// 🔥 TEAM MANAGEMENT (SUPER ADMIN ONLY)
router.post("/users", protect, authorize("SuperAdmin"), createUser);
router.get("/users", protect, authorize("SuperAdmin"), getUsers);
router.patch("/users/:id/toggle", protect, authorize("SuperAdmin"), toggleUserAccess);

module.exports = router;