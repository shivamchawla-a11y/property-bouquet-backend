const Property = require("../models/Property");

// ==========================================
// SAVE DRAFT
// ==========================================
exports.saveDraft = async (req, res) => {
try {


const payload = req.body;

let property;

// ================= UPDATE EXISTING DRAFT =================
if (payload._id) {

  property = await Property.findByIdAndUpdate(
    payload._id,
    {
      ...payload,
      status: "draft",
      isDraft: true,
      lastSavedAt: new Date(),
      createdBy: req.user.id,
    },
    {
      new: true,
      runValidators: false,
    }
  );

} else {

  // ================= CREATE NEW DRAFT =================
  property = await Property.create({
    ...payload,
    status: "draft",
    isDraft: true,
    lastSavedAt: new Date(),
    createdBy: req.user.id,
  });

}

return res.status(200).json({
  success: true,
  property,
});


} catch (err) {


console.error("SAVE DRAFT ERROR:", err);

return res.status(500).json({
  success: false,
  message: err.message,
});

}
};

// ==========================================
// GET LAST DRAFT
// ==========================================
exports.getMyLastDraft = async (req, res) => {
try {


const property = await Property
  .findOne({
    createdBy: req.user.id,
    status: "draft",
  })
  .sort({
    updatedAt: -1,
  });

return res.status(200).json({
  success: true,
  property,
});


} catch (err) {


console.error("GET DRAFT ERROR:", err);

return res.status(500).json({
  success: false,
  message: err.message,
});

}
};

// ==========================================
// GET ALL DRAFTS
// ==========================================
exports.getMyDrafts = async (req, res) => {
try {

const drafts = await Property
  .find({
    createdBy: req.user.id,
    status: "draft",
  })
  .sort({
    updatedAt: -1,
  });

return res.status(200).json({
  success: true,
  drafts,
});


} catch (err) {


console.error(err);

return res.status(500).json({
  success: false,
  message: err.message,
});

}
};
