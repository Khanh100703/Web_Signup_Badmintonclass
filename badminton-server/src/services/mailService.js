import nodemailer from "nodemailer";

let transporterPromise = null;

async function createTransporter() {
  if (!process.env.SMTP_HOST) {
    console.warn(
      "[mail] SMTP_HOST chưa được cấu hình, email sẽ được ghi log thay vì gửi thực."
    );
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true" || false,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });

  try {
    await transporter.verify();
    console.info("[mail] Đã kết nối máy chủ SMTP thành công.");
    return transporter;
  } catch (err) {
    console.error("[mail] Không thể xác thực SMTP:", err?.message || err);
    return null;
  }
}

async function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = createTransporter();
  }
  return transporterPromise;
}

export async function sendMail({ to, subject, text, html }) {
  const transporter = await getTransporter();
  if (!transporter) {
    console.info("[mail:mock]", { to, subject, text });
    return { mocked: true };
  }
  await transporter.sendMail({
    from:
      process.env.SMTP_FROM ||
      `Badminton Academy <${process.env.SMTP_USER || "no-reply@example.com"}>`,
    to,
    subject,
    text,
    html,
  });
  return { mocked: false };
}
