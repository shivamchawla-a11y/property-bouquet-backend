const mongoose = require("mongoose");

const customSectionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () =>
        `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    },
    type: {
      type: String,
      default: "richText",
      enum: ["richText"],
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    eyebrow: {
      type: String,
      default: "",
      trim: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    subtitle: {
      type: String,
      default: "",
      trim: true,
    },
    content: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    imagePosition: {
      type: String,
      enum: ["left", "right"],
      default: "right",
    },
  },
  { _id: false }
);

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
    },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
    },

    image: {
      type: String,
      default: "",
    },

    // ==========================================================
    // PUBLIC LOCATION PAGE CONTENT
    // ==========================================================
    pageContent: {
      hero: {
        eyebrow: {
          type: String,
          default: "",
        },
        title: {
          type: String,
          default: "",
        },
        description: {
          type: String,
          default: "",
        },
        image: {
          type: String,
          default: "",
        },
        buttonText: {
          type: String,
          default: "",
        },
        buttonLink: {
          type: String,
          default: "",
        },
      },

      about: {
        enabled: {
          type: Boolean,
          default: true,
        },
        eyebrow: {
          type: String,
          default: "",
        },
        title: {
          type: String,
          default: "",
        },
        content: {
          type: String,
          default: "",
        },
        highlights: {
          type: [
            {
              title: {
                type: String,
                default: "",
              },
              description: {
                type: String,
                default: "",
              },
            },
          ],
          default: [],
        },
      },

      sections: {
        type: [customSectionSchema],
        default: [],
      },
    },
  },
  { timestamps: true }
);

locationSchema.index(
  { name: 1, parent: 1 },
  { unique: true }
);

module.exports = mongoose.model("Location", locationSchema);
