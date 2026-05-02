const Category = require("../models/Category");

// ✅ CREATE
exports.createCategory = async (req, res) => {
  try {
    let { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name required",
      });
    }

    name = name.trim();

    // 🔥 CASE-INSENSITIVE CHECK
    const exists = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    const category = await Category.create({ name });

    res.status(201).json({
      success: true,
      data: category,
    });

  } catch (err) {
    console.error("CATEGORY ERROR:", err);

    // 🔥 HANDLE DUPLICATE KEY ERROR (IMPORTANT)
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// ✅ GET ALL
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: categories,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ✅ DELETE
exports.deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Deleted",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};