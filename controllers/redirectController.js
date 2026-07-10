const Redirect = require("../models/Redirect");

// ===============================
// GET ALL REDIRECTS
// ===============================
exports.getRedirects = async (req, res) => {
  try {
    const redirects = await Redirect.find()
      .sort({ createdAt: -1 });

    res.json(redirects);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch redirects",
    });
  }
};

// ===============================
// GET SINGLE REDIRECT
// ===============================
exports.getRedirect = async (req, res) => {
  try {
    const redirect = await Redirect.findById(
      req.params.id
    );

    if (!redirect) {
      return res.status(404).json({
        message: "Redirect not found",
      });
    }

    res.json(redirect);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch redirect",
    });
  }
};

// ===============================
// CREATE REDIRECT
// ===============================
exports.createRedirect = async (req, res) => {
  try {
    const {
      from,
      to,
      type,
      active,
      notes,
    } = req.body;

    if (!from || !to) {
      return res.status(400).json({
        message: "Both URLs are required.",
      });
    }

    if (from === to) {
      return res.status(400).json({
        message:
          "Source and destination cannot be the same.",
      });
    }

    const exists = await Redirect.findOne({
      from,
    });

    if (exists) {
      return res.status(400).json({
        message:
          "A redirect already exists for this URL.",
      });
    }

    const redirect = await Redirect.create({
      from,
      to,
      type: type || 301,
      active:
        active === undefined ? true : active,
      notes,
      createdBy: req.user?._id,
    });

    res.status(201).json(redirect);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to create redirect",
    });
  }
};

// ===============================
// UPDATE REDIRECT
// ===============================
exports.updateRedirect = async (req, res) => {
  try {
    const {
      from,
      to,
      type,
      active,
      notes,
    } = req.body;

    const redirect = await Redirect.findById(
      req.params.id
    );

    if (!redirect) {
      return res.status(404).json({
        message: "Redirect not found",
      });
    }

    if (
      from &&
      from !== redirect.from
    ) {
      const duplicate =
        await Redirect.findOne({
          from,
        });

      if (duplicate) {
        return res.status(400).json({
          message:
            "Source URL already exists.",
        });
      }
    }

    redirect.from = from;
    redirect.to = to;
    redirect.type = type;
    redirect.active = active;
    redirect.notes = notes;

    await redirect.save();

    res.json(redirect);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to update redirect",
    });
  }
};

// ===============================
// DELETE REDIRECT
// ===============================
exports.deleteRedirect = async (req, res) => {
  try {
    const redirect =
      await Redirect.findByIdAndDelete(
        req.params.id
      );

    if (!redirect) {
      return res.status(404).json({
        message: "Redirect not found",
      });
    }

    res.json({
      message: "Redirect deleted.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to delete redirect",
    });
  }
};

// ===============================
// TOGGLE ACTIVE
// ===============================
exports.toggleRedirect = async (req, res) => {
  try {
    const redirect =
      await Redirect.findById(
        req.params.id
      );

    if (!redirect) {
      return res.status(404).json({
        message: "Redirect not found",
      });
    }

    redirect.active = !redirect.active;

    await redirect.save();

    res.json(redirect);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message:
        "Failed to update redirect",
    });
  }
};