const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
    },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
    },

    // NEW
    image: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// unique only within same parent
locationSchema.index(
  { name: 1, parent: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "Location",
  locationSchema
);