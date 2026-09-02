const jwt = require("jsonwebtoken");

// ============================================================
// 🔐 PROTECT
// ============================================================
// Used for routes that REQUIRE authentication.
// If no valid token exists → 401
// ============================================================

exports.protect = (req, res, next) => {
  console.log("🔥 PROTECT MIDDLEWARE HIT");

  try {
    let token;

    // ----------------------------------------------------------
    // Bearer token
    // ----------------------------------------------------------
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // ----------------------------------------------------------
    // Cookie token
    // ----------------------------------------------------------
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    // ----------------------------------------------------------
    // No token
    // ----------------------------------------------------------
    if (!token) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    // ----------------------------------------------------------
    // Verify JWT
    // ----------------------------------------------------------
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    console.log("✅ AUTHENTICATED USER:", {
      id: decoded.id,
      role: decoded.role,
    });

    next();
  } catch (err) {
    console.error("AUTH ERROR:", err);

    return res.status(401).json({
      message: "Invalid token",
    });
  }
};


// ============================================================
// 🔓 OPTIONAL PROTECT
// ============================================================
// Used for routes that are:
//   • Public for normal visitors
//   • Role-aware for logged-in users
//
// Example:
// GET /api/properties
//
// Public visitor:
//   req.user = null
//
// Agent:
//   req.user.role = "Agent"
//
// SuperAdmin:
//   req.user.role = "SuperAdmin"
//
// IMPORTANT:
// This middleware NEVER blocks the request.
// ============================================================

exports.optionalProtect = (req, res, next) => {
  console.log("🔎 OPTIONAL PROTECT MIDDLEWARE HIT");

  try {
    let token;

    // ----------------------------------------------------------
    // Bearer token
    // ----------------------------------------------------------
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // ----------------------------------------------------------
    // Cookie token
    // ----------------------------------------------------------
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    // ----------------------------------------------------------
    // No token = public visitor
    // ----------------------------------------------------------
    if (!token) {
      req.user = null;

      console.log("👤 PUBLIC REQUEST");

      return next();
    }

    // ----------------------------------------------------------
    // Verify token
    // ----------------------------------------------------------
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      req.user = decoded;

      console.log("✅ OPTIONAL AUTH USER:", {
        id: decoded.id,
        role: decoded.role,
      });
    } catch (err) {
      // --------------------------------------------------------
      // Invalid / expired token
      //
      // Do NOT block public property browsing.
      // Treat the request as unauthenticated.
      // --------------------------------------------------------
      console.warn(
        "⚠️ OPTIONAL AUTH TOKEN INVALID/EXPIRED"
      );

      req.user = null;
    }

    next();
  } catch (err) {
    console.error(
      "OPTIONAL AUTH ERROR:",
      err
    );

    req.user = null;

    next();
  }
};


// ============================================================
// 🔐 AUTHORIZE
// ============================================================
// Usage:
//
// authorize("SuperAdmin")
// authorize("SuperAdmin", "Agent")
//
// Only the supplied roles are allowed.
// ============================================================

exports.authorize = (...roles) => {
  return (req, res, next) => {
    console.log(
      "🔥 AUTHORIZE HIT",
      req.user
    );

    // ----------------------------------------------------------
    // User must already be authenticated
    // ----------------------------------------------------------
    if (!req.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    // ----------------------------------------------------------
    // Check role
    // ----------------------------------------------------------
    if (!roles.includes(req.user.role)) {
      console.warn(
        `⛔ ACCESS DENIED — ROLE: ${req.user.role}`
      );

      return res.status(403).json({
        message: "Forbidden",
      });
    }

    // ----------------------------------------------------------
    // Authorized
    // ----------------------------------------------------------
    console.log(
      `✅ ACCESS GRANTED — ROLE: ${req.user.role}`
    );

    next();
  };
};
