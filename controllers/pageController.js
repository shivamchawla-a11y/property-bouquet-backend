const Page = require("../models/Page");

// ================= CREATE PAGE =================
exports.createPage = async (req, res) => {
  try {
    const { title, slug, pageType } = req.body;

    if (!title || !slug) {
      return res.status(400).json({
        success: false,
        message: "Title and slug required",
      });
    }

    const existing = await Page.findOne({ slug });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Slug already exists",
      });
    }

    const page = await Page.create({
      title,
      slug,
      pageType,
      createdBy: req.user?.id,
    });

    res.status(201).json({
      success: true,
      data: page,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ================= GET PAGES =================
exports.getPages = async (req, res) => {
  try {
    const pages = await Page.find().sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      data: pages,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};