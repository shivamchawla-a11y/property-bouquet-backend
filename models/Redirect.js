const mongoose = require("mongoose");

const redirectSchema = new mongoose.Schema(
  {
    from: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    to: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: Number,
      enum: [301, 302],
      default: 301,
    },

    active: {
      type: Boolean,
      default: true,
    },

    hits: {
      type: Number,
      default: 0,
    },

    lastUsed: {
      type: Date,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Redirect", redirectSchema);