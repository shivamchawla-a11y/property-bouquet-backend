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
// IMPORTANT:
// - AI does NOT create MongoDB ObjectIds.
// - AI does NOT create the slug.
// - AI does NOT decide marketType.
// - AI does NOT control status/isDeleted/isActive/propertyTag.
// - Backend resolves Developer / Category / Location references.
// - Property is ALWAYS created as a draft.
// - AI drafts must NOT inherit unrelated template copy.
// ============================================================

exports.aiCreateProperty = async (req, res) => {
  try {
    const aiData = req.body?.aiData;

    // --------------------------------------------------------
    // BASIC VALIDATION
    // --------------------------------------------------------

    if (!aiData || typeof aiData !== "object") {
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

    // --------------------------------------------------------
    // EXTRACT AI VALUES
    // --------------------------------------------------------

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
      seoKeywords,
    } = aiData;

    // --------------------------------------------------------
    // TITLE
    // --------------------------------------------------------

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message:
          "AI could not identify the property/project name. Please provide a clearer property name.",
      });
    }

    // --------------------------------------------------------
    // MARKET TYPE
    // --------------------------------------------------------
    // NEVER GUESS.
    // Admin can select Primary / Resale during review.
    // --------------------------------------------------------

    let normalizedMarketType = null;

    if (marketType === "Primary" || marketType === "Resale") {
      normalizedMarketType = marketType;
    }

    // --------------------------------------------------------
    // DEVELOPER LOOKUP
    // --------------------------------------------------------

    let developer = null;

    if (developerName && String(developerName).trim()) {
      const cleanDeveloperName = String(developerName).trim();

      const escapedDeveloperName = cleanDeveloperName.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      developer = await Developer.findOne({
        name: {
          $regex: `^${escapedDeveloperName}$`,
          $options: "i",
        },
      }).lean();
    }

    // --------------------------------------------------------
    // CATEGORY LOOKUP
    // --------------------------------------------------------

    let category = null;

    if (categoryName && String(categoryName).trim()) {
      const cleanCategoryName = String(categoryName).trim();

      const escapedCategoryName = cleanCategoryName.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      category = await Category.findOne({
        name: {
          $regex: `^${escapedCategoryName}$`,
          $options: "i",
        },
      }).lean();

      // Try fullPath if exact category name wasn't found.
      if (!category) {
        category = await Category.findOne({
          fullPath: {
            $regex: `^${escapedCategoryName}$`,
            $options: "i",
          },
        }).lean();
      }
    }

    // --------------------------------------------------------
    // LOCATION LOOKUP
    // --------------------------------------------------------
    //
    // Exact match only.
    // If duplicate names exist, never guess.
    // --------------------------------------------------------

    let location = null;

    if (locationName && String(locationName).trim()) {
      const cleanLocationName = String(locationName).trim();

      const escapedLocationName = cleanLocationName.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const locationMatches = await Location.find({
        name: {
          $regex: `^${escapedLocationName}$`,
          $options: "i",
        },
      })
        .limit(2)
        .lean();

      if (locationMatches.length === 1) {
        location = locationMatches[0];
      }

      if (locationMatches.length > 1) {
        return res.status(400).json({
          success: false,
          message:
            `Multiple locations named "${cleanLocationName}" were found. ` +
            "Please select the correct location manually in the admin panel.",
          code: "AMBIGUOUS_LOCATION",
        });
      }
    }

    // --------------------------------------------------------
    // SLUG GENERATION
    // --------------------------------------------------------
    //
    // AI never controls the slug.
    //
    // IMPORTANT:
    // Only PUBLISHED active properties should block a slug.
    // Drafts should not force unnecessary -2, -3, etc.
    // --------------------------------------------------------

    const slugBase = String(title)
      .trim()
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

    while (
      await Property.exists({
        slug,
        isDeleted: false,
        status: "published",
        isActive: true,
      })
    ) {
      slug = `${slugBase}-${slugCounter}`;
      slugCounter++;
    }

    // --------------------------------------------------------
    // CLEAN UNIT CONFIGURATIONS
    // --------------------------------------------------------

    const safeUnitConfigurations = Array.isArray(unitConfigurations)
      ? unitConfigurations
          .filter(
            (item) =>
              item &&
              typeof item === "object" &&
              item.unitType
          )
          .map((item) => ({
            unitType: item.unitType ?? null,
            area: item.area ?? null,
            price: item.price ?? null,
            paymentPlan: item.paymentPlan ?? null,
            bedrooms: item.bedrooms ?? null,
            bathrooms: item.bathrooms ?? null,
            balconies: item.balconies ?? null,
          }))
      : [];

    // --------------------------------------------------------
    // CLEAN PLOT CONFIGURATIONS
    // --------------------------------------------------------

    const safePlotConfigurations = Array.isArray(plotConfigurations)
      ? plotConfigurations
          .filter(
            (item) =>
              item &&
              typeof item === "object" &&
              (
                item.plotType ||
                item.plotArea ||
                item.price ||
                item.paymentPlan
              )
          )
          .map((item) => ({
            plotType: item.plotType ?? null,
            plotArea: item.plotArea ?? null,
            price: item.price ?? null,
            paymentPlan: item.paymentPlan ?? null,
          }))
      : [];

    // --------------------------------------------------------
    // CLEAN HIGHLIGHTS
    // --------------------------------------------------------

    const safeHighlights = Array.isArray(highlights)
      ? highlights
          .filter(
            (item) =>
              item &&
              typeof item === "object" &&
              item.heading
          )
          .map((item) => ({
            heading: String(item.heading).trim(),
            subheading: item.subheading
              ? String(item.subheading).trim()
              : "",
          }))
      : [];

    // --------------------------------------------------------
    // CLEAN AMENITIES
    // --------------------------------------------------------

    const safeAmenities = Array.isArray(amenities)
      ? amenities
          .filter(
            (item) =>
              item &&
              typeof item === "object" &&
              item.heading
          )
          .map((item) => ({
            heading: String(item.heading).trim(),
            subheading: item.subheading
              ? String(item.subheading).trim()
              : "",
          }))
      : [];

    // --------------------------------------------------------
    // CLEAN LANDMARKS
    // --------------------------------------------------------

    const safeLandmarks = Array.isArray(landmarks)
      ? landmarks
          .filter(
            (item) =>
              item &&
              typeof item === "object" &&
              item.name
          )
          .map((item) => ({
            name: String(item.name).trim(),
            distance: item.distance
              ? String(item.distance).trim()
              : "",
          }))
      : [];

    // --------------------------------------------------------
    // CLEAN SEO KEYWORDS
    // --------------------------------------------------------

    const safeSeoKeywords = Array.isArray(seoKeywords)
      ? seoKeywords
          .filter(
            (keyword) =>
              typeof keyword === "string" &&
              keyword.trim()
          )
          .map((keyword) => keyword.trim())
      : [];

    // --------------------------------------------------------
    // DEVELOPER DATA
    // --------------------------------------------------------

    const developerData = {
      developerRef: developer?._id || null,

      developerName:
        developer?.name ||
        (developerName
          ? String(developerName).trim()
          : ""),

      developerLogo:
        developer?.logo || "",

      developerImage:
        developer?.image || "",
    };

    // --------------------------------------------------------
    // CATEGORY DATA
    // --------------------------------------------------------

    const categoryData = {
      categoryRef: category?._id || null,

      categoryName:
        category?.name ||
        (categoryName
          ? String(categoryName).trim()
          : ""),
    };

    // --------------------------------------------------------
    // LOCATION DATA
    // --------------------------------------------------------

    const locationData = {
      locationRef: location?._id || null,

      locationName:
        location?.name ||
        (locationName
          ? String(locationName).trim()
          : ""),

      customLocation: "",

      address:
        address
          ? String(address).trim()
          : "",

      mapEmbedUrl: "",

      presentation: {},

      landmarks: safeLandmarks,

      bottomStrip: {},
    };

    // --------------------------------------------------------
    // CONFIGURATION TYPE
    // --------------------------------------------------------

    let safeConfigurationType = null;

    if (
      configurationType === "Apartments" ||
      configurationType === "Plots"
    ) {
      safeConfigurationType = configurationType;
    }

    // --------------------------------------------------------
    // PROPERTY PAYLOAD
    // --------------------------------------------------------
    //
    // IMPORTANT:
    // We intentionally provide explicit empty values for
    // presentation sections so AI drafts do not inherit
    // unrelated luxury-template content.
    // --------------------------------------------------------

    const propertyPayload = {
      slug,

      marketType: normalizedMarketType,

      // Backend-controlled.
      isActive: true,
      status: "draft",
      isDeleted: false,
      deletedFromStatus: null,
      propertyTag: ["Normal"],

      // ======================================================
      // CORE DETAILS
      // ======================================================

      coreDetails: {
        title: String(title).trim(),

        developerRef:
          developerData.developerRef,

        developerName:
          developerData.developerName,

        developerImage:
          developerData.developerImage,

        developerLogo:
          developerData.developerLogo,

        startingPrice:
          typeof startingPrice === "number"
            ? startingPrice
            : null,

        maxPrice:
          typeof maxPrice === "number"
            ? maxPrice
            : null,

        priceOnRequest:
          priceOnRequest === true,
      },

      // ======================================================
      // CATEGORY
      // ======================================================

      categoryData,

      // ======================================================
      // HERO
      // ======================================================

      heroSection: {
        propertyStatus:
          propertyStatus
            ? String(propertyStatus).trim()
            : "",

        heroDescription:
          heroDescription
            ? String(heroDescription).trim()
            : "",

        brochureButtonText: "",
        videoButtonText: "",
        taglineItems: [],
      },

      // ======================================================
      // KEY METRICS
      // ======================================================

      keyMetrics: {
        landArea:
          landArea
            ? String(landArea).trim()
            : "",

        possession:
          possession
            ? String(possession).trim()
            : "",

        status:
          propertyStatus
            ? String(propertyStatus).trim()
            : "",

        totalUnits:
          typeof totalUnits === "number"
            ? totalUnits
            : null,

        totalTowers:
          typeof totalTowers === "number"
            ? totalTowers
            : null,

        floors:
          floors
            ? String(floors).trim()
            : "",

        reraNumber:
          reraNumber
            ? String(reraNumber).trim()
            : "",

        customMetrics: [],
      },

      // ======================================================
      // OVERVIEW
      // ======================================================
      //
      // Factual AI content only.
      // Template presentation copy is cleared AFTER creation.
      // ======================================================

      overview: {
        description:
          overviewDescription
            ? String(overviewDescription).trim()
            : "",

        featureBar: [],

        highlights: safeHighlights,

        amenities: safeAmenities,

        // Explicitly blank presentation content.
        aboutSectionNumber: "",
        aboutLabel: "",
        aboutTitleLine1: "",
        aboutTitleLine2: "",
        aboutParagraph2: "",
        aboutImageUrl: "",

        highlightsHeading: "",
        highlightsSubheading: "",
        highlightQuote: "",

        amenitiesSectionNumber: "",
        amenitiesSectionLabel: "",
        amenitiesHeadingLine1: "",
        amenitiesHeadingLine2: "",
        amenitiesHeadingLine3: "",
        amenitiesSubheading: "",

        bottomStripTitle1: "",
        bottomStripTitle2: "",
        bottomStripFeature1: "",
        bottomStripFeature2: "",
        bottomStripFeature3: "",
      },

      // ======================================================
      // CONFIGURATION SECTION
      // ======================================================

      configurationSection: {
        sectionNumber: "",
        sectionLabel: "",
        titleLine1: "",
        titleLine2: "",
        subheading: "",
        features: [],
        buttonText: "",
      },

      unitConfigurations:
        safeUnitConfigurations,

      // ======================================================
      // LOCATION
      // ======================================================

      locationData,

      // ======================================================
      // GATED CONTENT
      // ======================================================

      gatedContent: {
        brochurePdfUrl: "",

        configurationType:
          safeConfigurationType,

        floorPlans: [],

        plotConfigurations:
          safePlotConfigurations,

        requireLogin: false,
      },

      // ======================================================
      // MEDIA
      // ======================================================

      media: {
        heroImageUrl: "",
        gallery: [],
        walkthroughUrl: "",
      },

      // ======================================================
      // SEO
      // ======================================================

      seoEngine: {
        hasCustomSEO: false,
        metaTitle: "",
        metaDescription: "",
        keywords: safeSeoKeywords,
      },

      // ======================================================
      // FAQ
      // ======================================================

      faqSection: {
        sectionNumber: "",
        topLabel: "",
        headingLine1: "",
        headingHighlight: "",
        description: "",
        developerLabel: "",
        contactTitle: "",
        contactDescription: "",
        phone: "",
        timing: "",
        ctaTitle: "",
        ctaDescription: "",
        ctaButtonText: "",
        callLabel: "",
      },

      faqs: [],

      // ======================================================
      // CTA
      // ======================================================

      cta: {},

      // ======================================================
      // AUTHENTICATED CREATOR
      // ======================================================

      createdBy: req.user.id,
    };

    // ========================================================
    // CREATE DRAFT
    // ========================================================

    const property = await Property.create(propertyPayload);

    // ========================================================
    // IMPORTANT POST-CREATE CLEANUP
    // ========================================================
    //
    // Mongoose can apply schema defaults to nested fields that
    // were not explicitly represented by the schema.
    //
    // Clear known template/default presentation fields again
    // before saving, guaranteeing that old property marketing
    // copy cannot remain in an AI-created draft.
    // ========================================================

    const clearTemplateFields = {
      // ---------------- OVERVIEW ----------------

      "overview.aboutSectionNumber": "",
      "overview.aboutLabel": "",
      "overview.aboutTitleLine1": "",
      "overview.aboutTitleLine2": "",
      "overview.aboutParagraph2": "",
      "overview.aboutImageUrl": "",

      "overview.highlightsHeading": "",
      "overview.highlightsSubheading": "",
      "overview.highlightQuote": "",

      "overview.amenitiesSectionNumber": "",
      "overview.amenitiesSectionLabel": "",
      "overview.amenitiesHeadingLine1": "",
      "overview.amenitiesHeadingLine2": "",
      "overview.amenitiesHeadingLine3": "",
      "overview.amenitiesSubheading": "",

      "overview.bottomStripTitle1": "",
      "overview.bottomStripTitle2": "",
      "overview.bottomStripFeature1": "",
      "overview.bottomStripFeature2": "",
      "overview.bottomStripFeature3": "",

      // ---------------- CONFIGURATION ----------------

      "configurationSection.sectionNumber": "",
      "configurationSection.sectionLabel": "",
      "configurationSection.titleLine1": "",
      "configurationSection.titleLine2": "",
      "configurationSection.subheading": "",
      "configurationSection.buttonText": "",

      // ---------------- LOCATION ----------------

      "locationData.sectionNumber": "",
      "locationData.topLabel": "",
      "locationData.headingLine1": "",
      "locationData.headingHighlight": "",
      "locationData.description": "",

      "locationData.leftCardTag": "",
      "locationData.leftCardTitleLine1": "",
      "locationData.leftCardTitleLine2": "",
      "locationData.leftCardDescription": "",

      "locationData.mapSectionTag": "",
      "locationData.mapSectionTitle": "",

      "locationData.badgeTitle": "",
      "locationData.badgeSubtitle": "",

      "locationData.floatingCardTag": "",
      "locationData.floatingCardTitle": "",
      "locationData.floatingCardDescription": "",

      // ---------------- MASTER PLAN ----------------

      "masterPlanSection.sectionNumber": "",
      "masterPlanSection.topLabel": "",
      "masterPlanSection.headingLine1": "",
      "masterPlanSection.headingHighlight": "",
      "masterPlanSection.description": "",
      "masterPlanSection.enableSideStrips": false,
      "masterPlanSection.topFloatingLabel": "",
      "masterPlanSection.centerTitle": "",
      "masterPlanSection.centerDescription": "",
      "masterPlanSection.buttonText": "",
      "masterPlanSection.masterPlanImage": "",

      // ---------------- FAQ ----------------

      "faqSection.sectionNumber": "",
      "faqSection.topLabel": "",
      "faqSection.headingLine1": "",
      "faqSection.headingHighlight": "",
      "faqSection.description": "",
      "faqSection.developerLabel": "",
      "faqSection.contactTitle": "",
      "faqSection.contactDescription": "",
      "faqSection.phone": "",
      "faqSection.timing": "",
      "faqSection.ctaTitle": "",
      "faqSection.ctaDescription": "",
      "faqSection.ctaButtonText": "",
      "faqSection.callLabel": "",
    };

    Object.entries(clearTemplateFields).forEach(
      ([path, value]) => {
        property.set(path, value);
      }
    );

    await property.save();

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(201).json({
      success: true,

      message:
        "AI property draft created successfully.",

      draftId: property._id,

      data: property,

      resolution: {
        developer: {
          requested:
            developerName || null,

          resolved:
            !!developer,

          id:
            developer?._id || null,

          name:
            developer?.name || null,
        },

        category: {
          requested:
            categoryName || null,

          resolved:
            !!category,

          id:
            category?._id || null,

          name:
            category?.name || null,
        },

        location: {
          requested:
            locationName || null,

          resolved:
            !!location,

          id:
            location?._id || null,

          name:
            location?.name || null,
        },
      },

      reviewRequired: {
        marketType:
          normalizedMarketType === null,

        developer:
          !developer,

        category:
          !category,

        location:
          !location,
      },
    });
  } catch (error) {
    console.error(
      "AI CREATE PROPERTY ERROR:",
      error
    );

    // ========================================================
    // MONGOOSE VALIDATION ERROR
    // ========================================================

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,

        message:
          "Property validation failed.",

        errors:
          Object.fromEntries(
            Object.entries(error.errors).map(
              ([key, value]) => [
                key,
                value.message,
              ]
            )
          ),
      });
    }

    // ========================================================
    // DUPLICATE KEY ERROR
    // ========================================================

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,

        message:
          "A property with the same unique value already exists.",

        duplicateFields:
          error.keyValue || {},
      });
    }

    // ========================================================
    // GENERAL ERROR
    // ========================================================

    return res.status(500).json({
      success: false,

      message:
        "Failed to create AI property draft.",

      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
};