const express = require("express");

const router = express.Router();

const {
  protect,
  optionalProtect,
  authorize,
  aiAutomationAuth,
} = require("../middleware/authMiddleware");

const {
  createProperty,
  saveDraft,
  checkPropertyDuplicates,
  publishDraft,
  getProperties,
  getPropertySeoList,
  getFeaturedProperties,
  getRecommendedProperties,
  getTrendingProperties,
  getPropertyCategories,
  getPropertySearchIndex,
  deleteProperty,
  restoreProperty,
  moveToTrash,
  restoreTrash,
  permanentDeleteProperty,
  getPropertyBySlug,
  getPropertyPreview,
  updateProperty,
  getPropertyById,
  aiCreateProperty,
} = require("../controllers/propertyController");

// ============================================================
// PUBLIC
// ============================================================

// General public property listing
// KEEP THIS ENDPOINT UNCHANGED
router.get(
  "/",
  optionalProtect,
  getProperties
);

// Lightweight Featured properties
router.get(
  "/featured",
  getFeaturedProperties
);

// Lightweight Recommended properties
router.get(
  "/recommended",
  getRecommendedProperties
);

// Lightweight Trending properties
router.get(
  "/trending",
  getTrendingProperties
);

// Property categories
router.get(
  "/categories",
  getPropertyCategories
);

// Lightweight SearchPanel autocomplete index
router.get(
  "/search-index",
  getPropertySearchIndex
);

// Lightweight SEO property list
router.get(
  "/seo-list",
  getPropertySeoList
);

// Public property by slug
router.get(
  "/slug/:slug",
  getPropertyBySlug
);

// Property preview
router.get(
  "/preview/:slug",
  protect,
  authorize("SuperAdmin", "Agent"),
  getPropertyPreview
);

// ============================================================
// DUPLICATE PROPERTY CHECK
// IMPORTANT: KEEP BEFORE /:id
// ============================================================

router.get(
  "/check-duplicate",
  protect,
  authorize("SuperAdmin", "Agent"),
  checkPropertyDuplicates
);

// ============================================================
// AGENT + SUPERADMIN
// ============================================================

// Add property
router.post(
  "/",
  protect,
  authorize("SuperAdmin", "Agent"),
  createProperty
);

// AI create property
router.post(
  "/ai-create",
  aiAutomationAuth,
  authorize("SuperAdmin", "Agent"),
  aiCreateProperty
);

// Save draft
router.post(
  "/draft",
  protect,
  authorize("SuperAdmin", "Agent"),
  saveDraft
);

// Draft → Live
router.patch(
  "/publish/:id",
  protect,
  authorize("SuperAdmin", "Agent"),
  publishDraft
);

// Delete property
router.delete(
  "/:id",
  protect,
  authorize("SuperAdmin", "Agent"),
  deleteProperty
);

// Restore property
router.patch(
  "/:id/restore",
  protect,
  authorize("SuperAdmin", "Agent"),
  restoreProperty
);

// Get single property
router.get(
  "/:id",
  protect,
  authorize("SuperAdmin", "Agent"),
  getPropertyById
);

// Update property
router.patch(
  "/:id",
  protect,
  authorize("SuperAdmin", "Agent"),
  updateProperty
);

// Move to trash
router.patch(
  "/:id/trash",
  protect,
  authorize("SuperAdmin", "Agent"),
  moveToTrash
);

// ============================================================
// SUPERADMIN ONLY
// ============================================================

// Restore from trash
router.patch(
  "/:id/restore-trash",
  protect,
  authorize("SuperAdmin"),
  restoreTrash
);

// Permanently delete property
router.delete(
  "/:id/permanent-delete",
  protect,
  authorize("SuperAdmin"),
  permanentDeleteProperty
);

module.exports = router;