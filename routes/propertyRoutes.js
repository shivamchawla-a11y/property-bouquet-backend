const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");

const {
  createProperty,
  getProperties,
  deleteProperty,
  restoreProperty,
  getPropertyBySlug,
  updateProperty,       // ✅ ADD
  getPropertyById,      // ✅ ADD
} = require("../controllers/propertyController");

// PUBLIC
router.get("/", getProperties);

// 🔥 NEW ROUTE
router.get("/slug/:slug", getPropertyBySlug);

// ADMIN
router.post("/", protect, authorize("SuperAdmin"), createProperty);

router.delete("/:id", protect, authorize("SuperAdmin"), deleteProperty);

router.patch("/:id/restore", protect, authorize("SuperAdmin"), restoreProperty);

// ✅ GET SINGLE PROPERTY (EDIT)
router.get("/:id", protect, authorize("SuperAdmin"), getPropertyById);

// ✅ UPDATE PROPERTY
router.patch("/:id", protect, authorize("SuperAdmin"), updateProperty);

module.exports = router;