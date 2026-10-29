const axios = require("axios");

function placeholder(value) {
  return !value || /your_|changeme|example|paste_|xxx|app_password/i.test(String(value));
}

function getFromAddress() {
  return (
    String(process.env.EMAIL_FROM || process.env.SMTP_FROM || "").trim() ||
    "Intelligent Job Aggregation <onboarding@resend.dev>"
  );
}

function isResendTestFrom() {
  return /@resend\.dev\b/i.test(getFromAddress());
}

/**
 * Free Resend (onboarding@resend.dev) can only deliver to the Resend account email.
 * Route all alert mail there when RESEND_ACCOUNT_EMAIL is set.
 */
function resolveRecipient(to) {
  const account = String(process.env.RESEND_ACCOUNT_EMAIL || "").trim().toLowerCase();
  if (account && isResendTestFrom()) {
    return account;
  }
  return String(to || "").trim().toLowerCase();
}

function resolveSmtpHost(host, user) {
  const raw = String(host || "").trim();
  const account = String(user || "").toLowerCase();
  if (!raw || raw.includes("@") || /gmail\.com$/i.test(raw)) {
    if (account.endsWith("@gmail.com") || account.endsWith("@googlemail.com")) {
      return "smtp.gmail.com";
    }
  }
  return raw;
}

function getMailStatus() {
  const resendKey = String(process.env.RESEND_API_KEY || "").trim();
  if (resendKey && !placeholder(resendKey)) {
    return { configured: true, provider: "resend", delivery: "inbox" };
  }

  const brevoKey = String(process.env.BREVO_API_KEY || "").trim();
  if (brevoKey && !placeholder(brevoKey)) {
    return { configured: true, provider: "brevo", delivery: "inbox" };
  }

  const sendgridKey = String(process.env.SENDGRID_API_KEY || "").trim();
  if (sendgridKey && !placeholder(sendgridKey)) {
    return { configured: true, provider: "sendgrid", delivery: "inbox" };
  }

  const host = String(process.env.SMTP_HOST || "").trim();
  const user = String(process.env.SMTP_USER || "").trim();
  const pass = String(process.env.SMTP_PASS || "").trim();
  if (host && user && pass && !placeholder(pass)) {
    return { configured: true, provider: "smtp", delivery: "inbox" };
  }

  // Ethereal is opt-in only (never reaches real phone/Gmail)
  if (String(process.env.EMAIL_DEV_PREVIEW || "false").toLowerCase() === "true") {
    return { configured: true, provider: "ethereal", delivery: "preview" };
  }

  return {
    configured: false,
    provider: null,
    delivery: null,
    hint: "Set RESEND_API_KEY (or Gmail SMTP_PASS App Password) in backend/.env for real phone/Gmail delivery",
  };
}

async function sendViaResend({ to, subject, text, html }) {
  const key = String(process.env.RESEND_API_KEY || "").trim();
  const { data } = await axios.post(
    "https://api.resend.com/emails",
    {
      from: getFromAddress(),
      to: [to],
      subject,
      text,
      html: html || text.replace(/\n/g, "<br>"),
    },
    {
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      timeout: 20000,
    }
  );
  return { sent: true, provider: "resend", id: data?.id };
}

async function sendViaBrevo({ to, subject, text, html }) {
  const key = String(process.env.BREVO_API_KEY || "").trim();
  const from = getFromAddress();
  const match = from.match(/^(.*?)\s*<([^>]+)>$/);
  const sender = match
    ? { name: match[1].trim() || "Intelligent Job Aggregation", email: match[2].trim() }
    : { name: "Intelligent Job Aggregation", email: from };

  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender,
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html || text.replace(/\n/g, "<br>"),
    },
    {
      headers: {
        "api-key": key,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 20000,
    }
  );
  return { sent: true, provider: "brevo" };
}

async function sendViaSendGrid({ to, subject, text, html }) {
  const key = String(process.env.SENDGRID_API_KEY || "").trim();
  const from = getFromAddress();
  const match = from.match(/^(.*?)\s*<([^>]+)>$/);
  const fromEmail = match ? match[2].trim() : from;
  const fromName = match ? match[1].trim() : "Intelligent Job Aggregation";

  await axios.post(
    "https://api.sendgrid.com/v3/mail/send",
    {
      personalizations: [{ to: [{ email: to }] }],
      from: { email: fromEmail, name: fromName },
      subject,
      content: [
        { type: "text/plain", value: text },
        { type: "text/html", value: html || text.replace(/\n/g, "<br>") },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      timeout: 20000,
      validateStatus: (status) => status === 202 || status === 200,
    }
  );
  return { sent: true, provider: "sendgrid" };
}

async function sendViaSmtp({ to, subject, text, html }) {
  const user = String(process.env.SMTP_USER || "").trim();
  const pass = String(process.env.SMTP_PASS || "").trim();
  const host = resolveSmtpHost(process.env.SMTP_HOST, user);
  // eslint-disable-next-line global-require
  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: { user, pass },
  });
  await transporter.sendMail({
    from: getFromAddress() || user,
    to,
    subject,
    text,
    html: html || text.replace(/\n/g, "<br>"),
  });
  return { sent: true, provider: "smtp" };
}

async function sendViaEthereal({ to, subject, text, html }) {
  // eslint-disable-next-line global-require
  const nodemailer = require("nodemailer");
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  const info = await transporter.sendMail({
    from: `"Intelligent Job Aggregation" <${testAccount.user}>`,
    to,
    subject,
    text,
    html: html || text.replace(/\n/g, "<br>"),
  });
  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log("[mail] Ethereal preview (not real Gmail):", previewUrl);
  return {
    sent: true,
    provider: "ethereal",
    previewUrl,
    note: "Dev preview only — add RESEND_API_KEY for real inbox delivery",
  };
}

/**
 * Send via first configured provider:
 * Resend → Brevo → SendGrid → SMTP → Ethereal (dev preview).
 */
async function sendEmail({ to, subject, text, html }) {
  const status = getMailStatus();
  const recipient = resolveRecipient(to);
  if (!status.configured || !recipient) {
    return {
      sent: false,
      reason: status.hint || "Email not configured",
    };
  }

  try {
    if (status.provider === "resend") {
      return await sendViaResend({ to: recipient, subject, text, html });
    }
    if (status.provider === "brevo") {
      return await sendViaBrevo({ to: recipient, subject, text, html });
    }
    if (status.provider === "sendgrid") {
      return await sendViaSendGrid({ to: recipient, subject, text, html });
    }
    if (status.provider === "smtp") {
      return await sendViaSmtp({ to: recipient, subject, text, html });
    }
    return await sendViaEthereal({ to: recipient, subject, text, html });
  } catch (err) {
    const detail =
      err.response?.data?.message ||
      err.response?.data?.Error ||
      (typeof err.response?.data === "object"
        ? JSON.stringify(err.response.data)
        : null) ||
      err.message ||
      "Email send failed";
    console.warn("[mail]", status.provider, detail);
    return { sent: false, reason: String(detail), provider: status.provider };
  }
}

module.exports = {
  sendEmail,
  getMailStatus,
};
