const NewsletterSubscriber = require("../models/NewsLetterSubscriber");
const { Resend } = require("resend");

const resend = new Resend(
  process.env.RESEND_API_KEY
);

/* =========================================================
   SUBSCRIBE TO NEWSLETTER
========================================================= */

exports.subscribeNewsletter = async (req, res) => {
  try {
    const { email, source } = req.body;

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

    const cleanEmail = email
      .trim()
      .toLowerCase();

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
      source?.trim() ||
      "Website Footer";

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

      existing.status = "Subscribed";
      existing.source = cleanSource;
      existing.subscribedAt = new Date();

      await existing.save();

      /* =====================================================
         EMAIL NOTIFICATION FOR RE-SUBSCRIPTION
      ===================================================== */

      try {
        await resend.emails.send({
          from:
            "Property Bouquet <info@propertybouquet.com>",

          to:
            "kushank.pal@amethystlandbase.com",

          subject:
            `📩 Newsletter Re-Subscription • ${cleanEmail}`,

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

<!-- HEADER -->

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


<!-- CONTENT -->

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
📩 Newsletter Re-Subscription
</h2>

<p
style="
margin:12px 0 0;
color:#666666;
font-size:14px;
line-height:24px;
"
>
A visitor has subscribed again to Property Bouquet's
real estate updates and newsletter.
</p>


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
<strong>Submitted</strong>
</td>

<td style="color:#111;">
${new Date().toLocaleString("en-IN")}
</td>

</tr>

</table>


<div
style="
margin-top:35px;
text-align:center;
"
>

<a
href="mailto:${cleanEmail}"
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


<!-- FOOTER -->

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
          "Newsletter email sending failed:",
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

        status: "Subscribed",

        subscribedAt: new Date(),
      });

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
          `📩 New Newsletter Subscriber • ${cleanEmail}`,

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

<!-- HEADER -->

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


<!-- CONTENT -->

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
📩 New Newsletter Subscriber
</h2>

<p
style="
margin:12px 0 0;
color:#666666;
font-size:14px;
line-height:24px;
"
>
A new visitor has subscribed to Property Bouquet's
real estate updates and newsletter.
</p>


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
<strong>Submitted</strong>
</td>

<td style="color:#111;">
${new Date().toLocaleString("en-IN")}
</td>

</tr>

</table>


<div
style="
margin-top:35px;
text-align:center;
"
>

<a
href="mailto:${cleanEmail}"
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


<!-- FOOTER -->

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
        "Newsletter email sending failed:",
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