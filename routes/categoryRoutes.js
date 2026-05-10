const express = require("express");
const router = express.Router();

const {
  createCategory,
  getCategories,
  deleteCategory,
  getCategoryTree,
  getCategoryBySlug,
} = require("../controllers/categoryController");

// ================= ROUTES =================

// CREATE
router.post("/", createCategory);

// FLAT LIST
router.get("/", getCategories);

// TREE
router.get("/tree", getCategoryTree);

// SLUG PAGE (IMPORTANT FOR FRONTEND)
router.get("/:slug", getCategoryBySlug);

// DELETE
router.delete("/:id", deleteCategory);

module.exports = router;