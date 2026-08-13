const Lead = require("../models/Lead");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

/* =========================================================
   CREATE LEAD
========================================================= */

exports.createLead = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      property,
      source,
      leadType,
      roiDetails,
    } = req.body;

    /* =======================================================
       BASIC VALIDATION
    ======================================================= */

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    /* =======================================================
       PHONE VALIDATION
    ======================================================= */

    const cleanPhone = phone.trim();

    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    /* =======================================================
       EMAIL VALIDATION
       
       Email is optional because your existing leads
       may not provide one.
    ======================================================= */

    const cleanEmail = email
      ? email.trim().toLowerCase()
      : "";

    if (cleanEmail) {
      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email address",
        });
      }
    }

    /* =======================================================
       NORMALIZE VALUES
    ======================================================= */

    const cleanName = name.trim();

    const cleanProperty =
      property?.trim() || "";

    const cleanSource =
      source || "Website";

    const cleanLeadType =
      leadType || "General";

    const cleanRoiDetails =
      roiDetails &&
      typeof roiDetails === "object"
        ? roiDetails
        : {};

    /* =======================================================
       DUPLICATE CHECK
       
       Prevents the same person from submitting the
       exact same type of enquiry repeatedly within 10 min.
    ======================================================= */

    const existing = await Lead.findOne({
      phone: cleanPhone,

      property: cleanProperty,

      leadType: cleanLeadType,

      createdAt: {
        $gte: new Date(
          Date.now() -
            1000 * 60 * 10
        ),
      },
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        message:
          "Lead already submitted recently",
      });
    }

    /* =======================================================
       CREATE LEAD
    ======================================================= */

    const lead = await Lead.create({
      name: cleanName,

      phone: cleanPhone,

      email: cleanEmail,

      property: cleanProperty,

      source: cleanSource,

      leadType: cleanLeadType,

      priority: "Warm",

      roiDetails:
        cleanRoiDetails,
    });

    /* =======================================================
       ROI DETAILS FOR EMAIL
    ======================================================= */

    const roi =
      cleanRoiDetails || {};

    const formatCurrency = (value) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return "—";
      }

      const number = Number(value);

      if (!Number.isFinite(number)) {
        return String(value);
      }

      return `₹${number.toLocaleString(
        "en-IN"
      )}`;
    };

    const formatPercent = (value) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return "—";
      }

      return `${value}%`;
    };

    /* =======================================================
       EMAIL NOTIFICATION
    ======================================================= */

    try {
      await resend.emails.send({
        from:
          "Property Bouquet <info@propertybouquet.com>",

        to:
          "kushank.pal@amethystlandbase.com",

        subject:
          cleanLeadType ===
          "ROI Calculator"
            ? `📊 New ROI Calculator Lead • ${cleanName}`
            : `🏡 New Property Lead • ${
                cleanProperty ||
                "General Enquiry"
              }`,

        html: `
<!DOCTYPE html>
<html>

<head>
<meta charset="UTF-8" />

<meta
name="viewport"
content="width=device-width,initial-scale=1"
/>

<title>
Property Bouquet Lead
</title>

</head>

<body
style="
margin:0;
padding:0;
background:#f5f5f5;
font-family:Arial,Helvetica,sans-serif;
"
>

<table
width="100%"
cellpadding="0"
cellspacing="0"
border="0"
>

<tr>

<td
align="center"
style="padding:30px 15px;"
>

<table
width="650"
cellpadding="0"
cellspacing="0"
border="0"
style="
max-width:650px;
width:100%;
background:#ffffff;
border-radius:18px;
overflow:hidden;
box-shadow:0 10px 35px rgba(0,0,0,.08);
"
>

<!-- =====================================================
     HEADER
===================================================== -->

<tr>

<td
style="
background:#111111;
padding:35px;
text-align:center;
"
>

<div
style="
color:#C89B4F;
font-size:28px;
font-weight:700;
letter-spacing:1px;
"
>
PROPERTY BOUQUET
</div>

<div
style="
margin-top:8px;
color:#dddddd;
font-size:14px;
"
>
Luxury Real Estate Advisory
</div>

</td>

</tr>


<!-- =====================================================
     CONTENT
===================================================== -->

<tr>

<td
style="
padding:35px;
"
>

<h2
style="
margin:0;
color:#111111;
font-size:25px;
"
>

${
  cleanLeadType ===
  "ROI Calculator"
    ? "📊 New ROI Calculator Lead"
    : "🏡 New Lead Received"
}

</h2>

<p
style="
margin:12px 0 0;
color:#666666;
font-size:14px;
line-height:24px;
"
>

${
  cleanLeadType ===
  "ROI Calculator"
    ? "A visitor has submitted their details after using the Property Investment ROI Calculator."
    : "A new enquiry has been submitted from the Property Bouquet website."
}

</p>


<!-- =====================================================
     LEAD INFORMATION
===================================================== -->

<h3
style="
margin:30px 0 12px;
font-size:17px;
color:#111111;
"
>
Lead Information
</h3>

<table
width="100%"
cellpadding="12"
cellspacing="0"
style="
border-collapse:collapse;
font-size:14px;
"
>

<tr
style="background:#fafafa;"
>
<td
width="180"
style="color:#555;"
>
<strong>Name</strong>
</td>

<td
style="color:#111;"
>
${cleanName}
</td>

</tr>


<tr>

<td style="color:#555;">
<strong>Phone</strong>
</td>

<td style="color:#111;">
${cleanPhone}
</td>

</tr>


<tr
style="background:#fafafa;"
>

<td style="color:#555;">
<strong>Email</strong>
</td>

<td style="color:#111;">
${cleanEmail || "Not provided"}
</td>

</tr>


<tr>

<td style="color:#555;">
<strong>Lead Type</strong>
</td>

<td style="color:#111;">
${cleanLeadType}
</td>

</tr>


<tr
style="background:#fafafa;"
>

<td style="color:#555;">
<strong>Property</strong>
</td>

<td style="color:#111;">
${
  cleanProperty ||
  "General Enquiry"
}
</td>

</tr>


<tr>

<td style="color:#555;">
<strong>Source</strong>
</td>

<td style="color:#111;">
${cleanSource}
</td>

</tr>


<tr
style="background:#fafafa;"
>

<td style="color:#555;">
<strong>Priority</strong>
</td>

<td style="color:#111;">
Warm
</td>

</tr>


<tr>

<td style="color:#555;">
<strong>Status</strong>
</td>

<td style="color:#111;">
New
</td>

</tr>


<tr
style="background:#fafafa;"
>

<td style="color:#555;">
<strong>Submitted</strong>
</td>

<td style="color:#111;">
${new Date().toLocaleString(
  "en-IN"
)}
</td>

</tr>

</table>


<!-- =====================================================
     ROI INFORMATION
===================================================== -->

${
  cleanLeadType ===
  "ROI Calculator"
    ? `

<h3
style="
margin:32px 0 12px;
font-size:17px;
color:#111111;
"
>
Investment Analysis
</h3>

<table
width="100%"
cellpadding="12"
cellspacing="0"
style="
border-collapse:collapse;
font-size:14px;
"
>

<tr style="background:#fafafa;">
<td style="color:#555;">
<strong>Property Value</strong>
</td>

<td style="color:#111;">
${formatCurrency(
  roi.propertyValue
)}
</td>
</tr>


<tr>
<td style="color:#555;">
<strong>Down Payment</strong>
</td>

<td style="color:#111;">
${formatCurrency(
  roi.downPayment
)}
${
  roi.downPaymentPercent !==
  undefined
    ? ` (${formatPercent(
        roi.downPaymentPercent
      )})`
    : ""
}
</td>
</tr>


<tr style="background:#fafafa;">
<td style="color:#555;">
<strong>Loan Amount</strong>
</td>

<td style="color:#111;">
${formatCurrency(
  roi.loanAmount
)}
${
  roi.loanPercent !==
  undefined
    ? ` (${formatPercent(
        roi.loanPercent
      )})`
    : ""
}
</td>
</tr>


<tr>
<td style="color:#555;">
<strong>Interest Rate</strong>
</td>

<td style="color:#111;">
${formatPercent(
  roi.interestRate
)}
</td>
</tr>


<tr style="background:#fafafa;">
<td style="color:#555;">
<strong>Loan Tenure</strong>
</td>

<td style="color:#111;">
${
  roi.loanTenure
    ? `${roi.loanTenure} Years`
    : "—"
}
</td>
</tr>


<tr>
<td style="color:#555;">
<strong>Monthly Rent</strong>
</td>

<td style="color:#111;">
${formatCurrency(
  roi.monthlyRent
)}
</td>
</tr>


<tr style="background:#fafafa;">
<td style="color:#555;">
<strong>Rent Escalation</strong>
</td>

<td style="color:#111;">
${formatPercent(
  roi.rentEscalation
)}
</td>
</tr>


<tr>
<td style="color:#555;">
<strong>Holding Period</strong>
</td>

<td style="color:#111;">
${
  roi.holdingPeriod
    ? `${roi.holdingPeriod} Years`
    : "—"
}
</td>
</tr>


<tr style="background:#fafafa;">
<td style="color:#555;">
<strong>Annual Appreciation</strong>
</td>

</td>
</tr>

</table>


<!-- =====================================================
     ROI RESULTS
===================================================== -->

<h3
style="
margin:32px 0 12px;
font-size:17px;
color:#111111;
"
>
Estimated Returns
</h3>

<table
width="100%"
cellpadding="12"
cellspacing="0"
style="
border-collapse:collapse;
font-size:14px;
"
>

<tr style="background:#f8f4ea;">
<td style="color:#555;">
<strong>Total Appreciation</strong>
</td>

<td
style="
color:#8d6a24;
font-weight:bold;
"
>
${formatCurrency(
  roi.totalAppreciation
)}
</td>
</tr>


<tr>
<td style="color:#555;">
<strong>Gross Returns</strong>
</td>

<td style="color:#111;font-weight:bold;">
${formatCurrency(
  roi.grossReturns
)}
</td>
</tr>


<tr style="background:#f8f4ea;">
<td style="color:#555;">
<strong>Total Profit</strong>
</td>

<td
style="
color:#003d2e;
font-weight:bold;
font-size:16px;
"
>
${formatCurrency(
  roi.totalProfit
)}
</td>
</tr>


<tr>
<td style="color:#555;">
<strong>ROI</strong>
</td>

<td
style="
color:#003d2e;
font-weight:bold;
"
>
${formatPercent(
  roi.roi
)}
</td>
</tr>

</table>
`
    : ""
}


<!-- =====================================================
     ACTION BUTTONS
===================================================== -->

<div
style="
margin-top:35px;
text-align:center;
"
>

<a
href="tel:${cleanPhone}"
style="
display:inline-block;
padding:14px 24px;
background:#C89B4F;
color:#111111;
text-decoration:none;
font-weight:bold;
border-radius:8px;
margin-right:8px;
"
>
📞 Call Customer
</a>

<a
href="https://wa.me/91${cleanPhone}"
style="
display:inline-block;
padding:14px 24px;
background:#25D366;
color:#ffffff;
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


<!-- =====================================================
     FOOTER
===================================================== -->

<tr>

<td
style="
background:#111111;
padding:25px;
text-align:center;
color:#aaaaaa;
font-size:13px;
"
>

Property Bouquet CRM Notification

<br />
<br />

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
      console.error(
        "Email sending failed:",
        emailErr.message
      );
    }

    /* =======================================================
       RESPONSE
    ======================================================= */

    return res.status(201).json({
      success: true,
      data: lead,
    });
  } catch (err) {
    console.error(
      "CREATE LEAD ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create lead",
    });
  }
};


/* =========================================================
   GET LEADS
========================================================= */

exports.getLeads = async (req, res) => {
  try {
    const leads = await Lead.find()
      .populate(
        "assignedTo",
        "name email"
      )
      .sort({
        createdAt: -1,
      });

    return res.json({
      success: true,
      data: leads,
    });
  } catch (err) {
    console.error(
      "GET LEADS ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch leads",
    });
  }
};


/* =========================================================
   UPDATE LEAD
========================================================= */

exports.updateLead = async (req, res) => {
  try {
    const {
      notes,
      ...rest
    } = req.body;

    const lead =
      await Lead.findById(
        req.params.id
      );

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    /* =====================================================
       AUTO PRIORITY
    ===================================================== */

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

    /* =====================================================
       UPDATE NORMAL FIELDS
    ===================================================== */

    Object.assign(
      lead,
      rest
    );

    /* =====================================================
       NOTES
    ===================================================== */

    if (notes !== undefined) {
      if (
        typeof notes === "string" &&
        notes.trim() === ""
      ) {
        lead.notes = [];
      } else if (
        typeof notes === "string"
      ) {
        lead.notes.push({
          text: notes.trim(),
          addedBy:
            req.user?._id ||
            null,
        });
      }
    }

    await lead.save();

    return res.json({
      success: true,
      data: lead,
    });
  } catch (err) {
    console.error(
      "UPDATE LEAD ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


/* =========================================================
   DELETE LEAD
========================================================= */

exports.deleteLead = async (req, res) => {
  try {
    const lead =
      await Lead.findByIdAndDelete(
        req.params.id
      );

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    return res.json({
      success: true,
      message: "Lead deleted",
    });
  } catch (err) {
    console.error(
      "DELETE LEAD ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};