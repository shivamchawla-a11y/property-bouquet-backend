const Location = require("../models/Location");
const Property = require("../models/Property");
const slugify = require("../utils/slugify");

// ================= CREATE =================
exports.createLocation = async (req, res) => {
  try {
    const { name, parent, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        message: "Name and type are required ❌",
      });
    }

    // ❌ VALIDATION RULES
    if (type !== "City" && !parent) {
      return res.status(400).json({
        message: "Parent required for Zone/Locality ❌",
      });
    }

    // ❌ PREVENT DUPLICATES UNDER SAME PARENT
    const existing = await Location.findOne({
      name,
      parent: parent || null,
    });

    if (existing) {
      return res.status(400).json({
        message: "Location already exists ❌",
      });
    }

    const location = await Location.create({
      name,
      slug: slugify(name),
      type,
      parent: parent || null,
    });

    res.status(201).json({
      success: true,
      data: location,
    });

  } catch (err) {
    console.error("CREATE LOCATION ERROR:", err);
    res.status(500).json({
      message: "Server error ❌",
    });
  }
};

// ================= GET ALL (FLAT) =================
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
      message: "Server error ❌",
    });
  }
};

// ================= GET TREE (🔥 IMPORTANT) =================
exports.getLocationsTree = async (req, res) => {
  try {
    const locations = await Location.find();

    const map = {};
    const tree = [];

    // 🧠 MAP ALL
    locations.forEach((loc) => {
      map[loc._id] = {
        ...loc._doc,
        children: [],
      };
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
      message: "Server error ❌",
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
      location: locationId,
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
      message: "Server error ❌",
    });
  }
};