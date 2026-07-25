const applyTemplate = require("../../utils/landingPage/applyTemplate");

// ======================================================
// ENRICH COLLECTIONS
// ======================================================

const enrichCollections = (
  collections = [],
  properties = []
) => {
  const enriched = [];

  for (const collection of collections) {
    // ====================================================
    // MATCH PROPERTIES
    // ====================================================

    const matchingProperties = properties.filter(
      (property) => {
        const filters = collection.filters;

        if (
          filters.developers.length &&
          !filters.developers.some(
            (id) =>
              String(id) ===
              String(property.developer.id)
          )
        ) {
          return false;
        }

        if (
          filters.locations.length &&
          !filters.locations.some(
            (id) =>
              String(id) ===
              String(property.location.id)
          )
        ) {
          return false;
        }

        if (
          filters.categories.length &&
          !filters.categories.some(
            (id) =>
              String(id) ===
              String(property.category.id)
          )
        ) {
          return false;
        }

        if (
          filters.bhk.length &&
          !filters.bhk.includes(property.bhk)
        ) {
          return false;
        }

        return true;
      }
    );

    if (!matchingProperties.length) continue;

    // ====================================================
    // PRICES
    // ====================================================

    const prices = matchingProperties
      .map((item) => item.price.min)
      .filter((price) => price > 0);

    const averagePrice =
      prices.length
        ? Math.round(
            prices.reduce(
              (a, b) => a + b,
              0
            ) / prices.length
          )
        : 0;

    const minPrice =
      prices.length
        ? Math.min(...prices)
        : 0;

    const maxPrice =
      prices.length
        ? Math.max(...prices)
        : 0;

    // ====================================================
    // TEMPLATE VALUES
    // ====================================================

    const templateData = {
      developer:
        collection.values.developer?.name ||
        "",

      location:
        collection.values.location?.name ||
        "",

      category:
        collection.values.category?.name ||
        "",

      bhk:
        collection.values.bhk || "",
    };

    // ====================================================
    // BUILD DOCUMENT
    // ====================================================

    enriched.push({
      title: applyTemplate(
        collection.templates.title,
        templateData
      ),

      slug: applyTemplate(
  collection.templates.slug,
  templateData,
  {
    slug: true,
  }
),

      pageType: collection.pageType,

      fingerprint:
        collection.fingerprint,

      values:
        collection.values,

      filters:
        collection.filters,

      propertyCount:
        matchingProperties.length,

      matchingProperties:
        matchingProperties.map(
          (item) =>
            item.propertyId
        ),

      previewImage:
        matchingProperties[0]?.property
          ?.media?.heroImageUrl || "",

      statistics: {
        averagePrice,

        minPrice,

        maxPrice,

        developerCount: new Set(
          matchingProperties.map(
            (item) =>
              item.developer.id.toString()
          )
        ).size,

        locationCount: new Set(
          matchingProperties.map(
            (item) =>
              item.location.id.toString()
          )
        ).size,

        updatedAt:
          new Date(),
      },

      seoScore: 80,

      seo: {
        hasCustomSEO: false,

        metaTitle: applyTemplate(
          collection.templates.metaTitle,
          templateData
        ),

        metaDescription:
          applyTemplate(
            collection.templates
              .metaDescription,
            templateData
          ),

        h1: applyTemplate(
          collection.templates.h1,
          templateData
        ),

        keywords: [],

        canonical: "",
      },

      generated: true,

      status: "draft",

      lastGeneratedAt:
        new Date(),
    });
  }

  return enriched;
};

module.exports =
  enrichCollections;