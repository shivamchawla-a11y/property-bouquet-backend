const mongoose = require("mongoose");

const knowledgeSchema = new mongoose.Schema(
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
      trim: true,
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

    featuredImage: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      enum: [
        "Buying Guide",
        "Selling Guide",
        "Investment",
        "Legal",
        "Home Loans",
        "Taxation",
        "Luxury Living",
        "Interior Design",
        "Market Education",
        "NRI Guide",
        "Tips & Tricks",
        "General",
      ],
      default: "General",
    },

    author: {
      type: String,
      default: "Property Bouquet Research Team",
    },

    readTime: {
      type: Number,
      default: 5,
      min: 1,
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
      metaTitle: {
        type: String,
        default: "",
      },

      metaDescription: {
        type: String,
        default: "",
      },

      keywords: {
        type: [String],
        default: [],
      },
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
  mongoose.models.Knowledge ||
  mongoose.model("Knowledge", knowledgeSchema);