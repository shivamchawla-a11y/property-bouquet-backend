// ======================================================
// CREATE SEO FRIENDLY SLUG
// ======================================================

const slugify = (text = "") => {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

// ======================================================
// LOCATION FOR URL
//
// Gurgaon
// -> Gurgaon
//
// Gurgaon > Sector 56
// -> Sector 56 Gurgaon
//
// Gurgaon > Golf Course Extension Road > Sector 53
// -> Sector 53 Golf Course Extension Road Gurgaon
// ======================================================

const formatLocationForSlug = (location = "") => {
  if (!location) return "";

  const parts = location
    .split(">")
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    return location.trim();
  }

  const parent = parts[0];
  const children = parts.slice(1).reverse();

  return [...children, parent].join(" ");
};

// ======================================================
// LOCATION FOR HUMAN READING
//
// Gurgaon
// -> Gurgaon
//
// Gurgaon > Sector 56
// -> Sector 56, Gurgaon
//
// Gurgaon > Golf Course Extension Road > Sector 53
// -> Sector 53, Golf Course Extension Road, Gurgaon
// ======================================================

const formatLocationForText = (location = "") => {
  if (!location) return "";

  const parts = location
    .split(">")
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    return location.trim();
  }

  const parent = parts[0];
  const children = parts.slice(1).reverse();

  return [...children, parent].join(", ");
};

// ======================================================
// APPLY TEMPLATE
// ======================================================

const applyTemplate = (
  template = "",
  values = {},
  options = {}
) => {
  const { slug = false } = options;

  const processedValues = {
    ...values,
  };

  if (processedValues.location) {
    processedValues.location = slug
      ? formatLocationForSlug(processedValues.location)
      : formatLocationForText(processedValues.location);
  }

  let result = template;

  Object.keys(processedValues).forEach((key) => {
    const value = processedValues[key] || "";

    result = result.replace(
      new RegExp(`\\{${key}\\}`, "g"),
      value
    );
  });

  // Remove unused placeholders
  result = result.replace(/{.*?}/g, "");

  // Clean spaces
  result = result
    .replace(/\s+/g, " ")
    .trim();

  if (slug) {
    return slugify(result);
  }

  return result;
};

module.exports = applyTemplate;