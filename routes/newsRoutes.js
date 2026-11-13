
const express = require("express");

const {
  getAllNews,
  getLatestNews,
  getNewsById,
  getNewsForEdit,
  getNewsBySlug,
  createNews,
  updateNews,
  trashNews,
  restoreNews,
  getTrashNews,
  deleteNews,
} = require("../controllers/newsController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ================= PUBLIC ROUTES =================

router.get("/", getAllNews);

router.get("/latest", getLatestNews);

router.get("/slug/:slug", getNewsBySlug);

// ================= ADMIN ROUTES =================

// GET TRASH
router.get(
  "/trash/all",
  protect,
  authorize("Agent", "SuperAdmin"),
  getTrashNews
);

// GET FOR EDIT
router.get(
  "/edit/:id",
  protect,
  authorize("Agent", "SuperAdmin"),
  getNewsForEdit
);

// GET SINGLE NEWS BY ID
router.get(
  "/:id",
  protect,
  authorize("Agent", "SuperAdmin"),
  getNewsById
);

// CREATE
router.post(
  "/create",
  protect,
  authorize("Agent", "SuperAdmin"),
  createNews
);

// UPDATE
router.put(
  "/update/:id",
  protect,
  authorize("Agent", "SuperAdmin"),
  updateNews
);

// MOVE TO TRASH
router.put(
  "/trash/:id",
  protect,
  authorize("Agent", "SuperAdmin"),
  trashNews
);

// RESTORE
router.put(
  "/restore/:id",
  protect,
  authorize("Agent", "SuperAdmin"),
  restoreNews
);

// PERMANENT DELETE — SUPER ADMIN ONLY
router.delete(
  "/delete/:id",
  protect,
  authorize("SuperAdmin"),
  deleteNews
);

module.exports = router;
