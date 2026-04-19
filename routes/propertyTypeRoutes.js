const express = require("express");
const router = express.Router();

const {
  createPropertyType,
  getPropertyTypes,
  deletePropertyType,
} = require("../controllers/propertyTypeController");

router.post("/", createPropertyType);
router.get("/", getPropertyTypes);
router.delete("/:id", deletePropertyType);

module.exports = router;