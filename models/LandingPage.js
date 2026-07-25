const mongoose = require("mongoose");

const landingPageSchema = new mongoose.Schema(
  {
    // ======================================================
    // BASIC INFORMATION
    // ======================================================

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
      index: true,
    },

    // Used to prevent duplicate generated pages
    fingerprint: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    generated: {
      type: Boolean,
      default: true,
    },

    ignoreGeneration: {
      type: Boolean,
      default: false,
    },

    // developer
    // location
    // developer_location
    // developer_location_category
    pageType: {
      type: String,
      required: true,
      index: true,
    },

    // ======================================================
// COLLECTION VALUES
// Used for Admin UI, SEO and Templates
// ======================================================

values: {
  developer: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Developer",
      default: null,
    },

    name: {
      type: String,
      default: "",
    },
  },

  location: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
    },

    name: {
      type: String,
      default: "",
    },
  },

  category: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    name: {
      type: String,
      default: "",
    },
  },

  bhk: {
    type: String,
    default: "",
  },
},

    // ======================================================
    // FILTERS
    // These match your existing PropertyFilters
    // ======================================================

    filters: {
      search: {
        type: String,
        default: "",
      },

      developers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Developer",
        },
      ],

      locations: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Location",
        },
      ],

      categories: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
        },
      ],

      bhk: [
        {
          type: String,
        },
      ],

      amenities: [
        {
          type: String,
        },
      ],

      budget: {
        min: {
          type: Number,
          default: null,
        },

        max: {
          type: Number,
          default: null,
        },
      },
    },

    // ======================================================
    // MATCHING PROPERTIES
    // ======================================================

    matchingProperties: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property",
      },
    ],

    propertyCount: {
      type: Number,
      default: 0,
    },

    // ======================================================
    // COLLECTION STATS
    // ======================================================

    statistics: {
      averagePrice: {
        type: Number,
        default: 0,
      },

      minPrice: {
        type: Number,
        default: 0,
      },

      maxPrice: {
        type: Number,
        default: 0,
      },

      developerCount: {
        type: Number,
        default: 0,
      },

      locationCount: {
        type: Number,
        default: 0,
      },

      updatedAt: {
        type: Date,
      },
    },

    // ======================================================
    // SEO
    // ======================================================

    seoScore: {
      type: Number,
      default: 0,
    },

    seo: {
      hasCustomSEO: {
        type: Boolean,
        default: false,
      },

      metaTitle: {
        type: String,
        default: "",
      },

      metaDescription: {
        type: String,
        default: "",
      },

      keywords: [
        {
          type: String,
        },
      ],

      h1: {
        type: String,
        default: "",
      },

      canonical: {
        type: String,
        default: "",
      },
    },

    // ======================================================
    // PREVIEW
    // ======================================================

    previewImage: {
      type: String,
      default: "",
    },

    // ======================================================
    // VERSIONING
    // ======================================================

    version: {
      type: Number,
      default: 1,
    },

    // ======================================================
    // DATES
    // ======================================================

    lastGeneratedAt: Date,

    publishedAt: Date,

    // ======================================================
    // ADMIN
    // ======================================================

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ======================================================
// INDEXES
// ======================================================

landingPageSchema.index({
  status: 1,
  pageType: 1,
});

landingPageSchema.index({
  slug: 1,
});

landingPageSchema.index({
  fingerprint: 1,
});

landingPageSchema.index({
  isDeleted: 1,
});

landingPageSchema.index({
  generated: 1,
});

landingPageSchema.index({
  ignoreGeneration: 1,
});

module.exports =
  mongoose.models.LandingPage ||
  mongoose.model("LandingPage", landingPageSchema);