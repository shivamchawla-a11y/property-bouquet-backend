const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");

const {
  createProperty,
  getProperties,
} = require("../controllers/propertyController");

// ✅ Public route (optional)
router.get("/", getProperties);

// ✅ Protected route (ONLY ADMIN)
router.post("/", protect, authorize("admin"), createProperty);

module.exports = router;