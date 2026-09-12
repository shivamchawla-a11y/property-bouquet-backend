const Knowledge = require("../models/Knowledge");

/*
|--------------------------------------------------------------------------
| HELPER
|--------------------------------------------------------------------------
*/

const isValidObjectId = (id) => {
  return /^[a-f\d]{24}$/i.test(String(id || ""));
};

/*
|--------------------------------------------------------------------------
| GET ALL ACTIVE ARTICLES
|--------------------------------------------------------------------------
|
| Public:
|   GET /api/knowledge
|
| Admin can also use:
|   GET /api/knowledge?trash=true
|
| Normal request:
|   isDeleted = false
|
| Trash request:
|   isDeleted = true
|
|--------------------------------------------------------------------------
*/

exports.getAllKnowledge = async (req, res) => {
  try {
    const {
      status,
      category,
      featured,
      search,
      trash,
    } = req.query;

    const query = {};

    /*
     * ------------------------------------------------------------
     * SOFT DELETE FILTER
     * ------------------------------------------------------------
     *
     * NEVER return deleted articles in the normal listing.
     */
    if (trash === "true") {
      query.isDeleted = true;
    } else {
      query.isDeleted = false;
    }

    /*
     * ------------------------------------------------------------
     * STATUS
     * ------------------------------------------------------------
     */

    if (status) {
      query.status = status;
    }

    /*
     * ------------------------------------------------------------
     * CATEGORY
     * ------------------------------------------------------------
     */

    if (category) {
      query.category = category;
    }

    /*
     * ------------------------------------------------------------
     * FEATURED
     * ------------------------------------------------------------
     */

    if (featured !== undefined) {
      query.featured = featured === "true";
    }

    /*
     * ------------------------------------------------------------
     * SEARCH
     * ------------------------------------------------------------
     */

    if (search && search.trim()) {
      const searchValue = search.trim();

      query.$or = [
        {
          title: {
            $regex: searchValue,
            $options: "i",
          },
        },
        {
          shortDescription: {
            $regex: searchValue,
            $options: "i",
          },
        },
        {
          slug: {
            $regex: searchValue,
            $options: "i",
          },
        },
      ];
    }

    const articles = await Knowledge.find(query).sort({
      publishDate: -1,
      updatedAt: -1,
      createdAt: -1,
    });

    return res.json({
      success: true,
      count: articles.length,
      data: articles,
    });
  } catch (err) {
    console.error(
      "GET KNOWLEDGE ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to fetch knowledge articles.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET SINGLE ARTICLE
|--------------------------------------------------------------------------
|
| ADMIN ONLY
|
|--------------------------------------------------------------------------
*/

exports.getKnowledgeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid article ID.",
      });
    }

    const article = await Knowledge.findById(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found.",
      });
    }

    return res.json({
      success: true,
      data: article,
    });
  } catch (err) {
    console.error(
      "GET KNOWLEDGE BY ID ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to fetch article.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET ARTICLE BY SLUG
|--------------------------------------------------------------------------
|
| PUBLIC
|
| Only:
|   published
|   isDeleted = false
|
|--------------------------------------------------------------------------
*/

exports.getKnowledgeBySlug = async (req, res) => {
  try {
    const slug = String(
      req.params.slug || ""
    ).trim();

    const article = await Knowledge.findOne({
      slug,
      status: "published",
      isDeleted: false,
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found.",
      });
    }

    /*
     * Increment views without changing
     * the article returned to the browser.
     */
    await Knowledge.findByIdAndUpdate(
      article._id,
      {
        $inc: {
          views: 1,
        },
      }
    );

    return res.json({
      success: true,
      data: article,
    });
  } catch (err) {
    console.error(
      "GET KNOWLEDGE BY SLUG ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to fetch article.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| CREATE
|--------------------------------------------------------------------------
*/

exports.createKnowledge = async (req, res) => {
  try {
    const body = {
      ...req.body,

      /*
       * Every newly-created article must start
       * outside the Trash.
       */
      isDeleted: false,
    };

    const article = await Knowledge.create(body);

    return res.status(201).json({
      success: true,
      message: "Knowledge article created successfully.",
      data: article,
    });
  } catch (err) {
    console.error(
      "CREATE KNOWLEDGE ERROR:",
      err
    );

    /*
     * Duplicate slug
     */
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "Slug already exists. Please use a different slug.",
      });
    }

    /*
     * Mongoose validation
     */
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message:
          Object.values(err.errors)
            .map((error) => error.message)
            .join(", ") ||
          "Validation failed.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to create knowledge article.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE
|--------------------------------------------------------------------------
|
| IMPORTANT:
| isDeleted is intentionally removed from req.body.
|
| This prevents the normal Edit/Update endpoint from
| accidentally bypassing Trash/Restore logic.
|
|--------------------------------------------------------------------------
*/

exports.updateKnowledge = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid article ID.",
      });
    }

    /*
     * Do not allow normal update requests to
     * change the deletion state.
     */
    const updateData = {
      ...req.body,
    };

    delete updateData.isDeleted;

    /*
     * Find article first.
     */
    const existingArticle =
      await Knowledge.findById(id);

    if (!existingArticle) {
      return res.status(404).json({
        success: false,
        message: "Article not found.",
      });
    }

    /*
     * Don't edit an article that is in Trash
     * through the normal Update endpoint.
     */
    if (existingArticle.isDeleted === true) {
      return res.status(400).json({
        success: false,
        message:
          "This article is in Trash. Restore it before editing.",
      });
    }

    const article =
      await Knowledge.findByIdAndUpdate(
        id,
        {
          $set: updateData,
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found.",
      });
    }

    return res.json({
      success: true,
      message: "Knowledge article updated successfully.",
      data: article,
    });
  } catch (err) {
    console.error(
      "UPDATE KNOWLEDGE ERROR:",
      err
    );

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "Slug already exists. Please use a different slug.",
      });
    }

    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message:
          Object.values(err.errors)
            .map((error) => error.message)
            .join(", ") ||
          "Validation failed.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to update knowledge article.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| MOVE TO TRASH — SOFT DELETE
|--------------------------------------------------------------------------
|
| THIS DOES NOT DELETE THE MONGODB DOCUMENT.
|
| It only changes:
|
|     isDeleted = true
|
|--------------------------------------------------------------------------
*/

exports.trashKnowledge = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid article ID.",
      });
    }

    const article =
      await Knowledge.findById(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found.",
      });
    }

    /*
     * Already in Trash.
     */
    if (article.isDeleted === true) {
      return res.status(400).json({
        success: false,
        message: "Article is already in Trash.",
      });
    }

    /*
     * SOFT DELETE ONLY.
     *
     * No findByIdAndDelete here.
     */
    article.isDeleted = true;
article.deletedAt = new Date();
article.status = "draft";

await article.save();

    return res.json({
      success: true,
      message:
        "Article moved to Trash successfully.",
      data: article,
    });
  } catch (err) {
    console.error(
      "TRASH KNOWLEDGE ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to move article to Trash.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| RESTORE FROM TRASH
|--------------------------------------------------------------------------
*/

exports.restoreKnowledge = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid article ID.",
      });
    }

    const article =
      await Knowledge.findById(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found.",
      });
    }

    /*
     * Only restore something that is actually
     * in Trash.
     */
    if (article.isDeleted !== true) {
      return res.status(400).json({
        success: false,
        message:
          "Article is not currently in Trash.",
      });
    }

    article.isDeleted = false;
article.deletedAt = null;
article.status = "draft";

await article.save();

    return res.json({
      success: true,
      message:
        "Article restored successfully.",
      data: article,
    });
  } catch (err) {
    console.error(
      "RESTORE KNOWLEDGE ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to restore article.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET TRASH
|--------------------------------------------------------------------------
|
| ADMIN ONLY
|
|--------------------------------------------------------------------------
*/

exports.getTrashKnowledge = async (req, res) => {
  try {
    const articles =
      await Knowledge.find({
        isDeleted: true,
      }).sort({
        updatedAt: -1,
        createdAt: -1,
      });

    return res.json({
      success: true,
      count: articles.length,
      data: articles,
    });
  } catch (err) {
    console.error(
      "GET KNOWLEDGE TRASH ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to fetch Trash.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| DELETE FOREVER
|--------------------------------------------------------------------------
|
| THIS IS THE ONLY FUNCTION THAT ACTUALLY REMOVES
| THE MONGODB DOCUMENT.
|
| It is also protected so that an active article
| cannot accidentally be permanently deleted.
|
|--------------------------------------------------------------------------
*/

exports.deleteKnowledge = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid article ID.",
      });
    }

    const article =
      await Knowledge.findById(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found.",
      });
    }

    /*
     * SAFETY CHECK:
     *
     * Permanent deletion is allowed ONLY
     * when the article is already in Trash.
     */
    if (article.isDeleted !== true) {
      return res.status(400).json({
        success: false,
        message:
          "Only articles in Trash can be permanently deleted.",
      });
    }

    /*
     * THIS is the actual permanent deletion.
     */
    await Knowledge.findByIdAndDelete(id);

    return res.json({
      success: true,
      message:
        "Article permanently deleted from the database.",
    });
  } catch (err) {
    console.error(
      "PERMANENT DELETE KNOWLEDGE ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to permanently delete article.",
    });
  }
};