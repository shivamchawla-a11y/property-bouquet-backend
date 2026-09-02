const express = require("express");

const router = express.Router();

const {
  protect,
  optionalProtect,
  authorize,
} = require("../middleware/authMiddleware");

const {
  createProperty,
  saveDraft,
  checkPropertyDuplicates,
  publishDraft,
  getProperties,
  deleteProperty,
  restoreProperty,
  moveToTrash,
  restoreTrash,
  permanentDeleteProperty,
  getPropertyBySlug,
  getPropertyPreview,
  updateProperty,
  getPropertyById,
} = require("../controllers/propertyController");

// ============================================================
// PUBLIC
// ============================================================

// Public property listing
router.get(
  "/",
  optionalProtect,
  getProperties
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
// IMPORTANT: THIS MUST BE BEFORE /:id
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

// ------------------------------------------------------------
// ADD PROPERTY
// ------------------------------------------------------------

router.post(
  "/",
  protect,
  authorize("SuperAdmin", "Agent"),
  createProperty
);

// ------------------------------------------------------------
// SAVE DRAFT
// ------------------------------------------------------------

router.post(
  "/draft",
  protect,
  authorize("SuperAdmin", "Agent"),
  saveDraft
);

// ------------------------------------------------------------
// DRAFT → LIVE
// ------------------------------------------------------------

router.patch(
  "/publish/:id",
  protect,
  authorize("SuperAdmin", "Agent"),
  publishDraft
);

// ------------------------------------------------------------
// LIVE → DRAFT
// ------------------------------------------------------------

router.delete(
  "/:id",
  protect,
  authorize("SuperAdmin", "Agent"),
  deleteProperty
);

// ------------------------------------------------------------
// DRAFT → LIVE
// ------------------------------------------------------------

router.patch(
  "/:id/restore",
  protect,
  authorize("SuperAdmin", "Agent"),
  restoreProperty
);

// ------------------------------------------------------------
// GET SINGLE PROPERTY
// IMPORTANT: KEEP THIS AFTER /check-duplicate
// ------------------------------------------------------------

router.get(
  "/:id",
  protect,
  authorize("SuperAdmin", "Agent"),
  getPropertyById
);

// ------------------------------------------------------------
// UPDATE PROPERTY
// ------------------------------------------------------------

router.patch(
  "/:id",
  protect,
  authorize("SuperAdmin", "Agent"),
  updateProperty
);

// ------------------------------------------------------------
// MOVE TO TRASH
// ------------------------------------------------------------

router.patch(
  "/:id/trash",
  protect,
  authorize("SuperAdmin", "Agent"),
  moveToTrash
);

// ============================================================
// SUPERADMIN ONLY
// ============================================================

// ------------------------------------------------------------
// RESTORE FROM TRASH
// ------------------------------------------------------------

router.patch(
  "/:id/restore-trash",
  protect,
  authorize("SuperAdmin"),
  restoreTrash
);

// ------------------------------------------------------------
// DELETE FOREVER
// ------------------------------------------------------------

router.delete(
  "/:id/permanent-delete",
  protect,
  authorize("SuperAdmin"),
  permanentDeleteProperty
);

module.exports = router;