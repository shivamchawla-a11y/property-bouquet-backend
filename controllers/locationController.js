const Location = require("../models/Location");
const Property = require("../models/Property");
const slugify = require("../utils/slugify");

// ============================================================
// HELPER — BUILD FULL PARENT CHAIN
//
// Example:
//
// Sector 56
//   ↓
// Golf Course Road
//   ↓
// Gurgaon
//
// Result:
// Sector 56 -> parent Golf Course Road -> parent Gurgaon
// ============================================================

const buildParentChain = async (location) => {
  if (!location) return null;

  const result = {
    ...location.toObject?.() || location,
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

    const parentLocation = await Location.findById(parentId).lean();

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


// ============================================================
// HELPER — GET ALL CHILD LOCATION IDS
//
// Example:
//
// Gurgaon
// ├── Golf Course Road
// │   ├── Sector 56
// │   └── Sector 55
// └── MG Road
//
// Requesting Gurgaon will return Gurgaon + all descendants.
// ============================================================

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


// ============================================================
// HELPER — BUILD PUBLIC LOCATION SLUG
//
// Examples:
//
// Gurgaon
// → properties-in-gurgaon
//
// Golf Course Road under Gurgaon
// → properties-in-golf-course-road-gurgaon
//
// Sector 56 under Golf Course Road under Gurgaon
// → properties-in-sector-56-gurgaon
//
// IMPORTANT:
// Only CURRENT LOCATION + ROOT LOCATION are used.
// Intermediate parents are intentionally omitted.
// ============================================================

const buildLocationPublicSlug = (location) => {
  if (!location) return "";

  const currentPart = slugify(
    location.slug || location.name || ""
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

  if (
    rootPart &&
    rootPart !== currentPart
  ) {
    return `properties-in-${currentPart}-${rootPart}`;
  }

  return `properties-in-${currentPart}`;
};


// ============================================================
// CREATE
// ============================================================

exports.createLocation = async (req, res) => {
  try {
    const { name, parent, image } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Name is required ❌",
      });
    }

    // CHECK PARENT EXISTS
    if (parent) {
      const parentExists = await Location.findById(parent);

      if (!parentExists) {
        return res.status(400).json({
          message: "Parent not found ❌",
        });
      }
    }

    const trimmedName = name.trim();

    // PREVENT DUPLICATE UNDER SAME PARENT
    const existing = await Location.findOne({
      name: trimmedName,
      parent: parent || null,
    });

    if (existing) {
      return res.status(400).json({
        message: "Location already exists under same parent ❌",
      });
    }

    const location = await Location.create({
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
    console.error("CREATE LOCATION ERROR:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        message: "Duplicate value detected ❌",
        error: err.keyValue,
      });
    }

    res.status(500).json({
      message: err.message || "Server error ❌",
    });
  }
};


// ============================================================
// GET LOCATION + ITS PROPERTIES
//
// Supports the normal database slug:
//
// /api/locations/sector-56
//
// Response now includes:
//
// location
// └── parent
//     └── parent
//         └── ...
//
// This allows the frontend to build:
// - public URL
// - breadcrumbs
// - inherited images
// ============================================================

exports.getLocationBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const location = await Location.findOne({
      slug,
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found ❌",
      });
    }

    // BUILD COMPLETE PARENT CHAIN
    const locationWithParents =
      await buildParentChain(location);

    // GET CURRENT LOCATION + ALL DESCENDANTS
    const locationIds =
      await getAllChildIds(location._id);

    // GET PROPERTIES
    const properties = await Property.find({
      "locationData.locationRef": {
        $in: locationIds,
      },

      // Keep only active properties
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
      buildLocationPublicSlug(locationWithParents);

    return res.json({
      success: true,

      location: locationWithParents,

      // New field for frontend
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


// ============================================================
// GET ALL
// ============================================================

exports.getLocations = async (req, res) => {
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


// ============================================================
// GET TREE
// ============================================================

exports.getLocationsTree = async (req, res) => {
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


// ============================================================
// DELETE
// ============================================================

exports.deleteLocation = async (req, res) => {
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


// ============================================================
// UPDATE
// ============================================================

exports.updateLocation = async (req, res) => {
  try {
    const { name, image } =
      req.body;

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

// ============================================================
// GET LOCATION BY PUBLIC SEO SLUG
//
// Examples:
//
// /api/locations/public/properties-in-gurgaon
// → Gurgaon
//
// /api/locations/public/properties-in-golf-course-road-gurgaon
// → Golf Course Road
//
// /api/locations/public/properties-in-sector-56-gurgaon
// → Sector 56
//
// URL RULE:
// CURRENT LOCATION + ROOT LOCATION ONLY
//
// Sector 56
//   ↓
// Golf Course Road
//   ↓
// Gurgaon
//
// Public slug:
// properties-in-sector-56-gurgaon
//
// ============================================================

exports.getLocationByPublicSlug = async (req, res) => {
  try {
    const { publicSlug } = req.params;

    if (!publicSlug) {
      return res.status(400).json({
        success: false,
        message: "Public location slug is required ❌",
      });
    }

    const cleanPublicSlug = String(publicSlug)
      .trim()
      .toLowerCase()
      .replace(/^\/+|\/+$/g, "");

    if (!cleanPublicSlug) {
      return res.status(400).json({
        success: false,
        message: "Invalid public location slug ❌",
      });
    }

    // ========================================================
    // GET ALL LOCATIONS
    // ========================================================

    const locations = await Location.find().lean();

    if (!locations.length) {
      return res.status(404).json({
        success: false,
        message: "No locations found ❌",
      });
    }

    // ========================================================
    // BUILD LOCATION MAP
    // ========================================================

    const locationMap = new Map();

    locations.forEach((location) => {
      locationMap.set(
        location._id.toString(),
        location
      );
    });

    // ========================================================
    // BUILD FULL PARENT CHAIN
    // ========================================================

    const getRootLocation = (location) => {
      let current = location;
      const visited = new Set();

      while (current?.parent) {
        const parentId =
          current.parent?.toString?.();

        if (!parentId) {
          break;
        }

        if (visited.has(parentId)) {
          break;
        }

        visited.add(parentId);

        const parent =
          locationMap.get(parentId);

        if (!parent) {
          break;
        }

        current = parent;
      }

      return current;
    };

    // ========================================================
    // BUILD PUBLIC SLUG FOR EACH LOCATION
    // ========================================================

    const buildPublicSlug = (location) => {
      if (!location) {
        return "";
      }

      const currentPart = slugify(
        location.slug ||
        location.name ||
        ""
      );

      if (!currentPart) {
        return "";
      }

      const root =
        getRootLocation(location);

      const rootPart = slugify(
        root?.slug ||
        root?.name ||
        ""
      );

      if (
        rootPart &&
        rootPart !== currentPart
      ) {
        return `properties-in-${currentPart}-${rootPart}`;
      }

      return `properties-in-${currentPart}`;
    };

    // ========================================================
    // FIND LOCATION
    // ========================================================

    const matchedLocation =
      locations.find(
        (location) =>
          buildPublicSlug(location) ===
          cleanPublicSlug
      );

    if (!matchedLocation) {
      return res.status(404).json({
        success: false,
        message: "Location not found ❌",
      });
    }

    // ========================================================
    // BUILD FULL PARENT OBJECT CHAIN
    //
    // Sector 56
    //   ↓
    // Golf Course Road
    //   ↓
    // Gurgaon
    // ========================================================

    const buildLocationWithParents = (
      location
    ) => {
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

      while (current?.parent) {
        const parentId =
          current.parent?.toString?.();

        if (!parentId) {
          break;
        }

        if (visited.has(parentId)) {
          break;
        }

        visited.add(parentId);

        const parent =
          locationMap.get(parentId);

        if (!parent) {
          break;
        }

        const parentResult = {
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

    // ========================================================
    // GET CURRENT LOCATION + ALL CHILDREN
    // ========================================================

    const getAllChildIds = (
      parentId
    ) => {
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

      for (const child of children) {
        const childIds =
          getAllChildIds(
            child._id
          );

        ids.push(
          ...childIds
        );
      }

      return ids;
    };

    const locationIds =
      getAllChildIds(
        matchedLocation._id
      );

    // ========================================================
    // GET PROPERTIES
    // ========================================================

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

    // ========================================================
    // RETURN
    // ========================================================

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