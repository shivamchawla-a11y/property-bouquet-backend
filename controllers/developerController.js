const Developer = require("../models/Developer");

// ================= CREATE =================
exports.createDeveloper = async (req, res) => {
  try {
    const { name, logo } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Developer name is required ❌",
      });
    }

    const exists = await Developer.findOne({ name });

    if (exists) {
      return res.status(400).json({
        message: "Developer already exists ❌",
      });
    }

    const developer = await Developer.create({
      name,
      logo: logo || "/placeholder.png",
    });

    res.status(201).json({
      success: true,
      data: developer,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
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