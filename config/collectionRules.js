// ======================================================
// COLLECTION ENGINE RULES
// ======================================================

module.exports = [

  // ======================================================
  // DEVELOPER
  // ======================================================

  {
    pageType: "developer",

    enabled: true,

    minimumProperties: 1,

    values: [
      "developer"
    ],

    templates: {
      slug: "{developer}-projects",

      title: "{developer} Projects",

      h1: "{developer} Projects",

      metaTitle:
        "{developer} Projects | Property Bouquet",

      metaDescription:
        "Explore all projects by {developer} including prices, floor plans, amenities and brochure."
    }
  },

  // ======================================================
  // LOCATION
  // ======================================================

  {
    pageType: "location",

    enabled: true,

    minimumProperties: 1,

    values: [
      "location"
    ],

    templates: {
      slug:
        "properties-in-{location}",

      title:
        "Properties in {location}",

      h1:
        "Properties in {location}",

      metaTitle:
        "Properties in {location} | Property Bouquet",

      metaDescription:
        "Discover luxury properties in {location} with price, floor plans and latest availability."
    }
  },

  // ======================================================
  // CATEGORY
  // ======================================================

  {
    pageType: "category",

    enabled: true,

    minimumProperties: 2,

    values: [
      "category"
    ],

    templates: {
      slug:
        "{category}",

      title:
        "{category}",

      h1:
        "{category}",

      metaTitle:
        "{category} | Property Bouquet",

      metaDescription:
        "Browse premium {category} with verified listings."
    }
  },

  // ======================================================
  // DEVELOPER + LOCATION
  // ======================================================

  {
    pageType:
      "developer_location",

    enabled: true,

    minimumProperties: 1,

    values: [
      "developer",
      "location"
    ],

    templates: {
      slug:
        "{developer}-projects-in-{location}",

      title:
        "{developer} Projects in {location}",

      h1:
        "{developer} Projects in {location}",

      metaTitle:
        "{developer} Projects in {location} | Property Bouquet",

      metaDescription:
        "Explore {developer} projects in {location} including price, floor plans and brochure."
    }
  },

  // ======================================================
  // LOCATION + CATEGORY
  // ======================================================

  {
    pageType:
      "location_category",

    enabled: true,

    minimumProperties: 2,

    values: [
      "location",
      "category"
    ],

    templates: {
      slug:
        "{category}-in-{location}",

      title:
        "{category} in {location}",

      h1:
        "{category} in {location}",

      metaTitle:
        "{category} in {location} | Property Bouquet",

      metaDescription:
        "Find premium {category} in {location} with latest prices and availability."
    }
  },

  // ======================================================
  // DEVELOPER + CATEGORY
  // ======================================================

  {
    pageType:
      "developer_category",

    enabled: true,

    minimumProperties: 2,

    values: [
      "developer",
      "category"
    ],

    templates: {
      slug:
        "{developer}-{category}",

      title:
        "{developer} {category}",

      h1:
        "{developer} {category}",

      metaTitle:
        "{developer} {category} | Property Bouquet",

      metaDescription:
        "Browse all {category} by {developer}."
    }
  },

  // ======================================================
  // DEVELOPER + LOCATION + CATEGORY
  // ======================================================

  {
    pageType:
      "developer_location_category",

    enabled: true,

    minimumProperties: 2,

    values: [
      "developer",
      "location",
      "category"
    ],

    templates: {
      slug:
        "{developer}-{category}-in-{location}",

      title:
        "{developer} {category} in {location}",

      h1:
        "{developer} {category} in {location}",

      metaTitle:
        "{developer} {category} in {location} | Property Bouquet",

      metaDescription:
        "Explore {developer} {category} in {location} including price, floor plans and brochure."
    }
  }

];