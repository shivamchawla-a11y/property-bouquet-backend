const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    property: {
      type: String,
      default: "",
      trim: true,
    },

    leadType: {
      type: String,
      enum: [
        "General",
        "Property Enquiry",
        "Private Consultation",
        "ROI Calculator",
      ],
      default: "General",
    },

    source: {
      type: String,
      enum: [
        "Website",
        "Facebook",
        "Google",
        "Referral",
        "Private Consultation",
        "ROI Calculator",
      ],
      default: "Website",
    },

    status: {
      type: String,
      enum: [
        "New",
        "Interested",
        "Not Interested",
        "Visit",
        "Closed",
      ],
      default: "New",
    },

    priority: {
      type: String,
      enum: ["Hot", "Warm", "Cold"],
      default: "Warm",
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /*
    ========================================================
    ROI CALCULATOR DETAILS
    ========================================================
    */

    roiDetails: {
      propertyType: {
        type: String,
        default: "",
      },

      location: {
        type: String,
        default: "",
      },

      propertyValue: {
        type: Number,
        default: 0,
      },

      carpetArea: {
        type: Number,
        default: 0,
      },

      purchaseDate: {
        type: String,
        default: "",
      },

      holdingPeriod: {
        type: Number,
        default: 0,
      },

      downPayment: {
        type: Number,
        default: 0,
      },

      downPaymentPercent: {
        type: Number,
        default: 0,
      },

      loanAmount: {
        type: Number,
        default: 0,
      },

      loanPercent: {
        type: Number,
        default: 0,
      },

      interestRate: {
        type: Number,
        default: 0,
      },

      loanTenure: {
        type: Number,
        default: 0,
      },

      monthlyRent: {
        type: Number,
        default: 0,
      },

      rentEscalation: {
        type: Number,
        default: 0,
      },

      maintenance: {
        type: Number,
        default: 0,
      },

      propertyTax: {
        type: Number,
        default: 0,
      },

      insurance: {
        type: Number,
        default: 0,
      },

      otherExpenses: {
        type: Number,
        default: 0,
      },

      /*
      Optional calculated results
      */

      totalInvestment: {
        type: Number,
        default: 0,
      },

      totalProfit: {
        type: Number,
        default: 0,
      },

      totalAppreciation: {
        type: Number,
        default: 0,
      },

      grossReturns: {
        type: Number,
        default: 0,
      },

      roi: {
        type: Number,
        default: 0,
      },
    },

    notes: [
      {
        text: String,
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lead", leadSchema);