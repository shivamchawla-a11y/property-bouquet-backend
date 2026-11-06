
const mongoose = require("mongoose");

const knowledgeSchema = new mongoose.Schema(
  {
    // TITLE
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // SLUG
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // SHORT DESCRIPTION
    shortDescription: {
      type: String,
      required: true,
      maxlength: 250,
    },

    // FULL ARTICLE CONTENT
    content: {
      type: String,
      required: true,
    },

    // FEATURED IMAGE
    featuredImage: {
      type: String,
      default: "",
    },

    // CATEGORY
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
        "Project's Review",
        "General",
      ],
      default: "General",
    },

    // AUTHOR
    author: {
      type: String,
      default: "Property Bouquet Research Team",
    },

    // READ TIME
    readTime: {
      type: Number,
      default: 5,
      min: 1,
    },

    // FEATURED
    featured: {
      type: Boolean,
      default: false,
    },

    // VIEWS
    views: {
      type: Number,
      default: 0,
    },

    // PUBLISH DATE
    publishDate: {
      type: Date,
      default: Date.now,
    },

    // STATUS
    status: {
      type: String,
      enum: [
        "draft",
        "published",
      ],
      default: "draft",
    },

    // SEO
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

    // SOFT DELETE
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    // DELETION DATE
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);


// ============================================================
// HOMEPAGE LATEST ARTICLES COMPOUND INDEX
// ============================================================

knowledgeSchema.index(
  {
    status: 1,
    isDeleted: 1,
    publishDate: -1,
    createdAt: -1,
  },
  {
    name: "knowledge_latest_published",
  }
);


// ============================================================
// MODEL
// ============================================================

module.exports =
  mongoose.models.Knowledge ||
  mongoose.model(
    "Knowledge",
    knowledgeSchema
  );
