require("dotenv").config();
const mongoose = require("mongoose");
const Developer = require("./models/Developer");

mongoose.connect(process.env.MONGO_URI);

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function fix() {
  const devs = await Developer.find();

  for (let d of devs) {
    if (!d.slug) {
      d.slug = slugify(d.name);

      const exists = await Developer.findOne({ slug: d.slug });

      if (exists) {
        d.slug = `${d.slug}-${d._id.toString().slice(-4)}`;
      }

      await d.save();
      console.log("Fixed:", d.name, "=>", d.slug);
    }
  }

  console.log("DONE");
  process.exit();
}

fix();