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

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    fullPath: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// ✅ MODERN ASYNC HOOK (NO NEXT)
categorySchema.pre("save", async function () {
  // 🔥 Only run if name or parent changed
  if (!this.isModified("name") && !this.isModified("parent")) {
    return;
  }

  // 🔥 SLUG
  if (this.name) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
    });
  }

  // 🔥 FULL PATH BUILD
  if (this.parent) {
    const parent = await mongoose
      .model("Category")
      .findById(this.parent)
      .lean();

    this.fullPath = parent
      ? `${parent.fullPath} > ${this.name}`
      : this.name;
  } else {
    this.fullPath = this.name;
  }
});

module.exports = mongoose.model("Category", categorySchema);