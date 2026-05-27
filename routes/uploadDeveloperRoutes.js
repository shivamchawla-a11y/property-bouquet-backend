const express = require("express");

const router = express.Router();

const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
});

const {
  uploadDeveloperImage,
} = require(
  "../controllers/uploadDeveloperController"
);

router.post(
  "/",
  upload.single("file"),
  uploadDeveloperImage
);

module.exports = router;