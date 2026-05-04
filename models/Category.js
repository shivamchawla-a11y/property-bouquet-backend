const mongoose = require("mongoose");
const slugify = require("slugify");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    slug: {
      type: String,
      unique: true,
    },

    // 🔥 NEW: PARENT SUPPORT
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    // 🔥 OPTIONAL: FOR QUICK ACCESS / SEO
    fullPath: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// 🔥 AUTO SLUG + FULL PATH
categorySchema.pre("save", async function (next) {
  if (this.name) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
    });
  }

  // 🔥 Build full path
  if (this.parent) {
    const parent = await mongoose.model("Category").findById(this.parent);
    this.fullPath = parent
      ? `${parent.fullPath} > ${this.name}`
      : this.name;
  } else {
    this.fullPath = this.name;
  }

  next();
});

module.exports = mongoose.model("Category", categorySchema);