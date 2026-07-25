const extractPropertyData = require("./landingPage/extractPropertyData");
const buildIndexes = require("./landingPage/buildIndexes");
const discoverCollections = require("./landingPage/discoverCollections");
const enrichCollections = require("./landingPage/enrichCollections");
const saveLandingPages = require("./landingPage/saveLandingPages");

// ======================================================
// COLLECTION ENGINE
// ======================================================

const landingPageGenerator = async () => {
  // ======================================================
  // STEP 1
  // Extract Property Data
  // ======================================================

  const properties =
    await extractPropertyData();

  // ======================================================
  // STEP 2
  // Build Indexes
  // ======================================================

  const indexes =
    buildIndexes(properties);

  // ======================================================
  // STEP 3
  // Discover Collections
  // ======================================================

  const collections =
    discoverCollections(
      properties,
      indexes
    );

  // ======================================================
  // STEP 4
  // Enrich Collections
  // ======================================================

  const enrichedCollections =
    enrichCollections(
      collections,
      properties,
      indexes
    );

  // ======================================================
  // STEP 5
  // Save Landing Pages
  // ======================================================

  const results =
    await saveLandingPages(
      enrichedCollections
    );

  return {
    properties: properties.length,

    indexes: {
      developers:
        indexes.developers.length,

      locations:
        indexes.locations.length,

      categories:
        indexes.categories.length,
    },

    discoveredCollections:
      collections.length,

    generatedCollections:
      enrichedCollections.length,

    ...results,
  };
};

module.exports =
  landingPageGenerator;