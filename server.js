const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");

// Routes
const propertyRoutes = require("./routes/propertyRoutes");
const authRoutes = require("./routes/authRoutes");
const locationRoutes = require("./routes/locationRoutes");
const builderRoutes = require("./routes/builderRoutes");
const propertyTypeRoutes = require("./routes/propertyTypeRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const leadRoutes = require("./routes/leadRoutes");
const developerRoutes = require("./routes/developerRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

// 🔥 Import Models
require("./models/Location");
require("./models/User");
require("./models/Property");
require("./models/Lead");
require("./models/Category");

const app = express();

// ✅ 1. CORS (VERY IMPORTANT FIX)
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://property-bouquet-frontend.vercel.app"
  ],
  credentials: true
}));

// ✅ 2. MIDDLEWARE ORDER FIX
app.use(express.json());
app.use(cookieParser());

// ✅ 3. ROUTES
app.use("/api/properties", propertyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/builders", builderRoutes);
app.use("/api/property-types", propertyTypeRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/developers", developerRoutes);
app.use("/api/categories", categoryRoutes);


console.log("AUTH ROUTES LOADED");
// Test Route
app.get("/", (req, res) => {
  res.send("Property Bouquet API running...");
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

const PORT = process.env.PORT || 5000;

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected ✅");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} 🚀`);
    });
  })
  .catch((err) => {
    console.error("MongoDB Connection Error ❌:", err.message);
  });