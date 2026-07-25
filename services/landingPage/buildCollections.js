const createSlug = require("../../utils/landingPage/createSlug");
const createTitle = require("../../utils/landingPage/createTitle");

// ======================================================
// BUILD COLLECTIONS
// ======================================================

const buildCollections = (
  opportunities = [],
  properties = []
) => {
  const collections = [];

  for (const opportunity of opportunities) {
    const matchingProperties = properties.filter((property) => {
      let match = true;

      // -----------------------------------
      // Developer
      // -----------------------------------

      if (opportunity.filters.developers) {
        match =
          match &&
          opportunity.filters.developers.includes(
            property.developer.name
          );
      }

      // -----------------------------------
      // Location
      // -----------------------------------

      if (opportunity.filters.locations) {
        match =
          match &&
          opportunity.filters.locations.includes(
            property.location.name
          );
      }

      // -----------------------------------
      // Category
      // -----------------------------------

      if (opportunity.filters.categories) {
        match =
          match &&
          opportunity.filters.categories.includes(
            property.category.name
          );
      }

      return match;
    });

    // Skip empty collections
    if (!matchingProperties.length) {
      continue;
    }

    // -----------------------------------
    // Prices
    // -----------------------------------

    const prices = matchingProperties
      .map((item) => item.price.min)
      .filter((price) => price > 0);

    const minPrice =
      prices.length > 0 ? Math.min(...prices) : 0;

    const maxPrice =
      prices.length > 0 ? Math.max(...prices) : 0;

    const averagePrice =
      prices.length > 0
        ? Math.round(
            prices.reduce((a, b) => a + b, 0) /
              prices.length
          )
        : 0;

    // -----------------------------------
    // First Property
    // -----------------------------------

    const first = matchingProperties[0];

    // -----------------------------------
    // Title
    // -----------------------------------

    const title = createTitle({
      pageType: opportunity.pageType,

      developer:
        first?.developer?.name || "",

      category:
        first?.category?.name || "",

      location:
        first?.location?.name || "",
    });

    // -----------------------------------
    // Slug
    // -----------------------------------

    const slug = createSlug({
      pageType: opportunity.pageType,

      developer:
        first?.developer?.name || "",

      category:
        first?.category?.name || "",

      location:
        first?.location?.name || "",
    });

    collections.push({
      title,

      slug,

      fingerprint:
        opportunity.fingerprint,

      pageType:
        opportunity.pageType,

      filters:
        opportunity.filters,

      propertyCount:
        matchingProperties.length,

      statistics: {
        averagePrice,
        minPrice,
        maxPrice,
      },

      matchingProperties:
        matchingProperties.map(
          (item) => item.propertyId
        ),

      previewProperties:
        matchingProperties
          .slice(0, 6)
          .map((item) => ({
            id: item.propertyId,

            title:
              item.propertyName,

            slug:
              item.slug,

            developer:
              item.developer.name,

            location:
              item.location.name,

            heroImage:
              item.property?.media
                ?.heroImageUrl || "",

            startingPrice:
              item.price.min,
          })),
    });
  }

  return collections;
};

module.exports = buildCollections;