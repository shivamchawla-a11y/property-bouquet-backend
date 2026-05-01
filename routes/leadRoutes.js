const express = require("express");
const router = express.Router();

const {
  createLead,
  getLeads,
  updateLead,
  deleteLead,
} = require("../controllers/leadController");

const { protect, authorize } = require("../middleware/authMiddleware");

// 🔓 PUBLIC (for website forms)
router.post("/", createLead);

// 🔒 ADMIN ONLY
router.get("/", protect, authorize("SuperAdmin"), getLeads);

router.patch("/:id", protect, authorize("SuperAdmin"), updateLead);

router.delete("/:id", protect, authorize("SuperAdmin"), deleteLead);

module.exports = router;