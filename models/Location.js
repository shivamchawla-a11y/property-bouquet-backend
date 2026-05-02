const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    slug: { type: String, unique: true },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
    },
  },
  { timestamps: true }
);

// 🔥 PREVENT DUPLICATE UNDER SAME PARENT
locationSchema.index({ name: 1, parent: 1 }, { unique: true });

module.exports = mongoose.model("Location", locationSchema);