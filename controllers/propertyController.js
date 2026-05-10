const Property = require("../models/Property");

// ✅ CREATE PROPERTY
exports.createProperty = async (req, res) => {
  try {
    const { marketType, coreDetails, unitConfigurations, slug } = req.body;

    if (!slug || !marketType || !coreDetails?.title) {
      return res.status(400).json({ success: false, message: "Missing fields ❌" });
    }

    const existing = await Property.findOne({ slug });
    if (existing) {
      return res.status(400).json({ success: false, message: "Slug already exists ❌" });
    }

    const hasValidConfig = unitConfigurations?.some(u => u.price?.trim());
    if (!hasValidConfig) {
      return res.status(400).json({ success: false, message: "At least one config required ❌" });
    }

    const property = await Property.create({
      ...req.body,

      // ✅ FIXED SINGLE SOURCE OF TRUTH
      developerRef: coreDetails?.developerRef || null,

      coreDetails: {
        ...coreDetails,
        developerRef: undefined,
        developerName: undefined,
      },

      createdBy: req.user?.id,
    });

    res.status(201).json({ success: true, data: property });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ UPDATE PROPERTY
exports.updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found ❌",
      });
    }

    const { coreDetails, categoryData, locationData, unitConfigurations } = req.body;

    // ================= CONFIG CLEAN =================
    let validConfigurations;

if (unitConfigurations) {
  const cleanedConfigurations = unitConfigurations.filter(
    (u) =>
      u.unitType?.trim() ||
      u.area?.trim() ||
      u.price?.trim() ||
      u.paymentPlan?.trim()
  );

  validConfigurations = cleanedConfigurations.filter(
    (u) => u.price && u.price.trim() !== ""
  );

  if (validConfigurations.length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one configuration price required ❌",
    });
  }
}


    // ================= CATEGORY =================
    let categoryFinal = {};
    if (categoryData?.categoryRef) {
      categoryFinal = {
        categoryRef: categoryData.categoryRef,
        categoryName: categoryData.categoryName,
      };
    } else {
      categoryFinal = {
        categoryRef: null,
        categoryName: categoryData.categoryName,
      };
    }

    // ================= LOCATION =================
    let locationFinal = {};
    if (locationData?.locationRef) {
      locationFinal = {
        locationRef: locationData.locationRef,
        locationName: locationData.locationName,
        customLocation: "",
      };
    } else {
      locationFinal = {
        locationRef: null,
        locationName: locationData.locationName,
        customLocation: locationData.customLocation,
      };
    }

    // ================= UPDATE =================
   const updated = await Property.findByIdAndUpdate(
  req.params.id,
  {
    marketType,
    slug,

    developerRef: coreDetails?.developerRef || null,

    coreDetails: {
      ...coreDetails,
      developerRef: undefined,
      developerName: undefined,
    },

    categoryData: categoryFinal,

    locationData: {
      ...locationData,
      ...locationFinal,
    },

    unitConfigurations: validConfigurations,

    keyMetrics: {
      ...req.body.keyMetrics,
      totalUnits: Number(req.body.keyMetrics?.totalUnits) || 0,
      totalTowers: Number(req.body.keyMetrics?.totalTowers) || 0,
    },

    overview: req.body.overview,
    media: req.body.media,
    gatedContent: req.body.gatedContent,
    seoEngine: req.body.seoEngine,
    faqs: req.body.faqs,
  },
  { new: true }
);

    res.json({
      success: true,
      data: updated,
    });

  } catch (err) {
    console.error("UPDATE ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ✅ GET PROPERTIES
exports.getProperties = async (req, res) => {
  try {
    const { all, inactive } = req.query;

    let filter = {};

    // ================= FILTER LOGIC =================
    if (all === "true") {
      filter = {};
    } else if (inactive === "true") {
      filter = { isActive: false };
    } else {
      filter = { isActive: true };
    }

    const properties = await Property.find(filter)
      .populate("createdBy")
      .populate("developerRef", "name logo");

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
      .populate("developerRef", "name logo")
.populate("categoryData.categoryRef", "name")
.populate("locationData.locationRef", "name")

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

// ✅ GET PROPERTY BY ID (FOR EDIT)
exports.getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate("developerRef", "name logo")
.populate("categoryData.categoryRef", "name")
.populate("locationData.locationRef", "name")// ✅ FIXED
      .populate("categoryData.categoryRef", "name")
      .populate("locationData.locationRef", "name");

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
    console.error("GET BY ID ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};