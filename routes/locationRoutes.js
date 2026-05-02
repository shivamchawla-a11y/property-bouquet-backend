const express = require("express");
const router = express.Router();

const {
  createLocation,
  getLocations,
  getLocationsTree,
  deleteLocation,
} = require("../controllers/locationController");

// 🔥 ROUTES

// CREATE
router.post("/", createLocation);

// GET FLAT LIST
router.get("/", getLocations);

// GET TREE (IMPORTANT FOR UI)
router.get("/tree", getLocationsTree);

// DELETE
router.delete("/:id", deleteLocation);

module.exports = router;