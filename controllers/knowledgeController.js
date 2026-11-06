
const Knowledge = require("../models/Knowledge");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

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
| GET ALL KNOWLEDGE ARTICLES
|--------------------------------------------------------------------------
| GET /api/knowledge
|
| Default:
|   isDeleted = false
|
| Trash:
|   isDeleted = true
|
| Listing endpoint excludes full article content.
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

    // SOFT DELETE FILTER
    if (trash === "true") {
      query.isDeleted = true;
    } else {
      query.isDeleted = false;
    }

    // STATUS
    if (status) {
      query.status = status;
    }

    // CATEGORY
    if (category) {
      query.category = category;
    }

    // FEATURED
    if (featured !== undefined) {
      query.featured = featured === "true";
    }

    // SEARCH
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

    /*
     * Listing pages do not need full article HTML.
     * Exclude content to reduce database transfer
     * and response size.
     */

    const articles = await Knowledge.find(query)
      .select(
        "-content -body -htmlContent -articleContent"
      )
      .sort({
        publishDate: -1,
        updatedAt: -1,
        createdAt: -1,
      })
      .lean()
      .maxTimeMS(5000);

    return res.status(200).json({
      success: true,
      count: articles.length,
      data: articles,
    });
  } catch (err) {
    console.error("GET KNOWLEDGE ERROR:", err);

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
| GET LATEST PUBLISHED KNOWLEDGE ARTICLES — HOMEPAGE
|--------------------------------------------------------------------------
| GET /api/knowledge/latest
|
| Returns only the five newest published articles.
|
| Performance:
| - MongoDB filters before retrieving results.
| - Only 5 records are returned.
| - Full article content is excluded.
| - Only homepage-required fields are selected.
| - lean() avoids unnecessary Mongoose document overhead.
| - maxTimeMS prevents an indefinitely long query.
|--------------------------------------------------------------------------
*/

exports.getLatestKnowledge = async (req, res) => {
  try {
    const articles = await Knowledge.find({
      status: "published",
      isDeleted: false,
    })
      .select(
        "_id title slug shortDescription featuredImage category author readTime featured publishDate createdAt updatedAt"
      )
      .sort({
        publishDate: -1,
        createdAt: -1,
      })
      .limit(5)
      .lean()
      .maxTimeMS(5000);

    res.set({
      "Cache-Control": "public, max-age=60, s-maxage=300",
    });

    return res.status(200).json({
      success: true,
      count: articles.length,
      data: articles,
    });
  } catch (err) {
    console.error(
      "GET LATEST KNOWLEDGE ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch latest knowledge articles.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| GET SINGLE ARTICLE BY ID
|--------------------------------------------------------------------------
| ADMIN
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

    return res.status(200).json({
      success: true,
      data: article,
    });
  } catch (err) {
    console.error("GET KNOWLEDGE BY ID ERROR:", err);

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
| PUBLIC
|
| Only published, non-deleted articles.
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

    // Increment views without changing the returned article.
    await Knowledge.findByIdAndUpdate(
      article._id,
      {
        $inc: {
          views: 1,
        },
      }
    );

    return res.status(200).json({
      success: true,
      data: article,
    });
  } catch (err) {
    console.error("GET KNOWLEDGE BY SLUG ERROR:", err);

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
| CREATE KNOWLEDGE ARTICLE
|--------------------------------------------------------------------------
*/

exports.createKnowledge = async (req, res) => {
  try {
    const body = {
      ...req.body,
      isDeleted: false,
    };

    const article = await Knowledge.create(body);

    return res.status(201).json({
      success: true,
      message: "Knowledge article created successfully.",
      data: article,
    });
  } catch (err) {
    console.error("CREATE KNOWLEDGE ERROR:", err);

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
        "Failed to create knowledge article.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| UPDATE KNOWLEDGE ARTICLE
|--------------------------------------------------------------------------
|
| Normal update cannot change isDeleted.
| Articles in Trash must be restored first.
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

    const updateData = {
      ...req.body,
    };

    delete updateData.isDeleted;
    delete updateData.deletedAt;

    const existingArticle =
      await Knowledge.findById(id);

    if (!existingArticle) {
      return res.status(404).json({
        success: false,
        message: "Article not found.",
      });
    }

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

    return res.status(200).json({
      success: true,
      message: "Knowledge article updated successfully.",
      data: article,
    });
  } catch (err) {
    console.error("UPDATE KNOWLEDGE ERROR:", err);

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
| MOVE KNOWLEDGE ARTICLE TO TRASH
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

    if (article.isDeleted === true) {
      return res.status(400).json({
        success: false,
        message: "Article is already in Trash.",
      });
    }

    article.isDeleted = true;
    article.deletedAt = new Date();
    article.status = "draft";

    await article.save();

    return res.status(200).json({
      success: true,
      message: "Article moved to Trash successfully.",
      data: article,
    });
  } catch (err) {
    console.error("TRASH KNOWLEDGE ERROR:", err);

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
| RESTORE KNOWLEDGE ARTICLE
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

    if (article.isDeleted !== true) {
      return res.status(400).json({
        success: false,
        message: "Article is not currently in Trash.",
      });
    }

    article.isDeleted = false;
    article.deletedAt = null;
    article.status = "draft";

    await article.save();

    return res.status(200).json({
      success: true,
      message: "Article restored successfully.",
      data: article,
    });
  } catch (err) {
    console.error("RESTORE KNOWLEDGE ERROR:", err);

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
| GET KNOWLEDGE TRASH
|--------------------------------------------------------------------------
| ADMIN ONLY
|--------------------------------------------------------------------------
*/

exports.getTrashKnowledge = async (req, res) => {
  try {
    const articles =
      await Knowledge.find({
        isDeleted: true,
      })
        .sort({
          updatedAt: -1,
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count: articles.length,
      data: articles,
    });
  } catch (err) {
    console.error("GET KNOWLEDGE TRASH ERROR:", err);

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
| PERMANENTLY DELETE KNOWLEDGE ARTICLE
|--------------------------------------------------------------------------
|
| Only articles already in Trash can be permanently deleted.
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

    if (article.isDeleted !== true) {
      return res.status(400).json({
        success: false,
        message:
          "Only articles in Trash can be permanently deleted.",
      });
    }

    await Knowledge.findByIdAndDelete(id);

    return res.status(200).json({
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


/*
|--------------------------------------------------------------------------
| UPLOAD KNOWLEDGE ARTICLE IMAGE
|--------------------------------------------------------------------------
|
| Uploads image buffer directly to Cloudinary.
|--------------------------------------------------------------------------
*/

exports.uploadKnowledgeImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file uploaded.",
      });
    }

    if (!req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({
        success: false,
        message: "Only image files are allowed.",
      });
    }

    const result = await new Promise(
      (resolve, reject) => {
        const uploadStream =
          cloudinary.uploader.upload_stream(
            {
              folder: "property-bouquet/knowledge",

              transformation: [
                {
                  fetch_format: "webp",
                  quality: "auto:best",
                },
              ],
            },
            (error, uploadedResult) => {
              if (error) {
                reject(error);
              } else {
                resolve(uploadedResult);
              }
            }
          );

        streamifier
          .createReadStream(req.file.buffer)
          .pipe(uploadStream);
      }
    );

    return res.status(200).json({
      success: true,
      url: result.secure_url,
    });
  } catch (err) {
    console.error(
      "KNOWLEDGE IMAGE UPLOAD ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to upload article image.",
    });
  }
};
