const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({

  // 🔥 BASIC INFO
slug: {
  type: String,
  trim: true,
  lowercase: true,
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

  status: {
  type: String,
  enum: ["draft", "published"],
  default: "draft",
},

isDeleted: {
  type: Boolean,
  default: false,
},

deletedFromStatus: {
  type: String,
  enum: ["draft", "published"],
  default: null,
},

// ================= PROPERTY TAGS =================
propertyTag: {
  type: [
    {
      type: String,
      enum: [
        "Normal",
        "Featured",
        "Recommended",
        "Trending",
        "New",
      ],
    },
  ],
  default: ["Normal"],
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

    startingPrice: {
  type: Number,
  default: null,
},

maxPrice: {
  type: Number,
  default: null,
},

priceOnRequest: {
  type: Boolean,
  default: false,
},
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

  customMetrics: [
    {
      label: {
        type: String,
        default: "",
      },

      value: {
        type: String,
        default: "",
      },

      icon: {
        type: String,
        default: "FaHome",
      },
    },
  ],
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


    // ================= PROPERTY HIGHLIGHTS =================

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

// ================= AMENITIES =================

amenities: [
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

  // ================= CONFIGURATION SECTION =================
  configurationSection: {

    // SECTION NUMBER
    sectionNumber: {
      type: String,
      default: "05",
    },

    // TOP LABEL
    sectionLabel: {
      type: String,
      default: "Residence Configurations",
    },

    // TITLE
    titleLine1: {
      type: String,
      default: "Residences Tailored",
    },

    titleLine2: {
      type: String,
      default: "to Your Lifestyle",
    },

    // SUBTEXT
    subheading: {
      type: String,
      default:
        "Thoughtfully designed layouts that redefine space, privacy and luxury.",
    },

    // LEFT FEATURES
    features: [
      {
        type: String,
      }
    ],

    // BUTTON TEXT
    buttonText: {
      type: String,
      default: "View Details",
    },
  },

  // ================= UNIT CONFIGURATIONS =================
  unitConfigurations: [
    {
      unitType: {
        type: String,
        default: "",
      },

      area: {
        type: String,
        default: "",
      },

      price: {
        type: String,
        default: "",
      },

      paymentPlan: {
        type: String,
        default: "",
      },

      bedrooms: {
        type: String,
        default: "",
      },

      bathrooms: {
        type: String,
        default: "",
      },

      balconies: {
        type: String,
        default: "",
      },
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

    // ================= BASIC LOCATION =================
    address: {
      type: String,
      default: "",
    },

    mapEmbedUrl: {
      type: String,
      default: "",
    },

    // ================= LOCATION SECTION CONTENT =================

    sectionNumber: {
      type: String,
      default: "07",
    },

    topLabel: {
      type: String,
      default: "PRIME LOCATION",
    },

    headingLine1: {
      type: String,
      default: "A Location That",
    },

    headingHighlight: {
      type: String,
      default: "Defines Privilege.",
    },

    description: {
      type: String,
      default: "",
    },

    // ================= LEFT CARD =================

    leftCardTag: {
      type: String,
      default: "Prime Connectivity",
    },

    leftCardTitleLine1: {
      type: String,
      default: "Everything",
    },

    leftCardTitleLine2: {
      type: String,
      default: "Within Reach",
    },

    leftCardDescription: {
      type: String,
      default:
        "Strategically positioned near major business hubs, expressways, hospitals, schools and premium lifestyle destinations.",
    },

    // ================= MAP SECTION =================

    mapSectionTag: {
      type: String,
      default: "Interactive Location Map",
    },

    mapSectionTitle: {
      type: String,
      default: "Discover The Neighborhood",
    },

    // ================= BADGE =================

    badgeTitle: {
      type: String,
      default: "Prime",
    },

    badgeSubtitle: {
      type: String,
      default: "Location Advantage",
    },

    // ================= FLOATING CARD =================

    floatingCardTag: {
      type: String,
      default: "Signature Address",
    },

    floatingCardTitle: {
      type: String,
      default: "Prime Sector Connectivity",
    },

    floatingCardDescription: {
      type: String,
      default:
        "Positioned in one of the fastest growing luxury corridors with seamless access to major destinations.",
    },

    // ================= LANDMARKS =================

    landmarks: [
      {
        name: {
          type: String,
          default: "",
        },

        distance: {
          type: String,
          default: "",
        },

        subtitle: {
          type: String,
          default: "Premium Connectivity",
        },

        icon: {
          type: String,
          default: "✦",
        },
      }
    ],

    // ================= BOTTOM STRIP =================

    bottomStrip: [
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
  },

  // ================= MASTER PLAN SECTION =================
masterPlanSection: {

  // ================= SECTION CONTENT =================

  sectionNumber: {
    type: String,
    default: "08",
  },

  topLabel: {
    type: String,
    default: "MASTER PLAN",
  },

  headingLine1: {
    type: String,
    default: "Crafted With Vision.",
  },

  headingHighlight: {
    type: String,
    default: "Designed For Legacy.",
  },

  description: {
    type: String,
    default:
      "Explore the thoughtfully designed master plan featuring elegant layouts, landscaped greens, premium amenities, and seamless connectivity crafted for elevated living.",
  },

  // ================= SIDE STRIPS =================

  enableSideStrips: {
    type: Boolean,
    default: true,
  },

  // ================= TOP FLOATING LABEL =================

  topFloatingLabel: {
    type: String,
    default: "Premium Architectural Planning",
  },

  // ================= CENTER CONTENT =================

  centerTitle: {
    type: String,
    default: "The Master Plan",
  },

  centerDescription: {
    type: String,
    default:
      "Every space is carefully envisioned to create harmony between luxury, comfort, and timeless architecture.",
  },

  // ================= BUTTON =================

  buttonText: {
    type: String,
    default: "View Master Plan",
  },

  // ================= IMAGE =================

  masterPlanImage: {
    type: String,
    default: "",
  },

  // ================= BOTTOM STRIP =================

  bottomStrip: [
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
},

// ================= GATED CONTENT =================

gatedContent: {

  brochurePdfUrl: String,

  // ================= CONFIGURATION TYPE =================

  configurationType: {
    type: String,
    enum: ["Apartments", "Plots"],
    default: "Apartments",
  },

  // ================= APARTMENT FLOOR PLANS =================

  floorPlans: [

    {

      unitType: {
        type: String,
        default: "",
      },

      area: {
        type: String,
        default: "",
      },

      price: {
        type: String,
        default: "",
      },

      paymentPlan: {
        type: String,
        default: "",
      },

      bedrooms: {
        type: String,
        default: "",
      },

      bathrooms: {
        type: String,
        default: "",
      },

      balconies: {
        type: String,
        default: "",
      },

      image: {
        type: String,
        default: "",
      },

    }

  ],

  // ================= PLOT CONFIGURATIONS =================

  plotConfigurations: [

    {

      plotType: {
        type: String,
        default: "",
      },

      plotArea: {
        type: String,
        default: "",
      },

      price: {
        type: String,
        default: "",
      },

      paymentPlan: {
        type: String,
        default: "",
      },

      image: {
        type: String,
        default: "",
      },

    }

  ],

  // ================= LOGIN REQUIREMENT =================

  requireLogin: {
    type: Boolean,
    default: true,
  },

},

  // ================= SEO ENGINE =================
  seoEngine: {
  hasCustomSEO: {
    type: Boolean,
    default: false,
  },

  metaTitle: String,
  metaDescription: String,
  keywords: [String],
},

  // ================= FAQ SECTION =================
faqSection: {

  // ================= HEADING =================

  sectionNumber: {
    type: String,
    default: "09",
  },

  topLabel: {
    type: String,
    default: "FAQ",
  },

  headingLine1: {
    type: String,
    default: "Frequently Asked Questions",
  },

  headingHighlight: {
    type: String,
    default: "",
  },

  description: {
    type: String,
    default:
      "Find answers to common questions about the project and your journey to your dream home.",
  },

  // ================= LEFT CARD =================

  developerLabel: {
    type: String,
    default: "Luxury Developer",
  },

  // ================= CONTACT BOX =================

  contactTitle: {
    type: String,
    default: "Still have questions?",
  },

  contactDescription: {
    type: String,
    default:
      "Connect with our luxury property specialists and discover every detail crafted for elevated living.",
  },

  phone: {
    type: String,
    default: "+91 90901 06101",
  },

  timing: {
    type: String,
    default: "Monday — Sunday | 10 AM — 7 PM",
  },

  // ================= CTA =================

  ctaTitle: {
    type: String,
    default: "Ready to experience your dream home?",
  },

  ctaDescription: {
    type: String,
    default:
      "Book a site visit and take the first step towards your dream home.",
  },

  ctaButtonText: {
    type: String,
    default: "Book A Site Visit",
  },

  // ================= CTA SMALL LABELS =================

  callLabel: {
    type: String,
    default: "Call Us",
  },

  whatsappLabel: {
    type: String,
    default: "WhatsApp",
  },
},

// ================= FAQS =================
faqs: [
  {
    question: {
      type: String,
      default: "",
    },

    answer: {
      type: String,
      default: "",
    },
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


// ============================================================
// UNIQUE PUBLISHED SLUG
// ============================================================
// Only NON-DELETED + PUBLISHED properties must have a unique slug.
//
// Trash properties:
//   isDeleted: true
//   → DO NOT reserve the slug
//
// Draft properties:
//   isDeleted: false
//   status: "draft"
//   → DO NOT reserve the slug
//
// Published properties:
//   isDeleted: false
//   status: "published"
//   → MUST have a unique slug
// ============================================================

propertySchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      status: "published",
    },
  }
);


module.exports = mongoose.model("Property", propertySchema);