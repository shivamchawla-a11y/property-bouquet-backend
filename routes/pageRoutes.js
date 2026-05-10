const express = require("express");

const router = express.Router();

const {
  createPage,
  getPages,
  getHomepage,
} = require("../controllers/pageController");

const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createPage);
router.get("/", protect, getPages);
router.get("/homepage", getHomepage);

module.exports = router;