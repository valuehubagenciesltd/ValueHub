const nodemailer = require("nodemailer");

const APP_NAME = "Valuehub";
const BASE_COLOR = "#059669"; 
const SITE_URL = "https://valuehub.dev";
const PRIVACY_URL = "https://valuehub.dev/#/privacy";
const TERMS_URL = "https://valuehub.dev/#/terms";
const CURRENT_YEAR = 2026;

function maskEmail(email) {
  if (!email || typeof email !== "string" || !email.includes("@")) return "***@***";
  const s = email.trim().toLowerCase();
  const at = s.indexOf("@");
  const local = s.slice(0, at);
  const domain = s.slice(at);
  const show = local.length <= 4 ? local.slice(0, 1) : local.slice(0, 5);
  return `${show}****${domain}`;
}

function getHeaderHtml() {
  return `
    <div style="background:${BASE_COLOR};color:#fff;padding:20px 24px;font-family:sans-serif;">
      <div style="font-size:22px;font-weight:700;letter-spacing:-0.02em;">${APP_NAME}</div>
    </div>
  `;
}

function getHeaderText() {
  return `\n${APP_NAME}\n${"─".repeat(APP_NAME.length)}\n\n`;
}

function getFooterHtml(recipientEmail) {
  const masked = maskEmail(recipientEmail);
  return `
    <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;font-family:sans-serif;line-height:1.6;">
      <p>This email was sent to ${masked}.</p>
      <p>You are receiving this email because you are a registered member of <a href="${SITE_URL}" style="color:${BASE_COLOR};">${SITE_URL}</a>.</p>
      <p>Read our <a href="${PRIVACY_URL}" style="color:${BASE_COLOR};">Privacy Policy</a> and <a href="${TERMS_URL}" style="color:${BASE_COLOR};">Terms of Use</a> if you have any questions.</p>
      <p>© Valuehub Agencies Ltd. ${CURRENT_YEAR}</p>
    </div>
  `;
}

function getFooterText(recipientEmail) {
  const masked = maskEmail(recipientEmail);
  return `

This email was sent to ${masked}.
You are receiving this email because you are a registered member of ${SITE_URL}.
Read our Privacy Policy (${PRIVACY_URL}) and Terms of Use (${TERMS_URL}) if you have any questions.
© Valuehub Agencies Ltd. ${CURRENT_YEAR}
`;
}

const ACTIVITY_TEMPLATES = {
  account_created: (data) => ({
    subject: `Welcome to ${APP_NAME} – Your account is ready`,
    text: `Hi${data.username ? ` ${data.username}` : ""},\n\nYour ${APP_NAME} account has been created successfully. You can now sign in and start using the platform.\n\nThank you for joining us.\n\n— The ${APP_NAME} Team`,
    html: `
      <p>Hi${data.username ? ` ${data.username}` : ""},</p>
      <p>Your ${APP_NAME} account has been created successfully. You can now sign in and start using the platform.</p>
      <p>Thank you for joining us.</p>
      <p>— The ${APP_NAME} Team</p>
    `,
  }),
  phone_changed: (data) => ({
    subject: `Your ${APP_NAME} phone number was updated`,
    text: `Hi,\n\nYour account phone number has been updated to ${data.phoneNumber || "the new number you provided"}.\n\nIf you did not make this change, please contact support immediately.\n\n— The ${APP_NAME} Team`,
    html: `
      <p>Hi,</p>
      <p>Your account phone number has been updated to <strong>${data.phoneNumber || "the new number you provided"}</strong>.</p>
      <p>If you did not make this change, please contact support immediately.</p>
      <p>— The ${APP_NAME} Team</p>
    `,
  }),
  password_changed: () => ({
    subject: `Your ${APP_NAME} password was changed`,
    text: `Hi,\n\nYour account password was changed successfully. If you did not make this change, please contact support immediately and secure your account.\n\n— The ${APP_NAME} Team`,
    html: `
      <p>Hi,</p>
      <p>Your account password was changed successfully.</p>
      <p>If you did not make this change, please contact support immediately and secure your account.</p>
      <p>— The ${APP_NAME} Team</p>
    `,
  }),
  support_submitted: (data) => ({
    subject: `We received your support request – ${APP_NAME}`,
    text: `Hi,\n\nWe have received your support ticket${data.category ? ` (${data.category})` : ""}. Our team will get back to you as soon as possible.\n\nThank you for contacting ${APP_NAME} support.\n\n— The ${APP_NAME} Team`,
    html: `
      <p>Hi,</p>
      <p>We have received your support ticket${data.category ? ` (<strong>${data.category}</strong>)` : ""}. Our team will get back to you as soon as possible.</p>
      <p>Thank you for contacting ${APP_NAME} support.</p>
      <p>— The ${APP_NAME} Team</p>
    `,
  }),
  password_reset_code: (data) => {
    const code = data.code || "------";
    return {
      subject: `Your ${APP_NAME} password reset code`,
      text: `Hi,\n\nYour password reset code is: ${code}\n\nThis code expires in 10 minutes. If you did not request a password reset, please ignore this email and secure your account.\n\n— The ${APP_NAME} Team`,
      html: `
      <p>Hi,</p>
      <p>Your password reset code is: <strong style="font-size:24px;letter-spacing:4px;">${code}</strong></p>
      <p>This code expires in 10 minutes. If you did not request a password reset, please ignore this email and secure your account.</p>
      <p>— The ${APP_NAME} Team</p>
    `,
    };
  },
};

const VALID_TYPES = Object.keys(ACTIVITY_TEMPLATES);

function getTransporter(config) {
  const mail = config?.mail || {};
  const user = mail.user || mail.email;
  const pass = mail.pass || mail.password;
  const host = mail.host || "smtp.gmail.com";
  const port = mail.port != null ? Number(mail.port) : 587;
  const secure = mail.secure === true;

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

async function sendActivityNotification(email, type, data, config) {
  if (!email || typeof email !== "string" || !email.includes("@")) {
    throw new Error("Valid email is required");
  }
  if (!VALID_TYPES.includes(type)) {
    throw new Error(`Invalid notification type. Must be one of: ${VALID_TYPES.join(", ")}`);
  }

  const transporter = getTransporter(config);
  if (!transporter) {
    return { sent: false, reason: "Email not configured" };
  }

  const template = ACTIVITY_TEMPLATES[type](data || {});
  const mail = config?.mail || {};
  const from = mail.from || mail.user || "noreply@valuehub.com";
  const toEmail = email.trim().toLowerCase();

  const html = [
    getHeaderHtml(),
    '<div style="padding:24px;font-family:sans-serif;color:#111;line-height:1.6;">',
    template.html,
    "</div>",
    getFooterHtml(toEmail),
  ].join("");

  const text = getHeaderText() + template.text + getFooterText(toEmail);

  await transporter.sendMail({
    from: `"${APP_NAME}" <${from}>`,
    to: toEmail,
    subject: template.subject,
    text,
    html,
  });

  return { sent: true };
}

/**
 * Send password reset code email (used by Cloud Function, no auth required).
 */
async function sendPasswordResetCodeEmail(email, code, config) {
  if (!email || typeof email !== "string" || !email.includes("@")) {
    throw new Error("Valid email is required");
  }
  if (!code || String(code).length !== 6) {
    throw new Error("Code must be a 6-digit string");
  }

  const transporter = getTransporter(config);
  if (!transporter) {
    return { sent: false, reason: "Email not configured" };
  }

  const template = ACTIVITY_TEMPLATES.password_reset_code({ code: String(code) });
  const mail = config?.mail || {};
  const from = mail.from || mail.user || "noreply@valuehub.com";
  const toEmail = email.trim().toLowerCase();

  const html = [
    getHeaderHtml(),
    '<div style="padding:24px;font-family:sans-serif;color:#111;line-height:1.6;">',
    template.html,
    "</div>",
    getFooterHtml(toEmail),
  ].join("");

  const text = getHeaderText() + template.text + getFooterText(toEmail);

  await transporter.sendMail({
    from: `"${APP_NAME}" <${from}>`,
    to: toEmail,
    subject: template.subject,
    text,
    html,
  });

  return { sent: true };
}

module.exports = { sendActivityNotification, sendPasswordResetCodeEmail, VALID_TYPES };
