const mongoose = require("mongoose");

const developerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    logo: {
      type: String,
      default: "/placeholder.png",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Developer", developerSchema);