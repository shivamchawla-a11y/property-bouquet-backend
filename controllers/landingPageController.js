const LandingPage = require("../models/LandingPage");
const generateLandingPagesService = require("../services/landingPageGenerator");

// =====================================================
// GET ALL LANDING PAGES
// =====================================================

exports.getLandingPages = async (req, res) => {
  try {
    const pages = await LandingPage.find({
      isDeleted: false,
    })
      .sort({
        createdAt: -1,
      })
      .populate("createdBy", "name email")
      .lean();

    res.status(200).json({
      success: true,
      count: pages.length,
      data: pages,
    });
  } catch (error) {
    console.error("Get Landing Pages Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch landing pages.",
    });
  }
};

// =====================================================
// GET SINGLE LANDING PAGE
// =====================================================

exports.getLandingPage = async (req, res) => {
  try {
    const page = await LandingPage.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Landing page not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: page,
    });
  } catch (error) {
    console.error("Get Landing Page Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =====================================================
// GENERATE COLLECTIONS
// =====================================================

exports.generateLandingPages = async (req, res) => {
  try {
    const result = await generateLandingPagesService();

    res.status(200).json({
      success: true,
      message: "Collection generation completed successfully.",
      summary: result,
    });
  } catch (error) {
    console.error("Collection Generation Error");
console.error(error);
console.error(error.stack);

    res.status(500).json({
      success: false,
      message: "Failed to generate collections.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// =====================================================
// UPDATE LANDING PAGE
// =====================================================

exports.updateLandingPage = async (req, res) => {
  try {
    const page = await LandingPage.findOneAndUpdate(
      {
        _id: req.params.id,
        isDeleted: false,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Landing page not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Landing page updated successfully.",
      data: page,
    });
  } catch (error) {
    console.error("Update Landing Page Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update landing page.",
    });
  }
};

// =====================================================
// SOFT DELETE
// =====================================================

exports.deleteLandingPage = async (req, res) => {
  try {
    const page = await LandingPage.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: true,
      },
      {
        new: true,
      }
    );

    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Landing page not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Landing page moved to trash.",
    });
  } catch (error) {
    console.error("Delete Landing Page Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete landing page.",
    });
  }
};