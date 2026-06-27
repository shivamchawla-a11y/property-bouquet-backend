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

const router = express.Router();

// ================= PUBLIC =================

router.get("/", getAllKnowledge);

router.get(
  "/slug/:slug",
  getKnowledgeBySlug
);

router.get(
  "/trash/all",
  getTrashKnowledge
);

router.get(
  "/:id",
  getKnowledgeById
);

// ================= ADMIN =================

router.post(
  "/create",
  createKnowledge
);

router.put(
  "/update/:id",
  updateKnowledge
);

router.put(
  "/trash/:id",
  trashKnowledge
);

router.put(
  "/restore/:id",
  restoreKnowledge
);

router.delete(
  "/delete/:id",
  deleteKnowledge
);

module.exports = router;