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
   REAL ESTATE TYPE CARD

   description supports both:
   - normal plain text
   - HTML/rich text from RichTextEditor
============================================================ */

const realEstateTypeCardSchema = new mongoose.Schema(
  {
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
  {
    _id: false,
  }
);

/* ============================================================
   LIFESTYLE GROUP

   NOTE:
   groups[].description remains plain text.

   Only:
   pageContent.lifestyle.description
   is intended to support rich text.
============================================================ */

const lifestyleGroupSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    items: {
      type: [String],
      default: () => [],
    },
  },
  {
    _id: false,
  }
);

/* ============================================================
   WHY BUY REASON

   NOTE:
   reasons[].description remains plain text.

   Only:
   pageContent.whyBuy.description
   is intended to support rich text.
============================================================ */

const whyBuyReasonSchema = new mongoose.Schema(
  {
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
  {
    _id: false,
  }
);

/* ============================================================
   FAQ ITEM

   answer supports both:
   - normal plain text
   - HTML/rich text from RichTextEditor
============================================================ */

const faqItemSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      default: "",
      trim: true,
    },

    answer: {
      type: String,
      default: "",
    },
  },
  {
    _id: false,
  }
);

/* ============================================================
   CUSTOM LOCATION SECTION
============================================================ */

const customLocationSectionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: "",
      trim: true,
    },

    type: {
      type: String,
      default: "richText",
      trim: true,
    },

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

    subtitle: {
      type: String,
      default: "",
    },

    content: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    imagePosition: {
      type: String,
      default: "right",
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

       Every field inside pageContent is an OPTIONAL OVERRIDE.

       Empty strings mean:

       "Use the existing/default public page value."

       The public components are responsible for fallback
       behaviour when a custom value is empty.
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

         Rich-text fields:
         - content
         - marketDescription

         Plain-text fields:
         - highlights[].description
         - marketInsights[].description
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
          default: () => [],
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
          default: () => [],
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

         Rich-text field:
         - description

         Plain-text:
         - items[].subtitle
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
          default: () => [],
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

         Rich-text field:
         - description

         Actual nearby locations remain dynamic.
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

      /* ======================================================
         REAL ESTATE TYPES

         Rich-text fields:
         - description
         - cards[].description
      ====================================================== */

      realEstateTypes: {
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

        cards: {
          type: [realEstateTypeCardSchema],
          default: () => [],
        },
      },

      /* ======================================================
         PROPERTY PRICES

         Rich-text field:
         - description

         Plain-text:
         - currentPricingDescription
      ====================================================== */

      propertyPrices: {
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

        ctaText: {
          type: String,
          default: "",
          trim: true,
        },

        ctaLink: {
          type: String,
          default: "",
          trim: true,
        },

        factorsTitle: {
          type: String,
          default: "",
          trim: true,
        },

        factors: {
          type: [String],
          default: () => [],
        },

        currentPricingTitle: {
          type: String,
          default: "",
          trim: true,
        },

        currentPricingDescription: {
          type: String,
          default: "",
        },
      },

      /* ======================================================
         LIFESTYLE

         Rich-text field:
         - description

         Plain-text:
         - groups[].description
         - groups[].items
      ====================================================== */

      lifestyle: {
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

        groups: {
          type: [lifestyleGroupSchema],
          default: () => [],
        },
      },

      /* ======================================================
         WHY BUY

         Rich-text field:
         - description

         Plain-text:
         - reasons[].description
      ====================================================== */

      whyBuy: {
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

        reasons: {
          type: [whyBuyReasonSchema],
          default: () => [],
        },
      },

      /* ======================================================
         FAQ

         Rich-text field:
         - items[].answer
      ====================================================== */

      faq: {
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

        items: {
          type: [faqItemSchema],
          default: () => [],
        },
      },

      /* ======================================================
         ADVISOR CTA

         Stored as Mixed for now so existing/new CTA fields
         are not stripped by Mongoose.
      ====================================================== */

      advisorCta: {
        type: mongoose.Schema.Types.Mixed,
        default: () => ({}),
      },

      /* ======================================================
         CUSTOM ADDITIONAL SECTIONS
      ====================================================== */

      sections: {
        type: [customLocationSectionSchema],
        default: () => [],
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
  mongoose.model(
    "Location",
    locationSchema
  );