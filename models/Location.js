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
  {
    _id: false,
  }
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
  {
    _id: false,
  }
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
  {
    _id: false,
  }
);

/* ============================================================
   LOCATION SCHEMA
============================================================ */

const locationSchema = new mongoose.Schema(
  {
    /* ========================================================
       BASIC LOCATION INFORMATION
    ======================================================== */

    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      default: "",
      trim: true,
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

       Every field inside pageContent is an OPTIONAL OVERRIDE.

       Empty strings mean:

       "Use the existing/default public page value."

       The frontend is responsible for falling back to its
       existing default whenever a custom value is empty.

       This allows the admin to customize only the fields
       they actually want to change.
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

        /* ------------------------------------------------------
           DESKTOP BENEFITS
        ------------------------------------------------------ */

        benefits: {
          type: [String],
          default: () => [],
        },

        /* ------------------------------------------------------
           MOBILE BENEFITS
        ------------------------------------------------------ */

        mobileBenefits: {
          type: [String],
          default: () => [],
        },

        /* ------------------------------------------------------
           PRIMARY CTA
        ------------------------------------------------------ */

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

        /* ------------------------------------------------------
           SECONDARY CTA
        ------------------------------------------------------ */

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

        /* ------------------------------------------------------
           HERO FOOTER
        ------------------------------------------------------ */

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
         ABOUT LOCATION
      ====================================================== */

      about: {
        /* ------------------------------------------------------
           ENABLE / DISABLE
        ------------------------------------------------------ */

        enabled: {
          type: Boolean,
          default: true,
        },

        /* ------------------------------------------------------
           MAIN ABOUT CONTENT
        ------------------------------------------------------ */

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

        /* ------------------------------------------------------
           LOCATION HIGHLIGHTS / SNAPSHOT
        ------------------------------------------------------ */

        highlights: {
          type: [aboutHighlightSchema],
          default: () => [],
        },

        /* ------------------------------------------------------
           REAL ESTATE MARKET
        ------------------------------------------------------ */

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
          default: () => [],
        },

        /* ------------------------------------------------------
           PERSPECTIVE / QUOTE
        ------------------------------------------------------ */

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

        /* ------------------------------------------------------
           CONNECTIVITY CARDS
        ------------------------------------------------------ */

        items: {
          type: [connectivityItemSchema],
          default: () => [],
        },

        /* ------------------------------------------------------
           LOCATION ADVANTAGE
        ------------------------------------------------------ */

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
         
         IMPORTANT:

         Nearby locations themselves remain dynamic.

         These fields only control the section's text/copy.
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

  /* ==========================================================
     SCHEMA OPTIONS
  ========================================================== */

  {
    timestamps: true,
  }
);

/* ============================================================
   UNIQUE LOCATION NAME WITHIN SAME PARENT
============================================================ */

locationSchema.index(
  {
    name: 1,
    parent: 1,
  },
  {
    unique: true,
  }
);

/* ============================================================
   EXPORT
============================================================ */

module.exports =
  mongoose.models.Location ||
  mongoose.model("Location", locationSchema);