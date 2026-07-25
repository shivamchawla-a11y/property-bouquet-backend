const Property = require("../../models/Property");

// ======================================================
// EXTRACT PROPERTY DATA
// ======================================================

const extractPropertyData = async () => {
  // Fetch all published properties
  const properties = await Property.find({
    status: "published",
    isDeleted: false,
  })
    .populate("locationData.locationRef")
    .populate("categoryData.categoryRef")
    .populate("coreDetails.developerRef");

  const extracted = [];

  for (const property of properties) {
    const locationRef =
      property?.locationData?.locationRef;

    const developerRef =
      property?.coreDetails?.developerRef;

    const categoryRef =
      property?.categoryData?.categoryRef;

    extracted.push({
      propertyId: property._id,

      propertyName:
        property?.coreDetails?.title || "",

      slug: property.slug,

      developer: {
        id: developerRef?._id || null,
        name:
          developerRef?.name ||
          property?.coreDetails?.developerName ||
          "",
      },

      category: {
        id: categoryRef?._id || null,
        name:
          categoryRef?.name ||
          property?.categoryData?.categoryName ||
          "",
      },

      location: {
  id: locationRef?._id || null,
  name:
    property?.locationData?.locationName ||
    locationRef?.name ||
    "",
  document: locationRef || null,
},

      bhk: [
  ...new Set([
    ...(property?.gatedContent?.floorPlans || []).map(
      (plan) => plan.unitType
    ),
    ...(property?.unitConfigurations || []).map(
      (unit) => unit.unitType
    ),
  ].filter(Boolean)),
],

      amenities:
        property?.overview?.amenities?.map(
          (item) => item.heading
        ) || [],

      price: {
        min:
          property?.coreDetails?.startingPrice ||
          0,

        max:
          property?.coreDetails?.maxPrice ||
          property?.coreDetails?.startingPrice ||
          0,
      },

      status:
        property?.keyMetrics?.status || "",

      property,
    });
  }

  return extracted;
};

module.exports = extractPropertyData;