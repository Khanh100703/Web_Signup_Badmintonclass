// src/controllers/contactsController.js
import { validationResult } from "express-validator";
import { pool } from "../db.js";
import nodemailer from "nodemailer";

function transporter() {
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
async function sendMail(to, subject, html) {
  const t = transporter();
  if (!t) {
    console.log("[DEV] Mail disabled. Would send to:", to, subject);
    return;
  }
  await t.sendMail({
    from: process.env.SMTP_FROM || "no-reply@example.com",
    to,
    subject,
    html,
  });
}

// POST /api/contacts  (public)
export async function submitContact(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ ok: false, errors: errors.array() });

  const { name, email, subject = "", message } = req.body;
  try {
    const [r] = await pool.query(
      "INSERT INTO contacts(name, email, subject, message) VALUES(?,?,?,?)",
      [name, email, subject, message]
    );

    // Thông báo về hòm thư admin (tuỳ chọn)
    if (process.env.CONTACT_TO) {
      await sendMail(
        process.env.CONTACT_TO,
        `[Contact] ${subject || "(No subject)"}`,
        `<p><b>From:</b> ${name} &lt;${email}&gt;</p>
         <p><b>Subject:</b> ${subject || "(No subject)"} </p>
         <p><b>Message:</b></p><pre>${message}</pre>`
      );
    }

    return res.json({ ok: true, id: r.insertId });
  } catch (e) {
    console.error("submitContact error:", e.message);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// GET /api/contacts  (admin)
export async function listContacts(req, res) {
  // TODO: requireRole('ADMIN') nếu bạn có middleware role
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, subject, message, status, created_at, handled_by FROM contacts ORDER BY id DESC"
    );
    return res.json({ ok: true, data: rows });
  } catch (e) {
    console.error("listContacts error:", e.message);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// PATCH /api/contacts/:id/status  (admin)
export async function updateContactStatus(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ ok: false, errors: errors.array() });

  const id = Number(req.params.id);
  const { status } = req.body; // NEW|SEEN|DONE
  try {
    await pool.query("UPDATE contacts SET status=? WHERE id=?", [status, id]);
    return res.json({ ok: true });
  } catch (e) {
    console.error("updateContactStatus error:", e.message);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
