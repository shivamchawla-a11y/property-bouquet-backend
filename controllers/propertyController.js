const Property = require("../models/Property");

// ✅ CREATE PROPERTY
// ✅ CREATE PROPERTY
exports.createProperty = async (req, res) => {
  try {
    const {
      marketType,
      coreDetails,
      categoryData,
      locationData,
      unitConfigurations,
      heroSection,
      overview,
      gatedContent,
      configurationSection,
      slug,
    } = req.body;

    // ================= DETAILED REQUIRED CHECK =================
    const missingFields = [];

    if (!slug) missingFields.push("slug");
    if (!marketType) missingFields.push("marketType");
    if (!coreDetails?.title) missingFields.push("coreDetails.title");

    // ================= CLEAN CONFIGURATIONS =================
const cleanedConfigurations =
  (unitConfigurations || []).map((u) => ({
    unitType: u?.unitType || "",
    area: u?.area || "",
    price: u?.price || "",
    paymentPlan: u?.paymentPlan || "",
    bedrooms: u?.bedrooms || "",
    bathrooms: u?.bathrooms || "",
    balconies: u?.balconies || "",
  }));

    // ❌ STOP REQUEST IF ANYTHING MISSING
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed ❌",
        missingFields,
      });
    }

    // ================= UNIQUE SLUG =================
    const existing = await Property.findOne({
  slug,
  isDeleted: false,
});

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Slug already exists ❌",
      });
    }

    // ================= FLOOR PLAN CLEAN =================
    const cleanedFloorPlans =
      gatedContent?.floorPlans?.map((fp) => ({
        unitType: fp?.unitType || "",
        area: fp?.area || "",
        price: fp?.price || "",
        paymentPlan: fp?.paymentPlan || "",
        bedrooms: fp?.bedrooms || "",
        bathrooms: fp?.bathrooms || "",
        balconies: fp?.balconies || "",
        image: fp?.image || "",
      })) || [];

    // ================= HERO CLEAN =================
    const cleanedHeroSection = {
      ...heroSection,
      taglineItems:
        heroSection?.taglineItems?.filter(
          (item) => item?.trim() !== ""
        ) || [],
    };

    // ================= OVERVIEW CLEAN =================
    const cleanedOverview = {
      ...overview,
      highlights:
        overview?.highlights?.filter(
          (item) => item?.name?.trim() !== ""
        ) || [],
    };

    // ================= CONFIG SECTION CLEAN =================
    const cleanedConfigurationSection = {
      ...configurationSection,
      features:
        configurationSection?.features?.filter(
          (item) => item?.trim() !== ""
        ) || [],
    };

    // ================= DEVELOPER SNAPSHOT =================
    let developerData = {};

    if (
      coreDetails?.developerRef &&
      typeof coreDetails.developerRef === "object"
    ) {
      developerData = {
        developerName: coreDetails.developerRef.name || "",
        developerLogo: coreDetails.developerRef.logo || "",
        developerImage: coreDetails.developerRef.image || "",
      };
    }

    // ================= CREATE PROPERTY =================
    const property = await Property.create({
  ...req.body,

  status: "published",

      coreDetails: {
        ...coreDetails,
        ...developerData,
      },

      categoryData: {
        ...categoryData,
      },

      locationData: {
        ...locationData,
      },

      heroSection: cleanedHeroSection,

      overview: cleanedOverview,

      configurationSection: cleanedConfigurationSection,

      unitConfigurations: cleanedConfigurations,

      gatedContent: {
        ...gatedContent,
        floorPlans: cleanedFloorPlans,
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
      message: err.message,
    });
  }
};

exports.saveDraft = async (req, res) => {
  try {

    const { draftId } = req.body;

    let property;

    if (draftId) {

      property =
        await Property.findByIdAndUpdate(
          draftId,
          {
            ...req.body,
            status: "draft",
          },
          {
            new: true,
          }
        );

    } else {

      property =
        await Property.create({
          ...req.body,
          status: "draft",
          createdBy: req.user.id,
        });

    }

    res.status(200).json({
      success: true,
      data: property,
    });

  } catch (err) {

    console.error(
      "SAVE DRAFT ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};

exports.publishDraft = async (req, res) => {
  try {

    const property =
      await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Draft not found",
      });
    }

    const existingSlug =
  await Property.findOne({
    slug: property.slug,
    _id: { $ne: property._id },
    isDeleted: false,
  });

    if (existingSlug) {
      return res.status(400).json({
        success: false,
        message: "Slug already exists",
      });
    }

    property.status = "published";

    await property.save();

    res.json({
      success: true,
      data: property,
    });

  } catch (err) {

    console.error(
      "PUBLISH DRAFT ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};

// ✅ UPDATE PROPERTY
exports.updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(
      req.params.id
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found ❌",
      });
    }

    const {
      marketType,
      slug,
      propertyTag,
      coreDetails,
      categoryData,
      locationData,
      unitConfigurations,
      heroSection,
      overview,
      gatedContent,
      configurationSection,
    } = req.body;

    // ================= CONFIG CLEAN =================
const cleanedConfigurations =
  (unitConfigurations || []).map((u) => ({
    unitType: u?.unitType || "",
    area: u?.area || "",
    price: u?.price || "",
    paymentPlan: u?.paymentPlan || "",
    bedrooms: u?.bedrooms || "",
    bathrooms: u?.bathrooms || "",
    balconies: u?.balconies || "",
  }));

// ✅ ALLOW EMPTY CONFIGURATIONS
let validConfigurations =
  property.unitConfigurations || [];

if (unitConfigurations) {

  validConfigurations =
    cleanedConfigurations.filter(
      (u) =>
        u.unitType?.trim() ||
        u.area?.trim() ||
        u.price?.trim() ||
        u.paymentPlan?.trim() ||
        u.bedrooms?.toString().trim() ||
        u.bathrooms?.toString().trim() ||
        u.balconies?.toString().trim()
    );

  // ✅ IF EVERYTHING EMPTY → STORE EMPTY ARRAY
  if (validConfigurations.length === 0) {
    validConfigurations = [];
  }
}

    // ================= CATEGORY =================
    let categoryFinal =
      property.categoryData || {};

    if (categoryData) {
      if (categoryData?.categoryRef) {
        categoryFinal = {
          categoryRef:
            categoryData.categoryRef,

          categoryName:
            categoryData.categoryName || "",
        };
      } else {
        categoryFinal = {
          categoryRef: null,

          categoryName:
            categoryData?.categoryName || "",
        };
      }
    }

    // ================= LOCATION =================
    let locationFinal =
      property.locationData || {};

    if (locationData) {
      if (locationData?.locationRef) {
        locationFinal = {
          locationRef:
            locationData.locationRef,

          locationName:
            locationData.locationName || "",

          customLocation: "",
        };
      } else {
        locationFinal = {
          locationRef: null,

          locationName:
            locationData?.locationName || "",

          customLocation:
            locationData?.customLocation || "",
        };
      }
    }

    // ================= HERO CLEAN =================
    const cleanedHeroSection = heroSection
      ? {
          ...heroSection,

          taglineItems:
            heroSection?.taglineItems?.filter(
              (item) => item?.trim() !== ""
            ) || [],
        }
      : property.heroSection;

    // ================= OVERVIEW CLEAN =================
    const cleanedOverview = overview
      ? {
          ...overview,

          highlights:
            overview?.highlights?.filter(
              (item) =>
                item?.heading?.trim() !== ""
            ) || [],
        }
      : property.overview;

    // ================= CONFIG SECTION CLEAN =================
    const cleanedConfigurationSection =
      configurationSection
        ? {
            ...configurationSection,

            features:
              configurationSection?.features?.filter(
                (item) => item?.trim() !== ""
              ) || [],
          }
        : property.configurationSection;

    // ================= FLOOR PLAN CLEAN =================
    const cleanedFloorPlans =
      gatedContent?.floorPlans?.map((fp) => ({
        unitType: fp?.unitType || "",
        area: fp?.area || "",
        price: fp?.price || "",
        paymentPlan: fp?.paymentPlan || "",
        bedrooms: fp?.bedrooms || "",
        bathrooms: fp?.bathrooms || "",
        balconies: fp?.balconies || "",
        image: fp?.image || "",
      })) ||
      property.gatedContent?.floorPlans ||
      [];

    // ================= UPDATE =================
    const updated =
      await Property.findByIdAndUpdate(
        req.params.id,
        {
          marketType:
            marketType || property.marketType,

          slug: slug || property.slug,

          // ✅ PROPERTY TAG
          propertyTag:
            propertyTag ||
            property.propertyTag ||
            "Normal",

          // ================= CORE DETAILS =================
          coreDetails: coreDetails
            ? {
                ...coreDetails,

                developerName:
                  coreDetails?.developerName ||
                  "",

                developerLogo:
                  coreDetails?.developerLogo ||
                  "",

                developerImage:
                  coreDetails?.developerImage ||
                  "",
              }
            : property.coreDetails,

          // ================= CATEGORY =================
          categoryData: categoryFinal,

          // ================= LOCATION =================
          locationData: {
            ...property.locationData,
            ...locationFinal,
          },

          // ================= HERO =================
          heroSection: cleanedHeroSection,

          // ================= OVERVIEW =================
          overview: cleanedOverview,

          // ================= CONFIG SECTION =================
          configurationSection:
            cleanedConfigurationSection,

          // ================= CONFIGURATIONS =================
          unitConfigurations:
            validConfigurations,

          // ================= KEY METRICS =================
          keyMetrics: req.body.keyMetrics
            ? {
                ...req.body.keyMetrics,

                totalUnits:
                  Number(
                    req.body.keyMetrics
                      ?.totalUnits
                  ) || 0,

                totalTowers:
                  Number(
                    req.body.keyMetrics
                      ?.totalTowers
                  ) || 0,
              }
            : property.keyMetrics,

          // ================= MEDIA =================
          media:
            req.body.media || property.media,

          // ================= GATED CONTENT =================
          gatedContent: gatedContent
            ? {
                ...gatedContent,

                floorPlans:
                  cleanedFloorPlans,
              }
            : property.gatedContent,

          // ================= SEO =================
          seoEngine:
            req.body.seoEngine ||
            property.seoEngine,

          // ================= FAQ =================
          faqs:
            req.body.faqs || property.faqs,

          // ================= CTA =================
          cta: req.body.cta || property.cta,
        },
        {
          new: true,
          runValidators: true,
        }
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
    const { all, inactive, propertyTag, status } =
  req.query;

    let filter = {
  isDeleted: false,
};

if (all === "true") {
  filter = {};
}
else if (inactive === "true") {
  filter = {
    isActive: false,
  };
}
else {
  filter = {
    isActive: true,
    $or: [
      { status: "published" },
      { status: { $exists: false } },
      { status: null },
      { status: "" }
    ]
  };
}

if (status) {
  filter.status = status;
}

    // ================= PROPERTY TAG FILTER =================
    if (
      propertyTag &&
      propertyTag !== "All"
    ) {
      filter.propertyTag = propertyTag;
    }

    const properties =
      await Property.find(filter)
        .populate("createdBy")
        .populate(
          "coreDetails.developerRef",
          "name logo image"
        );

    res.status(200).json({
      success: true,
      data: properties,
    });

  } catch (error) {
    console.error(
      "GET PROPERTIES ERROR:",
      error
    );

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
        message: "Property not found",
      });
    }

    property.status = "draft";

    await property.save();

    res.json({
      success: true,
      message: "Property moved to draft",
    });

  } catch (err) {
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
        message: "Property not found",
      });
    }

    property.status = "published";

    await property.save();

    res.json({
      success: true,
      message: "Property published",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.moveToTrash = async (req, res) => {
  try {

    const property =
      await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    property.deletedFromStatus =
      property.status;

    property.isDeleted = true;

    await property.save();

    res.json({
      success: true,
      message: "Moved to trash",
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};

exports.restoreTrash = async (req, res) => {
  try {

    const property =
      await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    property.isDeleted = false;

    property.status =
      property.deletedFromStatus ||
      property.status;

    property.deletedFromStatus = null;

    await property.save();

    res.json({
      success: true,
      message: "Property restored",
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};

exports.permanentDeleteProperty =
  async (req, res) => {
    try {

      await Property.findByIdAndDelete(
        req.params.id
      );

      res.json({
        success: true,
        message:
          "Property permanently deleted",
      });

    } catch (err) {

      res.status(500).json({
        success: false,
        message: err.message,
      });

    }
  };

// ✅ GET PROPERTY BY SLUG
exports.getPropertyBySlug = async (
  req,
  res
) => {
  try {
    const { slug } = req.params;

    const property = await Property.findOne({
  slug,
  isActive: true,
  isDeleted: false,
  $or: [
    { status: "published" },
    { status: { $exists: false } },
    { status: null },
    { status: "" }
  ]
})
.populate("createdBy")
.populate(
  "coreDetails.developerRef",
  "name logo image"
)
.populate(
  "categoryData.categoryRef",
  "name"
)
.populate(
  "locationData.locationRef",
  "name"
);

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
    console.error(
      "GET PROPERTY BY SLUG ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET PROPERTY PREVIEW
exports.getPropertyPreview = async (req, res) => {
  try {
    const property = await Property.findOne({
      slug: req.params.slug,
    })
      .populate("createdBy")
      .populate(
        "coreDetails.developerRef",
        "name logo image"
      )
      .populate(
        "categoryData.categoryRef",
        "name"
      )
      .populate(
        "locationData.locationRef",
        "name"
      );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    res.json({
      success: true,
      data: property,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ✅ GET PROPERTY BY ID
exports.getPropertyById = async (
  req,
  res
) => {
  try {
    const property =
      await Property.findById(req.params.id)
        .populate(
  "coreDetails.developerRef",
  "name logo image"
)
        .populate(
          "categoryData.categoryRef",
          "name"
        )
        .populate(
          "locationData.locationRef",
          "name"
        );

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