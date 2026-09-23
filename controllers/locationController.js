const Location = require("../models/Location");
const Property = require("../models/Property");
const slugify = require("../utils/slugify");

/* ============================================================
   HELPER — BUILD FULL PARENT CHAIN

   Example:

   Sector 56
     ↓
   Golf Course Road
     ↓
   Gurgaon

   Result:
   Sector 56 -> parent Golf Course Road -> parent Gurgaon
============================================================ */

const buildParentChain = async (location) => {
  if (!location) return null;

  const result = {
    ...(location.toObject?.() || location),
    parent: null,
  };

  let current = location;
  let currentResult = result;

  const visited = new Set();

  while (current?.parent) {
    const parentId =
      current.parent?._id?.toString?.() ||
      current.parent?.toString?.();

    if (!parentId) break;

    // Prevent accidental circular parent relationships
    if (visited.has(parentId)) {
      break;
    }

    visited.add(parentId);

    const parentLocation =
      await Location.findById(parentId).lean();

    if (!parentLocation) {
      break;
    }

    const parentResult = {
      ...parentLocation,
      parent: null,
    };

    currentResult.parent = parentResult;

    current = parentLocation;
    currentResult = parentResult;
  }

  return result;
};

/* ============================================================
   HELPER — GET ALL CHILD LOCATION IDS

   Example:

   Gurgaon
   ├── Golf Course Road
   │   ├── Sector 56
   │   └── Sector 55
   └── MG Road

   Requesting Gurgaon will return Gurgaon + all descendants.
============================================================ */

const getAllChildIds = async (parentId) => {
  const children = await Location.find({
    parent: parentId,
  }).select("_id");

  let ids = [parentId];

  for (const child of children) {
    const childIds = await getAllChildIds(child._id);
    ids = ids.concat(childIds);
  }

  return ids;
};

/* ============================================================
   HELPER — LOCATION URL PREPOSITION

   Roads / Expressways / Highways → "on"
   Sectors / Cities / Localities → "in"
============================================================ */

const getLocationPreposition = (location) => {
  const name = String(location?.name || "")
    .trim()
    .toLowerCase();

  const slug = String(location?.slug || "")
    .trim()
    .toLowerCase();

  const value = `${name} ${slug}`;

  const onKeywords = [
    "expressway",
    "express way",
    "highway",
    "road",
    "street",
    "avenue",
    "boulevard",
    "drive",
    "marg",
  ];

  return onKeywords.some((keyword) =>
    value.includes(keyword)
  )
    ? "on"
    : "in";
};

/* ============================================================
   HELPER — BUILD PUBLIC LOCATION SLUG

   Examples:

   Gurgaon
   → properties-in-gurgaon

   Dwarka Expressway under Gurgaon
   → properties-on-dwarka-expressway-gurgaon

   Golf Course Road under Gurgaon
   → properties-on-golf-course-road-gurgaon

   Sector 56 under Golf Course Road under Gurgaon
   → properties-in-sector-56-gurgaon

   IMPORTANT:
   Only CURRENT LOCATION + ROOT LOCATION are used.
============================================================ */

const buildLocationPublicSlug = (location) => {
  if (!location) return "";

  const currentPart = slugify(
    location.slug ||
      location.name ||
      ""
  );

  if (!currentPart) return "";

  let root = location;

  const visited = new Set();

  while (root?.parent) {
    const parentId =
      root.parent?._id?.toString?.() ||
      root.parent?.toString?.();

    if (!parentId) break;

    if (visited.has(parentId)) {
      break;
    }

    visited.add(parentId);

    root = root.parent;
  }

  const rootPart = slugify(
    root?.slug ||
      root?.name ||
      ""
  );

  const preposition =
    getLocationPreposition(location);

  if (
    rootPart &&
    rootPart !== currentPart
  ) {
    return `properties-${preposition}-${currentPart}-${rootPart}`;
  }

  return `properties-${preposition}-${currentPart}`;
};

/* ============================================================
   CREATE
============================================================ */

exports.createLocation = async (req, res) => {
  try {
    const {
      name,
      parent,
      image,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Name is required ❌",
      });
    }

    // CHECK PARENT EXISTS
    if (parent) {
      const parentExists =
        await Location.findById(parent);

      if (!parentExists) {
        return res.status(400).json({
          message: "Parent not found ❌",
        });
      }
    }

    const trimmedName =
      name.trim();

    // PREVENT DUPLICATE UNDER SAME PARENT
    const existing =
      await Location.findOne({
        name: trimmedName,
        parent: parent || null,
      });

    if (existing) {
      return res.status(400).json({
        message:
          "Location already exists under same parent ❌",
      });
    }

    const location =
      await Location.create({
        name: trimmedName,
        slug: slugify(trimmedName),
        parent: parent || null,
        image: image || "",
      });

    res.status(201).json({
      success: true,
      data: location,
    });
  } catch (err) {
    console.error(
      "CREATE LOCATION ERROR:",
      err
    );

    if (err.code === 11000) {
      return res.status(400).json({
        message:
          "Duplicate value detected ❌",
        error: err.keyValue,
      });
    }

    res.status(500).json({
      message:
        err.message ||
        "Server error ❌",
    });
  }
};

/* ============================================================
   GET LOCATION + ITS PROPERTIES

   Supports:

   /api/locations/sector-56

   Response:

   location
   └── parent
       └── parent
           └── ...

   Also returns:

   - publicSlug
   - properties
============================================================ */

exports.getLocationBySlug = async (
  req,
  res
) => {
  try {
    const { slug } = req.params;

    const location =
      await Location.findOne({
        slug,
      });

    if (!location) {
      return res.status(404).json({
        success: false,
        message:
          "Location not found ❌",
      });
    }

    // BUILD COMPLETE PARENT CHAIN
    const locationWithParents =
      await buildParentChain(
        location
      );

    // GET CURRENT LOCATION + ALL DESCENDANTS
    const locationIds =
      await getAllChildIds(
        location._id
      );

    // GET PROPERTIES
    const properties =
      await Property.find({
        "locationData.locationRef": {
          $in: locationIds,
        },

        isActive: true,
      })
        .populate(
          "coreDetails.developerRef",
          "name logo"
        )
        .populate(
          "categoryData.categoryRef",
          "name"
        )
        .lean();

    // PUBLIC URL
    const publicSlug =
      buildLocationPublicSlug(
        locationWithParents
      );

    return res.json({
      success: true,
      location:
        locationWithParents,
      publicSlug,
      properties,
    });
  } catch (err) {
    console.error(
      "GET LOCATION BY SLUG ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      message:
        err.message ||
        "Server error ❌",
    });
  }
};

/* ============================================================
   GET ALL
============================================================ */

exports.getLocations = async (
  req,
  res
) => {
  try {
    const locations =
      await Location.find()
        .populate("parent");

    res.json({
      success: true,
      data: locations,
    });
  } catch (err) {
    console.error(
      "GET LOCATIONS ERROR:",
      err
    );

    res.status(500).json({
      message:
        err.message ||
        "Server error ❌",
    });
  }
};

/* ============================================================
   GET TREE
============================================================ */

exports.getLocationsTree = async (
  req,
  res
) => {
  try {
    const locations =
      await Location.find().lean();

    const map = {};
    const tree = [];

    // CREATE MAP
    locations.forEach((loc) => {
      map[loc._id.toString()] = {
        ...loc,
        children: [],
      };
    });

    // BUILD TREE
    locations.forEach((loc) => {
      if (loc.parent) {
        const parentId =
          loc.parent.toString();

        if (map[parentId]) {
          map[parentId].children.push(
            map[loc._id.toString()]
          );
        }
      } else {
        tree.push(
          map[loc._id.toString()]
        );
      }
    });

    res.json({
      success: true,
      data: tree,
    });
  } catch (err) {
    console.error(
      "TREE ERROR:",
      err
    );

    res.status(500).json({
      message:
        err.message ||
        "Server error ❌",
    });
  }
};

/* ============================================================
   DELETE
============================================================ */

exports.deleteLocation = async (
  req,
  res
) => {
  try {
    const locationId =
      req.params.id;

    // CHECK CHILDREN
    const hasChildren =
      await Location.findOne({
        parent: locationId,
      });

    if (hasChildren) {
      return res.status(400).json({
        message:
          "Delete child locations first ❌",
      });
    }

    // CHECK PROPERTY USAGE
    const propertyExists =
      await Property.findOne({
        "locationData.locationRef":
          locationId,
      });

    if (propertyExists) {
      return res.status(400).json({
        message:
          "Cannot delete. Used in properties ❌",
      });
    }

    await Location.findByIdAndDelete(
      locationId
    );

    res.json({
      success: true,
      message:
        "Location deleted ✅",
    });
  } catch (err) {
    console.error(
      "DELETE ERROR:",
      err
    );

    res.status(500).json({
      message:
        err.message ||
        "Server error ❌",
    });
  }
};

/* ============================================================
   UPDATE
============================================================ */

exports.updateLocation = async (
  req,
  res
) => {
  try {
    const {
      name,
      image,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message:
          "Name is required ❌",
      });
    }

    const locationId =
      req.params.id;

    // CHECK IF EXISTS
    const location =
      await Location.findById(
        locationId
      );

    if (!location) {
      return res.status(404).json({
        message:
          "Location not found ❌",
      });
    }

    const trimmedName =
      name.trim();

    // PREVENT DUPLICATE UNDER SAME PARENT
    const existing =
      await Location.findOne({
        name: trimmedName,

        parent:
          location.parent || null,

        _id: {
          $ne: locationId,
        },
      });

    if (existing) {
      return res.status(400).json({
        message:
          "Duplicate name under same parent ❌",
      });
    }

    location.name =
      trimmedName;

    location.slug =
      slugify(trimmedName);

    if (image !== undefined) {
      location.image =
        image;
    }

    await location.save();

    res.json({
      success: true,
      data: location,
    });
  } catch (err) {
    console.error(
      "UPDATE LOCATION ERROR:",
      err
    );

    if (err.code === 11000) {
      return res.status(400).json({
        message:
          "Duplicate value detected ❌",
      });
    }

    res.status(500).json({
      message:
        err.message ||
        "Server error ❌",
    });
  }
};

/* ============================================================
   GET LOCATION BY PUBLIC SEO SLUG

   Examples:

   /api/locations/public/properties-in-gurgaon

   /api/locations/public/properties-on-golf-course-road-gurgaon

   /api/locations/public/properties-in-sector-56-gurgaon
============================================================ */

exports.getLocationByPublicSlug =
  async (req, res) => {
    try {
      const {
        publicSlug,
      } = req.params;

      if (!publicSlug) {
        return res.status(400).json({
          success: false,
          message:
            "Public location slug is required ❌",
        });
      }

      const cleanPublicSlug =
        String(publicSlug)
          .trim()
          .toLowerCase()
          .replace(
            /^\/+|\/+$/g,
            ""
          );

      if (!cleanPublicSlug) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid public location slug ❌",
        });
      }

      // GET ALL LOCATIONS
      const locations =
        await Location.find().lean();

      if (!locations.length) {
        return res.status(404).json({
          success: false,
          message:
            "No locations found ❌",
        });
      }

      // BUILD LOCATION MAP
      const locationMap =
        new Map();

      locations.forEach(
        (location) => {
          locationMap.set(
            location._id.toString(),
            location
          );
        }
      );

      // BUILD ROOT LOCATION
      const getRootLocation =
        (location) => {
          let current =
            location;

          const visited =
            new Set();

          while (
            current?.parent
          ) {
            const parentId =
              current.parent?.toString?.();

            if (!parentId) {
              break;
            }

            if (
              visited.has(
                parentId
              )
            ) {
              break;
            }

            visited.add(
              parentId
            );

            const parent =
              locationMap.get(
                parentId
              );

            if (!parent) {
              break;
            }

            current =
              parent;
          }

          return current;
        };

      // BUILD PUBLIC SLUG
      const buildPublicSlug =
        (location) => {
          if (!location) {
            return "";
          }

          const currentPart =
            slugify(
              location.slug ||
                location.name ||
                ""
            );

          if (!currentPart) {
            return "";
          }

          const root =
            getRootLocation(
              location
            );

          const rootPart =
            slugify(
              root?.slug ||
                root?.name ||
                ""
            );

          const preposition =
            getLocationPreposition(
              location
            );

          if (
            rootPart &&
            rootPart !==
              currentPart
          ) {
            return `properties-${preposition}-${currentPart}-${rootPart}`;
          }

          return `properties-${preposition}-${currentPart}`;
        };

      // FIND LOCATION
      const matchedLocation =
        locations.find(
          (location) =>
            buildPublicSlug(
              location
            ) ===
            cleanPublicSlug
        );

      if (!matchedLocation) {
        return res.status(404).json({
          success: false,
          message:
            "Location not found ❌",
        });
      }

      // BUILD FULL PARENT OBJECT CHAIN
      const buildLocationWithParents =
        (location) => {
          if (!location) {
            return null;
          }

          const result = {
            ...location,
            parent: null,
          };

          let current =
            location;

          let currentResult =
            result;

          const visited =
            new Set();

          while (
            current?.parent
          ) {
            const parentId =
              current.parent?.toString?.();

            if (!parentId) {
              break;
            }

            if (
              visited.has(
                parentId
              )
            ) {
              break;
            }

            visited.add(
              parentId
            );

            const parent =
              locationMap.get(
                parentId
              );

            if (!parent) {
              break;
            }

            const parentResult =
              {
                ...parent,
                parent: null,
              };

            currentResult.parent =
              parentResult;

            current =
              parent;

            currentResult =
              parentResult;
          }

          return result;
        };

      const locationWithParents =
        buildLocationWithParents(
          matchedLocation
        );

      // GET CURRENT LOCATION + ALL CHILDREN
      const getAllChildIdsFromMap =
        (parentId) => {
          const ids = [
            parentId,
          ];

          const children =
            locations.filter(
              (location) =>
                location.parent &&
                location.parent
                  .toString() ===
                  parentId.toString()
            );

          for (
            const child of
              children
          ) {
            const childIds =
              getAllChildIdsFromMap(
                child._id
              );

            ids.push(
              ...childIds
            );
          }

          return ids;
        };

      const locationIds =
        getAllChildIdsFromMap(
          matchedLocation._id
        );

      // GET PROPERTIES
      const properties =
        await Property.find({
          "locationData.locationRef": {
            $in: locationIds,
          },

          isActive: true,
        })
          .populate(
            "coreDetails.developerRef",
            "name logo"
          )
          .populate(
            "categoryData.categoryRef",
            "name"
          )
          .lean();

      return res.json({
        success: true,

        location:
          locationWithParents,

        properties,

        backendSlug:
          matchedLocation.slug,

        publicSlug:
          buildPublicSlug(
            matchedLocation
          ),
      });
    } catch (err) {
      console.error(
        "GET LOCATION BY PUBLIC SLUG ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          err.message ||
          "Server error ❌",
      });
    }
  };

/* ============================================================
   GET LOCATION BY ID FOR ADMIN PAGE EDITOR

   GET /api/locations/by-id/:id
============================================================ */

exports.getLocationById =
  async (req, res) => {
    try {
      const location =
        await Location.findById(
          req.params.id
        ).lean();

      if (!location) {
        return res.status(404).json({
          success: false,
          message:
            "Location not found ❌",
        });
      }

      return res.json({
        success: true,
        location,
      });
    } catch (err) {
      console.error(
        "GET LOCATION BY ID ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          err.message ||
          "Server error ❌",
      });
    }
  };

/* ============================================================
   UPDATE LOCATION PAGE CONTENT

   PATCH /api/locations/page-content/:id

   IMPORTANT:

   This saves the complete optional override layer for:

   1. HERO
   2. ABOUT
   3. CONNECTIVITY
   4. NEARBY

   Empty strings are intentionally saved as empty strings.

   The public location page should treat empty custom values as:

   "Use the existing/default public-page value."

   This means the admin can:

   - Save for the first time
   - Open the editor again
   - Edit another field
   - Clear a field
   - Save again
   - Re-open the editor
   - Continue editing

   without the previously saved structure being lost.
============================================================ */

exports.updateLocationPageContent = async (req, res) => {
  try {
    /* ==========================================================
       LOCATION ID
    ========================================================== */

    const locationId = req.params.id;

    if (!locationId) {
      return res.status(400).json({
        success: false,
        message: "Location ID is required ❌",
      });
    }

    /* ==========================================================
       REQUEST BODY
    ========================================================== */

    const { pageContent } = req.body;

    if (
      !pageContent ||
      typeof pageContent !== "object" ||
      Array.isArray(pageContent)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid pageContent is required ❌",
      });
    }

    /* ==========================================================
       FIND LOCATION
    ========================================================== */

    const location =
      await Location.findById(locationId);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found ❌",
      });
    }

    /* ==========================================================
       HELPER — SAFE STRING

       We intentionally preserve empty strings.

       Example:

       undefined → ""
       null      → ""
       "Gurgaon" → "Gurgaon"
    ========================================================== */

    const safeString = (value) => {
      if (
        value === null ||
        value === undefined
      ) {
        return "";
      }

      return String(value);
    };

    /* ==========================================================
       HERO
    ========================================================== */

    const hero =
      pageContent.hero &&
      typeof pageContent.hero === "object" &&
      !Array.isArray(pageContent.hero)
        ? pageContent.hero
        : {};

    /* ----------------------------------------------------------
       HERO BENEFITS
       
       Admin editor uses exactly 4 desktop benefits.
    ---------------------------------------------------------- */

    const benefits = Array.isArray(
      hero.benefits
    )
      ? hero.benefits
          .slice(0, 4)
          .map(safeString)
      : [];

    while (benefits.length < 4) {
      benefits.push("");
    }

    /* ----------------------------------------------------------
       HERO MOBILE BENEFITS
       
       Admin editor uses exactly 4 mobile benefits.
    ---------------------------------------------------------- */

    const mobileBenefits =
      Array.isArray(
        hero.mobileBenefits
      )
        ? hero.mobileBenefits
            .slice(0, 4)
            .map(safeString)
        : [];

    while (
      mobileBenefits.length < 4
    ) {
      mobileBenefits.push("");
    }

    /* ==========================================================
       ABOUT
    ========================================================== */

    const about =
      pageContent.about &&
      typeof pageContent.about === "object" &&
      !Array.isArray(pageContent.about)
        ? pageContent.about
        : {};

    /* ----------------------------------------------------------
       ABOUT HIGHLIGHTS
       
       Admin editor uses exactly 3 highlights.
    ---------------------------------------------------------- */

    const highlights =
      Array.isArray(
        about.highlights
      )
        ? about.highlights
            .slice(0, 3)
            .map((item) => ({
              title: safeString(
                item?.title
              ),

              description:
                safeString(
                  item?.description
                ),
            }))
        : [];

    while (highlights.length < 3) {
      highlights.push({
        title: "",
        description: "",
      });
    }

    /* ----------------------------------------------------------
       MARKET INSIGHTS
       
       Admin editor uses exactly 3 market insights.
    ---------------------------------------------------------- */

    const marketInsights =
      Array.isArray(
        about.marketInsights
      )
        ? about.marketInsights
            .slice(0, 3)
            .map((item) => ({
              title: safeString(
                item?.title
              ),

              description:
                safeString(
                  item?.description
                ),
            }))
        : [];

    while (
      marketInsights.length < 3
    ) {
      marketInsights.push({
        title: "",
        description: "",
      });
    }

    /* ==========================================================
       CONNECTIVITY
    ========================================================== */

    const connectivity =
      pageContent.connectivity &&
      typeof pageContent.connectivity ===
        "object" &&
      !Array.isArray(
        pageContent.connectivity
      )
        ? pageContent.connectivity
        : {};

    /* ----------------------------------------------------------
       CONNECTIVITY ITEMS
       
       Admin editor uses exactly 6 items.
    ---------------------------------------------------------- */

    const connectivityItems =
      Array.isArray(
        connectivity.items
      )
        ? connectivity.items
            .slice(0, 6)
            .map((item) => ({
              title: safeString(
                item?.title
              ),

              subtitle:
                safeString(
                  item?.subtitle
                ),
            }))
        : [];

    while (
      connectivityItems.length < 6
    ) {
      connectivityItems.push({
        title: "",
        subtitle: "",
      });
    }

    /* ==========================================================
       NEARBY
    ========================================================== */

    const nearby =
      pageContent.nearby &&
      typeof pageContent.nearby === "object" &&
      !Array.isArray(pageContent.nearby)
        ? pageContent.nearby
        : {};

    /* ==========================================================
       COMPLETE CLEAN PAGE CONTENT
    ========================================================== */

    const cleanPageContent = {
      /* ========================================================
         HERO
      ======================================================== */

      hero: {
        eyebrow: safeString(
          hero.eyebrow
        ),

        title: safeString(
          hero.title
        ),

        description: safeString(
          hero.description
        ),

        image: safeString(
          hero.image
        ),

        locationLabel: safeString(
          hero.locationLabel
        ),

        whyTitle: safeString(
          hero.whyTitle
        ),

        whyDescription: safeString(
          hero.whyDescription
        ),

        benefits,

        mobileBenefits,

        primaryCtaText: safeString(
          hero.primaryCtaText
        ),

        primaryCtaLink: safeString(
          hero.primaryCtaLink
        ),

        secondaryCtaText:
          safeString(
            hero.secondaryCtaText
          ),

        secondaryCtaLink:
          safeString(
            hero.secondaryCtaLink
          ),

        footerEyebrow:
          safeString(
            hero.footerEyebrow
          ),

        footerText: safeString(
          hero.footerText
        ),
      },

      /* ========================================================
         ABOUT
      ======================================================== */

      about: {
        enabled:
          about.enabled === false
            ? false
            : true,

        eyebrow: safeString(
          about.eyebrow
        ),

        title: safeString(
          about.title
        ),

        content: safeString(
          about.content
        ),

        image: safeString(
          about.image
        ),

        highlights,

        marketEyebrow:
          safeString(
            about.marketEyebrow
          ),

        marketTitle:
          safeString(
            about.marketTitle
          ),

        marketDescription:
          safeString(
            about.marketDescription
          ),

        marketInsights,

        perspectiveEyebrow:
          safeString(
            about.perspectiveEyebrow
          ),

        perspectiveQuote:
          safeString(
            about.perspectiveQuote
          ),
      },

      /* ========================================================
         CONNECTIVITY
      ======================================================== */

      connectivity: {
        eyebrow: safeString(
          connectivity.eyebrow
        ),

        title: safeString(
          connectivity.title
        ),

        description: safeString(
          connectivity.description
        ),

        image: safeString(
          connectivity.image
        ),

        items:
          connectivityItems,

        advantageEyebrow:
          safeString(
            connectivity.advantageEyebrow
          ),

        advantageTitle:
          safeString(
            connectivity.advantageTitle
          ),
      },

      /* ========================================================
         NEARBY
      ======================================================== */

      nearby: {
        eyebrow: safeString(
          nearby.eyebrow
        ),

        title: safeString(
          nearby.title
        ),

        description: safeString(
          nearby.description
        ),
      },
    };

    /* ==========================================================
       SAVE

       We replace pageContent with the complete normalized
       structure.

       This prevents old/partial data from causing inconsistent
       editing behavior.
    ========================================================== */

    location.pageContent =
      cleanPageContent;

    await location.save();

    /* ==========================================================
       FETCH FRESH DOCUMENT

       Do not return the old in-memory object.

       We fetch the document again so the admin editor receives
       exactly what MongoDB has stored.
    ========================================================== */

    const savedLocation =
      await Location.findById(
        locationId
      ).lean();

    if (!savedLocation) {
      return res.status(404).json({
        success: false,
        message:
          "Location could not be retrieved after saving ❌",
      });
    }

    /* ==========================================================
       SUCCESS
    ========================================================== */

    return res.status(200).json({
      success: true,

      message:
        "Location page content saved successfully ✅",

      location:
        savedLocation,
    });
  } catch (err) {
    console.error(
      "UPDATE LOCATION PAGE CONTENT ERROR:",
      err
    );

    /* ==========================================================
       MONGOOSE VALIDATION ERROR
    ========================================================== */

    if (
      err.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Location page content validation failed ❌",

        error:
          err.message,
      });
    }

    /* ==========================================================
       INVALID OBJECT ID
    ========================================================== */

    if (
      err.name ===
      "CastError"
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid location ID ❌",
      });
    }

    /* ==========================================================
       GENERAL ERROR
    ========================================================== */

    return res.status(500).json({
      success: false,

      message:
        err.message ||
        "Unable to save location page content ❌",
    });
  }
};