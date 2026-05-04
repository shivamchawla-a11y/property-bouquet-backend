const Property = require("../models/Property");

// ✅ CREATE PROPERTY
exports.createProperty = async (req, res) => {
  try {
    const { marketType, coreDetails, unitConfigurations, slug } = req.body;

    // ================= VALIDATION =================
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Slug is required ❌",
      });
    }

    if (!marketType) {
      return res.status(400).json({
        success: false,
        message: "Market type is required ❌",
      });
    }

    if (!coreDetails?.title) {
      return res.status(400).json({
        success: false,
        message: "Title is required ❌",
      });
    }

    if (!coreDetails?.startingPrice) {
      return res.status(400).json({
        success: false,
        message: "Starting price is required ❌",
      });
    }

    // ================= CONFIG VALIDATION =================
    const hasValidConfig = unitConfigurations?.some(
      (u) => u.price && u.price.trim() !== ""
    );

    if (!hasValidConfig) {
      return res.status(400).json({
        success: false,
        message: "At least one configuration price is required ❌",
      });
    }

    // ================= DUPLICATE SLUG CHECK =================
    const existing = await Property.findOne({ slug });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Slug already exists ❌",
      });
    }

    // ================= 🔥 DEVELOPER LOGIC =================
    let developerData = {};

    if (coreDetails?.developerRef) {
      developerData = {
        developerRef: coreDetails.developerRef,
        developerName: "",
      };
    } else if (coreDetails?.developerName) {
      developerData = {
        developerRef: null,
        developerName: coreDetails.developerName,
      };
    }

    // ================= CREATE =================
    const property = await Property.create({
      ...req.body,
      coreDetails: {
        ...coreDetails,
        ...developerData,
      },
      createdBy: req.user?.id,
    });

    res.status(201).json({
      success: true,
      data: property,
    });

  } catch (err) {
    console.error("CREATE PROPERTY ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message || "Server error ❌",
    });
  }
};


// ✅ GET PROPERTIES
exports.getProperties = async (req, res) => {
  try {
    const showAll = req.query.all === "true";

    const filter = showAll ? {} : { isActive: true };

    const properties = await Property
      .find(filter)
      .populate("createdBy")
      .populate("coreDetails.developerRef", "name logo"); // 🔥 IMPORTANT

    res.status(200).json({
      success: true,
      data: properties,
    });

  } catch (error) {
    console.error("GET PROPERTIES ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ✅ SOFT DELETE
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found ❌",
      });
    }

    property.isActive = false;
    await property.save();

    res.json({
      success: true,
      message: "Property soft deleted ✅",
    });

  } catch (err) {
    console.error("DELETE ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// ✅ RESTORE PROPERTY
exports.restoreProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found ❌",
      });
    }

    property.isActive = true;
    await property.save();

    res.json({
      success: true,
      message: "Property restored ✅",
    });

  } catch (err) {
    console.error("RESTORE ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ✅ GET PROPERTY BY SLUG (FOR PREVIEW PAGE)
exports.getPropertyBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const property = await Property.findOne({
      slug,
      isActive: true, // 🔥 important (only show active)
    })
      .populate("createdBy")
      .populate("coreDetails.developerRef", "name logo");

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found ❌",
      });
    }

    res.json({
      success: true,
      data: property,
    });

  } catch (err) {
    console.error("GET PROPERTY BY SLUG ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};