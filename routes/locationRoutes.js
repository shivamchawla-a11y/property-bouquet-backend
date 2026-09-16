const express = require("express");

const router = express.Router();

const {
  createLocation,
  getLocationBySlug,
  getLocationByPublicSlug,
  getLocations,
  getLocationsTree,
  deleteLocation,
  updateLocation,
} = require("../controllers/locationController");


// ============================================================
// CREATE
// ============================================================

router.post(
  "/",
  createLocation
);


// ============================================================
// GET FLAT
// ============================================================

router.get(
  "/",
  getLocations
);


// ============================================================
// TREE
// ============================================================

router.get(
  "/tree",
  getLocationsTree
);


// ============================================================
// PUBLIC SEO LOCATION URL
//
// IMPORTANT:
// This MUST come before "/:slug"
//
// Example:
//
// /api/locations/public/properties-in-sector-56-gurgaon
//
// ============================================================

router.get(
  "/public/:publicSlug",
  getLocationByPublicSlug
);


// ============================================================
// OLD / DATABASE SLUG API
//
// Example:
//
// /api/locations/sector-56
//
// This remains available for existing frontend/admin usage.
// ============================================================

router.get(
  "/:slug",
  getLocationBySlug
);


// ============================================================
// UPDATE
// ============================================================

router.patch(
  "/:id",
  updateLocation
);


// ============================================================
// DELETE
// ============================================================

router.delete(
  "/:id",
  deleteLocation
);


module.exports = router;