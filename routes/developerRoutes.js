const express = require("express");

const router = express.Router();

const {
  createDeveloper,
  getDevelopers,
  deleteDeveloper,
  getDeveloperBySlug,
  getDeveloperByPublicSlug,
  updateDeveloper,
} = require(
  "../controllers/developerController"
);

// ============================================================
// CREATE
// ============================================================

router.post(
  "/",
  createDeveloper
);

// ============================================================
// GET ALL DEVELOPERS
// ============================================================

router.get(
  "/",
  getDevelopers
);

// ============================================================
// GET DEVELOPER BY PUBLIC SEO SLUG
// MUST COME BEFORE /:slug
// ============================================================
//
// Example:
//
// /api/developers/public/m3m-developer-projects
//
// /api/developers/public/spiti-developer-projects
//
// /api/developers/public/spiti-developers-projects
//
// ============================================================

router.get(
  "/public/:publicSlug",
  getDeveloperByPublicSlug
);

// ============================================================
// UPDATE
// ============================================================

router.put(
  "/:id",
  updateDeveloper
);

// ============================================================
// GET SINGLE BY BACKEND SLUG
// ============================================================
//
// Existing/backend URL:
//
// /api/developers/m3m
//
// ============================================================

router.get(
  "/:slug",
  getDeveloperBySlug
);

// ============================================================
// DELETE
// ============================================================

router.delete(
  "/:id",
  deleteDeveloper
);

module.exports = router;