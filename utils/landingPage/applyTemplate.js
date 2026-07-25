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
// APPLY TEMPLATE
// ======================================================

const applyTemplate = (
  template = "",
  values = {},
  options = {}
) => {
  const {
    slug = false,
  } = options;

  let result = template;

  Object.keys(values).forEach((key) => {
    const value =
      values[key] || "";

    result = result.replace(
      new RegExp(`\\{${key}\\}`, "g"),
      value
    );
  });

  // Remove unused placeholders
  result = result.replace(
    /\{.*?\}/g,
    ""
  );

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