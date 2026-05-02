const express = require("express");
const router = express.Router();

const {
  createDeveloper,
  getDevelopers,
  deleteDeveloper,
} = require("../controllers/developerController");

router.post("/", createDeveloper);
router.get("/", getDevelopers);
router.delete("/:id", deleteDeveloper);

module.exports = router;