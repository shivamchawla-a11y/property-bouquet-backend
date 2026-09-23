const Developer = require("../models/Developer");
const slugify = require("slugify");
const Property = require("../models/Property");

// ============================================================
// BUILD PUBLIC DEVELOPER SEO SLUG
// ============================================================
//
// Examples:
//
// m3m
// → m3m-developer-projects
//
// signature-global
// → signature-global-developer-projects
//
// spiti-developer
// → spiti-developer-projects
//
// spiti-developers
// → spiti-developers-projects
//
// spiti-developer-projects
// → spiti-developer-projects
//
// spiti-developers-projects
// → spiti-developers-projects
//
// ============================================================

function buildDeveloperPublicSlug(slug) {
  if (!slug) {
    return "";
  }

  const cleanSlug = String(slug)
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "");

  if (!cleanSlug) {
    return "";
  }

  // Already complete public slug
  if (
    cleanSlug.endsWith("-developer-projects") ||
    cleanSlug.endsWith("-developers-projects")
  ) {
    return cleanSlug;
  }

  // Backend slug already ends with "-developer"
  if (cleanSlug.endsWith("-developer")) {
    return `${cleanSlug}-projects`;
  }

  // Backend slug already ends with "-developers"
  if (cleanSlug.endsWith("-developers")) {
    return `${cleanSlug}-projects`;
  }

  // Normal backend slug
  return `${cleanSlug}-developer-projects`;
}

// ============================================================
// CREATE
// ============================================================

exports.createDeveloper = async (req, res) => {
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
        message: "Developer name is required ❌",
      });
    }

    const trimmedName = name.trim();

    const exists = await Developer.findOne({
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
        message: "Developer already exists ❌",
      });
    }

    const developer = await Developer.create({
      name: trimmedName,

      // KEEP DATABASE SLUG AS NORMAL BACKEND SLUG
      slug: slugify(trimmedName, {
        lower: true,
        strict: true,
      }),

      logo:
        logo?.trim() ||
        "/placeholder.jpg",

      image:
        image?.trim() || "",

      description:
        description?.trim() || "",
    });

    // ========================================================
    // ADD PUBLIC SEO SLUG TO RESPONSE
    // ========================================================

    const developerResponse = {
      ...developer.toObject(),
      publicSlug: buildDeveloperPublicSlug(
        developer.slug
      ),
    };

    res.status(201).json({
      success: true,
      data: developerResponse,
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

// ============================================================
// UPDATE
// ============================================================

exports.updateDeveloper = async (req, res) => {
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
        message: "Developer name is required ❌",
      });
    }

    const trimmedName = name.trim();

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

          // KEEP DATABASE SLUG AS NORMAL BACKEND SLUG
          slug: slugify(trimmedName, {
            lower: true,
            strict: true,
          }),

          logo:
            logo?.trim() ||
            "/placeholder.jpg",

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
        message: "Developer not found ❌",
      });
    }

    // ========================================================
    // ADD PUBLIC SEO SLUG TO RESPONSE
    // ========================================================

    const developerResponse = {
      ...updatedDeveloper.toObject(),
      publicSlug:
        buildDeveloperPublicSlug(
          updatedDeveloper.slug
        ),
    };

    res.json({
      success: true,
      message:
        "Developer updated successfully ✅",
      data: developerResponse,
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

// ============================================================
// GET BY BACKEND SLUG
// ============================================================
//
// Example:
// /api/developers/m3m
//
// This remains available for the old/backend slug.
//
// ============================================================

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
          "coreDetails.developerRef":
            developer._id,

          isActive: true,
        });

      console.log(
        "Developer:",
        developer.name,
        developer._id
      );

      console.log(
        "Properties found:",
        properties.length
      );

      console.log(
        properties.map((p) => ({
          title:
            p.coreDetails?.title,
          slug: p.slug,
        }))
      );

      // ========================================================
      // ADD PUBLIC SEO SLUG
      // ========================================================

      const developerResponse = {
        ...developer.toObject(),
        publicSlug:
          buildDeveloperPublicSlug(
            developer.slug
          ),
      };

      return res.json({
        success: true,

        developer:
          developerResponse,

        properties,
      });
    } catch (err) {
      console.error(
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

// ============================================================
// GET BY PUBLIC SEO SLUG
// ============================================================
//
// Examples:
//
// /api/developers/public/m3m-developer-projects
//
// /api/developers/public/spiti-developer-projects
//
// /api/developers/public/spiti-developers-projects
//
// ============================================================

exports.getDeveloperByPublicSlug =
  async (req, res) => {
    try {
      const { publicSlug } = req.params;

      if (!publicSlug) {
        return res.status(400).json({
          success: false,
          message:
            "Public developer slug is required ❌",
        });
      }

      const requestedSlug =
        String(publicSlug)
          .trim()
          .toLowerCase()
          .replace(/^\/+|\/+$/g, "");

      if (!requestedSlug) {
        return res.status(400).json({
          success: false,
          message:
            "Public developer slug is required ❌",
        });
      }

      // ========================================================
      // GET ALL DEVELOPERS
      //
      // We calculate publicSlug from the existing backend slug.
      // No database migration is required.
      // ========================================================

      const developers =
        await Developer.find().lean();

      const developer =
        developers.find((item) => {
          const generatedPublicSlug =
            buildDeveloperPublicSlug(
              item.slug
            );

          return (
            generatedPublicSlug ===
            requestedSlug
          );
        });

      if (!developer) {
        return res.status(404).json({
          success: false,
          message:
            "Developer not found ❌",
        });
      }

      // ========================================================
      // GET ACTIVE PROPERTIES
      // ========================================================

      const properties =
        await Property.find({
          "coreDetails.developerRef":
            developer._id,

          isActive: true,
        });

      // ========================================================
      // RETURN PUBLIC DEVELOPER DATA
      // ========================================================

      const developerResponse = {
        ...developer,

        publicSlug:
          buildDeveloperPublicSlug(
            developer.slug
          ),
      };

      return res.json({
        success: true,

        developer:
          developerResponse,

        properties,

        backendSlug:
          developer.slug,

        publicSlug:
          developerResponse.publicSlug,
      });
    } catch (err) {
      console.error(
        "GET DEV BY PUBLIC SLUG ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message: "Server error ❌",
        error: err.message,
      });
    }
  };

// ============================================================
// GET ALL
// ============================================================
//
// Every developer now receives:
//
// slug
// publicSlug
//
// ============================================================

exports.getDevelopers = async (
  req,
  res
) => {
  try {
    const developers =
      await Developer.find()
        .sort({
          createdAt: -1,
        })
        .lean();

    const developersWithPublicSlug =
      developers.map((developer) => ({
        ...developer,

        publicSlug:
          buildDeveloperPublicSlug(
            developer.slug
          ),
      }));

    res.json({
      success: true,

      data:
        developersWithPublicSlug,
    });
  } catch (err) {
    console.error(
      "GET DEVELOPERS ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      message: "Server error ❌",
    });
  }
};

// ============================================================
// DELETE
// ============================================================

exports.deleteDeveloper =
  async (req, res) => {
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
      console.error(
        "DELETE DEV ERROR:",
        err
      );

      res.status(500).json({
        success: false,
        message: "Server error ❌",
      });
    }
  };