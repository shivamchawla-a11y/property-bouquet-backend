
const Property = require("../models/Property");
const Developer = require("../models/Developer");
const Location = require("../models/Location");

// ============================================================
// PUBLIC PROPERTY FILTER
// Must match getProperties() public filtering exactly.
// ============================================================

const publicPropertyFilter = {
  isActive: true,
  isDeleted: false,
  $or: [
    { status: "published" },
    { status: { $exists: false } },
    { status: null },
    { status: "" },
  ],
};

// ============================================================
// BUILD PUBLIC DEVELOPER SEO SLUG
// Matches developerController.js
// ============================================================

function buildDeveloperPublicSlug(slug) {
  if (!slug) return "";

  const cleanSlug = String(slug)
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "");

  if (!cleanSlug) return "";

  if (
    cleanSlug.endsWith("-developer-projects") ||
    cleanSlug.endsWith("-developers-projects")
  ) {
    return cleanSlug;
  }

  if (
    cleanSlug.endsWith("-developer") ||
    cleanSlug.endsWith("-developers")
  ) {
    return `${cleanSlug}-projects`;
  }

  return `${cleanSlug}-developer-projects`;
}

function normaliseDeveloperName(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

// ============================================================
// BUILD LOCATION TREE
// ============================================================

function buildLocationTree(locations) {
  const map = {};
  const tree = [];

  locations.forEach((location) => {
    map[String(location._id)] = {
      ...location,
      children: [],
    };
  });

  locations.forEach((location) => {
    const current = map[String(location._id)];

    if (location.parent) {
      const parentId = String(location.parent);

      if (map[parentId]) {
        map[parentId].children.push(current);
      } else {
        tree.push(current);
      }
    } else {
      tree.push(current);
    }
  });

  return tree;
}

// ============================================================
// GET HOMEPAGE NAVIGATION DATA
//
// GET /api/navigation/home
//
// Returns lightweight data for desktop and mobile navigation.
// ============================================================

exports.getHomeNavigation = async (req, res) => {
  try {
    res.set(
      "Cache-Control",
      "public, max-age=60, s-maxage=60, stale-while-revalidate=300"
    );

    const [
      developers,
      locations,
      propertyLocations,
      propertyCategories,
      groupedDeveloperCounts,
    ] = await Promise.all([
      // All developers, including zero-property developers.
      // CMS pageContent is deliberately excluded.

      Developer.find()
        .select("_id name slug logo image createdAt")
        .sort({ createdAt: -1 })
        .lean(),

      // Lightweight location hierarchy.

      Location.find()
        .select("_id name slug parent image")
        .lean(),

      // Property-derived location names.

      Property.distinct(
        "locationData.locationName",
        publicPropertyFilter
      ),

      // Property categories.

      Property.distinct(
        "categoryData.categoryName",
        publicPropertyFilter
      ),

      // Count each eligible property once.

      Property.aggregate([
        {
          $match: publicPropertyFilter,
        },
        {
          $group: {
            _id: {
              developerRef: "$coreDetails.developerRef",
              developerName: "$coreDetails.developerName",
            },
            propertyCount: {
              $sum: 1,
            },
          },
        },
      ]),
    ]);

    // ========================================================
    // DEVELOPER COUNT MAPS
    // ========================================================

    const developerIds = new Set(
      developers.map((developer) =>
        String(developer._id)
      )
    );

    const countsById = new Map();
    const countsByName = new Map();

    groupedDeveloperCounts.forEach((item) => {
      const developerRef = item?._id?.developerRef;
      const developerName = item?._id?.developerName;
      const count = Number(item.propertyCount) || 0;

      const refId = developerRef
        ? String(developerRef)
        : "";

      if (refId && developerIds.has(refId)) {
        countsById.set(
          refId,
          (countsById.get(refId) || 0) + count
        );

        return;
      }

      const normalisedName =
        normaliseDeveloperName(developerName);

      if (normalisedName) {
        countsByName.set(
          normalisedName,
          (countsByName.get(normalisedName) || 0) + count
        );
      }
    });

    // ========================================================
    // ALL DEVELOPERS + PROPERTY COUNTS
    // ========================================================

    const developersWithCounts = developers.map(
      (developer) => {
        const id = String(developer._id);

        const normalisedName =
          normaliseDeveloperName(developer.name);

        const propertyCount =
          countsById.get(id) ||
          countsByName.get(normalisedName) ||
          0;

        return {
          _id: developer._id,
          name: developer.name,
          slug: developer.slug,
          publicSlug: buildDeveloperPublicSlug(
            developer.slug
          ),
          logo: developer.logo,
          image: developer.image,
          propertyCount,
        };
      }
    );

    // ========================================================
    // PROPERTY-DERIVED LOCATIONS
    // Preserve existing navbar location behaviour.
    // ========================================================

    const uniqueLocations = [
      ...new Set(
        propertyLocations.flatMap((location) => {
          if (typeof location !== "string") {
            return [];
          }

          return location
            .split(">")
            .map((item) => item.trim())
            .filter(Boolean);
        })
      ),
    ].sort((a, b) => a.localeCompare(b));

    // ========================================================
    // PROPERTY CATEGORIES
    // ========================================================

    const uniqueCategories = [
      ...new Set(
        propertyCategories
          .filter(
            (category) =>
              typeof category === "string" &&
              category.trim()
          )
          .map((category) => category.trim())
      ),
    ].sort((a, b) => a.localeCompare(b));

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,
      data: {
        locations: uniqueLocations,
        locationTree: buildLocationTree(locations),
        developers: developersWithCounts,
        propertyTypes: uniqueCategories,
      },
    });
  } catch (error) {
    console.error(
      "GET HOME NAVIGATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load homepage navigation data.",
    });
  }
};
