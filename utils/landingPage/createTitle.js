// ======================================================
// CREATE LANDING PAGE TITLE
// ======================================================

const createTitle = ({
  pageType,
  developer = "",
  category = "",
  location = "",
  city = "",
  bhk = "",
  status = "",
}) => {
  switch (pageType) {
    case "developer":
      return `${developer} Projects`;

    case "location":
      return `Properties in ${location}, ${city}`;

    case "category":
      return `${category} in ${city}`;

    case "developer_location":
      return `${developer} Projects in ${location}, ${city}`;

    case "developer_category":
      return `${developer} ${category} in ${city}`;

    case "location_category":
      return `${category} in ${location}, ${city}`;

    case "developer_location_category":
      return `${developer} ${category} in ${location}, ${city}`;

    case "location_bhk":
      return `${bhk} in ${location}, ${city}`;

    case "developer_bhk":
      return `${developer} ${bhk} in ${city}`;

    case "location_status":
      return `${status} Properties in ${location}, ${city}`;

    case "developer_status":
      return `${developer} ${status} Projects in ${city}`;

    default:
      return `${developer} ${category} in ${location}, ${city}`;
  }
};

module.exports = createTitle;