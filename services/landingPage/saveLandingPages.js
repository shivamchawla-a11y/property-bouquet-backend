const LandingPage = require("../../models/LandingPage");

// ======================================================
// SAVE LANDING PAGES
// ======================================================


const saveLandingPages = async (collections = []) => {
  const results = {
    created: 0,
    updated: 0,
    skipped: 0,
  };

  for (const collection of collections) {
    let existing =
  await LandingPage.findOne({
    fingerprint: collection.fingerprint,
  });

if (!existing) {
  existing =
    await LandingPage.findOne({
      slug: collection.slug,
    });
}

    // =====================================================
    // DOCUMENT TO SAVE
    // =====================================================

    const document = {
  title: collection.title,
  slug: collection.slug,
  fingerprint: collection.fingerprint,
  pageType: collection.pageType,
  values: collection.values,
  filters: collection.filters,
  propertyCount: collection.propertyCount,
  matchingProperties: collection.matchingProperties,
  statistics: collection.statistics,
  seoScore: collection.seoScore,
  seo: {
  hasCustomSEO:
    existing?.seo?.hasCustomSEO || false,

  generated: collection.seo,

  custom: {
    metaTitle:
      existing?.seo?.custom?.metaTitle || "",

    metaDescription:
      existing?.seo?.custom?.metaDescription || "",

    keywords:
      existing?.seo?.custom?.keywords || [],

    h1:
      existing?.seo?.custom?.h1 || "",

    canonical:
      existing?.seo?.custom?.canonical || "",

    updatedAt:
      existing?.seo?.custom?.updatedAt || null,
  },
},
  previewImage: collection.previewImage,
  generated: true,

  status:
    existing?.status ??
    collection.status ??
    "draft",

  publishedAt:
    existing?.publishedAt ?? null,

  lastGeneratedAt: new Date(),
};

    // =====================================================
// UPDATE
// =====================================================

if (existing) {
  
  // Preserve admin controlled fields
  document.status = existing.status;
  document.publishedAt = existing.publishedAt;
  document.createdBy = existing.createdBy;
  document.version = existing.version;
  document.generated = existing.generated;
  document.ignoreGeneration = existing.ignoreGeneration;
  document.isDeleted = existing.isDeleted;

  await LandingPage.findByIdAndUpdate(
    existing._id,
    document,
    {
      new: true,
      runValidators: true,
    }
  );

  results.updated++;

  continue;
}

    // =====================================================
    // CREATE
    // =====================================================

    await LandingPage.create(document);

    results.created++;
  }

  return results;
};

module.exports = saveLandingPages;