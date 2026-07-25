const express = require("express");

const router = express.Router();

const {
  getLandingPages,
  getLandingPage,
  generateLandingPages,
  updateLandingPage,
  deleteLandingPage,
} = require("../controllers/landingPageController");

const { protect } = require("../middleware/authMiddleware");

// =====================================================
// COLLECTION ENGINE
// =====================================================

// Generate Draft Collections
router.post(
  "/generate",
  protect,
  generateLandingPages
);

// Get All Collections
router.get(
  "/",
  protect,
  getLandingPages
);

// Get Single Collection
router.get(
  "/:id",
  protect,
  getLandingPage
);

// Update Collection
router.patch(
  "/:id",
  protect,
  updateLandingPage
);

// Soft Delete Collection
router.delete(
  "/:id",
  protect,
  deleteLandingPage
);

module.exports = router;