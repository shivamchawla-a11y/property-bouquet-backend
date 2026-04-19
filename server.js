const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const propertyRoutes = require("./routes/propertyRoutes");
const authRoutes = require("./routes/authRoutes");
const locationRoutes = require("./routes/locationRoutes");
const builderRoutes = require("./routes/builderRoutes");
const propertyTypeRoutes = require("./routes/propertyTypeRoutes");


// 🔥 Import Models (important for Task 2)
require("./models/Location");
require("./models/User");
require("./models/Property");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/properties", propertyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/builders", builderRoutes);
app.use("/api/property-types", propertyTypeRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("Property Bouquet API running...");
});

// 🔥 Health check route (good practice)
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

const PORT = process.env.PORT || 5000;

// 🔥 Better Mongo connection handling
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