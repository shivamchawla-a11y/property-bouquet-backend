const express = require("express");
const router = express.Router();

const {
  createDeveloper,
  getDevelopers,
  deleteDeveloper,
  getDeveloperBySlug,
  updateDeveloper,
} = require(
  "../controllers/developerController"
);

// CREATE
router.post("/", createDeveloper);

// GET ALL
router.get("/", getDevelopers);

// UPDATE
router.put("/:id", updateDeveloper);

// GET SINGLE
router.get("/:slug", getDeveloperBySlug);

// DELETE
router.delete("/:id", deleteDeveloper);

module.exports = router;