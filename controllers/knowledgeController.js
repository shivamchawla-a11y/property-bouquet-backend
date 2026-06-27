const Knowledge = require("../models/Knowledge");

// ================= GET ALL ARTICLES =================
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

    // ================= TRASH =================
    if (trash === "true") {
      query.isDeleted = true;
    } else {
      query.isDeleted = false;
    }

    // ================= STATUS =================
    if (status) {
      query.status = status;
    }

    // ================= CATEGORY =================
    if (category) {
      query.category = category;
    }

    // ================= FEATURED =================
    if (featured !== undefined) {
      query.featured = featured === "true";
    }

    // ================= SEARCH =================
    if (search) {
      query.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          shortDescription: {
            $regex: search,
            $options: "i",
          },
        },
        {
          slug: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const articles = await Knowledge.find(query).sort({
      publishDate: -1,
    });

    res.json({
      success: true,
      count: articles.length,
      data: articles,
    });
  } catch (err) {
    console.error("GET KNOWLEDGE ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};

// ================= GET SINGLE =================
exports.getKnowledgeById = async (req, res) => {
  try {
    const article = await Knowledge.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found ❌",
      });
    }

    res.json({
      success: true,
      data: article,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ================= GET BY SLUG =================
exports.getKnowledgeBySlug = async (req, res) => {
  try {
    const article = await Knowledge.findOne({
      slug: req.params.slug,
      status: "published",
      isDeleted: false,
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found ❌",
      });
    }

    await Knowledge.findByIdAndUpdate(article._id, {
      $inc: {
        views: 1,
      },
    });

    res.json({
      success: true,
      data: article,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ================= CREATE =================
exports.createKnowledge = async (req, res) => {
  try {
    const article = await Knowledge.create(req.body);

    res.status(201).json({
      success: true,
      data: article,
    });
  } catch (err) {
    console.error(err);

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Slug already exists ❌",
      });
    }

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ================= UPDATE =================
exports.updateKnowledge = async (req, res) => {
  try {
    const article = await Knowledge.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found ❌",
      });
    }

    res.json({
      success: true,
      data: article,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ================= MOVE TO TRASH =================
exports.trashKnowledge = async (req, res) => {
  try {
    const article = await Knowledge.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: true,
      },
      {
        new: true,
      }
    );

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found ❌",
      });
    }

    res.json({
      success: true,
      message: "Moved to trash ✅",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ================= RESTORE =================
exports.restoreKnowledge = async (req, res) => {
  try {
    const article = await Knowledge.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: false,
      },
      {
        new: true,
      }
    );

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found ❌",
      });
    }

    res.json({
      success: true,
      message: "Restored successfully ✅",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ================= TRASH LIST =================
exports.getTrashKnowledge = async (req, res) => {
  try {
    const articles = await Knowledge.find({
      isDeleted: true,
    }).sort({
      updatedAt: -1,
    });

    res.json({
      success: true,
      count: articles.length,
      data: articles,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ================= DELETE FOREVER =================
exports.deleteKnowledge = async (req, res) => {
  try {
    const article = await Knowledge.findByIdAndDelete(
      req.params.id
    );

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found ❌",
      });
    }

    res.json({
      success: true,
      message: "Deleted permanently ✅",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};