// src/controllers/usersController.js
import { pool } from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import nodemailer from "nodemailer";
import crypto from "crypto";

/* ===========================
   Helpers: Mail + OTP + Misc
   =========================== */
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

async function sendMail(to, subject, html) {
  try {
    const t = buildTransporter();
    if (!t) {
      console.log("[DEV MAIL - no SMTP config]", { to, subject });
      console.log("[DEV MAIL - body]\n", html);
      return { dev: true };
    }
    const from =
      process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@example.com";
    await t.sendMail({ from, to, subject, html });
    return { dev: false };
  } catch (err) {
    console.error("[MAIL ERROR -> DEV MODE]", err?.message || err);
    console.log("[DEV MAIL - fallback]", { to, subject });
    return { dev: true };
  }
}

function makeOtp6() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function randomPassword(len = 10) {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < len; i++)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/* ===========================
   Đăng ký (mật khẩu mạnh ở routes)
   - Tạo user is_verified=0
   - Tạo OTP 6 số, lưu hash vào email_verifications (15 phút)
   - Gửi email OTP
   =========================== */
export async function registerUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(
      "[registerUser] validation errors:",
      errors.array(),
      "body:",
      req.body
    );
    return res.status(400).json({
      ok: false,
      errors: errors.array(),
      message: errors.array()[0]?.msg || "Dữ liệu không hợp lệ",
    });
  }

  const { name, email, password } = req.body;
  try {
    const [dup] = await pool.query("SELECT id FROM users WHERE email=?", [
      email,
    ]);
    if (dup.length)
      return res.status(409).json({ ok: false, message: "Email đã tồn tại" });

    const hash = await bcrypt.hash(password, 10);
    const [ins] = await pool.query(
      "INSERT INTO users (name, email, password_hash, role, is_locked, is_verified) VALUES (?,?,?,?,0,0)",
      [name, email, hash, "USER"]
    );
    const userId = ins.insertId;

    // OTP verify đăng ký
    const otp = makeOtp6();
    const otpHash = await bcrypt.hash(otp, 10);
    await pool.query(
      "INSERT INTO email_verifications (user_id, otp_hash, expires_at, used) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE), 0)",
      [userId, otpHash]
    );

    const html = `
      <p>Xin chào ${name},</p>
      <p>Mã OTP xác minh đăng ký của bạn là: <b>${otp}</b></p>
      <p>OTP có hiệu lực trong <b>15 phút</b>. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
    `;
    const sent = await sendMail(email, "Xác minh đăng ký tài khoản", html);

    // DEV mode có thể không gửi được mail → vẫn trả ok và để người test có thể xem console
    return res.status(201).json({
      ok: true,
      message: sent.dev
        ? "Đăng ký thành công (DEV). OTP đã in ra console server."
        : "Đăng ký thành công. Vui lòng kiểm tra email để nhập OTP xác minh.",
    });
  } catch (e) {
    console.error("registerUser error:", e?.code || e?.message);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

/* ===========================
   Xác minh OTP đăng ký
   body: { email, otp }
   =========================== */
export async function verifyRegisterOtp(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ ok: false, errors: errors.array() });

  const { email, otp } = req.body;
  try {
    const [u] = await pool.query(
      "SELECT id, is_verified, name FROM users WHERE email=?",
      [email]
    );
    if (!u.length)
      return res
        .status(400)
        .json({ ok: false, message: "Email không tồn tại." });
    if (u[0].is_verified)
      return res.json({ ok: true, message: "Tài khoản đã xác minh." });

    const userId = u[0].id;
    const [ev] = await pool.query(
      "SELECT id, otp_hash, expires_at, used FROM email_verifications WHERE user_id=? ORDER BY id DESC LIMIT 1",
      [userId]
    );
    if (!ev.length)
      return res.status(400).json({ ok: false, message: "OTP không hợp lệ." });

    const row = ev[0];
    const [[{ valid }]] = await pool.query("SELECT NOW() < ? AS valid", [
      row.expires_at,
    ]);
    if (!valid || row.used)
      return res
        .status(400)
        .json({ ok: false, message: "OTP đã hết hạn hoặc đã dùng." });

    const ok = await bcrypt.compare(otp, row.otp_hash);
    if (!ok)
      return res.status(400).json({ ok: false, message: "OTP không đúng." });

    await pool.query("UPDATE users SET is_verified=1 WHERE id=?", [userId]);
    await pool.query("UPDATE email_verifications SET used=1 WHERE id=?", [
      row.id,
    ]);

    return res.json({
      ok: true,
      message: "Xác minh thành công. Bạn có thể đăng nhập.",
    });
  } catch (e) {
    console.error("verifyRegisterOtp error:", e?.message || e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

/* ===========================
   Gửi lại OTP đăng ký
   body: { email }
   =========================== */
export async function resendRegisterOtp(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ ok: false, errors: errors.array() });

  const { email } = req.body;
  try {
    const [u] = await pool.query(
      "SELECT id, is_verified, name FROM users WHERE email=?",
      [email]
    );
    if (!u.length) return res.json({ ok: true }); // tránh lộ
    if (u[0].is_verified) return res.json({ ok: true });

    const userId = u[0].id;
    const otp = makeOtp6();
    const otpHash = await bcrypt.hash(otp, 10);
    await pool.query(
      "INSERT INTO email_verifications (user_id, otp_hash, expires_at, used) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE), 0)",
      [userId, otpHash]
    );

    const html = `
      <p>Xin chào ${u[0].name},</p>
      <p>OTP mới của bạn là: <b>${otp}</b> (hết hạn trong 15 phút).</p>
    `;
    await sendMail(email, "Mã OTP xác minh mới", html);
    return res.json({ ok: true, message: "Đã gửi lại OTP." });
  } catch (e) {
    console.error("resendRegisterOtp error:", e?.message || e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

/* ===========================
   Đăng nhập
   - Chặn nếu is_locked
   - Chặn nếu chưa is_verified
   - Cấp access token + refresh token
   =========================== */
export async function loginUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.array() });
  }

  const { email, password } = req.body;
  try {
    const [rows] = await pool.query(
      "SELECT id, password_hash, role, name, email, is_locked, is_verified FROM users WHERE email=?",
      [email]
    );
    if (!rows.length) {
      return res
        .status(401)
        .json({ ok: false, message: "Email không tồn tại" });
    }

    const u = rows[0];

    if (u.is_locked) {
      return res
        .status(403)
        .json({ ok: false, message: "Tài khoản đã bị khoá" });
    }

    if (!u.is_verified) {
      return res.status(403).json({
        ok: false,
        message: "Tài khoản chưa xác minh email. Vui lòng nhập OTP xác minh.",
        need_verify: true,
      });
    }

    if (!u.password_hash) {
      return res.status(500).json({
        ok: false,
        message:
          "Tài khoản chưa có password_hash. Vui lòng reset mật khẩu hoặc đăng ký lại.",
      });
    }

    const match = await bcrypt.compare(password, u.password_hash);
    if (!match) {
      return res.status(401).json({ ok: false, message: "Sai mật khẩu" });
    }

    const token = jwt.sign({ id: u.id, role: u.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES || "2h",
    });

    const refreshToken = crypto.randomBytes(32).toString("hex");
    await pool.query("UPDATE user_tokens SET revoked=1 WHERE user_id=?", [
      u.id,
    ]);
    await pool.query(
      "INSERT INTO user_tokens (user_id, refresh_token, revoked) VALUES (?,?,0)",
      [u.id, refreshToken]
    );

    return res.json({
      ok: true,
      token,
      refresh_token: refreshToken,
      user: { id: u.id, name: u.name, email: u.email, role: u.role },
    });
  } catch (e) {
    console.error("loginUser error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

/* ===========================
   Me / Update
   =========================== */
export async function getMe(req, res) {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id=?",
      [req.user.id]
    );
    return res.json({ ok: true, data: rows[0] || null });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateMe(req, res) {
  const { name, phone } = req.body;
  try {
    await pool.query("UPDATE users SET name = COALESCE(?, name) WHERE id=?", [
      name ?? null,
      req.user.id,
    ]);
    return res.json({ ok: true, message: "Cập nhật thành công" });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

/* ===========================
   Quên mật khẩu (OTP) → Gửi OTP
   =========================== */
export async function forgotPassword(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ ok: false, errors: errors.array() });

  const { email } = req.body;
  try {
    const [rows] = await pool.query(
      "SELECT id, email, name FROM users WHERE email=?",
      [email]
    );
    const genericMsg =
      "Nếu email tồn tại, mã OTP đã được gửi. Vui lòng kiểm tra hộp thư (có thể Spam/Promotions).";
    if (!rows.length) return res.json({ ok: true, message: genericMsg });

    const user = rows[0];
    const otp = makeOtp6();
    const otpHash = await bcrypt.hash(otp, 10);

    await pool.query(
      "INSERT INTO password_resets (user_id, otp_hash, expires_at, used) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), 0)",
      [user.id, otpHash]
    );

    const html = `
      <p>Xin chào ${user.name || ""},</p>
      <p>Mã OTP đặt lại mật khẩu của bạn là: <b>${otp}</b></p>
      <p>OTP có hiệu lực trong 10 phút.</p>
      <p>Nếu bạn không yêu cầu, có thể bỏ qua email này.</p>
    `;
    const sent = await sendMail(user.email, "OTP đặt lại mật khẩu", html);

    if (sent.dev) {
      // DEV mode: trả về otp cho tiện test
      return res.json({ ok: true, message: genericMsg, dev_otp: otp });
    }
    return res.json({ ok: true, message: genericMsg });
  } catch (e) {
    console.error(
      "forgotPassword error:",
      e?.code,
      e?.sqlMessage || e?.message
    );
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

/* ===========================
   Reset mật khẩu bằng OTP
   - Kiểm tra OTP còn hạn & chưa dùng
   - Tạo mật khẩu mới ngẫu nhiên, cập nhật DB
   - Thu hồi refresh tokens cũ
   - Gửi mật khẩu mới qua email (hoặc dev trả về)
   =========================== */
export async function resetPassword(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ ok: false, errors: errors.array() });

  const { email, otp } = req.body;
  try {
    const [usersRows] = await pool.query(
      "SELECT id, email, name FROM users WHERE email=?",
      [email]
    );
    if (!usersRows.length) {
      return res
        .status(400)
        .json({ ok: false, message: "OTP không hợp lệ hoặc đã hết hạn." });
    }
    const user = usersRows[0];

    const [otpRows] = await pool.query(
      `SELECT id, otp_hash, expires_at, used
       FROM password_resets
       WHERE user_id=? AND used=0
       ORDER BY id DESC
       LIMIT 1`,
      [user.id]
    );
    if (!otpRows.length) {
      return res
        .status(400)
        .json({ ok: false, message: "OTP không hợp lệ hoặc đã hết hạn." });
    }

    const lastOtp = otpRows[0];
    const [[{ valid }]] = await pool.query("SELECT NOW() < ? AS valid", [
      lastOtp.expires_at,
    ]);
    if (!valid)
      return res.status(400).json({ ok: false, message: "OTP đã hết hạn." });

    const ok = await bcrypt.compare(otp, lastOtp.otp_hash);
    if (!ok)
      return res.status(400).json({ ok: false, message: "OTP không đúng." });

    const newPasswordPlain = randomPassword(10);
    const newHash = await bcrypt.hash(newPasswordPlain, 10);

    await pool.query("UPDATE users SET password_hash=? WHERE id=?", [
      newHash,
      user.id,
    ]);
    await pool.query("UPDATE password_resets SET used=1 WHERE id=?", [
      lastOtp.id,
    ]);
    await pool.query("UPDATE user_tokens SET revoked=1 WHERE user_id=?", [
      user.id,
    ]);

    const html = `
      <p>Xin chào ${user.name || ""},</p>
      <p>Mật khẩu mới của bạn là: <b>${newPasswordPlain}</b></p>
      <p>Vui lòng đăng nhập và đổi mật khẩu ngay sau khi vào hệ thống (trang Hồ sơ).</p>
    `;
    const sent = await sendMail(user.email, "Mật khẩu mới của bạn", html);

    if (sent.dev) {
      return res.json({
        ok: true,
        message:
          "Đặt lại mật khẩu thành công (DEV). Mật khẩu mới trả về trong phản hồi.",
        dev_new_password: newPasswordPlain,
      });
    }
    return res.json({
      ok: true,
      message: "Đặt lại mật khẩu thành công. Vui lòng kiểm tra email.",
    });
  } catch (e) {
    console.error("resetPassword error:", e?.code, e?.sqlMessage || e?.message);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
