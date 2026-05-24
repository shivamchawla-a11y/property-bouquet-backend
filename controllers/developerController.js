const Developer = require("../models/Developer");
const slugify = require("slugify");
const Property = require("../models/Property");

// ================= CREATE =================
exports.createDeveloper = async (
  req,
  res
) => {
  try {
    const {
  name,
  logo,
  image,
  description,
} = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Developer name is required ❌",
      });
    }

    const trimmedName =
      name.trim();

    const exists =
      await Developer.findOne({
        name: {
          $regex: new RegExp(
            `^${trimmedName}$`,
            "i"
          ),
        },
      });

    if (exists) {
      return res.status(400).json({
        success: false,
        message:
          "Developer already exists ❌",
      });
    }

    const developer =
      await Developer.create({
        name: trimmedName,

        slug: slugify(
          trimmedName,
          {
            lower: true,
            strict: true,
          }
        ),

        logo:
          logo?.trim() ||
          "/placeholder.png",

        // ✅ NEW IMAGE FIELD
        image:
  image?.trim() || "",

description:
  description?.trim() || "",
      });

    res.status(201).json({
      success: true,
      data: developer,
    });
  } catch (err) {
    console.error(
      "CREATE DEV ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      message: "Server error ❌",
    });
  }
};

// ================= UPDATE =================
exports.updateDeveloper = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
  name,
  logo,
  image,
  description,
} = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Developer name is required ❌",
      });
    }

    const trimmedName =
      name.trim();

    const existing =
      await Developer.findOne({
        _id: { $ne: id },

        name: {
          $regex: new RegExp(
            `^${trimmedName}$`,
            "i"
          ),
        },
      });

    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          "Another developer with this name already exists ❌",
      });
    }

    const updatedDeveloper =
      await Developer.findByIdAndUpdate(
        id,
        {
          name: trimmedName,

          slug: slugify(
            trimmedName,
            {
              lower: true,
              strict: true,
            }
          ),

          logo:
            logo?.trim() ||
            "/placeholder.png",

          image:
  image?.trim() || "",

description:
  description?.trim() || "",
        },
        {
          new: true,
        }
      );

    if (!updatedDeveloper) {
      return res.status(404).json({
        success: false,
        message:
          "Developer not found ❌",
      });
    }

    res.json({
      success: true,
      message:
        "Developer updated successfully ✅",
      data: updatedDeveloper,
    });
  } catch (err) {
    console.error(
      "UPDATE DEV ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      message: "Server error ❌",
    });
  }
};

// ================= GET BY SLUG =================
exports.getDeveloperBySlug =
  async (req, res) => {
    try {
      const { slug } = req.params;

      const developer =
        await Developer.findOne({
          slug,
        });

      if (!developer) {
        return res.status(404).json({
          success: false,
          message:
            "Developer not found ❌",
        });
      }

      const properties =
        await Property.find({
          developerRef:
            developer._id,
        });

      return res.json({
        success: true,
        developer,
        properties,
      });
    } catch (err) {
      console.log(
        "GET DEV BY SLUG ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message: "Server error ❌",
        error: err.message,
      });
    }
  };

// ================= GET ALL =================
exports.getDevelopers = async (
  req,
  res
) => {
  try {
    const developers =
      await Developer.find().sort({
        createdAt: -1,
      });

    res.json({
      success: true,
      data: developers,
    });
  } catch (err) {
    console.log(
      "GET DEVELOPERS ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      message: "Server error ❌",
    });
  }
};

// ================= DELETE =================
exports.deleteDeveloper = async (
  req,
  res
) => {
  try {
    await Developer.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true,
      message:
        "Deleted successfully ✅",
    });
  } catch (err) {
    console.log(
      "DELETE DEV ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      message: "Server error ❌",
    });
  }
};