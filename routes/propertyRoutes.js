const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");

const {
  createProperty,
  getProperties,
  deleteProperty
} = require("../controllers/propertyController");

// ✅ GET
router.get("/", getProperties);

// ✅ CREATE (ADMIN ONLY)
router.post("/", protect, authorize("admin"), createProperty);

// ✅ DELETE (SOFT DELETE - ADMIN ONLY)
router.delete("/:id", protect, authorize("admin"), deleteProperty);

router.patch("/properties/:id/restore", restoreProperty);

module.exports = router;