const Category = require("../models/Category");
const slugify = require("slugify");
const Property = require("../models/Property");


const getAllCategoryIds = async (parentId) => {
  const children = await Category.find({ parent: parentId });

  let ids = [parentId];

  for (const child of children) {
    const subIds = await getAllCategoryIds(child._id);
    ids = ids.concat(subIds);
  }

  return ids;
};

// ✅ CREATE
exports.createCategory = async (req, res) => {
  try {
    let { name, parent } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name required",
      });
    }

    name = name.trim();

    // ✅ CASE-INSENSITIVE CHECK (within same parent)
    const exists = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      parent: parent || null,
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Category already exists in this level",
      });
    }

    const category = await Category.create({
  name,

  slug: slugify(name, {
    lower: true,
    strict: true,
  }),

  parent: parent || null,
});

    res.status(201).json({
      success: true,
      data: category,
    });

  } catch (err) {
    console.error("CATEGORY ERROR:", err);

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

exports.getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({
      slug: req.params.slug,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found ❌",
      });
    }

    // 🔥 FIX: include all child categories
    const categoryIds = await getAllCategoryIds(category._id);

    const properties = await Property.find({
      "categoryData.categoryRef": { $in: categoryIds },
      isActive: true,
    })
      .populate("coreDetails.developerRef", "name logo")
      .populate("locationData.locationRef", "name");

    res.json({
      success: true,
      category,
      properties,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server error ❌",
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

exports.getCategoryTree = async (req, res) => {
  const categories = await Category.find().lean();

  const map = {};
  const roots = [];

  categories.forEach((cat) => {
    map[cat._id] = { ...cat, children: [] };
  });

  categories.forEach((cat) => {
    if (cat.parent && map[cat.parent]) {
      map[cat.parent].children.push(map[cat._id]);
    } else {
      roots.push(map[cat._id]);
    }
  });

  res.json({
    success: true,
    data: roots,
  });
};