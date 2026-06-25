const News = require("../models/News");

// ================= GET ALL NEWS =================
exports.getAllNews = async (req, res) => {
  try {
    const {
      status,
      category,
      featured,
      search,
      trash,
    } = req.query;

    const query = {};

    // ================= TRASH FILTER =================
    if (trash === "true") {
      query.isDeleted = true;
    } else {
      query.isDeleted = false;
    }

    // ================= STATUS =================
    if (status) {
      query.status = status;
    }

    // ================= CATEGORY =================
    if (category) {
      query.category = category;
    }

    // ================= FEATURED =================
    if (featured !== undefined) {
      query.featured = featured === "true";
    }

    // ================= SEARCH =================
    if (search) {
      query.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          shortDescription: {
            $regex: search,
            $options: "i",
          },
        },
        {
          slug: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const news = await News.find(query).sort({
      publishDate: -1,
    });

    res.json({
      success: true,
      count: news.length,
      data: news,
    });
  } catch (err) {
    console.error("GET NEWS ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};

// ================= GET SINGLE =================
exports.getNewsById = async (
req,
res
) => {
try {
const news = await News.findById(
req.params.id
);


if (!news) {
  return res.status(404).json({
    success: false,
    message:
      "News not found ❌",
  });
}

res.json({
  success: true,
  data: news,
});


} catch (err) {
console.error(err);


res.status(500).json({
  success: false,
  message: err.message,
});


}
};

// ================= GET BY SLUG =================
exports.getNewsBySlug = async (
req,
res
) => {
try {
const news = await News.findOne({
slug: req.params.slug,
status: "published",
isDeleted: false,
});


if (!news) {
  return res.status(404).json({
    success: false,
    message:
      "News not found ❌",
  });
}

await News.findByIdAndUpdate(
  news._id,
  {
    $inc: {
      views: 1,
    },
  }
);

res.json({
  success: true,
  data: news,
});


} catch (err) {
console.error(err);


res.status(500).json({
  success: false,
  message: err.message,
});


}
};

// ================= CREATE =================
exports.createNews = async (
req,
res
) => {
try {
const news = await News.create(
req.body
);


res.status(201).json({
  success: true,
  data: news,
});


} catch (err) {
console.error(err);


if (err.code === 11000) {
  return res.status(400).json({
    success: false,
    message:
      "Slug already exists ❌",
  });
}

res.status(500).json({
  success: false,
  message: err.message,
});


}
};

// ================= UPDATE =================
exports.updateNews = async (
req,
res
) => {
try {
const news =
await News.findByIdAndUpdate(
req.params.id,
req.body,
{
new: true,
runValidators: true,
}
);


if (!news) {
  return res.status(404).json({
    success: false,
    message:
      "News not found ❌",
  });
}

res.json({
  success: true,
  data: news,
});


} catch (err) {
console.error(err);


res.status(500).json({
  success: false,
  message: err.message,
});


}
};

// ================= TRASH =================
exports.trashNews = async (
req,
res
) => {
try {
const news =
await News.findByIdAndUpdate(
req.params.id,
{
isDeleted: true,
},
{
new: true,
}
);


if (!news) {
  return res.status(404).json({
    success: false,
    message:
      "News not found ❌",
  });
}

res.json({
  success: true,
  message:
    "Moved to trash ✅",
});


} catch (err) {
console.error(err);


res.status(500).json({
  success: false,
  message: err.message,
});


}
};

// ================= RESTORE =================
exports.restoreNews = async (
req,
res
) => {
try {
const news =
await News.findByIdAndUpdate(
req.params.id,
{
isDeleted: false,
},
{
new: true,
}
);


if (!news) {
  return res.status(404).json({
    success: false,
    message:
      "News not found ❌",
  });
}

res.json({
  success: true,
  message:
    "Restored successfully ✅",
});


} catch (err) {
console.error(err);


res.status(500).json({
  success: false,
  message: err.message,
});


}
};

// ================= TRASH LIST =================
exports.getTrashNews =
async (req, res) => {
try {
const news =
await News.find({
isDeleted: true,
}).sort({
updatedAt: -1,
});


  res.json({
    success: true,
    count: news.length,
    data: news,
  });
} catch (err) {
  console.error(err);

  res.status(500).json({
    success: false,
    message: err.message,
  });
}


};

// ================= DELETE FOREVER =================
exports.deleteNews =
async (req, res) => {
try {
const news =
await News.findByIdAndDelete(
req.params.id
);


  if (!news) {
    return res.status(404).json({
      success: false,
      message:
        "News not found ❌",
    });
  }

  res.json({
    success: true,
    message:
      "Deleted permanently ✅",
  });
} catch (err) {
  console.error(err);

  res.status(500).json({
    success: false,
    message: err.message,
  });
}


};
