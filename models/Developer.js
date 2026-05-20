const mongoose = require("mongoose");

const developerSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    logo: {
      type: String,
     default: "/placeholder.png",
    },

    // ✅ NEW DEVELOPER COVER IMAGE
    image: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "Developer",
  developerSchema
);