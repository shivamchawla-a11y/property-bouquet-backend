const express = require("express");
const router = express.Router();

const {
  createBuilder,
  getBuilders,
  deleteBuilder,
} = require("../controllers/builderController");

router.post("/", createBuilder);
router.get("/", getBuilders);
router.delete("/:id", deleteBuilder);

module.exports = router;