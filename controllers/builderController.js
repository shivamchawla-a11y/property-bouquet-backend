const Builder = require("../models/Builder");
const slugify = require("../utils/slugify");

exports.createBuilder = async (req, res) => {
  try {
    const { name } = req.body;

    const builder = await Builder.create({
      name,
      slug: slugify(name),
    });

    res.status(201).json({ success: true, data: builder });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBuilders = async (req, res) => {
  const data = await Builder.find();
  res.json({ success: true, data });
};

exports.deleteBuilder = async (req, res) => {
  await Builder.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};