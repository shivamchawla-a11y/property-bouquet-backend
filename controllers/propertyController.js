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
// AI CREATE PROPERTY — PROPERTY BOUQUET
// Creates a reviewable draft from AI-generated property data.
// NEVER publishes an AI-generated property automatically.
// ============================================================

exports.aiCreateProperty = async (req, res) => {
  try {
    const mongoose = require("mongoose");

    const userId = req.user?.id || req.user?._id;

    if (
      !userId ||
      !mongoose.Types.ObjectId.isValid(String(userId))
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to create an AI property draft.",
      });
    }

    // =========================================================
    // 2. INPUT VALIDATION
    // =========================================================

    const input = req.body?.aiData;

    if (
      !input ||
      typeof input !== "object" ||
      Array.isArray(input)
    ) {
      return res.status(400).json({
        success: false,
        message: "aiData must be a valid JSON object.",
      });
    }

    const obj = (value) =>
      value && typeof value === "object" && !Array.isArray(value)
        ? value
        : {};

    const arr = (value) => Array.isArray(value) ? value : [];

    const str = (value, max = 20000) => {
      if (typeof value !== "string" && typeof value !== "number") {
        return "";
      }

      return String(value)
        .replace(/\u0000/g, "")
        .trim()
        .slice(0, max);
    };

    const first = (...values) => {
      for (const value of values) {
        const result = str(value);
        if (result) return result;
      }
      return "";
    };

    const bool = (value, fallback = false) =>
      typeof value === "boolean" ? value : fallback;

    const num = (value) => {
      if (typeof value === "number") {
        return Number.isFinite(value) && value >= 0 ? value : null;
      }

      if (typeof value !== "string") return null;

      const valueString = value.trim();

      // Do not interpret ₹1.95 Cr, "1,950 sq ft", etc.
      if (!/^\d+(?:\.\d+)?$/.test(valueString)) return null;

      const parsed = Number(valueString);

      return Number.isFinite(parsed) && parsed >= 0
        ? parsed
        : null;
    };

    const textArray = (value, maxItems = 40, maxLength = 1000) =>
      arr(value)
        .slice(0, maxItems)
        .map((item) => str(item, maxLength))
        .filter(Boolean);

    const escapeRegex = (value) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // =========================================================
    // 3. READ THE ACTUAL INFORMATION EXTRACTOR SCHEMA
    // =========================================================

    const core = obj(input.coreDetails);
    const categoryInput = obj(input.categoryData);
    const hero = obj(input.heroSection);
    const metrics = obj(input.keyMetrics);
    const overview = obj(input.overview);
    const configuration = obj(input.configurationSection);
    const location = obj(input.locationData);
    const masterPlan = obj(input.masterPlanSection);
    const gated = obj(input.gatedContent);
    const seo = obj(input.seoEngine);
    const faqSection = obj(input.faqSection);
    const cta = obj(input.cta);

    const overviewContent = obj(input.overviewContent);
    const configurationContent = obj(input.configurationContent);
    const locationContent = obj(input.locationContent);
    const masterPlanContent = obj(input.masterPlanContent);
    const seoContent = obj(input.seoContent);
    const faqContent = obj(input.faqSectionContent);
    const ctaContent = obj(input.ctaContent);

    const title = first(
      core.title,
      input.title,
      input.projectName,
      input.propertyName
    );

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "A property title or project name is required.",
      });
    }

    const rawMarketType = first(input.marketType, core.marketType);

    // Invalid or missing market type is not silently classified as Primary.
    const marketType = ["Primary", "Resale"].includes(rawMarketType)
      ? rawMarketType
      : null;

    const developerName = first(
      core.developerName,
      input.developerName,
      input.developer
    );

    const categoryName = first(
      categoryInput.categoryName,
      input.categoryName,
      input.propertyType
    );

    const locationName = first(
      location.locationName,
      input.locationName,
      input.location
    );

    const address = first(location.address, input.address);

    // =========================================================
    // 4. DATABASE REFERENCE RESOLUTION
    // =========================================================

    const resolveReference = async ({
      Model,
      suppliedId,
      suppliedName,
      allowedFields,
    }) => {
      const name = str(suppliedName, 300);
      const id = str(suppliedId, 100);

      // If both ID and name are supplied, require them to agree.
      if (id && mongoose.Types.ObjectId.isValid(id)) {
        const byId = await Model.findById(id)
          .select("_id name slug")
          .lean();

        if (byId) {
          if (
            name &&
            ![byId.name, byId.slug].some(
              (candidate) =>
                str(candidate).toLowerCase() === name.toLowerCase()
            )
          ) {
            return {
              record: null,
              resolved: false,
              method: "id-name-mismatch",
            };
          }

          return {
            record: byId,
            resolved: true,
            method: "id",
          };
        }
      }

      if (!name) {
        return {
          record: null,
          resolved: false,
          method: null,
        };
      }

      for (const field of allowedFields) {
        const record = await Model.findOne({
          [field]: {
            $regex: `^${escapeRegex(name)}$`,
            $options: "i",
          },
        })
          .select("_id name slug")
          .lean();

        if (record) {
          return {
            record,
            resolved: true,
            method: `exact-${field}`,
          };
        }
      }

      return {
        record: null,
        resolved: false,
        method: null,
      };
    };

    const [developerResolution, categoryResolution, locationResolution] =
      await Promise.all([
        resolveReference({
          Model: Developer,
          suppliedId: core.developerRef || input.developerRef,
          suppliedName: developerName,
          allowedFields: ["name", "slug"],
        }),

        resolveReference({
          Model: Category,
          suppliedId: categoryInput.categoryRef || input.categoryRef,
          suppliedName: categoryName,
          allowedFields: ["name", "slug"],
        }),

        resolveReference({
          Model: Location,
          suppliedId: location.locationRef || input.locationRef,
          suppliedName: locationName,
          allowedFields: ["name", "slug"],
        }),
      ]);

    const developerRecord = developerResolution.record;
    const categoryRecord = categoryResolution.record;
    const locationRecord = locationResolution.record;

    const resolution = {
      developer: {
        resolved: Boolean(developerRecord),
        method: developerResolution.method,
        suppliedName: developerName,
        id: developerRecord?._id?.toString() || null,
      },
      category: {
        resolved: Boolean(categoryRecord),
        method: categoryResolution.method,
        suppliedName: categoryName,
        id: categoryRecord?._id?.toString() || null,
      },
      location: {
        resolved: Boolean(locationRecord),
        method: locationResolution.method,
        suppliedName: locationName,
        id: locationRecord?._id?.toString() || null,
      },
    };

    // =========================================================
    // 5. SUBDOCUMENT MAPPERS
    // =========================================================

    const mapFeatures = (items, limit = 40) =>
      arr(items)
        .slice(0, limit)
        .map((raw) => {
          const item = obj(raw);

          return {
            heading: first(item.heading, item.title, item.name),
            subheading: first(
              item.subheading,
              item.description,
              item.desc
            ),
          };
        })
        .filter((item) => item.heading || item.subheading);

    const mapFeatureBar = (items) =>
      arr(items)
        .slice(0, 12)
        .map((raw) => {
          const item = obj(raw);

          return {
            title: first(item.title, item.heading, item.name),
            desc: first(item.desc, item.description, item.subtitle),
          };
        })
        .filter((item) => item.title || item.desc);

    const mapStrip = (items, limit = 12) =>
      arr(items)
        .slice(0, limit)
        .map((raw) => {
          const item = obj(raw);

          return {
            title: first(item.title, item.heading, item.name),
            desc: first(item.desc, item.description, item.subheading),
          };
        })
        .filter((item) => item.title || item.desc);

    const mapConfigurations = (items, limit = 40) =>
      arr(items)
        .slice(0, limit)
        .map((raw) => {
          const item = obj(raw);

          return {
            unitType: first(
              item.unitType,
              item.configuration,
              item.type,
              item.name
            ),
            area: first(item.area, item.size, item.areaRange),
            price: first(item.price, item.startingPrice),
            paymentPlan: first(item.paymentPlan, item.paymentTerms),
            bedrooms: first(item.bedrooms, item.bhk),
            bathrooms: first(item.bathrooms),
            balconies: first(item.balconies),
          };
        })
        .filter(
          (item) =>
            item.unitType ||
            item.area ||
            item.price ||
            item.bedrooms
        );

    const mapPlotConfigurations = (items, limit = 40) =>
      arr(items)
        .slice(0, limit)
        .map((raw) => {
          const item = obj(raw);

          return {
            plotType: first(
              item.plotType,
              item.unitType,
              item.type,
              item.name
            ),
            // IMPORTANT: Property.js uses plotArea, not area.
            plotArea: first(
              item.plotArea,
              item.area,
              item.size,
              item.areaRange
            ),
            price: first(item.price, item.startingPrice),
            paymentPlan: first(item.paymentPlan, item.paymentTerms),
            image: "",
          };
        })
        .filter(
          (item) => item.plotType || item.plotArea || item.price
        );

    const mapLandmarks = (items) =>
      arr(items)
        .slice(0, 40)
        .map((raw) => {
          const item = obj(raw);

          return {
            name: first(item.name, item.title),
            distance: first(item.distance, item.distanceText),
            subtitle: first(
              item.subtitle,
              item.description,
              item.type
            ),
          };
        })
        .filter((item) => item.name);

    const mapFaqs = (items) =>
      arr(items)
        .slice(0, 30)
        .map((raw) => {
          const item = obj(raw);

          return {
            question: first(item.question, item.title),
            answer: first(item.answer, item.content),
          };
        })
        .filter((item) => item.question && item.answer);

    const mapCustomMetrics = (items) =>
      arr(items)
        .slice(0, 20)
        .map((raw) => {
          const item = obj(raw);

          return {
            label: first(item.label, item.title, item.name),
            value: first(item.value, item.description),
            icon: "FaHome",
          };
        })
        .filter((item) => item.label && item.value);

    // =========================================================
    // 6. CONFIGURATION AND PRICING
    // =========================================================

    const unitConfigurations = mapConfigurations(
      input.unitConfigurations
    );

    const floorPlans = mapConfigurations(
      gated.floorPlans || input.floorPlans
    ).map((item) => ({
      ...item,
      image: "",
    }));

    const plotConfigurations = mapPlotConfigurations(
      input.plotConfigurations || gated.plotConfigurations
    );

    const allUnitConfigurations = unitConfigurations.length
      ? unitConfigurations
      : floorPlans.map(
          ({
            unitType,
            area,
            price,
            paymentPlan,
            bedrooms,
            bathrooms,
            balconies,
          }) => ({
            unitType,
            area,
            price,
            paymentPlan,
            bedrooms,
            bathrooms,
            balconies,
          })
        );

    const rawConfigurationType = first(
      gated.configurationType,
      input.configurationType
    );

    let configurationType;

    if (["Apartments", "Plots"].includes(rawConfigurationType)) {
      configurationType = rawConfigurationType;
    } else if (
      /plot|land/i.test(categoryName) ||
      plotConfigurations.length
    ) {
      configurationType = "Plots";
    } else {
      configurationType = "Apartments";
    }

    const priceOnRequest = bool(
      core.priceOnRequest ?? input.priceOnRequest,
      false
    );

    const startingPrice = num(
      core.startingPrice ?? input.startingPrice
    );

    const maxPrice = num(core.maxPrice ?? input.maxPrice);

    // =========================================================
    // 7. SLUG
    // =========================================================

    const slugBase =
      title
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 170)
        .replace(/-+$/g, "") || "property";

    let slug = slugBase;
    let counter = 2;

    while (
      await Property.exists({
        slug,
        isDeleted: false,
        status: "published",
      })
    ) {
      slug = `${slugBase}-${counter++}`;
    }

    // =========================================================
    // 8. BUILD CONTENT FROM THE PROVIDED JSON SCHEMA
    // =========================================================

    const heroDescription = first(
      hero.heroDescription,
      input.heroDescription
    );

    const overviewDescription = first(
      overview.description,
      overviewContent.description,
      input.overviewDescription,
      input.description
    );

    const highlights = mapFeatures(
      overview.highlights || input.highlights
    );

    const amenities = mapFeatures(
      overview.amenities || input.amenities,
      60
    );

    const featureBar = mapFeatureBar(
      overview.featureBar || input.featureBar
    );

    const landmarks = mapLandmarks(
      location.landmarks || input.landmarks
    );

    const locationBottomStrip = mapStrip(
      location.bottomStrip ||
        input.locationBottomStrip
    );

    const masterPlanBottomStrip = mapStrip(
      masterPlan.bottomStrip ||
        masterPlanContent.bottomStrip
    );

    const seoTitle = first(seo.metaTitle, seoContent.metaTitle);
    const seoDescription = first(
      seo.metaDescription,
      seoContent.metaDescription
    );

    const seoKeywords = textArray(
      seo.keywords || seoContent.keywords || input.seoKeywords,
      40,
      150
    );

    const faqs = mapFaqs(input.faqs);

    const totalUnits = num(metrics.totalUnits ?? input.totalUnits);
    const totalTowers = num(metrics.totalTowers ?? input.totalTowers);

    // =========================================================
    // 9. PROPERTY PAYLOAD — MAPPED TO PROPERTY.JS
    // =========================================================

    const propertyPayload = {
      slug,

      marketType,

      // Never accept publication status from AI.
      status: "draft",
      isActive: true,
      isDeleted: false,
      deletedFromStatus: null,
      propertyTag: ["Normal"],

      createdBy: userId,

      coreDetails: {
        title,

        developerRef: developerRecord?._id || null,
        developerName: developerRecord
          ? str(developerRecord.name, 300)
          : developerName,

        developerImage: developerRecord
          ? str(developerRecord.image, 2000)
          : "",

        developerLogo: developerRecord
          ? str(developerRecord.logo, 2000)
          : "",

        startingPrice: priceOnRequest ? null : startingPrice,
        maxPrice: priceOnRequest ? null : maxPrice,
        priceOnRequest,
      },

      categoryData: {
        categoryRef: categoryRecord?._id || null,
        categoryName: categoryRecord
          ? str(categoryRecord.name, 300)
          : categoryName,
      },

      heroSection: {
        propertyStatus: first(
          hero.propertyStatus,
          metrics.status,
          input.propertyStatus
        ),

        heroDescription,

        brochureButtonText: first(
          hero.brochureButtonText,
          input.heroSection?.brochureButtonText
        ),

        videoButtonText: first(
          hero.videoButtonText,
          input.heroSection?.videoButtonText
        ),

        taglineItems: textArray(
          hero.taglineItems || input.taglineItems,
          12,
          180
        ),
      },

      keyMetrics: {
        landArea: first(metrics.landArea, input.landArea),
        possession: first(metrics.possession, input.possession),
        status: first(metrics.status, input.propertyStatus),

        totalUnits,
        totalTowers,

        floors: first(metrics.floors, input.floors),

        // Keep RERA where Property.js defines it.
        reraNumber: first(metrics.reraNumber, input.reraNumber),

        customMetrics: mapCustomMetrics(
          metrics.customMetrics || input.customMetrics
        ),
      },

      overview: {
        aboutSectionNumber: first(
          overview.aboutSectionNumber,
          overviewContent.aboutSectionNumber
        ),

        aboutLabel: first(
          overview.aboutLabel,
          overviewContent.aboutLabel
        ),

        aboutTitleLine1: first(
          overview.aboutTitleLine1,
          overviewContent.aboutTitleLine1
        ),

        aboutTitleLine2: first(
          overview.aboutTitleLine2,
          overviewContent.aboutTitleLine2
        ),

        description: overviewDescription,

        aboutParagraph2: first(
          overview.aboutParagraph2,
          overviewContent.aboutParagraph2
        ),

        aboutImageUrl: "",

        featureBar,

        highlightsHeading: first(
          overview.highlightsHeading,
          overviewContent.highlightsHeading
        ),

        highlightsSubheading: first(
          overview.highlightsSubheading,
          overviewContent.highlightsSubheading
        ),

        highlightQuote: first(
          overview.highlightQuote,
          overviewContent.highlightQuote
        ),

        amenitiesSectionNumber: first(
          overview.amenitiesSectionNumber,
          overviewContent.amenitiesSectionNumber
        ),

        amenitiesSectionLabel: first(
          overview.amenitiesSectionLabel,
          overviewContent.amenitiesSectionLabel
        ),

        amenitiesHeadingLine1: first(
          overview.amenitiesHeadingLine1,
          overviewContent.amenitiesHeadingLine1
        ),

        amenitiesHeadingLine2: first(
          overview.amenitiesHeadingLine2,
          overviewContent.amenitiesHeadingLine2
        ),

        amenitiesHeadingLine3: first(
          overview.amenitiesHeadingLine3,
          overviewContent.amenitiesHeadingLine3
        ),

        amenitiesSubheading: first(
          overview.amenitiesSubheading,
          overviewContent.amenitiesSubheading
        ),

        highlights,
        amenities,

        bottomStripTitle1: first(
          overview.bottomStripTitle1,
          overviewContent.bottomStripTitle1
        ),

        bottomStripTitle2: first(
          overview.bottomStripTitle2,
          overviewContent.bottomStripTitle2
        ),

        bottomStripFeature1: first(
          overview.bottomStripFeature1,
          overviewContent.bottomStripFeature1
        ),

        bottomStripFeature2: first(
          overview.bottomStripFeature2,
          overviewContent.bottomStripFeature2
        ),

        bottomStripFeature3: first(
          overview.bottomStripFeature3,
          overviewContent.bottomStripFeature3
        ),
      },

      configurationSection: {
        sectionNumber: first(
          configuration.sectionNumber,
          configurationContent.sectionNumber
        ),

        sectionLabel: first(
          configuration.sectionLabel,
          configurationContent.sectionLabel
        ),

        titleLine1: first(
          configuration.titleLine1,
          configurationContent.titleLine1
        ),

        titleLine2: first(
          configuration.titleLine2,
          configurationContent.titleLine2
        ),

        subheading: first(
          configuration.subheading,
          configurationContent.subheading
        ),

        features: textArray(
          configuration.features || configurationContent.features,
          40,
          1000
        ),

        buttonText: first(
          configuration.buttonText,
          configurationContent.buttonText
        ),
      },

      unitConfigurations: allUnitConfigurations,

      media: {
        heroImageUrl: "",
        gallery: [],
        walkthroughUrl: "",
      },

      locationData: {
        locationRef: locationRecord?._id || null,

        locationName: locationRecord
          ? str(locationRecord.name, 300)
          : locationName,

        customLocation: locationRecord ? "" : locationName,

        address,

        // Do not save AI-generated iframe HTML.
        // Set an approved embed URL through your trusted admin workflow.
        mapEmbedUrl: "",

        sectionNumber: first(
          location.sectionNumber,
          locationContent.sectionNumber
        ),

        topLabel: first(
          location.topLabel,
          locationContent.topLabel
        ),

        headingLine1: first(
          location.headingLine1,
          locationContent.headingLine1
        ),

        headingHighlight: first(
          location.headingHighlight,
          locationContent.headingHighlight
        ),

        description: first(
          location.description,
          locationContent.description
        ),

        leftCardTag: first(
          location.leftCardTag,
          locationContent.leftCardTag
        ),

        leftCardTitleLine1: first(
          location.leftCardTitleLine1,
          locationContent.leftCardTitleLine1
        ),

        leftCardTitleLine2: first(
          location.leftCardTitleLine2,
          locationContent.leftCardTitleLine2
        ),

        leftCardDescription: first(
          location.leftCardDescription,
          locationContent.leftCardDescription
        ),

        mapSectionTag: first(
          location.mapSectionTag,
          locationContent.mapSectionTag
        ),

        mapSectionTitle: first(
          location.mapSectionTitle,
          locationContent.mapSectionTitle
        ),

        badgeTitle: first(
          location.badgeTitle,
          locationContent.badgeTitle
        ),

        badgeSubtitle: first(
          location.badgeSubtitle,
          locationContent.badgeSubtitle
        ),

        floatingCardTag: first(
          location.floatingCardTag,
          locationContent.floatingCardTag
        ),

        floatingCardTitle: first(
          location.floatingCardTitle,
          locationContent.floatingCardTitle
        ),

        floatingCardDescription: first(
          location.floatingCardDescription,
          locationContent.floatingCardDescription
        ),

        landmarks,

        bottomStrip: locationBottomStrip,
      },

      masterPlanSection: {
        sectionNumber: first(
          masterPlan.sectionNumber,
          masterPlanContent.sectionNumber
        ),

        topLabel: first(
          masterPlan.topLabel,
          masterPlanContent.topLabel
        ),

        headingLine1: first(
          masterPlan.headingLine1,
          masterPlanContent.headingLine1
        ),

        headingHighlight: first(
          masterPlan.headingHighlight,
          masterPlanContent.headingHighlight
        ),

        description: first(
          masterPlan.description,
          masterPlanContent.description
        ),

        enableSideStrips: bool(
          masterPlan.enableSideStrips ??
            masterPlanContent.enableSideStrips,
          false
        ),

        topFloatingLabel: first(
          masterPlan.topFloatingLabel,
          masterPlanContent.topFloatingLabel
        ),

        centerTitle: first(
          masterPlan.centerTitle,
          masterPlanContent.centerTitle
        ),

        centerDescription: first(
          masterPlan.centerDescription,
          masterPlanContent.centerDescription
        ),

        buttonText: first(
          masterPlan.buttonText,
          masterPlanContent.buttonText
        ),

        masterPlanImage: "",

        bottomStrip: masterPlanBottomStrip,
      },

      gatedContent: {
        brochurePdfUrl: "",

        configurationType,

        floorPlans,

        plotConfigurations,

        requireLogin: bool(gated.requireLogin, true),
      },

      seoEngine: {
        hasCustomSEO: Boolean(seoTitle || seoDescription),

        metaTitle: seoTitle,
        metaDescription: seoDescription,

        keywords: seoKeywords,
      },

      faqSection: {
        sectionNumber: first(
          faqSection.sectionNumber,
          faqContent.sectionNumber
        ),

        topLabel: first(
          faqSection.topLabel,
          faqContent.topLabel
        ),

        headingLine1: first(
          faqSection.headingLine1,
          faqContent.headingLine1
        ),

        headingHighlight: first(
          faqSection.headingHighlight,
          faqContent.headingHighlight
        ),

        description: first(
          faqSection.description,
          faqContent.description
        ),

        developerLabel: first(
          faqSection.developerLabel,
          faqContent.developerLabel
        ),

        contactTitle: first(
          faqSection.contactTitle,
          faqContent.contactTitle
        ),

        contactDescription: first(
          faqSection.contactDescription,
          faqContent.contactDescription
        ),

        // Use your site's trusted contact details, not AI-generated
        // phone numbers. Leave these blank if your model supplies defaults.
        phone: "",
        timing: "",

        ctaTitle: first(faqSection.ctaTitle, faqContent.ctaTitle),

        ctaDescription: first(
          faqSection.ctaDescription,
          faqContent.ctaDescription
        ),

        ctaButtonText: first(
          faqSection.ctaButtonText,
          faqContent.ctaButtonText
        ),

        callLabel: first(faqSection.callLabel, faqContent.callLabel),

        whatsappLabel: first(
          faqSection.whatsappLabel,
          faqContent.whatsappLabel
        ),
      },

      faqs,

      cta: {
        title: first(cta.title, ctaContent.title),

        subtitle: first(
          cta.subtitle,
          ctaContent.subtitle
        ),

        buttonText: first(
          cta.buttonText,
          ctaContent.buttonText
        ),
      },
    };

    // =========================================================
    // 10. CREATE DRAFT
    // =========================================================

    const createdProperty = await Property.create(propertyPayload);

    // =========================================================
    // 11. REVIEW FLAGS
    // =========================================================

    const unresolvedReferences = [];

    if (!developerRecord && developerName) {
      unresolvedReferences.push("developer");
    }

    if (!categoryRecord && categoryName) {
      unresolvedReferences.push("category");
    }

    if (!locationRecord && locationName) {
      unresolvedReferences.push("location");
    }

    const reviewReasons = [];

    if (unresolvedReferences.length) {
      reviewReasons.push("unresolved_references");
    }

    if (!marketType) {
      reviewReasons.push("market_type_missing_or_invalid");
    }

    if (!overviewDescription) {
      reviewReasons.push("overview_description_missing");
    }

    if (!heroDescription) {
      reviewReasons.push("hero_description_missing");
    }

    if (!seoTitle) {
      reviewReasons.push("seo_title_missing");
    }

    if (!seoDescription) {
      reviewReasons.push("seo_description_missing");
    }

    if (!faqs.length) {
      reviewReasons.push("faqs_missing");
    }

    if (marketType === "Primary" && !metrics.reraNumber) {
      reviewReasons.push("rera_number_missing");
    }

    if (
      configurationType === "Plots" &&
      !plotConfigurations.length
    ) {
      reviewReasons.push("plot_configurations_missing");
    }

    if (
      configurationType === "Apartments" &&
      !allUnitConfigurations.length
    ) {
      reviewReasons.push("unit_configurations_missing");
    }

    const contentSummary = {
      unitConfigurations: allUnitConfigurations.length,
      floorPlans: floorPlans.length,
      plotConfigurations: plotConfigurations.length,
      highlights: highlights.length,
      amenities: amenities.length,
      landmarks: landmarks.length,
      faqs: faqs.length,
      customMetrics: customMetrics.length,
      featureBar: featureBar.length,
      seoKeywords: seoKeywords.length,
    };

    return res.status(201).json({
      success: true,

      message:
        "AI property draft created successfully. Review all facts, references, pricing and media before publishing.",

      draftId: createdProperty._id,

      data: createdProperty,

      resolution,

      unresolvedReferences,

      reviewRequired: reviewReasons.length > 0,

      reviewReasons,

      contentSummary,
    });
  } catch (error) {
    console.error("AI CREATE PROPERTY ERROR:", error);

    if (error?.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Property data failed schema validation.",
        errors: Object.values(error.errors || {}).map((item) => ({
          field: item.path,
          message: item.message,
        })),
      });
    }

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A unique value conflicts with an existing property. Check the slug and retry.",
        fields: error.keyValue || {},
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create the AI property draft.",
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