
const express = require("express");
const multer = require("multer");

const {
  getAllKnowledge,
  getLatestKnowledge,
  getKnowledgeById,
  getKnowledgeBySlug,
  createKnowledge,
  updateKnowledge,
  trashKnowledge,
  restoreKnowledge,
  getTrashKnowledge,
  deleteKnowledge,
  uploadKnowledgeImage,
} = require("../controllers/knowledgeController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();


// ============================================================
// MULTER
// ============================================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(
        new Error("Only image files are allowed.")
      );
    }
  },
});


// ============================================================
// PUBLIC ROUTES
// ============================================================

// Knowledge Centre listing
router.get("/", getAllKnowledge);

// Homepage: latest five published articles
router.get("/latest", getLatestKnowledge);

// Public article by slug
router.get("/slug/:slug", getKnowledgeBySlug);


// ============================================================
// ADMIN ROUTES
// ============================================================

router.use(protect);

// Upload article image
router.post(
  "/upload-image",
  authorize("Agent", "SuperAdmin"),
  upload.single("image"),
  uploadKnowledgeImage
);

// Get single article for editing
router.get("/:id", getKnowledgeById);

// Get Trash
router.get(
  "/trash/all",
  authorize("Agent", "SuperAdmin"),
  getTrashKnowledge
);

// Create
router.post(
  "/create",
  authorize("Agent", "SuperAdmin"),
  createKnowledge
);

// Update
router.put(
  "/update/:id",
  authorize("Agent", "SuperAdmin"),
  updateKnowledge
);

// Move to Trash
router.put(
  "/trash/:id",
  authorize("Agent", "SuperAdmin"),
  trashKnowledge
);

// Restore
router.put(
  "/restore/:id",
  authorize("Agent", "SuperAdmin"),
  restoreKnowledge
);

// Permanently delete — SuperAdmin only
router.delete(
  "/delete/:id",
  authorize("SuperAdmin"),
  deleteKnowledge
);

module.exports = router;
