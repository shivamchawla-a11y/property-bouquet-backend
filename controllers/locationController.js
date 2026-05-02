const Location = require("../models/Location");
const Property = require("../models/Property");
const slugify = require("../utils/slugify");

// ================= CREATE =================
exports.createLocation = async (req, res) => {
  try {
    const { name, parent } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Name is required ❌",
      });
    }

    // ✅ CHECK PARENT EXISTS (if provided)
    if (parent) {
      const parentExists = await Location.findById(parent);
      if (!parentExists) {
        return res.status(400).json({
          message: "Parent not found ❌",
        });
      }
    }

    // ✅ PREVENT DUPLICATE UNDER SAME PARENT
    const existing = await Location.findOne({
      name: name.trim(),
      parent: parent || null,
    });

    if (existing) {
      return res.status(400).json({
        message: "Location already exists under same parent ❌",
      });
    }

    const location = await Location.create({
      name: name.trim(),
      slug: slugify(name),
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

// ================= UPDATE =================
exports.updateLocation = async (req, res) => {
  try {
    const { name } = req.body;

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

    // ❌ PREVENT DUPLICATE UNDER SAME PARENT
    const existing = await Location.findOne({
      name: name.trim(),
      parent: location.parent || null,
      _id: { $ne: locationId },
    });

    if (existing) {
      return res.status(400).json({
        message: "Duplicate name under same parent ❌",
      });
    }

    location.name = name.trim();
    location.slug = slugify(name);

    await location.save();

    res.json({
      success: true,
      data: location,
    });

  } catch (err) {
    console.error("UPDATE LOCATION ERROR:", err);
    res.status(500).json({
      message: "Server error ❌",
    });
  }
};