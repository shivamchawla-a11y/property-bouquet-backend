require("dotenv").config();

console.log(process.env.MONGO_URI ? "MONGO_URI Loaded ✅" : "MONGO_URI Missing ❌");

const mongoose = require("mongoose");
const Property = require("./models/Property");

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ Connected");

    const properties = await Property.find({});

    let updated = 0;

    for (const property of properties) {
      if (!Array.isArray(property.propertyTag)) {
        property.propertyTag = property.propertyTag
          ? [property.propertyTag]
          : ["Normal"];

        await property.save();
        updated++;
      }
    }

    console.log(`✅ Updated ${updated} properties`);

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrate();