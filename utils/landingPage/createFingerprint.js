const crypto = require("crypto");

/**
 * Creates a unique fingerprint for a landing page.
 *
 * Example:
 *
 * {
 *   developers: ["DLF"],
 *   locations: ["Sector 56"],
 *   categories: ["Apartment"]
 * }
 *
 * =>
 *
 * categories:apartment|
 * developers:dlf|
 * locations:sector-56
 */

const normalizeArray = (arr = []) => {
  return [...arr]
    .map((item) =>
      String(item)
        .trim()
        .toLowerCase()
    )
    .sort();
};

const createFingerprint = (filters = {}) => {
  const parts = [];

  Object.keys(filters)
    .sort()
    .forEach((key) => {
      const value = filters[key];

      // Ignore empty values
      if (
        value === undefined ||
        value === null
      ) {
        return;
      }

      if (Array.isArray(value)) {
        if (!value.length) return;

        parts.push(
          `${key}:${normalizeArray(value).join(",")}`
        );
      } else if (
        typeof value === "object"
      ) {
        // Budget etc.
        parts.push(
          `${key}:${JSON.stringify(value)}`
        );
      } else {
        parts.push(
          `${key}:${String(value)
            .trim()
            .toLowerCase()}`
        );
      }
    });

  const raw = parts.join("|");

  return crypto
    .createHash("sha256")
    .update(raw)
    .digest("hex");
};

module.exports = createFingerprint;