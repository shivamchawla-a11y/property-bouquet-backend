const Page = require("../models/Page");

// ================= CREATE PAGE =================
exports.createPage = async (req, res) => {
  try {
    const { title, slug, pageType } = req.body;

    // ================= VALIDATION =================
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required ❌",
      });
    }

    // ================= HOME PAGE LOGIC =================
    let finalSlug = slug;

    if (pageType === "Home") {
      finalSlug = "";
    }

    // ================= DUPLICATE HOME PAGE CHECK =================
    if (pageType === "Home") {
      const existingHome = await Page.findOne({
        pageType: "Home",
      });

      if (existingHome) {
        return res.status(400).json({
          success: false,
          message: "Homepage already exists ❌",
        });
      }
    }

    // ================= DUPLICATE SLUG CHECK =================
    if (finalSlug) {
      const existing = await Page.findOne({
        slug: finalSlug,
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Slug already exists ❌",
        });
      }
    }

    // ================= CREATE =================
    const page = await Page.create({
      title,
      slug: finalSlug,
      pageType,
      createdBy: req.user?.id,
    });

    res.status(201).json({
      success: true,
      data: page,
    });

  } catch (err) {
    console.error("CREATE PAGE ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ================= GET PAGES =================
exports.getPages = async (req, res) => {
  try {
    const pages = await Page.find()
      .sort({
        createdAt: -1,
      });

    res.json({
      success: true,
      data: pages,
    });

  } catch (err) {
    console.error("GET PAGES ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ================= GET HOMEPAGE =================
exports.getHomepage = async (req, res) => {
  try {
    const homepage = await Page.findOne({
      pageType: "Home",
      isActive: true,
    });

    res.json({
      success: true,
      data: homepage,
    });

  } catch (err) {
    console.error("GET HOMEPAGE ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};