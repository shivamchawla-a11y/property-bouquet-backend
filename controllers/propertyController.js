const Property = require("../models/Property");

// ✅ CREATE PROPERTY
exports.createProperty = async (req, res) => {
  try {
    const { marketType, coreDetails, unitConfigurations } = req.body;

    if (!marketType) {
      return res.status(400).json({
        success: false,
        message: "Market type is required",
      });
    }

    if (!coreDetails?.startingPrice) {
      return res.status(400).json({
        success: false,
        message: "Starting price is required",
      });
    }

    const hasValidConfig = unitConfigurations?.some(
      (u) => u.price && u.price.trim() !== ""
    );

    if (!hasValidConfig) {
      return res.status(400).json({
        success: false,
        message: "At least one configuration price is required",
      });
    }

    const property = await Property.create({
      ...req.body,
      createdBy: req.user?.id,
    });

    res.status(201).json({
      success: true,
      data: property,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// ✅ GET ONLY ACTIVE PROPERTIES (FIXED)
exports.getProperties = async (req, res) => {
  try {
    const properties = await Property
      .find({ isActive: true })
      .populate("createdBy"); // ✅ ONLY THIS

    res.status(200).json({
      success: true,
      data: properties,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ✅ SOFT DELETE
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    property.isActive = false;
    await property.save();

    res.json({
      success: true,
      message: "Property soft deleted",
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};