const express = require("express");
const router = express.Router();

const {
  createCategory,
  getCategories,
  deleteCategory,
  getCategoryTree, // 🔥 ADD THIS
} = require("../controllers/categoryController");

// ================= ROUTES =================

// CREATE
router.post("/", createCategory);

// GET FLAT LIST (optional)
router.get("/", getCategories);

// 🔥 GET TREE (IMPORTANT)
router.get("/tree", getCategoryTree);

// DELETE
router.delete("/:id", deleteCategory);

module.exports = router;