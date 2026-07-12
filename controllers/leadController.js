const Lead = require("../models/Lead");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // ✅ DUPLICATE CHECK
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
      priority: "Warm",
    });

    // ================= EMAIL NOTIFICATION =================
    try {
      await resend.emails.send({
  from: "Property Bouquet <no-reply@propertybouquet.com>",
  to: "kushank.pal@amethystlandbase.com",
  subject: `🏡 New Property Lead • ${property || "General Enquiry"}`,
  html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
</head>

<body style="margin:0;background:#f5f5f5;font-family:Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">

<table
width="650"
cellpadding="0"
cellspacing="0"
style="
background:#ffffff;
margin-top:30px;
border-radius:18px;
overflow:hidden;
box-shadow:0 10px 35px rgba(0,0,0,.08);
">

<!-- HEADER -->

<tr>
<td
style="
background:#111;
padding:35px;
text-align:center;
"
>

<h1
style="
margin:0;
color:#C89B4F;
font-size:30px;
font-weight:700;
"
>
PROPERTY BOUQUET
</h1>

<p
style="
margin-top:10px;
color:#dddddd;
font-size:15px;
"
>
Luxury Real Estate Advisory
</p>

</td>
</tr>

<!-- TITLE -->

<tr>

<td style="padding:35px;">

<h2
style="
margin-top:0;
color:#111;
font-size:26px;
"
>
🏡 New Lead Received
</h2>

<p
style="
color:#666;
line-height:28px;
font-size:15px;
"
>
A new enquiry has been submitted from the website.
</p>

<table
width="100%"
cellpadding="12"
style="
margin-top:25px;
border-collapse:collapse;
"
>

<tr style="background:#fafafa;">
<td width="180"><strong>Name</strong></td>
<td>${name}</td>
</tr>

<tr>
<td><strong>Phone</strong></td>
<td>${phone}</td>
</tr>

<tr style="background:#fafafa;">
<td><strong>Property</strong></td>
<td>${property || "General Enquiry"}</td>
</tr>

<tr>
<td><strong>Source</strong></td>
<td>${source || "Website"}</td>
</tr>

<tr style="background:#fafafa;">
<td><strong>Priority</strong></td>
<td>Warm</td>
</tr>

<tr>
<td><strong>Status</strong></td>
<td>New</td>
</tr>

<tr style="background:#fafafa;">
<td><strong>Submitted</strong></td>
<td>${new Date().toLocaleString("en-IN")}</td>
</tr>

</table>

<div
style="
margin-top:35px;
text-align:center;
"
>

<a
href="tel:${phone}"
style="
display:inline-block;
padding:14px 26px;
background:#C89B4F;
color:#111;
text-decoration:none;
font-weight:bold;
border-radius:8px;
margin-right:10px;
"
>
📞 Call Customer
</a>

<a
href="https://wa.me/91${phone}"
style="
display:inline-block;
padding:14px 26px;
background:#25D366;
color:#fff;
text-decoration:none;
font-weight:bold;
border-radius:8px;
"
>
💬 WhatsApp
</a>

</div>

</td>

</tr>

<tr>

<td
style="
background:#111;
padding:25px;
text-align:center;
color:#aaa;
font-size:13px;
"
>

Property Bouquet CRM Notification

<br><br>

Luxury Properties • Gurgaon • Delhi NCR

</td>

</tr>

</table>

</td>

</tr>
</table>

</body>

</html>
`,
});
    } catch (emailErr) {
      console.error("Email sending failed:", emailErr.message);
    }

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

    // ================= AUTO PRIORITY =================

// If status changes, update priority automatically
if (rest.status) {
  switch (rest.status) {
    case "Interested":
      rest.priority = "Hot";
      break;

    case "Visit":
      rest.priority = "Hot";
      break;

    case "Not Interested":
      rest.priority = "Cold";
      break;

    case "Closed":
      rest.priority = "Hot";
      break;

    case "New":
    default:
      rest.priority = "Warm";
      break;
  }
}

// ✅ UPDATE NORMAL FIELDS
Object.assign(lead, rest);

    // ✅ NOTES LOGIC
    if (notes !== undefined) {
      if (notes.trim() === "") {
        lead.notes = [];
      } else {
        lead.notes.push({
          text: notes,
          addedBy: req.user?._id || null,
        });
      }
    }

    await lead.save();

    res.json({
      success: true,
      data: lead,
    });
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
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