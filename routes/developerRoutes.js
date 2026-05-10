const express = require("express");
const router = express.Router();

const {
  createDeveloper,
  getDevelopers,
  deleteDeveloper,
  getDeveloperBySlug,
} = require("../controllers/developerController");

router.post("/", createDeveloper);
router.get("/", getDevelopers);
router.get("/:slug", getDeveloperBySlug);
router.delete("/:id", deleteDeveloper);

module.exports = router;