const express = require("express");
const router = express.Router();

const {
  sendContactEnquiry,
} = require("../controllers/contactController");

router.post("/", sendContactEnquiry);

module.exports = router;