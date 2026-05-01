const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware"); // ✅ FIX

const {
  createProperty,
  getProperties,
  deleteProperty,
  restoreProperty
} = require("../controllers/propertyController");

// PUBLIC
router.get("/", getProperties);

// ADMIN
router.post("/", protect, authorize("SuperAdmin"), createProperty);

router.delete("/:id", protect, authorize("SuperAdmin"), deleteProperty);

router.patch("/:id/restore", protect, authorize("SuperAdmin"), restoreProperty);

module.exports = router;