const PropertyType = require("../models/PropertyType");
const slugify = require("../utils/slugify");

exports.createPropertyType = async (req, res) => {
  const { name } = req.body;

  const data = await PropertyType.create({
    name,
    slug: slugify(name),
  });

  res.status(201).json({ success: true, data });
};

exports.getPropertyTypes = async (req, res) => {
  const data = await PropertyType.find();
  res.json({ success: true, data });
};

exports.deletePropertyType = async (req, res) => {
  await PropertyType.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};