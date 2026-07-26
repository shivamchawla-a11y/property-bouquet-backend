const crypto = require("crypto");

const normalize = (value) =>
  String(value).trim().toLowerCase();

const createFingerprint = (pageType, values = {}) => {
  const parts = [`type:${pageType}`];

  Object.keys(values)
    .sort()
    .forEach((key) => {
      const value = values[key];

      if (value == null) return;

      if (typeof value === "object") {
        if (value.id) {
          parts.push(`${key}:${value.id}`);
        } else if (value.name) {
          parts.push(`${key}:${normalize(value.name)}`);
        }
      } else if (Array.isArray(value)) {
        parts.push(
          `${key}:${value.map(normalize).sort().join(",")}`
        );
      } else {
        parts.push(`${key}:${normalize(value)}`);
      }
    });
    
  return crypto
    .createHash("sha256")
    .update(parts.join("|"))
    .digest("hex");
};

module.exports = createFingerprint;