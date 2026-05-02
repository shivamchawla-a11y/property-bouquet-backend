const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    // ❌ removed unique (IMPORTANT FIX)
    slug: { type: String },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
    },
  },
  { timestamps: true }
);

// ✅ UNIQUE only within same parent (correct logic)
locationSchema.index({ name: 1, parent: 1 }, { unique: true });

module.exports = mongoose.model("Location", locationSchema);