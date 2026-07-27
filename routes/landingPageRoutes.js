const express = require("express");

const router = express.Router();

const {
  getLandingPages,
  getLandingPage,
  generateLandingPages,
  getLandingPageBySlug,
  updateLandingPage,
  publishLandingPage,
  unpublishLandingPage,
  deleteLandingPage,
} = require("../controllers/landingPageController");

const { protect } = require("../middleware/authMiddleware");

// =====================================================
// COLLECTION ENGINE
// =====================================================

// Generate Draft Collections
// Generate
router.post(
  "/generate",
  protect,
  generateLandingPages
);

// Get All
router.get(
  "/",
  protect,
  getLandingPages
);

// Get By Slug (Public)
router.get(
  "/slug/:slug",
  getLandingPageBySlug
);

// Get By ID (Admin)
router.get(
  "/:id",
  protect,
  getLandingPage
);

// Update
router.patch(
  "/:id",
  protect,
  updateLandingPage
);

// Publish
router.patch(
  "/:id/publish",
  protect,
  publishLandingPage
);

// Unpublish
router.patch(
  "/:id/unpublish",
  protect,
  unpublishLandingPage
);

// Delete
router.delete(
  "/:id",
  protect,
  deleteLandingPage
);

module.exports = router;