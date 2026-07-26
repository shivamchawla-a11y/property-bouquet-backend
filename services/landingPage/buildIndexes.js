// ======================================================
// BUILD INDEXES
// ======================================================

const buildIndexes = (properties = []) => {
  const indexes = {
    developers: new Map(),
    locations: new Map(),
    categories: new Map(),

    propertiesByDeveloper: new Map(),
    propertiesByLocation: new Map(),
    propertiesByCategory: new Map(),
  };

  for (const property of properties) {
    // ==========================================
    // DEVELOPER
    // ==========================================

    if (property.developer?.id) {
      const id = String(property.developer.id);

      if (!indexes.developers.has(id)) {
        indexes.developers.set(id, property.developer);
      }

      if (!indexes.propertiesByDeveloper.has(id)) {
        indexes.propertiesByDeveloper.set(id, []);
      }

      indexes.propertiesByDeveloper
        .get(id)
        .push(property);
    }

    // ==========================================
    // LOCATION
    // ==========================================

    if (property.location?.id) {
      const id = String(property.location.id);

      if (!indexes.locations.has(id)) {
        indexes.locations.set(id, property.location);
      }

      if (!indexes.propertiesByLocation.has(id)) {
        indexes.propertiesByLocation.set(id, []);
      }

      indexes.propertiesByLocation
        .get(id)
        .push(property);
    }

    // ==========================================
    // CATEGORY
    // ==========================================

    if (property.category?.id) {
      const id = String(property.category.id);

      if (!indexes.categories.has(id)) {
        indexes.categories.set(id, property.category);
      }

      if (!indexes.propertiesByCategory.has(id)) {
        indexes.propertiesByCategory.set(id, []);
      }

      indexes.propertiesByCategory
        .get(id)
        .push(property);
    }
  }

  return indexes;
};


module.exports = buildIndexes;