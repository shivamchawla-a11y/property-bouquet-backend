const Developer = require("../models/Developer");
const slugify = require("slugify");
const Property = require("../models/Property");

// ================= CREATE =================
exports.createDeveloper = async (req, res) => {
  try {
    const { name, logo } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Developer name is required ❌",
      });
    }

    const trimmedName = name.trim();

    const exists = await Developer.findOne({
      name: {
        $regex: new RegExp(`^${trimmedName}$`, "i"),
      },
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Developer already exists ❌",
      });
    }

    const developer = await Developer.create({
      name: trimmedName,

      slug: slugify(trimmedName, {
        lower: true,
        strict: true,
      }),

      logo: logo?.trim() || "/placeholder.png",
    });

    res.status(201).json({
      success: true,
      data: developer,
    });

  } catch (err) {
    console.error("CREATE DEV ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Server error ❌",
    });
  }
};

exports.getDeveloperBySlug = async (req, res) => {
  try {

    const developer = await Developer.findOne({
      slug: req.params.slug,
    });

    if (!developer) {
      return res.status(404).json({
        success: false,
        message: "Developer not found ❌",
      });
    }

    // 🔥 FIND ALL PROPERTIES USING THIS DEV
    const properties = await Property.find({
      "coreDetails.developerRef": developer._id,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      developer,
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

// ================= GET =================
exports.getDevelopers = async (req, res) => {
  try {
    const developers = await Developer.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: developers,
    });
  } catch (err) {
    res.status(500).json({
      message: "Server error ❌",
    });
  }
};

// ================= DELETE =================
exports.deleteDeveloper = async (req, res) => {
  try {
    await Developer.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Deleted successfully ✅",
    });
  } catch (err) {
    res.status(500).json({
      message: "Server error ❌",
    });
  }
};