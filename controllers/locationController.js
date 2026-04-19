const Location = require("../models/Location");
const Property = require("../models/Property");
const slugify = require("../utils/slugify");

exports.createLocation = async (req, res) => {
  try {
    const { name, parent } = req.body;

    const location = await Location.create({
      name,
      slug: slugify(name),
      parent: parent || null,
    });

    res.status(201).json({ success: true, data: location });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLocations = async (req, res) => {
  const data = await Location.find().populate("parent");
  res.json({ success: true, data });
};

exports.deleteLocation = async (req, res) => {
  try {
    const locationId = req.params.id;

    // 🔥 CHECK IF USED IN PROPERTY
    const propertyExists = await Property.findOne({ location: locationId });

    if (propertyExists) {
      return res.status(400).json({
        message: "Cannot delete location. Properties are attached.",
      });
    }

    await Location.findByIdAndDelete(locationId);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};