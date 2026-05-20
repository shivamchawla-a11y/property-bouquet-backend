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

  // ================= ABOUT SECTION =================

  // SECTION NUMBER
  aboutSectionNumber: {
    type: String,
    default: "02",
  },

  // SECTION LABEL
  aboutLabel: {
    type: String,
    default: "About The Project",
  },

  // TITLE LINE 1
  aboutTitleLine1: {
    type: String,
    default: "A Vision That",
  },

  // TITLE LINE 2
  aboutTitleLine2: {
    type: String,
    default: "Transcends the Ordinary",
  },

  // DESCRIPTION
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

  // ================= PROPERTY HIGHLIGHTS =================

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

  // ================= AMENITIES SECTION =================

  amenitiesSectionNumber: {
    type: String,
    default: "04",
  },

  amenitiesSectionLabel: {
    type: String,
    default: "Project Amenities",
  },

  amenitiesHeadingLine1: {
    type: String,
    default: "Every Detail.",
  },

  amenitiesHeadingLine2: {
    type: String,
    default: "Elevated",
  },

  amenitiesHeadingLine3: {
    type: String,
    default: "Beyond Expectation.",
  },

  amenitiesSubheading: {
    type: String,
    default:
      "Eldeco Camelot is a seamless blend of thoughtful design, cutting-edge technology and world-class amenities curated for an extraordinary lifestyle.",
  },

  // ================= AMENITIES =================

  highlights: [
    {
      name: {
        type: String,
        default: "",
      },

      icon: {
        type: String,
        default: "Home",
      },
    }
  ],

  // ================= BOTTOM STRIP =================

  bottomStripTitle1: {
    type: String,
    default: "Thoughtfully by Design.",
  },

  bottomStripTitle2: {
    type: String,
    default: "Crafted for the Exceptional.",
  },

  bottomStripFeature1: {
    type: String,
    default: "Premium Specifications",
  },

  bottomStripFeature2: {
    type: String,
    default: "Finest Quality Materials",
  },

  bottomStripFeature3: {
    type: String,
    default: "Curated for Discerning Families",
  },
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