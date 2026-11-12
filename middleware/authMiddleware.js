const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const mongoose = require("mongoose");

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
// 🤖 AI AUTOMATION AUTHENTICATION
// ============================================================
// Used ONLY by:
// POST /api/properties/ai-create
//
// n8n authenticates using:
// X-AI-Automation-Key
//
// The key is stored privately in the backend .env file.
//
// The automation is mapped to an existing active user using:
// AI_AUTOMATION_USER_EMAIL
//
// This avoids storing a personal JWT inside n8n.
// ============================================================


exports.aiAutomationAuth = async (req, res, next) => {
  console.log("🤖 AI AUTOMATION AUTH MIDDLEWARE HIT");

  try {
    // ==========================================================
    // 1. VERIFY N8N AUTOMATION KEY
    // ==========================================================

    const providedKey =
      req.headers["x-ai-automation-key"];

    const configuredKey =
      process.env.AI_AUTOMATION_KEY;

    if (!providedKey || !configuredKey) {
      return res.status(401).json({
        success: false,
        message: "AI automation authentication required",
      });
    }

    const providedBuffer = Buffer.from(String(providedKey));
    const configuredBuffer = Buffer.from(String(configuredKey));

    if (
      providedBuffer.length !== configuredBuffer.length ||
      !crypto.timingSafeEqual(
        providedBuffer,
        configuredBuffer
      )
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid AI automation key",
      });
    }

    // ==========================================================
    // 2. GET THE INITIATING USER'S JWT
    // ==========================================================

    const authorization =
      req.headers.authorization || "";

    const tokenMatch = authorization.match(
      /^Bearer\s+(.+)$/i
    );

    if (!tokenMatch) {
      return res.status(401).json({
        success: false,
        message: "Agent authentication token missing",
      });
    }

    // ==========================================================
    // 3. VERIFY JWT
    // ==========================================================

    let decoded;

    try {
      decoded = jwt.verify(
        tokenMatch[1],
        process.env.JWT_SECRET
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired agent token",
      });
    }

    const userId =
      decoded.id || decoded._id || decoded.userId;

    if (
      !userId ||
      !mongoose.Types.ObjectId.isValid(String(userId))
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid agent identity",
      });
    }

    // ==========================================================
    // 4. FETCH ACTUAL ACTIVE USER FROM DATABASE
    // ==========================================================

    const user = await User.findOne({
      _id: userId,
      isActive: true,
    }).select("_id name email role");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
      });
    }

    // ==========================================================
    // 5. SET THE REAL LOGGED-IN USER
    // ==========================================================

    req.user = {
      id: user._id.toString(),
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    console.log("✅ AI PROPERTY CREATOR AUTHENTICATED:", {
      id: req.user.id,
      role: req.user.role,
    });

    next();

  } catch (error) {
    console.error("❌ AI AUTOMATION AUTH ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "AI automation authentication failed",
    });
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