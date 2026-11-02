
const express = require("express");

const router = express.Router();

const {
  getHomeNavigation,
} = require("../controllers/navigationController");

router.get("/home", getHomeNavigation);

module.exports = router;
