const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const { uploadImage } = require("../controllers/uploadController");

// 🔥 MUST MATCH frontend: "file"
router.post("/", upload.single("file"), uploadImage);

module.exports = router;