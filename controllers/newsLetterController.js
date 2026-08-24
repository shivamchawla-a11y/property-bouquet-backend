const NewsletterSubscriber = require("../models/NewsLetterSubscriber");
const { Resend } = require("resend");

const resend = new Resend(
  process.env.RESEND_API_KEY
);

/* =========================================================
   EMAIL HELPERS
========================================================= */

/**
 * Escape user-provided values before inserting them
 * into HTML emails.
 */
const escapeHtml = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};


/* =========================================================
   ADMIN / CRM EMAIL
========================================================= */

const sendAdminNewsletterEmail = async ({
  email,
  source,
  isResubscription = false,
}) => {
  const cleanEmail = escapeHtml(email);
  const cleanSource = escapeHtml(source);

  await resend.emails.send({
    from:
      "Property Bouquet <info@propertybouquet.com>",

    to:
      "kushank.pal@amethystlandbase.com",

    subject: isResubscription
      ? `📩 Newsletter Re-Subscription • ${email}`
      : `📩 New Newsletter Subscriber • ${email}`,

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
Property Bouquet Newsletter
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
  isResubscription
    ? "📩 Newsletter Re-Subscription"
    : "📩 New Newsletter Subscriber"
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
  isResubscription
    ? "A visitor has subscribed again to Property Bouquet's real estate updates and newsletter."
    : "A new visitor has subscribed to Property Bouquet's real estate updates and newsletter."
}
</p>


<!-- =====================================================
     SUBSCRIBER INFORMATION
===================================================== -->

<h3
style="
margin:30px 0 12px;
font-size:17px;
color:#111111;
"
>
Subscriber Information
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

<td
width="180"
style="color:#555;"
>
<strong>Email</strong>
</td>

<td style="color:#111;">
${cleanEmail}
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


<tr style="background:#fafafa;">

<td style="color:#555;">
<strong>Status</strong>
</td>

<td style="color:#111;">
Subscribed
</td>

</tr>


<tr>

<td style="color:#555;">
<strong>Action</strong>
</td>

<td style="color:#111;">
${
  isResubscription
    ? "Re-Subscribed"
    : "New Subscription"
}
</td>

</tr>


<tr style="background:#fafafa;">

<td style="color:#555;">
<strong>Submitted</strong>
</td>

<td style="color:#111;">
${new Date().toLocaleString("en-IN")}
</td>

</tr>

</table>


<!-- =====================================================
     ACTION BUTTON
===================================================== -->

<div
style="
margin-top:35px;
text-align:center;
"
>

<a
href="mailto:${encodeURIComponent(email)}"
style="
display:inline-block;
padding:14px 24px;
background:#C89B4F;
color:#111111;
text-decoration:none;
font-weight:bold;
border-radius:8px;
"
>
✉️ Email Subscriber
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
};


/* =========================================================
   USER WELCOME / CONFIRMATION EMAIL
========================================================= */

const sendSubscriberWelcomeEmail = async ({
  email,
  source,
  isResubscription = false,
}) => {
  const cleanEmail = escapeHtml(email);
  const cleanSource = escapeHtml(source);

  await resend.emails.send({
    from:
      "Property Bouquet <info@propertybouquet.com>",

    to: email,

    subject: isResubscription
      ? "Welcome Back to Property Bouquet"
      : "Welcome to Property Bouquet • You're Subscribed",

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
Property Bouquet
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
style="
background:#f5f5f5;
"
>

<tr>

<td
align="center"
style="
padding:30px 15px;
"
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
padding:40px 30px;
text-align:center;
"
>

<div
style="
color:#C89B4F;
font-size:30px;
font-weight:700;
letter-spacing:1.5px;
"
>
PROPERTY BOUQUET
</div>

<div
style="
margin-top:9px;
color:#dddddd;
font-size:14px;
letter-spacing:.3px;
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
padding:40px 35px;
"
>

<h1
style="
margin:0;
color:#111111;
font-size:27px;
line-height:36px;
font-weight:600;
"
>
${
  isResubscription
    ? "Welcome Back to Property Bouquet"
    : "You're Successfully Subscribed"
}
</h1>


<p
style="
margin:18px 0 0;
color:#555555;
font-size:15px;
line-height:26px;
"
>

Thank you for staying connected with
<strong style="color:#111111;">
Property Bouquet
</strong>.

</p>


<p
style="
margin:12px 0 0;
color:#666666;
font-size:15px;
line-height:26px;
"
>

You are now subscribed to receive updates,
insights and carefully curated information about
premium real estate opportunities.

</p>


<!-- =====================================================
     GOLD DIVIDER
===================================================== -->

<div
style="
height:1px;
background:#e6dcc8;
margin:30px 0;
"
>
</div>


<!-- =====================================================
     WHAT YOU CAN EXPECT
===================================================== -->

<h2
style="
margin:0;
color:#111111;
font-size:19px;
font-weight:600;
"
>
What You Can Expect
</h2>


<table
width="100%"
cellpadding="0"
cellspacing="0"
border="0"
style="
margin-top:18px;
"
>

<tr>

<td
width="35"
valign="top"
style="
font-size:18px;
color:#C89B4F;
padding-bottom:14px;
"
>
◆
</td>

<td
valign="top"
style="
font-size:14px;
line-height:22px;
color:#555555;
padding-bottom:14px;
"
>
Curated luxury property opportunities
</td>

</tr>


<tr>

<td
width="35"
valign="top"
style="
font-size:18px;
color:#C89B4F;
padding-bottom:14px;
"
>
◆
</td>

<td
valign="top"
style="
font-size:14px;
line-height:22px;
color:#555555;
padding-bottom:14px;
"
>
Premium residential and commercial projects
</td>

</tr>


<tr>

<td
width="35"
valign="top"
style="
font-size:18px;
color:#C89B4F;
padding-bottom:14px;
"
>
◆
</td>

<td
valign="top"
style="
font-size:14px;
line-height:22px;
color:#555555;
padding-bottom:14px;
"
>
Real estate market insights and updates
</td>

</tr>


<tr>

<td
width="35"
valign="top"
style="
font-size:18px;
color:#C89B4F;
"
>
◆
</td>

<td
valign="top"
style="
font-size:14px;
line-height:22px;
color:#555555;
"
>
Property investment opportunities
</td>

</tr>

</table>


<!-- =====================================================
     SUBSCRIPTION DETAILS
===================================================== -->

<h2
style="
margin:35px 0 14px;
color:#111111;
font-size:19px;
font-weight:600;
"
>
Subscription Details
</h2>


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
style="
background:#fafafa;
"
>

<td
width="170"
style="
color:#555555;
"
>
<strong>Email</strong>
</td>

<td
style="
color:#111111;
"
>
${cleanEmail}
</td>

</tr>


<tr>

<td
style="
color:#555555;
"
>
<strong>Status</strong>
</td>

<td
style="
color:#111111;
"
>
Subscribed
</td>

</tr>


<tr
style="
background:#fafafa;
"
>

<td
style="
color:#555555;
"
>
<strong>Source</strong>
</td>

<td
style="
color:#111111;
"
>
${cleanSource}
</td>

</tr>


<tr>

<td
style="
color:#555555;
"
>
<strong>Date</strong>
</td>

<td
style="
color:#111111;
"
>
${new Date().toLocaleDateString("en-IN")}
</td>

</tr>

</table>


<!-- =====================================================
     CTA
===================================================== -->

<div
style="
margin-top:35px;
text-align:center;
"
>

<a
href="https://propertybouquet.com"
style="
display:inline-block;
padding:15px 28px;
background:#C89B4F;
color:#111111;
text-decoration:none;
font-weight:700;
font-size:14px;
border-radius:8px;
"
>
Explore Property Bouquet
</a>

</div>


<!-- =====================================================
     NOTE
===================================================== -->

<p
style="
margin:32px 0 0;
color:#777777;
font-size:12px;
line-height:20px;
text-align:center;
"
>

You are receiving this email because you subscribed
to Property Bouquet updates.

</p>

</td>

</tr>


<!-- =====================================================
     FOOTER
===================================================== -->

<tr>

<td
style="
background:#111111;
padding:28px 25px;
text-align:center;
"
>

<div
style="
color:#C89B4F;
font-size:15px;
font-weight:700;
letter-spacing:.5px;
"
>
PROPERTY BOUQUET
</div>


<div
style="
margin-top:8px;
color:#aaaaaa;
font-size:12px;
line-height:20px;
"
>

Luxury Properties • Gurgaon • Delhi NCR

<br />

© ${new Date().getFullYear()} Property Bouquet.
All rights reserved.

</div>

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
};


/* =========================================================
   SUBSCRIBE TO NEWSLETTER
========================================================= */

exports.subscribeNewsletter = async (req, res) => {
  try {
    const {
      email,
      source,
    } = req.body;


    /* =======================================================
       BASIC VALIDATION
    ======================================================= */

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email address is required",
      });
    }


    /* =======================================================
       NORMALIZE EMAIL
    ======================================================= */

    const cleanEmail =
      email.trim().toLowerCase();


    /* =======================================================
       EMAIL VALIDATION
    ======================================================= */

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }


    /* =======================================================
       NORMALIZE SOURCE
    ======================================================= */

    const cleanSource =
      typeof source === "string" &&
      source.trim()
        ? source.trim()
        : "Website Footer";


    /* =======================================================
       DUPLICATE CHECK
    ======================================================= */

    const existing =
      await NewsletterSubscriber.findOne({
        email: cleanEmail,
      });


    /* =======================================================
       ALREADY SUBSCRIBED
    ======================================================= */

    if (existing) {

      if (
        existing.status ===
        "Subscribed"
      ) {
        return res.status(200).json({
          success: true,
          duplicate: true,
          message:
            "You are already subscribed to Property Bouquet updates.",
        });
      }


      /* =====================================================
         RE-SUBSCRIBE
      ===================================================== */

      existing.status =
        "Subscribed";

      existing.source =
        cleanSource;

      existing.subscribedAt =
        new Date();

      await existing.save();


      /* =====================================================
         ADMIN EMAIL
      ===================================================== */

      try {
        await sendAdminNewsletterEmail({
          email: cleanEmail,
          source: cleanSource,
          isResubscription: true,
        });
      } catch (emailErr) {
        console.error(
          "Newsletter admin email failed:",
          emailErr.message
        );
      }


      /* =====================================================
         USER EMAIL
      ===================================================== */

      try {
        await sendSubscriberWelcomeEmail({
          email: cleanEmail,
          source: cleanSource,
          isResubscription: true,
        });
      } catch (emailErr) {
        console.error(
          "Newsletter subscriber email failed:",
          emailErr.message
        );
      }


      return res.status(200).json({
        success: true,
        message:
          "You have been subscribed successfully.",
      });
    }


    /* =======================================================
       CREATE NEW SUBSCRIBER
    ======================================================= */

    const subscriber =
      await NewsletterSubscriber.create({
        email: cleanEmail,

        source: cleanSource,

        status:
          "Subscribed",

        subscribedAt:
          new Date(),
      });


    /* =======================================================
       ADMIN / CRM EMAIL
    ======================================================= */

    try {
      await sendAdminNewsletterEmail({
        email: cleanEmail,
        source: cleanSource,
        isResubscription: false,
      });
    } catch (emailErr) {
      console.error(
        "Newsletter admin email failed:",
        emailErr.message
      );
    }


    /* =======================================================
       USER CONFIRMATION EMAIL
    ======================================================= */

    try {
      await sendSubscriberWelcomeEmail({
        email: cleanEmail,
        source: cleanSource,
        isResubscription: false,
      });
    } catch (emailErr) {
      console.error(
        "Newsletter subscriber email failed:",
        emailErr.message
      );
    }


    /* =======================================================
       RESPONSE
    ======================================================= */

    return res.status(201).json({
      success: true,
      data: subscriber,
      message:
        "You have been subscribed successfully.",
    });

  } catch (err) {

    console.error(
      "NEWSLETTER SUBSCRIBE ERROR:",
      err
    );


    /* =======================================================
       HANDLE DUPLICATE EMAIL RACE CONDITION
    ======================================================= */

    if (err.code === 11000) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        message:
          "You are already subscribed to Property Bouquet updates.",
      });
    }


    return res.status(500).json({
      success: false,
      message:
        "Failed to subscribe. Please try again.",
    });
  }
};


/* =========================================================
   GET NEWSLETTER SUBSCRIBERS
========================================================= */

exports.getNewsletterSubscribers = async (
  req,
  res
) => {

  try {

    const subscribers =
      await NewsletterSubscriber.find()
        .sort({
          createdAt: -1,
        });


    return res.json({
      success: true,
      data: subscribers,
    });

  } catch (err) {

    console.error(
      "GET NEWSLETTER SUBSCRIBERS ERROR:",
      err
    );


    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch newsletter subscribers",
    });
  }
};


/* =========================================================
   DELETE NEWSLETTER SUBSCRIBER
========================================================= */

exports.deleteNewsletterSubscriber = async (
  req,
  res
) => {

  try {

    const subscriber =
      await NewsletterSubscriber.findByIdAndDelete(
        req.params.id
      );


    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message:
          "Subscriber not found",
      });
    }


    return res.json({
      success: true,
      message:
        "Subscriber deleted",
    });

  } catch (err) {

    console.error(
      "DELETE NEWSLETTER SUBSCRIBER ERROR:",
      err
    );


    return res.status(500).json({
      success: false,
      message:
        "Delete failed",
    });
  }
};