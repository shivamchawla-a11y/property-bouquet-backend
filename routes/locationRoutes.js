const express = require("express");
const router = express.Router();

const {
  createLocation,
  getLocations,
  getLocationsTree,
  deleteLocation,
  updateLocation, // ✅ ADD THIS
} = require("../controllers/locationController");

// CREATE
router.post("/", createLocation);

// GET FLAT
router.get("/", getLocations);

// TREE
router.get("/tree", getLocationsTree);

// UPDATE ✅
router.patch("/:id", updateLocation);

// DELETE
router.delete("/:id", deleteLocation);

module.exports = router;