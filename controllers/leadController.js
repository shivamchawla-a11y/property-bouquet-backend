const Lead = require("../models/Lead");

// ================= CREATE =================
exports.createLead = async (req, res) => {
  try {
    const { name, phone, property, source } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required",
      });
    }

    // ✅ Phone validation
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    // ✅ DUPLICATE CHECK (FIXED POSITION)
    const existing = await Lead.findOne({
      phone,
      property,
      createdAt: {
        $gte: new Date(Date.now() - 1000 * 60 * 10), // last 10 mins
      },
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Lead already submitted recently",
      });
    }

    // ✅ CREATE LEAD
    const lead = await Lead.create({
  name,
  phone,
  property,
  source: source || "Website",
  priority: "Warm", // default
});

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
    const { notes, ...rest } = req.body;

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    // ✅ NORMAL FIELD UPDATE
    Object.assign(lead, rest);

    // ✅ ADD NOTE (NOT OVERWRITE)
    if (notes) {
      lead.notes.push({
        text: notes,
        addedBy: req.user?._id || null,
      });
    }

    await lead.save();

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