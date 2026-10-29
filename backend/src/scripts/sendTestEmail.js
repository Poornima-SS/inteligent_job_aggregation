require("dotenv").config();
const { sendEmail, getMailStatus } = require("../services/mail");

async function main() {
  const to =
    process.argv[2] ||
    process.env.RESEND_ACCOUNT_EMAIL ||
    process.env.SMTP_USER ||
    "poornimass999@gmail.com";

  console.log("Mail status:", getMailStatus());
  console.log("Sending test to:", to);

  const result = await sendEmail({
    to,
    subject: "[Job alert] Test from Intelligent Job Aggregation",
    text:
      "Success! Your job-alert email pipeline works. Check Gmail on your phone.\n\nOpen alerts: http://localhost:5173/alerts",
    html:
      "<div style=\"font-family:Segoe UI,Arial,sans-serif;line-height:1.5\">" +
      "<h2>New job matches</h2>" +
      "<p>Success — your Intelligent Job Aggregation email is working.</p>" +
      "<p>Open this on your phone Gmail.</p>" +
      "<p><a href=\"http://localhost:5173/alerts\">Open alerts</a></p>" +
      "</div>",
  });

  console.log(JSON.stringify(result, null, 2));
  if (!result.sent) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
