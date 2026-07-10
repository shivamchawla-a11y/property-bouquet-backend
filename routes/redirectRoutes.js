const express = require("express");

const router = express.Router();

const {
  getRedirects,
  getRedirect,
  createRedirect,
  updateRedirect,
  deleteRedirect,
  toggleRedirect,
} = require("../controllers/redirectController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

// Apply middleware to every route
router.use(
  protect,
  authorize("SuperAdmin")
);

// ================= GET ALL =================
router.get("/", getRedirects);

// ================= GET SINGLE =================
router.get("/:id", getRedirect);

// ================= CREATE =================
router.post("/", createRedirect);

// ================= UPDATE =================
router.put("/:id", updateRedirect);

// ================= TOGGLE =================
router.patch("/:id/toggle", toggleRedirect);

// ================= DELETE =================
router.delete("/:id", deleteRedirect);

module.exports = router;