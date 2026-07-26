const collectionRules = require("../../config/collectionRules");
const createFingerprint = require("../../utils/landingPage/createFingerprint");

// ======================================================
// FILTER FIELD MAP
// ======================================================

const FILTER_MAP = {
  developer: "developers",
  location: "locations",
  category: "categories",
  bhk: "bhk",
  amenity: "amenities",
};

// ======================================================
// BUILD FILTERS
// ======================================================

const buildFilters = (values = {}) => {
  const filters = {
    search: "",

    developers: [],

    locations: [],

    categories: [],

    bhk: [],

    amenities: [],

    budget: {
      min: null,
      max: null,
    },
  };

  for (const field of Object.keys(values)) {
    const filterKey = FILTER_MAP[field];

    if (!filterKey) continue;

    const value = values[field];

    if (!value) continue;

    if (!Array.isArray(filters[filterKey])) continue;

    if (
      typeof value === "object" &&
      value.id
    ) {
      filters[filterKey].push(value.id);
    } else {
      filters[filterKey].push(value);
    }
  }

  return filters;
};

// ======================================================
// DISCOVER COLLECTIONS
// ======================================================

const discoverCollections = (
  properties = [],
  indexes = {}
) => {
  const discovered = new Map();

  for (const rule of collectionRules) {
    if (!rule.enabled) continue;

    for (const property of properties) {
      const values = {};

      let invalid = false;

      // ===========================================
      // Extract values required by rule
      // ===========================================

      for (const field of rule.values) {
        const value = property[field];

        if (
          value == null ||
          value === "" ||
          (typeof value === "object" &&
            value.id == null)
        ) {
          invalid = true;
          break;
        }

        values[field] = value;
      }

      if (invalid) continue;

      // ===========================================
      // Fingerprint
      // ===========================================

      const fingerprint =
        createFingerprint(
          rule.pageType,
          values
        );

      if (
        discovered.has(fingerprint)
      )
        continue;

      // ===========================================
      // Dynamic Filters
      // ===========================================

      const filters =
        buildFilters(values);

      // ===========================================
      // Save Collection
      // ===========================================

      
      discovered.set(
        fingerprint,
        {
          pageType:
            rule.pageType,

          fingerprint,

          values,

          filters,

          templates:
            rule.templates,
        }
      );
    }
  }

  return [
    ...discovered.values(),
  ];
};

module.exports =
  discoverCollections;