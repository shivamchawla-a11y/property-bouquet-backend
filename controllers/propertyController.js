const mongoose = require("mongoose");
const Property = require("../models/Property");
const Developer = require("../models/Developer");
const Category = require("../models/Category");
const Location = require("../models/Location");

// ============================================================
// HELPERS
// ============================================================

// Agent cannot access properties that are already in Trash.
// SuperAdmin can access everything.
const canAccessTrash = (req) => {
  return req.user?.role === "SuperAdmin";
};

// ============================================================
// CREATE PROPERTY
// Agent + SuperAdmin
// ============================================================

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
      propertyTag,
    } = req.body;

    // ================= DETAILED REQUIRED CHECK =================

    const missingFields = [];

    if (!slug) {
      missingFields.push("slug");
    }

    if (!marketType) {
      missingFields.push("marketType");
    }

    if (!coreDetails?.title) {
      missingFields.push("coreDetails.title");
    }

    // ================= VALIDATION =================

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed ❌",
        missingFields,
      });
    }

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

    // ================= UNIQUE PUBLISHED SLUG =================
// Only a NON-DELETED + PUBLISHED property reserves a slug.
//
// Draft:
//   isDeleted: false
//   status: "draft"
//   → DOES NOT block the slug
//
// Trash:
//   isDeleted: true
//   → DOES NOT block the slug
//
// Published:
//   isDeleted: false
//   status: "published"
//   → MUST be unique

const normalizedSlug = String(slug || "")
  .trim()
  .toLowerCase();

const existing = await Property.findOne({
  slug: normalizedSlug,
  isDeleted: false,
  status: "published",
});

if (existing) {
  return res.status(409).json({
    success: false,
    message: "A published property already uses this slug ❌",
  });
}

    // ================= FLOOR PLANS =================

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

    // ================= PLOT CONFIGURATIONS =================

    const cleanedPlotConfigurations =
      gatedContent?.plotConfigurations?.map((plot) => ({
        plotType: plot?.plotType || "",
        plotArea: plot?.plotArea || "",
        price: plot?.price || "",
        paymentPlan: plot?.paymentPlan || "",
        image: plot?.image || "",
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
          (item) => item?.heading?.trim() !== ""
        ) || [],

      amenities:
        overview?.amenities?.filter(
          (item) => item?.heading?.trim() !== ""
        ) || [],

      featureBar:
        overview?.featureBar?.filter(
          (item) => item?.title?.trim() !== ""
        ) || [],
    };

    // ================= CONFIGURATION SECTION =================

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

    // ================= SEO =================

    const seoKeywords =
      typeof req.body.seoEngine?.keywords === "string"
        ? req.body.seoEngine.keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean)
        : req.body.seoEngine?.keywords || [];

    const hasCustomSEO =
      !!(
        req.body.seoEngine?.metaTitle?.trim() &&
        req.body.seoEngine?.metaDescription?.trim() &&
        seoKeywords.length
      );

    // ================= PROPERTY TAG =================

    let finalPropertyTag = propertyTag;

    if (typeof finalPropertyTag === "string") {
      try {
        finalPropertyTag = JSON.parse(
          finalPropertyTag
        );
      } catch {
        finalPropertyTag = [
          finalPropertyTag,
        ];
      }
    }

    if (!Array.isArray(finalPropertyTag)) {
      finalPropertyTag = ["Normal"];
    }

    // ================= CREATE =================

    const property = await Property.create({
      ...req.body,

      // Always store normalized slug
      slug: normalizedSlug,

      propertyTag: finalPropertyTag,

      seoEngine: {
        hasCustomSEO,

        metaTitle:
          req.body.seoEngine?.metaTitle || "",

        metaDescription:
          req.body.seoEngine?.metaDescription || "",

        keywords: seoKeywords,
      },

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

      heroSection:
        cleanedHeroSection,

      overview:
        cleanedOverview,

      configurationSection:
        cleanedConfigurationSection,

      unitConfigurations:
        cleanedConfigurations,

      gatedContent: {
        ...gatedContent,

        configurationType:
          gatedContent?.configurationType ||
          "Apartments",

        floorPlans:
          cleanedFloorPlans,

        plotConfigurations:
          cleanedPlotConfigurations,
      },

      createdBy:
        req.user?.id,
    });

    res.status(201).json({
      success: true,
      data: property,
    });
  } catch (err) {

  console.error(
    "CREATE PROPERTY ERROR:",
    err
  );

  // ========================================================
  // MONGODB DUPLICATE PUBLISHED SLUG
  // ========================================================

  if (
    err?.code === 11000 &&
    err?.keyPattern?.slug
  ) {
    return res.status(409).json({
      success: false,
      message:
        "A published property already uses this slug ❌",
    });
  }

  return res.status(500).json({
    success: false,
    message: err.message,
  });
}
};

// ============================================================
// SAVE DRAFT
// Agent + SuperAdmin
//
// BEHAVIOUR:
//
// 1. No draftId
//    → Create a NEW draft
//    → Return its _id
//
// 2. Existing draftId
//    → Find the SAME property
//    → Update that property
//    → NEVER create another draft
//
// 3. Agent
//    → Can save Live/Draft
//    → Cannot modify Trash
//
// 4. SuperAdmin
//    → Can save everything
//
// IMPORTANT:
// draftId is a FRONTEND helper only.
// It is NOT stored inside the Property document.
// ============================================================

exports.saveDraft = async (req, res) => {
  try {
    // ========================================================
    // GET DRAFT ID
    // ========================================================

    const { draftId } = req.body;

    let property;

    // ========================================================
    // PREPARE REQUEST DATA
    //
    // Remove draftId because it is only used to identify
    // the existing MongoDB document.
    // ========================================================

    const {
      draftId: ignoredDraftId,
      ...requestData
    } = req.body;

    // ========================================================
    // CLEAN PROPERTY TAG
    // ========================================================

    let finalPropertyTag =
      requestData.propertyTag;

    if (
      typeof finalPropertyTag === "string"
    ) {
      try {
        finalPropertyTag =
          JSON.parse(finalPropertyTag);
      } catch {
        finalPropertyTag = [
          finalPropertyTag,
        ];
      }
    }

    if (
      !Array.isArray(finalPropertyTag)
    ) {
      finalPropertyTag = ["Normal"];
    }

    // ========================================================
    // CLEAN UNIT CONFIGURATIONS
    // ========================================================

    const cleanedConfigurations =
      (
        requestData.unitConfigurations ||
        []
      ).map((u) => ({
        unitType:
          u?.unitType || "",

        area:
          u?.area || "",

        price:
          u?.price || "",

        paymentPlan:
          u?.paymentPlan || "",

        bedrooms:
          u?.bedrooms || "",

        bathrooms:
          u?.bathrooms || "",

        balconies:
          u?.balconies || "",
      }));

    // ========================================================
    // CLEAN FLOOR PLANS
    // ========================================================

    const cleanedFloorPlans =
      requestData.gatedContent?.floorPlans?.map(
        (fp) => ({
          unitType:
            fp?.unitType || "",

          area:
            fp?.area || "",

          price:
            fp?.price || "",

          paymentPlan:
            fp?.paymentPlan || "",

          bedrooms:
            fp?.bedrooms || "",

          bathrooms:
            fp?.bathrooms || "",

          balconies:
            fp?.balconies || "",

          image:
            fp?.image || "",
        })
      ) || [];

    // ========================================================
    // CLEAN PLOT CONFIGURATIONS
    // ========================================================

    const cleanedPlotConfigurations =
      requestData.gatedContent?.plotConfigurations?.map(
        (plot) => ({
          plotType:
            plot?.plotType || "",

          plotArea:
            plot?.plotArea || "",

          price:
            plot?.price || "",

          paymentPlan:
            plot?.paymentPlan || "",

          image:
            plot?.image || "",
        })
      ) || [];

    // ========================================================
    // CLEAN HERO SECTION
    // ========================================================

    const cleanedHeroSection = {
      ...(requestData.heroSection || {}),

      taglineItems:
        requestData.heroSection?.taglineItems?.filter(
          (item) =>
            typeof item === "string" &&
            item.trim() !== ""
        ) || [],
    };

    // ========================================================
    // CLEAN OVERVIEW
    // ========================================================

    const cleanedOverview = {
      ...(requestData.overview || {}),

      highlights:
        requestData.overview?.highlights?.filter(
          (item) =>
            item?.heading?.trim() !== ""
        ) || [],

      amenities:
        requestData.overview?.amenities?.filter(
          (item) =>
            item?.heading?.trim() !== ""
        ) || [],

      featureBar:
        requestData.overview?.featureBar?.filter(
          (item) =>
            item?.title?.trim() !== ""
        ) || [],
    };

    // ========================================================
    // CLEAN CONFIGURATION SECTION
    // ========================================================

    const cleanedConfigurationSection = {
      ...(requestData.configurationSection || {}),

      features:
        requestData.configurationSection?.features?.filter(
          (item) =>
            typeof item === "string" &&
            item.trim() !== ""
        ) || [],
    };

    // ========================================================
    // CLEAN SEO
    // ========================================================

    const seoKeywords =
      typeof requestData.seoEngine?.keywords ===
      "string"
        ? requestData.seoEngine.keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean)
        : Array.isArray(
            requestData.seoEngine?.keywords
          )
        ? requestData.seoEngine.keywords
        : [];

    const hasCustomSEO =
      !!(
        requestData.seoEngine?.metaTitle?.trim() &&
        requestData.seoEngine?.metaDescription?.trim() &&
        seoKeywords.length
      );

    // ========================================================
    // PREPARE CLEAN DATA
    // ========================================================

    const cleanedData = {
      ...requestData,

      // ------------------------------------------------------
      // PROPERTY TAG
      // ------------------------------------------------------

      propertyTag:
        finalPropertyTag,

      // ------------------------------------------------------
      // STATUS
      // ------------------------------------------------------

      status: "draft",

      // ------------------------------------------------------
      // TRASH
      //
      // An active draft must never remain in Trash.
      // ------------------------------------------------------

      isDeleted: false,

      // ------------------------------------------------------
      // HERO
      // ------------------------------------------------------

      heroSection:
        cleanedHeroSection,

      // ------------------------------------------------------
      // OVERVIEW
      // ------------------------------------------------------

      overview:
        cleanedOverview,

      // ------------------------------------------------------
      // CONFIGURATION SECTION
      // ------------------------------------------------------

      configurationSection:
        cleanedConfigurationSection,

      // ------------------------------------------------------
      // UNIT CONFIGURATIONS
      // ------------------------------------------------------

      unitConfigurations:
        cleanedConfigurations,

      // ------------------------------------------------------
      // GATED CONTENT
      // ------------------------------------------------------

      gatedContent: {
        ...(requestData.gatedContent || {}),

        configurationType:
          requestData.gatedContent
            ?.configurationType ||
          "Apartments",

        floorPlans:
          cleanedFloorPlans,

        plotConfigurations:
          cleanedPlotConfigurations,
      },

      // ------------------------------------------------------
      // SEO
      // ------------------------------------------------------

      seoEngine: {
        hasCustomSEO,

        metaTitle:
          requestData.seoEngine?.metaTitle?.trim() ||
          "",

        metaDescription:
          requestData.seoEngine?.metaDescription?.trim() ||
          "",

        keywords:
          seoKeywords,
      },
    };

    // ========================================================
    // EXISTING DRAFT / EXISTING PROPERTY
    // ========================================================

    if (draftId) {
      property =
        await Property.findById(draftId);

      // ------------------------------------------------------
      // ID NOT FOUND
      // ------------------------------------------------------

      if (!property) {
        return res.status(404).json({
          success: false,
          message:
            "Draft not found",
        });
      }

      // ------------------------------------------------------
      // AGENT CANNOT MODIFY TRASH
      // ------------------------------------------------------

      if (
        property.isDeleted &&
        !canAccessTrash(req)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You cannot access a trashed property",
        });
      }

      // ======================================================
      // IMPORTANT:
      //
      // Preserve database-controlled fields.
      // Do NOT allow the frontend to overwrite them.
      // ======================================================

      delete cleanedData._id;
      delete cleanedData.createdAt;
      delete cleanedData.updatedAt;
      delete cleanedData.createdBy;
      delete cleanedData.isDeleted;
      delete cleanedData.deletedFromStatus;

      // ======================================================
      // UPDATE SAME PROPERTY
      // ======================================================

      property.set({
        ...cleanedData,

        // Always remain a Draft during autosave.
        status: "draft",

        // Always remove Trash state.
        isDeleted: false,
      });

      // ------------------------------------------------------
      // Keep original creator
      // ------------------------------------------------------

      if (!property.createdBy) {
        property.createdBy =
          req.user?.id;
      }

      // ------------------------------------------------------
      // A property being saved as a draft is no longer
      // considered to be restored from Trash.
      // ------------------------------------------------------

      property.deletedFromStatus =
        null;

      // ------------------------------------------------------
      // SAVE
      // ------------------------------------------------------

      await property.save();
    }

    // ========================================================
    // CREATE NEW DRAFT
    // ========================================================

    else {
      property =
        await Property.create({
          ...cleanedData,

          // --------------------------------------------------
          // Explicit draft state
          // --------------------------------------------------

          status: "draft",

          // --------------------------------------------------
          // Never create a new draft inside Trash
          // --------------------------------------------------

          isDeleted: false,

          // --------------------------------------------------
          // Current logged-in user
          // --------------------------------------------------

          createdBy:
            req.user?.id,
        });
    }

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,

      message:
        "Draft saved successfully",

      // Main property object
      data: property,

      // Explicit ID for frontend autosave
      draftId:
        property._id,
    });

  } catch (err) {
    console.error(
      "SAVE DRAFT ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message,
    });
  }
};

// ============================================================
// CHECK PROPERTY DUPLICATES
// ============================================================
//
// Checks:
// 1. Exact slug
// 2. Similar slugs while typing
// 3. Similar titles while typing
//
// Trash properties are NOT included.
//
// Current draft is excluded using draftId.
// ============================================================

// ============================================================
// CHECK PROPERTY DUPLICATES / SIMILAR PROPERTIES
// ============================================================

// ============================================================
// CHECK PROPERTY DUPLICATES / SIMILAR PROPERTIES
// ============================================================
//
// Checks:
//
// 1. Exact slug
// 2. Similar slugs while typing
// 3. Similar titles while typing
//
// Trash properties are NOT included.
//
// Current property/draft is excluded using draftId.
//
// IMPORTANT:
//
// Slug similarity is SUBSTRING based.
//
// Example:
//
// spiti
//     ↓
// spiti-floors-sector-99a-gurgaon
//
// spiti-floors
//     ↓
// spiti-floors-sector-99a-gurgaon
//
// spiti-floors-sector
//     ↓
// spiti-floors-sector-99a-gurgaon
//
// ============================================================

exports.checkPropertyDuplicates = async (req, res) => {
  try {
    const {
      slug = "",
      title = "",
      draftId = "",
    } = req.query;

    // ========================================================
    // CLEAN INPUT
    // ========================================================

    const cleanSlug = String(slug)
      .trim()
      .toLowerCase();

    const cleanTitle = String(title)
      .trim();

    // ========================================================
    // BASE FILTER
    //
    // Published + Draft are included.
    // Trash is excluded.
    // ========================================================

    const baseFilter = {
      isDeleted: false,
    };

    // ========================================================
    // EXCLUDE CURRENT PROPERTY
    //
    // Important when editing an existing draft/property.
    // ========================================================

    if (
      draftId &&
      mongoose.isValidObjectId(draftId)
    ) {
      baseFilter._id = {
        $ne: draftId,
      };
    }

    // ========================================================
    // SAFE REGEX HELPER
    // ========================================================

    const escapeRegex = (value = "") => {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

    // ========================================================
    // SLUG CHECK
    // ========================================================

    let slugProperty = null;
    let similarSlugs = [];

    if (cleanSlug.length >= 2) {
      const escapedSlug = escapeRegex(cleanSlug);

      // ======================================================
      // EXACT SLUG
      //
      // Example:
      //
      // User types:
      // spiti-floors-sector-99a-gurgaon
      //
      // This detects the exact duplicate.
      // ======================================================

      slugProperty = await Property.findOne({
        ...baseFilter,

        slug: {
          $regex: `^${escapedSlug}$`,
          $options: "i",
        },
      })
        .select(
          "_id slug status isDeleted coreDetails.title"
        )
        .lean();

      // ======================================================
      // SIMILAR SLUGS
      //
      // IMPORTANT:
      //
      // There is NO ^ and NO $ here.
      //
      // Therefore the typed text can occur anywhere
      // inside the existing slug.
      //
      // Example:
      //
      // spiti
      // spiti-floors
      // spiti-floors-sector
      //
      // All will find:
      //
      // spiti-floors-sector-99a-gurgaon
      // ======================================================

      similarSlugs = await Property.find({
        ...baseFilter,

        slug: {
          $regex: escapedSlug,
          $options: "i",
        },
      })
        .select(
          "_id slug status isDeleted coreDetails.title"
        )
        .sort({
          updatedAt: -1,
        })
        .limit(8)
        .lean();
    }

    // ========================================================
    // TITLE SIMILARITY
    // ========================================================

    let similarTitles = [];

    if (cleanTitle.length >= 2) {
      const escapedTitle = escapeRegex(cleanTitle);

      similarTitles = await Property.find({
        ...baseFilter,

        "coreDetails.title": {
          $regex: escapedTitle,
          $options: "i",
        },
      })
        .select(
          "_id slug status isDeleted coreDetails.title"
        )
        .sort({
          updatedAt: -1,
        })
        .limit(8)
        .lean();
    }

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,

      // Exact slug duplicate
      slugExists: Boolean(slugProperty),

      slugProperty,

      // Similar slug suggestions
      similarSlugs,

      // Similar title suggestions
      similarTitles,
    });
  } catch (err) {
    console.error(
      "CHECK PROPERTY DUPLICATES ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to check property duplicates",
    });
  }
};

// ============================================================
// PUBLISH DRAFT
// Agent + SuperAdmin
// ============================================================

exports.publishDraft = async (req, res) => {
  try {
    const property =
      await Property.findById(
        req.params.id
      );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Draft not found",
      });
    }

    // --------------------------------------------------------
    // Agent cannot publish Trash
    // --------------------------------------------------------

    if (
      property.isDeleted &&
      !canAccessTrash(req)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot publish a trashed property",
      });
    }

    // ========================================================
    // UNIQUE SLUG
    // ========================================================

    // ========================================================
// UNIQUE PUBLISHED SLUG
// ========================================================
//
// Only another NON-DELETED + PUBLISHED property
// can block this slug.
//
// Drafts do NOT block.
// Trash does NOT block.

const existingSlug =
  await Property.findOne({
    slug: property.slug,
    _id: {
      $ne: property._id,
    },
    isDeleted: false,
    status: "published",
  });

if (existingSlug) {
  return res.status(409).json({
    success: false,
    message:
      "A published property already uses this slug ❌",
  });
}

    property.status =
      "published";

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

    if (
      err?.code === 11000 &&
      err?.keyPattern?.slug
    ) {
      return res.status(409).json({
        success: false,
        message:
          "A published property already uses this slug ❌",
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// ============================================================
// UPDATE PROPERTY
// Agent + SuperAdmin
// ============================================================

exports.updateProperty = async (
  req,
  res
) => {
  try {
    const property =
      await Property.findById(
        req.params.id
      );

    if (!property) {
      return res.status(404).json({
        success: false,
        message:
          "Property not found ❌",
      });
    }

    // --------------------------------------------------------
    // Agent cannot edit Trash
    // --------------------------------------------------------

    if (
      property.isDeleted &&
      !canAccessTrash(req)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot edit a trashed property",
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

    // ========================================================
    // CONFIGURATIONS
    // ========================================================

    const cleanedConfigurations =
      (unitConfigurations || []).map((u) => ({
        unitType: u?.unitType || "",
        area: u?.area || "",
        price: u?.price || "",
        paymentPlan:
          u?.paymentPlan || "",
        bedrooms:
          u?.bedrooms || "",
        bathrooms:
          u?.bathrooms || "",
        balconies:
          u?.balconies || "",
      }));

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
            u.bedrooms
              ?.toString()
              .trim() ||
            u.bathrooms
              ?.toString()
              .trim() ||
            u.balconies
              ?.toString()
              .trim()
        );

      if (
        validConfigurations.length === 0
      ) {
        validConfigurations = [];
      }
    }

    // ========================================================
    // CATEGORY
    // ========================================================

    let categoryFinal =
      property.categoryData || {};

    if (categoryData) {
      if (
        categoryData?.categoryRef
      ) {
        categoryFinal = {
          categoryRef:
            categoryData.categoryRef,

          categoryName:
            categoryData.categoryName ||
            "",
        };
      } else {
        categoryFinal = {
          categoryRef: null,

          categoryName:
            categoryData?.categoryName ||
            "",
        };
      }
    }

    // ========================================================
    // LOCATION
    // ========================================================

    let locationFinal =
      property.locationData || {};

    if (locationData) {
      locationFinal = {
        ...property.locationData,
        ...locationData,

        locationRef:
          locationData.locationRef ||
          null,

        locationName:
          locationData.locationName ||
          "",

        customLocation:
          locationData.locationRef
            ? ""
            : locationData.customLocation ||
              "",
      };
    }

    // ========================================================
    // HERO
    // ========================================================

    const cleanedHeroSection =
      heroSection
        ? {
            ...heroSection,

            taglineItems:
              heroSection?.taglineItems?.filter(
                (item) =>
                  item?.trim() !== ""
              ) || [],
          }
        : property.heroSection;

    // ========================================================
    // OVERVIEW
    // ========================================================

    const cleanedOverview =
      overview
        ? {
            ...property.overview,
            ...overview,

            highlights:
              overview.highlights?.filter(
                (item) =>
                  item?.heading?.trim()
              ) ||
              property.overview
                ?.highlights ||
              [],

            amenities:
              overview.amenities?.filter(
                (item) =>
                  item?.heading?.trim()
              ) ||
              property.overview
                ?.amenities ||
              [],

            featureBar:
              overview.featureBar?.filter(
                (item) =>
                  item?.title?.trim()
              ) ||
              property.overview
                ?.featureBar ||
              [],
          }
        : property.overview;

    // ========================================================
    // CONFIGURATION SECTION
    // ========================================================

    const cleanedConfigurationSection =
      configurationSection
        ? {
            ...configurationSection,

            features:
              configurationSection?.features?.filter(
                (item) =>
                  item?.trim() !== ""
              ) || [],
          }
        : property.configurationSection;

    // ========================================================
    // FLOOR PLANS
    // ========================================================

    const cleanedFloorPlans =
      gatedContent?.floorPlans?.map(
        (fp) => ({
          unitType:
            fp?.unitType || "",

          area:
            fp?.area || "",

          price:
            fp?.price || "",

          paymentPlan:
            fp?.paymentPlan || "",

          bedrooms:
            fp?.bedrooms || "",

          bathrooms:
            fp?.bathrooms || "",

          balconies:
            fp?.balconies || "",

          image:
            fp?.image || "",
        })
      ) ||
      property.gatedContent
        ?.floorPlans ||
      [];

    // ========================================================
    // PLOT CONFIGURATIONS
    // ========================================================

    const cleanedPlotConfigurations =
      gatedContent?.plotConfigurations?.map(
        (plot) => ({
          plotType:
            plot?.plotType || "",

          plotArea:
            plot?.plotArea || "",

          price:
            plot?.price || "",

          paymentPlan:
            plot?.paymentPlan || "",

          image:
            plot?.image || "",
        })
      ) ||
      property.gatedContent
        ?.plotConfigurations ||
      [];

    // ========================================================
    // SEO
    // ========================================================

    const seoKeywords =
      typeof req.body.seoEngine
        ?.keywords === "string"
        ? req.body.seoEngine.keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean)
        : req.body.seoEngine?.keywords ||
          [];

    const hasCustomSEO =
      !!(
        req.body.seoEngine?.metaTitle?.trim() &&
        req.body.seoEngine
          ?.metaDescription?.trim() &&
        seoKeywords.length
      );

    // ========================================================
    // PROPERTY TAG
    // ========================================================

    let finalPropertyTag =
      propertyTag;

    if (
      typeof finalPropertyTag ===
      "string"
    ) {
      try {
        finalPropertyTag =
          JSON.parse(
            finalPropertyTag
          );
      } catch {
        finalPropertyTag = [
          finalPropertyTag,
        ];
      }
    }

    if (
      !Array.isArray(
        finalPropertyTag
      )
    ) {
      finalPropertyTag =
        Array.isArray(
          property.propertyTag
        )
          ? property.propertyTag
          : property.propertyTag
          ? [property.propertyTag]
          : ["Normal"];
    }

    // ========================================================
    // UPDATE
    // ========================================================

    const updated =
      await Property.findByIdAndUpdate(
        req.params.id,

        {
          marketType:
            marketType ||
            property.marketType,

          slug:
            slug ||
            property.slug,

          propertyTag:
            finalPropertyTag,

          coreDetails:
            coreDetails
              ? {
                  ...coreDetails,

                  developerName:
                    coreDetails
                      ?.developerName ||
                    "",

                  developerLogo:
                    coreDetails
                      ?.developerLogo ||
                    "",

                  developerImage:
                    coreDetails
                      ?.developerImage ||
                    "",
                }
              : property.coreDetails,

          categoryData:
            categoryFinal,

          locationData:
            locationFinal,

          heroSection:
            cleanedHeroSection,

          overview:
            cleanedOverview,

          configurationSection:
            cleanedConfigurationSection,

          unitConfigurations:
            validConfigurations,

          keyMetrics:
            req.body.keyMetrics
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

          media:
            req.body.media ||
            property.media,

          gatedContent:
            gatedContent
              ? {
                  ...gatedContent,

                  configurationType:
                    gatedContent
                      ?.configurationType ||
                    property.gatedContent
                      ?.configurationType ||
                    "Apartments",

                  floorPlans:
                    cleanedFloorPlans,

                  plotConfigurations:
                    cleanedPlotConfigurations,
                }
              : property.gatedContent,

          seoEngine:
            req.body.seoEngine
              ? {
                  hasCustomSEO,

                  metaTitle:
                    req.body.seoEngine
                      .metaTitle || "",

                  metaDescription:
                    req.body.seoEngine
                      .metaDescription ||
                    "",

                  keywords:
                    seoKeywords,
                }
              : property.seoEngine,

          faqs:
            req.body.faqs ||
            property.faqs,

          cta:
            req.body.cta ||
            property.cta,
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

  console.error(
    "UPDATE ERROR:",
    err
  );

  // ========================================================
  // MONGODB DUPLICATE PUBLISHED SLUG
  // ========================================================

  if (
    err?.code === 11000 &&
    err?.keyPattern?.slug
  ) {
    return res.status(409).json({
      success: false,
      message:
        "A published property already uses this slug ❌",
    });
  }

  return res.status(500).json({
    success: false,
    message: err.message,
  });
}
};


// ============================================================
// GET PROPERTIES
//
// PUBLIC:
//   Published + Active + Non-Deleted
//
// AGENT:
//   all=true → Live + Draft
//   NEVER Trash
//
// SUPERADMIN:
//   all=true → Live + Draft + Trash
//
// IMPORTANT:
// propertyRoutes.js must use:
//
// optionalProtect,
// getProperties
//
// ============================================================

exports.getProperties = async (
  req,
  res
) => {
  try {
    const {
      all,
      inactive,
      propertyTag,
      status,
    } = req.query;

    const role =
      req.user?.role || null;

    const isSuperAdmin =
      role === "SuperAdmin";

    const isAgent =
      role === "Agent";

    let filter = {};

    // ========================================================
    // SUPERADMIN
    // ========================================================

    if (
      isSuperAdmin &&
      all === "true"
    ) {
      // SuperAdmin can see EVERYTHING
      // including Trash.
      filter = {};
    }

    // ========================================================
    // AGENT
    // ========================================================

    else if (
      isAgent &&
      all === "true"
    ) {
      // Agent can see Live + Draft
      // but NEVER Trash.
      filter = {
        isDeleted: false,
      };
    }

    // ========================================================
    // ADMIN STATUS FILTER
    // ========================================================

    else if (
      (isAgent || isSuperAdmin) &&
      status
    ) {
      filter = {
        status,
        isDeleted: false,
      };
    }

    // ========================================================
    // ADMIN INACTIVE FILTER
    // ========================================================

    else if (
      (isAgent || isSuperAdmin) &&
      inactive === "true"
    ) {
      filter = {
        isActive: false,
        isDeleted: false,
      };
    }

    // ========================================================
    // PUBLIC
    // ========================================================

    else {
      filter = {
        isActive: true,
        isDeleted: false,

        $or: [
          {
            status: "published",
          },
          {
            status: {
              $exists: false,
            },
          },
          {
            status: null,
          },
          {
            status: "",
          },
        ],
      };
    }

    // ========================================================
    // PROPERTY TAG FILTER
    // ========================================================

    if (
      propertyTag &&
      propertyTag !== "All"
    ) {
      filter.propertyTag = {
        $in: [propertyTag],
      };
    }

    // ========================================================
    // FETCH
    // ========================================================

    const properties =
      await Property.find(filter)
        .populate("createdBy")
        .populate(
          "coreDetails.developerRef",
          "name logo image"
        )
        .populate({
          path: "locationData.locationRef",

          populate: {
            path: "parent",

            populate: {
              path: "parent",
            },
          },
        });

    // ========================================================
    // RESPONSE
    // ========================================================

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


// ============================================================
// LIVE → DRAFT
// Agent + SuperAdmin
// ============================================================

exports.deleteProperty = async (
  req,
  res
) => {
  try {
    const property =
      await Property.findById(
        req.params.id
      );

    if (!property) {
      return res.status(404).json({
        success: false,
        message:
          "Property not found",
      });
    }

    // Agent cannot operate on Trash
    if (
      property.isDeleted &&
      !canAccessTrash(req)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot access a trashed property",
      });
    }

    // IMPORTANT:
    // This is NOT Trash.
    // It only changes Live → Draft.
    property.status =
      "draft";

    await property.save();

    res.json({
      success: true,
      message:
        "Property moved to draft",
      data: property,
    });
  } catch (err) {
    console.error(
      "DELETE PROPERTY ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// ============================================================
// DRAFT → LIVE
// Agent + SuperAdmin
// ============================================================

exports.restoreProperty = async (
  req,
  res
) => {
  try {
    const property =
      await Property.findById(
        req.params.id
      );

    if (!property) {
      return res.status(404).json({
        success: false,
        message:
          "Property not found",
      });
    }

    // --------------------------------------------------------
    // Agent cannot restore Trash
    // using the Draft → Live route.
    // --------------------------------------------------------

    if (
      property.isDeleted &&
      !canAccessTrash(req)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot restore a trashed property",
      });
    }

    // ========================================================
    // NORMALIZE SLUG
    // ========================================================

    const normalizedSlug =
      String(property.slug || "")
        .trim()
        .toLowerCase();

    // ========================================================
    // CHECK ONLY PUBLISHED PROPERTIES
    //
    // Drafts do NOT block.
    // Trash does NOT block.
    // ========================================================

    const existingPublished =
      await Property.findOne({
        _id: {
          $ne: property._id,
        },
        slug: normalizedSlug,
        isDeleted: false,
        status: "published",
      })
        .select(
          "_id slug status isDeleted coreDetails.title"
        )
        .lean();

    if (existingPublished) {
      return res.status(409).json({
        success: false,
        message:
          "A published property already uses this slug ❌",
        conflictProperty:
          existingPublished,
      });
    }

    // ========================================================
    // PUBLISH
    // ========================================================

    property.slug = normalizedSlug;
    property.status = "published";

    await property.save();

    return res.json({
      success: true,
      message:
        "Property published",
      data: property,
    });

  } catch (err) {
    console.error(
      "RESTORE PROPERTY ERROR:",
      err
    );

    // ========================================================
    // MONGODB DUPLICATE PUBLISHED SLUG
    // Race-condition protection
    // ========================================================

    if (
      err?.code === 11000 &&
      err?.keyPattern?.slug
    ) {
      return res.status(409).json({
        success: false,
        message:
          "A published property already uses this slug ❌",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        err.message,
    });
  }
};


// ============================================================
// MOVE TO TRASH
// Agent + SuperAdmin
// ============================================================

exports.moveToTrash = async (
  req,
  res
) => {
  try {
    const property =
      await Property.findById(
        req.params.id
      );

    if (!property) {
      return res.status(404).json({
        success: false,
        message:
          "Property not found",
      });
    }

    // --------------------------------------------------------
    // Already Trash
    // --------------------------------------------------------

    if (property.isDeleted) {
      return res.status(400).json({
        success: false,
        message:
          "Property is already in Trash",
      });
    }

    // --------------------------------------------------------
    // Remember whether it was Live or Draft
    // --------------------------------------------------------

    property.deletedFromStatus =
      property.status;

    property.isDeleted =
      true;

    await property.save();

    res.json({
      success: true,
      message:
        "Moved to trash",
      data: property,
    });
  } catch (err) {
    console.error(
      "MOVE TO TRASH ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// ============================================================
// RESTORE FROM TRASH
// SuperAdmin ONLY
// ============================================================

exports.restoreTrash = async (
  req,
  res
) => {
  try {
    const property =
      await Property.findById(
        req.params.id
      );

    if (!property) {
      return res.status(404).json({
        success: false,
        message:
          "Property not found",
      });
    }

    // ========================================================
    // DETERMINE RESTORED STATUS
    // ========================================================

    const restoredStatus =
      property.deletedFromStatus ||
      property.status ||
      "draft";

    // ========================================================
    // NORMALIZE SLUG
    // ========================================================

    const normalizedSlug =
      String(property.slug || "")
        .trim()
        .toLowerCase();

    // ========================================================
    // ONLY PUBLISHED RESTORATION NEEDS SLUG CHECK
    //
    // If restoring as DRAFT:
    //     ✅ Always allowed
    //
    // If restoring as PUBLISHED:
    //     ❌ Block only when another active published
    //        property already uses the slug.
    // ========================================================

    if (
      restoredStatus === "published"
    ) {
      const existingPublished =
        await Property.findOne({
          _id: {
            $ne: property._id,
          },
          slug: normalizedSlug,
          isDeleted: false,
          status: "published",
        })
          .select(
            "_id slug status isDeleted coreDetails.title"
          )
          .lean();

      if (existingPublished) {
        return res.status(409).json({
          success: false,
          message:
            "A published property already uses this slug ❌",
          conflictProperty:
            existingPublished,
        });
      }
    }

    // ========================================================
    // RESTORE
    // ========================================================

    property.slug = normalizedSlug;
    property.isDeleted = false;
    property.status = restoredStatus;
    property.deletedFromStatus = null;

    await property.save();

    return res.json({
      success: true,
      message:
        "Property restored",
      data: property,
    });

  } catch (err) {
    console.error(
      "RESTORE TRASH ERROR:",
      err
    );

    // ========================================================
    // MONGODB DUPLICATE PUBLISHED SLUG
    // Race-condition protection
    // ========================================================

    if (
      err?.code === 11000 &&
      err?.keyPattern?.slug
    ) {
      return res.status(409).json({
        success: false,
        message:
          "A published property already uses this slug ❌",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        err.message,
    });
  }
};


// ============================================================
// DELETE FOREVER
// SuperAdmin ONLY
// ============================================================

exports.permanentDeleteProperty =
  async (req, res) => {
    try {
      const property =
        await Property.findById(
          req.params.id
        );

      if (!property) {
        return res.status(404).json({
          success: false,
          message:
            "Property not found",
        });
      }

      await Property.findByIdAndDelete(
        req.params.id
      );

      res.json({
        success: true,
        message:
          "Property permanently deleted",
      });
    } catch (err) {
      console.error(
        "PERMANENT DELETE ERROR:",
        err
      );

      res.status(500).json({
        success: false,
        message:
          err.message,
      });
    }
  };


// ============================================================
// GET PROPERTY BY SLUG
// PUBLIC
//
// ONLY:
//   ✅ Published
//   ✅ Active
//   ✅ Not Deleted
//
// NEVER:
//   ❌ Draft
//   ❌ Trash
//   ❌ Inactive
// ============================================================

exports.getPropertyBySlug = async (
  req,
  res
) => {
  try {
    const { slug } = req.params;

    const property =
      await Property.findOne({
        slug,
        status: "published",
        isActive: true,
        isDeleted: false,
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

    res.status(200).json({
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

// ============================================================
// GET PROPERTY PREVIEW
// AGENT + SUPERADMIN
//
// Used for ADMIN PREVIEW only.
//
// Agent:
//   ✅ Published
//   ✅ Draft
//   ❌ Trash
//
// SuperAdmin:
//   ✅ Published
//   ✅ Draft
//   ✅ Trash
// ============================================================

exports.getPropertyPreview = async (
  req,
  res
) => {
  try {
    const property =
      await Property.findOne({
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

    // --------------------------------------------------------
    // Agent cannot preview Trash
    // --------------------------------------------------------

    if (
      property.isDeleted &&
      !canAccessTrash(req)
    ) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    res.status(200).json({
      success: true,
      data: property,
    });
  } catch (err) {
    console.error(
      "GET PROPERTY PREVIEW ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};



// ============================================================
// GET PROPERTY BY ID
// Agent + SuperAdmin
// ============================================================

exports.getPropertyById = async (
  req,
  res
) => {
  try {
    const property =
      await Property.findById(
        req.params.id
      )
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
        message:
          "Property not found ❌",
      });
    }

    // --------------------------------------------------------
    // Agent cannot access Trash
    // --------------------------------------------------------

    if (
      property.isDeleted &&
      !canAccessTrash(req)
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Property not found ❌",
      });
    }

    res.json({
      success: true,
      data: property,
    });
  } catch (err) {
    console.error(
      "GET BY ID ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      message:
        err.message,
    });
  }
};


// ============================================================
// AI CREATE PROPERTY
// ============================================================
// Creates an AI-generated PROPERTY DRAFT only.
//
// RULES:
// - AI does not create MongoDB ObjectIds.
// - Backend generates the property slug.
// - Backend controls status, isDeleted, isActive and propertyTag.
// - Developer, category and location are optional.
// - Reference lookup uses an ID when supplied, then a unique
//   exact-name match.
// - Ambiguous or missing references remain empty.
// - Never select an arbitrary duplicate record.
// - Never automatically create developer/category/location.
// - Property is always created as a draft.
// - AI drafts do not inherit unrelated template copy.
// ============================================================

exports.aiCreateProperty = async (req, res) => {
  try {
    const aiData = req.body?.aiData;

    // ==========================================================
    // BASIC VALIDATION
    // ==========================================================

    if (
      !aiData ||
      typeof aiData !== "object" ||
      Array.isArray(aiData)
    ) {
      return res.status(400).json({
        success: false,
        message: "AI property data is required.",
      });
    }

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user is required.",
      });
    }

    // ==========================================================
    // SAFE HELPERS
    // ==========================================================

    const cleanString = (value) => {
      if (value === null || value === undefined) return "";

      if (
        typeof value === "object" ||
        typeof value === "function"
      ) {
        return "";
      }

      return String(value).trim();
    };

    const nullableString = (value) => cleanString(value);

    const safeNumber = (value) => {
      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {
        return null;
      }

      // Do not convert formatted prices or area strings
      // such as "₹1.5 Cr" or "1,250 sq. ft." into numbers.
      if (
        typeof value === "string" &&
        !/^-?\d+(\.\d+)?$/.test(value.trim())
      ) {
        return null;
      }

      const number = Number(value);

      return Number.isFinite(number) ? number : null;
    };

    const safeBoolean = (value) => value === true;

    const safeArray = (value) =>
      Array.isArray(value) ? value : [];

    const safeObject = (value) =>
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
        ? value
        : {};

    const isValidObjectId = (value) =>
      /^[a-f\d]{24}$/i.test(cleanString(value));

    const escapeRegex = (value) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const cleanItems = (value, mapper, isValid) =>
      safeArray(value)
        .filter(
          (item) =>
            item &&
            typeof item === "object" &&
            !Array.isArray(item) &&
            isValid(item)
        )
        .map(mapper);

    const firstNonEmpty = (...values) => {
      for (const value of values) {
        const cleaned = cleanString(value);

        if (cleaned) return cleaned;
      }

      return "";
    };

    // ==========================================================
    // EXTRACT AI VALUES
    // ==========================================================

    const {
      title,
      marketType,
      developerName,
      categoryName,
      startingPrice,
      maxPrice,
      priceOnRequest,
      locationName,
      address,
      heroDescription,
      propertyStatus,
      landArea,
      possession,
      totalUnits,
      totalTowers,
      floors,
      reraNumber,
      configurationType,
      unitConfigurations,
      plotConfigurations,
      highlights,
      amenities,
      landmarks,
      overviewDescription,
      featureBar,
      overviewContent,
      configurationContent,
      locationContent,
      locationBottomStrip,
      masterPlanContent,
      floorPlans,
      seoContent,
      faqSectionContent,
      faqs,
      ctaContent,
    } = aiData;

    // ==========================================================
    // TITLE
    // ==========================================================

    const cleanTitle = cleanString(title);

    if (!cleanTitle) {
      return res.status(400).json({
        success: false,
        message:
          "AI could not identify the property/project name. " +
          "Please provide a clearer property name.",
      });
    }

    // ==========================================================
    // MARKET TYPE
    // ==========================================================

    const normalizedMarketType =
      marketType === "Primary" || marketType === "Resale"
        ? marketType
        : null;

    // ==========================================================
    // DEVELOPER LOOKUP
    // Resolve by ID first, then by unique exact name.
    // Never select an arbitrary duplicate.
    // ==========================================================

    let developer = null;

    const requestedDeveloperRef = cleanString(
      aiData.developerRef
    );

    const cleanDeveloperName = cleanString(developerName);

    if (isValidObjectId(requestedDeveloperRef)) {
      developer = await Developer.findById(
        requestedDeveloperRef
      ).lean();
    }

    if (!developer && cleanDeveloperName) {
      const developerMatches = await Developer.find({
        name: {
          $regex: `^${escapeRegex(cleanDeveloperName)}$`,
          $options: "i",
        },
      })
        .limit(2)
        .lean();

      if (developerMatches.length === 1) {
        developer = developerMatches[0];
      }
    }

    // ==========================================================
    // CATEGORY LOOKUP
    // Resolve by ID first, then by unique exact name/fullPath.
    // ==========================================================

    let category = null;

    const requestedCategoryRef = cleanString(
      aiData.categoryRef
    );

    const cleanCategoryName = cleanString(categoryName);

    if (isValidObjectId(requestedCategoryRef)) {
      category = await Category.findById(
        requestedCategoryRef
      ).lean();
    }

    if (!category && cleanCategoryName) {
      const categoryRegex = {
        $regex: `^${escapeRegex(cleanCategoryName)}$`,
        $options: "i",
      };

      const categoryMatches = await Category.find({
        $or: [
          { name: categoryRegex },
          { fullPath: categoryRegex },
        ],
      })
        .limit(2)
        .lean();

      if (categoryMatches.length === 1) {
        category = categoryMatches[0];
      }
    }

    // ==========================================================
    // LOCATION LOOKUP
    // Resolve by ID first, then by unique exact name.
    // Ambiguous locations must not block draft creation.
    // ==========================================================

    let location = null;

    const requestedLocationRef = cleanString(
      aiData.locationRef
    );

    const cleanLocationName = cleanString(locationName);

    if (isValidObjectId(requestedLocationRef)) {
      location = await Location.findById(
        requestedLocationRef
      ).lean();
    }

    if (!location && cleanLocationName) {
      const locationMatches = await Location.find({
        name: {
          $regex: `^${escapeRegex(cleanLocationName)}$`,
          $options: "i",
        },
      })
        .limit(2)
        .lean();

      if (locationMatches.length === 1) {
        location = locationMatches[0];
      }
    }

    // ==========================================================
    // SLUG GENERATION
    // ==========================================================

    const slugBase = cleanTitle
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!slugBase) {
      return res.status(400).json({
        success: false,
        message: "Unable to generate a valid property slug.",
      });
    }

    let slug = slugBase;
    let slugCounter = 2;

    while (await Property.exists({ slug })) {
      slug = `${slugBase}-${slugCounter}`;
      slugCounter++;
    }

    // ==========================================================
    // CLEAN UNIT CONFIGURATIONS
    // ==========================================================

    const safeUnitConfigurations = cleanItems(
      unitConfigurations,
      (item) => ({
        unitType: nullableString(item.unitType),
        area: nullableString(item.area),
        price: nullableString(item.price),
        paymentPlan: nullableString(item.paymentPlan),
        bedrooms: nullableString(item.bedrooms),
        bathrooms: nullableString(item.bathrooms),
        balconies: nullableString(item.balconies),
      }),
      (item) => Boolean(cleanString(item.unitType))
    );

    // ==========================================================
    // CLEAN FLOOR PLANS
    // Preserve the information but not unverified image URLs.
    // ==========================================================

    const safeFloorPlans = cleanItems(
      floorPlans,
      (item) => ({
        unitType: nullableString(item.unitType),
        area: nullableString(item.area),
        price: nullableString(item.price),
        paymentPlan: nullableString(item.paymentPlan),
        bedrooms: nullableString(item.bedrooms),
        bathrooms: nullableString(item.bathrooms),
        balconies: nullableString(item.balconies),
        image: "",
      }),
      (item) =>
        Boolean(
          cleanString(item.unitType) ||
          cleanString(item.area) ||
          cleanString(item.price)
        )
    );

    // ==========================================================
    // CLEAN PLOT CONFIGURATIONS
    // ==========================================================

    const safePlotConfigurations = cleanItems(
      plotConfigurations,
      (item) => ({
        plotType: nullableString(item.plotType),
        plotArea: nullableString(item.plotArea),
        price: nullableString(item.price),
        paymentPlan: nullableString(item.paymentPlan),
        image: "",
      }),
      (item) =>
        Boolean(
          cleanString(item.plotType) ||
          cleanString(item.plotArea) ||
          cleanString(item.price) ||
          cleanString(item.paymentPlan)
        )
    );

    // ==========================================================
    // UNIT CONFIGURATION FALLBACK
    //
    // If the AI omitted unitConfigurations but supplied
    // floorPlans, reuse their verified text fields.
    // ==========================================================

    const finalUnitConfigurations =
      safeUnitConfigurations.length > 0
        ? safeUnitConfigurations
        : safeFloorPlans
            .filter((item) => cleanString(item.unitType))
            .map((item) => ({
              unitType: item.unitType,
              area: item.area,
              price: item.price,
              paymentPlan: item.paymentPlan,
              bedrooms: item.bedrooms,
              bathrooms: item.bathrooms,
              balconies: item.balconies,
            }));

    // ==========================================================
    // CLEAN HIGHLIGHTS
    // ==========================================================

    const safeHighlights = cleanItems(
      highlights,
      (item) => ({
        heading: cleanString(item.heading),
        subheading: cleanString(item.subheading),
        icon: cleanString(item.icon),
      }),
      (item) => Boolean(cleanString(item.heading))
    );

    // ==========================================================
    // CLEAN AMENITIES
    // Keep only supplied amenities. Do not invent any here.
    // ==========================================================

    const safeAmenities = cleanItems(
      amenities,
      (item) => ({
        heading: cleanString(item.heading),
        subheading: cleanString(item.subheading),
        icon: cleanString(item.icon),
      }),
      (item) => Boolean(cleanString(item.heading))
    );

    // ==========================================================
    // CLEAN LANDMARKS
    // ==========================================================

    const safeLandmarks = cleanItems(
      landmarks,
      (item) => ({
        name: cleanString(item.name),
        distance: cleanString(item.distance),
        subtitle: cleanString(item.subtitle),
        icon: cleanString(item.icon),
      }),
      (item) => Boolean(cleanString(item.name))
    );

    // ==========================================================
    // CLEAN FEATURE BAR
    // ==========================================================

    const safeFeatureBar = cleanItems(
      featureBar,
      (item) => ({
        title: cleanString(item.title),
        desc: cleanString(item.desc),
        icon: cleanString(item.icon),
      }),
      (item) => Boolean(cleanString(item.title))
    );

    // ==========================================================
    // OVERVIEW CONTENT
    // ==========================================================

    const safeOverviewContent = safeObject(overviewContent);

    const safeOverviewDescription = firstNonEmpty(
      overviewDescription,
      safeOverviewContent.description
    );

    const safeOverviewBottomStrip = cleanItems(
      safeOverviewContent.bottomStrip,
      (item) => ({
        title: cleanString(item.title),
        desc: cleanString(item.desc),
        icon: cleanString(item.icon),
      }),
      (item) => Boolean(cleanString(item.title))
    );

    const overviewData = {
      aboutSectionNumber: nullableString(
        safeOverviewContent.aboutSectionNumber
      ),

      aboutLabel: nullableString(
        safeOverviewContent.aboutLabel
      ),

      aboutTitleLine1: nullableString(
        safeOverviewContent.aboutTitleLine1
      ),

      aboutTitleLine2: nullableString(
        safeOverviewContent.aboutTitleLine2
      ),

      description: nullableString(
        safeOverviewDescription
      ),

      aboutParagraph2: nullableString(
        safeOverviewContent.aboutParagraph2
      ),

      aboutImageUrl: "",

      featureBar: safeFeatureBar,

      highlightsHeading: nullableString(
        safeOverviewContent.highlightsHeading
      ),

      highlightsSubheading: nullableString(
        safeOverviewContent.highlightsSubheading
      ),

      highlightQuote: nullableString(
        safeOverviewContent.highlightQuote
      ),

      amenitiesSectionNumber: nullableString(
        safeOverviewContent.amenitiesSectionNumber
      ),

      amenitiesSectionLabel: nullableString(
        safeOverviewContent.amenitiesSectionLabel
      ),

      amenitiesHeadingLine1: nullableString(
        safeOverviewContent.amenitiesHeadingLine1
      ),

      amenitiesHeadingLine2: nullableString(
        safeOverviewContent.amenitiesHeadingLine2
      ),

      amenitiesHeadingLine3: nullableString(
        safeOverviewContent.amenitiesHeadingLine3
      ),

      amenitiesSubheading: nullableString(
        safeOverviewContent.amenitiesSubheading
      ),

      highlights: safeHighlights,

      amenities: safeAmenities,

      bottomStripTitle1: nullableString(
        safeOverviewContent.bottomStripTitle1
      ),

      bottomStripTitle2: nullableString(
        safeOverviewContent.bottomStripTitle2
      ),

      bottomStripFeature1: nullableString(
        safeOverviewContent.bottomStripFeature1
      ),

      bottomStripFeature2: nullableString(
        safeOverviewContent.bottomStripFeature2
      ),

      bottomStripFeature3: nullableString(
        safeOverviewContent.bottomStripFeature3
      ),

    };

    // ==========================================================
    // CONFIGURATION CONTENT
    // ==========================================================

    const safeConfigurationContent = safeObject(
      configurationContent
    );

const safeConfigurationFeatures = safeArray(
  safeConfigurationContent.features
)
  .map((item) => {
    // The current schema expects strings, not objects.
    if (typeof item === "string") {
      return item.trim();
    }

    if (item && typeof item === "object") {
      const title = cleanString(item.title);
      const description = cleanString(item.description);

      if (title && description) {
        return `${title}: ${description}`;
      }

      return title || description;
    }

    return "";
  })
  .filter(Boolean);


    const configurationSection = {
      sectionNumber: nullableString(
        safeConfigurationContent.sectionNumber
      ),

      sectionLabel: nullableString(
        safeConfigurationContent.sectionLabel
      ),

      titleLine1: nullableString(
        safeConfigurationContent.titleLine1
      ),

      titleLine2: nullableString(
        safeConfigurationContent.titleLine2
      ),

      subheading: nullableString(
        safeConfigurationContent.subheading
      ),

      features: safeConfigurationFeatures,

      buttonText: nullableString(
        safeConfigurationContent.buttonText
      ),
    };

    // ==========================================================
    // LOCATION CONTENT
    // ==========================================================

    const safeLocationContent = safeObject(locationContent);

    const safeLocationBottomStrip = cleanItems(
      locationBottomStrip,
      (item) => ({
        title: cleanString(item.title),
        desc: cleanString(item.desc),
        icon: cleanString(item.icon),
      }),
      (item) => Boolean(cleanString(item.title))
    );

    const locationData = {
      locationRef: location?._id || null,

      // Never store an unresolved location name as a resolved
      // database location.
      locationName: location
        ? firstNonEmpty(
            location.name,
            location.locationName
          )
        : "",

      customLocation: "",

      address: nullableString(address),

      // Never accept a raw iframe or unverified map embed URL
      // from generated AI content.
      mapEmbedUrl: "",

      sectionNumber: nullableString(
        safeLocationContent.sectionNumber
      ),

      topLabel: nullableString(
        safeLocationContent.topLabel
      ),

      headingLine1: nullableString(
        safeLocationContent.headingLine1
      ),

      headingHighlight: nullableString(
        safeLocationContent.headingHighlight
      ),

      description: nullableString(
        safeLocationContent.description
      ),

      leftCardTag: nullableString(
        safeLocationContent.leftCardTag
      ),

      leftCardTitleLine1: nullableString(
        safeLocationContent.leftCardTitleLine1
      ),

      leftCardTitleLine2: nullableString(
        safeLocationContent.leftCardTitleLine2
      ),

      leftCardDescription: nullableString(
        safeLocationContent.leftCardDescription
      ),

      mapSectionTag: nullableString(
        safeLocationContent.mapSectionTag
      ),

      mapSectionTitle: nullableString(
        safeLocationContent.mapSectionTitle
      ),

      badgeTitle: nullableString(
        safeLocationContent.badgeTitle
      ),

      badgeSubtitle: nullableString(
        safeLocationContent.badgeSubtitle
      ),

      floatingCardTag: nullableString(
        safeLocationContent.floatingCardTag
      ),

      floatingCardTitle: nullableString(
        safeLocationContent.floatingCardTitle
      ),

      floatingCardDescription: nullableString(
        safeLocationContent.floatingCardDescription
      ),

      landmarks: safeLandmarks,

      bottomStrip: safeLocationBottomStrip,
    };

    // ==========================================================
    // MASTER PLAN
    // ==========================================================

    const safeMasterPlanContent = safeObject(
      masterPlanContent
    );

    const safeMasterPlanBottomStrip = cleanItems(
      safeMasterPlanContent.bottomStrip,
      (item) => ({
        title: cleanString(item.title),
        desc: cleanString(item.desc),
        icon: cleanString(item.icon),
      }),
      (item) => Boolean(cleanString(item.title))
    );

    const masterPlanSection = {
      sectionNumber: nullableString(
        safeMasterPlanContent.sectionNumber
      ),

      topLabel: nullableString(
        safeMasterPlanContent.topLabel
      ),

      headingLine1: nullableString(
        safeMasterPlanContent.headingLine1
      ),

      headingHighlight: nullableString(
        safeMasterPlanContent.headingHighlight
      ),

      description: nullableString(
        safeMasterPlanContent.description
      ),

      enableSideStrips:
        safeMasterPlanContent.enableSideStrips === true,

      topFloatingLabel: nullableString(
        safeMasterPlanContent.topFloatingLabel
      ),

      centerTitle: nullableString(
        safeMasterPlanContent.centerTitle
      ),

      centerDescription: nullableString(
        safeMasterPlanContent.centerDescription
      ),

      buttonText: nullableString(
        safeMasterPlanContent.buttonText
      ),

      // Keep this empty until a verified image URL is supplied
      // by a trusted media/upload workflow.
      masterPlanImage: "",

      bottomStrip: safeMasterPlanBottomStrip,
    };

    // ==========================================================
    // SEO
    // ==========================================================

    const safeSeoContent = safeObject(seoContent);

    const safeSeoKeywords = [
      ...new Set(
        safeArray(safeSeoContent.keywords)
          .filter(
            (keyword) =>
              typeof keyword === "string" &&
              keyword.trim()
          )
          .map((keyword) => keyword.trim())
      ),
    ];

    const seoEngine = {
      hasCustomSEO:
        Boolean(cleanString(safeSeoContent.metaTitle)) ||
        Boolean(
          cleanString(safeSeoContent.metaDescription)
        ) ||
        safeSeoKeywords.length > 0,

      metaTitle: nullableString(
        safeSeoContent.metaTitle
      ),

      metaDescription: nullableString(
        safeSeoContent.metaDescription
      ),

      keywords: safeSeoKeywords,
    };

    // ==========================================================
    // FAQ SECTION CONTENT
    // ==========================================================

    const safeFaqSectionContent = safeObject(
      faqSectionContent
    );

    const faqSection = {
      sectionNumber: nullableString(
        safeFaqSectionContent.sectionNumber
      ),

      topLabel: nullableString(
        safeFaqSectionContent.topLabel
      ),

      headingLine1: nullableString(
        safeFaqSectionContent.headingLine1
      ),

      headingHighlight: nullableString(
        safeFaqSectionContent.headingHighlight
      ),

      description: nullableString(
        safeFaqSectionContent.description
      ),

      developerLabel: nullableString(
        safeFaqSectionContent.developerLabel
      ),

      contactTitle: nullableString(
        safeFaqSectionContent.contactTitle
      ),

      contactDescription: nullableString(
        safeFaqSectionContent.contactDescription
      ),

      phone: nullableString(
        safeFaqSectionContent.phone
      ),

      timing: nullableString(
        safeFaqSectionContent.timing
      ),

      ctaTitle: nullableString(
        safeFaqSectionContent.ctaTitle
      ),

      ctaDescription: nullableString(
        safeFaqSectionContent.ctaDescription
      ),

      ctaButtonText: nullableString(
        safeFaqSectionContent.ctaButtonText
      ),

      callLabel: nullableString(
        safeFaqSectionContent.callLabel
      ),

      whatsappLabel: nullableString(
        safeFaqSectionContent.whatsappLabel
      ),
    };

    // ==========================================================
    // FAQS
    // ==========================================================

    const safeFaqs = cleanItems(
      faqs,
      (item) => ({
        question: cleanString(item.question),
        answer: cleanString(item.answer),
      }),
      (item) =>
        Boolean(
          cleanString(item.question) &&
          cleanString(item.answer)
        )
    );

    // ==========================================================
    // CTA
    // ==========================================================

    const safeCtaContent = safeObject(ctaContent);

    const cta = {
      title: nullableString(safeCtaContent.title),
      subtitle: nullableString(safeCtaContent.subtitle),
      buttonText: nullableString(
        safeCtaContent.buttonText
      ),
    };

    // ==========================================================
    // CONFIGURATION TYPE
    // ==========================================================

    const requestedConfigurationType =
      cleanString(configurationType);

    let safeConfigurationType = null;

    if (
      requestedConfigurationType === "Apartments" ||
      requestedConfigurationType === "Plots"
    ) {
      safeConfigurationType = requestedConfigurationType;
    } else if (
      safePlotConfigurations.length > 0 &&
      finalUnitConfigurations.length === 0
    ) {
      safeConfigurationType = "Plots";
    } else if (finalUnitConfigurations.length > 0) {
      safeConfigurationType = "Apartments";
    }

    // ==========================================================
    // DEVELOPER DATA
    // ==========================================================

    const developerData = {
      developerRef: developer?._id || null,

      developerName: developer
        ? firstNonEmpty(
            developer.name,
            developer.developerName
          )
        : "",

      developerLogo: developer
        ? firstNonEmpty(
            developer.logo,
            developer.developerLogo
          )
        : "",

      developerImage: developer
        ? firstNonEmpty(
            developer.image,
            developer.developerImage
          )
        : "",
    };

    // ==========================================================
    // CATEGORY DATA
    // ==========================================================

    const categoryData = {
      categoryRef: category?._id || null,

      categoryName: category
        ? firstNonEmpty(
            category.name,
            category.categoryName
          )
        : "",
    };

    // ==========================================================
    // KEY METRICS / CUSTOM METRICS
    // ==========================================================

    const safeKeyMetrics = safeObject(aiData.keyMetrics);

    const rawCustomMetrics =
      aiData.customMetrics ??
      safeKeyMetrics.customMetrics;

const safeCustomMetrics = cleanItems(
  rawCustomMetrics,
  (item) => ({
    label: firstNonEmpty(
      item.label,
      item.title,
      item.name,
      item.heading,
      item.key
    ),

    value: firstNonEmpty(
      item.value,
      item.description,
      item.text
    ),

    icon: firstNonEmpty(item.icon, "FaHome"),
  }),
  (item) =>
    Boolean(
      firstNonEmpty(
        item.label,
        item.title,
        item.name,
        item.heading,
        item.key
      ) &&
      firstNonEmpty(
        item.value,
        item.description,
        item.text
      )
    )
);


    // ==========================================================
    // PROPERTY PAYLOAD
    // ==========================================================

    const propertyPayload = {
      slug,

      marketType: normalizedMarketType,

      // Backend-controlled draft values.
      isActive: true,
      status: "draft",
      isDeleted: false,
      deletedFromStatus: null,
      propertyTag: ["Normal"],

      // CORE DETAILS
      coreDetails: {
        // Keep the official project name here.
        // Search-optimized text belongs in seoEngine.metaTitle.
        title: cleanTitle,

        developerRef: developerData.developerRef,
        developerName: developerData.developerName,
        developerImage: developerData.developerImage,
        developerLogo: developerData.developerLogo,

        startingPrice: safeNumber(startingPrice),
        maxPrice: safeNumber(maxPrice),
        priceOnRequest: safeBoolean(priceOnRequest),
      },

      // CATEGORY
      categoryData,

      // HERO
      heroSection: {
        propertyStatus: nullableString(propertyStatus),
        heroDescription: nullableString(heroDescription),
        brochureButtonText: nullableString(
          safeObject(aiData.heroSection).brochureButtonText
        ),
        videoButtonText: nullableString(
          safeObject(aiData.heroSection).videoButtonText
        ),
        taglineItems: safeArray(
          safeObject(aiData.heroSection).taglineItems
        )
          .filter(
            (item) =>
              typeof item === "string" && item.trim()
          )
          .map((item) => item.trim()),
      },

      // KEY METRICS
      keyMetrics: {
        landArea: nullableString(
          landArea ?? safeKeyMetrics.landArea
        ),

        possession: nullableString(
          possession ?? safeKeyMetrics.possession
        ),

        status: nullableString(
          propertyStatus ?? safeKeyMetrics.status
        ),

        totalUnits: safeNumber(
          totalUnits ?? safeKeyMetrics.totalUnits
        ),

        totalTowers: safeNumber(
          totalTowers ?? safeKeyMetrics.totalTowers
        ),

        floors: nullableString(
          floors ?? safeKeyMetrics.floors
        ),

        reraNumber: nullableString(
          reraNumber ?? safeKeyMetrics.reraNumber
        ),

        customMetrics: safeCustomMetrics,
      },

      // OVERVIEW
      overview: overviewData,

      // CONFIGURATION SECTION
      configurationSection,

      // UNIT CONFIGURATIONS
      unitConfigurations: finalUnitConfigurations,

      // LOCATION
      locationData,

      // MASTER PLAN
      masterPlanSection,

      // GATED CONTENT
      gatedContent: {
        brochurePdfUrl: "",
        configurationType: safeConfigurationType,
        floorPlans: safeFloorPlans,
        plotConfigurations: safePlotConfigurations,
        requireLogin: false,
      },

      // MEDIA
      // AI-provided arbitrary image URLs are deliberately not
      // persisted here. A later trusted media workflow can map
      // verified images into these fields.
      media: {
        heroImageUrl: "",
        gallery: [],
        walkthroughUrl: "",
      },

      // SEO
      seoEngine,

      // FAQ
      faqSection,
      faqs: safeFaqs,

      // CTA
      cta,

      // AUTHENTICATED CREATOR
      createdBy: req.user.id,
    };

    // ==========================================================
    // CREATE DRAFT
    // ==========================================================

    const property = await Property.create(propertyPayload);

    // ==========================================================
    // RESPONSE
    // ==========================================================

    return res.status(201).json({
      success: true,

      message: "AI property draft created successfully.",

      draftId: property._id,

      data: property,

      resolution: {
        developer: {
          requested: cleanDeveloperName || null,
          resolved: Boolean(developer),
          id: developer?._id || null,
          name: developer?.name || null,
        },

        category: {
          requested: cleanCategoryName || null,
          resolved: Boolean(category),
          id: category?._id || null,
          name: category?.name || null,
        },

        location: {
          requested: cleanLocationName || null,
          resolved: Boolean(location),
          id: location?._id || null,
          name: location
            ? firstNonEmpty(
                location.name,
                location.locationName
              ) || null
            : null,
        },
      },

      reviewRequired: {
        marketType: normalizedMarketType === null,
        developer: !developer,
        category: !category,
        location: !location,
      },

      contentSummary: {
        highlights: safeHighlights.length,
        amenities: safeAmenities.length,
        landmarks: safeLandmarks.length,
        unitConfigurations: finalUnitConfigurations.length,
        floorPlans: safeFloorPlans.length,
        plotConfigurations: safePlotConfigurations.length,
        customMetrics: safeCustomMetrics.length,
        faqs: safeFaqs.length,
      },
    });
  } catch (error) {
    console.error("AI CREATE PROPERTY ERROR:", error);

    // ==========================================================
    // MONGOOSE VALIDATION ERROR
    // ==========================================================

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Property validation failed.",
        errors: Object.fromEntries(
          Object.entries(error.errors).map(
            ([key, value]) => [key, value.message]
          )
        ),
      });
    }

    // ==========================================================
    // DUPLICATE KEY ERROR
    // ==========================================================

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A property with the same unique value already exists.",
        duplicateFields: error.keyValue || {},
      });
    }

    // ==========================================================
    // GENERAL ERROR
    // ==========================================================

    return res.status(500).json({
      success: false,
      message: "Failed to create AI property draft.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
};


exports.getPropertySeoList = async (
  req,
  res
) => {
  try {
    const filter = {
      status: "published",
      isDeleted: {
        $ne: true,
      },
      isActive: {
        $ne: false,
      },
      deletedFromStatus: {
        $nin: [
          "trash",
          "inactive",
        ],
      },
      slug: {
        $exists: true,
        $ne: "",
      },
    };

    const properties =
      await Property.find(filter)
        .select({
          _id: 0,
          slug: 1,
          status: 1,
          isDeleted: 1,
          isActive: 1,
          deletedFromStatus: 1,
          updatedAt: 1,
          createdAt: 1,
          title: 1,
          name: 1,
          "coreDetails.title": 1,
          "coreDetails.developerRef": 1,
          "coreDetails.developerName": 1,
          "locationData.locationName": 1,
          "locationData.customLocation": 1,
          locationName: 1,
          developerName: 1,
          "developer.name": 1,
        })
        .populate(
          "coreDetails.developerRef",
          "name -_id"
        )
        .lean();

    return res.status(200).json({
      success: true,
      data: properties,
    });
  } catch (error) {
    console.error(
      "GET PROPERTY SEO LIST ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};