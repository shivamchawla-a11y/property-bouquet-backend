const Redirect = require("../models/Redirect");

const redirectMiddleware = async (req, res, next) => {
  try {
    // Ignore API routes
    if (req.path.startsWith("/api")) {
      return next();
    }

    // Ignore static assets
    if (
      req.path.startsWith("/uploads") ||
      req.path.startsWith("/favicon") ||
      req.path.startsWith("/robots") ||
      req.path.startsWith("/sitemap") ||
      req.path.startsWith("/_next")
    ) {
      return next();
    }

    // Ignore root
    if (req.path === "/") {
      return next();
    }

    const redirect = await Redirect.findOne({
      sourceUrl: req.path,
      enabled: true,
    });

    if (!redirect) {
      return next();
    }

    redirect.hits += 1;
    redirect.lastHit = new Date();
    await redirect.save();

    const status = redirect.type === 302 ? 302 : 301;

    return res.redirect(status, redirect.destinationUrl);

  } catch (err) {
    console.error("Redirect Middleware:", err);
    next();
  }
};

module.exports = redirectMiddleware;