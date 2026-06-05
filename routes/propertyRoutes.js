const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");

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

// PUBLIC
router.get("/", getProperties);

// 🔥 NEW ROUTE
router.get("/slug/:slug", getPropertyBySlug);

router.post(
  "/draft",
  protect,
  authorize("SuperAdmin"),
  saveDraft
);

router.patch(
  "/publish/:id",
  protect,
  authorize("SuperAdmin"),
  publishDraft
);

// ADMIN
router.post("/", protect, authorize("SuperAdmin"), createProperty);

router.delete("/:id", protect, authorize("SuperAdmin"), deleteProperty);

router.patch("/:id/restore", protect, authorize("SuperAdmin"), restoreProperty);

router.get(
  "/preview/:slug",
  getPropertyPreview
);
// ✅ GET SINGLE PROPERTY (EDIT)
router.get("/:id", protect, authorize("SuperAdmin"), getPropertyById);

// ✅ UPDATE PROPERTY
router.patch("/:id", protect, authorize("SuperAdmin"), updateProperty);

router.patch(
  "/:id/trash",
  protect,
  authorize("SuperAdmin"),
  moveToTrash
);

router.patch(
  "/:id/restore-trash",
  protect,
  authorize("SuperAdmin"),
  restoreTrash
);

router.delete(
  "/:id/permanent-delete",
  protect,
  authorize("SuperAdmin"),
  permanentDeleteProperty
);

module.exports = router;