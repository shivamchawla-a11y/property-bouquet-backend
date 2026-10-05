const mongoose = require("mongoose");

/* ============================================================
   DEVELOPER PAGE CONTENT
   ============================================================ */

const developerPageContentSchema = new mongoose.Schema(
  {
    /* ==========================================================
       HERO
       ========================================================== */

    hero: {
      eyebrow: {
        type: String,
        default: "LUXURY DEVELOPER COLLECTION",
      },

      title: {
        type: String,
        default: "",
      },

      // Intentionally plain text
      description: {
        type: String,
        default: "",
      },

      image: {
        type: String,
        default: "",
      },
    },

    /* ==========================================================
       ABOUT DEVELOPER
       Rich text content
       ========================================================== */

    about: {
      enabled: {
        type: Boolean,
        default: true,
      },

      eyebrow: {
        type: String,
        default: "ABOUT THE DEVELOPER",
      },

      title: {
        type: String,
        default: "",
      },

      content: {
        type: String,
        default: "",
      },
    },

    /* ==========================================================
       STATS
       ========================================================== */

    stats: {
      enabled: {
        type: Boolean,
        default: true,
      },

      items: [
        {
          label: {
            type: String,
            default: "",
          },

          value: {
            type: String,
            default: "",
          },
        },
      ],
    },

    /* ==========================================================
       PROJECTS INTRODUCTION
       Projects themselves remain dynamic from Property collection.
       ========================================================== */

    projects: {
      enabled: {
        type: Boolean,
        default: true,
      },

      eyebrow: {
        type: String,
        default: "THE PORTFOLIO",
      },

      title: {
        type: String,
        default: "",
      },

      // Rich text
      description: {
        type: String,
        default: "",
      },
    },

    /* ==========================================================
       WHY CHOOSE
       ========================================================== */

    whyChoose: {
      enabled: {
        type: Boolean,
        default: true,
      },

      eyebrow: {
        type: String,
        default: "WHY CHOOSE THIS DEVELOPER",
      },

      title: {
        type: String,
        default: "",
      },

      // Rich text
      description: {
        type: String,
        default: "",
      },

      items: [
        {
          title: {
            type: String,
            default: "",
          },

          // Rich text
          description: {
            type: String,
            default: "",
          },
        },
      ],
    },

    /* ==========================================================
       PRESENCE
       ========================================================== */

    presence: {
      enabled: {
        type: Boolean,
        default: true,
      },

      eyebrow: {
        type: String,
        default: "DEVELOPER PRESENCE",
      },

      title: {
        type: String,
        default: "",
      },

      // Rich text
      description: {
        type: String,
        default: "",
      },
    },

    /* ==========================================================
       FAQ
       ========================================================== */

    faq: {
      enabled: {
        type: Boolean,
        default: true,
      },

      eyebrow: {
        type: String,
        default: "FREQUENTLY ASKED QUESTIONS",
      },

      title: {
        type: String,
        default: "",
      },

      items: [
        {
          question: {
            type: String,
            default: "",
          },

          // Rich text
          answer: {
            type: String,
            default: "",
          },
        },
      ],
    },

    /* ==========================================================
       SEO
       ========================================================== */

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
        type: String,
        default: "",
      },

      canonical: {
        type: String,
        default: "",
      },

      ogTitle: {
        type: String,
        default: "",
      },

      ogDescription: {
        type: String,
        default: "",
      },

      ogImage: {
        type: String,
        default: "",
      },
    },

    /* ==========================================================
       CUSTOM SECTIONS
       ========================================================== */

    customSections: [
      {
        id: {
          type: String,
          default: "",
        },

        type: {
          type: String,
          default: "content",
        },

        enabled: {
          type: Boolean,
          default: true,
        },

        eyebrow: {
          type: String,
          default: "",
        },

        title: {
          type: String,
          default: "",
        },

        subtitle: {
          type: String,
          default: "",
        },

        // Rich text
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
          enum: ["left", "right", "top", "bottom"],
          default: "right",
        },
      },
    ],
  },
  {
    _id: false,
  }
);


/* ============================================================
   MAIN DEVELOPER SCHEMA
   ============================================================ */

const developerSchema = new mongoose.Schema(
  {
    /* ==========================================================
       EXISTING FIELDS — DO NOT REMOVE
       ========================================================== */

    slug: {
      type: String,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    logo: {
      type: String,
      default: "/placeholder.jpg",
    },

    // Developer cover image
    image: {
      type: String,
      default: "",
    },

    // Existing developer description.
    // Kept for backward compatibility.
    description: {
      type: String,
      default: "",
      trim: true,
    },

    /* ==========================================================
       NEW — DEVELOPER PAGE CONTENT
       ========================================================== */

    pageContent: {
      type: developerPageContentSchema,
      default: () => ({}),
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Developer",
  developerSchema
);