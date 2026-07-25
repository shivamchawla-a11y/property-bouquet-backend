const extractPropertyData = require("./landingPage/extractPropertyData");
const buildIndexes = require("./landingPage/buildIndexes");
const discoverCollections = require("./landingPage/discoverCollections");
const enrichCollections = require("./landingPage/enrichCollections");
const saveLandingPages = require("./landingPage/saveLandingPages");

// ======================================================
// COLLECTION ENGINE
// ======================================================

const landingPageGenerator = async () => {
  try {
    console.log("\n========== LANDING PAGE GENERATION STARTED ==========");

    // ======================================================
    // STEP 1
    // Extract Property Data
    // ======================================================

    console.log("STEP 1: Extracting property data...");

    const properties = await extractPropertyData();

    console.log(`✅ STEP 1 COMPLETE - Properties Found: ${properties.length}`);

    // ======================================================
    // STEP 2
    // Build Indexes
    // ======================================================

    console.log("STEP 2: Building indexes...");

    const indexes = buildIndexes(properties);

    console.log("✅ STEP 2 COMPLETE");
    console.log(
      `Developers: ${indexes.developers.length}, Locations: ${indexes.locations.length}, Categories: ${indexes.categories.length}`
    );

    // ======================================================
    // STEP 3
    // Discover Collections
    // ======================================================

    console.log("STEP 3: Discovering collections...");

    const collections = discoverCollections(
      properties,
      indexes
    );

    console.log(`✅ STEP 3 COMPLETE - Collections: ${collections.length}`);

    // ======================================================
    // STEP 4
    // Enrich Collections
    // ======================================================

    console.log("STEP 4: Enriching collections...");

    const enrichedCollections = enrichCollections(
      collections,
      properties,
      indexes
    );

    console.log(
      `✅ STEP 4 COMPLETE - Enriched Collections: ${enrichedCollections.length}`
    );

    // ======================================================
    // STEP 5
    // Save Landing Pages
    // ======================================================

    console.log("STEP 5: Saving landing pages...");

    const results = await saveLandingPages(
      enrichedCollections
    );

    console.log("✅ STEP 5 COMPLETE");
    console.log("========== LANDING PAGE GENERATION FINISHED ==========\n");

    return {
      properties: properties.length,

      indexes: {
        developers: indexes.developers.length,
        locations: indexes.locations.length,
        categories: indexes.categories.length,
      },

      discoveredCollections: collections.length,

      generatedCollections: enrichedCollections.length,

      ...results,
    };
  } catch (error) {
    console.error("\n❌ LANDING PAGE GENERATION FAILED");
    console.error("Message:", error.message);
    console.error("Stack:");
    console.error(error.stack);
    throw error;
  }
};

module.exports = landingPageGenerator;