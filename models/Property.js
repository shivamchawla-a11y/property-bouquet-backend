const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({

  // 🔥 BASIC INFO
  slug: {
    type: String,
    unique: true,
    required: true,
  },

  marketType: {
    type: String,
    enum: ["Primary", "Resale"],
    required: true,
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  // ================= CORE DETAILS =================
coreDetails: {
  title: {
    type: String,
    required: true,
  },

  // 🔥 DEVELOPER RELATION
  developerRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Developer",
    default: null,
  },

  // 🔥 CUSTOM DEVELOPER NAME
  developerName: {
    type: String,
    default: "",
  },

  // 🔥 NEW DEVELOPER IMAGE
  developerImage: {
    type: String,
    default: "",
  },

  // 🔥 NEW DEVELOPER LOGO
  developerLogo: {
    type: String,
    default: "",
  },

  startingPrice: Number,
  maxPrice: Number,
},

  // ================= CATEGORY =================
  categoryData: {

    // 🔥 CATEGORY RELATION
    categoryRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    // 🔥 CATEGORY NAME
    categoryName: {
      type: String,
      default: "",
    },
  },

  // ================= HERO SECTION =================
  heroSection: {

    // SMALL TOP LABEL
    propertyStatus: {
      type: String,
      default: "PRIVATE DIGITAL MANDATE",
    },

    // HERO DESCRIPTION
    heroDescription: {
      type: String,
      default: "",
    },

    // BUTTON TEXTS
    brochureButtonText: {
      type: String,
      default: "DOWNLOAD BROCHURE",
    },

    videoButtonText: {
      type: String,
      default: "WATCH PROJECT VIDEO",
    },

    // TAGLINES
    taglineItems: [
      {
        type: String,
      }
    ],
  },

  // ================= KEY METRICS =================
  keyMetrics: {
    landArea: String,
    possession: String,
    status: String,
    totalUnits: Number,
    totalTowers: Number,
    floors: String,
    reraNumber: String,
  },

  // ================= OVERVIEW =================
overview: {

  // SECTION NUMBER
  aboutSectionNumber: {
    type: String,
    default: "02",
  },

  // ================= ABOUT SECTION =================

  aboutLabel: {
    type: String,
    default: "About The Project",
  },

  aboutTitleLine1: {
    type: String,
    default: "A Vision That",
  },

  aboutTitleLine2: {
    type: String,
    default: "Transcends the Ordinary",
  },

    // ABOUT DESCRIPTION
    description: {
      type: String,
      default: "",
    },

    // SECOND PARAGRAPH
    aboutParagraph2: {
      type: String,
      default:
        "More than just a residence, it is a legacy in the making — crafted for discerning individuals and families who seek exclusivity in every detail of life.",
    },

    // ABOUT IMAGE
    aboutImageUrl: {
      type: String,
      default: "",
    },

    // ================= FEATURE BAR =================

    featureBar: [
      {
        title: {
          type: String,
          default: "",
        },

        desc: {
          type: String,
          default: "",
        },

        icon: {
          type: String,
          default: "✦",
        },
      }
    ],

    // ================= HIGHLIGHTS HEADER =================

    highlightsHeading: {
      type: String,
      default: "Crafted for Elevated",
    },

    highlightsSubheading: {
      type: String,
      default: "Modern Living",
    },

    // ================= QUOTE =================

    highlightQuote: {
      type: String,
      default: "",
    },

    // ================= DYNAMIC HIGHLIGHTS =================

    highlights: [
      {
        heading: {
          type: String,
          default: "",
        },

        subheading: {
          type: String,
          default: "",
        },

        icon: {
          type: String,
          default: "✦",
        },
      }
    ],
  },

  // ================= UNIT CONFIGURATIONS =================
  unitConfigurations: [
    {
      unitType: String,
      area: String,
      price: String,
      paymentPlan: String,
    }
  ],

  // ================= MEDIA =================
  media: {
    heroImageUrl: String,
    gallery: [String],
    walkthroughUrl: String,
  },

  // ================= LOCATION DATA =================
  locationData: {

    // 🔥 LOCATION RELATION
    locationRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
    },

    // 🔥 LOCATION LABEL
    locationName: {
      type: String,
      default: "",
    },

    // 🔥 CUSTOM LOCATION
    customLocation: {
      type: String,
      default: "",
    },

    address: String,
    mapEmbedUrl: String,

    landmarks: [
      {
        name: String,
        distance: String,
      }
    ]
  },

  // ================= GATED CONTENT =================
  gatedContent: {

    brochurePdfUrl: String,

    floorPlans: [
      {
        unitType: String,
        area: String,
        price: String,
        paymentPlan: String,
        image: String,
      }
    ],

    requireLogin: {
      type: Boolean,
      default: true,
    },
  },

  // ================= SEO ENGINE =================
  seoEngine: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
  },

  // ================= FAQ =================
  faqs: [
    {
      question: String,
      answer: String,
    }
  ],

  // ================= CTA =================
  cta: {
    title: String,
    subtitle: String,
    buttonText: String,
  },

  // ================= CREATED BY =================
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }

}, { timestamps: true });

module.exports = mongoose.model("Property", propertySchema);