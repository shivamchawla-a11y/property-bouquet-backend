const express = require("express");

const {
getAllNews,
getNewsById,
getNewsBySlug,
createNews,
updateNews,
trashNews,
restoreNews,
getTrashNews,
deleteNews,
} = require("../controllers/newsController");

const router =
express.Router();

// ================= PUBLIC =================

router.get("/", getAllNews);

router.get(
"/slug/:slug",
getNewsBySlug
);

router.get(
"/trash/all",
getTrashNews
);

router.get(
"/:id",
getNewsById
);

// ================= ADMIN =================

router.post(
"/create",
createNews
);

router.put(
"/update/:id",
updateNews
);

router.put(
"/trash/:id",
trashNews
);

router.put(
"/restore/:id",
restoreNews
);


router.delete(
"/delete/:id",
deleteNews
);

module.exports = router;
