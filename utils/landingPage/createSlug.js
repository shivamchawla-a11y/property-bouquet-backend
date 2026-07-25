const slugify = (text = "") => {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

// ----------------------------------------------------
// Creates SEO Slug
// ----------------------------------------------------

const createSlug = ({
  pageType,
  developer = "",
  category = "",
  location = "",
  city = "",
  bhk = "",
  status = "",
}) => {
  let slug = "";

  switch (pageType) {
    case "developer":
      slug = `${developer}-projects`;
      break;

    case "location":
      slug = `properties-in-${location}-${city}`;
      break;

    case "category":
      slug = `${category}-${city}`;
      break;

    case "developer_location":
      slug = `${developer}-projects-in-${location}-${city}`;
      break;

    case "developer_category":
      slug = `${developer}-${category}-${city}`;
      break;

    case "location_category":
      slug = `${category}-in-${location}-${city}`;
      break;

    case "developer_location_category":
      slug = `${developer}-${category}-in-${location}-${city}`;
      break;

    case "location_bhk":
      slug = `${bhk}-in-${location}-${city}`;
      break;

    case "developer_bhk":
      slug = `${developer}-${bhk}-${city}`;
      break;

    case "location_status":
      slug = `${status}-properties-in-${location}-${city}`;
      break;

    case "developer_status":
      slug = `${developer}-${status}-projects-${city}`;
      break;

    default:
      slug = `${developer}-${category}-${location}-${city}`;
  }

  return slugify(slug);
};

module.exports = createSlug;