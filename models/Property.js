const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({
  title: String,
  slug: { type: String, unique: true },

  price: Number,

  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
  },

  marketType: {
    type: String,
    enum: ["Primary", "Resale"],
    required: true,
  },

  // 🔥 Microsite Structure
  heroSection: {
    title: String,
    subtitle: String,
    images: [String],
  },

  overview: {
    description: String,
    highlights: [String],
  },

  floorPlans: [
    {
      title: String,
      image: String,
      price: Number,
    }
  ],

  gatedContent: {
    brochureUrl: String,
    requireLogin: {
      type: Boolean,
      default: true,
    },
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }

}, { timestamps: true });

module.exports = mongoose.model("Property", propertySchema);