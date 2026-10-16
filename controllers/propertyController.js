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

    // --------------------------------------------------------
    // 1. AUTHENTICATION
    // --------------------------------------------------------

    const userId = req.user?.id || req.user?._id;

    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to create an AI property draft.",
      });
    }

    // --------------------------------------------------------
    // 2. INPUT VALIDATION
    // --------------------------------------------------------

    const input = req.body?.aiData;

    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return res.status(400).json({
        success: false,
        message: "aiData must be a valid JSON object.",
      });
    }

    const cleanString = (value, maxLength = 20000) => {
      if (typeof value !== "string" && typeof value !== "number") {
        return "";
      }

      return String(value)
        .replace(/\u0000/g, "")
        .trim()
        .slice(0, maxLength);
    };

    const safeObject = (value) =>
      value && typeof value === "object" && !Array.isArray(value)
        ? value
        : {};

    const safeArray = (value) => (Array.isArray(value) ? value : []);

    const safeBoolean = (value, fallback = false) =>
      typeof value === "boolean" ? value : fallback;

    const safeNumber = (value) => {
      if (typeof value === "number") {
        return Number.isFinite(value) && value >= 0 ? value : null;
      }

      if (typeof value !== "string") return null;

      const normalized = value.trim();

      // Accept plain numbers only.
      // Do not guess what "₹1.95 Cr", "1,950 sq ft", etc. mean.
      if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;

      const number = Number(normalized);

      return Number.isFinite(number) && number >= 0 ? number : null;
    };

    const safeId = (value) => {
      const id = cleanString(value, 100);

      return mongoose.Types.ObjectId.isValid(id) ? id : null;
    };

    const safeTextArray = (value, maxItems = 50, maxLength = 1000) =>
      safeArray(value)
        .slice(0, maxItems)
        .map((item) => cleanString(item, maxLength))
        .filter(Boolean);

    const escapeRegex = (value) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const getFirstString = (...values) => {
      for (const value of values) {
        const result = cleanString(value);
        if (result) return result;
      }

      return "";
    };

    // Do not accept an arbitrary object ID supplied by AI as proof
    // that the corresponding developer/category/location is correct.
    // Every reference must be verified against the database.

    const resolveReference = async ({
      Model,
      suppliedId,
      suppliedName,
      nameFields = ["name"],
    }) => {
      const id = safeId(suppliedId);
      const name = cleanString(suppliedName, 300);

      if (id) {
        const record = await Model.findById(id)
          .select("_id name slug")
          .lean();

        if (record) {
          return {
            record,
            resolved: true,
            method: "id",
            suppliedName: name,
          };
        }
      }

      if (name) {
        for (const field of nameFields) {
          // Only search explicitly allowed schema fields.
          if (!["name", "slug", "fullPath"].includes(field)) continue;

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
              suppliedName: name,
            };
          }
        }
      }

      return {
        record: null,
        resolved: false,
        method: null,
        suppliedName: name,
      };
    };

    // --------------------------------------------------------
    // 3. READ INPUT SECTIONS
    // --------------------------------------------------------

    const core = safeObject(input.coreDetails);
    const categoryInput = safeObject(input.categoryData);
    const heroInput = safeObject(input.heroSection);
    const metricsInput = safeObject(input.keyMetrics);
    const overviewInput = safeObject(input.overview);
    const configurationInput = safeObject(input.configurationSection);
    const locationInput = safeObject(input.locationData);
    const masterPlanInput = safeObject(input.masterPlanSection);
    const gatedInput = safeObject(input.gatedContent);
    const seoInput = safeObject(input.seoEngine);
    const faqSectionInput = safeObject(input.faqSection);
    const ctaInput = safeObject(input.cta);

    const overviewContent = safeObject(input.overviewContent);
    const configurationContent = safeObject(input.configurationContent);
    const locationContent = safeObject(input.locationContent);
    const masterPlanContent = safeObject(input.masterPlanContent);
    const seoContent = safeObject(input.seoContent);
    const faqSectionContent = safeObject(input.faqSectionContent);
    const ctaContent = safeObject(input.ctaContent);

    const cleanTitle = getFirstString(
      core.title,
      input.title,
      input.projectName,
      input.propertyName
    );

    if (!cleanTitle) {
      return res.status(400).json({
        success: false,
        message: "A property title or project name is required.",
      });
    }

    const marketTypeInput = getFirstString(
      input.marketType,
      core.marketType
    );

    const marketType = ["Primary", "Resale"].includes(marketTypeInput)
      ? marketTypeInput
      : "Primary";

    const developerName = getFirstString(
      core.developerName,
      input.developerName,
      input.developer
    );

    const categoryName = getFirstString(
      categoryInput.categoryName,
      input.categoryName,
      input.propertyType
    );

    const locationName = getFirstString(
      locationInput.locationName,
      input.locationName,
      input.location
    );

    const locationAddress = getFirstString(
      locationInput.address,
      input.address
    );

    // --------------------------------------------------------
    // 4. RESOLVE DATABASE REFERENCES
    // --------------------------------------------------------

    const [developerResolution, categoryResolution, locationResolution] =
      await Promise.all([
        resolveReference({
          Model: Developer,
          suppliedId: core.developerRef || input.developerRef,
          suppliedName: developerName,
          nameFields: ["name"],
        }),

        resolveReference({
          Model: Category,
          suppliedId:
            categoryInput.categoryRef ||
            input.categoryRef,
          suppliedName: categoryName,
          nameFields: ["name", "slug", "fullPath"],
        }),

        resolveReference({
          Model: Location,
          suppliedId:
            locationInput.locationRef ||
            input.locationRef,
          suppliedName: locationName,
          nameFields: ["name", "slug"],
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

    // --------------------------------------------------------
    // 5. SAFE SUBDOCUMENT MAPPERS
    // --------------------------------------------------------

    const mapTextItems = (
      items,
      {
        titleKeys = ["title", "name", "heading"],
        descriptionKeys = ["description", "desc", "subtitle"],
        maxItems = 40,
      } = {}
    ) =>
      safeArray(items)
        .slice(0, maxItems)
        .map((raw) => {
          const item = safeObject(raw);

          return {
            title: getFirstString(
              ...titleKeys.map((key) => item[key])
            ),
            description: getFirstString(
              ...descriptionKeys.map((key) => item[key])
            ),
          };
        })
        .filter((item) => item.title || item.description);

    const mapFeatureItems = (items, maxItems = 40) =>
      safeArray(items)
        .slice(0, maxItems)
        .map((raw) => {
          const item = safeObject(raw);

          return {
            heading: getFirstString(
              item.heading,
              item.title,
              item.name
            ),
            subheading: getFirstString(
              item.subheading,
              item.description,
              item.desc
            ),
          };
        })
        .filter((item) => item.heading || item.subheading);

    const mapBottomStrip = (items, maxItems = 12) =>
      safeArray(items)
        .slice(0, maxItems)
        .map((raw) => {
          const item = safeObject(raw);

          return {
            title: getFirstString(item.title, item.heading, item.name),
            desc: getFirstString(
              item.desc,
              item.description,
              item.subheading
            ),
          };
        })
        .filter((item) => item.title || item.desc);

    const mapConfigurations = (items, maxItems = 40) =>
      safeArray(items)
        .slice(0, maxItems)
        .map((raw) => {
          const item = safeObject(raw);

          return {
            unitType: getFirstString(
              item.unitType,
              item.configuration,
              item.type,
              item.name
            ),
            area: getFirstString(item.area, item.size, item.areaRange),
            price: getFirstString(item.price, item.startingPrice),
            paymentPlan: getFirstString(
              item.paymentPlan,
              item.paymentTerms
            ),
            bedrooms: getFirstString(item.bedrooms, item.bhk),
            bathrooms: getFirstString(item.bathrooms),
            balconies: getFirstString(item.balconies),
          };
        })
        .filter(
          (item) =>
            item.unitType ||
            item.area ||
            item.price ||
            item.bedrooms
        );

    const mapPlotConfigurations = (items, maxItems = 40) =>
      safeArray(items)
        .slice(0, maxItems)
        .map((raw) => {
          const item = safeObject(raw);

          return {
            plotType: getFirstString(
              item.plotType,
              item.unitType,
              item.type,
              item.name
            ),
            area: getFirstString(item.area, item.size, item.areaRange),
            price: getFirstString(item.price, item.startingPrice),
            paymentPlan: getFirstString(
              item.paymentPlan,
              item.paymentTerms
            ),
          };
        })
        .filter((item) => item.plotType || item.area || item.price);

    const mapLandmarks = (items, maxItems = 40) =>
      safeArray(items)
        .slice(0, maxItems)
        .map((raw) => {
          const item = safeObject(raw);

          return {
            name: getFirstString(item.name, item.title),
            distance: getFirstString(item.distance, item.distanceText),
            subtitle: getFirstString(
              item.subtitle,
              item.description,
              item.type
            ),
          };
        })
        .filter((item) => item.name);

    const mapFaqs = (items, maxItems = 30) =>
      safeArray(items)
        .slice(0, maxItems)
        .map((raw) => {
          const item = safeObject(raw);

          return {
            question: getFirstString(item.question, item.title),
            answer: getFirstString(item.answer, item.content),
          };
        })
        .filter((item) => item.question && item.answer);

    const mapCustomMetrics = (items, maxItems = 20) =>
      safeArray(items)
        .slice(0, maxItems)
        .map((raw) => {
          const item = safeObject(raw);

          return {
            label: getFirstString(item.label, item.title, item.name),
            value: getFirstString(item.value, item.description),
          };
        })
        .filter((item) => item.label && item.value);

    const mapTaglineItems = (items) =>
      safeTextArray(items, 12, 180);

    // --------------------------------------------------------
    // 6. CONFIGURATION TYPE
    // Existing schema supports only Apartments and Plots.
    // Do not pass an unsupported enum value into Mongoose.
    // --------------------------------------------------------

    const rawConfigurationType = getFirstString(
      gatedInput.configurationType,
      input.configurationType
    );

    const unitConfigurations = mapConfigurations(
      input.unitConfigurations
    );

    const floorPlans = mapConfigurations(
      gatedInput.floorPlans || input.floorPlans
    );

    const plotConfigurations = mapPlotConfigurations(
      input.plotConfigurations || gatedInput.plotConfigurations
    );

    const allUnitConfigurations =
      unitConfigurations.length > 0
        ? unitConfigurations
        : floorPlans;

    let configurationType;

    if (["Apartments", "Plots"].includes(rawConfigurationType)) {
      configurationType = rawConfigurationType;
    } else if (
      /plot|land/i.test(categoryName) ||
      plotConfigurations.length > 0
    ) {
      configurationType = "Plots";
    } else {
      // The existing schema does not support "Independent Floors".
      // Map to Apartments for compatibility with the existing enum.
      configurationType = "Apartments";
    }

    // --------------------------------------------------------
    // 7. SLUG GENERATION
    // Only published, non-deleted properties reserve a slug
    // under the published partial unique index.
    // --------------------------------------------------------

    const slugBase =
      cleanTitle
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 170)
        .replace(/-+$/g, "") || "property";

    let slug = slugBase;
    let slugCounter = 2;

    while (
      await Property.exists({
        slug,
        isDeleted: false,
        status: "published",
      })
    ) {
      slug = `${slugBase}-${slugCounter}`;
      slugCounter += 1;
    }

    // --------------------------------------------------------
    // 8. BUILD PROPERTY PAYLOAD
    // Explicitly create a draft. Never trust AI status fields.
    // --------------------------------------------------------

    const priceOnRequest = safeBoolean(
      core.priceOnRequest ?? input.priceOnRequest,
      false
    );

    const startingPrice = safeNumber(
      core.startingPrice ?? input.startingPrice
    );

    const maxPrice = safeNumber(
      core.maxPrice ?? input.maxPrice
    );

    const heroDescription = getFirstString(
      heroInput.heroDescription,
      input.heroDescription,
      overviewContent.heroDescription
    );

    const overviewDescription = getFirstString(
      overviewInput.description,
      overviewContent.description,
      input.overviewDescription,
      input.description
    );

    const overviewFeatureBar = safeArray(
      overviewInput.featureBar || input.featureBar
    )
      .slice(0, 12)
      .map((raw) => {
        const item = safeObject(raw);

        return {
          title: getFirstString(item.title, item.heading, item.name),
          desc: getFirstString(
            item.desc,
            item.description,
            item.subtitle
          ),
        };
      })
      .filter((item) => item.title || item.desc);

    const overviewHighlights = mapFeatureItems(
      overviewInput.highlights || input.highlights
    );

    const overviewAmenities = mapFeatureItems(
      overviewInput.amenities || input.amenities,
      60
    );

    const customMetrics = mapCustomMetrics(
      metricsInput.customMetrics || input.customMetrics
    );

    const locationLandmarks = mapLandmarks(
      locationInput.landmarks || input.landmarks
    );

    const locationBottomStrip = mapBottomStrip(
      locationInput.bottomStrip ||
        input.locationBottomStrip ||
        locationContent.bottomStrip
    );

    const masterPlanBottomStrip = mapBottomStrip(
      masterPlanInput.bottomStrip ||
        masterPlanContent.bottomStrip
    );

    const seoKeywords = safeTextArray(
      seoInput.keywords ||
        seoContent.keywords ||
        input.seoKeywords,
      40,
      150
    );

    const faqItems = mapFaqs(input.faqs);

    const propertyPayload = {
      slug,

      marketType,

      // Always draft, irrespective of AI-provided status.
      status: "draft",
      isActive: true,
      isDeleted: false,
      deletedFromStatus: null,
      propertyTag: "Normal",

      createdBy: userId,

      coreDetails: {
        title: cleanTitle,

        developerRef: developerRecord?._id || null,
        developerName: developerRecord
          ? cleanString(developerRecord.name, 300)
          : "",

        developerImage: "",
        developerLogo: "",

        startingPrice: priceOnRequest ? null : startingPrice,
        maxPrice: priceOnRequest ? null : maxPrice,
        priceOnRequest,
      },

      categoryData: {
        categoryRef: categoryRecord?._id || null,
        categoryName: categoryRecord
          ? cleanString(categoryRecord.name, 300)
          : "",
      },

      heroSection: {
        propertyStatus: getFirstString(
          heroInput.propertyStatus,
          metricsInput.status
        ),

        heroDescription,

        brochureButtonText: getFirstString(
          heroInput.brochureButtonText
        ),

        videoButtonText: getFirstString(
          heroInput.videoButtonText
        ),

        taglineItems: mapTaglineItems(
          heroInput.taglineItems || input.taglineItems
        ),
      },

      keyMetrics: {
        landArea: getFirstString(metricsInput.landArea),
        possession: getFirstString(metricsInput.possession),
        status: getFirstString(metricsInput.status),

        totalUnits: safeNumber(metricsInput.totalUnits),
        totalTowers: safeNumber(metricsInput.totalTowers),

        floors: getFirstString(metricsInput.floors),
        reraNumber: getFirstString(metricsInput.reraNumber),

        customMetrics,
      },

      overview: {
        description: overviewDescription,

        aboutTitle: getFirstString(
          overviewInput.aboutTitle,
          overviewContent.aboutTitle
        ),

        aboutParagraph1: getFirstString(
          overviewInput.aboutParagraph1,
          overviewContent.aboutParagraph1
        ),

        aboutParagraph2: getFirstString(
          overviewInput.aboutParagraph2,
          overviewContent.aboutParagraph2
        ),

        aboutImageUrl: "",

        featureBar: overviewFeatureBar,
        highlights: overviewHighlights,
        amenities: overviewAmenities,

        bottomStrip: mapBottomStrip(
          overviewInput.bottomStrip ||
            overviewContent.bottomStrip
        ),
      },

      configurationSection: {
        title: getFirstString(
          configurationInput.title,
          configurationContent.title
        ),

        description: getFirstString(
          configurationInput.description,
          configurationContent.description
        ),

        features: safeTextArray(
          configurationInput.features ||
            configurationContent.features,
          40,
          1000
        ),
      },

      unitConfigurations: allUnitConfigurations,

      media: {
        // AI-generated media URLs are not trusted automatically.
        // Add reviewed assets through your admin/media workflow.
        heroImageUrl: "",
        gallery: [],
        walkthroughUrl: "",
      },

      locationData: {
        locationRef: locationRecord?._id || null,

        locationName: locationRecord
          ? cleanString(locationRecord.name, 300)
          : "",

        customLocation: locationRecord
          ? ""
          : locationName,

        address: locationAddress,

        // Do not accept arbitrary AI iframe/HTML embeds.
        mapEmbedUrl: "",

        title: getFirstString(
          locationInput.title,
          locationContent.title
        ),

        description: getFirstString(
          locationInput.description,
          locationContent.description
        ),

        landmarks: locationLandmarks,
        bottomStrip: locationBottomStrip,
      },

      masterPlanSection: {
        title: getFirstString(
          masterPlanInput.title,
          masterPlanContent.title
        ),

        description: getFirstString(
          masterPlanInput.description,
          masterPlanContent.description
        ),

        masterPlanImage: "",

        bottomStrip: masterPlanBottomStrip,
      },

      gatedContent: {
        brochurePdfUrl: "",

        configurationType,

        floorPlans: floorPlans,

        plotConfigurations,

        requireLogin: safeBoolean(
          gatedInput.requireLogin,
          false
        ),
      },

      seoEngine: {
        hasCustomSEO: Boolean(
          getFirstString(
            seoInput.metaTitle,
            seoContent.metaTitle
          ) ||
            getFirstString(
              seoInput.metaDescription,
              seoContent.metaDescription
            )
        ),

        metaTitle: getFirstString(
          seoInput.metaTitle,
          seoContent.metaTitle
        ),

        metaDescription: getFirstString(
          seoInput.metaDescription,
          seoContent.metaDescription
        ),

        keywords: seoKeywords,
      },

      faqSection: {
        title: getFirstString(
          faqSectionInput.title,
          faqSectionContent.title
        ),

        description: getFirstString(
          faqSectionInput.description,
          faqSectionContent.description
        ),

        phone: "",
        timing: "",
      },

      faqs: faqItems,

      cta: {
        title: getFirstString(
          ctaInput.title,
          ctaContent.title
        ),

        description: getFirstString(
          ctaInput.description,
          ctaContent.description
        ),

        buttonText: getFirstString(
          ctaInput.buttonText,
          ctaContent.buttonText
        ),
      },
    };

    // --------------------------------------------------------
    // 9. CREATE DRAFT
    // --------------------------------------------------------

    const createdProperty = await Property.create(propertyPayload);

    // --------------------------------------------------------
    // 10. REVIEW FLAGS
    // --------------------------------------------------------

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

    const reviewRequired =
      unresolvedReferences.length > 0 ||
      !overviewDescription ||
      !heroDescription ||
      !seoContent.metaTitle && !seoInput.metaTitle ||
      !seoContent.metaDescription && !seoInput.metaDescription ||
      faqItems.length === 0 ||
      (marketType === "Primary" && !metricsInput.reraNumber);

    const contentSummary = {
      unitConfigurations: allUnitConfigurations.length,
      floorPlans: floorPlans.length,
      plotConfigurations: plotConfigurations.length,
      highlights: overviewHighlights.length,
      amenities: overviewAmenities.length,
      landmarks: locationLandmarks.length,
      faqs: faqItems.length,
      customMetrics: customMetrics.length,
      featureBar: overviewFeatureBar.length,
      seoKeywords: seoKeywords.length,
    };

    return res.status(201).json({
      success: true,

      message:
        "AI property draft created successfully. Verify all facts and references before publishing.",

      draftId: createdProperty._id,

      data: createdProperty,

      resolution,

      unresolvedReferences,

      reviewRequired,

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
          "A property with a conflicting unique value already exists. Please retry after checking the existing record.",
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