import nodemailer from "nodemailer";

function buildTransporter() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

export async function sendMail(to, subject, html) {
  try {
    const transporter = buildTransporter();
    if (!transporter) {
      console.log("[DEV MAIL]", { to, subject });
      if (html) console.log("[DEV MAIL - body]\n", html);
      return { dev: true };
    }

    const from =
      process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@example.com";
    await transporter.sendMail({ from, to, subject, html });
    return { dev: false };
  } catch (error) {
    console.error("[MAIL ERROR]", error?.message || error);
    return { dev: true, error };
  }
}

export { buildTransporter };
