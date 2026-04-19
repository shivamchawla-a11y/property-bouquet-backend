const Property = require("../models/Property");


exports.createProperty = async (req, res) => {
  try {
    const data = req.body;

    const property = await Property.create({
      ...data,
      createdBy: req.user.id, // ✅ directly from token
    });

    res.status(201).json({
      success: true,
      data: property,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get All Properties
exports.getProperties = async (req, res) => {
  try {
    const properties = await Property.find().populate("location createdBy");

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