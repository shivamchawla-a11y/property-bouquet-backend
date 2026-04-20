const Property = require("../models/Property");

// ✅ CREATE PROPERTY
exports.createProperty = async (req, res) => {
  try {
    const { title, price, marketType } = req.body;

    // 🔥 VALIDATION
    if (!price) {
      return res.status(400).json({
        success: false,
        message: "Price is required",
      });
    }

    if (!marketType) {
      return res.status(400).json({
        success: false,
        message: "Market type is required",
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


// ✅ GET ONLY ACTIVE PROPERTIES (🔥 STEP 5 FIX)
exports.getProperties = async (req, res) => {
  try {
    const properties = await Property
      .find({ isActive: true }) // 🔥 IMPORTANT FILTER
      .populate("location createdBy");

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

    // 🔥 SOFT DELETE
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