const express = require("express");

const router = express.Router();

const authMiddleware =
require("../middleware/authMiddleware");

const {
saveDraft,
getMyLastDraft,
getMyDrafts,
} = require("../controllers/propertyDraftController");

// ==========================================
// SAVE DRAFT
// ==========================================
router.post(
"/draft",
authMiddleware,
saveDraft
);

// ==========================================
// LAST DRAFT
// ==========================================
router.get(
"/my-last-draft",
authMiddleware,
getMyLastDraft
);

// ==========================================
// ALL DRAFTS
// ==========================================
router.get(
"/my-drafts",
authMiddleware,
getMyDrafts
);

module.exports = router;
