const Location = require("../models/Location");
const Property = require("../models/Property");
const slugify = require("../utils/slugify");

// ================= CREATE =================
exports.createLocation = async (req, res) => {
  try {
    const { name, parent, image } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Name is required ❌",
      });
    }

    // ✅ CHECK PARENT EXISTS
    if (parent) {
      const parentExists = await Location.findById(parent);
      if (!parentExists) {
        return res.status(400).json({
          message: "Parent not found ❌",
        });
      }
    }

    const trimmedName = name.trim();

    // ✅ PREVENT DUPLICATE UNDER SAME PARENT
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

    // ✅ HANDLE DUPLICATE KEY ERROR (Mongo)
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

// ✅ GET LOCATION + ITS PROPERTIES (LIKE DEVELOPER PAGE)
exports.getLocationBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const location = await Location.findOne({ slug });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found ❌",
      });
    }

    // 🔥 GET ALL CHILD LOCATIONS (CRITICAL FIX)
    const getAllChildIds = async (parentId) => {
      const children = await Location.find({ parent: parentId });

      let ids = [parentId];

      for (const child of children) {
        const subIds = await getAllChildIds(child._id);
        ids = ids.concat(subIds);
      }

      return ids;
    };

    const locationIds = await getAllChildIds(location._id);

    const properties = await Property.find({
      "locationData.locationRef": { $in: locationIds },
      isActive: true,
    })
      .populate("coreDetails.developerRef", "name logo")
      .populate("categoryData.categoryRef", "name");

    return res.json({
      success: true,
      location,
      properties,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ================= GET ALL =================
exports.getLocations = async (req, res) => {
  try {
    const locations = await Location.find().populate("parent");

    res.json({
      success: true,
      data: locations,
    });
  } catch (err) {
    console.error("GET LOCATIONS ERROR:", err);
    res.status(500).json({
      message: err.message || "Server error ❌",
    });
  }
};

// ================= GET TREE =================
exports.getLocationsTree = async (req, res) => {
  try {
    const locations = await Location.find().lean();

    const map = {};
    const tree = [];

    // 🧠 CREATE MAP
    locations.forEach((loc) => {
      map[loc._id] = { ...loc, children: [] };
    });

    // 🌳 BUILD TREE
    locations.forEach((loc) => {
      if (loc.parent) {
        if (map[loc.parent]) {
          map[loc.parent].children.push(map[loc._id]);
        }
      } else {
        tree.push(map[loc._id]);
      }
    });

    res.json({
      success: true,
      data: tree,
    });

  } catch (err) {
    console.error("TREE ERROR:", err);
    res.status(500).json({
      message: err.message || "Server error ❌",
    });
  }
};

// ================= DELETE =================
exports.deleteLocation = async (req, res) => {
  try {
    const locationId = req.params.id;

    // ❌ CHECK CHILDREN
    const hasChildren = await Location.findOne({ parent: locationId });

    if (hasChildren) {
      return res.status(400).json({
        message: "Delete child locations first ❌",
      });
    }

    // ❌ CHECK PROPERTY USAGE
    const propertyExists = await Property.findOne({
  "locationData.locationRef": locationId,
});

    if (propertyExists) {
      return res.status(400).json({
        message: "Cannot delete. Used in properties ❌",
      });
    }

    await Location.findByIdAndDelete(locationId);

    res.json({
      success: true,
      message: "Location deleted ✅",
    });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({
      message: err.message || "Server error ❌",
    });
  }
};

// ================= UPDATE =================
exports.updateLocation = async (req, res) => {
  try {
    const { name, image } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Name is required ❌",
      });
    }

    const locationId = req.params.id;

    // ❌ CHECK IF EXISTS
    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).json({
        message: "Location not found ❌",
      });
    }

    const trimmedName = name.trim();

    // ❌ PREVENT DUPLICATE UNDER SAME PARENT
    const existing = await Location.findOne({
      name: trimmedName,
      parent: location.parent || null,
      _id: { $ne: locationId },
    });

    if (existing) {
      return res.status(400).json({
        message: "Duplicate name under same parent ❌",
      });
    }

    location.name = trimmedName;
    location.slug = slugify(trimmedName);

    if (image !== undefined) {
      location.image = image;
    }

    await location.save();

    res.json({
      success: true,
      data: location,
    });

  } catch (err) {
    console.error("UPDATE LOCATION ERROR:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        message: "Duplicate value detected ❌",
      });
    }

    res.status(500).json({
      message: err.message || "Server error ❌",
    });
  }
};