import { pool } from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function registerUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ ok: false, errors: errors.array() });

  const { name, email, password } = req.body;
  try {
    const [dup] = await pool.query("SELECT id FROM users WHERE email=?", [
      email,
    ]);
    if (dup.length)
      return res.status(409).json({ ok: false, message: "Email đã tồn tại" });

    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)",
      [name, email, hashed, "USER"]
    );
    return res.status(201).json({ ok: true, message: "Đăng ký thành công" });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function loginUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.array() });
  }

  const { email, password } = req.body;
  try {
    const [rows] = await pool.query(
      "SELECT id, password_hash, role, name, email, is_locked FROM users WHERE email=?",
      [email]
    );
    if (!rows.length) {
      return res
        .status(401)
        .json({ ok: false, message: "Email không tồn tại" });
    }

    const u = rows[0];

    // Không cho login nếu bị khoá
    if (u.is_locked) {
      return res
        .status(403)
        .json({ ok: false, message: "Tài khoản đã bị khoá" });
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

    // Access token (ngắn hạn)
    const token = jwt.sign({ id: u.id, role: u.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES || "2h",
    });

    // Refresh token (dài hạn) -> lưu DB
    const refreshToken = crypto.randomBytes(32).toString("hex");

    // (khuyến nghị) thu hồi token cũ của user để tránh phình bảng
    await pool.query("UPDATE user_tokens SET revoked=1 WHERE user_id=?", [
      u.id,
    ]);

    await pool.query(
      "INSERT INTO user_tokens (user_id, refresh_token, revoked) VALUES (?,?,0)",
      [u.id, refreshToken]
    );

    return res.json({
      ok: true,
      token, // access token
      refresh_token: refreshToken,
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
      },
    });
  } catch (e) {
    console.error("loginUser error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getMe(req, res) {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id=?",
      [req.user.id]
    );
    return res.json({ ok: true, data: rows[0] || null });
  } catch {
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
  } catch {
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

/** =======================
 *  Mailer helper (SMTP)
 *  ======================= */
async function getTransporter() {
  // Cần các biến môi trường:
  // SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM (tuỳ chọn)
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    return null; // chưa cấu hình SMTP -> fallback dev mode
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendEmailOrDevLog(to, subject, text) {
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      console.log("[DEV MAIL - no SMTP config]", { to, subject, text });
      return { dev: true };
    }
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    await transporter.sendMail({ from, to, subject, text });
    return { dev: false };
  } catch (err) {
    // Fallback DEV nếu SMTP lỗi
    console.error("[MAIL ERROR -> DEV MODE]", err?.message || err);
    console.log("[DEV MAIL - fallback]", { to, subject, text });
    return { dev: true };
  }
}

/** =======================
 *  Forgot Password (OTP)
 *  ======================= */
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

    // Trả về message giống nhau để tránh lộ thông tin user tồn tại hay không
    const genericMsg =
      "Nếu email tồn tại, mã OTP đã được gửi. Vui lòng kiểm tra hộp thư (có thể nằm trong Spam/Promotion).";

    if (!rows.length) {
      return res.json({ ok: true, message: genericMsg });
    }

    const user = rows[0];

    // Tạo OTP 6 số và băm lưu DB
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const otpHash = await bcrypt.hash(otp, 10);

    // Lưu vào password_resets với hạn 10 phút
    await pool.query(
      "INSERT INTO password_resets (user_id, otp_hash, expires_at, used) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), 0)",
      [user.id, otpHash]
    );

    const mailText =
      `Xin chào ${user.name || ""}\n\n` +
      `Mã OTP đặt lại mật khẩu của bạn là: ${otp}\n` +
      `OTP có hiệu lực trong 10 phút.\n\n` +
      `Nếu không yêu cầu thao tác này, bạn có thể bỏ qua email.`;

    const sent = await sendEmailOrDevLog(
      user.email,
      "OTP đặt lại mật khẩu",
      mailText
    );

    // Nếu chưa cấu hình SMTP, trả dev_otp để bạn test nhanh
    if (sent.dev) {
      return res.json({
        ok: true,
        message: genericMsg,
        dev_otp: otp, // ❗ chỉ xuất hiện ở môi trường DEV khi chưa cấu hình SMTP
      });
    }

    return res.json({ ok: true, message: genericMsg });
  } catch (e) {
    console.error("forgotPassword error:", e.code, e.sqlMessage || e.message);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

/** ===================================
 *  Reset Password bằng email + OTP
 *  - Xác thực OTP (còn hạn, chưa dùng)
 *  - Tạo mật khẩu mới ngẫu nhiên
 *  - Cập nhật users.password_hash
 *  - Thu hồi refresh tokens cũ
 *  - Gửi mật khẩu mới cho người dùng
 *  =================================== */
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
      // Tránh lộ thông tin email
      return res
        .status(400)
        .json({ ok: false, message: "OTP không hợp lệ hoặc đã hết hạn." });
    }
    const user = usersRows[0];

    // Lấy OTP mới nhất, chưa dùng và còn hạn
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

    // Kiểm tra hạn
    const [timeCheck] = await pool.query("SELECT NOW() < ? AS valid", [
      lastOtp.expires_at,
    ]);
    if (!timeCheck?.[0]?.valid) {
      return res.status(400).json({ ok: false, message: "OTP đã hết hạn." });
    }

    // So sánh OTP
    const okOtp = await bcrypt.compare(otp, lastOtp.otp_hash);
    if (!okOtp) {
      return res.status(400).json({ ok: false, message: "OTP không đúng." });
    }

    // Tạo mật khẩu mới (10 ký tự a-zA-Z0-9)
    function randomPassword(len = 10) {
      const chars =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let out = "";
      for (let i = 0; i < len; i++)
        out += chars[Math.floor(Math.random() * chars.length)];
      return out;
    }
    const newPasswordPlain = randomPassword(10);
    const newHash = await bcrypt.hash(newPasswordPlain, 10);

    // Cập nhật password
    await pool.query("UPDATE users SET password_hash=? WHERE id=?", [
      newHash,
      user.id,
    ]);

    // Đánh dấu OTP đã dùng
    await pool.query("UPDATE password_resets SET used=1 WHERE id=?", [
      lastOtp.id,
    ]);

    // Thu hồi tokens cũ
    await pool.query("UPDATE user_tokens SET revoked=1 WHERE user_id=?", [
      user.id,
    ]);

    // Gửi mật khẩu mới cho user
    const mailText =
      `Xin chào ${user.name || ""}\n\n` +
      `Mật khẩu mới của bạn là: ${newPasswordPlain}\n` +
      `Vui lòng đăng nhập và đổi mật khẩu ngay sau khi vào hệ thống (trang Hồ sơ).\n\n` +
      `Nếu bạn không thực hiện yêu cầu này, hãy liên hệ hỗ trợ ngay.`;

    const sent = await sendEmailOrDevLog(
      user.email,
      "Mật khẩu mới của bạn",
      mailText
    );

    // Nếu chưa cấu hình SMTP, trả dev_password để test
    if (sent.dev) {
      return res.json({
        ok: true,
        message:
          "Đặt lại mật khẩu thành công. (DEV) Xem mật khẩu mới trong phản hồi.",
        dev_new_password: newPasswordPlain, // ❗ chỉ ở DEV khi chưa cấu hình SMTP
      });
    }

    return res.json({
      ok: true,
      message:
        "Đặt lại mật khẩu thành công. Vui lòng kiểm tra email để nhận mật khẩu mới.",
    });
  } catch (e) {
    console.error("resetPassword error:", e.code, e.sqlMessage || e.message);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
