const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");

const {
  createProperty,
  getProperties,
  deleteProperty,
  restoreProperty,
  getPropertyBySlug, // ✅ ADD THIS
} = require("../controllers/propertyController");

// PUBLIC
router.get("/", getProperties);

// 🔥 NEW ROUTE
router.get("/slug/:slug", getPropertyBySlug);

// ADMIN
router.post("/", protect, authorize("SuperAdmin"), createProperty);

router.delete("/:id", protect, authorize("SuperAdmin"), deleteProperty);

router.patch("/:id/restore", protect, authorize("SuperAdmin"), restoreProperty);

module.exports = router;