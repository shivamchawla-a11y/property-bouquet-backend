const mongoose = require("mongoose");

const pageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    slug: {
  type: String,
  default: "",
  unique: true,
  sparse: true,
},

    pageType: {
      type: String,
      enum: [
  "Home",
  "About",
  "Contact",
  "Privacy",
  "Terms",
  "Custom",
],
      default: "Custom",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    seo: {
      metaTitle: String,
      metaDescription: String,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Page", pageSchema);