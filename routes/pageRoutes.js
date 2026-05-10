const express = require("express");

const router = express.Router();

const {
  createPage,
  getPages,
} = require("../controllers/pageController");

const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createPage);
router.get("/", protect, getPages);

module.exports = router;