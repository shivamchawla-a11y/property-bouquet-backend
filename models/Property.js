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

  // 🔥 PROPER RELATION
  developerRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Developer",
    default: null,
  },

  // 🔥 CUSTOM INPUT SUPPORT
  developerName: {
    type: String,
    default: "",
  },

  startingPrice: Number,
  maxPrice: Number,
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

  // ================= LOCATION DATA =================
  locationData: {
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

    // ✅ UPDATED FLOOR PLANS (IMPORTANT)
    floorPlans: [
      {
        unitType: String,     // 3 BHK
        area: String,         // 3000 sq ft
        price: String,        // ₹ 5 Cr
        paymentPlan: String,  // 30:70
        image: String,        // floor plan image
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