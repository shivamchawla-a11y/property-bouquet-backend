const express = require("express");

const router = express.Router();

const {
  subscribeNewsletter,
  getNewsletterSubscribers,
  deleteNewsletterSubscriber,
} = require("../controllers/newsLetterController");


/* =========================================================
   SUBSCRIBE
========================================================= */

router.post(
  "/subscribe",
  subscribeNewsletter
);


/* =========================================================
   GET SUBSCRIBERS
========================================================= */

router.get(
  "/",
  getNewsletterSubscribers
);


/* =========================================================
   DELETE SUBSCRIBER
========================================================= */

router.delete(
  "/:id",
  deleteNewsletterSubscriber
);


module.exports = router;