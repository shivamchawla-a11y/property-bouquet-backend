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

    // ================= REQUIRED CHECK =================
    if (!slug || !marketType || !coreDetails?.title) {
      return res.status(400).json({
        success: false,
        message: "Missing fields ❌",
      });
    }

    // ================= UNIQUE SLUG =================
    const existing = await Property.findOne({ slug });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Slug already exists ❌",
      });
    }

    // ================= CONFIG VALIDATION =================
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

    const hasValidConfig = cleanedConfigurations.some(
      (u) => u.price?.trim()
    );

    if (!hasValidConfig) {
      return res.status(400).json({
        success: false,
        message: "At least one config required ❌",
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
        developerName:
          coreDetails.developerRef.name || "",

        developerLogo:
          coreDetails.developerRef.logo || "",

        developerImage:
          coreDetails.developerRef.image || "",
      };
    }

    // ================= CREATE =================
    const property = await Property.create({
      ...req.body,

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

      configurationSection:
        cleanedConfigurationSection,

      unitConfigurations:
        cleanedConfigurations,

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

    const validConfigurations =
      cleanedConfigurations.filter(
        (u) =>
          u.unitType?.trim() ||
          u.area?.trim() ||
          u.price?.trim() ||
          u.paymentPlan?.trim()
      );

    if (validConfigurations.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "At least one configuration required ❌",
      });
    }

    // ================= CATEGORY =================
    let categoryFinal = {};

    if (categoryData?.categoryRef) {
      categoryFinal = {
        categoryRef: categoryData.categoryRef,
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

    // ================= LOCATION =================
    let locationFinal = {};

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

    // ================= UPDATE =================
    const updated =
      await Property.findByIdAndUpdate(
        req.params.id,
        {
          marketType,
          slug,

          coreDetails: {
            ...coreDetails,

            developerName:
              coreDetails?.developerName || "",

            developerLogo:
              coreDetails?.developerLogo || "",

            developerImage:
              coreDetails?.developerImage || "",
          },

          categoryData: categoryFinal,

          locationData: {
            ...locationData,
            ...locationFinal,
          },

          heroSection: cleanedHeroSection,

          overview: cleanedOverview,

          configurationSection:
            cleanedConfigurationSection,

          unitConfigurations:
            validConfigurations,

          keyMetrics: {
            ...req.body.keyMetrics,

            totalUnits:
              Number(
                req.body.keyMetrics?.totalUnits
              ) || 0,

            totalTowers:
              Number(
                req.body.keyMetrics?.totalTowers
              ) || 0,
          },

          media: req.body.media,

          gatedContent: {
            ...gatedContent,

            floorPlans: cleanedFloorPlans,
          },

          seoEngine:
            req.body.seoEngine,

          faqs: req.body.faqs,

          cta: req.body.cta,
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

    // ================= FILTER =================
    if (all === "true") {
      filter = {};
    } else if (inactive === "true") {
      filter = { isActive: false };
    } else {
      filter = { isActive: true };
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
    const property =
      await Property.findById(req.params.id);

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
    const property =
      await Property.findById(req.params.id);

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

// ✅ GET PROPERTY BY SLUG
exports.getPropertyBySlug = async (
  req,
  res
) => {
  try {
    const { slug } = req.params;

    const property =
      await Property.findOne({
        slug,
        isActive: true,
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