const Lead = require("../models/Lead");

// ================= CREATE =================
exports.createLead = async (req, res) => {
  try {
    const lead = await Lead.create(req.body);

    res.status(201).json({
      success: true,
      data: lead,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to create lead",
    });
  }
};

// ================= GET =================
exports.getLeads = async (req, res) => {
  try {
    const leads = await Lead.find()
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: leads,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch leads",
    });
  }
};

// ================= UPDATE =================
exports.updateLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    res.json({
      success: true,
      data: lead,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Update failed",
    });
  }
};

// ================= DELETE =================
exports.deleteLead = async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Lead deleted",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};