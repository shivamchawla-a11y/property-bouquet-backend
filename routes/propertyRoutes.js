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
router.get("/slug/:slug", getPropertyBySlug);

router.get(
  "/preview/:slug",
  protect,
  authorize("SuperAdmin", "Agent"),
  getPropertyPreview
);



// ============================================================
// AGENT + SUPERADMIN
// ============================================================

// ------------------------------------------------------------
// ADD PROPERTY
// Agent + SuperAdmin
// ------------------------------------------------------------
router.post(
  "/",
  protect,
  authorize("SuperAdmin", "Agent"),
  createProperty
);


// ------------------------------------------------------------
// SAVE DRAFT
// Agent + SuperAdmin
// ------------------------------------------------------------
router.post(
  "/draft",
  protect,
  authorize("SuperAdmin", "Agent"),
  saveDraft
);


// ------------------------------------------------------------
// DRAFT → LIVE
// Agent + SuperAdmin
// ------------------------------------------------------------
router.patch(
  "/publish/:id",
  protect,
  authorize("SuperAdmin", "Agent"),
  publishDraft
);


// ------------------------------------------------------------
// LIVE → DRAFT
// Agent + SuperAdmin
// ------------------------------------------------------------
router.delete(
  "/:id",
  protect,
  authorize("SuperAdmin", "Agent"),
  deleteProperty
);


// ------------------------------------------------------------
// DRAFT → LIVE
// Agent + SuperAdmin
// ------------------------------------------------------------
router.patch(
  "/:id/restore",
  protect,
  authorize("SuperAdmin", "Agent"),
  restoreProperty
);


// ------------------------------------------------------------
// GET SINGLE PROPERTY
// Required for Edit Property
//
// Agent + SuperAdmin
// ------------------------------------------------------------
router.get(
  "/:id",
  protect,
  authorize("SuperAdmin", "Agent"),
  getPropertyById
);


// ------------------------------------------------------------
// UPDATE PROPERTY
// Agent + SuperAdmin
// ------------------------------------------------------------
router.patch(
  "/:id",
  protect,
  authorize("SuperAdmin", "Agent"),
  updateProperty
);


// ------------------------------------------------------------
// MOVE TO TRASH
//
// Agent + SuperAdmin
// Agent CAN move Live/Draft → Trash.
//
// Agent CANNOT see or restore Trash afterward.
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
//
// SuperAdmin ONLY
// ------------------------------------------------------------
router.patch(
  "/:id/restore-trash",
  protect,
  authorize("SuperAdmin"),
  restoreTrash
);


// ------------------------------------------------------------
// DELETE FOREVER
//
// SuperAdmin ONLY
// ------------------------------------------------------------
router.delete(
  "/:id/permanent-delete",
  protect,
  authorize("SuperAdmin"),
  permanentDeleteProperty
);


module.exports = router;