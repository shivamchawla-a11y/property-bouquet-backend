const mongoose = require("mongoose");

/* ============================================================
   ABOUT HIGHLIGHT
============================================================ */

const aboutHighlightSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

/* ============================================================
   ABOUT MARKET INSIGHT
============================================================ */

const aboutInsightSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

/* ============================================================
   CONNECTIVITY ITEM
============================================================ */

const connectivityItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
      trim: true,
    },

    subtitle: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

/* ============================================================
   LOCATION SCHEMA
============================================================ */

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

    image: {
      type: String,
      default: "",
    },

    /* ========================================================
       PUBLIC LOCATION PAGE CONTENT
       
       IMPORTANT:
       These are OPTIONAL overrides.
       Empty strings mean:
       "use the existing public-page default".
    ======================================================== */

    pageContent: {
      /* ======================================================
         HERO
      ====================================================== */

      hero: {
        eyebrow: {
          type: String,
          default: "",
          trim: true,
        },

        title: {
          type: String,
          default: "",
          trim: true,
        },

        description: {
          type: String,
          default: "",
        },

        image: {
          type: String,
          default: "",
        },

        locationLabel: {
          type: String,
          default: "",
          trim: true,
        },

        whyTitle: {
          type: String,
          default: "",
          trim: true,
        },

        whyDescription: {
          type: String,
          default: "",
        },

        benefits: {
          type: [String],
          default: [],
        },

        mobileBenefits: {
          type: [String],
          default: [],
        },

        primaryCtaText: {
          type: String,
          default: "",
          trim: true,
        },

        primaryCtaLink: {
          type: String,
          default: "",
          trim: true,
        },

        secondaryCtaText: {
          type: String,
          default: "",
          trim: true,
        },

        secondaryCtaLink: {
          type: String,
          default: "",
          trim: true,
        },

        footerEyebrow: {
          type: String,
          default: "",
          trim: true,
        },

        footerText: {
          type: String,
          default: "",
        },
      },

      /* ======================================================
         ABOUT
      ====================================================== */

      about: {
        enabled: {
          type: Boolean,
          default: true,
        },

        eyebrow: {
          type: String,
          default: "",
          trim: true,
        },

        title: {
          type: String,
          default: "",
          trim: true,
        },

        content: {
          type: String,
          default: "",
        },

        image: {
          type: String,
          default: "",
        },

        highlights: {
          type: [aboutHighlightSchema],
          default: [],
        },

        marketEyebrow: {
          type: String,
          default: "",
          trim: true,
        },

        marketTitle: {
          type: String,
          default: "",
          trim: true,
        },

        marketDescription: {
          type: String,
          default: "",
        },

        marketInsights: {
          type: [aboutInsightSchema],
          default: [],
        },

        perspectiveEyebrow: {
          type: String,
          default: "",
          trim: true,
        },

        perspectiveQuote: {
          type: String,
          default: "",
        },
      },

      /* ======================================================
         CONNECTIVITY
      ====================================================== */

      connectivity: {
        eyebrow: {
          type: String,
          default: "",
          trim: true,
        },

        title: {
          type: String,
          default: "",
          trim: true,
        },

        description: {
          type: String,
          default: "",
        },

        image: {
          type: String,
          default: "",
        },

        items: {
          type: [connectivityItemSchema],
          default: [],
        },

        advantageEyebrow: {
          type: String,
          default: "",
          trim: true,
        },

        advantageTitle: {
          type: String,
          default: "",
        },
      },

      /* ======================================================
         NEARBY LOCATIONS
         
         The actual nearby-location calculation remains dynamic.
         These fields only override the section copy.
      ====================================================== */

      nearby: {
        eyebrow: {
          type: String,
          default: "",
          trim: true,
        },

        title: {
          type: String,
          default: "",
          trim: true,
        },

        description: {
          type: String,
          default: "",
        },
      },
    },
  },

  { timestamps: true }
);

locationSchema.index(
  { name: 1, parent: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.Location ||
  mongoose.model("Location", locationSchema);