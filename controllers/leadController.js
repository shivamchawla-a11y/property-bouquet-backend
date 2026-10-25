const Lead = require("../models/Lead");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// =========================================================
// PROPERTY BOUQUET BRAND CONFIGURATION
// =========================================================

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
  white: "#ffffff",
  text: "#26342d",
  muted: "#73786f",
  border: "#e9e2d7",
  whatsapp: "#25D366",
};

// =========================================================
// SHARED HELPERS
// =========================================================

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const cleanString = (value, maxLength = 500) =>
  typeof value === "string"
    ? value.trim().slice(0, maxLength)
    : "";

const formatCurrency = (value) => {
  if (value === undefined || value === null || value === "") {
    return "—";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return `₹${number.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

const formatPercent = (value) => {
  if (value === undefined || value === null || value === "") {
    return "—";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return `${number.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}%`;
};

const formatDate = (date = new Date()) => {
  const validDate = new Date(date);

  if (Number.isNaN(validDate.getTime())) {
    return "Not available";
  }

  return (
    new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    }).format(validDate) + " IST"
  );
};

// Only allow HTTP and HTTPS links in emails.
const safeExternalUrl = (value) => {
  const raw = String(value ?? "").trim();

  try {
    const url = new URL(raw);

    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.href;
    }
  } catch {
    // Invalid URLs are intentionally omitted.
  }

  return "";
};

// Normalize Indian phone numbers before using them in contact links.
const normalizeIndianPhone = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (/^[6-9]\d{9}$/.test(digits)) {
    return digits;
  }

  if (/^91[6-9]\d{9}$/.test(digits)) {
    return digits.slice(2);
  }

  if (/^0[6-9]\d{9}$/.test(digits)) {
    return digits.slice(1);
  }

  return "";
};

const createWhatsAppUrl = (phone, message) => {
  const mobile = normalizeIndianPhone(phone);

  if (!mobile) {
    return "";
  }

  return `https://wa.me/91${mobile}?text=${encodeURIComponent(message)}`;
};

const createMailtoUrl = (email) => {
  const value = cleanString(email, 254);

  if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "";
  }

  return `mailto:${value}`;
};

const emailLink = (url, label, color = BRAND.gold) => {
  const safeUrl = safeExternalUrl(url);

  if (!safeUrl) {
    return escapeHtml(label);
  }

  return `
    <a
      href="${escapeHtml(safeUrl)}"
      target="_blank"
      style="color:${color};text-decoration:underline;overflow-wrap:anywhere;"
    >${escapeHtml(label)}</a>
  `;
};

// =========================================================
// REUSABLE EMAIL COMPONENTS
// =========================================================

const actionButton = (
  url,
  label,
  background = BRAND.green,
  color = BRAND.white
) => {
  const rawUrl = String(url ?? "").trim();

  // Permit only the URL schemes required by these email buttons.
  const validUrl =
    /^(https?:\/\/|tel:)/i.test(rawUrl) &&
    (rawUrl.startsWith("https://") ||
      rawUrl.startsWith("http://") ||
      /^tel:\+?[0-9]+$/i.test(rawUrl));

  if (!validUrl) {
    return "";
  }

  return `
    <a
      href="${escapeHtml(rawUrl)}"
      target="_blank"
      style="
        display:inline-block;
        margin:5px 3px;
        padding:13px 19px;
        background:${background};
        color:${color};
        font-family:Arial,Helvetica,sans-serif;
        font-size:12px;
        font-weight:bold;
        line-height:18px;
        text-align:center;
        text-decoration:none;
        border-radius:5px;
      "
    >${escapeHtml(label)}</a>
  `;
};

const emailRow = (label, value, alternate = false) => `
  <tr style="background:${alternate ? "#f8f6f1" : "#ffffff"};">
    <td
      width="38%"
      valign="top"
      style="
        padding:12px 10px;
        color:#72766f;
        font-size:12px;
        line-height:19px;
        border-bottom:1px solid #eeeae2;
      "
    >
      ${escapeHtml(label)}
    </td>

    <td
      valign="top"
      style="
        padding:12px 10px;
        color:#24372d;
        font-size:12px;
        line-height:19px;
        overflow-wrap:anywhere;
        word-break:break-word;
        border-bottom:1px solid #eeeae2;
      "
    >
      ${value}
    </td>
  </tr>
`;

const emailSectionTitle = (title) => `
  <tr>
    <td
      colspan="2"
      style="
        padding:23px 0 10px;
        color:${BRAND.green};
        font-size:12px;
        font-weight:bold;
        letter-spacing:1.4px;
      "
    >
      ${escapeHtml(title)}
    </td>
  </tr>
`;

// =========================================================
// MASTER EMAIL LAYOUT
// =========================================================

const emailShell = ({
  title,
  preheader,
  content,
  footer = true,
}) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">

  <title>${escapeHtml(title)}</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f0eee8;
    font-family:Arial,Helvetica,sans-serif;
    color:${BRAND.text};
    -webkit-text-size-adjust:100%;
  "
>

  <div
    style="
      display:none!important;
      visibility:hidden;
      opacity:0;
      color:transparent;
      height:0;
      width:0;
      overflow:hidden;
      mso-hide:all;
    "
  >${escapeHtml(preheader)}</div>

  <table
    role="presentation"
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="width:100%;background:#f0eee8;"
  >
    <tr>
      <td align="center" style="padding:24px 10px;">

        <table
          role="presentation"
          width="640"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            width:100%;
            max-width:640px;
            background:#ffffff;
            border-radius:10px;
            overflow:hidden;
          "
        >

          <!-- BRAND HEADER -->

          <tr>
            <td
              align="center"
              style="
                padding:24px 20px 20px;
                background:${BRAND.ivory};
                border-bottom:3px solid ${BRAND.gold};
              "
            >

              <a
                href="${BRAND.website}"
                target="_blank"
                style="text-decoration:none;"
              >
                <img
                  src="${BRAND.logo}"
                  width="280"
                  alt="Property Bouquet — Luxury Real Estate Advisory"
                  style="
                    display:block;
                    width:280px;
                    max-width:100%;
                    height:auto;
                    margin:0 auto;
                    border:0;
                    outline:none;
                    text-decoration:none;
                  "
                >
              </a>

              <p
                style="
                  margin:12px 0 0;
                  color:${BRAND.green};
                  font-size:10px;
                  line-height:17px;
                  letter-spacing:2px;
                  text-transform:uppercase;
                "
              >
                Luxury Real Estate Advisory
              </p>

            </td>
          </tr>

          <!-- EMAIL CONTENT -->

          ${content}

          ${
            footer
              ? `
          <!-- FOOTER -->

          <tr>
            <td
              align="center"
              style="
                padding:24px 18px;
                background:${BRAND.ivory};
                border-top:1px solid ${BRAND.border};
              "
            >

              <p
                style="
                  margin:0 0 8px;
                  color:${BRAND.green};
                  font-size:12px;
                  font-weight:bold;
                  letter-spacing:2px;
                "
              >
                PROPERTY BOUQUET
              </p>

              <p
                style="
                  margin:0 0 10px;
                  color:#777d76;
                  font-size:11px;
                  line-height:19px;
                "
              >
                Luxury Properties &bull; Gurgaon &bull; Delhi NCR
              </p>

              <p
                style="
                  margin:0;
                  font-size:11px;
                  line-height:21px;
                "
              >
                <a
                  href="${BRAND.website}"
                  target="_blank"
                  style="
                    color:#84642f;
                    text-decoration:none;
                  "
                >propertybouquet.com</a>

                &nbsp;&bull;&nbsp;

                <a
                  href="mailto:${BRAND.email}"
                  style="
                    color:#84642f;
                    text-decoration:none;
                  "
                >${BRAND.email}</a>
              </p>

              <p
                style="
                  margin:14px 0 0;
                  color:#92938d;
                  font-size:10px;
                  line-height:17px;
                "
              >
                This email relates to a Property Bouquet enquiry.
              </p>

            </td>
          </tr>
          `
              : ""
          }

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;

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

  const safeName = escapeHtml(name);
  const safePhone = escapeHtml(phone);
  const safeProperty = escapeHtml(property || "General Enquiry");
  const safeSource = escapeHtml(source);
  const safeLeadType = escapeHtml(leadType);

  const normalizedPhone = normalizeIndianPhone(phone);

  const leadInformation = [
    ["Customer Name", safeName],

    [
      "Phone Number",
      normalizedPhone
        ? `<a href="tel:+91${normalizedPhone}" style="color:${BRAND.green};font-weight:bold;text-decoration:none;">${safePhone}</a>`
        : safePhone,
    ],

    [
      "Email Address",
      email
        ? emailLink(createMailtoUrl(email), email)
        : "Not provided",
    ],

    ["Enquiry Type", safeLeadType],
    ["Property / Requirement", safeProperty],
    ["Lead Source", safeSource],
    ["Lead Priority", "Warm"],
    ["Lead Status", "New"],
    ["Received On", escapeHtml(formatDate(createdAt))],
  ];

  if (pageUrl) {
    const safeUrl = safeExternalUrl(pageUrl);

    leadInformation.push([
      "Page URL",
      safeUrl
        ? emailLink(safeUrl, pageUrl)
        : escapeHtml(pageUrl),
    ]);
  }

  if (pagePath) {
    leadInformation.push([
      "Page Path",
      escapeHtml(pagePath),
    ]);
  }

  if (pageTitle) {
    leadInformation.push([
      "Page Title",
      escapeHtml(pageTitle),
    ]);
  }

  const leadRows = leadInformation
    .map(([label, value], index) =>
      emailRow(label, value, index % 2 === 0)
    )
    .join("");

  // -------------------------------------------------------
  // ROI CALCULATOR DETAILS
  // -------------------------------------------------------

  let roiSection = "";

  if (isROI) {
    const investmentRows = [
      ["Property Value", formatCurrency(roi.propertyValue)],

      [
        "Down Payment",
        `${formatCurrency(roi.downPayment)}${
          roi.downPaymentPercent !== undefined &&
          roi.downPaymentPercent !== null &&
          roi.downPaymentPercent !== ""
            ? ` (${formatPercent(roi.downPaymentPercent)})`
            : ""
        }`,
      ],

      [
        "Loan Amount",
        `${formatCurrency(roi.loanAmount)}${
          roi.loanPercent !== undefined &&
          roi.loanPercent !== null &&
          roi.loanPercent !== ""
            ? ` (${formatPercent(roi.loanPercent)})`
            : ""
        }`,
      ],

      ["Interest Rate", formatPercent(roi.interestRate)],

      [
        "Loan Tenure",
        roi.loanTenure !== undefined &&
        roi.loanTenure !== null &&
        roi.loanTenure !== ""
          ? `${escapeHtml(roi.loanTenure)} Years`
          : "—",
      ],

      ["Monthly Rent", formatCurrency(roi.monthlyRent)],

      ["Rent Escalation", formatPercent(roi.rentEscalation)],

      [
        "Holding Period",
        roi.holdingPeriod !== undefined &&
        roi.holdingPeriod !== null &&
        roi.holdingPeriod !== ""
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
        <td style="padding:0 25px 25px;">

          <table
            role="presentation"
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
          >
            ${emailSectionTitle("INVESTMENT ASSUMPTIONS")}

            ${investmentRows
              .map(([label, value], index) =>
                emailRow(label, value, index % 2 === 0)
              )
              .join("")}
          </table>

          <table
            role="presentation"
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
          >
            ${emailSectionTitle("ESTIMATED INVESTMENT RETURNS")}

            ${returnRows
              .map(([label, value], index) => {
                const highlighted =
                  label === "Total Profit" ||
                  label === "Return on Investment";

                return `
                  <tr
                    style="
                      background:${
                        highlighted
                          ? "#eef4ef"
                          : index % 2 === 0
                            ? "#f8f6f1"
                            : "#ffffff"
                      };
                    "
                  >
                    <td
                      width="55%"
                      style="
                        padding:13px 10px;
                        color:#59665d;
                        font-size:12px;
                        line-height:19px;
                        border-bottom:1px solid #e4e9e2;
                      "
                    >
                      ${escapeHtml(label)}
                    </td>

                    <td
                      align="right"
                      style="
                        padding:13px 10px;
                        color:${highlighted ? BRAND.green : BRAND.text};
                        font-size:${highlighted ? "15px" : "12px"};
                        font-weight:${highlighted ? "bold" : "normal"};
                        line-height:19px;
                        overflow-wrap:anywhere;
                        border-bottom:1px solid #e4e9e2;
                      "
                    >
                      ${value}
                    </td>
                  </tr>
                `;
              })
              .join("")}
          </table>

          <p
            style="
              margin:12px 0 0;
              color:#888b84;
              font-size:10px;
              line-height:17px;
            "
          >
            Figures are estimates supplied by the calculator and do not
            guarantee investment performance or future returns.
          </p>

        </td>
      </tr>
    `;
  }

  const heading = isROI
    ? "New Investment Enquiry"
    : "You've Received a New Lead";

  const description = isROI
    ? "A visitor has completed the Property Bouquet investment ROI calculator and submitted their contact details."
    : "A new enquiry has been received through the Property Bouquet website. Review the details below and follow up with the customer.";

  const whatsappUrl = createWhatsAppUrl(
    phone,
    `Hello ${name}, thank you for your enquiry with Property Bouquet.`
  );

  const content = `
    <!-- INTRODUCTION -->

    <tr>
      <td style="padding:30px 25px 15px;">

        <p
          style="
            margin:0 0 10px;
            color:#a07a3d;
            font-size:10px;
            font-weight:bold;
            letter-spacing:2px;
            text-transform:uppercase;
          "
        >
          ${isROI ? "INVESTMENT ENQUIRY" : "NEW WEBSITE ENQUIRY"}
        </p>

        <h1
          style="
            margin:0;
            color:${BRAND.green};
            font-size:24px;
            line-height:33px;
            font-weight:bold;
          "
        >
          ${heading}
        </h1>

        <p
          style="
            margin:13px 0 0;
            color:#6e756f;
            font-size:13px;
            line-height:23px;
          "
        >
          ${description}
        </p>

      </td>
    </tr>

    <!-- CUSTOMER SUMMARY -->

    <tr>
      <td style="padding:10px 25px 25px;">

        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            border:1px solid ${BRAND.border};
            border-radius:6px;
            overflow:hidden;
          "
        >

          <tr>
            <td
              style="
                padding:16px;
                background:${BRAND.ivory};
                border-bottom:1px solid ${BRAND.border};
              "
            >

              <p
                style="
                  margin:0 0 6px;
                  color:#88877e;
                  font-size:10px;
                  letter-spacing:1.5px;
                  text-transform:uppercase;
                "
              >
                CUSTOMER
              </p>

              <p
                style="
                  margin:0;
                  color:${BRAND.green};
                  font-size:19px;
                  font-weight:bold;
                  line-height:27px;
                  overflow-wrap:anywhere;
                "
              >
                ${safeName}
              </p>

            </td>
          </tr>

          <tr>
            <td style="padding:5px 10px;">

              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
              >
                ${leadRows}
              </table>

            </td>
          </tr>

        </table>

      </td>
    </tr>

    ${roiSection}

    <!-- FOLLOW-UP ACTIONS -->

    <tr>
      <td
        align="center"
        style="padding:0 20px 30px;"
      >

        <p
          style="
            margin:0 0 12px;
            color:#59665d;
            font-size:12px;
            line-height:20px;
          "
        >
          Ready to follow up? Contact the customer directly.
        </p>

        ${
          normalizedPhone
            ? actionButton(
                `tel:+91${normalizedPhone}`,
                "CALL CUSTOMER",
                BRAND.gold,
                "#17251f"
              )
            : ""
        }

        ${
          whatsappUrl
            ? actionButton(
                whatsappUrl,
                "WHATSAPP CUSTOMER",
                BRAND.whatsapp,
                "#ffffff"
              )
            : ""
        }

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

  const whatsappUrl = createWhatsAppUrl(
    BRAND.phone,
    "Hello Property Bouquet, I would like to know more about your properties."
  );

  const content = `
    <!-- THANK YOU MESSAGE -->

    <tr>
      <td style="padding:35px 25px 15px;">

        <p
          style="
            margin:0 0 12px;
            color:#a07a3d;
            font-size:10px;
            font-weight:bold;
            letter-spacing:2px;
            text-transform:uppercase;
          "
        >
          THANK YOU FOR CONNECTING WITH US
        </p>

        <h1
          style="
            margin:0;
            color:${BRAND.green};
            font-size:26px;
            line-height:36px;
            font-weight:bold;
          "
        >
          Thank you, ${safeName}.
        </h1>

        <p
          style="
            margin:17px 0 0;
            color:#616b63;
            font-size:14px;
            line-height:25px;
          "
        >
          We've successfully received your enquiry. Thank you for
          considering Property Bouquet for your real estate requirements.
        </p>

        <p
          style="
            margin:10px 0 0;
            color:#616b63;
            font-size:14px;
            line-height:25px;
          "
        >
          Our team will review your requirements and get in touch with you
          to assist you with the next steps.
        </p>

      </td>
    </tr>

    <!-- ENQUIRY SUMMARY -->

    <tr>
      <td style="padding:15px 25px 25px;">

        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            background:${BRAND.ivory};
            border:1px solid ${BRAND.border};
            border-radius:7px;
          "
        >

          <tr>
            <td style="padding:19px 18px 12px;">

              <p
                style="
                  margin:0;
                  color:#9b7944;
                  font-size:10px;
                  font-weight:bold;
                  letter-spacing:1.5px;
                "
              >
                YOUR ENQUIRY SUMMARY
              </p>

            </td>
          </tr>

          <tr>
            <td
              style="
                padding:10px 18px;
                border-bottom:1px solid #e5ded2;
              "
            >

              <p
                style="
                  margin:0 0 5px;
                  color:#85857b;
                  font-size:11px;
                "
              >
                Enquiry Type
              </p>

              <p
                style="
                  margin:0;
                  color:${BRAND.green};
                  font-size:13px;
                  line-height:20px;
                  font-weight:bold;
                "
              >
                ${safeLeadType}
              </p>

            </td>
          </tr>

          <tr>
            <td
              style="
                padding:12px 18px;
                border-bottom:1px solid #e5ded2;
              "
            >

              <p
                style="
                  margin:0 0 5px;
                  color:#85857b;
                  font-size:11px;
                "
              >
                Property / Requirement
              </p>

              <p
                style="
                  margin:0;
                  color:${BRAND.green};
                  font-size:13px;
                  line-height:21px;
                  overflow-wrap:anywhere;
                "
              >
                ${safeProperty}
              </p>

            </td>
          </tr>

          <tr>
            <td style="padding:12px 18px 17px;">

              <p
                style="
                  margin:0 0 5px;
                  color:#85857b;
                  font-size:11px;
                "
              >
                Contact Number
              </p>

              <p
                style="
                  margin:0;
                  color:${BRAND.green};
                  font-size:13px;
                  line-height:20px;
                "
              >
                ${safePhone}
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>

    <!-- CONTACT BUTTONS -->

    <tr>
      <td
        align="center"
        style="padding:0 20px 30px;"
      >

        <p
          style="
            margin:0 0 13px;
            color:#616b63;
            font-size:13px;
            line-height:22px;
          "
        >
          Need assistance? Our team is just a call or message away.
        </p>

        ${actionButton(
          `tel:${BRAND.phone}`,
          "CALL OUR TEAM",
          BRAND.green
        )}

        ${
          whatsappUrl
            ? actionButton(
                whatsappUrl,
                "WHATSAPP US",
                BRAND.whatsapp
              )
            : ""
        }

        <p
          style="
            margin:20px 0 0;
            color:#616b63;
            font-size:13px;
            line-height:23px;
          "
        >
          Warm regards,<br>
          <strong style="color:${BRAND.green};">
            Team Property Bouquet
          </strong>
        </p>

      </td>
    </tr>
  `;

  return emailShell({
    title: "We've Received Your Enquiry | Property Bouquet",
    preheader:
      "Thank you for contacting Property Bouquet. Your enquiry has been received.",
    content,
  });
};

// =========================================================
// EMAIL DELIVERY HELPER
// =========================================================

const sendEmailSafely = async ({
  to,
  subject,
  html,
  label,
}) => {
  if (!process.env.RESEND_API_KEY) {
    console.error(
      `${label}: RESEND_API_KEY is not configured.`
    );

    return false;
  }

  try {
    const result = await resend.emails.send({
      from: `Property Bouquet <${BRAND.email}>`,
      to,
      subject,
      html,
    });

    if (result?.error) {
      console.error(`${label}:`, result.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      `${label}:`,
      error?.message || error
    );

    return false;
  }
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
    } = req.body || {};

    // -----------------------------------------------------
    // BASIC VALIDATION
    // -----------------------------------------------------

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

    if (cleanName.length > 150) {
      return res.status(400).json({
        success: false,
        message: "Name must not exceed 150 characters",
      });
    }

    // Accept an Indian mobile number with an optional +91 or 91 prefix.
    const cleanPhone = normalizeIndianPhone(phone);

    if (!cleanPhone) {
      return res.status(400).json({
        success: false,
        message: "Invalid Indian mobile number",
      });
    }

    // -----------------------------------------------------
    // EMAIL VALIDATION
    // -----------------------------------------------------

    const cleanEmail =
      typeof email === "string"
        ? email.trim().toLowerCase()
        : "";

    if (cleanEmail.length > 254) {
      return res.status(400).json({
        success: false,
        message: "Email address is too long",
      });
    }

    if (
      cleanEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    // -----------------------------------------------------
    // NORMALIZE INPUT VALUES
    // -----------------------------------------------------

    const cleanProperty = cleanString(property, 500);

    const cleanSource =
      cleanString(source, 200) || "Website";

    const cleanLeadType =
      cleanString(leadType, 100) || "General";

    const cleanPageUrl = cleanString(pageUrl, 2000);
    const cleanPagePath = cleanString(pagePath, 1000);
    const cleanPageTitle = cleanString(pageTitle, 500);

    const cleanRoiDetails =
      roiDetails &&
      typeof roiDetails === "object" &&
      !Array.isArray(roiDetails)
        ? roiDetails
        : {};

    // -----------------------------------------------------
    // DUPLICATE CHECK
    // Same phone, property and lead type within 10 minutes.
    // -----------------------------------------------------

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

    // -----------------------------------------------------
    // SAVE LEAD BEFORE ATTEMPTING EMAIL DELIVERY
    // -----------------------------------------------------

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

    // -----------------------------------------------------
    // ADMIN NOTIFICATION EMAIL
    // -----------------------------------------------------

    const isROI = cleanLeadType === "ROI Calculator";

    await sendEmailSafely({
      to: BRAND.notificationEmail,

      subject: isROI
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

      label: "Admin notification email failed",
    });

    // -----------------------------------------------------
    // CUSTOMER CONFIRMATION EMAIL
    // Sent only when a valid email address is supplied.
    // -----------------------------------------------------

    if (cleanEmail) {
      await sendEmailSafely({
        to: cleanEmail,

        subject: "We've Received Your Enquiry | Property Bouquet",

        html: buildCustomerEmail({
          name: cleanName,
          phone: cleanPhone,
          property: cleanProperty,
          leadType: cleanLeadType,
        }),

        label: "Customer confirmation email failed",
      });
    }

    // -----------------------------------------------------
    // SUCCESS RESPONSE
    // -----------------------------------------------------

    return res.status(201).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    console.error(
      "CREATE LEAD ERROR:",
      error?.message || error
    );

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
  } catch (error) {
    console.error(
      "GET LEADS ERROR:",
      error?.message || error
    );

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
    const body = req.body || {};
    const { notes } = body;

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    // Only allow intended, editable lead fields.
    // Do not allow the request to overwrite arbitrary
    // internal fields such as _id or createdAt.

    const allowedFields = [
      "name",
      "phone",
      "email",
      "property",
      "source",
      "leadType",
      "status",
      "priority",
      "assignedTo",
      "pageUrl",
      "pagePath",
      "pageTitle",
      "roiDetails",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updates[field] = body[field];
      }
    }

    // -----------------------------------------------------
    // NORMALIZE BASIC EDITABLE FIELDS
    // -----------------------------------------------------

    if (Object.prototype.hasOwnProperty.call(updates, "name")) {
      if (
        typeof updates.name !== "string" ||
        !updates.name.trim() ||
        updates.name.trim().length > 150
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid name",
        });
      }

      updates.name = updates.name.trim();
    }

    if (Object.prototype.hasOwnProperty.call(updates, "phone")) {
      const normalizedPhone = normalizeIndianPhone(
        updates.phone
      );

      if (!normalizedPhone) {
        return res.status(400).json({
          success: false,
          message: "Invalid Indian mobile number",
        });
      }

      updates.phone = normalizedPhone;
    }

    if (Object.prototype.hasOwnProperty.call(updates, "email")) {
      const updatedEmail =
        typeof updates.email === "string"
          ? updates.email.trim().toLowerCase()
          : "";

      if (
        updatedEmail.length > 254 ||
        (updatedEmail &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updatedEmail))
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid email address",
        });
      }

      updates.email = updatedEmail;
    }

    for (const field of [
      "property",
      "source",
      "leadType",
      "pageUrl",
      "pagePath",
      "pageTitle",
    ]) {
      if (Object.prototype.hasOwnProperty.call(updates, field)) {
        if (typeof updates[field] !== "string") {
          return res.status(400).json({
            success: false,
            message: `Invalid ${field}`,
          });
        }

        const limits = {
          property: 500,
          source: 200,
          leadType: 100,
          pageUrl: 2000,
          pagePath: 1000,
          pageTitle: 500,
        };

        updates[field] = updates[field]
          .trim()
          .slice(0, limits[field]);
      }
    }

    // -----------------------------------------------------
    // AUTOMATIC PRIORITY
    // -----------------------------------------------------

    if (updates.status) {
      switch (updates.status) {
        case "Interested":
        case "Visit":
        case "Closed":
          updates.priority = "Hot";
          break;

        case "Not Interested":
          updates.priority = "Cold";
          break;

        case "New":
          updates.priority = "Warm";
          break;

        default:
          // Do not infer a priority for an unknown status.
          break;
      }
    }

    Object.assign(lead, updates);

    // -----------------------------------------------------
    // NOTES
    // -----------------------------------------------------

    if (notes !== undefined) {
      if (typeof notes !== "string") {
        return res.status(400).json({
          success: false,
          message: "Notes must be text",
        });
      }

      const cleanNotes = notes.trim();

      if (cleanNotes.length > 5000) {
        return res.status(400).json({
          success: false,
          message: "Notes must not exceed 5000 characters",
        });
      }

      if (!cleanNotes) {
        lead.notes = [];
      } else {
        lead.notes.push({
          text: cleanNotes,
          addedBy: req.user?._id || null,
        });
      }
    }

    await lead.save();

    return res.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    console.error(
      "UPDATE LEAD ERROR:",
      error?.message || error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update lead",
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
  } catch (error) {
    console.error(
      "DELETE LEAD ERROR:",
      error?.message || error
    );

    return res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};