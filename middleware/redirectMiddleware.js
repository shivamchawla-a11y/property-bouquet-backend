const Redirect = require("../models/Redirect");

const redirectMiddleware = async (req, res, next) => {
  try {
    // Ignore API routes
    if (req.path.startsWith("/api")) {
      return next();
    }

    // Ignore Next.js & static assets
    if (
      req.path.startsWith("/_next") ||
      req.path.startsWith("/uploads") ||
      req.path.startsWith("/favicon") ||
      req.path.startsWith("/robots") ||
      req.path.startsWith("/sitemap") ||
      req.path.startsWith("/images") ||
      req.path.startsWith("/icons")
    ) {
      return next();
    }

    // Ignore homepage
    if (req.path === "/") {
      return next();
    }

    // Build current URL
    const currentUrl =
      `${req.protocol}://${req.get("host")}${req.originalUrl}`;

    // Find redirect by FULL URL or PATH
    const redirect = await Redirect.findOne({
      active: true,
      $or: [
        { from: currentUrl },
        { from: req.originalUrl },
        { from: req.path },
      ],
    });

    if (!redirect) {
      return next();
    }

    // Update analytics
    redirect.hits += 1;
    redirect.lastUsed = new Date();

    await redirect.save();

    return res.redirect(redirect.type, redirect.to);

  } catch (err) {
    console.error("Redirect Middleware:", err);
    next();
  }
};

module.exports = redirectMiddleware;