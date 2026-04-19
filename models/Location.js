const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },

  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model("Location", locationSchema);