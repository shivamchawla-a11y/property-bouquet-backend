const createFingerprint = require("../../utils/landingPage/createFingerprint");

// ======================================================
// GENERATION RULES
// ======================================================

const generationRules = [
  {
    pageType: "developer",
    fields: ["developer"],
  },

  {
    pageType: "location",
    fields: ["location"],
  },

  {
    pageType: "category",
    fields: ["category"],
  },

  {
    pageType: "developer_location",
    fields: ["developer", "location"],
  },

  {
    pageType: "developer_category",
    fields: ["developer", "category"],
  },

  {
    pageType: "location_category",
    fields: ["location", "category"],
  },

  {
    pageType: "developer_location_category",
    fields: ["developer", "location", "category"],
  },
];

// ======================================================
// GENERATE COMBINATIONS
// ======================================================

const generateCombinations = (properties = []) => {
  const opportunities = [];
  const fingerprints = new Set();

  for (const property of properties) {
    for (const rule of generationRules) {
      const filters = {};

      rule.fields.forEach((field) => {
        switch (field) {
          case "developer":
            filters.developers = [
              property.developer.name,
            ];
            break;

          case "location":
            filters.locations = [
              property.location.name,
            ];
            break;

          case "category":
            filters.categories = [
              property.category.name,
            ];
            break;
        }
      });

      // Create unique fingerprint
      const fingerprint =
        createFingerprint(filters);

      // Skip duplicate opportunity
      if (fingerprints.has(fingerprint)) {
        continue;
      }

      fingerprints.add(fingerprint);

      opportunities.push({
        pageType: rule.pageType,

        fingerprint,

        filters,

        sourceProperty: property.propertyId,
      });
    }
  }

  return opportunities;
};

module.exports = generateCombinations;