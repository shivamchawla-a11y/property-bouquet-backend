const resend = require("../config/resend");

exports.sendContactEnquiry = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      interest,
      message,
    } = req.body;

    // ==========================
    // VALIDATION
    // ==========================

    if (
      !name ||
      !phone ||
      !email ||
      !interest ||
      !message
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number.",
      });
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address.",
      });
    }

    // ==========================
    // SEND EMAIL
    // ==========================

    await resend.emails.send({
      from: "Property Bouquet <contact@propertybouquet.com>",

      to: [
        "kushank.pal@amethystlandbase.com",
      ],

      reply_to: email,

      subject: `📩 New Contact Enquiry • ${name}`,

      html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
</head>

<body style="
margin:0;
padding:40px;
background:#f6f3ee;
font-family:Arial,Helvetica,sans-serif;
">

<table
width="100%"
cellpadding="0"
cellspacing="0"
style="
max-width:760px;
margin:auto;
background:#ffffff;
border-radius:18px;
overflow:hidden;
border:1px solid #e7dbc4;
">

<tr>
<td
style="
background:#041E19;
padding:40px;
text-align:center;
"
>

<h1
style="
margin:0;
font-size:32px;
color:#C89B4F;
font-weight:600;
"
>
Property Bouquet
</h1>

<p
style="
margin-top:12px;
color:#ffffff;
font-size:15px;
letter-spacing:2px;
text-transform:uppercase;
"
>
New Contact Enquiry
</p>

</td>
</tr>

<tr>

<td style="padding:40px;">

<table
width="100%"
cellpadding="16"
style="
border-collapse:collapse;
font-size:15px;
color:#333;
"
>

<tr>
<td
style="
width:180px;
font-weight:bold;
color:#555;
border-bottom:1px solid #ececec;
"
>
👤 Full Name
</td>

<td
style="border-bottom:1px solid #ececec;"
>
${name}
</td>
</tr>

<tr>

<td
style="
font-weight:bold;
color:#555;
border-bottom:1px solid #ececec;
"
>
📞 Phone
</td>

<td
style="border-bottom:1px solid #ececec;"
>
${phone}
</td>

</tr>

<tr>

<td
style="
font-weight:bold;
color:#555;
border-bottom:1px solid #ececec;
"
>
📧 Email
</td>

<td
style="border-bottom:1px solid #ececec;"
>
${email}
</td>

</tr>

<tr>

<td
style="
font-weight:bold;
color:#555;
border-bottom:1px solid #ececec;
"
>
🏡 Interested In
</td>

<td
style="border-bottom:1px solid #ececec;"
>
${interest}
</td>

</tr>

<tr>

<td
style="
font-weight:bold;
color:#555;
vertical-align:top;
"
>
💬 Message
</td>

<td>
${message.replace(/\n/g, "<br>")}
</td>

</tr>

</table>

<div
style="
margin-top:40px;
text-align:center;
"
>

<a
href="tel:${phone}"
style="
display:inline-block;
padding:14px 28px;
margin-right:10px;
background:#C89B4F;
color:#111;
text-decoration:none;
border-radius:8px;
font-weight:bold;
"
>
📞 Call Customer
</a>

<a
href="https://wa.me/91${phone}"
style="
display:inline-block;
padding:14px 28px;
margin-right:10px;
background:#25D366;
color:#fff;
text-decoration:none;
border-radius:8px;
font-weight:bold;
"
>
💬 WhatsApp
</a>

<a
href="mailto:${email}"
style="
display:inline-block;
padding:14px 28px;
background:#041E19;
color:#fff;
text-decoration:none;
border-radius:8px;
font-weight:bold;
"
>
✉ Reply Email
</a>

</div>

</td>
</tr>

<tr>

<td
style="
background:#faf7f2;
padding:25px;
text-align:center;
font-size:13px;
color:#777;
"
>

This enquiry was submitted through the
<strong>Property Bouquet Contact Page</strong>.

</td>

</tr>

</table>

</body>
</html>
`,
    });

    return res.status(200).json({
      success: true,
      message:
        "Your enquiry has been submitted successfully.",
    });
  } catch (error) {
    console.error("CONTACT ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while sending your enquiry.",
    });
  }
};