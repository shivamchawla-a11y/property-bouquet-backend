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

    // ✅ DEVELOPER COVER IMAGE
    image: {
      type: String,
      default: "",
    },

    // ✅ ABOUT DEVELOPER DESCRIPTION
    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "Developer",
  developerSchema
);