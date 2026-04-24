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
    developerRef: String,

    startingPrice: Number,
    maxPrice: Number,
  },

  // ================= KEY METRICS =================
  keyMetrics: {
    landArea: String,         // e.g. 12 Acres
    possession: String,       // e.g. Dec 2028
    status: String,           // New Launch / Ready
    totalUnits: Number,
    totalTowers: Number,
    floors: String,
    reraNumber: String,
  },

  // ================= OVERVIEW =================
  overview: {
    description: String,
    aboutImageUrl: String,

    highlights: [String],   // 🔥 moved inside overview
  },

  // ================= UNIT CONFIGURATIONS =================
  unitConfigurations: [
    {
      unitType: String,       // 3 BHK
      area: String,           // 1200 sq ft
      price: String,          // ₹ 5 Cr
      paymentPlan: String,    // 30:70 / CLP
    }
  ],

  // ================= MEDIA =================
  media: {
    heroImageUrl: String,
    gallery: [String],

    walkthroughUrl: String,   // YouTube / video link
  },

  // ================= LOCATION DATA =================
  locationData: {
    address: String,

    mapEmbedUrl: String,   // iframe URL

    landmarks: [
      {
        name: String,
        distance: String,  // e.g. "5 mins"
      }
    ]
  },

  // ================= GATED CONTENT =================
  gatedContent: {
    brochurePdfUrl: String,

    floorPlans: [
      {
        title: String,
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