const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");

const {
  createProperty,
  getProperties,
  deleteProperty,
  restoreProperty
} = require("../controllers/propertyController");

// ✅ GET
router.get("/", getProperties);

// ✅ CREATE (ADMIN ONLY)
router.post("/", protect, authorize("SuperAdmin"), createProperty);

// ✅ DELETE (SOFT DELETE - ADMIN ONLY)
router.delete("/:id", protect, authorize("SuperAdmin"), deleteProperty);
router.patch("/:id/restore", protect, authorize("SuperAdmin"), restoreProperty);

module.exports = router;