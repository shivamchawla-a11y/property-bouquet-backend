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
  updateLocationPageContent,
  getLocationById,
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

router.get(
  "/by-id/:id",
  getLocationById
);

// ============================================================
// LOCATION PAGE CONTENT
// ============================================================

router.patch(
  "/page-content/:id",
  updateLocationPageContent
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