const Lead = require("../models/Lead");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const BRAND = {
  name: "Property Bouquet",
  logo: "https://propertybouquet.com/logowhole.webp",
  website: "https://propertybouquet.com",
  phone: "+919090106101",
  displayPhone: "+91 90901 06101",
  email: "info@propertybouquet.com",
  notificationEmail: "kushank.pal@amethystlandbase.com",
  green: "#0f3b2e",
  darkGreen: "#081f19",
  gold: "#c89d58",
  ivory: "#f7f3ee",
};

// =========================================================
// SHARED EMAIL HELPERS
// =========================================================

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatCurrency = (value) => {
  if (value === undefined || value === null || value === "") {
    return "—";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return escapeHtml(value);
  }

  return `₹${number.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

const formatPercent = (value) => {
  if (value === undefined || value === null || value === "") {
    return "—";
  }

  return `${escapeHtml(value)}%`;
};

const formatDate = (date = new Date()) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date) + " IST";

const emailShell = ({ title, preheader, content, footer = true }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(title)}</title>
</head>

<body style="margin:0;padding:0;background:#f3f2ed;font-family:Arial,Helvetica,sans-serif;color:#26342d;">

  <div style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">
    ${escapeHtml(preheader)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f2ed;width:100%;">
    <tr>
      <td align="center" style="padding:30px 12px;">

        <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:640px;background:#ffffff;border-radius:12px;overflow:hidden;">

          <tr>
            <td align="center" style="padding:27px 22px;background:${BRAND.darkGreen};border-bottom:3px solid ${BRAND.gold};">
              <a href="${BRAND.website}" target="_blank" style="text-decoration:none;">
                <img
                  src="${BRAND.logo}"
                  width="250"
                  alt="Property Bouquet"
                  style="display:block;width:250px;max-width:85%;height:auto;margin:0 auto;border:0;outline:none;"
                >
              </a>

              <p style="margin:13px 0 0;color:#e7dfd0;font-size:11px;line-height:18px;letter-spacing:2px;text-transform:uppercase;">
                Luxury Real Estate Advisory
              </p>
            </td>
          </tr>

          ${content}

          ${
            footer
              ? `
          <tr>
            <td align="center" style="padding:23px 20px;background:#f7f3ee;border-top:1px solid #e9e2d7;">
              <p style="margin:0 0 8px;color:#17342d;font-size:12px;font-weight:bold;letter-spacing:1px;">
                PROPERTY BOUQUET
              </p>

              <p style="margin:0 0 9px;color:#777d76;font-size:11px;line-height:19px;">
                Luxury Properties &bull; Gurgaon &bull; Delhi NCR
              </p>

              <p style="margin:0;font-size:11px;line-height:19px;">
                <a href="${BRAND.website}" style="color:#84642f;text-decoration:none;">propertybouquet.com</a>
                &nbsp;&bull;&nbsp;
                <a href="mailto:${BRAND.email}" style="color:#84642f;text-decoration:none;">${BRAND.email}</a>
              </p>

              <p style="margin:14px 0 0;color:#9a9b95;font-size:10px;line-height:16px;">
                This email was generated in connection with a Property Bouquet enquiry.
              </p>
            </td>
          </tr>`
              : ""
          }

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;

const emailSectionTitle = (title) => `
  <tr>
    <td colspan="2" style="padding:23px 0 10px;color:#17342d;font-size:14px;font-weight:bold;letter-spacing:.5px;">
      ${title}
    </td>
  </tr>
`;

const emailRow = (label, value, alternate = false) => `
  <tr style="background:${alternate ? "#f8f6f1" : "#ffffff"};">
    <td width="38%" valign="top" style="padding:12px 10px;color:#72766f;font-size:12px;line-height:19px;border-bottom:1px solid #eeeae2;">
      ${label}
    </td>
    <td valign="top" style="padding:12px 10px;color:#24372d;font-size:12px;line-height:19px;overflow-wrap:anywhere;word-break:break-word;border-bottom:1px solid #eeeae2;">
      ${value}
    </td>
  </tr>
`;

const actionButton = (url, label, background, color = "#ffffff") => `
  <a
    href="${url}"
    target="_blank"
    style="display:inline-block;padding:13px 18px;margin:5px 3px;background:${background};color:${color};font-size:12px;font-weight:bold;text-decoration:none;border-radius:5px;"
  >${label}</a>
`;

const safeExternalUrl = (value) => {
  const raw = String(value ?? "").trim();

  try {
    const url = new URL(raw);

    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.href;
    }
  } catch {
    // Invalid URLs are omitted from the email.
  }

  return "";
};

// =========================================================
// ADMIN LEAD NOTIFICATION EMAIL
// =========================================================

const buildAdminEmail = ({
  name,
  phone,
  email,
  property,
  source,
  leadType,
  pageUrl,
  pagePath,
  pageTitle,
  roiDetails,
  createdAt,
}) => {
  const isROI = leadType === "ROI Calculator";
  const roi = roiDetails || {};

  const leadInformation = [
    ["Name", escapeHtml(name)],
    [
      "Phone",
      `<a href="tel:${encodeURIComponent(phone)}" style="color:#17342d;font-weight:bold;text-decoration:none;">${escapeHtml(phone)}</a>`,
    ],
    [
      "Email",
      email
        ? `<a href="mailto:${encodeURIComponent(email)}" style="color:#84642f;text-decoration:none;">${escapeHtml(email)}</a>`
        : "Not provided",
    ],
    ["Enquiry Type", escapeHtml(leadType)],
    ["Property", escapeHtml(property || "General Enquiry")],
    ["Lead Source", escapeHtml(source)],
    ["Lead Priority", "Warm"],
    ["Lead Status", "New"],
    ["Received On", escapeHtml(formatDate(createdAt))],
  ];

  if (pageUrl) {
    const safeUrl = safeExternalUrl(pageUrl);

    leadInformation.push([
      "Page URL",
      safeUrl
        ? `<a href="${escapeHtml(safeUrl)}" style="color:#84642f;overflow-wrap:anywhere;">${escapeHtml(pageUrl)}</a>`
        : escapeHtml(pageUrl),
    ]);
  }

  if (pagePath) {
    leadInformation.push(["Page Path", escapeHtml(pagePath)]);
  }

  if (pageTitle) {
    leadInformation.push(["Page Title", escapeHtml(pageTitle)]);
  }

  const leadRows = leadInformation
    .map(([label, value], index) => emailRow(escapeHtml(label), value, index % 2 === 0))
    .join("");

  let roiSection = "";

  if (isROI) {
    const investmentRows = [
      ["Property Value", formatCurrency(roi.propertyValue)],
      [
        "Down Payment",
        `${formatCurrency(roi.downPayment)}${
          roi.downPaymentPercent !== undefined && roi.downPaymentPercent !== null
            ? ` (${formatPercent(roi.downPaymentPercent)})`
            : ""
        }`,
      ],
      [
        "Loan Amount",
        `${formatCurrency(roi.loanAmount)}${
          roi.loanPercent !== undefined && roi.loanPercent !== null
            ? ` (${formatPercent(roi.loanPercent)})`
            : ""
        }`,
      ],
      ["Interest Rate", formatPercent(roi.interestRate)],
      [
        "Loan Tenure",
        roi.loanTenure !== undefined && roi.loanTenure !== null && roi.loanTenure !== ""
          ? `${escapeHtml(roi.loanTenure)} Years`
          : "—",
      ],
      ["Monthly Rent", formatCurrency(roi.monthlyRent)],
      ["Rent Escalation", formatPercent(roi.rentEscalation)],
      [
        "Holding Period",
        roi.holdingPeriod !== undefined && roi.holdingPeriod !== null && roi.holdingPeriod !== ""
          ? `${escapeHtml(roi.holdingPeriod)} Years`
          : "—",
      ],
    ];

    const returnRows = [
      ["Total Appreciation", formatCurrency(roi.totalAppreciation)],
      ["Gross Returns", formatCurrency(roi.grossReturns)],
      ["Total Profit", formatCurrency(roi.totalProfit)],
      ["Return on Investment", formatPercent(roi.roi)],
    ];

    roiSection = `
      <tr>
        <td style="padding:0 30px 25px;">

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${emailSectionTitle("INVESTMENT ASSUMPTIONS")}
            ${investmentRows
              .map(([label, value], index) => emailRow(escapeHtml(label), value, index % 2 === 0))
              .join("")}
          </table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${emailSectionTitle("ESTIMATED RETURNS")}
            ${returnRows
              .map(([label, value], index) => {
                const isProfit = label === "Total Profit";
                const isReturn = label === "Return on Investment";

                return `
                  <tr style="background:${isProfit || isReturn ? "#eef4ef" : index % 2 === 0 ? "#f8f6f1" : "#ffffff"};">
                    <td width="55%" style="padding:14px 10px;color:#59665d;font-size:12px;line-height:19px;border-bottom:1px solid #e4e9e2;">
                      ${escapeHtml(label)}
                    </td>
                    <td align="right" style="padding:14px 10px;color:${isProfit || isReturn ? "#0f3b2e" : "#24372d"};font-size:${isProfit || isReturn ? "16px" : "12px"};font-weight:${isProfit || isReturn ? "bold" : "normal"};line-height:19px;border-bottom:1px solid #e4e9e2;">
                      ${value}
                    </td>
                  </tr>`;
              })
              .join("")}
          </table>

          <p style="margin:12px 0 0;color:#888b84;font-size:10px;line-height:17px;">
            These figures are estimates supplied by the calculator and are not a guarantee of investment performance.
          </p>

        </td>
      </tr>
    `;
  }

  const heading = isROI ? "New Investment Enquiry" : "You've Received a New Lead";

  const description = isROI
    ? "A visitor has completed the Property Bouquet investment ROI calculator and submitted their contact details."
    : "A new enquiry has been received through the Property Bouquet website. Review the details below and follow up with the customer.";

  const content = `
    <tr>
      <td style="padding:30px 30px 12px;">

        <p style="margin:0 0 12px;color:#a07a3d;font-size:10px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">
          ${isROI ? "INVESTMENT ENQUIRY" : "NEW WEBSITE ENQUIRY"}
        </p>

        <h1 style="margin:0;color:#17342d;font-size:25px;line-height:34px;font-weight:bold;">
          ${heading}
        </h1>

        <p style="margin:13px 0 0;color:#6e756f;font-size:13px;line-height:23px;">
          ${description}
        </p>

      </td>
    </tr>

    <tr>
      <td style="padding:15px 30px 0;">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e9e5dc;border-radius:6px;overflow:hidden;">

          <tr>
            <td style="padding:14px;background:#f7f3ee;border-bottom:1px solid #e9e5dc;">
              <p style="margin:0 0 5px;color:#88877e;font-size:10px;letter-spacing:1px;text-transform:uppercase;">
                Customer
              </p>
              <p style="margin:0;color:#17342d;font-size:18px;font-weight:bold;line-height:25px;">
                ${escapeHtml(name)}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:5px 10px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${leadRows}
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>

    ${roiSection}

    <tr>
      <td align="center" style="padding:10px 22px 32px;">

        <p style="margin:0 0 12px;color:#59665d;font-size:12px;line-height:20px;">
          Ready to follow up? Contact the customer directly.
        </p>

        ${actionButton(`tel:${phone}`, "CALL CUSTOMER", BRAND.gold, "#17251f")}

        ${actionButton(
          `https://wa.me/91${phone}?text=${encodeURIComponent(
            `Hello ${name}, thank you for your enquiry with Property Bouquet.`
          )}`,
          "WHATSAPP CUSTOMER",
          "#25D366"
        )}

      </td>
    </tr>
  `;

  return emailShell({
    title: `${heading} | Property Bouquet`,
    preheader: `${heading}: ${name} — ${property || "General Enquiry"}`,
    content,
  });
};

// =========================================================
// CUSTOMER CONFIRMATION EMAIL
// =========================================================

const buildCustomerEmail = ({
  name,
  phone,
  property,
  leadType,
}) => {
  const safeName = escapeHtml(name);
  const safePhone = escapeHtml(phone);
  const safeProperty = escapeHtml(property || "General Enquiry");
  const safeLeadType = escapeHtml(leadType);

  const content = `
    <tr>
      <td style="padding:38px 30px 15px;">

        <p style="margin:0 0 12px;color:#a07a3d;font-size:10px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">
          THANK YOU FOR CONNECTING WITH US
        </p>

        <h1 style="margin:0;color:#17342d;font-size:27px;line-height:36px;">
          Thank you, ${safeName}.
        </h1>

        <p style="margin:17px 0 0;color:#616b63;font-size:14px;line-height:25px;">
          We've successfully received your enquiry. Thank you for considering Property Bouquet for your real estate requirements.
        </p>

        <p style="margin:10px 0 0;color:#616b63;font-size:14px;line-height:25px;">
          Our team will review your enquiry and get in touch with you to understand your requirements and assist you with the next steps.
        </p>

      </td>
    </tr>

    <tr>
      <td style="padding:15px 30px 25px;">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f3ee;border:1px solid #e9e2d7;border-radius:7px;">

          <tr>
            <td style="padding:18px 18px 8px;">
              <p style="margin:0;color:#9b7944;font-size:10px;font-weight:bold;letter-spacing:1.5px;">
                YOUR ENQUIRY SUMMARY
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 18px;border-bottom:1px solid #e5ded2;">
              <p style="margin:0 0 5px;color:#85857b;font-size:11px;">Enquiry Type</p>
              <p style="margin:0;color:#17342d;font-size:13px;line-height:20px;font-weight:bold;">${safeLeadType}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:12px 18px;border-bottom:1px solid #e5ded2;">
              <p style="margin:0 0 5px;color:#85857b;font-size:11px;">Property / Requirement</p>
              <p style="margin:0;color:#17342d;font-size:13px;line-height:20px;">${safeProperty}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:12px 18px 17px;">
              <p style="margin:0 0 5px;color:#85857b;font-size:11px;">Contact Number</p>
              <p style="margin:0;color:#17342d;font-size:13px;line-height:20px;">${safePhone}</p>
            </td>
          </tr>

        </table>

      </td>
    </tr>

    <tr>
      <td align="center" style="padding:0 22px 30px;">

        <p style="margin:0 0 14px;color:#616b63;font-size:13px;line-height:22px;">
          Need assistance before we get in touch? Our team is just a call or message away.
        </p>

        ${actionButton(`tel:${BRAND.phone}`, "CALL OUR TEAM", BRAND.green)}

        ${actionButton(
          `https://wa.me/919090106101?text=${encodeURIComponent(
            "Hello Property Bouquet, I would like to know more about your properties."
          )}`,
          "WHATSAPP US",
          "#25D366"
        )}

        <p style="margin:20px 0 0;color:#616b63;font-size:13px;line-height:23px;">
          Warm regards,<br>
          <strong style="color:#17342d;">Team Property Bouquet</strong>
        </p>

      </td>
    </tr>
  `;

  return emailShell({
    title: "We've Received Your Enquiry | Property Bouquet",
    preheader: "Thank you for contacting Property Bouquet. Your enquiry has been received.",
    content,
  });
};

// =========================================================
// CREATE LEAD
// =========================================================

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
      pageUrl,
      pagePath,
      pageTitle,
    } = req.body;

    // BASIC VALIDATION

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (typeof phone !== "string" || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (cleanName.length > 150) {
      return res.status(400).json({
        success: false,
        message: "Name must not exceed 150 characters",
      });
    }

    // Indian mobile number validation

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    // EMAIL VALIDATION

    const cleanEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (cleanEmail.length > 254) {
      return res.status(400).json({
        success: false,
        message: "Email address is too long",
      });
    }

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    // NORMALIZE VALUES

    const cleanProperty =
      typeof property === "string" ? property.trim().slice(0, 500) : "";

    const cleanSource =
      typeof source === "string" && source.trim()
        ? source.trim().slice(0, 200)
        : "Website";

    const cleanLeadType =
      typeof leadType === "string" && leadType.trim()
        ? leadType.trim().slice(0, 100)
        : "General";

    const cleanPageUrl =
      typeof pageUrl === "string" ? pageUrl.trim().slice(0, 2000) : "";

    const cleanPagePath =
      typeof pagePath === "string" ? pagePath.trim().slice(0, 1000) : "";

    const cleanPageTitle =
      typeof pageTitle === "string" ? pageTitle.trim().slice(0, 500) : "";

    const cleanRoiDetails =
      roiDetails &&
      typeof roiDetails === "object" &&
      !Array.isArray(roiDetails)
        ? roiDetails
        : {};

    // DUPLICATE CHECK: SAME ENQUIRY WITHIN 10 MINUTES

    const existing = await Lead.findOne({
      phone: cleanPhone,
      property: cleanProperty,
      leadType: cleanLeadType,
      createdAt: {
        $gte: new Date(Date.now() - 10 * 60 * 1000),
      },
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        message: "Lead already submitted recently",
      });
    }

    // CREATE LEAD BEFORE SENDING EMAILS

    const lead = await Lead.create({
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      property: cleanProperty,
      source: cleanSource,
      leadType: cleanLeadType,
      pageUrl: cleanPageUrl,
      pagePath: cleanPagePath,
      pageTitle: cleanPageTitle,
      priority: "Warm",
      roiDetails: cleanRoiDetails,
    });

    // ADMIN NOTIFICATION EMAIL
    // Email errors must not undo lead creation.

    try {
      const adminEmailResult = await resend.emails.send({
        from: `Property Bouquet <${BRAND.email}>`,
        to: BRAND.notificationEmail,

        subject:
          cleanLeadType === "ROI Calculator"
            ? `New Investment Enquiry | ${cleanName}`
            : `New Website Lead | ${cleanProperty || "General Enquiry"}`,

        html: buildAdminEmail({
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
          property: cleanProperty,
          source: cleanSource,
          leadType: cleanLeadType,
          pageUrl: cleanPageUrl,
          pagePath: cleanPagePath,
          pageTitle: cleanPageTitle,
          roiDetails: cleanRoiDetails,
          createdAt: lead.createdAt || new Date(),
        }),
      });

      if (adminEmailResult?.error) {
        console.error(
          "Admin notification email failed:",
          adminEmailResult.error
        );
      }
    } catch (emailErr) {
      console.error("Admin notification email failed:", emailErr.message);
    }

    // CUSTOMER CONFIRMATION EMAIL

    if (cleanEmail) {
      try {
        const customerEmailResult = await resend.emails.send({
          from: `Property Bouquet <${BRAND.email}>`,
          to: cleanEmail,
          subject: "We've Received Your Enquiry | Property Bouquet",

          html: buildCustomerEmail({
            name: cleanName,
            phone: cleanPhone,
            property: cleanProperty,
            leadType: cleanLeadType,
          }),
        });

        if (customerEmailResult?.error) {
          console.error(
            "Customer confirmation email failed:",
            customerEmailResult.error
          );
        }
      } catch (customerEmailErr) {
        console.error(
          "Customer confirmation email failed:",
          customerEmailErr.message
        );
      }
    }

    return res.status(201).json({
      success: true,
      data: lead,
    });
  } catch (err) {
    console.error("CREATE LEAD ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to create lead",
    });
  }
};

// =========================================================
// GET LEADS
// =========================================================

exports.getLeads = async (req, res) => {
  try {
    const leads = await Lead.find()
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: leads,
    });
  } catch (err) {
    console.error("GET LEADS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch leads",
    });
  }
};

// =========================================================
// UPDATE LEAD
// =========================================================

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

    // AUTO PRIORITY

    if (rest.status) {
      switch (rest.status) {
        case "Interested":
        case "Visit":
        case "Closed":
          rest.priority = "Hot";
          break;

        case "Not Interested":
          rest.priority = "Cold";
          break;

        case "New":
        default:
          rest.priority = "Warm";
          break;
      }
    }

    Object.assign(lead, rest);

    // NOTES

    if (notes !== undefined) {
      if (typeof notes === "string" && notes.trim() === "") {
        lead.notes = [];
      } else if (typeof notes === "string") {
        lead.notes.push({
          text: notes.trim(),
          addedBy: req.user?._id || null,
        });
      }
    }

    await lead.save();

    return res.json({
      success: true,
      data: lead,
    });
  } catch (err) {
    console.error("UPDATE LEAD ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =========================================================
// DELETE LEAD
// =========================================================

exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);

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
    console.error("DELETE LEAD ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};
