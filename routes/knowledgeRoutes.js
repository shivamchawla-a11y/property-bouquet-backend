const express = require("express");

const {
  getAllKnowledge,
  getKnowledgeById,
  getKnowledgeBySlug,
  createKnowledge,
  updateKnowledge,
  trashKnowledge,
  restoreKnowledge,
  getTrashKnowledge,
  deleteKnowledge,
} = require("../controllers/knowledgeController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES
|--------------------------------------------------------------------------
*/

/*
 * Public Knowledge Centre listing.
 *
 * IMPORTANT:
 * getAllKnowledge always returns isDeleted:false unless
 * trash=true is explicitly requested.
 *
 * Public users therefore never receive trashed articles.
 */
router.get("/", getAllKnowledge);

/*
 * Public article by slug.
 *
 * Controller additionally requires:
 * status = published
 * isDeleted = false
 */
router.get("/slug/:slug", getKnowledgeBySlug);

/*
|--------------------------------------------------------------------------
| ADMIN ROUTES
|--------------------------------------------------------------------------
*/

/*
 * Everything below this point requires authentication.
 */
router.use(protect);

/*
 * Get a single article for admin/editing.
 */
router.get("/:id", getKnowledgeById);

/*
 * Trash listing.
 *
 * This is NOT public.
 */
router.get(
  "/trash/all",
  authorize("Agent", "SuperAdmin"),
  getTrashKnowledge
);

/*
 * Create article.
 */
router.post(
  "/create",
  authorize("Agent", "SuperAdmin"),
  createKnowledge
);

/*
 * Update article.
 */
router.put(
  "/update/:id",
  authorize("Agent", "SuperAdmin"),
  updateKnowledge
);

/*
 * SOFT DELETE
 *
 * Article remains in MongoDB.
 * Only isDeleted becomes true.
 */
router.put(
  "/trash/:id",
  authorize("Agent", "SuperAdmin"),
  trashKnowledge
);

/*
 * RESTORE FROM TRASH
 *
 * Article remains in MongoDB.
 * isDeleted becomes false.
 */
router.put(
  "/restore/:id",
  authorize("Agent", "SuperAdmin"),
  restoreKnowledge
);

/*
 * PERMANENT DELETE
 *
 * Only SuperAdmin can permanently remove
 * an article from MongoDB.
 */
router.delete(
  "/delete/:id",
  authorize("SuperAdmin"),
  deleteKnowledge
);

module.exports = router;