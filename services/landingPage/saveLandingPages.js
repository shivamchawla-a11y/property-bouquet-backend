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
    const existing = await LandingPage.findOne({
      fingerprint: collection.fingerprint,
    });

    // =====================================================
    // DOCUMENT TO SAVE
    // =====================================================

    const document = {
      title: collection.title,

      slug: collection.slug,

      fingerprint: collection.fingerprint,

      pageType: collection.pageType,

      filters: collection.filters,

      propertyCount: collection.propertyCount,

      matchingProperties:
        collection.matchingProperties,

      statistics:
        collection.statistics,

      seoScore:
        collection.seoScore,

      seo:
        collection.seo,

      previewImage:
        collection.previewImage,

      generated: true,

      status:
        collection.status || "draft",

      lastGeneratedAt:
        collection.lastGeneratedAt ||
        new Date(),
    };

    // =====================================================
    // UPDATE
    // =====================================================

    if (existing) {
      // Preserve manual SEO edits
      if (existing.seo?.hasCustomSEO) {
        document.seo = existing.seo;
      }

      await LandingPage.findByIdAndUpdate(
        existing._id,
        document,
        {
          new: true,
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