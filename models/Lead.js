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
    },

    property: {
      type: String,
      default: "",
    },

    source: {
      type: String,
      enum: ["Website", "Facebook", "Google", "Referral"],
      default: "Website",
    },

    // 🔥 UPDATED STATUS (REAL ESTATE READY)
    status: {
  type: String,
  enum: [
    "New",
    "Interested",
    "Not Interested",
    "Visit",
    "Closed"
  ],
  default: "New",
},

    // 🔥 PRIORITY
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

    // 🔥 NOTES HISTORY (IMPORTANT)
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