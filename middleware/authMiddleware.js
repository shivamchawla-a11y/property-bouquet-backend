const jwt = require("jsonwebtoken");

// 🔐 PROTECT
exports.protect = (req, res, next) => {
  console.log("🔥 PROTECT MIDDLEWARE HIT");

  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (err) {
    console.error("AUTH ERROR:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// 🔐 AUTHORIZE (✅ FIXED PROPER EXPORT)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    console.log("🔥 AUTHORIZE HIT", req.user);

    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
};