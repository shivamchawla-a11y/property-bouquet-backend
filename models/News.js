const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    shortDescription: {
      type: String,
      required: true,
      maxlength: 250,
    },

    content: {
      type: String,
      required: true,
    },

    heroImage: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      enum: [
        "Luxury Real Estate",
        "Investment",
        "Market Insights",
        "Branded Residences",
        "Developer News",
        "Location Guide",
      ],
      default: "Luxury Real Estate",
    },

    author: {
      type: String,
      default: "Property Bouquet Research Team",
    },

    readTime: {
      type: Number,
      default: 5,
    },

    featured: {
      type: Boolean,
      default: false,
    },

    views: {
      type: Number,
      default: 0,
    },

    publishDate: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.News ||
  mongoose.model("News", newsSchema);