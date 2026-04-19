const mongoose = require("mongoose");

const builderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
}, { timestamps: true });

module.exports = mongoose.model("Builder", builderSchema);