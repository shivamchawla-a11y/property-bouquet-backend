const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({

  // 🔥 BASIC INFO
  slug: { type: String, unique: true, required: true },

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
    title: { type: String, required: true },

    // 🔥 DEVELOPER RELATION
    developerRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Developer",
      default: null,
    },

    // 🔥 CUSTOM DEVELOPER
    developerName: {
      type: String,
      default: "",
    },

    startingPrice: Number,
    maxPrice: Number,
  },

  // ================= CATEGORY (🔥 NEW) =================
  categoryData: {

    // 🔥 CATEGORY RELATION
    categoryRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    // 🔥 STORE NAME FOR FAST ACCESS / SEO
    categoryName: {
      type: String,
      default: "",
    },
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
    description: String,
    aboutImageUrl: String,
    highlights: [String],
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

  // ================= LOCATION DATA (🔥 UPDATED) =================
  locationData: {

    // 🔥 LOCATION RELATION
    locationRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
    },

    // 🔥 STORE FULL LABEL (Gurgaon > Sector 65 > etc)
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

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }

}, { timestamps: true });

module.exports = mongoose.model("Property", propertySchema);